# ICP & Personas

Built from the site's own "Who It's For" segmentation and the lead form's
`experience` field (which is the closest thing to real segmentation data
once leads start flowing — reconcile these personas against actual
Google Sheet data after the first ~50 leads and update this file).

Every persona below should map to at least one ad group / keyword theme in
`02-playbooks/google-ads-playbook.md` and one messaging angle in
`02-playbooks/copywriting-playbook.md`.

---

## 1. "Curious Zero" — Complete Beginner

- **Form value:** `experience = beginner`
- **Who:** 22–32, salaried, has never opened a demat account. Reads about
  markets on Instagram/YouTube but finds it overwhelming and slightly
  intimidating. Worried about being "the one who loses money."
- **Trigger:** friends/colleagues talking about stocks/SIPs, a viral
  finance-influencer reel, or year-end resolution energy.
- **Core fear:** looking foolish, losing money on something they didn't
  understand, being sold a "trading system" in disguise.
- **Objection to overcome:** "Is this just another course trying to sell me
  something?"
- **Winning angle:** "Understand it before you touch it" — lead with the
  no-pressure, education-first framing. This persona converts on trust
  signals (disclaimer, "not SEBI-registered" honesty, no-sales-pitch promise)
  more than on urgency.
- **Best channel:** Search (non-branded, "how to start investing" intent),
  Instagram/YouTube for top-of-funnel awareness.

## 2. "No Time to Filter" — Working Professional

- **Form value:** `experience = beginner` or `learning`, often paired with a
  non-trivial `startingCapital`
- **Who:** 28–45, has disposable income and a demat account they rarely use,
  or none yet. Time-poor. Has tried to "figure it out" from scattered
  YouTube videos and given up.
- **Trigger:** bonus/increment, a friend's investing win, tax-saving season.
- **Core fear:** wasting the little free time they have on content that
  doesn't actually make them competent; being talked into products by a
  broker's RM.
- **Objection to overcome:** "I don't have time for a whole course."
- **Winning angle:** the 1:1, scheduled-around-you format is the actual
  differentiator for this persona — lean on "30 minutes, your schedule, your
  situation" rather than curriculum breadth.
- **Best channel:** Search (branded + "stock market mentor"/"1:1" intent),
  LinkedIn if budget allows in a later phase.

## 3. "Opened, Now What" — Demat Account Holder

- **Form value:** `dematAccount = yes` or `opening`, `experience = demat`
- **Who:** Any age, opened a demat account (often prompted by a broker app
  ad or a friend) but hasn't traded or has made one or two anxious,
  unresearched trades.
- **Trigger:** account sitting idle, guilt/FOMO about not using it, or a
  small loss that scared them into wanting to "actually learn this properly."
- **Core fear:** repeating a costly mistake; being talked into risk they
  don't understand.
- **Objection to overcome:** "I already half-know this, will this be too
  basic?"
- **Winning angle:** speak directly to the idle-account/one-bad-trade
  moment — this persona self-identifies strongly with FAQ #2 on the current
  site ("Do I need a demat account to join?"). Ad copy and landing content
  should mirror that language closely.
- **Best channel:** Search (high-intent — "demat account what next", "lost
  money trading"), remarketing once GTM/GA4 exist (Phase 2).

## 4. "Serious Student" — Actively Learning / Tried Trading

- **Form value:** `experience = tried` or `learning`
- **Who:** Has attempted trading, possibly lost money, is now seeking
  structure rather than another tip source. Most skeptical, most
  price/quality-sensitive segment — has likely already seen Zerodha Varsity,
  YouTube channels, or a paid course.
- **Trigger:** a losing trade, disillusionment with "signal" groups/tip
  channels, decision to "do this properly."
- **Core fear:** paying for content that's freely available elsewhere;
  another program that's actually a thinly-veiled trading-tips upsell.
- **Objection to overcome:** "What makes this different from Varsity /
  YouTube / the free course I already tried?"
- **Winning angle:** this is the persona where the 1:1 mentorship
  differentiation has to be made explicit and credible — see
  `competitors.md` for exactly what they're comparing StockSense against.
  Discipline/risk-management framing (pillars 2–4 in `brand.md`) outperforms
  basics framing here.
- **Best channel:** Search (high-intent, comparison-adjacent queries),
  competitor-conquesting campaigns once Phase 5 account structure exists.

---

## Anti-persona (do not target)

Anyone whose stated intent is get-rich-quick, guaranteed-returns, or
tip/signal-seeking behavior. Targeting or messaging to this intent
contradicts the brand's core positioning (`brand.md`) and increases both
Google Ads policy risk and post-sale support/refund friction. Exclude
"stock tips," "guaranteed profit," "intraday tips," and similar terms as
negative keywords (see `02-playbooks/google-ads-playbook.md`).
