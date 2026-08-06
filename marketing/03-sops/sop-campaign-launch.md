# SOP — Campaign Launch

**Owner:** Google Ads Expert
**When to use:** Launching any new campaign or ad group.
**Prerequisite:** `ROADMAP.md` Phase 5 approved; Phase 2 tracking verified
end-to-end (`sop-tracking-setup.md` step 9 complete and IDs populated).

## Steps

1. **Confirm the persona and angle** this campaign/ad group targets —
   pull directly from `00-knowledge-base/icp-personas.md`. If it doesn't
   map to an existing persona, stop and raise it with the CMO lens before
   building anything.
2. **Build the keyword list** using `06-prompts/keyword-research.md`,
   phrase + exact match only per `02-playbooks/google-ads-playbook.md`.
3. **Apply the negative keyword starter list** from the playbook, plus any
   account-level negatives already accumulated from prior campaigns'
   search terms reports.
4. **Write ad copy** using `06-prompts/ad-copy-generator.md`, minimum 3
   headline/description variants per ad group for testing.
5. **Run every piece of copy through
   `05-checklists/ad-copy-checklist.md`** — no exceptions.
6. **Confirm the landing destination** — every ad in this campaign should
   land on a page/section whose content actually matches the ad's promise
   and persona (message match). Note the destination URL per ad group.
7. **Set the daily budget cap** at the founder-approved level for this
   launch — do not exceed it without going back through budget approval
   (see `01-agent-architecture/raci.md`).
8. **Select bidding strategy per the Stage 1 row** of
   `google-ads-playbook.md`'s progression table (Manual CPC or Maximize
   Clicks at launch — never Target CPA on a brand-new campaign).
9. **Set geo targeting** (India-wide at launch, per the playbook), device
   settings (no exclusions at launch unless there's a specific reason),
   and confirm the ad schedule is unrestricted unless day-parting data
   already exists from a prior campaign.
10. **Run the full `05-checklists/pre-launch-checklist.md`** before
    enabling the campaign.
11. **Launch at the approved budget**, and immediately confirm in Google
    Ads that the campaign status is "Eligible" (not "Under review",
    "Limited", or disapproved) within the first few hours.
12. **Log the launch** in `07-reporting/weekly-report-template.md`'s
    running notes so the next weekly review has the launch date as
    context for interpreting early data.

## First 72 hours

Do not change bids, budgets, or targeting in the first 72 hours except to
**pause** something clearly broken (policy disapproval, an obviously wrong
destination URL, a keyword that's clearly mismatched). Early data is noisy
— resist the urge to "optimize" before there's enough of it to act on.

## Rollback

If a campaign is disapproved or restricted post-launch: pause immediately,
diagnose the specific policy flag in Google Ads' policy manager, fix the
root cause (ad copy, landing page, or certification issue), and re-submit.
Never edit around a policy flag without understanding why it fired —
repeated violations escalate to account-level review.
