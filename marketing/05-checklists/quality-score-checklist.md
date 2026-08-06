# Quality Score & Ad Rank Checklist

Run monthly (`04-workflows/monthly-workflow.md`) and any time a keyword's
Quality Score drops. Organized by Google's three QS components so a low
score can be diagnosed to the right owner instead of guessed at.

## Expected CTR

- [ ] Ad copy headline includes the persona's specific trigger/keyword, not
      just a generic brand headline
- [ ] At least 3 ad variants running per ad group (rotation gives the
      account real CTR signal to learn from)
- [ ] Sitelinks, callouts, and structured snippets all populated
      (`google-ads-playbook.md` ad assets checklist) — unused extensions
      leave expected-CTR signal on the table

## Ad Relevance

- [ ] Ad group keyword list is tightly themed to one persona, not a mix
      (`google-ads-playbook.md` account structure)
- [ ] Ad copy headline/description actually contains the ad group's core
      keyword theme, not just a related concept

## Landing Page Experience (this account's weakest link — check first)

- [ ] The destination page loads fast on mobile — spot-check with
      PageSpeed Insights; flag if LCP is regressing back toward the
      pre-fix ~10.9MB-image state (`audit-findings.md` #3)
- [ ] The destination page's visible content matches the ad's promise
      within the first screen — no bait-and-switch, no gate blocking the
      promised content (`audit-findings.md` #2)
- [ ] Privacy Policy / Terms links resolve to real pages, not `#`
      (`audit-findings.md` #5)
- [ ] Page is easy to navigate — working nav, no broken anchors/links
- [ ] Original, substantive content — not thin or duplicated across pages

## When a keyword scores ≤5/10

1. Check which component (Expected CTR / Ad Relevance / Landing Page
   Experience) Google Ads attributes the low score to — it's shown per
   keyword in the UI.
2. Route the fix to the right owner: Ad Relevance/CTR → Copywriting +
   Google Ads Expert; Landing Page Experience → log against
   `02-playbooks/landing-page-cro-playbook.md`'s backlog, don't try to fix
   a landing page problem with better ad copy.
3. Re-check after the next full data cycle (Quality Score updates with
   volume, not instantly on a fix).
