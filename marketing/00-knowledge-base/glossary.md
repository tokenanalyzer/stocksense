# KPI & Term Glossary

Shared definitions so "conversion rate" or "CPL" means the same thing in
every report. If a term is ambiguous in a weekly report, the definition
here wins — fix the report, not the glossary.

## Core funnel metrics

| Term | Definition | Source once Phase 2 ships |
|---|---|---|
| **Impressions** | Number of times an ad was shown | Google Ads |
| **CTR** | Clicks ÷ Impressions | Google Ads |
| **CPC** | Cost ÷ Clicks (average cost per click) | Google Ads |
| **Sessions** | GA4 sessions on the landing page | GA4 |
| **Gate completion rate** | Leads submitted through the mandatory gate ÷ sessions that saw the gate | GA4 event |
| **Form start rate** | Users who interact with any form field ÷ sessions | GA4 event |
| **Form completion rate** | Successful submissions ÷ form starts | GA4 event |
| **Lead** | A successful submission of any of the three lead forms (gate, inline, booking modal) — recorded as a row in the Google Sheet | Apps Script / Sheet |
| **Qualified lead** | A lead where `experience` + `intent` indicate genuine beginner/learning intent, not spam or anti-persona signals (see `icp-personas.md` anti-persona) | Manual tag in admin, until an automated score exists (see `08-automation/automation-plan.md`) |
| **CPL** | Cost ÷ total leads | Calculated |
| **CPQL** | Cost ÷ qualified leads (the number that actually matters) | Calculated |
| **Conversion (Google Ads)** | The event fired when a lead form succeeds — implemented in Phase 2 | Google Ads |
| **Show rate** | Leads who actually take the intro call ÷ leads submitted | Manual / admin status field |
| **Close rate** | Leads who convert to paying (once a paid product exists) ÷ show rate | Manual |

## Quality & bidding terms

| Term | Definition |
|---|---|
| **Quality Score (QS)** | Google's 1–10 estimate of ad/keyword/landing-page relevance; components are expected CTR, ad relevance, and **landing page experience** — the last one is where this site's Critical findings hit hardest (see `audit-findings.md` #2, #3) |
| **Ad Rank** | Determines ad position/whether an ad shows at all; a function of bid × Quality Score × expected impact of extensions/formats |
| **Smart Bidding** | Google's automated bidding (Maximize Conversions, Target CPA, etc.) — requires reliable conversion data to work; do not enable before Phase 2 tracking is verified |
| **RLSA** | Remarketing Lists for Search Ads — audiences of past site visitors used to adjust bids/targeting on Search; requires GA4/Ads linkage from Phase 2 |
| **Enhanced Conversions** | Google Ads feature that improves conversion measurement accuracy using hashed first-party data (e.g. phone number) — a Phase 2+ upgrade once the thank-you page exists |

## CRO & landing page terms

| Term | Definition |
|---|---|
| **LCP** | Largest Contentful Paint — Core Web Vital measuring perceived load speed; currently at risk from the ~10.9MB of unoptimized images (`audit-findings.md` #3) |
| **CLS** | Cumulative Layout Shift — Core Web Vital measuring visual stability; at risk from images without explicit `width`/`height` |
| **INP** | Interaction to Next Paint — Core Web Vital measuring responsiveness |
| **Interstitial** | A full-screen overlay blocking content — the mandatory lead gate is a hard interstitial (`audit-findings.md` #2) |
| **Progressive profiling** | Collecting minimal info upfront and asking for more later/on a second touch, instead of one long form — the recommended fix direction for the 9-field form |

## SEO terms

| Term | Definition |
|---|---|
| **Canonical tag** | `<link rel="canonical">` telling search engines the authoritative URL for a page — currently missing |
| **Structured data / schema** | Machine-readable markup (e.g. `FAQPage`, `Organization`) that can unlock rich results — currently missing despite an FAQ section that qualifies |
| **Indexable** | Whether a page can appear in search results; `/admin` is currently indexable and shouldn't be |
