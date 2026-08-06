# Landing Page & CRO Playbook

Standing doctrine for how StockSense improves the page that carries every
paid click. Recommendations and specs only — implementation happens under
an approved `ROADMAP.md` phase, see `03-sops/sop-landing-page-change.md`
for the shipping procedure.

## First principles

1. **Show value before you ask for anything.** The current hard gate
   inverts this completely (`audit-findings.md` #2) — it is the standing
   counter-example this playbook is written against.
2. **Ask for the minimum viable information at each stage.** Name + mobile
   is enough to start a human conversation; everything else (capital,
   demat status, intent) can be gathered progressively — on the call, in a
   post-submit micro-form, or not at all if it doesn't change what happens
   next.
3. **Every structural change is a hypothesis, not a redesign.** Route
   changes through the CRO Expert lens and the experiment template below,
   even ones that feel obviously correct — "obviously correct" is exactly
   the kind of change that should still be measured, because it's cheap to
   verify and expensive to be wrong about at scale.
4. **Mobile is the primary surface, not a breakpoint to check afterward.**
   Design and test on mobile first given the category's traffic pattern.
5. **Trust content and compliance content are conversion content**, not
   overhead — the disclaimer, the "no sales pitch" promise, and an honest
   FAQ answer all reduce the anxiety that is this persona set's primary
   purchase blocker (see `icp-personas.md`).

## Experiment framework

Every entry in the backlog below follows this shape:

```
Hypothesis:  If we [change], then [metric] will [predicted direction/size]
             because [reasoning tied to a persona or audit finding].
Metric:      [primary metric] (guardrail: [secondary metric that must not regress])
Measured by: [GA4 event(s) — confirm they exist before starting, GA4 Expert]
Duration:    Minimum 2 weeks or until [sample size], whichever is longer
Owner:       CRO Expert (design/read-out), Landing Page Expert (spec)
```

Never call a winner before the minimum duration/sample size, even if the
early trend looks obvious — traffic from paid search is noisy at low
volume, and this account will start at low volume.

## Seeded experiment backlog (from the audit)

Prioritized by expected impact × confidence, highest first. Update this
list as tests complete — don't just add to the bottom.

1. **Gate removal/delay test.** Hard gate vs. scroll-triggered or
   time-delayed non-blocking prompt vs. no gate at all (persistent CTA
   only). Primary metric: session → lead rate. This is the highest-leverage
   test on the whole page (`audit-findings.md` #2).
2. **Form length test.** 9 fields vs. 2 fields (name + mobile) with the
   rest asked progressively. Primary metric: form completion rate.
3. **Thank-you flow test.** Inline success message vs. dedicated
   `/thank-you` page with a self-serve booking widget. Primary metric:
   show-rate (leads who actually take the call) — not just submission rate.
4. **Trust-content placement test.** Current position of the disclaimer/
   "no sales pitch" messaging vs. surfaced earlier, above the fold, near
   the first CTA. Primary metric: gate/form completion rate for
   first-time sessions.
5. **Social proof test.** The "2,000+ curious learners" claim currently
   sits in a small strip — test a more prominent testimonial/proof block
   once real testimonials exist and are verifiable (see `brand.md`
   compliance guardrails — don't fabricate or round up numbers).

## Sizing & duration guardrails

- Don't end a test before **2 full weeks** of data, to average out
  day-of-week effects, *and* a minimum sample big enough that the observed
  lift isn't plausibly noise — if traffic is low, extend duration rather
  than shortening the bar.
- Run **one experiment per funnel step at a time** — an overlapping gate
  test and form-length test would make neither result trustworthy.
- Guardrail metric check on every test: a change that raises the primary
  metric but tanks a guardrail (e.g. more raw submissions but a collapse in
  lead quality) is not a win — read both.

## Mobile UX checklist (apply to every change)

- Tap targets ≥44px, no overlap between the WhatsApp floating button and
  any modal close control.
- Numeric fields use the numeric keyboard (`inputMode="numeric"`, already
  correct on the mobile field per the audit — preserve this pattern in any
  redesign).
- Autocomplete attributes (`name`, `tel`) on every relevant field — missing
  today (`audit-findings.md` #17).
- No modal should be taller than the viewport without internal scroll.

## What this playbook does not cover

Ad copy (`copywriting-playbook.md`), tracking implementation
(`ga4-gtm-tracking-playbook.md`), and technical SEO (`seo-playbook.md`) are
separate playbooks — reference them, don't duplicate them here.
