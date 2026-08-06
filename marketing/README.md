# StockSense Marketing System

This directory is StockSense's marketing function, in repo form: a
documented AI growth team covering Google Ads, GA4/GTM, CRO, SEO, and
copywriting — with strategy, standards, and procedures captured as files
instead of chat history.

**Mission:** increase qualified leads while reducing cost per lead. Not
traffic, not impressions — qualified leads at a falling CPL.

**Ground rule:** this folder is strategy and process only. It never modifies
`artifacts/stocksense` (the live site) or `artifacts/api-server` on its own.
Application changes only happen in a phase that's been explicitly approved —
see [`ROADMAP.md`](ROADMAP.md) for what's approved and what isn't.

## How to use this folder

- **Starting any marketing task?** Read `00-knowledge-base/brand.md` and
  `00-knowledge-base/audit-findings.md` first — they're the source of truth
  for what StockSense is and what state the site is actually in.
- **Doing a recurring task** (launching a campaign, reviewing ad copy,
  shipping a landing page change)? There's a SOP for it in `03-sops/`. Follow
  it, don't improvise the steps.
- **Need to decide *how* we approach something** (bidding strategy, gate
  design, keyword match types)? That's in `02-playbooks/` — the standing
  doctrine, not the step-by-step.
- **Writing ad copy, doing keyword research, auditing a page, or building a
  report?** Start from the matching template in `06-prompts/` instead of
  writing the prompt from scratch.
- **"What should I be doing today/this week/this month?"** → `04-workflows/`.
- **About to ship something?** Run it through the matching list in
  `05-checklists/` before it goes live.
- **Reporting on performance?** Use the templates in `07-reporting/` — same
  structure every week and month so trends are actually comparable.

## Folder map

| Folder | What's in it |
|---|---|
| [`00-knowledge-base/`](00-knowledge-base/) | Brand & offer, ICP/personas, competitor research, audit findings, KPI glossary |
| [`01-agent-architecture/`](01-agent-architecture/) | The 10-role AI growth team: mandate, inputs/outputs, handoffs, RACI |
| [`02-playbooks/`](02-playbooks/) | Standing doctrine for Google Ads, CRO, SEO, tracking, and copywriting |
| [`03-sops/`](03-sops/) | Step-by-step procedures for recurring, high-stakes actions |
| [`04-workflows/`](04-workflows/) | Daily / weekly / monthly operating cadence |
| [`05-checklists/`](05-checklists/) | Pre-flight gates before anything ships or spends |
| [`06-prompts/`](06-prompts/) | Reusable prompt templates, one per growth-team role/task |
| [`07-reporting/`](07-reporting/) | Weekly & monthly report templates, KPI dashboard spec |
| [`08-automation/`](08-automation/) | What should be automated, with what tool, in what sequence |

## Current state (as of 2026-08-06)

Phase 1 (this folder) is complete. **Nothing else has shipped yet** — GA4,
GTM, and Google Ads conversion tracking are not installed, no campaign is
live, and the Critical/High findings from the site audit are still open. See
`ROADMAP.md` for the phase plan and `00-knowledge-base/audit-findings.md`
for the full list. Phase 2 (tracking + the critical fixes) is the
prerequisite for everything after it — there is no safe way to run paid
traffic before it closes.
