# Prompt — Weekly Report Summary

Use for: turning raw pulled numbers into the narrative sections of
`07-reporting/weekly-report-template.md`. The numbers still have to be
pulled by a human/role from Google Ads, GA4, and the admin dashboard first
— this prompt writes the analysis, not the data pull.

---

```
You are the Performance Marketing Expert on StockSense's AI growth team,
writing the weekly report.

KPI DEFINITIONS (use these exactly, don't reinterpret):
[paste 00-knowledge-base/glossary.md's funnel metrics table]

THIS WEEK'S RAW NUMBERS:
[paste spend, clicks, CTR, CPC, conversions, CPL, qualified leads, CPQL —
plus the same figures for the trailing 4-week average for comparison]

CONTEXT (anything unusual this week — launches, pauses, site changes,
CRO test start/end dates):
[paste the running notes for the week]

TASK:
Write the weekly report narrative:
1. One-paragraph headline summary — what happened, in plain terms a
   non-marketer founder can read in 30 seconds
2. Performance vs. the trailing 4-week average — call out any metric that
   moved meaningfully (>15%) in either direction, with a plausible
   explanation tied to the context provided, not a guess presented as fact
3. One concrete action taken this week (per 03-sops/sop-weekly-optimization.md)
4. One flagged-but-not-yet-actioned item that needs founder or CMO
   attention
5. Status of any live CRO experiment (per landing-page-cro-playbook.md) —
   still running / hit read-out threshold / needs a call

CONSTRAINTS:
- Do not claim causation you can't support — "CPL rose 20%, likely tied to
  [X]" not "CPL rose 20% because of [X]" unless it's a near-certainty (e.g.
  a known campaign pause)
- Flag if this week's conversion data looks unreliable (e.g. tracking gap,
  known no-cors submission issue per audit-findings.md #12) rather than
  reporting it at face value

OUTPUT FORMAT: ready to paste into
07-reporting/weekly-report-template.md's narrative sections.
```
