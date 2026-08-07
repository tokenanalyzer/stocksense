import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";
import handler from "../../api/admin-leads";

function makeReq(opts: { headers?: Record<string, string>; body?: unknown }) {
  const emitter = new EventEmitter();
  const req = emitter as unknown as IncomingMessage;
  (req as unknown as { method: string }).method = "POST";
  (req as unknown as { headers: Record<string, string> }).headers = opts.headers ?? {};
  const json = JSON.stringify(opts.body ?? {});
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
const ADMIN_PASSWORD = "test-admin-pw";
const APPS_SCRIPT_ADMIN_TOKEN = "test-script-token";
const AUTH_HEADERS = { "x-admin-token": ADMIN_PASSWORD };

describe("api/admin-leads", () => {
  const originalFetch = global.fetch;
  const originalEnv = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    APPS_SCRIPT_ADMIN_TOKEN: process.env.APPS_SCRIPT_ADMIN_TOKEN,
    APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL,
  };

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    process.env.APPS_SCRIPT_ADMIN_TOKEN = APPS_SCRIPT_ADMIN_TOKEN;
    process.env.APPS_SCRIPT_URL = APPS_SCRIPT_URL;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ADMIN_PASSWORD = originalEnv.ADMIN_PASSWORD;
    process.env.APPS_SCRIPT_ADMIN_TOKEN = originalEnv.APPS_SCRIPT_ADMIN_TOKEN;
    process.env.APPS_SCRIPT_URL = originalEnv.APPS_SCRIPT_URL;
    vi.restoreAllMocks();
  });

  it("returns success on a direct (non-redirected) addLead response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    ) as unknown as typeof fetch;

    const { req, send } = makeReq({ headers: AUTH_HEADERS, body: { action: "addLead", fullName: "Test" } });
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

    const { req, send } = makeReq({
      headers: AUTH_HEADERS,
      body: { action: "updateStatus", rowIndex: 2, status: "Contacted" },
    });
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

  it("returns a 502 when the upstream body is not JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("<html>nope</html>", { status: 200 })
    ) as unknown as typeof fetch;

    const { req, send } = makeReq({ headers: AUTH_HEADERS, body: { action: "addLead", fullName: "Test" } });
    const { res, status, json } = makeRes();
    const pending = handler(req, res);
    send();
    await pending;

    expect(status()).toBe(502);
    expect(json().success).toBe(false);
  });

  it("returns a 502 on a generic backend failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch;

    const { req, send } = makeReq({ headers: AUTH_HEADERS, body: { action: "addLead", fullName: "Test" } });
    const { res, status, json } = makeRes();
    const pending = handler(req, res);
    send();
    await pending;

    expect(status()).toBe(502);
    expect(json().success).toBe(false);
  });

  // Note: unlike submit-lead.ts, this handler has no AbortController/timeout
  // mechanism of its own — a hung upstream request would just hang, so there
  // is no distinct "timeout" code path here to regression-test.
});
