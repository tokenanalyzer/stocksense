import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { MarketingSnapshot } from "../../api/marketing/snapshot";
import type { AnalysisOutput } from "../../api/_lib/analysisSchema";

const { createMock, RateLimitError, APIConnectionError, APIError } = vi.hoisted(() => {
  class RateLimitError extends Error {
    constructor(msg?: string) {
      super(msg);
      this.name = "RateLimitError";
    }
  }
  class APIConnectionError extends Error {
    constructor(msg?: string) {
      super(msg);
      this.name = "APIConnectionError";
    }
  }
  class APIError extends Error {
    status?: number;
    constructor(msg?: string, status?: number) {
      super(msg);
      this.name = "APIError";
      this.status = status;
    }
  }
  return { createMock: vi.fn(), RateLimitError, APIConnectionError, APIError };
});

vi.mock("@anthropic-ai/sdk", () => {
  class FakeAnthropic {
    messages = { create: createMock };
    static RateLimitError = RateLimitError;
    static APIConnectionError = APIConnectionError;
    static APIError = APIError;
  }
  return { default: FakeAnthropic };
});

import { generateAnalysis, validateEvidenceReferences, AnalysisError } from "../../api/_lib/analysisEngine";

const originalApiKey = process.env.ANTHROPIC_API_KEY;

function baseSnapshot(overrides: Partial<MarketingSnapshot> = {}): MarketingSnapshot {
  return {
    generatedAt: "2026-08-10T00:00:00.000Z",
    currentPeriod: { start: "2026-08-04", end: "2026-08-10" },
    previousPeriod: { start: "2026-07-28", end: "2026-08-03" },
    metrics: {
      current: { adSpend: 100, clicks: 50, impressions: 1000, ctr: 0.05, cpc: 2, leads: 3, adsConversions: 20, conversionRate: 0.2, costPerLead: 33.3, activeUsers: 50, sessions: 60, qualifiedEvents: 5 },
      previous: { adSpend: 100, clicks: 50, impressions: 1000, ctr: 0.05, cpc: 2, leads: 20, adsConversions: 20, conversionRate: 0.2, costPerLead: 5, activeUsers: 50, sessions: 60, qualifiedEvents: 5 },
      deltas: { adSpend: 0, clicks: 0, impressions: 0, ctr: 0, cpc: 0, leads: -85, adsConversions: 0, conversionRate: 0, costPerLead: 566, activeUsers: 0, sessions: 0, qualifiedEvents: 0 },
    },
    dataFreshness: { ads: "2026-08-10T00:00:00.000Z", ga4: "2026-08-10T00:00:00.000Z", sheets: "2026-08-10T00:00:00.000Z" },
    dataConfidence: { ads: "ok", ga4: "ok", sheets: "ok" },
    anomalies: [
      { metric: "leads", currentValue: 3, comparisonValue: 20, rule: "lead_volume_drop", threshold: 0.5, severity: "high", evidence: "Leads dropped from 20 to 3." },
    ],
    ...overrides,
  };
}

function validAnalysis(): AnalysisOutput {
  return {
    facts: [{ statement: "Leads dropped from 20 to 3.", supportingMetrics: ["metrics.current.leads", "metrics.previous.leads"] }],
    observations: [{ statement: "Cost per lead rose sharply.", supportingMetrics: ["metrics.deltas.costPerLead"] }],
    hypotheses: [{ statement: "May indicate a landing page or tracking issue.", relatedTo: ["anomalies[0]"], confidence: "medium" }],
    recommendations: [{ statement: "Investigate the lead volume drop.", severity: "high", relatedAnomalies: ["anomalies.leads"], timePeriod: "2026-08-04 to 2026-08-10" }],
  };
}

function textResponse(text: string, stopReason: string = "end_turn") {
  return { stop_reason: stopReason, content: [{ type: "text", text }] };
}

