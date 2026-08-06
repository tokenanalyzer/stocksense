# GA4 & GTM Tracking Playbook

Standing doctrine for the measurement layer this entire system depends on.
**None of this is installed yet** — this is the spec Phase 2 implements
against, and the reference every later tag change is checked against.

## Why this comes before everything else

Every other playbook assumes reliable conversion data exists. It doesn't
yet (`audit-findings.md` #1). Until this ships, no bidding strategy
decision, no CRO test read-out, and no report in `07-reporting/` can be
trusted — treat any number claimed before Phase 2 closes as unverified.

## Event taxonomy

Names below use `snake_case` per GA4 convention. Define these exactly —
don't let ad-hoc event names accumulate; every new event needs an entry
here before it ships.

| Event | Fires when | Params |
|---|---|---|
| `gate_view` | The mandatory lead gate renders | — |
| `gate_dismiss` | User closes/bypasses the gate (only applicable after Phase 3 makes it dismissible) | — |
| `form_start` | First interaction with any field in any of the three lead forms | `form_location` (`gate` \| `inline` \| `booking_modal`) |
| `lead_submit_success` | `submitLead()` resolves without throwing | `form_location` |
| `lead_submit_error` | `submitLead()` throws / shows the error state | `form_location`, `error_type` |
| `whatsapp_click` | The floating WhatsApp button or footer WhatsApp link is clicked | `click_location` |
| `call_click` | A `tel:` link is clicked (admin dashboard today; site once a call CTA exists) | `click_location` |
| `nav_book_click` | Any "Book Free Session" CTA is clicked (header, hero, footer, FAQ) | `cta_location` |
| `scroll_75` | User scrolls past 75% of page height | — |

`lead_submit_success` is the **Google Ads conversion event**. Everything
else exists to diagnose the funnel around it, per
`02-playbooks/landing-page-cro-playbook.md`'s experiment framework.

> **Known limitation to design around:** `submitLead()` currently uses
> `fetch(..., {mode:"no-cors"})`, so the client cannot actually confirm the
> Apps Script write succeeded (`audit-findings.md` #12). Until that's
> fixed, `lead_submit_success` measures "the request was sent," not
> "the lead was saved" — note this explicitly in any report that cites the
> event, and prioritize fixing the underlying fetch behavior alongside the
> tracking install, not after it.

## GTM container structure

```
StockSense - Web
├── Tags
│   ├── GA4 Configuration (base tag, all pages)
│   ├── GA4 Event – [event name]         (one per taxonomy entry above)
│   └── Google Ads Conversion – Lead Submit
├── Triggers
│   ├── Custom Event – matching each dataLayer push
│   └── Click triggers only where a custom event isn't feasible
├── Variables
│   ├── DLV – form_location
│   ├── DLV – cta_location
│   └── GA4 Measurement ID (constant)
└── Folders: one per funnel area (Gate, Inline Form, Booking Modal, Nav/CTA)
```

- Prefer **dataLayer pushes from the app** over fragile CSS-selector click
  triggers — more resilient to landing page changes, and keeps the GTM
  Expert from needing to chase every markup edit.
- **One container, environments for dev/staging/prod** — never test a new
  tag directly in the live production environment; use GTM's built-in
  environments and Preview mode.

## Conversion mapping

| GA4 event | Google Ads conversion action | Bidding-eligible from |
|---|---|---|
| `lead_submit_success` | "StockSense – Lead Submitted" | Day 1 (primary conversion) |
| `whatsapp_click` | "StockSense – WhatsApp Engagement" (secondary/observation only) | Not used for bidding — engagement signal only, too weak a proxy for a real lead |

Only `lead_submit_success` should ever be set as the primary, bidding-
eligible conversion action. Don't let a secondary engagement signal creep
into Smart Bidding's target — it will optimize for the wrong thing.

## Naming convention

`GA4 Event – snake_case_name` for tags, `CE – snake_case_name` (Custom
Event) for triggers, `DLV – camelCaseName` for data layer variables. Keep
this consistent so the container is legible to whoever opens it next,
human or AI.

## QA gate

No tag, trigger, or variable publishes without passing
`05-checklists/tracking-qa-checklist.md` in GTM Preview mode first, per
`03-sops/sop-tracking-setup.md`.
