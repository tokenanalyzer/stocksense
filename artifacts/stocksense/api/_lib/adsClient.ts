import { getGoogleJwtClient } from "./googleAuth.js";

/**
 * Read-only Google Ads client. This file contains exactly one Google Ads
 * API call shape: a GAQL `search` request. There is no mutate/update/pause/
 * enable/delete function anywhere in this file, and none should ever be
 * added — test/lib/adsClient.test.ts asserts every fetch call URL contains
 * ":search" and never ":mutate".
 *
 * API version note (verified 2026-08-10): v12–v19 are retired (404), v20 is
 * explicitly deprecated by Google ("requests will be blocked"). v22 is the
 * first version confirmed working — recheck developers.google.com/google-ads/api
 * before reusing this if it starts 404ing again.
 *
 * Do NOT set a login-customer-id header for this account: the service
 * account has *direct* Read-only user access to the client account, and
 * setting login-customer-id to the manager account causes
 * 403 PERMISSION_DENIED / USER_PERMISSION_DENIED.
 */

const ADS_API_VERSION = "v22";
const ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface AdsCampaignRow {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionValue: number;
}

export interface AdsMetrics {
  campaigns: AdsCampaignRow[];
  totals: {
    impressions: number;
    clicks: number;
    costMicros: number;
    conversions: number;
    conversionValue: number;
  };
}

export class AdsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdsApiError";
  }
}

/** Accumulates per-date GAQL rows into one aggregated row per campaign for a period. */
class PeriodAccumulator {
  private readonly byCampaign = new Map<string, AdsCampaignRow>();

  add(row: AdsCampaignRow) {
    const existing = this.byCampaign.get(row.id);
    if (!existing) {
      this.byCampaign.set(row.id, { ...row });
      return;
    }
    existing.impressions += row.impressions;
    existing.clicks += row.clicks;
    existing.costMicros += row.costMicros;
    existing.conversions += row.conversions;
    existing.conversionValue += row.conversionValue;
    existing.status = row.status; // most recently seen date wins
  }

  toMetrics(): AdsMetrics {
    const campaigns = [...this.byCampaign.values()];
    const totals = campaigns.reduce(
      (acc, c) => ({
        impressions: acc.impressions + c.impressions,
        clicks: acc.clicks + c.clicks,
        costMicros: acc.costMicros + c.costMicros,
        conversions: acc.conversions + c.conversions,
        conversionValue: acc.conversionValue + c.conversionValue,
      }),
      { impressions: 0, clicks: 0, costMicros: 0, conversions: 0, conversionValue: 0 },
    );
    return { campaigns, totals };
  }
}

/**
 * Fetches campaign performance for both periods in a single GAQL query
 * (segments.date BETWEEN previousPeriod.start AND currentPeriod.end), then
 * buckets rows into current/previous locally. This halves the API call
 * count versus querying each period separately.
 */
export async function getAdsMetrics(
  previousPeriod: DateRange,
  currentPeriod: DateRange,
): Promise<{ current: AdsMetrics; previous: AdsMetrics }> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!customerId || !developerToken) {
    throw new Error("Google Ads is not configured (missing customer ID or developer token)");
  }

  const jwt = await getGoogleJwtClient(ADS_SCOPE);
  const accessToken = jwt.credentials.access_token;

  const query = `
    SELECT campaign.id, campaign.name, campaign.status,
           metrics.impressions, metrics.clicks, metrics.cost_micros,
           metrics.conversions, metrics.conversions_value,
           segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${previousPeriod.start}' AND '${currentPeriod.end}'
  `.trim();

  const response = await fetch(
    `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  if (!response.ok) {
    let message = `Google Ads API returned ${response.status}`;
    try {
      const body = (await response.json()) as { error?: { message?: string; status?: string } };
      if (body?.error?.status) message = `Google Ads API error: ${body.error.status}`;
    } catch {
      // upstream body wasn't JSON — keep the generic status-only message
    }
    throw new AdsApiError(message, response.status);
  }

  const data = (await response.json()) as {
    results?: Array<{
      campaign?: { id?: string; name?: string; status?: string };
      metrics?: { impressions?: string; clicks?: string; costMicros?: string; conversions?: string; conversionsValue?: string };
      segments?: { date?: string };
    }>;
  };

  const current = new PeriodAccumulator();
  const previous = new PeriodAccumulator();

  for (const result of data.results ?? []) {
    const date = result.segments?.date;
    if (!date) continue;

    const row: AdsCampaignRow = {
      id: result.campaign?.id ?? "",
      name: result.campaign?.name ?? "",
      status: result.campaign?.status ?? "UNKNOWN",
      impressions: Number(result.metrics?.impressions ?? 0),
      clicks: Number(result.metrics?.clicks ?? 0),
      costMicros: Number(result.metrics?.costMicros ?? 0),
      conversions: Number(result.metrics?.conversions ?? 0),
      conversionValue: Number(result.metrics?.conversionsValue ?? 0),
    };

    if (date >= currentPeriod.start && date <= currentPeriod.end) {
      current.add(row);
    } else if (date >= previousPeriod.start && date <= previousPeriod.end) {
      previous.add(row);
    }
  }

  return { current: current.toMetrics(), previous: previous.toMetrics() };
}
