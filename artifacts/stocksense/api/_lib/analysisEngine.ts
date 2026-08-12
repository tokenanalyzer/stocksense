import Anthropic from "@anthropic-ai/sdk";
import { getClaudeClient, CLAUDE_MODEL } from "./claudeClient.js";
import { AnalysisOutputSchema, type AnalysisOutput } from "./analysisSchema.js";
import type { MarketingSnapshot } from "../marketing/snapshot.js";
import type { NormalizedMetrics } from "./metrics.js";

/**
 * The Anthropic SDK's zodOutputFormat() helper requires Zod v4 (it targets
 * Zod's newer $ZodTypeInternals shape). This repo is pinned to Zod v3
 * (used throughout the app's forms via @hookform/resolvers) and upgrading
 * it is out of scope for this phase, so the JSON Schema for
 * output_config.format is written by hand here and mirrors
 * analysisSchema.ts's zod shape exactly. The model's raw JSON response is
 * still fully re-validated against the real (v3) AnalysisOutputSchema
 * below — this hand-written schema only constrains what the API asks the
 * model to produce, it is not the source of truth for correctness.
 */
const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    facts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement: { type: "string" },
          supportingMetrics: { type: "array", items: { type: "string" } },
        },
        required: ["statement", "supportingMetrics"],
        additionalProperties: false,
      },
    },
    observations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement: { type: "string" },
          supportingMetrics: { type: "array", items: { type: "string" } },
        },
        required: ["statement", "supportingMetrics"],
        additionalProperties: false,
      },
    },
    hypotheses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement: { type: "string" },
          relatedTo: { type: "array", items: { type: "string" } },
          confidence: { type: "string", description: "one of: low, medium, high" },
        },
        required: ["statement", "relatedTo", "confidence"],
        additionalProperties: false,
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement: { type: "string" },
          severity: { type: "string", description: "one of: low, medium, high" },
          relatedAnomalies: { type: "array", items: { type: "string" } },
          timePeriod: { type: "string" },
        },
        required: ["statement", "severity", "relatedAnomalies", "timePeriod"],
        additionalProperties: false,
      },
    },
  },
  required: ["facts", "observations", "hypotheses", "recommendations"],
  additionalProperties: false,
} as const;

/**
 * AI Analyst engine (Phase 1b). Consumes ONLY the already-deterministic
 * MarketingSnapshot produced by Phase 1a — never raw Ads/GA4/Sheets
 * responses, never Sheets PII (SheetsMetrics has no PII fields to forward in
 * the first place). One-shot text-in/structured-out call: no tools, no
 * agent loop, no ability to execute anything it recommends.
 */

export type AnalysisErrorCode =
  | "analysis_not_configured"
  | "analysis_no_data"
  | "analysis_timeout"
  | "analysis_rate_limited"
  | "analysis_provider_unavailable"
  | "analysis_invalid";

export class AnalysisError extends Error {
  constructor(
    public readonly code: AnalysisErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AnalysisError";
  }
}

const SYSTEM_PROMPT = `You are a marketing data analyst for StockSense, a stock-market investing education platform. You are given a JSON "MarketingSnapshot" containing deterministic marketing metrics (Google Ads, GA4, and lead-sheet data) that has already been computed by other code. You never compute any numbers yourself — your job is to explain and interpret data that is already correct, not to calculate it.

Follow these rules strictly:

1. Use ONLY numbers, metric names, and anomaly entries that literally appear in the snapshot JSON you are given. Never invent a number, percentage, or metric that is not present in the input.
2. Every item in "facts", "observations", and "hypotheses" MUST cite the exact snapshot field(s) it is based on as evidence keys — for example "metrics.current.costPerLead", "metrics.deltas.leads", or "anomalies[0]". An item with no evidence is not allowed and will be rejected.
3. Distinguish four categories precisely:
   - FACT: a direct, literal restatement of a value in the snapshot. No interpretation.
   - OBSERVATION: a pattern directly supported by two or more facts in the snapshot (e.g. comparing current vs previous).
   - HYPOTHESIS: a possible explanation for an observation. Always phrase it as uncertain ("may be due to...", "could indicate..."). NEVER present a hypothesis as a confirmed fact.
   - RECOMMENDATION: a suggested action for a HUMAN to consider taking. Never phrase it as something that will happen automatically, and never claim you are taking or have taken the action yourself.
4. If a data source's confidence is "unavailable" in the snapshot, say so explicitly rather than treating missing data as zero or as normal.
5. Do not recommend or reference any action outside marketing analysis (no code changes, no infrastructure changes, no account/billing actions).
6. Respond only in the required structured JSON format — no prose outside it.`;

function buildUserPrompt(snapshot: MarketingSnapshot): string {
  return `Here is the current MarketingSnapshot as JSON. Analyze ONLY this data — do not reference anything outside it.\n\n${JSON.stringify(snapshot)}`;
}

const RETRY_INSTRUCTION =
  "Your previous response was invalid: either it did not match the required JSON schema, or it cited an evidence key that does not literally exist in the snapshot above. Return a corrected response using ONLY evidence keys that appear in the snapshot's metrics.current, metrics.previous, metrics.deltas, or anomalies fields, and ensure every fact/observation/hypothesis has at least one evidence key.";

/** Every metrics.current.*, metrics.previous.*, metrics.deltas.*, and anomalies[i]/anomalies.<metric> key the model is allowed to cite. */
function collectValidReferenceKeys(snapshot: MarketingSnapshot): Set<string> {
  const keys = new Set<string>();
  const metricNames = Object.keys(snapshot.metrics.current) as (keyof NormalizedMetrics)[];

  for (const name of metricNames) {
    keys.add(`metrics.current.${name}`);
    keys.add(`metrics.previous.${name}`);
    keys.add(`metrics.deltas.${name}`);
  }

  snapshot.anomalies.forEach((anomaly, i) => {
    keys.add(`anomalies[${i}]`);
    keys.add(`anomalies.${anomaly.metric}`);
  });

  return keys;
}

