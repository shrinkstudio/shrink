# ss-2027: now to launch

Working list for the new Shrink site (staging: ss-2027.webflow.io). Built up page by page.
Last checked against staging: 12 October 2026.

Owner key: **B** = Ben (Designer or a decision), **C** = Claude (via Webflow MCP or API), **B+C** = Ben supplies facts, Claude builds.

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
- [ ] **B** Homepage solutions list: switch source to the service's Solutions field, check the binding, set the link to the current Solution

### 3. Case studies (`/case-studies` and 7 children)

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
- [ ] **B** About vs Figma `4363:3862` (16 Oct): studio facts list (Founded, Based in, Partner status, Team, Clients, Works across) missing beside "Where we come from"; photos are a marquee strip on the page, 3 large photos in Figma; values heading "What we live by" (page) vs "What we stand by" (Figma); team lines + LinkedIn not built, "Who we are" vs "Who are we?"
- [ ] **C** About "Featured resources" still uses the old image-placeholder cards (`select-resource_*`); swap to the Resources article card (grey, category mesh on hover). Figma already updated: Article card synced to the build, used in Studio updates, Studio updates (About) and Resources list
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

### 7. Homepage
- [ ] **B+C** FAQ section with structured data
- [ ] **B** Ben's avatar (then refresh the Discovery visual and needs card 01)

### 8. Quiz (`/tools/ready-to-brief-a-build`)
- [x] Quiz stays as it is: it is a code component in the repo, no restyle (Ben, 13 Oct)
- [x] **C** Submits to `api/forms` (15 Oct, `c8e94f8`): Contact always, Deal at Lead when ready, Mailing opt-in; share link rehydrates on this page. **B**: accept the library update and clear the instance's old Lead submit endpoint + Share link props
- [ ] **B+C** Copy: em dashes and one negation ending. The recommendation names ("Seed Website", "Clarity Sprint") are the package names and can link to the new package pages

---

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

- [ ] Three industry pages (SaaS, fintech, AI)
- [ ] Orbit's three banked articles (cost, post-raise, choosing an agency)
- [ ] One home for "Webflow agency London"