describe("generateAnalysis", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "fake-test-key";
    createMock.mockReset();
  });

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
    vi.restoreAllMocks();
  });

  it("returns a valid analysis on the first successful call", async () => {
    createMock.mockResolvedValue(textResponse(JSON.stringify(validAnalysis())));
    const result = await generateAnalysis(baseSnapshot());
    expect(result.facts).toHaveLength(1);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("throws analysis_not_configured and never calls the provider when the API key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(generateAnalysis(baseSnapshot())).rejects.toMatchObject({ code: "analysis_not_configured" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("throws analysis_no_data and never calls the provider when every source is unavailable", async () => {
    const snapshot = baseSnapshot({ dataConfidence: { ads: "unavailable", ga4: "unavailable", sheets: "unavailable" } });
    await expect(generateAnalysis(snapshot)).rejects.toMatchObject({ code: "analysis_no_data" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("retries once on malformed (non-JSON) output, then succeeds", async () => {
    createMock
      .mockResolvedValueOnce(textResponse("not valid json"))
      .mockResolvedValueOnce(textResponse(JSON.stringify(validAnalysis())));
    const result = await generateAnalysis(baseSnapshot());
    expect(result.facts).toHaveLength(1);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("fails with analysis_invalid after malformed output on both the original call and the retry", async () => {
    createMock.mockResolvedValue(textResponse("not valid json"));
    await expect(generateAnalysis(baseSnapshot())).rejects.toMatchObject({ code: "analysis_invalid" });
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("retries once when the model hallucinates a metric key not present in the snapshot, then succeeds", async () => {
    const hallucinated = validAnalysis();
    hallucinated.facts[0].supportingMetrics = ["metrics.current.totallyMadeUpMetric"];
    createMock
      .mockResolvedValueOnce(textResponse(JSON.stringify(hallucinated)))
      .mockResolvedValueOnce(textResponse(JSON.stringify(validAnalysis())));
    const result = await generateAnalysis(baseSnapshot());
    expect(result.facts[0].supportingMetrics).toEqual(["metrics.current.leads", "metrics.previous.leads"]);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("fails with analysis_invalid when the hallucinated reference persists after the retry", async () => {
    const hallucinated = validAnalysis();
    hallucinated.facts[0].supportingMetrics = ["metrics.current.totallyMadeUpMetric"];
    createMock.mockResolvedValue(textResponse(JSON.stringify(hallucinated)));
    await expect(generateAnalysis(baseSnapshot())).rejects.toMatchObject({ code: "analysis_invalid" });
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("treats a stop_reason of refusal as an invalid response, not a crash", async () => {
    createMock.mockResolvedValue(textResponse("", "refusal"));
    await expect(generateAnalysis(baseSnapshot())).rejects.toMatchObject({ code: "analysis_invalid" });
  });

  it("maps a RateLimitError to analysis_rate_limited without retrying", async () => {
    createMock.mockRejectedValue(new RateLimitError("rate limited"));
    await expect(generateAnalysis(baseSnapshot())).rejects.toMatchObject({ code: "analysis_rate_limited" });
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("maps a timeout-flavored APIConnectionError to analysis_timeout", async () => {
    createMock.mockRejectedValue(new APIConnectionError("Request timed out"));
    await expect(generateAnalysis(baseSnapshot())).rejects.toMatchObject({ code: "analysis_timeout" });
  });

  it("maps a non-timeout APIConnectionError to analysis_provider_unavailable", async () => {
    createMock.mockRejectedValue(new APIConnectionError("network unreachable"));
    await expect(generateAnalysis(baseSnapshot())).rejects.toMatchObject({ code: "analysis_provider_unavailable" });
  });

  it("maps a generic APIError (e.g. 5xx/overloaded) to analysis_provider_unavailable", async () => {
    createMock.mockRejectedValue(new APIError("overloaded", 529));
    await expect(generateAnalysis(baseSnapshot())).rejects.toMatchObject({ code: "analysis_provider_unavailable" });
  });

  it("never sends anything PII-shaped to the provider, even with a maximal snapshot", async () => {
    createMock.mockResolvedValue(textResponse(JSON.stringify(validAnalysis())));
    await generateAnalysis(baseSnapshot());
    const [request] = createMock.mock.calls[0];
    const sentText = JSON.stringify(request);
    expect(sentText).not.toMatch(/@gmail\.com|@yahoo\.com|\+91[\s-]?\d{10}|phone|email|name["']?\s*:/i);
  });
});

describe("validateEvidenceReferences", () => {
  it("accepts references that exist in the snapshot", () => {
    expect(validateEvidenceReferences(validAnalysis(), baseSnapshot())).toBe(true);
  });

  it("rejects a reference to a metric key that does not exist", () => {
    const bad = validAnalysis();
    bad.observations[0].supportingMetrics = ["metrics.current.doesNotExist"];
    expect(validateEvidenceReferences(bad, baseSnapshot())).toBe(false);
  });

  it("rejects a reference to an anomaly index that does not exist", () => {
    const bad = validAnalysis();
    bad.hypotheses[0].relatedTo = ["anomalies[5]"];
    expect(validateEvidenceReferences(bad, baseSnapshot())).toBe(false);
  });
});

describe("AnalysisError", () => {
  it("carries its error code as a property, not just in the message", () => {
    const err = new AnalysisError("analysis_timeout", "took too long");
    expect(err.code).toBe("analysis_timeout");
    expect(err).toBeInstanceOf(Error);
  });
});
