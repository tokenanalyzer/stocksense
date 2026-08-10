import { createHash } from "node:crypto";
import type { MarketingSnapshot } from "../marketing/snapshot.js";
import type { AnalysisOutput } from "./analysisSchema.js";

/**
 * In-memory cache boundary only (Phase 1b design report, section 7) — no
 * Redis/KV/external infra, per the explicit "do NOT introduce unnecessary
 * external infrastructure" instruction. This survives only within one warm
 * serverless instance's lifetime; a cold start or a different instance
 * simply misses and calls the AI again. That's an accepted tradeoff at this
 * traffic volume (a few calls/day) — the goal is avoiding an identical
 * re-analysis on a same-instance dashboard refresh, not a durable cache.
 */

interface CacheEntry {
  hash: string;
  output: AnalysisOutput;
}

let lastEntry: CacheEntry | null = null;

/**
 * Hashes only the deterministic, meaning-bearing parts of the snapshot —
 * excludes generatedAt/dataFreshness, which change on every call even when
 * the underlying metrics haven't moved at all.
 */
export function hashSnapshotForCache(snapshot: MarketingSnapshot): string {
  const stable = {
    currentPeriod: snapshot.currentPeriod,
    previousPeriod: snapshot.previousPeriod,
    metrics: snapshot.metrics,
    dataConfidence: snapshot.dataConfidence,
    anomalies: snapshot.anomalies,
  };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

export function getCachedAnalysis(hash: string): AnalysisOutput | null {
  return lastEntry && lastEntry.hash === hash ? lastEntry.output : null;
}

export function setCachedAnalysis(hash: string, output: AnalysisOutput): void {
  lastEntry = { hash, output };
}

/** Test-only: reset module-level cache state between test cases. */
export function clearAnalysisCache(): void {
  lastEntry = null;
}
