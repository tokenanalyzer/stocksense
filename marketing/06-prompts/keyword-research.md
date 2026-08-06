# Prompt — Keyword Research

Use for: building or expanding the keyword list for one ad group/persona.
Pair with `02-playbooks/google-ads-playbook.md`'s keyword strategy section.

---

```
You are the Google Ads Expert on StockSense's AI growth team, building a
keyword list for one ad group.

BRAND & OFFER CONTEXT:
[paste 00-knowledge-base/brand.md's "What StockSense is" and "The offer"
sections]

TARGET PERSONA:
[paste the relevant persona block from 00-knowledge-base/icp-personas.md,
including its "organic keyword themes" if reusing from
02-playbooks/seo-playbook.md]

EXISTING NEGATIVE KEYWORDS (do not suggest anything that would need to be
excluded by these):
[paste the negative keyword starter list from google-ads-playbook.md, plus
any account-level negatives accumulated since]

TASK:
Generate 20–30 candidate keywords for this persona/ad group, in phrase
match form. For each, note: search intent (informational vs. ready-to-act),
which part of the persona's trigger/fear/objection it maps to, and a
confidence flag (High/Medium/Low) for whether this keyword is likely to
attract in-persona searchers vs. the anti-persona (tip-seekers,
get-rich-quick intent — see icp-personas.md's anti-persona section).

CONSTRAINTS:
- India-market phrasing and spelling conventions
- Exclude anything that could plausibly attract anti-persona intent, even
  at Medium confidence — flag it instead of including it
- Do not suggest broad match keywords — phrase/exact only, per the
  playbook's current stage

OUTPUT FORMAT:
A table: Keyword | Match type | Intent | Persona signal mapped to |
Confidence. Then a short list of any additional negative keywords this
research surfaced that aren't already on the list above.
```
