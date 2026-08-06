# KPI Dashboard Spec

Defines what the StockSense marketing dashboard should show once there's
real data to show (Phase 2+). `kpi-dashboard.csv` in this folder is the
starter template matching this spec — import it into Sheets/Looker Studio
and wire up live formulas once GA4/Ads data is flowing.

## Why a spec before a dashboard

A dashboard built before the metrics are agreed on tends to reshuffle every
month as someone notices a missing number. This spec is the agreement —
change it deliberately, not by silently adding a column to a spreadsheet.

## Top-level (the numbers that matter most, shown first)

| Metric | Definition | Target direction | Data source |
|---|---|---|---|
| Qualified leads (period) | See `glossary.md` | ↑ | Admin dashboard / Sheet |
| CPQL | Spend ÷ qualified leads | ↓ | Calculated |
| Show rate | Leads who took the call ÷ leads submitted | ↑ | Admin dashboard |
| Blended CPL (once >1 channel) | Total spend ÷ total leads, all channels | ↓ | Calculated |

These four are the "if the founder only looks at four numbers" set —
everything else supports diagnosing movement in these.

## Channel performance

| Metric | Definition | Data source |
|---|---|---|
| Spend | | Google Ads |
| Impressions / Clicks / CTR | | Google Ads |
| Avg. CPC | | Google Ads |
| Conversions / CPL | | Google Ads (linked to GA4 event) |
| Sessions | | GA4 |
| Session → lead rate | | GA4 |

## Funnel diagnostic (where drop-off happens)

| Metric | Definition | Data source |
|---|---|---|
| Gate view rate | `gate_view` ÷ sessions | GA4 |
| Form start rate | `form_start` ÷ sessions | GA4 |
| Form completion rate | `lead_submit_success` ÷ `form_start` | GA4 |
| WhatsApp/Call engagement | `whatsapp_click` + `call_click` ÷ sessions | GA4 (observation only — see `ga4-gtm-tracking-playbook.md`, not a bidding signal) |

## Quality Score / Ad Rank tracking

| Metric | Definition | Data source |
|---|---|---|
| Avg. Quality Score (account) | Google Ads-reported | Google Ads |
| Keywords ≤5/10 QS | Count | Google Ads (feeds `quality-score-checklist.md`) |

## CRO program

| Metric | Definition | Data source |
|---|---|---|
| Active experiments | Count, from `landing-page-cro-playbook.md` backlog | Manual |
| Experiments won/lost/inconclusive (rolling 90 days) | Count | Manual |

## Refresh cadence

- Top-level + channel performance: updated weekly
  (`04-workflows/weekly-workflow.md`)
- Funnel diagnostic: reviewed weekly, deep-dived monthly
- Quality Score: reviewed monthly (`quality-score-checklist.md`)
- CRO program: updated as experiments start/conclude

## Build note

Until GA4/GTM/Ads are installed (Phase 2), this dashboard has no live data
source — do not build a Looker Studio/Sheets dashboard against placeholder
numbers. Use `kpi-dashboard.csv` as the schema to build against the moment
real data exists.
