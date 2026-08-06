# SOP — Lead Follow-Up

**Owner:** Whoever operates the `/admin` dashboard day-to-day (not an AI
role — this is the human sales/founder motion the marketing system feeds).
**When to use:** Every new lead that lands in the Google Sheet.
**Why it's in this system:** follow-up speed and quality directly
determine show-rate and close-rate — two of the KPIs in
`00-knowledge-base/glossary.md` — so it's part of the funnel this system
is optimizing, even though it's not an ad/CRO/SEO task.

## Steps

1. **Check `/admin` at least twice daily** (see
   `04-workflows/daily-workflow.md`) — leads should not sit untouched
   overnight if their selected contact window has already passed.
2. **Contact within the lead's selected time window** using the channel
   they're most likely to answer — WhatsApp first (higher open rate than a
   cold call for this audience), falling back to a call if no response.
3. **Use the WhatsApp script starting point** from
   `02-playbooks/copywriting-playbook.md`, personalized with their stated
   experience level and intent from the form.
4. **Update lead status in `/admin`** immediately after contact attempt:
   `New` → `Contacted` → `Follow-up` (if no answer / needs a second touch)
   → `Converted` (if they book/attend the session). Accurate status is
   what makes `computeStats()` in `Admin.tsx` and the weekly report
   trustworthy — stale statuses quietly break reporting.
5. **Use the Notes field** for anything that should inform the actual
   intro-session conversation (specific concerns raised, best callback
   time if the stated window didn't work).
6. **If a lead doesn't respond after 2 attempts across their stated
   window**, mark `Follow-up` and retry once more within 48 hours, then
   let it age out — don't keep an unresponsive lead in `New` indefinitely,
   it distorts the "New" count in the dashboard stats.

## Data quality note

If a lead is obviously spam/bot (nonsense name, invalid pattern,
anti-persona intent per `00-knowledge-base/icp-personas.md`), do **not**
delete the row — mark it clearly in Notes (`"spam — excluded from
reporting"`) so `07-reporting/weekly-report-template.md`'s lead counts can
be reported both raw and spam-excluded. Deleting rows silently makes the
Google Sheet an unreliable source of truth.
