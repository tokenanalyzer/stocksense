# Copywriting Playbook

The voice rules in `00-knowledge-base/brand.md` are non-negotiable; this
playbook is the tactical layer on top — headline formulas, a CTA bank, and
the angle-to-persona map every piece of copy should trace back to.

## Non-negotiables (repeated from `brand.md` — do not soften these)

- No implied guarantees, no "safe," no specific-return promises.
- No "tips," "recommendation," "signal" language.
- The educational/non-advisory disclaimer stays intact and legible.
- Any stat ("2,000+ learners") must be verifiable before it ships in paid
  copy — check with the founder if unsure, don't estimate upward.

## Angle-to-persona map

| Persona | Lead angle | Avoid |
|---|---|---|
| Curious Zero | "Understand it before you touch it" — trust and no-pressure framing | Urgency/FOMO language — this persona is fear-averse, not fear-motivated |
| No Time to Filter | "30 minutes, your schedule, your situation" — efficiency and personalization | Curriculum-breadth claims — this persona wants relevance, not volume |
| Opened, Now What | Speak directly to the idle-account/one-bad-trade moment | Generic "learn to invest" openers — too broad to trigger recognition |
| Serious Student | Discipline/risk-management framing, explicit differentiation from free content | Basics-focused headlines — this persona has already seen basics content |

Full persona detail: `00-knowledge-base/icp-personas.md`.

## Headline formulas (Search ad headlines, ~30 char each)

- `[Outcome] Before You [Risk]` → "Clarity Before Capital", "Understand
  Markets Before You Invest"
- `[Persona moment], Now What?` → "Opened a Demat Account? Learn Next Steps"
- `Free [Time]-Min Session, No [Objection]` → "Free 30-Min Session, No
  Sales Pitch"
- `[Number] Learners, [Trust Signal]` → only once the stat is verified —
  see non-negotiables above
- `Not a Course. A Conversation.` — direct differentiation angle for the
  Serious Student persona vs. content-heavy competitors
  (`00-knowledge-base/competitors.md`)

## CTA language bank

Primary: **"Book a Free Intro Session"**, **"Request My Free Session"** —
keep the *free* and *session* (not "course," not "class") consistent site-
and ad-wide; it matches the actual offer and avoids setting an expectation
(structured course) the funnel doesn't currently deliver on day one.

Secondary/lower-commitment: **"See How It Works"**, **"Explore the
Curriculum"** — for users not ready to submit contact info, once the
landing page playbook's gate changes (Phase 3) make a non-form path
available.

Avoid: "Sign Up Now," "Don't Miss Out," "Limited Seats" — none of these are
true today (no seat cap, no deadline exists) and manufactured urgency
directly contradicts the "no pressure, no sales pitch" brand promise.

## Description line / body copy patterns

- Lead with the persona's specific moment, not a generic value prop:
  "Opened a demat account and not sure what's next?" outperforms "Learn
  the stock market" for that ad group.
- Always include one compliance-forward phrase somewhere in the ad copy or
  its immediate landing context: "education only," "not investment
  advice," or the SEBI disclosure — this isn't just policy hygiene, it's
  also a trust signal this persona set responds to (`icp-personas.md`).
- Close with the low-friction version of the ask: "free," "30 minutes,"
  "no obligation" — all three appear in different combinations depending
  on character budget.

## WhatsApp / call follow-up scripts (starting point)

Once a lead converts, the outreach message should mirror the ad/landing
promise exactly — never open with anything that reads as a pitch:

> "Hi [Name], this is the StockSense team — thanks for requesting a free
> intro session. We saw you're at [experience level stated in form]. Is
> [their selected time window] still a good time for a quick call?"

Keep this in sync with the actual template already used in
`artifacts/stocksense/src/pages/Admin.tsx`'s WhatsApp message — don't let
the two drift into different voices.

## Every piece of copy, before it ships

Run it through `05-checklists/ad-copy-checklist.md`. No exceptions for
"it's just a small tweak" — small tweaks are exactly where compliance and
voice drift happen unnoticed.
