import type { IncomingMessage, ServerResponse } from "node:http";
import { isAdminAuthorized } from "../_lib/adminAuth.js";
import { getAdsMetrics, type AdsMetrics, type DateRange } from "../_lib/adsClient.js";
import { getGa4Metrics, type GA4Totals } from "../_lib/ga4Client.js";
import { getSheetsMetrics, type SheetsMetrics } from "../_lib/sheetsClient.js";
import { computeNormalizedMetrics, computeDeltas, type NormalizedMetrics } from "../_lib/metrics.js";
import { detectAnomalies, type Anomaly } from "../_lib/anomalies.js";

/**
 * GET /api/marketing/snapshot?range=7d|30d
 *
 * Read-only. Requires the same x-admin-token auth as /api/admin-leads.
 * Fetches Ads/GA4/Sheets in parallel via Promise.allSettled — if one source
 * fails (auth error, quota, network), the other two still populate the
 * snapshot and the failed source is marked "unavailable" in dataConfidence
 * rather than failing the whole request. Never returns raw Sheets rows,
 * credentials, or PII in the response body.
 */

export type Confidence = "ok" | "unavailable";

export interface MarketingSnapshot {
  generatedAt: string;
  currentPeriod: DateRange;
  previousPeriod: DateRange;
  metrics: {
    current: NormalizedMetrics;
    previous: NormalizedMetrics;
    deltas: Record<keyof NormalizedMetrics, number | null>;
  };
  dataFreshness: { ads: string; ga4: string; sheets: string };
  dataConfidence: { ads: Confidence; ga4: Confidence; sheets: Confidence };
  anomalies: Anomaly[];
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/** Computes [previousPeriod, currentPeriod] date ranges from a "7d"/"30d" query param. Defaults to 7d. */
export function resolveDateRanges(rangeParam: string | null, now: Date = new Date()): { previousPeriod: DateRange; currentPeriod: DateRange } {
  const days = rangeParam === "30d" ? 30 : 7;

  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

  const currentEnd = now;
  const currentStart = addDays(currentEnd, -(days - 1));
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -(days - 1));

  return {
    currentPeriod: { start: toIsoDate(currentStart), end: toIsoDate(currentEnd) },
    previousPeriod: { start: toIsoDate(previousStart), end: toIsoDate(previousEnd) },
  };
}

/**
 * Fetches Ads/GA4/Sheets and computes the full deterministic snapshot.
 * Extracted from the handler so /api/marketing/analysis (Phase 1b) can reuse
 * this exact orchestration instead of duplicating it — the deterministic
 * logic itself (metrics.ts, anomalies.ts, the three clients) is untouched.
 */
export async function buildMarketingSnapshot(rangeParam: string | null): Promise<MarketingSnapshot> {
  const { previousPeriod, currentPeriod } = resolveDateRanges(rangeParam);

  const [adsResult, ga4Result, sheetsResult] = await Promise.allSettled([
    getAdsMetrics(previousPeriod, currentPeriod),
    getGa4Metrics(previousPeriod, currentPeriod),
    getSheetsMetrics(previousPeriod, currentPeriod),
  ]);

  const now = new Date().toISOString();

  const ads = {
    current: adsResult.status === "fulfilled" ? (adsResult.value.current as AdsMetrics) : null,
    previous: adsResult.status === "fulfilled" ? (adsResult.value.previous as AdsMetrics) : null,
  };
  const ga4 = {
    current: ga4Result.status === "fulfilled" ? (ga4Result.value.current.totals as GA4Totals) : null,
    previous: ga4Result.status === "fulfilled" ? (ga4Result.value.previous.totals as GA4Totals) : null,
  };
  const sheets = {
    current: sheetsResult.status === "fulfilled" ? (sheetsResult.value.current as SheetsMetrics) : null,
    previous: sheetsResult.status === "fulfilled" ? (sheetsResult.value.previous as SheetsMetrics) : null,
  };

  const currentMetrics = computeNormalizedMetrics({ ads: ads.current, ga4: ga4.current, sheets: sheets.current });
  const previousMetrics = computeNormalizedMetrics({ ads: ads.previous, ga4: ga4.previous, sheets: sheets.previous });
  const deltas = computeDeltas(currentMetrics, previousMetrics);
  const anomalies = detectAnomalies(currentMetrics, previousMetrics);

  const confidence = (result: PromiseSettledResult<unknown>): Confidence => (result.status === "fulfilled" ? "ok" : "unavailable");

  return {
    generatedAt: now,
    currentPeriod,
    previousPeriod,
    metrics: { current: currentMetrics, previous: previousMetrics, deltas },
    dataFreshness: { ads: now, ga4: now, sheets: now },
    dataConfidence: { ads: confidence(adsResult), ga4: confidence(ga4Result), sheets: confidence(sheetsResult) },
    anomalies,
  };
}

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
  const snapshot = await buildMarketingSnapshot(url.searchParams.get("range"));

  sendJson(res, 200, { success: true, snapshot });
}
