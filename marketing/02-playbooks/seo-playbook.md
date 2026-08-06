# SEO Playbook

Organic is the channel that eventually lowers blended CPL as paid scales —
treat it as a standing investment, not a one-time cleanup pass.

## Technical baseline (Phase 4 — not yet shipped)

Tracked against `audit-findings.md` items #9, #10, #13, #14, #20–23.
Nothing below is done as of this writing:

- [ ] `sitemap.xml` generated and submitted to Search Console
- [ ] Canonical tag on the landing page
- [ ] `og:image`/`twitter:image` pointed at the existing
      `public/opengraph.jpg`, plus `og:locale = en_IN`
- [ ] `FAQPage` structured data wrapping the existing FAQ section content
- [ ] `EducationalOrganization` structured data (name, logo, description,
      contact) on the homepage
- [ ] `/admin` blocked via `robots.txt` disallow **and** `noindex`
- [ ] `favicon.ico` + apple-touch-icon fallback alongside the existing SVG

## Keyword-to-persona mapping

Reuse the same persona set as paid (`00-knowledge-base/icp-personas.md`) so
organic and paid reinforce the same positioning instead of drifting apart:

| Persona | Organic keyword themes |
|---|---|
| Curious Zero (beginner) | "how to start investing in stock market india", "stock market for beginners explained", "is stock market safe for beginners" |
| No Time to Filter (professional) | "best way to learn stock market quickly", "1:1 stock market mentor india", "stock market course for working professionals" |
| Opened, Now What (demat holder) | "opened demat account now what", "demat account but dont know how to invest", "first trade mistakes to avoid" |
| Serious Student (tried/learning) | "why am i losing money in stock market", "stock market discipline vs trading tips", "stock market mentor vs course" |

## Content plan

- **Cadence:** one substantive piece per persona per quarter to start
  (4/quarter), scaling with capacity — quality and compliance accuracy over
  volume, given the financial-education context.
- **Format:** long-form answer content mapped to the keyword themes above,
  written to genuinely answer the query (not just bait a click into the
  funnel) — this also directly reinforces the "education first" brand
  promise from `brand.md`.
- **Every piece routes through `06-prompts/seo-content-brief.md`** for the
  brief, then the same compliance guardrails in `brand.md` and
  `05-checklists/ad-copy-checklist.md`'s claims-verification section apply
  to organic content too — a compliance issue in a blog post is still a
  compliance issue.
- **Internal linking:** every content piece links back to the intro-session
  CTA at least once, contextually — not as a generic banner.

## Off-page / authority

Light-touch for now given the business is pre-scale:

- Ensure Google Business Profile exists and is complete once a fixed
  business location/hours model is decided (currently WhatsApp/call-based —
  confirm with founder whether a GBP listing is even appropriate before
  creating one).
- No link-building campaign planned in Phase 4 — revisit once organic
  content has a few months of runway; earned links from genuinely useful
  content are the target, not directory submissions.

## Measurement

Once GA4 is live (Phase 2), track organic sessions, organic → lead rate,
and keyword-level Search Console performance monthly
(`07-reporting/monthly-report-template.md`). Don't evaluate SEO investment
on a weekly cadence — the feedback loop is inherently slower than paid.
