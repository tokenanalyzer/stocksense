import { describe, it, expect } from "vitest";
import { computeNormalizedMetrics, computeDeltas, type NormalizedMetrics } from "../../api/_lib/metrics";
import type { AdsMetrics } from "../../api/_lib/adsClient";
import type { GA4Totals } from "../../api/_lib/ga4Client";
import type { SheetsMetrics } from "../../api/_lib/sheetsClient";

function ads(overrides: Partial<AdsMetrics["totals"]> = {}): AdsMetrics {
  return {
    campaigns: [],
    totals: { impressions: 1000, clicks: 50, costMicros: 25_000_000, conversions: 5, conversionValue: 0, ...overrides },
  };
}

function ga4(overrides: Partial<GA4Totals> = {}): GA4Totals {
  return { activeUsers: 100, sessions: 120, events: 500, keyEvents: 10, ...overrides };
}

function sheets(overrides: Partial<SheetsMetrics> = {}): SheetsMetrics {
  return { leadCount: 4, leadsByDate: [], statusCounts: {}, ...overrides };
}

describe("computeNormalizedMetrics", () => {
  it("computes all formulas correctly with full data", () => {
    const m = computeNormalizedMetrics({ ads: ads(), ga4: ga4(), sheets: sheets() });

    expect(m.adSpend).toBe(25); // 25,000,000 micros / 1,000,000
    expect(m.clicks).toBe(50);
    expect(m.impressions).toBe(1000);
    expect(m.ctr).toBeCloseTo(0.05); // 50/1000
    expect(m.cpc).toBeCloseTo(0.5); // 25/50
    expect(m.leads).toBe(4);
    expect(m.adsConversions).toBe(5);
    expect(m.conversionRate).toBeCloseTo(0.08); // 4/50
    expect(m.costPerLead).toBeCloseTo(6.25); // 25/4
    expect(m.activeUsers).toBe(100);
    expect(m.sessions).toBe(120);
    expect(m.qualifiedEvents).toBe(10);
  });

  it("returns null (not 0 or NaN) for ctr/cpc when impressions/clicks are zero", () => {
    const m = computeNormalizedMetrics({ ads: ads({ impressions: 0, clicks: 0 }), ga4: null, sheets: null });
    expect(m.ctr).toBeNull();
    expect(m.cpc).toBeNull();
    expect(m.conversionRate).toBeNull();
  });

  it("returns null costPerLead when there are zero leads", () => {
    const m = computeNormalizedMetrics({ ads: ads(), ga4: null, sheets: sheets({ leadCount: 0 }) });
    expect(m.costPerLead).toBeNull();
  });

  it("returns null for a whole source's fields when that source is unavailable", () => {
    const m = computeNormalizedMetrics({ ads: null, ga4: null, sheets: null });
    expect(m.adSpend).toBeNull();
    expect(m.ctr).toBeNull();
    expect(m.cpc).toBeNull();
    expect(m.activeUsers).toBeNull();
    expect(m.sessions).toBeNull();
    expect(m.qualifiedEvents).toBeNull();
    expect(m.clicks).toBe(0);
    expect(m.leads).toBe(0);
  });

  it("conversionRate is null when sheets source is unavailable even if clicks > 0", () => {
    const m = computeNormalizedMetrics({ ads: ads(), ga4: null, sheets: null });
    expect(m.conversionRate).toBeNull();
  });
});

describe("computeDeltas", () => {
  const base: NormalizedMetrics = {
    adSpend: 100,
    clicks: 50,
    impressions: 1000,
    ctr: 0.05,
    cpc: 2,
    leads: 10,
    adsConversions: 8,
    conversionRate: 0.2,
    costPerLead: 10,
    activeUsers: 50,
    sessions: 60,
    qualifiedEvents: 5,
  };

  it("computes percentage change correctly", () => {
    const current = { ...base, adSpend: 150 };
    const deltas = computeDeltas(current, base);
    expect(deltas.adSpend).toBeCloseTo(50); // (150-100)/100 * 100
  });

  it("returns null instead of Infinity/NaN when previous is 0", () => {
    const previous = { ...base, leads: 0 };
    const current = { ...base, leads: 5 };
    const deltas = computeDeltas(current, previous);
    expect(deltas.leads).toBeNull();
  });

  it("returns null when either side is null", () => {
    const previous = { ...base, adSpend: null };
    const current = { ...base, adSpend: 100 };
    expect(computeDeltas(current, previous).adSpend).toBeNull();

    const current2 = { ...base, sessions: null };
    expect(computeDeltas(current2, base).sessions).toBeNull();
  });

  it("handles identical values as zero percent change", () => {
    const deltas = computeDeltas(base, base);
    expect(deltas.adSpend).toBe(0);
    expect(deltas.leads).toBe(0);
  });
});
