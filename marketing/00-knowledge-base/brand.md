# Brand & Offer — Source of Truth

Everything in `02-playbooks/` and `06-prompts/` should trace back to this
file. If a piece of ad copy, a landing page change, or a prompt output
contradicts something here, this file wins — flag the conflict instead of
guessing.

## What StockSense is

An educational platform teaching people how the stock market works
**before** they invest — not a brokerage, not an advisory, not a tipping
service. Positioning line, verbatim from the site: **"Clarity Before
Capital."**

**Explicitly not:** SEBI-registered, an investment advisor, a source of buy/
sell recommendations or stock tips, a portfolio management service.

## The offer

A free, no-obligation 30-minute intro session. No stated price for the
paid curriculum on the current site — the intro call is the entire funnel
today. Delivery is personal/mentorship-style (1:1), not a pre-recorded
course.

Contact channels once a lead converts: phone call or WhatsApp
(**+91 91675 14859**), during a self-selected time window (Morning
10am–12pm / Afternoon 1–4pm / Evening 5–7pm). Support email:
**stocksense00@gmail.com**.

## Positioning vs. the category

The stock-market-education space in India is dominated by **content**
(Zerodha Varsity, YouTube channels, free PDF courses — see
`competitors.md`). StockSense's differentiation is **1:1 mentorship and a
qualifying conversation**, not more free content. Messaging should lean into
"a real conversation about where you are," not "another course" — the
market is saturated with free courses; it is not saturated with someone
listening to a beginner's specific situation first.

## Value pillars (from the current site — treat as canon until CRO testing says otherwise)

1. **Market Basics** — how markets actually work (indices, sectors,
   instruments), stripped of hype.
2. **Risk Awareness** — identifying and managing risk before it manages you.
3. **Decision Discipline** — frameworks for calm decisions, not
   fear/FOMO-driven ones.
4. **Avoid Traps** — sidestepping the emotional traps that catch beginners.

## Audience segments (from the site's own "Who It's For" section)

- **Complete Beginners** — starting from zero, want a structured,
  jargon-free path.
- **Working Professionals** — have capital, lack time to filter market
  noise.
- **Demat Account Holders** — opened an account, unsure what to do with it.
- **Curious Investors** — interested but want to learn before participating.

See `icp-personas.md` for these turned into full personas with messaging
angles.

## Voice & tone

- **Calm, not hyped.** No "get rich," no urgency-through-fear, no tip-of-the-
  day energy. The brand's whole pitch is the opposite of that noise.
- **Plain language over jargon** — the audience is explicitly beginners.
- **Honest about limits** — the disclaimer isn't legal boilerplate to bury,
  it's consistent with the "education, not advice" promise and should be
  visible, not hidden.
- **Confident, not salesy.** "No pressure. No sales pitch." is a stated
  value prop (see the inline lead-form section) — copy should never
  undercut that by reading like a hard sell.

## Visual identity (current site)

- Primary accent: green/emerald (`green-600` / `emerald-600` in Tailwind
  terms) — signals growth/finance without leaning on red/gold clichés.
- Dark slate (`slate-900`) for header/footer and high-contrast sections.
- Typeface: Inter.
- Logo: wordmark/lockup at `src/assets/file_000000001d8871fa822307813ae000a5_1780324458986.png`.

## Compliance guardrails (apply to every piece of copy, every channel)

- Never imply guaranteed returns, "safe" trades, or specific stock
  performance.
- Never use the words "advice," "recommendation," "tip," or "signal" in a
  way that could be read as investment advice.
- Always keep the "educational only, not SEBI-registered" disclaimer
  intact and legible wherever the offer is described.
- Any claim about learner outcomes ("2,000+ curious learners") must be
  verifiable before it's used in paid ad copy — Google Ads and platform
  reviewers will scrutinize unverifiable claims harder in a finance-adjacent
  vertical. See `05-checklists/ad-copy-checklist.md`.
