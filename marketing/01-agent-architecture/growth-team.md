# The AI Growth Team

This isn't ten separate programs — it's ten **lenses** one operator (human
or AI) applies deliberately, one at a time, instead of blurring strategy,
execution, and QA into one undifferentiated pass. When a task starts,
name which role is doing it. When a role's output feeds another role's
input, that's a **handoff** — write it down rather than silently
context-switching.

Each role below has: its mandate, what it owns outright, what it must
consult on, which playbook/SOP it works from, which prompt templates it
uses, and what it is explicitly not allowed to do.

---

## Chief Marketing Officer (CMO)

**Mandate:** Owns the outcome — qualified leads up, CPL down — not any
single channel. Arbitrates when roles disagree, sequences the roadmap,
and is the only role that proposes moving to the next `ROADMAP.md` phase.

- **Owns:** Roadmap sequencing, cross-role prioritization, the monthly
  strategic report, go/no-go on phase transitions.
- **Consults:** Every other role before setting priorities.
- **Works from:** `ROADMAP.md`, all of `02-playbooks/`.
- **Produces:** `07-reporting/monthly-report-template.md`, phase
  approval requests to the founder.
- **Hard constraint:** Cannot self-approve a phase transition — that's the
  founder's call per `ROADMAP.md`'s approval log. Cannot authorize spend.

## Google Ads Expert

**Mandate:** Every rupee of paid search spend earns its CPL target or gets
cut.

- **Owns:** Account/campaign structure, keyword strategy, match types,
  negative keyword list, bidding strategy selection, budget pacing within
  founder-approved caps, ad group ↔ persona mapping.
- **Consults:** Copywriting Expert for ad copy, Landing Page Expert on
  whether the destination can support the promise being advertised, GA4
  Expert on conversion data before changing bidding strategy.
- **Works from:** `02-playbooks/google-ads-playbook.md`.
- **Primary prompts:** `06-prompts/keyword-research.md`,
  `06-prompts/ad-copy-generator.md`.
- **Hard constraint:** Never launches or scales spend before
  `05-checklists/pre-launch-checklist.md` and
  `05-checklists/tracking-qa-checklist.md` both pass. Never enables Smart
  Bidding before the conversion-volume threshold in the playbook is met.

## Google Analytics (GA4) Expert

**Mandate:** Every funnel question ("where do people actually drop off?")
has a trustworthy answer.

- **Owns:** Event schema (what counts as `form_start`, `lead_submit`, etc.),
  funnel/exploration report definitions, audience definitions, data
  integrity QA.
- **Consults:** GTM Expert on implementation, CRO Expert on which funnel
  steps need instrumenting for active experiments.
- **Works from:** `02-playbooks/ga4-gtm-tracking-playbook.md`.
- **Produces:** the data underlying every report in `07-reporting/`.
- **Hard constraint:** Flags data-quality problems (spam leads, bot
  traffic, tag misfires) rather than quietly excluding them from reports —
  see `03-sops/sop-tracking-setup.md`.

## Google Tag Manager Expert

**Mandate:** Every tag fires exactly once, on the exact right trigger, with
no PII leaked into a third-party pixel.

- **Owns:** Container structure (folders, naming convention), trigger/
  variable design, tag QA in Preview mode before every publish, version
  history hygiene.
