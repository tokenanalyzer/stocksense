# SOP — Tracking Setup (GA4 + GTM + Google Ads)

**Owner:** GTM Expert (implementation), GA4 Expert (event/conversion QA)
**When to use:** Once, at Phase 2 kickoff, and again any time a new event
is added to `02-playbooks/ga4-gtm-tracking-playbook.md`'s taxonomy.
**Prerequisite:** `ROADMAP.md` Phase 2 approved by the founder.

## Steps

1. **Create the GA4 property** (if not already existing) and note the
   Measurement ID. Confirm data stream is set to the production domain.
2. **Create the GTM container**, install the base snippet in
   `artifacts/stocksense/index.html` (head + body per Google's standard
   snippet), publish nothing yet.
3. **Add the GA4 Configuration tag** in GTM, firing on All Pages. Publish
   to a **staging/preview environment first**, never straight to
   production.
4. **Instrument dataLayer pushes in the app code** for each event in the
   taxonomy table (`ga4-gtm-tracking-playbook.md`) — this is an application
   code change and needs its own approval/PR under the relevant roadmap
   phase; it is not a GTM-only task.
5. **Build one GTM tag + trigger per event**, following the naming
   convention in the playbook exactly.
6. **QA every single tag in GTM Preview mode** against
   `05-checklists/tracking-qa-checklist.md` before publishing:
   - Fires on the correct action, exactly once (not on every re-render)
   - Correct parameters attached
   - Does not fire on the admin (`/admin`) route unless explicitly intended
7. **Create the Google Ads conversion action** ("StockSense – Lead
   Submitted"), get the conversion ID/label, add the Google Ads Conversion
   tag in GTM firing on the `lead_submit_success` trigger.
8. **Link Google Ads ↔ GA4** in each platform's settings so audiences and
   conversion data can flow both directions.
9. **Test end-to-end**: submit a real test lead on staging (or production
   with a clearly-marked test entry), confirm it appears in:
   - GTM Preview
   - GA4 DebugView (real-time)
   - Google Ads' conversion diagnostics (may take up to 24h to fully
     register — don't panic if it's not instant, but do confirm the tag
     fired via GTM/GA4 first)
10. **Publish the GTM container to production** only after step 9 passes
    completely.
11. **Document the live Measurement ID, GTM container ID, and Google Ads
    conversion ID** in this file's "Live IDs" section below (do not commit
    API keys/secrets — IDs only).
12. **Update `ROADMAP.md`'s approval log** marking Phase 2's tracking
    exit-criteria item complete, with the date.

## Live IDs

_Populate once Phase 2 ships — leave blank until then, do not guess or
placeholder with fake IDs._

- GA4 Measurement ID: _(not yet installed)_
- GTM Container ID: _(not yet installed)_
- Google Ads Conversion ID/Label: _(not yet installed)_

## Rollback

If a published tag misfires in production (wrong trigger, duplicate fires,
or breaks page functionality): revert to the previous GTM container
version immediately (GTM's version history makes this a one-click action),
then re-QA in Preview before attempting to republish. Never leave a
misfiring tag live "to investigate later."
