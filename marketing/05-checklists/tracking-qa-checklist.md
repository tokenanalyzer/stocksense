# Tracking QA Checklist

Run in GTM Preview mode before publishing **any** tag/trigger/variable
change — new install or edit to an existing one. Referenced from
`sop-tracking-setup.md` and `sop-landing-page-change.md`.

## Per-tag checks

- [ ] Tag fires on the intended trigger only — click through the actual
      user flow in Preview mode, don't just inspect the config
- [ ] Tag fires **exactly once** per action (a re-render or a double-click
      shouldn't double-fire it — check specifically for this on the lead
      forms, which have loading/disabled states that can mask a double-fire)
- [ ] All expected parameters are present and correctly valued (check the
      actual payload in Preview, not just the variable config)
- [ ] Tag does **not** fire on `/admin` unless explicitly intended for an
      admin-specific event
- [ ] No PII (raw name, raw phone number) is passed into any tag headed to
      a third-party platform

## Per-event checks (cross-reference `ga4-gtm-tracking-playbook.md`'s taxonomy)

- [ ] Event name matches the taxonomy exactly (`snake_case`, exact spelling)
- [ ] `lead_submit_success` fires only on an actual successful
      `submitLead()` resolution, not on button click alone
- [ ] `lead_submit_error` fires on the error path and doesn't also
      double-fire `lead_submit_success`
- [ ] `form_location` parameter correctly distinguishes gate / inline /
      booking_modal on every relevant event

## End-to-end confirmation

- [ ] Event appears in GA4 DebugView within seconds of the action
- [ ] For the lead-submit conversion specifically: appears in Google Ads'
      conversion diagnostics (may take up to 24h to fully register, but
      confirm the GTM/GA4 side is instant first)

## Before publishing to production

- [ ] All boxes above checked in Preview mode against staging
- [ ] Previous container version noted (for fast rollback per
      `sop-tracking-setup.md`'s rollback section)
- [ ] Publish, then immediately re-run the end-to-end confirmation once
      more against the live production URL
