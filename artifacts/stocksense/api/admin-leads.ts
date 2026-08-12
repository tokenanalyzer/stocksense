import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Server-side proxy for the /admin dashboard's Google Apps Script calls.
 * The real Apps Script bearer token (APPS_SCRIPT_ADMIN_TOKEN) is read from
 * this function's environment and never sent to the browser — the client
 * only ever holds the separate, independently-rotatable ADMIN_PASSWORD.
 *
 * Apps Script Web Apps run doPost() to completion — sheet writes, everything
 * — and then 302-redirect to a script.googleusercontent.com/macros/echo URL
 * that merely serves the already-computed output back. That echo endpoint
 * only accepts GET/HEAD (confirmed: a re-POST to it returns 405 Method Not
 * Allowed with an HTML body, not the JSON result), so redirect:"manual" +
 * a manual follow-up GET (not POST) to the Location header is required to
 * actually read the result.
 */

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

function getToken(req: IncomingMessage): string {
  const header = req.headers["x-admin-token"];
  if (Array.isArray(header)) return header[0] ?? "";
  return header ?? "";
}

function stripQuery(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return "invalid-url";
  }
}

async function requestAppsScript(
  url: string,
  init: { method: "GET" | "POST"; headers?: Record<string, string>; body?: string },
  context: string,
): Promise<unknown> {
  let response = await fetch(url, { ...init, redirect: "manual" });
  let redirected = false;

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Apps Script redirected with no Location header");
    redirected = true;
    response = await fetch(location, { method: "GET" });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    // TEMPORARY diagnostic instrumentation (2026-08-12) — remove once the
    // admin-leads non-JSON-upstream-response root cause is confirmed. Logs
    // only safe metadata: HTTP status, content-type, whether a redirect was
    // followed, and the final URL with query/token stripped. Never logs
    // response bodies, tokens, or lead PII.
    console.error(`[admin-leads] ${context}: Apps Script returned non-JSON response`, {
      status: response.status,
      contentType,
      redirected,
      finalUrl: stripQuery(response.url || url),
    });
    throw new Error(`Apps Script returned a non-JSON response (status ${response.status})`);
  }

  return response.json();
}

async function postToAppsScript(url: string, payload: unknown): Promise<unknown> {
  return requestAppsScript(
    url,
    { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) },
    "postToAppsScript",
  );
}

async function getLeadsFromAppsScript(url: string): Promise<unknown> {
  return requestAppsScript(url, { method: "GET" }, "getLeads");
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const appsScriptToken = process.env.APPS_SCRIPT_ADMIN_TOKEN;
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (!adminPassword || !appsScriptToken || !appsScriptUrl) {
    sendJson(res, 200, { success: false, error: "not_configured" });
    return;
  }

  if (getToken(req) !== adminPassword) {
    sendJson(res, 401, { success: false, error: "Unauthorized" });
    return;
  }

  try {
    if (req.method === "GET") {
      const url = new URL(req.url ?? "", "http://localhost");
      if (url.searchParams.get("action") !== "getLeads") {
        sendJson(res, 400, { success: false, error: "Unknown action" });
        return;
      }
      const result = await getLeadsFromAppsScript(
        `${appsScriptUrl}?action=getLeads&token=${encodeURIComponent(appsScriptToken)}`
      );
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);

      if (body.action === "updateStatus") {
        const result = await postToAppsScript(appsScriptUrl, {
          action: "updateStatus",
          token: appsScriptToken,
          rowIndex: body.rowIndex,
          status: body.status,
        });
        sendJson(res, 200, result);
        return;
      }

      if (body.action === "addLead") {
        const { action: _action, ...lead } = body;
        const result = await postToAppsScript(appsScriptUrl, lead);
        sendJson(res, 200, result);
        return;
      }

      sendJson(res, 400, { success: false, error: "Unknown action" });
      return;
    }

    sendJson(res, 405, { success: false, error: "Method not allowed" });
  } catch (err) {
    sendJson(res, 502, {
      success: false,
      error: err instanceof Error ? err.message : "Upstream request failed",
    });
  }
}
