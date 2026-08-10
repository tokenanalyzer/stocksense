import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { MarketingSnapshot } from "../../api/marketing/snapshot";
import type { AnalysisOutput } from "../../api/_lib/analysisSchema";

const { buildMarketingSnapshotMock, generateAnalysisMock } = vi.hoisted(() => ({
  buildMarketingSnapshotMock: vi.fn(),
  generateAnalysisMock: vi.fn(),
}));

vi.mock("../../api/marketing/snapshot", () => ({ buildMarketingSnapshot: buildMarketingSnapshotMock }));
vi.mock("../../api/_lib/analysisEngine", async () => {
  const actual = await vi.importActual<typeof import("../../api/_lib/analysisEngine")>("../../api/_lib/analysisEngine");
  return { ...actual, generateAnalysis: generateAnalysisMock };
});

import handler from "../../api/marketing/analysis";
import { AnalysisError } from "../../api/_lib/analysisEngine";
import { clearAnalysisCache } from "../../api/_lib/analysisCache";

function makeReq(opts: { url?: string; headers?: Record<string, string>; method?: string } = {}) {
  return {
    method: opts.method ?? "GET",
    url: opts.url ?? "/api/marketing/analysis",
    headers: opts.headers ?? {},
  } as unknown as IncomingMessage;
}

function makeRes() {
  let statusCode = 200;
  let body: string | undefined;
  const res = {
    setHeader: () => {},
    end: (chunk?: string) => { body = chunk; },
  } as unknown as ServerResponse;
  Object.defineProperty(res, "statusCode", { get: () => statusCode, set: (v: number) => { statusCode = v; } });
  return { res, status: () => statusCode, json: () => (body ? JSON.parse(body) : undefined) };
}

const ADMIN_PASSWORD = "test-admin-pw";
const AUTH_HEADERS = { "x-admin-token": ADMIN_PASSWORD };
const originalAdminPassword = process.env.ADMIN_PASSWORD;

function fakeSnapshot(overrides: Partial<MarketingSnapshot> = {}): MarketingSnapshot {
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

describe("GET /api/marketing/analysis", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    buildMarketingSnapshotMock.mockReset().mockResolvedValue(fakeSnapshot());
    generateAnalysisMock.mockReset().mockResolvedValue(emptyAnalysis);
    clearAnalysisCache();
  });

  afterEach(() => {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
    vi.restoreAllMocks();
  });

  it("rejects requests with no x-admin-token", async () => {
    const { res, status } = makeRes();
    await handler(makeReq({}), res);
    expect(status()).toBe(401);
    expect(generateAnalysisMock).not.toHaveBeenCalled();
  });

  it("rejects non-GET methods", async () => {
    const { res, status } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS, method: "POST" }), res);
    expect(status()).toBe(405);
  });

  it("returns a fresh (uncached) analysis on the first call", async () => {
    const { res, status, json } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);
    expect(status()).toBe(200);
    const body = json();
    expect(body.success).toBe(true);
    expect(body.cached).toBe(false);
    expect(generateAnalysisMock).toHaveBeenCalledTimes(1);
  });

  it("serves a cached analysis on a second call with an unchanged snapshot", async () => {
    const { res: res1 } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res1);

    const { res: res2, json: json2 } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res2);

    expect(json2().cached).toBe(true);
    expect(generateAnalysisMock).toHaveBeenCalledTimes(1); // not called again
  });

  it("bypasses the cache when force=true is passed", async () => {
    const { res: res1 } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res1);

    const { res: res2, json: json2 } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS, url: "/api/marketing/analysis?force=true" }), res2);

    expect(json2().cached).toBe(false);
    expect(generateAnalysisMock).toHaveBeenCalledTimes(2);
  });

  it("calls the AI again when the underlying snapshot changes", async () => {
    const { res: res1 } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res1);

    buildMarketingSnapshotMock.mockResolvedValue(fakeSnapshot({ metrics: { ...fakeSnapshot().metrics, current: { ...fakeSnapshot().metrics.current, leads: 999 } } }));

    const { res: res2, json: json2 } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res2);

    expect(json2().cached).toBe(false);
    expect(generateAnalysisMock).toHaveBeenCalledTimes(2);
  });

  it("maps analysis_no_data to a 200 with success:false", async () => {
    generateAnalysisMock.mockRejectedValue(new AnalysisError("analysis_no_data", "no data"));
    const { res, status, json } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);
    expect(status()).toBe(200);
    expect(json()).toEqual({ success: false, error: "analysis_no_data" });
  });

  it("maps analysis_rate_limited to 429", async () => {
    generateAnalysisMock.mockRejectedValue(new AnalysisError("analysis_rate_limited", "rate limited"));
    const { res, status } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);
    expect(status()).toBe(429);
  });

  it("maps analysis_timeout to 504", async () => {
    generateAnalysisMock.mockRejectedValue(new AnalysisError("analysis_timeout", "timed out"));
    const { res, status } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);
    expect(status()).toBe(504);
  });

  it("maps analysis_invalid to 502", async () => {
    generateAnalysisMock.mockRejectedValue(new AnalysisError("analysis_invalid", "invalid"));
    const { res, status } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);
    expect(status()).toBe(502);
  });

  it("maps analysis_provider_unavailable to 502", async () => {
    generateAnalysisMock.mockRejectedValue(new AnalysisError("analysis_provider_unavailable", "down"));
    const { res, status } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);
    expect(status()).toBe(502);
  });

  it("never includes credential-shaped fields in the response body", async () => {
    const { res, json } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);
    const raw = JSON.stringify(json());
    expect(raw).not.toMatch(/ANTHROPIC_API_KEY|private_key|sk-ant-/i);
  });

  it("does not call the AI at all when auth fails, regardless of cache state", async () => {
    const { res } = makeRes();
    await handler(makeReq({ headers: { "x-admin-token": "wrong" } }), res);
    expect(buildMarketingSnapshotMock).not.toHaveBeenCalled();
    expect(generateAnalysisMock).not.toHaveBeenCalled();
  });
});
