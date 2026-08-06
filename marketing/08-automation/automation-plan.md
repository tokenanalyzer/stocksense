# Automation Plan

What should eventually run without a human/AI doing it by hand, in the
order it becomes possible to build. Nothing in this file is built yet —
it's the sequencing plan so automation gets added once the underlying
process is proven manually, not before.

**Principle: automate a process only after it's been run manually for at
least a few cycles.** Automating an unproven workflow just makes the wrong
process run faster.

## Tier 0 — Prerequisite (Phase 2)

Nothing below can be built before tracking exists. GTM/GA4/Ads conversion
tracking (`03-sops/sop-tracking-setup.md`) is the dependency for
everything in this file.

## Tier 1 — Data quality automation (build once leads are flowing)

1. **Spam/anti-persona flagging in Apps Script.** `Code.gs` currently
   accepts any submission with no validation. Once submission volume
   justifies it, add basic server-side validation (mobile number format,
   required-field presence) and a honeypot field — addresses
   `audit-findings.md` #11 and reduces manual spam-flagging in
   `sop-lead-followup.md`.
2. **Automated new-lead notification beyond email.** `Code.gs` already
   emails on submission (`GmailApp.sendEmail`) — extend to a WhatsApp/Slack
   webhook alert so `sop-lead-followup.md`'s "check twice daily" becomes
   "notified immediately," directly improving show rate.

## Tier 2 — Reporting automation (build once the manual report has run ~4–6 times)

3. **Weekly report auto-pull.** Script or Sheets-connected dashboard pulling
   Google Ads + GA4 numbers into `kpi-dashboard.csv`'s schema automatically,
   leaving only the narrative sections of
   `07-reporting/weekly-report-template.md` to be written by hand.
4. **KPI dashboard (Looker Studio or Sheets).** Build against the schema in
   `07-reporting/kpi-dashboard-spec.md` once live data exists — don't build
   it against placeholder numbers.

## Tier 3 — Optimization automation (build once bidding has reached Stage 3, Target CPA)

5. **Automated rules / scripts for obvious pauses.** E.g. auto-pause a
   keyword whose Quality Score has been ≤3 for 2+ consecutive weeks, flag
   for human review rather than auto-editing bids — automation here should
   flag and pause, not restructure or scale spend unattended.
6. **Search terms → negative keyword suggestion feed.** Weekly automated
   pull of new search terms outside the persona set
   (`icp-personas.md` anti-persona) as a review queue, replacing the manual
   scan in `sop-weekly-optimization.md` step 2 with a pre-filtered list a
   human still approves.

## Explicitly not automating (for now)

- **Ad copy publishing.** Stays a human/AI-drafted, checklist-reviewed,
  CMO-approved process (`sop-ad-copy-review.md`) — too much compliance
  surface area in a finance-adjacent vertical to auto-publish.
- **Bidding strategy stage transitions.** Stay a monthly, deliberate
  decision (`monthly-workflow.md`) — never let an automated rule change
  bidding strategy itself, only pause/flag within a strategy.
- **Lead follow-up itself.** The actual outreach stays human — automation's
  role here is speeding up notification, not replacing the conversation.

## Build order summary

Tier 1 → Tier 2 → Tier 3, each gated on the tier before it having run
manually long enough to trust automating it. Revisit this file's ordering
at each monthly review (`04-workflows/monthly-workflow.md`) rather than
treating it as fixed.
