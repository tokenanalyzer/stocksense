import type { IncomingMessage, ServerResponse } from "node:http";
import { isAdminAuthorized } from "../_lib/adminAuth.js";
import { buildMarketingSnapshot } from "./snapshot.js";
import { generateAnalysis, AnalysisError, type AnalysisErrorCode } from "../_lib/analysisEngine.js";
import { hashSnapshotForCache, getCachedAnalysis, setCachedAnalysis } from "../_lib/analysisCache.js";

/**
 * GET /api/marketing/analysis?range=7d|30d&force=true
 *
 * Read-only. Requires the same x-admin-token auth as /api/marketing/snapshot
 * and /api/admin-leads. Reuses the exact Phase 1a snapshot-building logic
 * (buildMarketingSnapshot) — no deterministic metric/anomaly logic is
 * duplicated or modified here.
 *
 * Serves a cached analysis when the underlying snapshot hasn't meaningfully
 * changed since the last call (see analysisCache.ts), unless ?force=true.
 * Never calls out to Ads/GA4/Sheets mutation methods — this endpoint (and
 * everything it calls) is read-only end to end.
 */

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

const ERROR_STATUS: Record<AnalysisErrorCode, number> = {
  analysis_not_configured: 200, // matches this repo's existing not_configured convention (admin-login.ts, admin-leads.ts)
  analysis_no_data: 200,
  analysis_rate_limited: 429,
  analysis_timeout: 504,
  analysis_provider_unavailable: 502,
  analysis_invalid: 502,
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    sendJson(res, 405, { success: false, error: "Method not allowed" });
    return;
  }

  if (!isAdminAuthorized(req)) {
    sendJson(res, 401, { success: false, error: "Unauthorized" });
    return;
  }

  const url = new URL(req.url ?? "", "http://localhost");
  const force = url.searchParams.get("force") === "true";

  const snapshot = await buildMarketingSnapshot(url.searchParams.get("range"));
  const hash = hashSnapshotForCache(snapshot);

  if (!force) {
    const cached = getCachedAnalysis(hash);
    if (cached) {
      sendJson(res, 200, { success: true, analysis: cached, cached: true, snapshot });
      return;
    }
  }

  try {
    const analysis = await generateAnalysis(snapshot);
    setCachedAnalysis(hash, analysis);
    sendJson(res, 200, { success: true, analysis, cached: false, snapshot });
  } catch (err) {
    if (err instanceof AnalysisError) {
      sendJson(res, ERROR_STATUS[err.code], { success: false, error: err.code });
      return;
    }
    sendJson(res, 502, { success: false, error: "analysis_unexpected_error" });
  }
}
