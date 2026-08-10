import { describe, it, expect, beforeEach } from "vitest";
import { hashSnapshotForCache, getCachedAnalysis, setCachedAnalysis, clearAnalysisCache } from "../../api/_lib/analysisCache";
import type { MarketingSnapshot } from "../../api/marketing/snapshot";
import type { AnalysisOutput } from "../../api/_lib/analysisSchema";

function baseSnapshot(overrides: Partial<MarketingSnapshot> = {}): MarketingSnapshot {
  return {
    generatedAt: "2026-08-10T00:00:00.000Z",
    currentPeriod: { start: "2026-08-04", end: "2026-08-10" },
    previousPeriod: { start: "2026-07-28", end: "2026-08-03" },
    metrics: {
      current: { adSpend: 100, clicks: 50, impressions: 1000, ctr: 0.05, cpc: 2, leads: 10, adsConversions: 8, conversionRate: 0.2, costPerLead: 10, activeUsers: 50, sessions: 60, qualifiedEvents: 5 },
      previous: { adSpend: 100, clicks: 50, impressions: 1000, ctr: 0.05, cpc: 2, leads: 10, adsConversions: 8, conversionRate: 0.2, costPerLead: 10, activeUsers: 50, sessions: 60, qualifiedEvents: 5 },
      deltas: { adSpend: 0, clicks: 0, impressions: 0, ctr: 0, cpc: 0, leads: 0, adsConversions: 0, conversionRate: 0, costPerLead: 0, activeUsers: 0, sessions: 0, qualifiedEvents: 0 },
    },
    dataFreshness: { ads: "2026-08-10T00:00:00.000Z", ga4: "2026-08-10T00:00:00.000Z", sheets: "2026-08-10T00:00:00.000Z" },
    dataConfidence: { ads: "ok", ga4: "ok", sheets: "ok" },
    anomalies: [],
    ...overrides,
  };
}

const emptyAnalysis: AnalysisOutput = { facts: [], observations: [], hypotheses: [], recommendations: [] };

describe("analysisCache", () => {
  beforeEach(() => clearAnalysisCache());

  it("hashes identical stable data to the same value even if generatedAt/dataFreshness differ", () => {
    const a = hashSnapshotForCache(baseSnapshot({ generatedAt: "2026-08-10T00:00:00.000Z" }));
    const b = hashSnapshotForCache(
      baseSnapshot({ generatedAt: "2026-08-10T00:05:00.000Z", dataFreshness: { ads: "later", ga4: "later", sheets: "later" } }),
    );
    expect(a).toBe(b);
  });

  it("hashes differently when a metric value changes", () => {
    const a = hashSnapshotForCache(baseSnapshot());
    const b = hashSnapshotForCache(baseSnapshot({ metrics: { ...baseSnapshot().metrics, current: { ...baseSnapshot().metrics.current, adSpend: 999 } } }));
    expect(a).not.toBe(b);
  });

  it("returns null on a cache miss", () => {
    expect(getCachedAnalysis(hashSnapshotForCache(baseSnapshot()))).toBeNull();
  });

  it("returns the cached value on a matching hash after set", () => {
    const hash = hashSnapshotForCache(baseSnapshot());
    setCachedAnalysis(hash, emptyAnalysis);
    expect(getCachedAnalysis(hash)).toEqual(emptyAnalysis);
  });

  it("misses when the hash doesn't match the cached entry", () => {
    setCachedAnalysis(hashSnapshotForCache(baseSnapshot()), emptyAnalysis);
    const otherHash = hashSnapshotForCache(baseSnapshot({ anomalies: [{ metric: "leads", currentValue: 1, comparisonValue: 10, rule: "x", threshold: 0.5, severity: "high", evidence: "y" }] }));
    expect(getCachedAnalysis(otherHash)).toBeNull();
  });

  it("clearAnalysisCache empties the cache", () => {
    const hash = hashSnapshotForCache(baseSnapshot());
    setCachedAnalysis(hash, emptyAnalysis);
    clearAnalysisCache();
    expect(getCachedAnalysis(hash)).toBeNull();
  });
});
