# SOP — Landing Page Change

**Owner:** Landing Page Expert (spec), CRO Expert (if it's a test),
implementation gated by an approved `ROADMAP.md` phase.
**When to use:** Any change to `artifacts/stocksense` page structure,
copy, or form behavior — from a one-word label edit to a full section
redesign.

## Steps

1. **Confirm the phase.** Is this change inside an already-approved
   `ROADMAP.md` phase? If not, stop — raise it to the founder for approval
   before any code is written, per this system's ground rule.
2. **Classify the change:**
   - **Copy-only** → route through `sop-ad-copy-review.md` in addition to
     this SOP.
   - **Structural/behavioral** (form fields, gate logic, layout) → must be
     framed as a CRO experiment per `02-playbooks/landing-page-cro-playbook.md`
     unless it's a straightforward audit-finding fix with no reasonable
     alternative (e.g. adding `width`/`height` to an image tag).
3. **Write the spec** — the Landing Page Expert lens documents exactly
   what changes, field by field/section by section, before any code is
   touched.
4. **Check tag dependencies.** Does this change remove, rename, or move
   any element a GTM trigger or dataLayer push depends on
   (`02-playbooks/ga4-gtm-tracking-playbook.md`)? If yes, the GTM Expert
   lens updates the tag plan *before* the change ships, not after.
5. **Check compliance.** Any copy change re-runs the relevant checks in
   `05-checklists/ad-copy-checklist.md`; any change to the consent
   checkbox, disclaimer, or privacy-policy link gets extra scrutiny — these
   are load-bearing for Google Ads policy compliance
   (`00-knowledge-base/audit-findings.md` #5).
6. **Implement** under the approved phase, following the project's normal
   engineering practices (typecheck, review) — this SOP governs the
   marketing-side process around the change, not the engineering mechanics.
7. **QA on mobile first**, then desktop, against
   `02-playbooks/landing-page-cro-playbook.md`'s mobile UX checklist.
8. **Verify tracking still fires correctly** post-change — GA4 DebugView,
   same events, same parameters, before calling the change done.
9. **If this was a CRO experiment**, log it in the experiment backlog
   (`landing-page-cro-playbook.md`) with start date and the metric being
   watched — the CRO Expert lens owns the read-out per the playbook's
   duration/sample-size guardrails.
10. **Update `00-knowledge-base/audit-findings.md`** if this change closes
    one of the numbered findings — mark it resolved with the date rather
    than deleting the line, so the history stays visible.

## Rollback

Any structural/behavioral change ships behind the ability to revert
quickly (git revert / feature flag if one exists) — if the guardrail
metric in a CRO test regresses sharply, revert first and analyze after,
don't leave a regressing variant live "to get more data."
