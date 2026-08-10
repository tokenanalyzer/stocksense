import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";

const { getAdsMetricsMock, getGa4MetricsMock, getSheetsMetricsMock } = vi.hoisted(() => ({
  getAdsMetricsMock: vi.fn(),
  getGa4MetricsMock: vi.fn(),
  getSheetsMetricsMock: vi.fn(),
}));

vi.mock("../../api/_lib/adsClient", async () => {
  const actual = await vi.importActual<typeof import("../../api/_lib/adsClient")>("../../api/_lib/adsClient");
  return { ...actual, getAdsMetrics: getAdsMetricsMock };
});
vi.mock("../../api/_lib/ga4Client", () => ({ getGa4Metrics: getGa4MetricsMock }));
vi.mock("../../api/_lib/sheetsClient", () => ({ getSheetsMetrics: getSheetsMetricsMock }));

import handler, { resolveDateRanges } from "../../api/marketing/snapshot";

function makeReq(opts: { url?: string; headers?: Record<string, string> }) {
  return {
    method: "GET",
    url: opts.url ?? "/api/marketing/snapshot",
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

const emptyAds = { current: { campaigns: [], totals: { impressions: 0, clicks: 0, costMicros: 0, conversions: 0, conversionValue: 0 } }, previous: { campaigns: [], totals: { impressions: 0, clicks: 0, costMicros: 0, conversions: 0, conversionValue: 0 } } };
const emptyGa4 = { current: { totals: { activeUsers: 0, sessions: 0, events: 0, keyEvents: 0 }, trafficSources: [], landingPages: [] }, previous: { totals: { activeUsers: 0, sessions: 0, events: 0, keyEvents: 0 }, trafficSources: [], landingPages: [] } };
const emptySheets = { current: { leadCount: 0, leadsByDate: [], statusCounts: {} }, previous: { leadCount: 0, leadsByDate: [], statusCounts: {} } };

describe("GET /api/marketing/snapshot", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    getAdsMetricsMock.mockReset().mockResolvedValue(emptyAds);
    getGa4MetricsMock.mockReset().mockResolvedValue(emptyGa4);
    getSheetsMetricsMock.mockReset().mockResolvedValue(emptySheets);
  });

  afterEach(() => {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
    vi.restoreAllMocks();
  });

  it("rejects requests with no x-admin-token", async () => {
    const { res, status, json } = makeRes();
    await handler(makeReq({}), res);
    expect(status()).toBe(401);
    expect(json().success).toBe(false);
  });

  it("rejects requests with the wrong token", async () => {
    const { res, status } = makeRes();
    await handler(makeReq({ headers: { "x-admin-token": "wrong" } }), res);
    expect(status()).toBe(401);
  });

  it("rejects non-GET methods", async () => {
    const { res, status } = makeRes();
    const req = makeReq({ headers: AUTH_HEADERS });
    (req as unknown as { method: string }).method = "POST";
    await handler(req, res);
    expect(status()).toBe(405);
  });

  it("returns a full snapshot when all three sources succeed", async () => {
    const { res, status, json } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);

    expect(status()).toBe(200);
    const body = json();
    expect(body.success).toBe(true);
    expect(body.snapshot.dataConfidence).toEqual({ ads: "ok", ga4: "ok", sheets: "ok" });
    expect(body.snapshot.metrics.current).toBeDefined();
    expect(body.snapshot.metrics.previous).toBeDefined();
    expect(body.snapshot.metrics.deltas).toBeDefined();
    expect(Array.isArray(body.snapshot.anomalies)).toBe(true);
  });

  it("returns partial data with dataConfidence=unavailable when Ads fails", async () => {
    getAdsMetricsMock.mockRejectedValue(new Error("Ads down"));
    const { res, status, json } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);

    expect(status()).toBe(200); // still 200 — partial failure is not a hard error
    const body = json();
    expect(body.success).toBe(true);
    expect(body.snapshot.dataConfidence.ads).toBe("unavailable");
    expect(body.snapshot.dataConfidence.ga4).toBe("ok");
    expect(body.snapshot.dataConfidence.sheets).toBe("ok");
    expect(body.snapshot.metrics.current.adSpend).toBeNull();
  });

  it("returns partial data when a quota error (e.g. 429/RESOURCE_EXHAUSTED) is thrown", async () => {
    class QuotaError extends Error {
      status = 429;
    }
    getGa4MetricsMock.mockRejectedValue(new QuotaError("RESOURCE_EXHAUSTED"));
    const { res, status, json } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);

    expect(status()).toBe(200);
    const body = json();
    expect(body.snapshot.dataConfidence.ga4).toBe("unavailable");
    expect(body.snapshot.dataConfidence.ads).toBe("ok");
  });

  it("degrades gracefully when all three sources fail", async () => {
    getAdsMetricsMock.mockRejectedValue(new Error("down"));
    getGa4MetricsMock.mockRejectedValue(new Error("down"));
    getSheetsMetricsMock.mockRejectedValue(new Error("down"));
    const { res, status, json } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);

    expect(status()).toBe(200);
    const body = json();
    expect(body.snapshot.dataConfidence).toEqual({ ads: "unavailable", ga4: "unavailable", sheets: "unavailable" });
    expect(body.snapshot.anomalies).toEqual([]);
  });

  it("never includes credential-shaped fields in the response body", async () => {
    const { res, json } = makeRes();
    await handler(makeReq({ headers: AUTH_HEADERS }), res);
    const raw = JSON.stringify(json());
    expect(raw).not.toMatch(/private_key|developer.?token|client_email/i);
  });
});

describe("resolveDateRanges", () => {
  const now = new Date("2026-08-10T12:00:00Z");

  it("defaults to a 7-day range", () => {
    const { currentPeriod, previousPeriod } = resolveDateRanges(null, now);
    expect(currentPeriod).toEqual({ start: "2026-08-04", end: "2026-08-10" });
    expect(previousPeriod).toEqual({ start: "2026-07-28", end: "2026-08-03" });
  });

  it("supports a 30-day range", () => {
    const { currentPeriod, previousPeriod } = resolveDateRanges("30d", now);
    expect(currentPeriod.start).toBe("2026-07-12");
    expect(currentPeriod.end).toBe("2026-08-10");
    expect(previousPeriod.end).toBe("2026-07-11");
  });

  it("current and previous periods never overlap", () => {
    const { currentPeriod, previousPeriod } = resolveDateRanges("7d", now);
    expect(previousPeriod.end < currentPeriod.start).toBe(true);
  });
});
