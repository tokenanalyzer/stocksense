import type { IncomingMessage } from "node:http";

/**
 * Same shared-secret check used by /api/admin-leads.ts: the client holds
 * ADMIN_PASSWORD (typed at /admin) and echoes it back as x-admin-token on
 * every request. Duplicated here rather than importing from admin-leads.ts
 * to avoid coupling the marketing routes to an unrelated file's internals.
 */
export function isAdminAuthorized(req: IncomingMessage): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const header = req.headers["x-admin-token"];
  const token = Array.isArray(header) ? (header[0] ?? "") : (header ?? "");
  return token === adminPassword;
}
