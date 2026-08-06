# RACI — Marketing Decisions

R = Responsible (does the work) · A = Accountable (owns the outcome, final
call) · C = Consulted (input required beforehand) · I = Informed (told
after). Every row should have exactly one **A**.

Roles are abbreviated: **Founder** (you), **CMO**, **Ads** (Google Ads
Expert), **GA4**, **GTM**, **CRO**, **LP** (Landing Page Expert), **SEO**,
**Copy** (Copywriting Expert), **PM** (Performance Marketing Expert),
**Comp** (Competitor Research Expert).

| Decision / activity | Founder | CMO | Ads | GA4 | GTM | CRO | LP | SEO | Copy | PM | Comp |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Approve a `ROADMAP.md` phase transition | **A** | R | I | I | I | I | I | I | I | I | I |
| Set/change monthly ad budget cap | **A** | C | C | I | — | — | — | — | — | R | — |
| Approve a new campaign launch | A | **A/R** | R | C | C | — | C | — | C | C | — |
| Pause/kill an underperforming campaign | I | A | **R** | C | — | — | — | — | — | C | — |
| Change bidding strategy (e.g. Maximize Conv. → tCPA) | I | A | **R** | C | — | — | — | — | — | C | — |
| Add/remove negative keywords | I | I | **R/A** | — | — | — | — | — | — | — | — |
| Publish new ad copy | I | I | C | — | — | C | — | — | **R/A** | — | C |
| Ship a landing page copy change | I | A | — | I | C | C | **R** | — | R | — | — |
| Ship a landing page structural/code change | **A** | R | — | I | C | R | **R** | — | C | — | — |
| Add/modify a GTM tag or trigger | I | I | C | C | **R/A** | — | I | — | — | — | — |
| Change a GA4 event/conversion definition | I | A | C | **R** | C | C | — | — | — | — | — |
| Approve a CRO experiment to go live | I | A | I | C | I | **R** | R | — | C | — | — |
| Call a CRO experiment (ship/kill/iterate) | I | A | I | C | — | **R** | R | — | — | — | — |
| Publish SEO/content piece | I | A | — | — | — | — | C | **R** | R | — | — |
| Change robots.txt / indexability | I | A | — | — | — | — | C | **R** | — | — | — |
| Weekly performance report | I | A | C | C | — | C | — | — | — | **R** | — |
| Monthly strategic report | **A/R** (reviews) | R | C | C | — | C | C | C | — | C | C |
| Quarterly competitor teardown | I | A | C | — | — | — | — | — | C | — | **R** |
| Confirm Google Ads policy/certification status | **A** | R | R | — | — | — | — | — | — | — | — |

## Notes

- **Founder is Accountable for anything that spends money, ships to
  production, or carries compliance/policy risk** — phase approvals, budget
  caps, code-touching changes, and Ads policy/certification confirmation
  all route through the founder regardless of who did the work.
- **CMO is Accountable by default** for everything else — if a decision
  isn't listed here, it defaults to CMO-accountable, role-responsible,
  founder-informed until this table is updated.
- If a row's "R" role and "A" role disagree, the CMO arbitrates before
  anything ships (see `01-agent-architecture/growth-team.md`, "How
  handoffs work in practice").
