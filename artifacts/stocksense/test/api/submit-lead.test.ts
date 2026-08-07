import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";
import handler from "../../api/submit-lead";

function makeReq(body: unknown) {
  const emitter = new EventEmitter();
  const req = emitter as unknown as IncomingMessage;
  (req as unknown as { method: string }).method = "POST";
  const json = JSON.stringify(body);
  return {
    req,
    send: () => {
      emitter.emit("data", Buffer.from(json));
      emitter.emit("end");
    },
  };
}

function makeRes() {
  let statusCode = 200;
  let body: string | undefined;
  const res = {
    setHeader: () => {},
    end: (chunk?: string) => { body = chunk; },
  } as unknown as ServerResponse;
  Object.defineProperty(res, "statusCode", {
    get: () => statusCode,
    set: (v: number) => { statusCode = v; },
  });
  return { res, status: () => statusCode, json: () => (body ? JSON.parse(body) : undefined) };
}

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/FAKE/exec";

describe("api/submit-lead", () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.APPS_SCRIPT_URL;

  beforeEach(() => {
    process.env.APPS_SCRIPT_URL = APPS_SCRIPT_URL;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.APPS_SCRIPT_URL = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns success on a direct (non-redirected) valid response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    ) as unknown as typeof fetch;

    const { req, send } = makeReq({ fullName: "Test" });
    const { res, status, json } = makeRes();
    const pending = handler(req, res);
    send();
    await pending;

    expect(status()).toBe(200);
    expect(json()).toEqual({ success: true });
  });

  it("follows the Apps Script redirect with GET (not POST) and succeeds", async () => {
    const location = "https://script.googleusercontent.com/macros/echo?user_content_key=abc";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: location } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { req, send } = makeReq({ fullName: "Test" });
    const { res, status, json } = makeRes();
    const pending = handler(req, res);
    send();
    await pending;

    expect(status()).toBe(200);
    expect(json()).toEqual({ success: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, hop1Init] = fetchMock.mock.calls[0];
    const [hop2Url, hop2Init] = fetchMock.mock.calls[1];
    // Regression guard: the redirect target only accepts GET/HEAD — a re-POST
    // returns 405 with an HTML body, which is the bug this fix corrects.
    expect(hop1Init.method).toBe("POST");
    expect(hop2Url).toBe(location);
    expect(hop2Init.method).toBe("GET");
    expect(hop2Init.body).toBeUndefined();
  });

  it("returns invalid_response when the upstream body is not JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("<html>not json</html>", { status: 200 })
    ) as unknown as typeof fetch;

    const { req, send } = makeReq({ fullName: "Test" });
    const { res, status, json } = makeRes();
    const pending = handler(req, res);
    send();
    await pending;

    expect(status()).toBe(502);
    expect(json()).toEqual({ success: false, error: "invalid_response" });
  });

  it("returns a 504 timeout when the upstream request aborts", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    }) as unknown as typeof fetch;

    const { req, send } = makeReq({ fullName: "Test" });
    const { res, status, json } = makeRes();
    const pending = handler(req, res);
    send();
    await pending;

    expect(status()).toBe(504);
    expect(json()).toEqual({ success: false, error: "timeout" });
  });

  it("returns a 502 network_error on a generic backend failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch;

    const { req, send } = makeReq({ fullName: "Test" });
    const { res, status, json } = makeRes();
    const pending = handler(req, res);
    send();
    await pending;

    expect(status()).toBe(502);
    // Note: postToAppsScript() captures err.message in `detail` internally,
    // but the handler only ever forwards `error: result.reason` to the
    // client — `detail` is server-side-only diagnostic info.
    expect(json()).toEqual({ success: false, error: "network_error" });
  });
});
