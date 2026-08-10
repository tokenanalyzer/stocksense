import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../api/_lib/googleAuth", () => ({
  getGoogleJwtClient: vi.fn().mockResolvedValue({ credentials: { access_token: "fake-access-token" } }),
}));

import { getAdsMetrics, AdsApiError } from "../../api/_lib/adsClient";

const originalEnv = {
  GOOGLE_ADS_CUSTOMER_ID: process.env.GOOGLE_ADS_CUSTOMER_ID,
  GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
};

function searchResponse(results: unknown[]) {
  return new Response(JSON.stringify({ results }), { status: 200 });
}

describe("adsClient — read-only guarantee", () => {
  beforeEach(() => {
    process.env.GOOGLE_ADS_CUSTOMER_ID = "1234567890";
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "fake-dev-token";
  });

  afterEach(() => {
    global.fetch = undefined as unknown as typeof fetch;
    process.env.GOOGLE_ADS_CUSTOMER_ID = originalEnv.GOOGLE_ADS_CUSTOMER_ID;
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = originalEnv.GOOGLE_ADS_DEVELOPER_TOKEN;
    vi.restoreAllMocks();
  });

  it("only ever calls the :search endpoint, never :mutate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(searchResponse([]));
    global.fetch = fetchMock as unknown as typeof fetch;

    await getAdsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(":search");
    expect(String(url)).not.toContain(":mutate");
    expect((init as RequestInit).method).toBe("POST");
  });

  it("never sends a login-customer-id header (service account has direct access)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(searchResponse([]));
    global.fetch = fetchMock as unknown as typeof fetch;

    await getAdsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" });

    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["login-customer-id"]).toBeUndefined();
  });

  it("buckets rows into current vs previous period by segments.date", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      searchResponse([
        {
          campaign: { id: "1", name: "Campaign A", status: "ENABLED" },
          metrics: { impressions: "100", clicks: "10", costMicros: "5000000", conversions: "1", conversionsValue: "0" },
          segments: { date: "2026-08-05" }, // in currentPeriod
        },
        {
          campaign: { id: "1", name: "Campaign A", status: "ENABLED" },
          metrics: { impressions: "50", clicks: "5", costMicros: "2000000", conversions: "0", conversionsValue: "0" },
          segments: { date: "2026-08-02" }, // in previousPeriod
        },
      ]),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { current, previous } = await getAdsMetrics(
      { start: "2026-08-01", end: "2026-08-03" },
      { start: "2026-08-04", end: "2026-08-06" },
    );

    expect(current.totals.impressions).toBe(100);
    expect(current.totals.clicks).toBe(10);
    expect(previous.totals.impressions).toBe(50);
    expect(previous.totals.clicks).toBe(5);
  });

  it("aggregates multiple date-rows for the same campaign into one campaign entry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      searchResponse([
        {
          campaign: { id: "1", name: "Campaign A", status: "ENABLED" },
          metrics: { impressions: "100", clicks: "10", costMicros: "5000000", conversions: "1", conversionsValue: "0" },
          segments: { date: "2026-08-04" },
        },
        {
          campaign: { id: "1", name: "Campaign A", status: "ENABLED" },
          metrics: { impressions: "80", clicks: "8", costMicros: "4000000", conversions: "1", conversionsValue: "0" },
          segments: { date: "2026-08-05" },
        },
      ]),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { current } = await getAdsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" });

    expect(current.campaigns).toHaveLength(1);
    expect(current.campaigns[0].impressions).toBe(180);
    expect(current.campaigns[0].clicks).toBe(18);
  });

  it("handles an empty result set gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue(searchResponse([])) as unknown as typeof fetch;
    const { current, previous } = await getAdsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" });
    expect(current.totals.impressions).toBe(0);
    expect(previous.campaigns).toEqual([]);
  });

  it("throws AdsApiError with the upstream status on a non-200 response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { status: "PERMISSION_DENIED" } }), { status: 403 }),
    ) as unknown as typeof fetch;

    await expect(
      getAdsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" }),
    ).rejects.toBeInstanceOf(AdsApiError);
  });

  it("throws when required env vars are missing", async () => {
    delete process.env.GOOGLE_ADS_CUSTOMER_ID;
    await expect(
      getAdsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" }),
    ).rejects.toThrow(/not configured/);
  });
});
