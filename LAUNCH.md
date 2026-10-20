# ss-2027: now to launch

Working list for the new Shrink site (staging: ss-2027.webflow.io). Built up page by page.
Last checked against staging: 12 October 2026.

Owner key: **B** = Ben (Designer or a decision), **C** = Claude (via Webflow MCP or API), **B+C** = Ben supplies facts, Claude builds.

---

## Pre-launch review (19 Oct): 404s and SEO

Crawl of 61 staging pages plus Webflow page settings. Launch is 20 Oct.

404s and dead links
- [ ] **B** Policies 404 at both `/policies/*` and `/legals/*`: all 7 items published, but the template page still routes to `/legals` (slug `detail_legals`) while the collection slug is `policies`. Re-save the slug in CMS > Policies settings (or recreate the template), republish. Linked from every footer
- [ ] **C** `/faqs` links (2 per page, nav/footer): point to `/faq`
- [ ] **C** `/book-a-call` (Footer CTA on FAQ, Pricing, Services template): point to `/calls/intro`, and add the 301 anyway
- [ ] **C** `/privacy` (Enquiry Form consent link on Contact): point to `/policies/privacy-policy`
- [ ] **B+C** `/tools/project-calculator` linked twice from Pricing: page not built. Hide the links or build the calculator
- [ ] **B** Calculator in Mega Nav + Footer still `tools.shrink.studio/calculator` on every page; dies when that domain retires
- [ ] **B** `#` links: Tag Link variants with no link (74, About + case studies), Work card cover links (15, Services template + /packages, Designer bind to Current Case Study), Detail Link rows with no link (6, case studies), one Button cover link on About. Ask AI `llm_link` hrefs are `#` until the bundle fills them (crawlers and AI bots see `#`): set real hrefs in Webflow if possible
- [ ] **B** `/case-studies` autoplays `forest-home-2.mp4` (535.6 MB) and `buff-new-site__hero.mp4` (17.5 MB, also on /case-studies/forest-bikes). Compress to a few MB each
- [ ] **B** Delete the empty Placements collection + template (created 19 Oct) if it was a test

Launch-day redirects (from the live sitemap, 30 URLs)
- [ ] **B** `/legals/(.*)` to `/policies/%1`
- [ ] **B** `/projects` to `/case-studies`; `/projects/buff-motion-when-a-motion-studios-website-finally-moves` to `/case-studies/buff-motion`; `/projects/cloudnc-from-fragmented-forms-to-a-21-conversion-rate-increase` to `/case-studies/cloudnc`; `/projects/common-sense-club-quiz-how-forest-made-cycling-safety-impossible-to-ignore` to `/case-studies/forest-common-sense-quiz`; `/projects/forest-b2b-partnerships-site` to `/case-studies/forest-bikes`; `/projects/nxzen-the-beginning-of-a-global-takeover` to `/case-studies/nxzen`; `/projects/steamhaus` to `/case-studies/steamhaus`; no case study for Clarity, Johnson Law Group, Museum Studio, Skira: to `/case-studies`
- [ ] **B** `/style-guide/*` and `/boilerplate/*` to `/`; `/book-a-call` to `/calls/intro`
- [ ] **B** Domain: ss-2027 has no custom domain. Site plan on ss-2027, move shrink.studio + www off the current site, then the tools.shrink.studio redirects

SEO and sharing
- [ ] **B+C** No `og:image` on any page (53). Default share image first, then templates
- [ ] **C** Site-wide JSON-LD (head code): `image` is `[path-to-default-og].png`, `email` is `[hey@shrink.studio]` in brackets
- [ ] **C** "70+" in meta descriptions on About and Case Studies: 50+
- [ ] **C** Pricing: og:title empty (title not copied)
- [ ] **C** Four article titles over 65 chars with the old ", Shrink Studio" ending (conversion-questions-before-design, five-files-ai-can-read-your-site, information-architecture-buyers, landing-page-teardown)
- [ ] **C** Services template og:description joins two fields ("summary | meta-description"): use one
- [ ] **B** MAST demo pages live and indexable at launch: `/styles/components`, `/styles/styles-home`, `/styles/inspired-layouts`, `/styles/basic-layouts`, `/styles/styles`. Draft, delete, or noindex + exclude from sitemap
- [ ] **C** Case study pages skip h2 to h4 (At a glance labels)
- [ ] **B** No analytics installed (only Orbit): PostHog/GA before launch so `data-track` hooks report
- [ ] **B** Site time zone is America/Chicago: set Europe/London
- [ ] **B** Pin `gsap@3` and `mast@latest` script URLs in the head/footer code
- [x] **C** Home: one `w-node` id repeats 3 times (component used three times). Gone after the home rebuild (19 Oct)

Clean: no em dashes, lorem or placeholder copy in visible text; one h1 per page; meta descriptions in range; every img has alt; JSON-LD parses.

Visual pass (desktop 1440 + phone 375)
- [ ] **B+C** Columns don't stack on phones: MAST `.col-lg-*` keeps its 12-column width at every breakpoint (`--grid--columns` stays 12) unless a `col-sm-12`/`col-md-12` class or the Grid Column mobile setting is added. Broken at 375: `/pricing` (price list off-screen), `/services` (Approach steps, quiz Callout, FAQ half width, meta row cut off), `/services/*` (You leave with cards clipped), `/packages/*` (At a glance overlaps body), case studies (At a glance wraps word by word)
- [ ] **B+C** Phone menu with the top Nav Banner showing: panel ignores the banner height, logo overlaps Case Studies, Services sub-panel Back and close sit behind the panel
- [x] **C** Home services rows on phones: `.service-row_title` and `.service-row_price` share grid-area 2/2/3/3, so the name sits on the price. Superseded by the services rows rebuild (19 Oct)
- [ ] **B** Nav Banner copy differs ("Try our quote builder" on home/services/pricing, "Ready to brief a build?" elsewhere, both to the quiz); missing on `/faq` and the quiz page
- [ ] **B** Hero "Start a conversation" goes to `#` on About and the Services template
- [ ] **B** Services template FAQ list shows every FAQ (filter Service = current)
- [ ] **B** Mega nav Resources featured card "Read article" goes to `/resources`, not the article
- [ ] **B** Article Related reading shows Webflow's "No items found." when the category has no other article
- [ ] **B** Guide cover card is plain text on white (dark cover design pending)
- [ ] **B** CTA card button label varies: "Start a Project", "Book a Call", "Start a conversation". Pick one, sentence case
- [ ] **B** "From £5,000/mo" vs "£5,000 a month": pick one
- [ ] **B** Simple Nav has no background, content scrolls under the logo (Contact, Calls, Guides)
- [ ] **B** Low contrast body text on gradient cards (mega nav quiz card, latest article card, Related solution card)
- [ ] **B** About: CloudNC testimonial photo reads as an empty dark box; Work cards uneven heights on Development, packages and CloudNC Latest projects
- [ ] **B** Quiz page title says "Free checklist" but it's a quiz
- [ ] **C** Console: React #425/#422 hydration mismatch from code components (Cal Embed on `/calls/intro`, Readiness Quiz)
- [ ] **B** FAQ page: topics interleave (sort by Display Order looks broken, check sort)

---

## Site-wide

