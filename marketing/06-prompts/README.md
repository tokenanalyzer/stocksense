# Prompt Library

Reusable prompt templates, one per recurring growth-team task. Each one is
written to be pasted as-is (with the `[bracketed]` placeholders filled in)
into a fresh AI session — they carry their own context so the output
quality doesn't depend on the rest of this conversation history still
being loaded.

Every prompt below assumes the model will also have (or should be given)
read access to `00-knowledge-base/` — if it doesn't, paste the relevant
knowledge-base file's contents in alongside the prompt.

| Prompt | Use it for | Owning role |
|---|---|---|
| [`ad-copy-generator.md`](ad-copy-generator.md) | Drafting Google Ads headlines/descriptions for a specific ad group | Copywriting Expert |
| [`keyword-research.md`](keyword-research.md) | Building/expanding a keyword list for a persona/ad group | Google Ads Expert |
| [`landing-page-audit.md`](landing-page-audit.md) | Re-auditing the landing page after changes ship | Landing Page Expert |
| [`competitor-teardown.md`](competitor-teardown.md) | Quarterly competitor research refresh | Competitor Research Expert |
| [`seo-content-brief.md`](seo-content-brief.md) | Briefing an organic content piece | SEO Expert |
| [`weekly-report-summary.md`](weekly-report-summary.md) | Turning raw weekly numbers into the report narrative | Performance Marketing Expert |

## Ground rules for every prompt in this folder

- Always name the persona (`00-knowledge-base/icp-personas.md`) the output
  is for — nothing in this system should be written for a generic audience.
- Always instruct the model to check output against `brand.md`'s
  compliance guardrails before finalizing — don't rely on a separate pass
  to catch a violation the generation step could avoid.
- Prompts produce **drafts for review**, not auto-approved output — every
  output still routes through the matching checklist in `05-checklists/`.
