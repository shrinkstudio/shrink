# Figma vs Webflow parity (18 Oct 2026)

Figma: Shrink Studio Master `gGOa6sQtts0WoMR8rUwwDo`, page 🧩 Components `4355:1007` + 📄 Full Pages `4357:2`.
Webflow: ss-2027 `6a8daa3ae6b8009a3d00e586`.

## Radius: fixed in Figma today
Each Webflow class radius now maps to a Figma variable (no hard-coded corners left on cards, panels or primitives).

| Webflow variable | Value | Figma variable | Used on |
|---|---|---|---|
| Card/Border Radius | 12 | radius/mid | package-card, featured-card, testimonial-card + media, testimonials_wrap, cta-card_wrap, nav-dropdown_content, In short cards, case images, article card, grey CTA bars |
| Card/Border Radius Large, Nav/Radius | 14 | radius/mid-main | hero-marquee_media, needs-card_visual, service-row_media, work_card, footer card |
| Button, Input, Nav/Radius Inner | 8 | radius/small | Button (was 4), inputs, search field, mega nav package links |
| Tag (tag, chip, filter_btn, segment) | 6 | radius/xsmall | Tag (was 2), chips, filter chips, package card tags |
| Checkbox | 2 | radius/tiny | Checkbox |

Package cards (Packages section + Package card) also clip their visual now, so the top corners round.

## Components in both
Tag, Button, Filter Button (Filter chips), Search Form (Search field), Segment, Segmented Control, Stat, Detail (Detail list), List Item (Numbered list), Accordion (FAQ rows), Mega Nav (Navigation, both dropdowns, phone menus), Simple Nav (Navigation, lead pages), Footer (Footer, Footer slim), CTA Card, Testimonial Slider, Testimonial Card, Enquiry Form (Form fields, Chips, Checkbox, Lead form section), Resource Form (Lead magnet section), Cal Embed (Book a call section), Hero Marquee Cards (Home marquee), Service Link (Services rows), Ask AI (inside In short).

## In Webflow, missing from Figma
- Underline Link: only drawn inside other components. Add as a primitive (hover / alt, arrow on/off).
- Eyebrow.
- Nav Banner (top-of-page strip).
- Readiness Quiz UI: Figma only has the Quiz banner; the quiz steps and results screen aren't designed.
- Ask AI as its own component (only exists nested in In short).
- MAST leftovers, no Figma needed unless used: Modal, Slider, Inline Video, Marquee, Tabs, Table, Theme Toggle, [CMS] Blog, Nav (MAST, unused, delete).
- Layout helpers (Section, Grid Row/Column, Spacer, Border, Content Wrap, Card, Image, Heading, Plain Text, Rich Text): no Figma component needed; Figma uses auto layout + text styles.

## In Figma, not yet in Webflow
- **Pricing page (09)**: no Webflow page exists. Needs Nav link (with Button toggle) and Price row as Webflow components first.
- **Nav link** `4620:524`: Webflow mega nav uses raw `mega-nav_icon-link`; worth making a component so Pricing and the Resources dropdown share it.
- **Price row** `4620:543`.
- **Package card** `4356:180`: `.package-card` class exists in Webflow, not as a component.
- **Case study card + carousel** `4493:232` / `4493:239`: proposal, awaiting approval.
- **Article card** `4497:280`: built raw on Resources; fine as markup (CMS), no component needed.
- Pages to confirm in Webflow: 05 Clarity Sprint, 06 Seed Website, 07 Compound (Services Template items?), 08 Solution (Solutions Template), 17 Lead magnet (Guides Template), 18 Book a call (Calls Template).
- Deleted on purpose in Webflow, still in Figma: Studio row `4456:234`, Recent work links `4356:175`. Remove from Figma or label as retired.

## Still to check (not done today)
- Colours: Figma border-primary rgba(26,28,33,0.1) vs Webflow --primary--border #f4f4f5 (flagged 16 Oct).
- Type scale per breakpoint (Figma Text Main 18/16 modes vs Webflow).
- Spacing variables on cards (Card/Padding 16 to 24 fluid vs Figma fixed paddings).
