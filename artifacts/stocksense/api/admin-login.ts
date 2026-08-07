import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Validates the /admin login password server-side. The real secret
 * (ADMIN_PASSWORD) lives only in this function's environment — it is never
 * bundled into client JS, unlike the VITE_ADMIN_PASSWORD this replaces.
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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "Method not allowed" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    sendJson(res, 200, { success: false, error: "not_configured" });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { success: false, error: "Invalid request body" });
    return;
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password !== adminPassword) {
    sendJson(res, 200, { success: false, error: "invalid" });
    return;
  }

  sendJson(res, 200, { success: true });
}