- [ ] **B** Reconnect the Webflow connector (Claude cannot build until this is done)
- [ ] **C** Structured data placeholders: `image` is `[path-to-default-og].png` and `email` is `[hello@shrink.studio]` in the site-wide JSON-LD. Email is **hey@shrink.studio** (Ben, 13 Oct)
- [ ] **B+C** Default social share image, then one per page type
- [ ] **C** Every `href="#"` wired (header "Start a conversation", "Book a Call", "Take the quiz", footer service and case study links)
- [ ] **C** Sites number is 50+ (Ben, 13 Oct). Change "70+ sites" in the About page's search description in Webflow
- [~] **C** Policies (14 Oct): the 7 legal pages are ported into the **Policies** collection (`6acfaf5869b42185ddb06b43`, renamed from Legals, now at `/policies/[slug]`). Template: Section `cc-hero` > Grid Row (Top Center) > Grid Column 6/12 > Ben's tag row, Heading (Name), Plain Text (Summary), Plain Text `u-text-muted` (Last Updated), Border, Rich Text (Body). Footer Show CTA off. All 7 bodies tightened: no em dashes, numbered H4 sections, cross links between policies, processor list matches the new stack (Webflow, Vercel form handler, Airtable, ClickUp, Cal.com, Anthropic; Make and tools.shrink.studio removed 15 Oct, staged). Last updated: October 2026. Footer links repointed to `/policies/*`
- [ ] **B** Policies template: bind SEO title and description to Meta Title and Meta Description (Page settings)
- [ ] **B** Confirm the AI policy's "Your data" section matches how we really work (business-grade tools whose terms keep inputs out of training; personal and confidential client data kept out unless the client agrees)
- [ ] **C** `/policies` index page: build with the FAQ page (they share list functionality)
- [~] **C** Testimonial Slider (14 Oct): Figma component in Proof and conversion (24px quote, photo, progress dots); Quote component aligned. Webflow component `Testimonial Slider` (`a72bad11-4f47-3fa8-2df2-e13fd93f98b6`) = card + dots + counter with an **Items** slot; each page puts a Clients Collection List in the slot (list `testimonials_list`, item `testimonials_item` + `[data-testimonials-item]`, logo/quote/photo/name/role bound). Demo on /styles/components. Module `testimonials.ts` (built, not deployed). Clients fields: Testimonial Short/Long/Name/Role/Avatar, Show In Testimonials, Testimonial Order
- [x] **C** Testimonial list rebuilt (the first list was stuck on an MPS conflict): filter Show In Testimonials on, sort Testimonial Order, limit 8, in the Items slot. SplitText on (Ben)
- [x] **C** Testimonials live in Clients (14 Oct): 7 on (CloudNC, Buff Motion, Steamhaus, Hyperfox, Asset Reality, Arke, Gravita). Long = original Google wording, Short = one verbatim sentence. Logos stay in the photo slot for Asset Reality, Arke, Hyperfox (Ben); Gravita has no photo and role is just "Gravita"
- [ ] **B** Footer script to `fb09566` (testimonials module), publish, check /styles/components
- [ ] **B** Policies 404 on staging (both `/policies/*` and `/legals/*`) after the collection slug was renamed via API: in CMS > Policies settings re-save the slug `policies`, reload, republish. Launch still needs the wildcard 301 `/legals/(.*)` to `/policies/%1`
- [ ] **B** Policies template head: paste the WebPage + BreadcrumbList JSON-LD (14 Oct chat), swap placeholders for fields. Add a Policies breadcrumb level once `/policies` exists
- [x] **B+C** Policy bodies jump h1 to h4. Done 14 Oct: `cc-compact` on the policy Rich Text, bodies swapped to h2/h3, Body help text updated
- [x] **C** Footer (14 Oct): stray placeholder text replaced ("London" + aria-hidden "·"), column titles h4 to h2 (size variant unchanged), Maps link `rel=noopener`. Year span is filled by the inline script
- [ ] **B** Ask AI links: `ask-ai.ts` writes real `href`/`target`/`rel` for link tools (no more `#`). Pushed `bb0abc1`; footer script needs the new SHA
- [x] **C** Section component: removed a stray static `id=""` on its container (the root already applies the ID prop only when set)
- [ ] **B+C** Retire tools.shrink.studio on launch day (Ben, 15 Oct): upload [docs/tools-shrink-studio-redirects.csv](docs/tools-shrink-studio-redirects.csv) with `npx vercel redirects upload docs/tools-shrink-studio-redirects.csv` (or move the domain into `shrink-site-api` with host-conditioned redirects, plan in the side-session notes `tools-retirement.md`). 301s: `/calculator` and `/project-estimator` to `/tools/project-calculator`, `/quiz` and `/quiz/r/*` to the quiz page (keeps `?d=` so old share links rehydrate), everything else to `/resources`. Only after www.shrink.studio serves ss-2027 (`/resources` 404s on the old site). Check a specific row beats the `/*` catch-all, then delete the `shrink-tools` Vercel project (Adfin hero demo can die with it)
- [ ] **C** Mega Nav + Footer "Project calculator" still link to `tools.shrink.studio/calculator` (kept on purpose, 15 Oct). Repoint both to `/tools/project-calculator` when the code component page is live
- [ ] **C** Redirect map from the live site's URLs (`/projects/*` to `/case-studies/*`, `/legals/(.*)` to `/policies/%1`, `/contact`)
- [ ] **B** Delete template demo content (Archives collection, 5 items)
- [ ] **B** Launch switches: indexing on, canonical URL set, sitemap.xml on
- [ ] **C** llms.txt
- [~] **C** Password page (14 Oct): same pattern as the 404. Simple Nav and Footer (Show CTA off) at page level; Webflow blocks components inside the password form and blocks moving the form, so the form wrapper is the `section u-full-height-center`, the form is the `container`, and the content uses raw MAST classes (`tag`, `spacer-component`, `h4`, `u-border`). Field uses the new markup (`input-group[data-validate]` > `input-label` + `input-wrap` > input + `input-icon`, `input-message`), `data-form-validate` on the wrapper, input required. Button reads View page; error message uses `form-error` inside the column. Figma frame `21 Password` added to the Pages set
- [x] **C** Class cleanup (14 Oct): removed unused `footer_cta_wrap`, `llm_wrap`, `llm_item`, `footer_wrap`, `footer_list`, `footer_item`, `footer_address_wrap`, `utility_container`, `utility_form`, `page-wrapper.cc-utility`, junk `_w-input` combos, and the 16 `footer_*` classes from the first static footer. Kept `input.w-input` combo (may be Webflow's built-in input class)
- [~] **C** 404 built to Figma (14 Oct): Simple Nav, Tag "404", headings, "Try one of these" list (rows divided, muted text; `data-fade-list` on the ul, `data-hover` on each link, arrow in `[data-underline-icon]`), Footer Static (Light). Links: /services, /case-studies, /contact. Check on canvas after a Designer reload, then live
- [ ] **C** Orbit conversion goals
- [ ] **B+C** Full pass at three widths, image and video weights (Forest video is 561 MB)

---

## Pages that are built and need fixing

### 1. Services (`/services`)

State now: about 150 words of real copy, generic H1, no prices, no links to the three service pages or the 15 solution pages, no page-level structured data.

Local mock: `~/shrink-prototypes/ss2027-gap/services-page.html` (http://localhost:8797/services-page.html, add `?clean` to hide the notes for Ben). Figma: "Services (proposed content, 12 Oct)", node `4291:999` in the Updates section, with a notes card beside it. Ben is tweaking there.

Fixes
- [x] **C** Hero lede flows as one paragraph (20 Oct, Ben's call): inside Ben's wrapper Div, the Heading + Plain Text instances are now a native `h1.h4.u-mb-0.u-d-inline#hero-title` and `p.h4.u-text-muted.u-d-inline`. New MAST-style utility `u-d-inline` (display inline); the combo `.h4.u-mb-0.u-d-inline` carries `margin-right: 0.25em` for the gap between sentences (Webflow strips whitespace between elements). Section `aria-labelledby=hero-title` still resolves
- [ ] **C** One H1. Discovery, Development, Optimisation become H2
- [ ] **C** "Learn more" links go to the three service pages (currently unlinked)
- [ ] **C** Solution names link to their solution pages (currently plain text)
- [ ] **C** Show price and engagement type on each service (already in the CMS)

Additions
- [ ] **B+C** New H1 and an answer-first opening paragraph (who, what, three services, prices)
- [ ] **B+C** "Where to start" section: the approach, framed by the buyer's situation, with the Discovery to Development to Optimisation sequence and a link to the quiz
- [ ] **B+C** At-a-glance table: price, engagement, typical length, what you leave with (Ben to supply typical lengths)
- [ ] **B+C** Proof: one real case study result per service (Optimisation has CloudNC +21%; Discovery and Development need one each)
- [ ] **B+C** FAQ: 5 to 6 cross-service questions as new CMS items with no service set
- [ ] **C** Page-level structured data: services with prices, FAQ, breadcrumb

Rebuilt 19 Oct: new hero (Tag, h1 per Figma, muted line), service names now h2, meta line (investment, engagement, leads to) + case caption per row, Approach (Price Rows linking to each service), quiz Callout, FAQs (topic Working with Shrink). Go-live checks
- [ ] **B** "Learn more" button in each row: link to the current Service page; consider text "Explore" (Designer bind)
- [ ] **B** Solution rows inside each service: show name + arrow, link to current Solution (nested list; MCP couldn't add markup inside it)
- [ ] **B** "Read the case study" link next to the caption (project-image page, Designer bind)
- [ ] **B** Testimonial Card section from Figma: drop the Testimonial Card component in and its Case Studies list (slot needs Designer)

### 2. Service pages (`/services/discovery`, `/development`, `/optimisation`)

Figma (13 Oct): three frames in the Updates section, cloned from the original Service Child design and filled with real content. Discovery `4314:999`, Development `4314:1298`, Optimisation `4314:1603`, notes card `4314:1896`. No local mock yet.

Additions proposed in those frames
- [ ] **B+C** "How it runs" section: numbered phases with one line each, "What we need from you" on the left, tinted "You leave with" row. New CMS content per service
- [ ] **C** Work: three case studies tagged to the service, each with its featured statistic (in the original design, missing on staging)
- [ ] **B+C** Two extra FAQs per service (drafts): ownership and "what do you need from us" style questions
- [x] **B** Typical length per service, shown under Engagement: Discovery 2 to 3 weeks, Development 6 to 10 weeks, Optimisation ongoing (in Figma and in the CMS: new `typical-length` field on Services, staged)
- [ ] **C** Development: "Estimate your build" link to the calculator
- [ ] **B** Decide: keep "Featured resources" (on staging, not in the original design)

Copy conflicts to settle first
- [ ] **B** Development: site copy says design and build happen together and you review the real site; the process deck has wireframes and visual design signed off in Figma before build. Also affects the Approach line on `/services`
- [ ] **B** Discovery: page promises positioning, ICP research, IA and content strategy; the process deck covers scope, inventory, analytics audit, analysis and plan

Fixes
- [ ] **C** Bind SEO title, description and share title to the CMS fields (all filled; pages currently publish as "SS 2027")
- [ ] **B+C** Share image per service (`og-image` is empty on all three)
- [ ] **C** Show each service's 4 FAQs (12 exist in the CMS, none are on a page) with FAQ structured data
- [ ] **C** Solution names link to their solution pages
- [x] **B** Homepage solutions list: nested Solutions multi-ref, plain text, no links (19 Oct)

Rebuilt 19 Oct (template, CMS-driven: How it runs + You Get fields on Services). Go-live checks
- [x] **B** Solutions list filter (done 19 Oct)
- [ ] **B** Work list filter: Services contains Current Service (Designer was bugging out, 19 Oct)
- [ ] **B** FAQ list filter: Service equals Current Service
- [ ] **B** Work card cover link (`a.u-link-cover`) to Current Case Study, on the Services template AND the three /packages pages (MCP can't set current-item links, they render `#`)
- [ ] **B** "Leads to" detail could link to the next service (Detail Link variant, Designer bind)
- [ ] **B** Delete the two "DELETE ME" blank pages in /packages; disable the Placements template page

### 3. Case studies (`/case-studies` and 7 children)
- [x] **C** `/case-studies` parent rebuilt to the Resources pattern (19 Oct, Figma `4363:3374`): filter group `filter_buttons[fs-list-element=filter-buttons][fs-list-field=service]` = Filter Button "All" (`is-list-active`) + Services Collection List (`u-d-contents`, sorted Display Order) of Filter Buttons bound to Name. List sorted by Home List Display Order. Each item is the home work card: `filter_list_item.work_item[data-hover]` > `work_card` (fg/bg images bound Card Foreground/Background, `work_tags` nested Services list of Tag instances + hidden `div.u-d-none[fs-list-field=service]` per service) + `latest-cases_meta-wrap` (h3.h5.work_name + muted Featured Statistic) + "Read case study" cue (`button_underline`, arrow-right) + `a.u-link-cover` with sr-only name. Grid: `filter_list.latest-cases_list` is `repeat(6,1fr)`; a page embed spans items 3/2/3 per 7 for the 2-3-2 rhythm, tablet 2 cols, phones 1
- [x] **C** Grid decoupled from the home classes (19 Oct, Ben: "rogue sticky, treat it as page specific"): list is now `cases_list` (grid, six `1fr` tracks, MAST gap variables, `align-items: start`; tablet `1fr 1fr`, phones `1fr`) and item `cases_item` (relative, flex column, 1rem gap). The shared `filter_list.latest-cases_list` combo is back to its home values (`1fr 1fr`, tablet `1fr`) and the `filter_list_item.work_item` combo is deleted. Page embed targets `.cases_item` only: spans 3/2/3 per 7 with `grid-row: auto`, `position: relative`, `top: auto` (all `!important`, beats per-node `#w-node` placement), tablet `auto`, plus the home hover rules rewritten for `cases_list`/`cases_item` (sibling dim, bg zoom, focus underline). Card inner classes (`work_card`, `latest-cases_*`) unchanged
- [x] **C** Launch pass (20 Oct): page JSON-LD added, same pattern as Resources: CollectionPage (`#webpage`, mainEntity) + ItemList of the seven case studies in page order (name, URL, intro line) + BreadcrumbList. Section `cc-case-studies` got `aria-label="Case studies by service"`; empty `id` attribute removed from its container. Audit of the live page: title/description/OG fine, h1 > h2 subtitle > h3 cards, filter group has role/aria-label and the bundle sets `aria-pressed` on the pills, card images are decorative (`alt=""`) with the name in the h3 and sr-only link text. Zero-result state is unreachable (all three services have case studies) so the Finsweet empty element is moot
- [x] **C** Forest quiz card art (20 Oct): Figma section "Forest: Common Sense Club quiz, case study images (20 Oct)" on ✏️ Playground, right of Adfin's. Captured the 2026 quiz from the local preview (`~/forest/webflow-components`, Playwright at 390x844 @2x and 1440x900) into phone frames: 01 Hero (sticker backdrop + intro / Q1 / banned phones), 02 Three questions, 03 Right and wrong, 04 Start to finish, 05 On desktop. Export the hero at 2x for Card Foreground (the current card uses the old sticker poster)
- [ ] **B** Designer: nested `work_tags` list source = the case study's **Services** multi-reference; cover link = **Current Case Study** (API cannot do either). Live check 20 Oct: all seven cover links still publish `href="#"`
- [x] **C** Card images set via API (20 Oct): Forest quiz Card Background = sticker backdrop (`6ad74383a5ab087a7c58d428`), Card Foreground = three phones on transparent (`6ad743838e4b52f5c4d45894`, rendered with Playwright from the captures, same geometry as the Figma hero); Buff Motion Card Foreground = top of the home capture with the squiggle Lottie behind the headline (`6ad74383a5411c62f58b0673`, Figma frame "Card foreground / Home top" in the Buff section, exported at 2x). All three are 2000px webp. Needs a publish
- [x] **C** Own order for the page (20 Oct): new Number field **Case Studies Page Order** (`case-studies-page-order`, help text says the home list uses List Display Order). Set Adfin 1, Forest 2, CloudNC 3, Buff 4, quiz 5, Steamhaus 6, nxzen 7; the page list now sorts by it ascending. Ben moved the filter list into a component and the `aria-label="Case studies by service"` onto the Section instance's Attribute props. Verify both after publish
- [x] **C** Verified live 20 Oct: CollectionPage/ItemList/Breadcrumb JSON-LD published, section aria-label in, all seven cover links resolve to `/case-studies/<slug>` (Ben set Current Case Study), tags show each study's real Services, new Forest quiz + Buff card images render. Filter pills set `aria-pressed`, Optimisation leaves 4 items and the 2-3-2 rhythm recomputes (items leave the DOM). Desktop 683/450/683 px cards, tablet two columns, phone one column, hover dims siblings and underlines the cue, no console errors

Index design is fine as is (Ben, 13 Oct). Child: Figma "Case study child: CloudNC (proposed, 13 Oct)" `4325:999` with notes card `4325:1267`, built on the original Cases Child design with CloudNC's CMS copy word for word.

- [ ] **B** Review: "At a glance" facts sidebar (replaces the contents list), "In short" panel, three headline results, six narrative sections, client quote, More projects
- [x] **C** CMS fields added (empty, staged 13 Oct): `result-1-value` to `result-3-label`, and `team` (multi-reference to Teams)
- [ ] **B** Fill the results and team per case study (suggested results are in the chat of 13 Oct; Buff Motion, Steamhaus and nxzen have no figures in their copy)
- [ ] **B+C** Live site link field still to add
- [ ] **C** Fix on staging: page title "SS 2027" and no description, "Relationship" bound to the client summary, client and industry block shown twice, "ToC Heading" placeholder
- [ ] **B** Gallery fields are empty on all 7 case studies; in-body image slots dropped until there are images
- [ ] **B** Only CloudNC has a client quote; the quote block hides without one
- [ ] **B** CloudNC copy has two missing spaces after full stops ("dev support.The existing", "behind it.That's"). Needs the client's OK to fix

### 4. Solution pages (15)

Copy is Ben's and final (written to be citable); design only. Figma (13 Oct): "Solutions child: AEO (simple, centred)" `4317:1008` in the Updates section, below the service child frames.

- [ ] **B** Review the simple centred layout (648 column: service tag, name, summary, "Part of" line, six copy sections with the definition in a tinted panel, case study link card, related reading, sibling solutions, CTA)
- [ ] **B** Decide: Work row and FAQs from the original design are dropped (no solution-level FAQs exist in the CMS)
- [ ] **C** No index page: redirect `/solutions` to `/services`, which lists all 15 grouped by service
- [ ] **C** Share image per solution (`og-image` empty)

### 5. About

Ben's design is in "Sitemap Final" (`4326:2693`). Copy with three additions: Figma "About (with facts, team detail and proof, 13 Oct)" `4332:999`, notes card `4332:1275`, in the Updates section.

- [ ] **B** Review the three additions: studio facts list, a line and LinkedIn link per person, the testimonial card
- [ ] **Dev** Team lines (one per person, two or three sentences for Ben), LinkedIn links, hover image position: left for the build
- [x] **B** Numbers settled: 50+ sites (facts list updated in Figma)
- [x] **B** Ben's title settled: Founder (updated on the About copy and the CTA card in all new frames; CMS already says Founder)
- [x] **B** Team settled: Joshua Fry, UX Designer (matches the CMS)
- [ ] **C** Replace the "Studio updates" placeholder cards with real articles; hero button to "Start a conversation"
- [ ] **C** Person structured data per team member at build
- [x] **C** About vs Figma (16 Oct): values label "What we stand by", team label "Who are we?", studio facts list built (`dl.detail-list` + 6 Detail rows, staged at the bottom of main; Ben drags it under "Where we come from"). Photos stay a marquee (Ben, 16 Oct): Figma's 3-photo row is out of date. Team lines + LinkedIn still to come (Ben)
- [x] **C** About "Featured resources" uses the Resources article card (16 Oct). Ben binds Read article to Current Item in the Designer
- [x] **C** Testimonial Card (16 Oct): component built (Shrink), Case Studies list filtered by "Show In Testimonial Card", sorted by "Testimonial Card Order". Tabs CloudNC, Buff Motion, Steamhaus; bundle `testimonial-tabs.ts` (538f90b). Verified on staging: tabs, keys, highlight, results column drops out when empty
- [x] **C** Testimonial Card rebuilt 1:1 with Figma `4356:154` from new primitives (16 Oct): Segmented Control + Segment (bundle `segmented.ts`, 02ab64e), Stat. Dot-pattern photo fallback. Style guide demos added
- [ ] **B** Token call: Webflow `--primary--border` is #f4f4f5, Figma border-primary is 10% #1a1c21 (card hairlines use the Figma value directly for now); card radius token 12px vs Figma 8px
- [ ] **B** Testimonial quote: decide on the default blockquote left border
- [ ] **B** Testimonial photos (Clients > Testimonial Photo, 3:4) for all three; white panel shows until then
- [ ] **B** Adfin and Forest quotes, so they can join the tabs

### 6. Resources and articles

- [x] **C** Article template rebuilt (16 Oct): centred column, In short card with Ask AI component, featured-card related solution, link-list related reading, `cc-compact` headings (h4 size), Article + BreadcrumbList JSON-LD, `<article>` landmark. Figma frame `4363:4485` synced
- [ ] **B** Related reading: decided automatic (16 Oct). Ben adds filters in the Designer: Category = current item's Category, exclude current item (sort newest, limit 2 already set). Hide the section or show 'All resources' when a category has no other live article
- [ ] **B** Template page title doubles up ("… | Shrink Studio | News & Insights, Shrink Studio"): set Page settings Title to the Meta Title field only
- [ ] **B+C** OG/Twitter image is empty on every article (no og-image values): blocked on the share image design
- [ ] **B** Article card design without images: proposal in Figma Cards section (`4497:280`, grey card, category mesh on hover)
- [ ] **C** Tracking sweep with PostHog before launch: install, then confirm the `data-track` hooks (ask-ai, solution-click, related-reading-click, article-read + page context) arrive; bundle module `track.ts`
- [ ] **B** Launch settings: global canonical `https://www.shrink.studio`, sitemap on, robots allow (staging webflow.io blocks all, expected)

Figma (13 Oct): "Article child: same simple template" `4320:999`, beside the solution frame. Same centred column as solutions: category tag, title, summary, byline and dates, "In short" panel (the `ai-summary` field), body, related solution card, related reading, CTA. No hero image, no table of contents.

- [x] **B** Subheadings: 63 approved H2s added to all 15 articles and the audit article retitled "How to audit a website properly" (CMS, staged 13 Oct). Drafts and Orbit post ideas are in `ARTICLE-SUBHEADINGS.md`; original bodies backed up in `~/shrink-prototypes/ss2027-gap/article-bodies-before-subheadings`
- [ ] **B** Six new posts suggested by Orbit (see `ARTICLE-SUBHEADINGS.md`, Part 2)
- [ ] **B+C** 7 of 15 articles still use the placeholder image; the template no longer needs one on the page
- [ ] **C** Templated share images for articles and solutions (title on a brand background), batch-generated
- [ ] **C** Article structured data with author, published and updated dates
- [ ] **B** Decision made: one collection, Type field (Guide or Insight), two lists on Resources, articles under `/resources/`
- [ ] **C** "Read article" links wired (all 14 go nowhere)
- [ ] **B** 9 of 15 articles are draft: publish or cut

### 7. Homepage (signed off by Ben, 19 Oct 18:35)
- [x] **C** Needs cards componentised (19 Oct): **Needs Card** `bddd850d-84c6-f25f-c44f-1cc7f122badb` (Shrink; variants Light / Dark `699f60a6-…` / Paper `a759c2ae-…`; props Number, Title (h3), Text, Link Text, Link, Visibility; Visual slot named "Slot"; stage `[data-stage=318]`; Underline Link inside, Class `needs-card_link`) + **Needs Art / Brief, / Branches, / Answer, / Experiments** (dots and cursor live inside each art). Number sits muted beside the title (`needs-card_head`, gap = Detail list gap var). Phones: title + number step to h6 size, body to paragraph-sm (`needs-card_desc` combo)
- [x] **C** Needs section outline: gap statement is now `p.h4`, "What the next site needs to get right" is a Heading component (h2, Size H4, Class `needs_head u-mb-0`, ID `next-site`), Section aria-labelledby = next-site; old `.needs_head` wrapper removed
- [x] **C** iPhone Safari blank illustrations: the CSS-only `scale(tan(atan2(100cqw, …)))` blows up in iOS Safari. Bundle `stage-scale.ts` sets `--stage-scale` on `[data-stage]` (ResizeObserver); Needs Cards + package tile embeds read `scale(var(--stage-scale, tan(atan2(…))))`. Package Tile stage has `data-stage=425`. **Needs bundle push + footer SHA**
- [x] **C** Marquee no longer pauses after a tap on touch (Home Marquee Hover embed: `@media (hover: none)` keeps it running; keyboard pause now on `:focus-visible` only)
- [x] **C** Figma synced (19 Oct): four editable **Needs Art** components (Illustrations section, `4670:1041` Brief, `4670:1062` Branches, `4670:1087` Answer, `4670:1104` Experiments) rebuilt from the live layout, used in the Next site needs cards (`4363:2122`). Brief title 16px (also in Webflow `needs-art_title`)
- [x] **C** New Adfin symbol (Ben, 19 Oct; Figma `4669:30155`): Webflow asset `6ad61bdc1dc7ce0571bfb264` in Needs Art / Brief + Package Art / Clarity Sprint; Figma Brief art + Clarity Sprint visual
- [x] **C** Clients CMS Adfin **Hero Icon** swapped to the new symbol (staged, 19 Oct). Marquee Logo (Adfin wordmark) left as is
- [ ] **B** Figma Logo cluster (`4105:411`) still has the old Adfin mark (API refused the edit)
- [x] **C** Phones (≤767): needs cards are a swipe row (19 Oct). `.needs_list` small = flex, overflow-x auto, scroll-snap x mandatory, gutter padding; `.needs-card` small = flex 0 0 80%, snap start; edge bleed, snap padding and hidden scrollbar in the Needs Cards embed. Dots = testimonial dot classes (`testimonials_dots.cc-needs`, hidden above small) with `[data-scroll-dots="needs"]` after `[data-scroll-list="needs"]`; bundle `scroll-dots.ts` (82df986) builds the buttons and sets aria-current; active pill in the embed. Footer SHA set to 82df986
- [ ] **B** Figma: phone frame for the swipe row + dots, if wanted
- [x] **C** Dot classes renamed to `progress-dots` / `progress-dot` / `progress-dot_bar` / `progress-dot_fill` (testimonial slider + needs row); Needs Cards embed updated
- [x] **C** Premium Partner badge blank on iOS: the SVG had a Figma shadow filter. Filter-free `wf-premium-partner-white-flat.svg` (`6ad627696fe501d77a0a6b73`) in Hero Marquee Cards + CTA Card. Confirmed on Ben's phone
- [x] **C** Featured work (Ben moved it into a Section component): Section aria-labelledby = featured-work; "Featured work" muted line + h2 "What changed after launch"; card titles h3; hidden autoplay video removed; name hover underline removed; service pills = Tag component bound to Services Name; empty state hidden; "All case studies" link fixed (was /services). Old raw section hidden (`15b1bc0e…`): **B** delete it
- [x] **C** Card images to WebP (CMS Case Studies, staged): Adfin card background 1.2 MB → 20 KB, CloudNC background 575 KB → 6 KB, CloudNC foreground SVG 2 MB → 95 KB
- [x] **C** Home Services rebuilt to Figma `4363:3038` (19 Oct): raw `ol.numbered-list[data-list][data-fade-list][aria-labelledby=services]` of three **Price Row** instances, variant **Home** (`2948057f-…`: grid 7rem | name + intro | deliverables | price + terms; phones stack under the number). Price Row gained Show Deliverables + Deliverables (multiline, `price-row_deliverables`, pre-line) and Cover Link (`a.u-link-cover` + sr-only Link Text): one link per row, solutions links and row images gone. Section heading h2, row names h3. Copy is static (from the Services CMS). Old CMS rows hidden (`949089ac…`): **B** delete
- [x] **C** Home Services v2 (Ben moved it into a slotted component): rows are the Collection Item itself, no component. Services list (`4de670b7…`, `data-list` `data-fade-list` aria-labelledby=services) > item `numbered-list_item.u-position-relative[data-list-item]` > `services-list_content` (grid 7rem | 1fr | 1fr | 10rem, phones stack) = marker + h3.h5 name + p intro (Home Card Intro) + nested Solutions list (`price-row_deliverables`, plain text, no links) + `services-list_price` (Investment Level h5 + Engagement) + `a.u-link-cover` to the current service (sr-only name). Static Price Row list removed. Price Row keeps the (now unused) Home variant, Deliverables and Cover Link options
- [ ] **B** Designer check: nested list source = the Service's **Solutions** multi-reference (API can't confirm it), Services list sorted by Display Order, old hidden CMS rows deleted
- [ ] **B** Figma: services rows show solutions (5 per service) instead of the 4 deliverables
- [ ] **B** CTA Card component default Button Link is `/book-a-call` (404): set to `/calls/intro`
- [x] **C** Tag component: **Show Link** boolean (default off) now drives the hidden `a.u-link-cover.cc-tag-link`; home had 10 phantom `#` links (19 Oct). **B** switch it on for any Tag instance that really links (article category tags?)
- [x] **C** Home services hover cue (19 Oct): `div.button_underline` "Explore {name}" + arrow under the intro, `data-hover` on the item plays it on row hover (aria-hidden; the cover link carries the name)
- [x] **C** Home Testimonial Card tidy (19 Oct): quote + stat value on the h4 vars, stat label on paragraph-sm vars, card padding on the card padding var; fixed rem/breakpoint overrides removed
- [x] **C** Home Studio updates (19 Oct): News & Insights list sorted Date newest first, limit 3, empty state hidden; tag screen-reader text bound to the category name; Section aria-labelledby = `featured-insights` (Heading ID set)
- [x] **C** Services heading was a copy carrying `id="featured-work"` (duplicate id, list label pointed at nothing): now `id="services"`, Section aria-labelledby = services. "All services" link went to /case-studies: now `/services`
- [ ] **B** Studio updates "Read article" link: bind to Current Item in the Designer
- [x] **C** Phone pass (19 Oct, Ben's iPhone screenshots): mega nav fixed menu/panel layers were hard-coded to the bar height (68px) but the Nav Banner pushes the sticky bar to 111px at the top of the page, so the logo sat over "Case Studies" and the Services panel hid Back and the X. Bundle `mega-nav.ts` now measures the bar on open (`bf3f885`, footer tag updated). Nav email = Button (Secondary) with `data-copy-clip` + mailto fallback, old plain button removed. Services rows: content row-gap 1.25rem on phones, number marker `u-mb-0`. Testimonial Card: header stacks with the Segmented Control full width (`segmented_list` grid 1fr columns on small); stats one column on small + tiny (Ben's 3-col grid stays on tablet), stat value on the h5 vars, stat padding 1rem. Footer: Spacer (Small) under the logo, bottom cols `col-sm-12` (combo `col.col-shrink.col-sm-12` created)
- [ ] **B** Copy clip embed: add `[data-copy-clip][data-copied] .ph-copy::before { content: "\e182"; }` so the nav email button flips to a tick for 2s (the Button component has one icon, so the idle/done pair can't be used)
- [ ] **B BLOCKER** Every policy URL 404s on the live site (`/policies/privacy-policy`, `/policies/terms-of-use`, `/policies/cookies-policy`, also `/legals/...`). The collection is `policies` via the API but the template page still publishes at `/legals`: open Policies collection settings in the Designer, re-save the slug `policies`, publish, then re-check (API renames don't update the template path)
- [x] **C** Policies index (19 Oct): new static page **Policies** at `/legal` (`6ad641159d56e9320ef27e99`, duplicated from FAQ: Tag "Legal", h1 "Policies", muted line). FAQ search + accordion section removed; raw `section.u-pt-0 > container > row > col.col-lg-8` with a Policies Collection List (sorted Display Order, empty state hidden) as `numbered-list[data-fade-list]` rows: h3.h5 name + muted summary + `a.u-link-cover` to the policy (sr-only name). `/policies` can't be a static page because the collection owns it
- [x] **C** Dead links fixed (19 Oct): footer + mega nav FAQs `/faqs` → `/faq`; footer "All policies" → `/legal`; Footer and CTA Card default button link `/book-a-call` → `/calls/intro` (home still overrides to /contact)
- [x] **C** Nav copy-email tick CSS lives in Custom Code component → embed "Copy Clip"
- [ ] **B** Home services rows: the cover link must be set to **Current Service** in the Designer (API-set current-item links publish as `detail_services` or `#`; Ben did the same on /legal). Memory updated
- [x] **C** /legal rows: arrow added (`span.link-list_icon[data-underline-icon]` + Icon `ph ph-arrow-right`), row is the `data-hover` target, text block is `numbered-list_content`
- [x] **C** Copy Clip embed updated with the tick rule (Custom Code > Copy Clip); unnamed package tile embed renamed "Package Tiles"
- [x] **C** Home review (19 Oct, live HTML): lang en, one h1, every section h2 with aria-labelledby resolving, no duplicate ids, every image has alt, every button and link has a name, no `target=_blank` without noopener. Webflow's audit flags (hero_cluster_img, Card Cover Link, u-link-cover) are CMS-bound alt/sr-only text the Designer can't read: false positives
- [x] **C** Footer root is now `<footer>` (contentinfo landmark); nav is `<nav aria-label=Main>`, main is `<main>`
- [x] **C** Mega nav: package cards carry a `span.featured-card_mesh[data-mesh-gradient]` layer (per-package five-colour sets, grain 0.22, CSS gradient stays as fallback); `.package-card` gained position relative + z-index 0 + overflow hidden. "All services" is an Underline Link instance (arrow-right, hover underline)
- [x] **C** Schema (19 Oct): Organization in site head had two placeholders (`image: [path-to-default-og].png`, `email: [hey@shrink.studio]`): fixed, image = wordmark, street address added. Home page has a WebSite node pointing at #organization. Service/article pages carry their own
- [x] **C** Default OG image (19 Oct): designed in Figma (Socials page, "OG Image - Default (1200x630)" `4681:2`), exported 2x and downsampled, uploaded as asset `6ad6538e671d2f40abb32f7f` (`.../6ad6538e671d2f40abb32f7f_shrink-studio-og.png`), set on all 29 pages via bulk update (templates included, so articles/case studies share it until per-item OG images exist), Organization schema `image` points at it. The Figma cluster was detached locally to use the Forest tree icon (the shared Logo cluster still carries the wordmark)
- [ ] **B** CTA Card renders question and answer as two h2s; make the answer a p or one h2
- [x] **C** Home outline: one h1, every section an h2, items h3 (checked live 19 Oct)
- [ ] **B+C** FAQ section with structured data
- [ ] **B** Ben's avatar (then refresh the Discovery visual and needs card 01)

### 8. Quiz (`/tools/ready-to-brief-a-build`)
- [x] Quiz stays as it is: it is a code component in the repo, no restyle (Ben, 13 Oct)
- [x] **C** Submits to `api/forms` (15 Oct, `c8e94f8`): Contact always, Deal at Lead when ready, Mailing opt-in; share link rehydrates on this page. **B**: accept the library update and clear the instance's old Lead submit endpoint + Share link props
- [ ] **B+C** Copy: em dashes and one negation ending. The recommendation names ("Seed Website", "Clarity Sprint") are the package names and can link to the new package pages

---

### 9. Pricing (`/pricing`, built 18 Oct)
- [ ] **B** FAQ list shows all 25 FAQs: set filter Show On Pricing = on and sort Pricing Order ascending. API writes on this page fail with "[Conflict] component map", and a Designer save didn't reach the server (18 Oct). Six FAQs are flagged in CMS
- [ ] **B** Stray empty "Lorem ipsum?" Accordion was in the published FAQ item; check it is gone after the next publish
- [ ] **B+C** "How much does it cost" FAQ answer links to /pricing (self-link on this page)

## Design references banked (designsystems.surf, shared by Ben 12 Oct)

For service and solution pages. Same low-key look as the Services page: white, hairlines, small type, one tinted panel at most.

- **Checklist table:** two columns, a tick and bold item on the left, one-line explanation on the right, hairlines between, and a tinted final row for the outcome ("Ready enough"). Use for "What's included" and "You leave with" on service and solution pages.
- **Wrong way / right way:** heading and lede, then two stacked blocks, a cross ("Coverage without clarity") and a tick ("Clarity before expansion"). Use for the problem section on service pages.
- **Flow diagram on a grey panel:** input pills, lines into one node, three black pills, one output card. Use for the Discovery to Development to Optimisation sequence, or how a solution works.
- **Definition pairs beside a worked example:** two short titled paragraphs on the left ("What AI must know", "Where AI will guess"), chips and prompt bubbles on the right. Strong fit for the AEO solution page.
- **2x2 quiet cards:** small visual at the top (icon, date chip, price), title and muted line at the bottom. Use for solution features.
- **Price block:** big figure with a small pill beside it, then three small icon cards underneath.
- **CTA with a muted note beside the button** ("From $19 per month"). Use as "Start a conversation" plus "From £3,500".
- **Headline with a dark first sentence and a muted continuation.** Already used in the Services hero.
- **Row of round client icons** as a marquee, and a single centred quote on a soft gradient card.

## Components page (prepare for dev)

Figma (13 Oct): new page "🧩 Components (ss-2027)" `4355:1007` in Shrink Studio: Master. 61 components in eight headed sections (Primitives, Navigation and footer, Heroes, Page sections, Content blocks, Proof and conversion, Cards, Illustrations), each with a title and a one-line description. Ben is tweaking here before dev.

- Now 83 components in ten sections: the original eight plus "Home sections" and "Page-specific sections"
- Page "📄 Pages (ss-2027, from components)" `4357:2` holds all 21 page frames in site order (00 Home to 20 404), built entirely from instances of these components, with content taken from Ben's copies in "Sitemap Final". Changing a component updates every page that uses it
- The frames in "Updates" and "Sitemap Final" are still detached copies
- Desktop only, one state each
- Not on the Pages page: the quiz (a code component, left as it is), and the other 14 solutions, 6 case studies, 14 articles and 6 legal pages, which reuse the templates shown
- Legal and 404 are new, built from existing components; the legal body has two placeholder sections
- Footer keeps the client names (Case Studies column); "Ask about Shrink on" moved under the footer CTA

### Webflow build (components first, one at a time, on /styles/components > Primitives section)

- [x] Tag (14 Oct): component "Tag" (group Primitives). Variants Default / Selected / Link; props Text, Visibility, Link, Screen Reader Text, Target. Class `tag` bound to new Components > Tag/* variables; fill = new Theme var Primary/Surface, Link hover = Primary/Surface Hover. Link variant shows `u-link-cover.cc-tag-link`. Rule: never use a Link tag inside a linked Card
- [x] Button animation (14 Oct): existing Button + hover layer `button_hover` (`data-button-hover` = Hover Style prop: reveal / fade / none), root `data-button`, `[data-hover]` on any parent triggers it. Primary reveals white + black outline, Secondary reveals black. Focus ring on `u-link-cover.cc-button-link`. CSS = "Button Hover" embed in Custom Code > Buttons (attribute selectors only). Osmo button-029 removed
- [ ] Optional: set Conditional Visibility on the two `btn-icon` wrappers inside `button_hover` ("Left/Right Icon Class is set"), then drop the empty-icon line from the Button Hover embed
- [x] Forms (14 Oct): MAST classes restyled to Figma (`form`, `input-group`, `input-label`, `input`, `input.cc-textarea`, `form-success`, `form-error`) + new `form_row`, `input-wrap`, `input-icon`, `input-message`, `checkbox`(+`_box`, `_text`), `chip-group`, `chip`, `input.cc-search`, `form_footer`, `form_native-submit`. New vars: Color Feedback/Error #d92d20, Feedback/Success #15803d, Neutral/Placeholder; Theme Input/Background, Border, Border Hover, Placeholder; Components Form/*, Input/* paddings + textarea height, Checkbox/*, Chip/*. "Forms" embed in Custom Code > Buttons. Validation = bundle module `src/modules/form-validate.ts` (attributes: data-form-validate, data-validate, data-validate-group + data-min/max, data-validate-message, data-validate-icon, data-submit; writes data-state, aria-invalid). Demo lead form + search field in Primitives. Osmo form + checkbox examples and classes removed
- [x] Forms: bundle pushed (7fdf275, jsDelivr @master purged). Native select added: `input.cc-select` (appearance none) + `input-select-icon` chevron, grey while the empty option is chosen (Forms embed). Demo Budget select (optional)
- [x] Forms a11y (14 Oct, bundle 7fd802e): [data-submit] links get role=button + Space; focus moves to Webflow done/fail message (fail role=alert); "(optional)" on Company website and Budget; field border now Neutral/Border #868c94 (3:1+ on white, light grey and dark), hover Mid Gray 2. MAST select ::after arrow removed from the form-reset embed
- [ ] Forms: chips need a publish for the label `for` fix
- [ ] Forms: confirm the Budget select options imported (API can't read them): Choose a range / Under £15k / £15k to £30k / £30k to £60k / £60k+ / Not sure yet
- [ ] Forms: placeholders on the demo fields (API can't set them): Your name / you@company.com / company.com / A few lines is enough. Include timing if you know it. / Search questions
- [x] Underline Link component (14 Oct): props Text, Link, Show Arrow, Icon Class (ph-arrow-right / ph-arrow-up-right), Underline Style (hover / alt), Class. Same attributes as before; the ~45 hand-built links get swapped when pages are rebuilt. Logo cluster CSS moved to its own "Hero Logo Cluster" embed
- [ ] Underline Link: check after publish that the Class prop adds to button_underline rather than replacing it
- [x] Detail component (14 Oct): one row (div.detail-list_row > dt + dd) inside a plain dl.detail-list; props Label, Value, Link, Visibility; variants Text / Link (link gets the underline hover). Vars Detail List/*. Hairline = Primary/Border
- [x] Detail: Copy variant (14 Oct, bundle 3f9be67): value is a button[data-copy-clip] + ph-copy icon (u-text-muted) that swaps to ph-check on copy; bundle module copy-clip.ts (clipboard + fallback, aria-label, polite announcement); "Copy Clip" embed. Demo Email row uses it. Tooltip "Click to copy" → "Copied" (class `copy-tip`, states in the Copy Clip embed, no extra JS)
- [x] List Item component (14 Oct): one row (li) inside a plain ol.numbered-list[data-list][role=list]; props Title, Show Description, Description, Icon Class, Visibility; variants Number (auto 01, 02 via CSS counter in the "Lists" embed) / Icon (any Phosphor class). Vars List/*. Demos: Figma "You leave with" + an icon list
- [x] Filter chips (14 Oct): existing Finsweet `.filter_btn` restyled to the Tag look in the style panel (Tag vars, Surface/Surface Hover); selected state in the "Filter Button CSS" embed via [aria-pressed=true]/.is-list-active; row gap Grid/Gap SM. Not a component (CMS lists + Finsweet attrs + empty fs-list-value on All)
- [x] FAQ rows (14 Oct): MAST Accordion reworked: Rows variant tuned to Figma (Accordion/Row Padding, Answer Width, Icon Size vars; muted icon + answer); new props Show Tag + Tag (Tag component in the summary). Demo in Primitives (answers still lorem: API can't reach slot content)
- [ ] FAQ rows: paste the two demo answers; decide +/× vs +/− icon; check question heading size vs Figma 18px

## Navigation and footer

Figma (13 Oct): board "Navigation and footer" `4353:999` in the Updates section. Built for the shared mega menu module (`mega-nav.js`, the one on Steamhaus and nxzen: one dropdown container that morphs between panels, a backdrop, and a slide-in panel with Back on phones).

- [ ] **B** Review the five frames: Services open, Resources open, phone menu, phone Services panel, footer
- [ ] Top level: Services (dropdown), Case Studies, Pricing, About, Resources (dropdown), Start a conversation
- [ ] Services panel: three columns, each with the service, its starting price, five solutions and its package; a strip with "All services" and the quiz
- [ ] Resources panel: Articles, FAQs, Readiness quiz, Project calculator
- [ ] Footer: Services and Packages, Company, Resources; legal links in the bottom bar
- [ ] **Dev** Port `mega-nav.js` into the `shrink` bundle and add the attributes

Direction chosen (14 Oct): **A, floating bar** (Figma Components page, "Explorations (14 Oct)" row `4405:216` in the Navigation and footer section; B kept there for reference). Two white pills (logo, Services, Case Studies, Resources | Pricing, About, Start a conversation), blurred backdrop, one panel that morphs height AND width (Services about 1190px, Resources about 730px), grey hover pill in the bar and inside each panel list, featured card on the right of each panel (quiz on Services, latest article on Resources). Phone: full-screen menu with pinned email (copy) and button; Services slides in with Back.

- [x] **B** Packages in the Services panel as gradient cards (glyph, price pill, one-liner from the copy doc). Keep
- [x] **C** Update the five nav components in Figma to A (14 Oct; section tidied, explorations kept below)
- [x] **Dev** `src/modules/mega-nav.ts` (port, morphs width and height, aria-controls, data-panel-state) and `src/modules/mesh-gradient.ts` written, built, not pushed. Local prototype: launch config `ss2027-nav-proto` (port 8803)
- [x] **C** Webflow build: "Mega Nav" component (Global), swapped onto Home, Services, About, Case Studies, Resources, quiz page and the Solutions, Services, News & Insights and Case Studies templates (14 Oct). Order: Case Studies, Services, Resources | Pricing, About, Start a conversation. Light grey pills (Primary/Surface), white hover pill in the bar, faint grey (Nav/Hover Fill) in panels. Embed "Mega Nav" in Custom Code > Buttons. Designer Preview prop opens a panel on the canvas
- [x] **B** Site radii rounded (14 Oct): Button and Input 0.5rem, Card 0.75rem, Tag 0.375rem; nav pills use Card Large
- [x] **C** "Simple Nav" (Global, 14 Oct): plain `header.simple-nav` > `simple-nav_bar` > `simple-nav_logo` (logo pill, Primary/Surface) + `simple-nav_end` > Button (Secondary) "Back to site" to `/`. No Navbar widget. Old MAST Navbar renamed "Nav (MAST, unused)" and stripped; only the demo pages use it. Figma "Navigation, lead pages" `4356:47` matches
- [x] **C** Footer redesign (14 Oct): F1 deep mesh chosen. One static Footer (Footer Static merged in): `section.cc-footer` transparent with fluid Hero Padding top, `featured-card_mesh.cc-footer` shader layer (`data-mesh-gradient` deep brand, CSS gradient fallback, `mask-image` fade into the section above), then CTA Card, Spacer, and a `card u-bg-white` footer card on MAST row/col (logo + Ask AI left, four link columns, legal + time row). Footer props: Show CTA, CTA Question, CTA Answer, CTA Button Text, CTA Button Link. Services and Solutions templates bind Question/Answer to their `cta-heading`/`cta-subheading` fields. Old `cc-large-cta` sections removed from pages
- [x] **C** CTA Card component (Shrink group, 14 Oct): `card u-bg-white` > row/col, `cta-card_info`, `cta-card_actions`, `wf-premium_badge`, grey panel `card u-bg-lightgray` with Ben (photo asset `ben-hammond-studio.jpg`) and Book a Call. Props: Question, Answer, Name, Role, Photo, Button Text, Button Link, Partner Badge, Visibility. Figma: `CTA Card` component in Proof and conversion, Footer component updated, page frames moved over
- [ ] **B** Paste into Nav/Margin for wide screens: `max(var(--_components---container--gutter), (100% - var(--_components---container--max-width)) / 2)` (currently aliased to Container/Gutter)
- [ ] **B** Footer script: update the pinned SHA to `de8d395` (mesh pauses off screen)
- [~] **C** Hero padding variable (14 Oct): Components > Section/Hero Padding Min (rem) 7, Max (rem) 12, Section/Hero Padding (12rem until Ben pastes the clamp; MCP rejects custom values). Hero Section Style props on Home, Services, About, Case Studies, Resources, quiz, Solutions, Services and Case Studies templates now read `padding-top: var(--_components---section--hero-padding)`
- [ ] **B** Build Mode Blank, Design Mode, Basic Layouts, Inspired Layouts still use "Nav (MAST, unused)": delete those pages and that component before launch
- [ ] **C** Resources featured card: bind to the latest article (CMS list, limit 1)
- [ ] **B** Footer script pinned to a commit (latest `077e724`); update the SHA after each bundle push
- [ ] **Dev** Featured card mesh: Paper Shaders mesh gradient (`@paper-design/shaders`, about 7 KB gzipped, grain built in) on `[data-mesh-gradient]`, mounted on first open; CSS gradient fallback for reduced motion and no WebGL. shaders.com was 726 KB gzipped, ruled out

Mesh palettes banked (test page `~/shrink-prototypes/ss2027-gap/nav-mesh/index.html`), start with deep brand:
- Deep brand (white text): `#1a1c21, #144c5e, #4469fc, #1a1c21, #b6cee2`, grain 0.25
- Light silver (dark text): `#dde3e2, #b6cee2, #f4f4f5, #a9bfbd, #c6d0cf`, grain 0.2
- Warm stone (dark text): `#d8d5cb, #f4f4f5, #b6cee2, #d8d5cb, #a9bfbd`, grain 0.2
- CSS only (static): radial `#4469fc` 15% 10%, `#144c5e` 90% 35%, `#b6cee2` 40% 100% on `#1a1c21`, SVG grain overlay 0.35

## Pages to build

Figma (13 Oct), all in the Updates section on the row beside the About copy, with one notes card `4340:1385`:

- [~] Contact (static, 14 Oct): page `6acfc652c2d1acb76ac24f90` at /contact. Simple Nav, hero copied from the quiz (Section `cc-hero` + card-padding bottom, Tag bound to page name, Spacer, h1 + muted h2 at h4 size), MAST row with details (`detail-list`) + Testimonial Slider left and the **Enquiry Form** component right, Recent work links, Footer (no CTA). Figma frame updated (slider replaces the hairline quote). To do: paste the testimonials Collection List into the slider's Items slot; wire form routing
- [x] **C** Contact v2 (14 Oct): Company detail removed; Book a call detail opens cal.com/shrinkstudio/30min in a new tab; Recent work row removed (Ben); studio row built from Section > Grid Row > Grid Column with Heading, Plain Text, Border, Underline Link (Maps, new tab) and two Image (16x9) instances of the Work.Life Soho photos (assets `6acfd9a63aa95d18812e2a0a`, `6acfd9a7605220829bdb863c`). Figma: Studio row component in Proof and conversion, Contact frame updated
- [x] **C** Forms backend decided (14 Oct): our own handler, no Make. `api/forms.ts` in this repo (Vercel function, zero deps). Webflow site webhook `form_submission` posts here; routed by form name. **Enquiry**: upsert Company (by website domain, Source Inbound) + Contact (Next action Needs follow-up) + Deal (Stage Lead, Service from the Need chip, budget, message, opt-in and submission id in Notes; retries skipped). **Resource**: upsert Contact (Nurture) + note of the guide. Verifies `x-webflow-signature` when `WEBFLOW_WEBHOOK_SECRET` is set; rejects other sites. Smoke-tested against a stubbed Airtable
- [x] **B+C** Forms live (15 Oct): Vercel `shrink-site-api` (git-connected, deploys on push) at `https://shrink-site-api.vercel.app/api/forms`, AIRTABLE_TOKEN set; Webflow webhooks for Enquiry and Resource. Test Enquiry landed as Deal + Contact + Company
- [x] **C** Calls + Guides SEO (15 Oct): AI Summary, OG Title, OG Description, OG Image added; JSON-LD written to both templates via API, bound to CMS (Guides: WebPage + DigitalDocument; Calls: WebPage + Service with free Offer and ReserveAction to Cal Link). All 14 collections now grouped (Meta Data first; 'Meta Details' renamed)
- [x] **C** SEO + LLM copy (15 Oct): OG Description added to Case Studies, Services, Solutions; OG + AI Summary added to Teams, Policies. Every empty Meta Title/Description, OG Title/Description and AI Summary filled across Solutions, Services, News & Insights, Case Studies, Teams, Policies, Calls, Guides (existing copy untouched). Staged, not published
- [ ] **B** Decide on a rewrite pass for existing copy that breaks house rules (negation-ending og-titles, ', Shrink Studio' meta titles over 60 chars, em dashes in CloudNC body, Performance Reporting placeholder headings)
- [ ] **B** Swap the test PDF (nxzen brief) on the post-raise checklist for the real file
- [ ] **B** Bind page SEO/OG in Page settings on Calls + Guides templates (API-set OG tokens don't render; JSON-LD ones do)
- [x] **C** Mailing list (15 Oct): Shrink OS table **Mailing list** `tblCy7RBJ1r86aWvo` (Email, Name, Status, Source Enquiry/Guide, Guides taken, Contact link, Opted in + Consent page as the consent record, Synced to provider). Anyone ticking the resources opt-in on either form is upserted there as well as into Contacts; a fresh opt-in re-subscribes and clears Synced
- [ ] **B** Pick the mailing provider; **C** then syncs Subscribed + not Synced records and ticks Synced (unsubscribes flow back as Status)
- [x] **B+C** Pre-call form: Deal link prefills Deal, Your name (Deals `Lead name`) and multi-choice Service; "What's in scope? Pick any that apply" = the 15 website Solutions grouped by service. Keep in sync when Solutions change
- [x] **C** Enquiry Form already had Budget (dropdown) and the resources opt-in (`Resources` = Yes). Nothing added
- [x] **C** `?service=` preselect (bundle `form-prefill.ts`): `/contact?service=development` ticks the Development chip (matches radio id suffix, value or label)
- [x] **C** Book a call (14 Oct): **Calls** collection `6acfe4ac3a77e863b880e4a2` at `/calls/[slug]` (Heading, Heading Muted, Summary, With, Length, Where, Cal Link, Outcome 1-3, Meta Title/Description). Item `intro` live. Template `6acfe4ac3a77e863b880e4a8`: lead shell, hero from the quiz (tag = Name), MAST row with The call + `dl.detail-list` (With, Length, Where, No time that works? to /contact) + You leave with (`ol.numbered-list`, CMS bound) + Testimonial Slider; right col grey card
- [x] **C** Cal Embed code component (Shrink Tools library, `webflow-components/src/CalEmbed`): Cal.com inline month view, light, brand #1a1c21, slots view on phones, fallback link while loading or if Cal fails. Link prop "Cal Link". Published via `npm run import`
- [x] **B+C** Cal Embed placed in the Calls template grey card, Cal Link bound to the CMS field, old fallback link removed (15 Oct). Iframe border fixed (Cal's head styles can't reach the shadow root)
- [ ] **B** Cal.com: create event types per call (eg. `discovery`, `development`, `optimisation`) with their own booking questions; then **C** adds a Calls item per event and points service CTAs at them
- [ ] **B** Redirect `/book-a-call` to `/calls/intro` (Footer CTA button links to /book-a-call)
- [x] **C** Lead magnet (14 Oct): **Guides** collection `6acfe4ac576bd19e794a7e6c` at `/guides/[slug]` (Heading Muted, Format, Cover Meta, Section 1-3 Title/Text, File, Button Text, Meta). Draft item `post-raise-website-checklist` (Figma copy, no file yet). Template `6acfe4ac576bd19e794a7e72`: hero (tag Free resource, h1 = Name), What's inside + Three sections list (CMS) + Testimonial Slider; right col cover Card (title + meta), **Resource Form**, `[data-guide-download]` Underline Link bound to File
- [x] **C** Resource Form component (`3e40f412-f3e4-3446-52a7-71bf49b53b2e`, Shrink group): Name, Work email, resources opt-in; Webflow form name **Resource**; Button Text prop (bound to the guide's Button Text). Bundle adds a hidden `Guide` input (page h1) and reveals the download link only after success
- [ ] **B** Guides: cover card styling (dark, Figma `4342:1287`), Resource Form success copy ("Thanks. Your download is ready below.") and footer line ("We'll use your details to reply" fits Enquiry, not a guide)
- [ ] **B** Calls + Guides templates: drag the Clients Collection List into the Testimonial Slider Items slot; bind SEO title/description to Meta Title/Meta Description
- [ ] **B** Footer script SHA: update after the bundle push (form-prefill)
- [x] **C** FAQ page (15-16 Oct, done): `/faq` (page `6ad0e7596ffc862a55147472`; /faqs is the collection slug). FAQs gained a **Topic** option (Working with Shrink / Discovery / Development / Optimisation) and one Display Order sequence (WwS 1-7, Discovery 11+, Development 21+, Optimisation 31+); 13 new questions added (25 total). Mega Nav, quiz-style hero, search (`input.cc-search` + Icon `ph-magnifying-glass`, Finsweet `fs-list-field="*"`), clear button (Icon `ph-x`, `fs-list-element="clear"` scoped to search), topic pills via the **Search Form** component (Filter Field / Placeholder / Label props, fixed fs-list attrs) with **Filter Button** instances (Primitives; Text, Button Class is-list-active on All), bundle `button-filters.ts` group mode (footer @16c61f9), FAQs list of Accordion instances (sorted by Display Order) with hidden `faq_field` holders for search, Finsweet empty state, Footer CTA "Question not on the list? Let's talk it through." FAQPage JSON-LD (all 25) on the page
- [ ] **B** FAQ: review the 6 new answers (Discovery needs/after, own the site, build needs, what to test, how often) and confirm "Who does the work?" and "every site is built in Webflow"
- [ ] **C** Regenerate the FAQPage JSON-LD whenever FAQs change (it's static)
- [x] **B** Public email: hey@shrink.studio
- [ ] **B** Confirm: reply promise ("within one working day"), real lead magnet title, length and file
- [ ] Pricing page: `4343:999` with notes `4343:1330`, on its own row below About. Prices table, what moves a build price, six cost FAQs, CTA card. "Migration" as a price factor and the one-line descriptions are drafts
- [ ] **C** Project calculator (`/tools/project-calculator`): rebuild the tools.shrink.studio calculator as a Shrink Tools code component, lead posts to `api/forms` (Ben, 15 Oct: wants it on the site)
- [ ] Tool Stack page (Ben's old design `3407:314`): keep for after launch as "what we build with"
- [ ] Package pages (13 Oct): Clarity Sprint `4346:999`, Seed Website `4346:1267`, Compound `4346:1541`, notes `4346:1845`, on the pricing row. Service page pattern, filled from the May packages copy document (`~/Downloads/shrink-copy-docs_8.html`). The pricing page now has a Packages section
- [x] **B** Package prices confirmed current (13 Oct). The pricing page explains that service prices are starting points and packages include more
- [ ] **B** Package illustrations: three mocks in `~/shrink-prototypes/ss2027-gap/package-visuals.html` (the brief, eight pages live in six weeks, the test log), light and dark. Awaiting Ben's review; draft exports are in the pricing cards
- [x] **C** Pricing page Packages section uses Ben's Service Card component (`3781:2324`): image on top, name, line, tags, price and arrow, three across
- [ ] **B** Packages: stats left out for lack of a source (£40,000 typical quote, 70% uplift, CloudNC "first quarter" claim)

## After launch

- [ ] Home hero LCP: measure on a throttled phone (PageSpeed/WebPageTest), check the hero image weight and preload
- [ ] CMS tidy, every collection: delete fields nothing on the site binds to any more (eg. Case Studies Video Source + Hero Video Source now the cards and heroes are image-only; Services Home Image / Home Open By Default / Home Deliverables / Card Intro / Project (Image) now the home rows use Solutions; template leftovers like Archives, Galleries, LLM Answers, Placements). Audit each field against the Designer bindings first, then delete and regroup

- [ ] Three industry pages (SaaS, fintech, AI)
- [ ] Orbit's three banked articles (cost, post-raise, choosing an agency)
- [ ] One home for "Webflow agency London"
