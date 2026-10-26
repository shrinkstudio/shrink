# CMS field audit, 26 Oct 2026

Every collection on ss-2027, counting the items that hold a value in each field. Nothing deleted: Ben approves each removal. Before deleting a field, check it is not bound anywhere in the Designer (Webflow drops the bindings with it).

## Remove (empty everywhere and replaced by something else)
- Case Studies: `hero-foreground`, `hero-video-source`, `square-image`, `team` (0 of 7).
- News & Insights Categories: `display-order` (0 of 5).
- FAQs: `solution` (0 of 112). `show-on` and the Article reference do this job now.
- Galleries: `alt-text` (0 of 3).
- Clients: `testimonial-photo` (0 of 21).

## Fill rather than remove
- Teams: `linkedin-url` (0 of 5). Named people with LinkedIn profiles help Google and AI answers trust the authors. Worth filling for Ben at least.
- `og-image` is empty on Services, Solutions, Policies, Calls and Teams, and set on 1 of 7 case studies and 1 of 16 articles. Those pages share the default Shrink OG image. Fine for policies and calls; case studies and articles get more clicks on LinkedIn with their own image (as PHP2Shell has).

## Rarely used, keep
- Case Studies `solutions` (1 of 7): fill it so the Solutions pages can list related work, or remove it if that link is not planned.
- Clients `relationship` (1), `total-raised` (2): keep if the testimonial cards will show them.
- Services `phase-6-*`, `approach-note`, `home-open-by-default`: only one service needs a sixth phase. Working as designed.
- Guides: only one item, so every field reads as rare. Ignore.

## Whole collections to check
Archives (5 items), LLM Answers (4), Placements (4) and Galleries (3) have unpublished templates. If no page lists them, they are leftovers from the MAST template and can go.
