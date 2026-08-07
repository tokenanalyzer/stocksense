# StockSense Analytics Event Taxonomy

**Version:** 1.1.0
**Status:** Frozen for Milestone 2.3/2.4 implementation
**Scope:** `artifacts/stocksense` (the public marketing site only — `/admin` is out of scope)

This is the single source of truth for event names and parameters. Code
must not invent an event name or parameter that isn't listed here — see
`src/lib/analytics-events.ts`, which encodes this table as TypeScript types
so an invented name fails to compile rather than silently shipping.

To add or change an event: edit this file first, bump the version, add a
changelog entry, *then* update `analytics-events.ts` to match. Never the
other way around.

## How to read this table

- **Destination** describes intent, not current wiring. Every event today
  pushes to `window.dataLayer` only (via GTM's container installed in
  Milestone 2.2, which has no real container ID yet — see that milestone's
  report). Routing a dataLayer push to an actual GA4 property, and from
  there to a Google Ads conversion, requires tags configured in the GTM UI
  — external, human steps not covered by this milestone.
- Only `lead_submit_success` is intended to ever become the Google Ads
  **conversion** trigger (Milestone 2.4). Every other event is a funnel
  diagnostic signal only and must never be set as a bidding-eligible
  conversion action — see `marketing/02-playbooks/ga4-gtm-tracking-playbook.md`'s
  conversion mapping table for why.

## Events

### `gate_view`

| Field | Value |
|---|---|
| **Purpose** | Measures how many sessions actually see the mandatory lead gate — the denominator for gate completion rate. |
| **Trigger** | `LeadGate` component mounts (i.e. the gate becomes visible). Fires once per mount, guarded against duplicate fire within the same mount (see implementation notes). |
| **Parameters** | none |
| **Destination** | GA4 (via GTM) |

### `form_start`

| Field | Value |
|---|---|
| **Purpose** | Marks the moment a visitor begins interacting with a lead form — the denominator for form completion rate, and the key signal for diagnosing the 9-field-form friction identified in the site audit. |
| **Trigger** | First focus event anywhere inside a lead form's `<form>` element (capture phase, so it fires for Radix Select/Checkbox fields too, not just plain inputs). Fires once per form instance. |
| **Parameters** | `form_location: "gate" \| "inline" \| "booking_modal"` |
| **Destination** | GA4 (via GTM) |

### `lead_submit_success`

| Field | Value |
|---|---|
| **Purpose** | The core conversion event — a lead form was submitted and the backend **confirmed** the lead was saved. |
| **Trigger** | Inside each form's submit handler, immediately after `await submitLead(...)` resolves. As of Milestone 2.4, `submitLead()` only resolves when `/api/submit-lead` returns a genuine `{success:true}` from Apps Script — never on click, form open, form start, or submit-button-press alone, and never on an error, timeout, or unreadable response. See `src/pages/Landing.tsx`'s `submitLead()` doc comment for the exact contract. |
| **Parameters** | `form_location: "gate" \| "inline" \| "booking_modal"` |
| **Destination** | GA4 (via GTM) **and** Google Ads conversion (tag wiring is an external GTM-UI step, not yet done — but the event itself is now trustworthy enough to gate a conversion on) |

### `lead_submit_error`

| Field | Value |
|---|---|
| **Purpose** | Distinguishes "visitor abandoned the form" from "the form actually failed to submit," and (as of 1.1.0) which failure mode — critical given the known `no-cors` silent-failure risk documented in the site audit. |
| **Trigger** | Inside each form's submit handler's `catch` block — fires for a backend error response, a timeout, an invalid/unreadable response, or a network failure. |
| **Parameters** | `form_location: "gate" \| "inline" \| "booking_modal"`, `error_type: "timeout" \| "network_error" \| "invalid_response" \| "backend_error"` |
| **Destination** | GA4 (via GTM) |

### `whatsapp_click`

| Field | Value |
|---|---|
| **Purpose** | Tracks the site's secondary, lower-commitment contact channel — a soft engagement signal, not a lead. |
| **Trigger** | Click on a WhatsApp link (`onClick`, doesn't block the `target="_blank"` navigation). |
| **Parameters** | `click_location: "footer" \| "floating_button"` |
| **Destination** | GA4 (via GTM) — observation only, never a Google Ads conversion action (too weak a proxy for a real lead; see the tracking playbook). |

### `nav_cta_click`

| Field | Value |
|---|---|
| **Purpose** | Tracks intent-to-convert clicks across every "Book a Free Session"-style CTA on the page, before the gate/modal even opens — lets funnel analysis distinguish "CTA clicked but gate never shown" from "gate shown but abandoned." |
| **Trigger** | Click on any button that opens the lead gate or booking modal (routed through the single `handleBookClick(location)` function — see implementation notes). |
| **Parameters** | `cta_location: "header" \| "header_mobile" \| "hero" \| "quote_card" \| "step_card" \| "faq_cta" \| "footer"` |
| **Destination** | GA4 (via GTM) |

### `scroll_75`

| Field | Value |
|---|---|
| **Purpose** | Engagement/content-depth signal — did the visitor scroll far enough to see the FAQ and final CTA sections. |
| **Trigger** | Page scroll position crosses 75% of scrollable page height. Fires once per page view; listener is removed after firing. |
| **Parameters** | none |
| **Destination** | GA4 (via GTM) |

## Explicitly out of scope for v1.0.0

- `call_click` — listed in the original tracking playbook draft, but there is currently no `tel:` link anywhere on the public site to attach it to. Do not implement a trigger-less event. Add it in a future version alongside an actual call CTA.
- Any event on `/admin` — that page is an internal tool, not part of the marketing funnel this taxonomy measures.

## Changelog

- **1.1.0** (Milestone 2.4) — `lead_submit_error`'s `error_type` parameter is now populated with an enumerated set (`timeout` | `network_error` | `invalid_response` | `backend_error`) instead of being an unused optional field. `lead_submit_success`'s trigger contract tightened: it's now backed by a real server-confirmed save via `/api/submit-lead`, not just "the fetch call didn't throw." No event names or parameter shapes changed — additive/documentation-accuracy only.
- **1.0.0** (Milestone 2.3) — initial frozen taxonomy: `gate_view`, `form_start`, `lead_submit_success`, `lead_submit_error`, `whatsapp_click`, `nav_cta_click`, `scroll_75`.
