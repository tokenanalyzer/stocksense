import { google, type analyticsdata_v1beta } from "googleapis";
import { getGoogleJwtClient } from "./googleAuth.js";
import type { DateRange } from "./adsClient.js";

/**
 * Read-only GA4 Data API client. Only ever calls `runReport` (a read
 * method) — there is no write/update method in the GA4 Data API surface at
 * all, so no explicit "never mutate" guard is needed here the way it is for
 * Ads, but the client still never imports anything beyond `runReport`.
 */

const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export interface GA4Totals {
  activeUsers: number;
  sessions: number;
  events: number;
  keyEvents: number;
}

export interface GA4TrafficSource {
  source: string;
  medium: string;
  sessions: number;
}

export interface GA4LandingPage {
  path: string;
  sessions: number;
  conversions: number;
}

export interface GA4Metrics {
  totals: GA4Totals;
  trafficSources: GA4TrafficSource[];
  landingPages: GA4LandingPage[];
}

function emptyTotals(): GA4Totals {
  return { activeUsers: 0, sessions: 0, events: 0, keyEvents: 0 };
}

/**
 * Fetches current + previous period totals in a single runReport call using
 * GA4's native multi-dateRanges support (rows come back tagged with a
 * dateRange dimension value of "date_range_0" for the first range passed
 * and "date_range_1" for the second).
 */
export async function getGa4Metrics(
  previousPeriod: DateRange,
  currentPeriod: DateRange,
): Promise<{ current: GA4Metrics; previous: GA4Metrics }> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    throw new Error("GA4 is not configured (missing property ID)");
  }

  const auth = await getGoogleJwtClient(GA4_SCOPE);
  const options: analyticsdata_v1beta.Options = { version: "v1beta", auth };
  const analyticsdata = google.analyticsdata(options);

  const totalsResp = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [
        { startDate: currentPeriod.start, endDate: currentPeriod.end },
        { startDate: previousPeriod.start, endDate: previousPeriod.end },
      ],
      dimensions: [{ name: "dateRange" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "eventCount" }, { name: "keyEvents" }],
    },
  });

  const current = emptyTotals();
  const previous = emptyTotals();

  for (const row of totalsResp.data.rows ?? []) {
    const rangeLabel = row.dimensionValues?.[0]?.value;
    const target = rangeLabel === "date_range_0" ? current : rangeLabel === "date_range_1" ? previous : null;
    if (!target) continue;

    target.activeUsers = Number(row.metricValues?.[0]?.value ?? 0);
    target.sessions = Number(row.metricValues?.[1]?.value ?? 0);
    target.events = Number(row.metricValues?.[2]?.value ?? 0);
    target.keyEvents = Number(row.metricValues?.[3]?.value ?? 0);
  }

  const [trafficSources, landingPages] = await Promise.all([
    getTrafficSources(analyticsdata, propertyId, currentPeriod),
    getLandingPages(analyticsdata, propertyId, currentPeriod),
  ]);

  return {
    current: { totals: current, trafficSources, landingPages },
    previous: { totals: previous, trafficSources: [], landingPages: [] },
  };
}

async function getTrafficSources(
  analyticsdata: ReturnType<typeof google.analyticsdata>,
  propertyId: string,
  period: DateRange,
): Promise<GA4TrafficSource[]> {
  const resp = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: period.start, endDate: period.end }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }],
      limit: "10",
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    },
  });

  return (resp.data.rows ?? []).map((row) => ({
    source: row.dimensionValues?.[0]?.value ?? "(unknown)",
    medium: row.dimensionValues?.[1]?.value ?? "(unknown)",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}

async function getLandingPages(
  analyticsdata: ReturnType<typeof google.analyticsdata>,
  propertyId: string,
  period: DateRange,
): Promise<GA4LandingPage[]> {
  const resp = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: period.start, endDate: period.end }],
      dimensions: [{ name: "landingPage" }],
      metrics: [{ name: "sessions" }, { name: "keyEvents" }],
      limit: "10",
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    },
  });

  return (resp.data.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "(unknown)",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    conversions: Number(row.metricValues?.[1]?.value ?? 0),
  }));
}
