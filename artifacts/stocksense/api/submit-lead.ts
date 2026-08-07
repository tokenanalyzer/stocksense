import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Server-side proxy for the public lead-submission form. This exists so the
 * browser gets a real, readable success/failure answer instead of the
 * opaque response `mode:"no-cors"` produces when calling Apps Script
 * directly — see the legacy path in src/pages/Landing.tsx for why that
 * workaround existed and why it can't tell a genuine save from a silent
 * failure.
 *
 * Contract: this function returns {success:true} ONLY when Apps Script's
 * own response is valid JSON with `success === true`. Every other outcome —
 * upstream error, timeout, non-JSON response, or a response that doesn't
 * even look like the expected envelope — comes back as {success:false,
 * error:<reason>}. The caller (submitLead() in Landing.tsx) must not treat
 * anything but a real {success:true} as a save, and that's what makes it
 * safe to gate a Google Ads conversion on lead_submit_success.
 */

const UPSTREAM_TIMEOUT_MS = 10_000;

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

type UpstreamResult =
  | { ok: true; data: unknown }
  | { ok: false; reason: "timeout" | "network_error" | "invalid_response"; detail?: string };

/**
 * POSTs to Apps Script and follows its redirect manually. Apps Script Web
 * Apps run doPost() to completion — sheet writes, emails, everything — and
 * then 302-redirect to a script.googleusercontent.com/macros/echo URL that
 * merely serves the already-computed output back. That echo endpoint only
 * accepts GET/HEAD (confirmed: a re-POST to it returns 405 Method Not
 * Allowed with an HTML body, not the JSON result), so the redirect must be
 * followed with GET — not the original POST — to actually read the result.
 * Bounded by a single timeout covering both hops.
 */
async function postToAppsScript(url: string, payload: unknown, timeoutMs: number): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const body = JSON.stringify(payload);
  const headers = { "Content-Type": "text/plain" };

  try {
    let response = await fetch(url, { method: "POST", headers, body, redirect: "manual", signal: controller.signal });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { ok: false, reason: "invalid_response", detail: "Redirect with no Location header" };
      response = await fetch(location, { method: "GET", signal: controller.signal });
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { ok: false, reason: "invalid_response", detail: "Upstream response was not valid JSON" };
    }

    return { ok: true, data };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "network_error", detail: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "method_not_allowed" });
    return;
  }

  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    sendJson(res, 200, { success: false, error: "not_configured" });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { success: false, error: "invalid_request_body" });
    return;
  }

  const result = await postToAppsScript(appsScriptUrl, body, UPSTREAM_TIMEOUT_MS);

  if (!result.ok) {
    const status = result.reason === "timeout" ? 504 : 502;
    sendJson(res, status, { success: false, error: result.reason });
    return;
  }

  // Guard against "valid JSON but not actually the envelope we expect" —
  // e.g. Apps Script returning {} or some unrelated object must not be
  // silently treated as success just because it parsed.
  const upstream = result.data;
  const looksValid =
    typeof upstream === "object" && upstream !== null && typeof (upstream as { success?: unknown }).success === "boolean";

  if (!looksValid) {
    sendJson(res, 502, { success: false, error: "invalid_response" });
    return;
  }

  sendJson(res, 200, upstream);
}
