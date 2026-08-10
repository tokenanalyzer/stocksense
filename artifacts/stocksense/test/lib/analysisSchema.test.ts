import { describe, it, expect } from "vitest";
import { AnalysisOutputSchema } from "../../api/_lib/analysisSchema";

function validOutput() {
  return {
    facts: [{ statement: "Ad spend was ₹100", supportingMetrics: ["metrics.current.adSpend"] }],
    observations: [{ statement: "Spend rose vs previous period", supportingMetrics: ["metrics.deltas.adSpend"] }],
    hypotheses: [{ statement: "May be due to a new campaign", relatedTo: ["metrics.current.adSpend"], confidence: "low" as const }],
    recommendations: [
      { statement: "Review campaign budgets", severity: "medium" as const, relatedAnomalies: [], timePeriod: "2026-08-01 to 2026-08-07" },
    ],
  };
}

describe("AnalysisOutputSchema", () => {
  it("accepts a fully valid output", () => {
    expect(AnalysisOutputSchema.safeParse(validOutput()).success).toBe(true);
  });

  it("rejects a fact with an empty supportingMetrics array", () => {
    const bad = validOutput();
    bad.facts[0].supportingMetrics = [];
    expect(AnalysisOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an observation with no supportingMetrics field", () => {
    const bad = validOutput();
    // @ts-expect-error intentionally malformed for the test
    delete bad.observations[0].supportingMetrics;
    expect(AnalysisOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a hypothesis with an empty relatedTo array", () => {
    const bad = validOutput();
    bad.hypotheses[0].relatedTo = [];
    expect(AnalysisOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a hypothesis with an invalid confidence value", () => {
    const bad = validOutput() as unknown as { hypotheses: { confidence: string }[] };
    bad.hypotheses[0].confidence = "certain";
    expect(AnalysisOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("allows an empty recommendations array (no anomaly -> nothing to recommend)", () => {
    const ok = validOutput();
    ok.recommendations = [];
    expect(AnalysisOutputSchema.safeParse(ok).success).toBe(true);
  });

  it("rejects a recommendation missing severity", () => {
    const bad = validOutput();
    // @ts-expect-error intentionally malformed for the test
    delete bad.recommendations[0].severity;
    expect(AnalysisOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("allows empty facts/observations/hypotheses arrays (nothing notable this period)", () => {
    const ok = { facts: [], observations: [], hypotheses: [], recommendations: [] };
    expect(AnalysisOutputSchema.safeParse(ok).success).toBe(true);
  });
});
