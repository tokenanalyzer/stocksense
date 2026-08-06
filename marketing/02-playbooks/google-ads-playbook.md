# Google Ads Playbook

Standing doctrine for how StockSense runs Google Ads. This is "how we
decide," not "what to click today" — see `03-sops/sop-campaign-launch.md`
for the step-by-step, and `04-workflows/` for the recurring cadence.

**This playbook does not authorize spend.** No campaign referenced here
goes live until `ROADMAP.md` Phase 5 is approved and
`05-checklists/pre-launch-checklist.md` passes in full.

## Sequencing principle

Search before Performance Max. Search gives controllable, attributable,
keyword-level learning while conversion volume is low; PMax needs a
healthy conversion signal to bid well and is a Phase 6 addition once
Search has established a reliable CPL baseline.

## Account structure

```
StockSense
├── Campaign: Search – Branded
│     └── Ad group: StockSense (exact/phrase brand terms)
├── Campaign: Search – Non-Branded, High Intent
│     ├── Ad group: Beginner Intent      ("Curious Zero" persona)
│     ├── Ad group: Professional Intent  ("No Time to Filter" persona)
│     ├── Ad group: Demat Holder Intent  ("Opened, Now What" persona)
│     └── Ad group: Serious Learner Intent ("Serious Student" persona)
└── Campaign: Search – Competitor/Comparison (Phase 6, once baseline exists)
      └── Ad group: Category comparison terms
```

One persona per ad group keeps keyword intent, ad copy, and landing
message tight — see `00-knowledge-base/icp-personas.md` for the source
personas and `06-prompts/ad-copy-generator.md` for generating copy per
group.

## Keyword strategy

- Start **phrase + exact match only**. Broad match is a Phase 6+ decision,
  only after enough negative-keyword coverage exists to trust it.
- Map every keyword theme to a persona before adding it — if it doesn't fit
  one of the four personas or the anti-persona exclusion list, don't add it
  yet; log it for review instead.
- Non-branded intent buckets to build out first: "learn stock market
  [beginner/India]", "stock market course for beginners", "how to start
  investing India", "demat account what to do next", "1:1 stock market
  mentor".

### Negative keywords (starter list — expand continuously)

Direct pull from the `brand.md` compliance guardrails and the
`icp-personas.md` anti-persona:

`tips`, `signal`, `signals`, `intraday tips`, `sure shot`, `guaranteed
returns`, `guaranteed profit`, `free demat`, `jobs`, `career`, `salary`,
`recruitment`, `download pdf`, `notes pdf`, `[any specific stock ticker]`,
`f&o tips`, `nifty tips`, `crypto`, `forex`.

Review search terms report weekly (`04-workflows/weekly-workflow.md`) and
add anything that matched but doesn't fit a persona.

## Budget & bidding progression

| Stage | Conversion volume | Bidding strategy | Notes |
|---|---|---|---|
| 1 — Launch | 0 conversions | Manual CPC or Maximize Clicks, capped daily budget | Learning phase, expect a rough CPL |
| 2 — Early signal | 1–29 conversions/month | Maximize Conversions | Let the algorithm find the pattern before constraining it with a target |
| 3 — Optimize | ≥30 conversions/month, ≥2 weeks stable | Target CPA | Set tCPA at or slightly above trailing 2-week actual CPL, tighten gradually |
| 4 — Scale | tCPA stable for ≥4 weeks | Target CPA with raised budget, consider PMax | Only after Phase 6 cadence has validated CPQL, not just CPL |

Never jump a stage on a single good day. Every stage transition needs the
volume/stability bar met, not just crossed once.

## Ad assets / extensions checklist

- Sitelinks: FAQ section, "Who It's For", intro-session booking
- Callout extensions: "Free 30-min Session", "No Sales Pitch", "Education
  Only — Not Investment Advice" (compliance-forward callouts also help
  Ad Rank by signaling transparency)
- Call extension: business number, click-to-call enabled for mobile
- Structured snippets: Topics → Market Basics, Risk Management, Trading
  Psychology, Beginner Investing
- Lead form extension: **do not enable** until the on-site form is fixed
  (see `audit-findings.md` #2, #8) — an in-ad lead form on top of the
  current 9-field on-site form would fragment the data and double the
  places a submission can silently fail.

## Geo & device

- Start with India-wide, then narrow to the top 8–10 metro/tier-1 cities by
  early lead volume once ≥2 weeks of geo data exists.
- Mobile bid adjustments should follow traffic share, not be set blind —
  check device split weekly once live; expect majority-mobile given the
  category.
- Day-parting: hold off adjusting until at least 2 full weeks of hourly
  data exist — don't day-part on a hunch.

## Quality Score is a landing page problem first

Every point of Quality Score this account will fight for is capped by
`audit-findings.md` items #2 (blocking gate) and #3 (image weight) until
Phase 2/3 close. Do not expect strong Quality Scores before those ship —
budget accordingly and don't over-optimize ad copy to compensate for a
landing page problem.

## Review cadence

Weekly and monthly reviews are defined in `04-workflows/` — this playbook
defines the standing rules those reviews apply, not a new cadence.
