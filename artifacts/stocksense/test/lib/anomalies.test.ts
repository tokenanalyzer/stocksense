import { describe, it, expect } from "vitest";
import {
  checkSpendSwing,
  checkCtrDeterioration,
  checkCpcSpike,
  checkLeadVolumeDrop,
  checkCostPerLeadSpike,
  checkAdsSheetsMismatch,
  checkTrafficLeadMismatch,
  detectAnomalies,
} from "../../api/_lib/anomalies";
import type { NormalizedMetrics } from "../../api/_lib/metrics";

function metrics(overrides: Partial<NormalizedMetrics> = {}): NormalizedMetrics {
  return {
    adSpend: 100,
    clicks: 100,
    impressions: 2000,
    ctr: 0.05,
    cpc: 1,
    leads: 20,
    adsConversions: 20,
    conversionRate: 0.2,
    costPerLead: 5,
    activeUsers: 200,
    sessions: 250,
    qualifiedEvents: 15,
    ...overrides,
  };
}

describe("checkSpendSwing", () => {
  it("flags medium severity for a >30% increase", () => {
    const a = checkSpendSwing(metrics({ adSpend: 140 }), metrics({ adSpend: 100 }));
    expect(a?.severity).toBe("medium");
    expect(a?.metric).toBe("ad_spend");
    expect(a?.threshold).toBe(30);
  });

  it("flags high severity for a >60% increase", () => {
    const a = checkSpendSwing(metrics({ adSpend: 200 }), metrics({ adSpend: 100 }));
    expect(a?.severity).toBe("high");
  });

  it("does not flag a small change", () => {
    expect(checkSpendSwing(metrics({ adSpend: 110 }), metrics({ adSpend: 100 }))).toBeNull();
  });

  it("does not flag when either value is null", () => {
    expect(checkSpendSwing(metrics({ adSpend: null }), metrics({ adSpend: 100 }))).toBeNull();
  });
});

describe("checkCtrDeterioration", () => {
  it("flags when CTR drops more than 30% relatively", () => {
    const a = checkCtrDeterioration(metrics({ ctr: 0.02 }), metrics({ ctr: 0.05 }));
    expect(a?.severity).toBe("medium");
    expect(a?.metric).toBe("ctr");
  });

  it("does not flag a mild CTR drop", () => {
    expect(checkCtrDeterioration(metrics({ ctr: 0.045 }), metrics({ ctr: 0.05 }))).toBeNull();
  });

  it("does not flag when CTR improves", () => {
    expect(checkCtrDeterioration(metrics({ ctr: 0.06 }), metrics({ ctr: 0.05 }))).toBeNull();
  });
});

describe("checkCpcSpike", () => {
  it("flags medium for a 1.5x+ CPC rise", () => {
    const a = checkCpcSpike(metrics({ cpc: 1.6 }), metrics({ cpc: 1 }));
    expect(a?.severity).toBe("medium");
  });

  it("flags high for a 2x+ CPC rise", () => {
    const a = checkCpcSpike(metrics({ cpc: 2.5 }), metrics({ cpc: 1 }));
    expect(a?.severity).toBe("high");
  });

  it("does not flag a small CPC rise", () => {
    expect(checkCpcSpike(metrics({ cpc: 1.1 }), metrics({ cpc: 1 }))).toBeNull();
  });
});

describe("checkLeadVolumeDrop", () => {
  it("flags a >50% drop as high severity", () => {
    const a = checkLeadVolumeDrop(metrics({ leads: 5 }), metrics({ leads: 20 }));
    expect(a?.severity).toBe("high");
    expect(a?.metric).toBe("leads");
  });

  it("does not flag a mild drop", () => {
    expect(checkLeadVolumeDrop(metrics({ leads: 15 }), metrics({ leads: 20 }))).toBeNull();
  });

  it("does not flag when previous leads was zero (nothing to compare)", () => {
    expect(checkLeadVolumeDrop(metrics({ leads: 0 }), metrics({ leads: 0 }))).toBeNull();
  });
});

describe("checkCostPerLeadSpike", () => {
  it("flags a 1.5x+ cost-per-lead rise", () => {
    const a = checkCostPerLeadSpike(metrics({ costPerLead: 8 }), metrics({ costPerLead: 5 }));
    expect(a?.severity).toBe("medium");
  });

  it("does not flag a small rise", () => {
    expect(checkCostPerLeadSpike(metrics({ costPerLead: 5.5 }), metrics({ costPerLead: 5 }))).toBeNull();
  });
});

describe("checkAdsSheetsMismatch", () => {
  it("flags when Ads conversions and Sheet leads diverge by more than 30%", () => {
    const a = checkAdsSheetsMismatch(metrics({ adsConversions: 20, leads: 5 }));
    expect(a?.metric).toBe("ads_conversions_vs_sheet_leads");
    expect(a?.severity).toBe("medium");
  });

  it("does not flag when they roughly agree", () => {
    expect(checkAdsSheetsMismatch(metrics({ adsConversions: 20, leads: 19 }))).toBeNull();
  });
});

describe("checkTrafficLeadMismatch", () => {
  it("flags when sessions grow but leads stay flat", () => {
    const a = checkTrafficLeadMismatch(
      metrics({ sessions: 300, leads: 20 }),
      metrics({ sessions: 200, leads: 20 }),
    );
    expect(a?.metric).toBe("sessions_vs_leads");
  });

  it("does not flag when both grow proportionally", () => {
    expect(
      checkTrafficLeadMismatch(metrics({ sessions: 300, leads: 30 }), metrics({ sessions: 200, leads: 20 })),
    ).toBeNull();
  });

  it("does not flag when previous sessions or leads is zero", () => {
    expect(checkTrafficLeadMismatch(metrics({ sessions: 100 }), metrics({ sessions: 0 }))).toBeNull();
  });
});

describe("detectAnomalies", () => {
  it("returns an empty array when nothing is anomalous", () => {
    expect(detectAnomalies(metrics(), metrics())).toEqual([]);
  });

  it("returns every fully-populated anomaly that fires, and nothing else", () => {
    const current = metrics({ adSpend: 250, ctr: 0.01, cpc: 3, leads: 3, costPerLead: 83.3, adsConversions: 20 });
    const previous = metrics({ adSpend: 100, ctr: 0.05, cpc: 1, leads: 20, costPerLead: 5 });
    const anomalies = detectAnomalies(current, previous);

    expect(anomalies.length).toBeGreaterThan(0);
    for (const a of anomalies) {
      expect(a.metric).toBeTruthy();
      expect(typeof a.currentValue).toBe("number");
      expect(typeof a.comparisonValue).toBe("number");
      expect(a.rule).toBeTruthy();
      expect(typeof a.threshold).toBe("number");
      expect(["low", "medium", "high"]).toContain(a.severity);
      expect(a.evidence).toBeTruthy();
    }
  });
});
