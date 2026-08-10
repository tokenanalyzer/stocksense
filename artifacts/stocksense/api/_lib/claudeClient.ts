import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-side Claude client. ANTHROPIC_API_KEY is read only via
 * process.env (no VITE_ prefix — never bundled into client JS), matching the
 * same pattern as ADMIN_PASSWORD / APPS_SCRIPT_URL / the Google credentials
 * in googleAuth.ts. The key is never logged or included in any response.
 *
 * Approved primary model (Phase 1b design report, section 1): Claude Sonnet 5.
 * A 30s request timeout is set explicitly — short enough that a stuck
 * request surfaces as analysis_timeout rather than hanging the endpoint.
 */

export const CLAUDE_MODEL = "claude-sonnet-5";

let cachedClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  cachedClient = new Anthropic({ apiKey, timeout: 30_000 });
  return cachedClient;
}
