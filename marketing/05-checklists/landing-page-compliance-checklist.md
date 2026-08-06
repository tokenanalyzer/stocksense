# Landing Page Compliance Checklist

Run any time landing page copy, forms, or legal/consent content changes —
in addition to, not instead of, `sop-landing-page-change.md`.

## Data collection & privacy

- [ ] Privacy Policy is live, accurate, and linked everywhere personal data
      is collected (all three forms)
- [ ] Consent checkbox language accurately describes how the lead will be
      contacted (call/SMS/WhatsApp) and matches what actually happens
- [ ] No personal data (name, phone) is passed unhashed into any
      third-party ad platform pixel (`ga4-gtm-tracking-playbook.md`)
- [ ] Terms of Service is live and linked

## Financial-education specific

- [ ] "Not SEBI-registered" / educational-only disclaimer is present,
      legible, and not buried below an unreasonable amount of scroll
- [ ] No page copy implies guaranteed returns, safe trades, or specific
      stock performance
- [ ] No use of "advice," "recommendation," "tip," or "signal" in a way
      that could be construed as investment advice
- [ ] Any learner-count or outcome stat shown on the page is currently
      accurate and verifiable (`brand.md` guardrails)

## Form & consent mechanics

- [ ] Consent is opt-in (checkbox unchecked by default) — never pre-checked
- [ ] Form only collects fields actually needed to act on the lead
      (revisit against `landing-page-cro-playbook.md`'s minimum-viable-form
      principle whenever a field is added)
- [ ] Error states tell the user what actually went wrong, not a generic
      "something went wrong" that hides a real failure
      (`audit-findings.md` #12 — fix the underlying silent-failure issue
      before trusting this box)

## Technical

- [ ] `/admin` is not reachable or indexable without authentication
      (`audit-findings.md` #4, #10)
- [ ] No credentials or tokens are visible in browser devtools / page
      source (re-check after any auth-related change, not just once)
