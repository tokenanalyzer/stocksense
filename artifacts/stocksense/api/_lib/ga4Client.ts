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

/**
 * Fetches totals for a single period via a plain (non-pivot) runReport call.
 * No `dimensions` are requested — the special "dateRange" dimension used to
 * distinguish rows in a multi-range request is only documented as valid for
 * Pivot.fieldNames (RunPivotReportRequest), not for a plain RunReportRequest;
 * using it there produced a persistent 400 INVALID_ARGUMENT. Splitting into
 * one single-range call per period sidesteps the need for it entirely.
 */
async function getTotalsForPeriod(
  analyticsdata: ReturnType<typeof google.analyticsdata>,
  propertyId: string,
  period: DateRange,
): Promise<GA4Totals> {
  const resp = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: period.start, endDate: period.end }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "eventCount" }, { name: "conversions" }],
    },
  });

  const row = resp.data.rows?.[0];
  return {
    activeUsers: Number(row?.metricValues?.[0]?.value ?? 0),
    sessions: Number(row?.metricValues?.[1]?.value ?? 0),
    events: Number(row?.metricValues?.[2]?.value ?? 0),
    keyEvents: Number(row?.metricValues?.[3]?.value ?? 0),
  };
}

export async function getGa4Metrics(
  previousPeriod: DateRange,
  currentPeriod: DateRange,
): Promise<{ current: GA4Metrics; previous: GA4Metrics }> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    throw new Error("GA4 is not configured (missing property ID)");
  }

  const auth = await getGoogleJwtClient(GA4_SCOPE);
  // Asserted rather than passed as a plain literal: googleapis' own generated
  // Options types have been observed to fail TS's excess-property check for
  // `auth` in some toolchain/platform combinations even though `auth` is a
  // real, documented member (inherited from GlobalOptions) — see ga4Client
  // build-failure investigation, 2026-08-11.
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth } as analyticsdata_v1beta.Options);

  const [current, previous, trafficSources, landingPages] = await Promise.all([
    getTotalsForPeriod(analyticsdata, propertyId, currentPeriod),
    getTotalsForPeriod(analyticsdata, propertyId, previousPeriod),
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

  return (resp.data.rows ?? []).map((row: analyticsdata_v1beta.Schema$Row) => ({
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
      metrics: [{ name: "sessions" }, { name: "conversions" }],
      limit: "10",
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    },
  });

  return (resp.data.rows ?? []).map((row: analyticsdata_v1beta.Schema$Row) => ({
    path: row.dimensionValues?.[0]?.value ?? "(unknown)",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    conversions: Number(row.metricValues?.[1]?.value ?? 0),
  }));
}
