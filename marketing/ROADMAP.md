# StockSense — AI Marketing System Roadmap

This is the master roadmap for turning StockSense's marketing function into a
documented, repeatable system: a growth team, in repo form, that can run
Google Ads, SEO, CRO, and reporting the same way every time — with all
strategy, standards, and reasoning captured as version-controlled files
instead of living in someone's head or a chat history.

**Operating rule for every phase after this one:** no application code,
landing page copy, tracking configuration, or live campaign is touched until
the phase is explicitly approved. Each phase below ends with a stop-and-wait
checkpoint. This roadmap itself, and everything under `marketing/`, is
documentation and strategy only — it does not modify `artifacts/stocksense`.

Findings referenced throughout come from the full-site audit performed
2026-08-06 (captured in [`00-knowledge-base/audit-findings.md`](00-knowledge-base/audit-findings.md)).

---

## Phase 1 — Foundation: the Marketing Operating System

**Status: this delivery.**

Stand up the complete documentation and process layer before touching a
single line of application code. This is the scaffolding every later phase
plugs into.

Deliverables (all under `marketing/`):

- `00-knowledge-base/` — brand, offer, ICP, competitors, audit findings, glossary
- `01-agent-architecture/` — the 10-role AI growth team and how they hand off work
- `02-playbooks/` — how-we-do-Google-Ads / CRO / SEO / tracking / copy, as standing doctrine
- `03-sops/` — step-by-step procedures for recurring, high-stakes actions
- `04-workflows/` — daily / weekly / monthly operating cadence
- `05-checklists/` — pre-flight gates (launch, Quality Score, compliance, tracking QA)
- `06-prompts/` — reusable prompt templates for each growth-team role
- `07-reporting/` — weekly/monthly report templates and the KPI dashboard spec
- `08-automation/` — what gets automated, with what tool, in what order

No campaigns are launched, no tracking is installed, no landing page copy
changes in this phase. This is the reference system everything else is
measured against.

**Exit criteria:** the folder above exists, is internally consistent, and a
new team member (human or AI) could run StockSense marketing from it without
needing this conversation's context.

**→ Stop here. Wait for approval before Phase 2.**

---

## Phase 2 — Critical Fixes & Measurement Foundation

**Status: not started. Requires explicit approval.**

Nothing downstream can be measured, trusted, or safely scaled until this
phase closes. Directly addresses the **Critical** findings from the audit:

1. Rotate the exposed admin credential and move lead-dashboard auth server-side.
2. Install GTM → GA4, and a Google Ads conversion action that fires on a
   successful lead submission (event-based, since there's currently no
   thank-you URL).
3. Add a dedicated `/thank-you` route for a clean, URL-based conversion point
   and to unlock Enhanced Conversions later.
4. Compress and right-size the five hero/section source images (currently
   ~10.9MB combined) and add `width`/`height` + `loading`/`fetchpriority`.
5. Publish real Privacy Policy and Terms of Service pages; link them from the
   footer and the consent checkbox copy.
6. Confirm Google Ads' financial-services / trading-education certification
   requirements for the India account before any campaign goes live.

**Exit criteria:** GA4 shows real sessions, a test lead submission fires a
visible Google Ads conversion, the admin panel can't be reached without a
real login, and Privacy Policy / Terms resolve to real pages.

---

## Phase 3 — Landing Page & Conversion Rate Optimization

**Status: not started. Requires explicit approval.**

Addresses the **High**-priority CRO findings — the mandatory 9-field
interstitial is the single largest lever identified in the audit.

1. Replace the hard, non-dismissible lead gate with a delayed or
   scroll-triggered prompt (or remove the gate entirely in favor of a
   persistent but non-blocking CTA) — content must be visible before the ask.
2. Cut the form to the minimum viable fields (name + mobile, one optional
   qualifier) with progressive profiling for the rest post-conversion.
3. Add a self-serve booking step (calendar embed) to the thank-you flow so
   "we'll call you" becomes "you're booked for Tuesday 6pm."
4. Add missing trust content above the form: testimonials/reviews, a visible
   curriculum preview, and a working FAQ→schema pairing.
5. Stand up the first A/B test (gate variant vs. no-gate variant) using the
   experiment template in `02-playbooks/landing-page-cro-playbook.md`.

**Exit criteria:** form-start → form-complete rate and overall session →
lead rate are both being tracked in GA4 (from Phase 2) with a documented
baseline, and at least one CRO experiment is live.

---

## Phase 4 — SEO & Content Foundation

**Status: not started. Requires explicit approval.**

1. `sitemap.xml`, canonical tag, `og:image`/`twitter:image` wired to the
   existing `public/opengraph.jpg`, `og:locale` for India.
2. `FAQPage` and `EducationalOrganization` structured data.
3. Block `/admin` from indexing (`robots.txt` + `noindex`).
4. Stand up a content plan for organic, non-paid lead generation (see
   `02-playbooks/seo-playbook.md`) — this is what eventually lowers blended
   CPL as paid volume grows.

**Exit criteria:** Search Console verified, sitemap submitted, `/admin`
confirmed non-indexable, FAQ rich result eligible per Rich Results Test.

---

## Phase 5 — Google Ads Campaign Build & Launch

**Status: not started. Requires explicit approval.**

Mostly platform-side work (Google Ads UI / API), not application code —
still gated on approval since it spends real money.

1. Keyword research and negative keyword list (see
   `02-playbooks/google-ads-playbook.md`).
2. Account/campaign structure: Search (branded + non-branded), Performance
   Max as a second-phase addition once conversion volume supports it.
3. Ad copy per `06-prompts/ad-copy-generator.md`, reviewed against
   `05-checklists/ad-copy-checklist.md`.
4. Conversion goals wired to the Phase 2 tag; Smart Bidding strategy chosen
   based on early conversion volume (start Maximize Conversions, graduate to
   Target CPA once ≥30 conversions/month).
5. Geo targeting (India, top cities first), day-parting, device bid
   adjustments.
6. Launch at a capped daily budget; do not scale until Phase 6 cadence has
   run for at least one full week.

**Exit criteria:** campaign live, first conversions recorded end-to-end
(click → GA4 → Ads), CPL baseline established.

---

## Phase 6 — Scale & Optimize (ongoing)

**Status: continuous, once Phase 5 is live.**

Run the cadence defined in `04-workflows/`: daily pulse checks, weekly
optimization pass, monthly strategic review. Expand budget on
proven-converting keywords/ads, kill underperformers, refresh ad creative on
a fatigue schedule, keep a running CRO experiment backlog, and re-run
competitor research (`06-prompts/competitor-teardown.md`) quarterly.

---

## Approval log

| Phase | Approved by | Date | Notes |
|---|---|---|---|
| 1 | — (in progress) | 2026-08-06 | Foundation only, no app code touched |
| 2 | — | — | Pending |
| 3 | — | — | Pending |
| 4 | — | — | Pending |
| 5 | — | — | Pending |
