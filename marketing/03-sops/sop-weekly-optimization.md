# SOP — Weekly Optimization Pass

**Owner:** Performance Marketing Expert (runs it), Google Ads Expert +
GA4 Expert (provide inputs)
**When to use:** Every week, once campaigns are live (Phase 5+). This is
the procedure behind `04-workflows/weekly-workflow.md`'s optimization
block — that file says *when*, this file says *how*.

## Steps

1. **Pull the numbers** into `07-reporting/weekly-report-template.md`:
   spend, clicks, CTR, CPC, conversions, CPL, and — from the admin
   dashboard/Google Sheet — qualified leads and CPQL (see
   `00-knowledge-base/glossary.md` for exact definitions).
2. **Review the search terms report.** Add anything irrelevant or
   anti-persona (`icp-personas.md`) to negative keywords. Add anything
   surprisingly relevant as a new keyword candidate for next launch cycle.
3. **Review ad-level performance.** Any ad with a CTR meaningfully below
   its ad group's average after sufficient impressions (≥1,000) is a
   candidate to pause and replace — draft the replacement via
   `sop-ad-copy-review.md`, don't just delete and leave a gap.
4. **Review Quality Score at the keyword level.** Flag any keyword scoring
   ≤5/10 — diagnose whether it's an ad relevance problem (fix copy) or a
   landing page problem (log it against `landing-page-cro-playbook.md`'s
   backlog, don't try to patch it with copy alone).
5. **Check budget pacing** against the monthly cap — if a campaign is
   under-pacing, investigate why (Limited by budget? Low search volume?
   Disapproved ads?) before assuming more budget is the fix.
6. **Check the bidding-strategy stage gate** in
   `google-ads-playbook.md`'s progression table — has this account crossed
   a threshold that justifies moving stages? Don't move early.
7. **Check CRO experiment status** — any test that's hit its minimum
   duration/sample size gets a read-out this week per
   `landing-page-cro-playbook.md`; don't let a finished test sit unread.
8. **Write the weekly report** using
   `07-reporting/weekly-report-template.md`, including at least one
   concrete action taken and one flagged-but-not-yet-actioned item for
   the founder's visibility.
9. **File anything that needs founder approval** (budget change beyond the
   current cap, a phase-adjacent structural change) separately — don't
   bury an approval request inside the report where it can be missed.

## What NOT to do weekly

Don't change bidding strategy, don't make more than one structural landing
page change, and don't restructure the account (merging/splitting ad
groups) on a weekly cycle — those are monthly-or-slower decisions per
`04-workflows/monthly-workflow.md`. Weekly is for tuning, not restructuring.
