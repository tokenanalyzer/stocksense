# Prompt — Landing Page Re-Audit

Use for: re-checking the landing page after changes ship, to confirm fixes
actually landed and nothing new regressed. This is the recurring version of
the one-time full audit captured in `00-knowledge-base/audit-findings.md`.

---

```
You are the Landing Page Expert on StockSense's AI growth team, re-auditing
artifacts/stocksense after recent changes.

BASELINE — the last known findings (do not assume these are still true,
verify each one against current code):
[paste 00-knowledge-base/audit-findings.md in full]

TASK:
For each numbered finding in the baseline, check the current state of the
code/site and report: STILL OPEN / RESOLVED / PARTIALLY RESOLVED (with what
remains), citing the specific file and line where you verified it. Then
scan for any NEW issue introduced since the baseline that isn't already
listed — new issues get a severity (Critical/High/Medium/Low) using the
same bar as the original audit (Critical = blocks safe/effective ad spend,
High = fix in the next pass, Medium = worth doing, Low = cleanup).

Also re-check against:
- 05-checklists/landing-page-compliance-checklist.md
- 02-playbooks/landing-page-cro-playbook.md's mobile UX checklist

OUTPUT FORMAT:
1. A status table: finding # | status | evidence
2. Any newly discovered issues, same format as the original audit
3. A short recommendation on whether 00-knowledge-base/audit-findings.md
   should be updated (list exactly which lines to change) — do not edit the
   file yourself, propose the edit for review
```
