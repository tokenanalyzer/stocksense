# Site Audit Findings (2026-08-06)

Full-site audit performed prior to standing up this marketing system.
Persisted here so it's durable, version-controlled context — not just a
one-off report — and so `ROADMAP.md` Phase 2/3 exit criteria trace back to
something concrete. Re-run this audit after each phase closes and append a
dated update below rather than editing the original findings away.

**Nothing in this file has been fixed yet.** Every item is still open as of
this writing. Do not launch paid traffic before the Critical items close
(Phase 2).

## Critical

1. **Zero conversion tracking.** No GA4, no GTM, no Google Ads conversion
   tag, no Meta Pixel anywhere in `artifacts/stocksense`. Every click bought
   today is unmeasured.
2. **Mandatory, non-dismissible 9-field lead gate.** `LeadGate` in
   `src/pages/Landing.tsx` blocks all content behind a full form with no
   close button, firing 500ms after load. Largest identified conversion-rate
   and Landing Page Experience risk on the site.
3. **~10.9MB of unoptimized hero/section images.** Five raw PNGs in
   `src/assets/` (1.2–3.4MB each), no compression, no `width`/`height`, no
   lazy-loading, no responsive `srcset`. Will fail Core Web Vitals /
   LCP on mobile.
4. **Admin password shipped in the public JS bundle.** `VITE_ADMIN_PASSWORD`
   is inlined into client JS by Vite and reused as a plaintext bearer token
   against a publicly-reachable Google Apps Script endpoint
   (`google-apps-script/Code.gs`, deployed "Anyone" access). Anyone can
   extract it and pull every lead's PII.
5. **Privacy Policy / Terms links are placeholders (`href="#"`).** Three
   forms collect name, phone, city, and financial details with no working
   privacy policy anywhere — a known Google Ads disapproval trigger.
6. **Google Ads financial-services certification status unverified** for
   the India account. Trading/investment education is a restricted category
   in some regions.

## High

7. **No thank-you page.** All three forms resolve to an inline success
   state; the URL never changes, so there's no page to key a
   "visits a page" conversion off of.
8. **Form asks for 9 fields before any value has been shown**, repeated
   identically across the gate, inline section, and booking modal.
9. **Broken social share preview.** `public/opengraph.jpg` exists but
   `index.html` never references it — no `og:image`/`twitter:image` meta tag.
10. **`/admin` is publicly crawlable**, not blocked in `robots.txt`, no
    `noindex`; "auth" is a client-side string comparison.
11. **No spam protection** on the public Apps Script lead endpoint — no
    CAPTCHA, honeypot, or rate limit.
12. **Silent submission failures.** `submitLead()` uses
    `fetch(..., {mode:"no-cors"})`, so a server-side failure still shows the
    user "Request Received" — leads can be lost invisibly.
13. **No structured data.** The 6-question FAQ section has no `FAQPage`
    schema; no `Organization`/`EducationalOrganization` markup.

## Medium

14. No `sitemap.xml` or canonical tag.
15. Heavy client bundle — ~25 `@radix-ui/*` packages installed, most unused
    by this single page; `framer-motion` animates nearly every section from
    `opacity:0`, risking perceived-render delay on top of the image issue.
16. No self-serve booking step after form submission.
17. Form inputs missing `autoComplete` attributes (name/mobile).
18. No remarketing audience capture (downstream of missing GTM/GA4).
19. No image loading strategy (lazy-load, intrinsic size, fetch priority)
    independent of the raw file-size issue above.

## Low

20. No `favicon.ico` / apple-touch-icon fallback (SVG-only favicon).
21. Meta `keywords` tag present (harmless, no modern SEO value).
22. No `og:locale` (e.g. `en_IN`) set.
23. Footer legal links point nowhere (same root cause as #5, tracked
    separately as general link hygiene).

## How this file should be used

- **Phase 2 of `ROADMAP.md`** exists specifically to close items 1–6.
- **Phase 3** closes items 2, 7, 8, 16, 17.
- **Phase 4** closes items 9, 10, 13, 14, 20–23.
- `05-checklists/pre-launch-checklist.md` and
  `05-checklists/quality-score-checklist.md` both reference these item
  numbers directly — don't renumber this list without updating those.
