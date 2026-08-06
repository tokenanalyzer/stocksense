/**
 * Typed mirror of docs/analytics-event-taxonomy.md (v1.1.0).
 *
 * This is the enforcement mechanism for "do not invent new event names
 * during coding" — trackEvent() in analytics.ts only accepts keys of
 * AnalyticsEventParamsMap, so a name or parameter shape that isn't in the
 * frozen taxonomy fails to compile instead of silently shipping.
 *
 * Keep this in lockstep with the taxonomy doc: edit the doc first, bump its
 * version, then mirror the change here.
 */

export type FormLocation = "gate" | "inline" | "booking_modal";
export type CtaLocation =
  | "header"
  | "header_mobile"
  | "hero"
  | "quote_card"
  | "step_card"
  | "faq_cta"
  | "footer";
export type WhatsappClickLocation = "footer" | "floating_button";
export type LeadSubmitErrorType = "timeout" | "network_error" | "invalid_response" | "backend_error";

export interface AnalyticsEventParamsMap {
  gate_view: Record<string, never>;
  form_start: { form_location: FormLocation };
  lead_submit_success: { form_location: FormLocation };
  lead_submit_error: { form_location: FormLocation; error_type?: LeadSubmitErrorType };
  whatsapp_click: { click_location: WhatsappClickLocation };
  nav_cta_click: { cta_location: CtaLocation };
  scroll_75: Record<string, never>;
}

export type AnalyticsEventName = keyof AnalyticsEventParamsMap;
