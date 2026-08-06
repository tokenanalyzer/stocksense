# Pre-Launch Checklist

Run in full before **any** Google Ads campaign goes live or resumes from a
paused/disapproved state. Every box, every time — this checklist exists
because the audit found the site unsafe to advertise to as-is.

## Tracking (blocks launch if unchecked)

- [ ] GA4 property live, receiving real sessions
- [ ] GTM container published to production, verified via
      `sop-tracking-setup.md` step 9
- [ ] Google Ads conversion action ("StockSense – Lead Submitted") created
      and confirmed firing on a real test submission
- [ ] `05-checklists/tracking-qa-checklist.md` passed in full

## Compliance (blocks launch if unchecked)

- [ ] Privacy Policy page is live and linked from the footer and the
      consent checkbox text (`audit-findings.md` #5)
- [ ] Terms of Service page is live and linked
- [ ] Google Ads financial-services/trading-education certification
      requirement for the India account confirmed and satisfied
      (`audit-findings.md` #6)
- [ ] Ad copy passed `ad-copy-checklist.md`

## Landing page (blocks launch if unchecked)

- [ ] The lead gate is dismissible or delayed, not a hard block
      (`audit-findings.md` #2) — do not launch paid traffic into the
      current hard-gate version
- [ ] Hero image and above-the-fold assets are compressed and under a
      reasonable size budget (target: hero <300KB, total above-the-fold
      images <600KB) — see `audit-findings.md` #3
- [ ] Admin credential has been rotated and is no longer the value that
      was ever shipped client-side (`audit-findings.md` #4)
- [ ] `/admin` is blocked from indexing (`robots.txt` + `noindex`)

## Account setup

- [ ] Budget cap matches founder-approved amount
- [ ] Bidding strategy matches Stage 1 of the progression table in
      `google-ads-playbook.md` (never launch straight into Target CPA)
- [ ] Negative keyword starter list applied
- [ ] Geo targeting confirmed (India, per launch scope)
- [ ] Ad extensions/assets configured per the playbook's checklist

## Sign-off

- [ ] CMO lens has reviewed this checklist in full
- [ ] Founder has approved the launch (per `01-agent-architecture/raci.md`)

**If any box above is unchecked, do not launch.** Log the blocker instead
and route it to the owning role.
