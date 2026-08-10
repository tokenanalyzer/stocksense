import type { NormalizedMetrics } from "./metrics.js";

/**
 * Deterministic anomaly rules. Every rule is a pure function that either
 * returns a fully-populated Anomaly or null — there is no code path that
 * produces an anomaly without real currentValue/comparisonValue/threshold
 * evidence behind it. If either input value needed for a rule is null
 * (unavailable/unmeasurable), the rule returns null rather than guessing.
 *
 * Thresholds are initial defaults (see design report, section K) — provisional
 * until tuned against real traffic/spend history.
 */

export type Severity = "low" | "medium" | "high";

export interface Anomaly {
  metric: string;
  currentValue: number;
  comparisonValue: number;
  rule: string;
  threshold: number;
  severity: Severity;
  evidence: string;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function checkSpendSwing(current: NormalizedMetrics, previous: NormalizedMetrics): Anomaly | null {
  if (current.adSpend === null || previous.adSpend === null) return null;
  const change = pctChange(current.adSpend, previous.adSpend);
  if (change === null) return null;

  const abs = Math.abs(change);
  if (abs <= 30) return null;

  return {
    metric: "ad_spend",
    currentValue: current.adSpend,
    comparisonValue: previous.adSpend,
    rule: "spend_swing",
    threshold: 30,
    severity: abs > 60 ? "high" : "medium",
    evidence: `Ad spend changed ${change.toFixed(1)}% period-over-period (₹${previous.adSpend.toFixed(2)} → ₹${current.adSpend.toFixed(2)}).`,
  };
}

export function checkCtrDeterioration(current: NormalizedMetrics, previous: NormalizedMetrics): Anomaly | null {
  if (current.ctr === null || previous.ctr === null) return null;
  if (current.ctr >= previous.ctr * 0.7) return null;

  return {
    metric: "ctr",
    currentValue: current.ctr,
    comparisonValue: previous.ctr,
    rule: "ctr_deterioration",
    threshold: 0.7,
    severity: "medium",
    evidence: `CTR dropped from ${(previous.ctr * 100).toFixed(2)}% to ${(current.ctr * 100).toFixed(2)}% (more than a 30% relative decline).`,
  };
}

export function checkCpcSpike(current: NormalizedMetrics, previous: NormalizedMetrics): Anomaly | null {
  if (current.cpc === null || previous.cpc === null) return null;
  if (current.cpc <= previous.cpc * 1.5) return null;

  const ratio = current.cpc / previous.cpc;
  return {
    metric: "cpc",
    currentValue: current.cpc,
    comparisonValue: previous.cpc,
    rule: "cpc_spike",
    threshold: 1.5,
    severity: ratio > 2 ? "high" : "medium",
    evidence: `CPC rose from ₹${previous.cpc.toFixed(2)} to ₹${current.cpc.toFixed(2)} (${ratio.toFixed(2)}x).`,
  };
}

export function checkLeadVolumeDrop(current: NormalizedMetrics, previous: NormalizedMetrics): Anomaly | null {
  if (previous.leads === 0) return null;
  if (current.leads >= previous.leads * 0.5) return null;

  return {
    metric: "leads",
    currentValue: current.leads,
    comparisonValue: previous.leads,
    rule: "lead_volume_drop",
    threshold: 0.5,
    severity: "high",
    evidence: `Leads dropped from ${previous.leads} to ${current.leads} (more than 50% decline).`,
  };
}

export function checkCostPerLeadSpike(current: NormalizedMetrics, previous: NormalizedMetrics): Anomaly | null {
  if (current.costPerLead === null || previous.costPerLead === null) return null;
  if (current.costPerLead <= previous.costPerLead * 1.5) return null;

  return {
    metric: "cost_per_lead",
    currentValue: current.costPerLead,
    comparisonValue: previous.costPerLead,
    rule: "cost_per_lead_spike",
    threshold: 1.5,
    severity: "medium",
    evidence: `Cost per lead rose from ₹${previous.costPerLead.toFixed(2)} to ₹${current.costPerLead.toFixed(2)}.`,
  };
}

export function checkAdsSheetsMismatch(current: NormalizedMetrics): Anomaly | null {
  const denominator = Math.max(current.leads, 1);
  const diff = Math.abs(current.adsConversions - current.leads);
  const ratio = diff / denominator;
  if (ratio <= 0.3) return null;

  return {
    metric: "ads_conversions_vs_sheet_leads",
    currentValue: current.adsConversions,
    comparisonValue: current.leads,
    rule: "ads_sheets_mismatch",
    threshold: 0.3,
    severity: "medium",
    evidence: `Google Ads reports ${current.adsConversions} conversions but the Leads sheet has ${current.leads} rows for the same period (>30% mismatch) — possible tracking/attribution gap.`,
  };
}

export function checkTrafficLeadMismatch(current: NormalizedMetrics, previous: NormalizedMetrics): Anomaly | null {
  if (current.sessions === null || previous.sessions === null) return null;
  if (previous.sessions === 0 || previous.leads === 0) return null;

  const sessionsChange = pctChange(current.sessions, previous.sessions);
  const leadsChange = pctChange(current.leads, previous.leads);
  if (sessionsChange === null || leadsChange === null) return null;
  if (!(sessionsChange > 20 && leadsChange < 5)) return null;

  return {
    metric: "sessions_vs_leads",
    currentValue: sessionsChange,
    comparisonValue: leadsChange,
    rule: "traffic_lead_mismatch",
    threshold: 20,
    severity: leadsChange < 0 ? "medium" : "low",
    evidence: `Sessions grew ${sessionsChange.toFixed(1)}% but leads only changed ${leadsChange.toFixed(1)}% — possible funnel drop-off.`,
  };
}

export function detectAnomalies(current: NormalizedMetrics, previous: NormalizedMetrics): Anomaly[] {
  const checks = [
    checkSpendSwing(current, previous),
    checkCtrDeterioration(current, previous),
    checkCpcSpike(current, previous),
    checkLeadVolumeDrop(current, previous),
    checkCostPerLeadSpike(current, previous),
    checkAdsSheetsMismatch(current),
    checkTrafficLeadMismatch(current, previous),
  ];

  return checks.filter((a): a is Anomaly => a !== null);
}