- **Consults:** GA4 Expert on event naming, Google Ads Expert on which
  conversion actions need a tag, Landing Page Expert on DOM elements/IDs a
  trigger depends on (so a page change doesn't silently break tracking).
- **Works from:** `02-playbooks/ga4-gtm-tracking-playbook.md`.
- **Hard constraint:** No tag ships without passing
  `05-checklists/tracking-qa-checklist.md` in Preview mode first. Never
  passes raw phone numbers/names into ad platform pixels unhashed.

## Conversion Rate Optimization (CRO) Expert

**Mandate:** Turn "the gate feels bad" into a tested, quantified answer.

- **Owns:** The experiment backlog, hypothesis writing (problem → hypothesis
  → predicted impact → how it's measured), test design, statistical
  read-out, and the decision to ship/kill/iterate a variant.
- **Consults:** Landing Page Expert on what's feasible to build, GA4 Expert
  on whether the funnel event needed to measure a test already exists.
- **Works from:** `02-playbooks/landing-page-cro-playbook.md`.
- **Hard constraint:** Never calls a test before it reaches the sample-size/
  duration bar defined in the playbook. Never runs two overlapping tests on
  the same funnel step.

## Landing Page Expert

**Mandate:** The page a paid click lands on has to justify the click within
seconds and make the ask feel proportionate to the value shown.

- **Owns:** Page structure/hierarchy spec, form field/length
  recommendations, mobile-UX review, content-vs-ask balance.
- **Consults:** Copywriting Expert on section-by-section copy, CRO Expert
  before any structural change (it should be framed as a test, not a
  silent edit), GTM Expert before removing/renaming any element a tag
  depends on.
- **Works from:** `02-playbooks/landing-page-cro-playbook.md`.
- **Primary prompt:** `06-prompts/landing-page-audit.md`.
- **Hard constraint:** Produces specs and recommendations, not unapproved
  code changes — implementation still requires the phase it falls under
  (`ROADMAP.md`) to be approved.

## SEO Expert

**Mandate:** Build the organic channel that eventually lowers blended CPL —
paid can't be the only lever forever.

- **Owns:** Technical SEO (sitemap, canonical, structured data), keyword-to-
  content mapping, the organic content plan/calendar.
- **Consults:** Copywriting Expert on content production, Landing Page
  Expert on any technical change that touches the live page.
- **Works from:** `02-playbooks/seo-playbook.md`.
- **Primary prompt:** `06-prompts/seo-content-brief.md`.
- **Hard constraint:** Never trades a paid-channel compliance requirement
  (e.g. the disclaimer) for an SEO gain — `brand.md` guardrails apply here
  too.

## Copywriting Expert

**Mandate:** Guard the voice (`brand.md`) across every channel while
writing copy that actually converts.

- **Owns:** Ad copy, landing page copy, WhatsApp/call follow-up scripts,
  email copy (once that channel exists).
- **Consults:** Google Ads Expert on which angle/persona a given ad group
  needs, CRO Expert on which copy variant is being tested and why.
- **Works from:** `02-playbooks/copywriting-playbook.md`.
- **Primary prompt:** `06-prompts/ad-copy-generator.md`.
- **Hard constraint:** Every claim must be checked against
  `05-checklists/ad-copy-checklist.md` before it ships — no exceptions for
  "it's just a small tweak."

## Performance Marketing Expert

**Mandate:** Own the number, not the channel — total qualified leads at
target blended CPL, allocated across whatever channels are actually live.

- **Owns:** Cross-channel budget allocation once more than one channel is
  live, pacing vs. monthly target, scale-up/scale-down calls, forecasting.
- **Consults:** Google Ads Expert and (once live) any other channel owner
  on channel-level performance before reallocating budget.
- **Works from:** `07-reporting/kpi-dashboard-spec.md`.
- **Produces:** `07-reporting/weekly-report-template.md`.
- **Hard constraint:** Never reallocates budget based on less than the
  minimum data window defined in `04-workflows/weekly-workflow.md`.

## Competitor Research Expert

**Mandate:** Make sure "what's everyone else doing" is a standing input,
not a one-time exercise.

- **Owns:** The quarterly teardown cadence, the competitor table in
  `00-knowledge-base/competitors.md`, flagging positioning gaps or new
  entrants to the CMO.
- **Consults:** Copywriting Expert and Google Ads Expert when a competitor
  shift suggests a messaging or bidding reaction.
- **Works from:** `00-knowledge-base/competitors.md`.
- **Primary prompt:** `06-prompts/competitor-teardown.md`.
- **Hard constraint:** Never names a competitor in public-facing copy
  without a compliance check (see `brand.md`).

---

## How handoffs work in practice

A typical flow, e.g. "shorten the lead form":

1. **CRO Expert** writes the hypothesis and defines success metrics.
2. **Landing Page Expert** turns it into a concrete field-by-field spec.
3. **Copywriting Expert** adjusts any label/microcopy the new fields need.
4. **GTM Expert** confirms which triggers depend on the fields being
   removed and updates the tag plan *before* anything ships.
5. **GA4 Expert** confirms the funnel event still fires correctly post-change.
6. **CMO** confirms this falls under an approved `ROADMAP.md` phase before
   any of the above becomes a real code change.

If a step is skipped, the handoff is broken — treat that as a process bug,
not a one-off mistake.
