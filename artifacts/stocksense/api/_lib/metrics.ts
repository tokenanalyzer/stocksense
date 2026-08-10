import type { AdsMetrics } from "./adsClient.js";
import type { GA4Totals } from "./ga4Client.js";
import type { SheetsMetrics } from "./sheetsClient.js";

/**
 * Deterministic Marketing Intelligence Engine. Every function here is a
 * pure, synchronous calculation over already-fetched data — no network
 * calls, no AI, nothing non-deterministic. This is what the AI analyst
 * layer (Phase 1b, not built yet) will read numbers from rather than being
 * asked to compute them itself.
 *
 * Missing/zero-denominator cases return `null`, never `0` or `NaN` — a null
 * means "not knowable from current data," which is a different fact from
 * "measured as zero."
 */

export interface NormalizedMetrics {
  adSpend: number | null;
  clicks: number;
  impressions: number;
  ctr: number | null;
  cpc: number | null;
  leads: number;
  adsConversions: number;
  conversionRate: number | null;
  costPerLead: number | null;
  activeUsers: number | null;
  sessions: number | null;
  qualifiedEvents: number | null;
}

export interface RawPeriodInput {
  ads: AdsMetrics | null;
  ga4: GA4Totals | null;
  sheets: SheetsMetrics | null;
}

const EMPTY_METRICS: NormalizedMetrics = {
  adSpend: null,
  clicks: 0,
  impressions: 0,
  ctr: null,
  cpc: null,
  leads: 0,
  adsConversions: 0,
  conversionRate: null,
  costPerLead: null,
  activeUsers: null,
  sessions: null,
  qualifiedEvents: null,
};

export function computeNormalizedMetrics(input: RawPeriodInput): NormalizedMetrics {
  const clicks = input.ads?.totals.clicks ?? 0;
  const impressions = input.ads?.totals.impressions ?? 0;
  const adSpend = input.ads ? input.ads.totals.costMicros / 1_000_000 : null;
  const adsConversions = input.ads?.totals.conversions ?? 0;
  const leads = input.sheets?.leadCount ?? 0;

  return {
    adSpend,
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : null,
    cpc: clicks > 0 && adSpend !== null ? adSpend / clicks : null,
    leads,
    adsConversions,
    conversionRate: clicks > 0 && input.sheets ? leads / clicks : null,
    costPerLead: leads > 0 && adSpend !== null ? adSpend / leads : null,
    activeUsers: input.ga4?.activeUsers ?? null,
    sessions: input.ga4?.sessions ?? null,
    qualifiedEvents: input.ga4?.keyEvents ?? null,
  };
}

export type MetricDeltas = Record<keyof NormalizedMetrics, number | null>;

/** Percentage change current vs previous. previous === 0 or null on either side → null (not Infinity/NaN). */
export function computeDeltas(current: NormalizedMetrics, previous: NormalizedMetrics): MetricDeltas {
  const keys = Object.keys(EMPTY_METRICS) as (keyof NormalizedMetrics)[];
  const deltas = {} as MetricDeltas;

  for (const key of keys) {
    const curr = current[key];
    const prev = previous[key];
    if (curr === null || prev === null || prev === 0) {
      deltas[key] = null;
    } else {
      deltas[key] = ((curr - prev) / prev) * 100;
    }
  }

  return deltas;
}
