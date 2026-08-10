import { google } from "googleapis";

/**
 * Builds a scoped JWT client from the service-account key stored as
 * GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 (base64 of the full downloaded JSON key
 * file — base64 avoids the newline-corruption issues raw PEM blocks hit in
 * env-var UIs). The decoded key is parsed once per warm serverless instance
 * and never written to disk or logged.
 *
 * One JWT is requested per call with only the scope that specific API call
 * needs (adwords / analytics.readonly / spreadsheets.readonly), rather than
 * one JWT holding every scope — keeps the blast radius of any single token
 * smaller, matching the least-privilege grants already set on the account.
 */

let cachedKey: { client_email: string; private_key: string } | null = null;

function loadServiceAccountKey(): { client_email: string; private_key: string } {
  if (cachedKey) return cachedKey;

  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!encoded) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not configured");
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as { client_email?: string; private_key?: string };

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Service account key is missing client_email or private_key");
  }

  cachedKey = { client_email: parsed.client_email, private_key: parsed.private_key };
  return cachedKey;
}

export async function getGoogleJwtClient(scope: string): Promise<InstanceType<typeof google.auth.JWT>> {
  const key = loadServiceAccountKey();
  const jwt = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [scope],
  });
  await jwt.authorize();
  return jwt;
}
