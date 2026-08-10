import { z } from "zod";

/**
 * Structured output contract for the AI Analyst (Phase 1b design report,
 * section 3/4). Every fact/observation/hypothesis must cite at least one
 * evidence key pointing back into the MarketingSnapshot that was sent to the
 * model — enforced here at the schema level (an empty evidence array fails
 * validation before any AI text is trusted), and again at the semantic level
 * by validateEvidenceReferences() in analysisEngine.ts (an evidence key that
 * doesn't actually exist in the snapshot still fails, even though it would
 * pass this schema).
 */

const FactOrObservationSchema = z.object({
  statement: z.string().min(1),
  supportingMetrics: z.array(z.string()).min(1),
});

const HypothesisSchema = z.object({
  statement: z.string().min(1),
  relatedTo: z.array(z.string()).min(1),
  confidence: z.enum(["low", "medium", "high"]),
});

const RecommendationSchema = z.object({
  statement: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  relatedAnomalies: z.array(z.string()),
  timePeriod: z.string().min(1),
});

export const AnalysisOutputSchema = z.object({
  facts: z.array(FactOrObservationSchema),
  observations: z.array(FactOrObservationSchema),
  hypotheses: z.array(HypothesisSchema),
  recommendations: z.array(RecommendationSchema),
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
