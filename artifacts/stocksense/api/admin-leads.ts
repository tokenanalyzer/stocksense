import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Server-side proxy for the /admin dashboard's Google Apps Script calls.
 * The real Apps Script bearer token (APPS_SCRIPT_ADMIN_TOKEN) is read from
 * this function's environment and never sent to the browser — the client
 * only ever holds the separate, independently-rotatable ADMIN_PASSWORD.
 *
 * Apps Script Web Apps 302-redirect every request to a googleusercontent.com
 * URL. The Fetch spec downgrades a redirected POST to a GET, which silently
 * turns doPost calls into doGet calls. redirect:"manual" + a manual re-POST
 * to the Location header avoids that downgrade (this only matters for POST —
 * GET-to-GET redirects are unaffected and don't need this handling).
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

async function postToAppsScript(url: string, payload: unknown): Promise<unknown> {
  const body = JSON.stringify(payload);
  const headers = { "Content-Type": "text/plain" };

  let response = await fetch(url, { method: "POST", headers, body, redirect: "manual" });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Apps Script redirected with no Location header");
    response = await fetch(location, { method: "POST", headers, body });
  }

  return response.json();
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
      const upstream = await fetch(
        `${appsScriptUrl}?action=getLeads&token=${encodeURIComponent(appsScriptToken)}`
      );
      sendJson(res, 200, await upstream.json());
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