/**
 * Semantic evidence check beyond zod's "non-empty array" validation: every
 * cited key must actually exist in the snapshot that was sent. Catches a
 * schema-valid but hallucinated reference (e.g. a metric name the model
 * invented) that zod alone would not reject.
 */
export function validateEvidenceReferences(output: AnalysisOutput, snapshot: MarketingSnapshot): boolean {
  const valid = collectValidReferenceKeys(snapshot);
  const allRefs = [
    ...output.facts.flatMap((f) => f.supportingMetrics),
    ...output.observations.flatMap((o) => o.supportingMetrics),
    ...output.hypotheses.flatMap((h) => h.relatedTo),
    ...output.recommendations.flatMap((r) => r.relatedAnomalies),
  ];
  return allRefs.every((ref) => valid.has(ref));
}

async function callClaude(snapshot: MarketingSnapshot, extraInstruction?: string): Promise<AnalysisOutput | null> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: extraInstruction ? `${buildUserPrompt(snapshot)}\n\n${extraInstruction}` : buildUserPrompt(snapshot),
      },
    ],
    output_config: { format: { type: "json_schema", schema: ANALYSIS_JSON_SCHEMA } },
  });

  if (response.stop_reason === "refusal") {
    return null;
  }

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
  if (!textBlock) return null;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(textBlock.text);
  } catch {
    return null;
  }

  const result = AnalysisOutputSchema.safeParse(parsedJson);
  return result.success ? result.data : null;
}

// TEMPORARY diagnostic instrumentation (2026-08-11, extended 2026-08-12) —
// remove once the analysis_provider_unavailable root cause is confirmed.
// Logs a safe error classification (constructor name, HTTP status,
// Anthropic's own semantic error.type e.g. invalid_request_error/
// authentication_error/overloaded_error, and the opaque requestID). Never
// logs request/response bodies, headers, credentials, or API keys.
//
// TEMPORARY (2026-08-12): also logs err.message for 400 invalid_request_error
// specifically, to identify the exact rejected schema field. Anthropic's 400
// validation messages for this error type only ever quote schema paths/
// property names (e.g. "schema.properties.X is not supported") — never
// request content, snapshot data, lead data, or secrets. Remove this extra
// log line once the root cause is confirmed.
function logClaudeErrorSafely(err: unknown): void {
  if (err instanceof Anthropic.APIError) {
    console.error("[analysisEngine] Claude API call failed:", {
      errorName: err.name,
      httpStatus: err.status,
      anthropicErrorType: err.type,
      requestId: err.requestID,
    });
    if (err.status === 400 && err.type === "invalid_request_error") {
      // TEMPORARY — see comment above. Safe: schema-validation message only.
      console.error("[analysisEngine] TEMP DIAGNOSTIC invalid_request_error message:", err.message);
    }
    return;
  }
  console.error("[analysisEngine] Claude API call failed:", {
    errorName: err instanceof Error ? err.name : typeof err,
  });
}

function mapClaudeError(err: unknown): AnalysisError {
  logClaudeErrorSafely(err);
  if (err instanceof Anthropic.RateLimitError) {
    return new AnalysisError("analysis_rate_limited", "Rate limited by AI provider");
  }
  if (err instanceof Anthropic.APIConnectionError) {
    const isTimeout = /timeout/i.test(err.message) || err.name === "APIConnectionTimeoutError";
    return new AnalysisError(isTimeout ? "analysis_timeout" : "analysis_provider_unavailable", err.message);
  }
  if (err instanceof Anthropic.APIError) {
    return new AnalysisError("analysis_provider_unavailable", `AI provider error (status ${err.status ?? "unknown"})`);
  }
  if (err instanceof Error) {
    return new AnalysisError("analysis_provider_unavailable", err.message);
  }
  return new AnalysisError("analysis_provider_unavailable", "Unknown AI provider error");
}

/**
 * Generates the AI analysis for an already-built MarketingSnapshot.
 * - Refuses to call the AI at all if every source is unavailable (no data to analyze).
 * - Exactly one retry on schema/evidence failure, per the approved design — a
 *   second failure is a hard error, not a longer retry loop.
 * - Provider errors (timeout/rate-limit/5xx) are never retried here.
 */
export async function generateAnalysis(snapshot: MarketingSnapshot): Promise<AnalysisOutput> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AnalysisError("analysis_not_configured", "ANTHROPIC_API_KEY is not configured");
  }

  const hasAnyData =
    snapshot.dataConfidence.ads === "ok" || snapshot.dataConfidence.ga4 === "ok" || snapshot.dataConfidence.sheets === "ok";
  if (!hasAnyData) {
    throw new AnalysisError("analysis_no_data", "No data sources are available to analyze");
  }

  let output: AnalysisOutput | null;
  try {
    output = await callClaude(snapshot);
  } catch (err) {
    throw mapClaudeError(err);
  }

  if (output === null || !validateEvidenceReferences(output, snapshot)) {
    try {
      output = await callClaude(snapshot, RETRY_INSTRUCTION);
    } catch (err) {
      throw mapClaudeError(err);
    }

    if (output === null || !validateEvidenceReferences(output, snapshot)) {
      throw new AnalysisError("analysis_invalid", "Model output failed schema or evidence validation after one retry");
    }
  }

  return output;
}
