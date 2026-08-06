# Daily Workflow

Applies once campaigns are live (Phase 5+). Before that, "daily" work is
whatever the current roadmap phase requires — there's no ad account to
pulse-check yet.

## Every day (~15–20 min)

1. **Check `/admin` for new leads** — follow `03-sops/sop-lead-followup.md`
   for every new row. This is the highest-leverage daily action: a fast,
   well-timed follow-up directly lifts show-rate.
2. **Glance at Google Ads account status** — any policy disapproval,
   "Limited by budget," or anomalous spend spike/drop vs. the last 3 days.
   Pause anything clearly broken; don't otherwise touch bids/budgets daily
   (see `03-sops/sop-weekly-optimization.md` — tuning is a weekly motion).
3. **Glance at GA4 real-time / yesterday's sessions** — is tracking still
   firing (sessions, `lead_submit_success` events present)? A sudden drop
   to zero events is a tag-breakage signal, not a traffic signal — check
   GTM before concluding traffic actually stopped.
4. **Note anything unusual** (a spend spike, a policy flag, a lead surge or
   dead day) in the running notes that feed
   `07-reporting/weekly-report-template.md` — don't rely on memory to
   reconstruct the week later.

## What daily is *not* for

No bidding strategy changes, no campaign restructuring, no ad copy
swaps based on a single day of data. Daily is monitoring and lead
follow-up only — see `weekly-workflow.md` and `monthly-workflow.md` for
where optimization and strategy decisions actually happen.
