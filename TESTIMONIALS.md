# Shrink Studio testimonials and reviews

Compiled 14 Oct 2026 (read-only sweep). Quotes are copied verbatim from each source, including original typos and punctuation. Where a quote appears in several places with different wording, every variant is listed under the one entry.

## Summary

**11 unique people** have given Shrink a testimonial or review: 6 appear on the website and 9 on Google, with 5 people in both. Contra adds 1 more.

| Source | Entries | Notes |
|---|---|---|
| Live site www.shrink.studio | 6 | One CMS slider (`testimonial-lines`), the same 6 on Home and on `/services`, `/services/discovery`, `/services/development` and `/services/optimisation`. No quotes on About, Contact, `/projects` or any of the 10 `/projects/*` case studies. |
| Live CMS (site `69a96f677ab6e4371c499090`, Clients `69a98a5fc6a71bc59df3fb0d`) | 6 | Fields `testimonial-text` / `testimonial-name` / `testimonial-job-role` / `testimonial-avatar`. The rich-text `testimonial` field is empty on every item. |
| Staging ss-2027.webflow.io | 1 (excerpt) | Home hero marquee card only: a shortened CloudNC quote. Case study pages (7), About, Services, Pricing, Packages and Solutions pages show no client quotes yet. |
| Staging CMS (site `6a8daa3ae6b8009a3d00e586`, Clients `6a8f0d10e4eedce80f3837bf`) | 6, plus 1 incomplete | Same 6 quotes as live, without the wrapping quote marks. Adfin has a name and role but no quote. Case Studies `6a8eefd94a68e0296a597ff0` has no quote field, and no testimonials in its rich text. |
| tools.shrink.studio | 0 | Checked Home, `/calculator`, `/quiz`, `/accessibility`, `/plg-readiness`, `/seo-aeo` and `/structure`. |
| Local repos | 1 (CloudNC, reused) | `~/shrink-prototypes/ss2027-gap/` (services, lead and quiz page prototypes). Nothing in `~/shrink`, `~/shrink-studio-site`, `~/shrink-marketing-site`, `~/shrink-astro` or `~/shrink-tools` beyond slider JS and planning notes. |
| Google Business Profile | 9 reviews, 5.0 average | All 5 stars, all dated "a year ago" (around late 2025). Labelled "Reviews aren't verified". |
| Contra (`benhammond`) | 1 review, 5.0 | Michael Ussery, Brand Engine, 21 May 2025. |
| Webflow profiles (`@shrink-studio` Premium Partner, `@shrinkstudio` Ben) | 0 | Neither profile has a reviews section. |
| Clutch | 0 | A listing exists ("Shrink Studio, 0.0 (0)", London, $5,000+, $100 to $149/hr) with no reviews. |
| Sortlist, DesignRush, GoodFirms | none | No listing (404, or a redirect to the home page). |

**Avatars**
- **Website, photo:** Alex Quaye (CloudNC), Tom Allen (Buff Motion) and Ally Marouane (Steamhaus).
- **Website, logo in the avatar slot:** Hugo Hoyland (Asset Reality), Alex Watson (Arke) and Thomas Cardon (Hyperfox). The files are `hugo-h-asset.svg`, `ark-logo.svg` and `hf-logo.svg`.
- **Staging hero:** Alex Quaye photo plus the CloudNC icon.
- **Google, photo:** Charlotte Curl, Alex Watson, Lo Furneaux, Tom Allen, Benn Raistrick and Ally Marouane.
- **Google, letter only:** Hugo Hoyland (H), Nicolas Sanchez (N) and Thomas Cardon (T).
- **Contra:** reviewer photo.

**Gaps (case studies with no client quote)**
- **Live `/projects/*`:** Clarity Business Travel, Museum Studio, Skira, Johnson Law Group, Forest (B2B site and Common Sense Club quiz) and nxzen. Buff Motion, CloudNC and Steamhaus have a quote in the CMS, but their case study pages do not show it.
- **Staging `/case-studies/*`:** Adfin (Tom Pope, Co-Founder & CEO, is named in the CMS but there is no quote text), Forest (forest-bikes and forest-common-sense-quiz) and nxzen. `LAUNCH.md` notes "Only CloudNC has a client quote; the quote block hides without one". However, none of the staging case study pages currently render the CloudNC quote either.

**Reviews not used on the site**
- Benn Raistrick (Gravita). Gravita already exists in both Clients CMSs, with no testimonial.
- Charlotte Curl
- Nicolas Sanchez (Nu Quantum)
- Lo Furneaux
- Michael Ussery (Brand Engine, Contra)

**The website copy is edited from the Google wording**
- Five of the six site quotes match a Google review, edited from "Ben" to "Shrink" and from "he" to "they" or "the team".
- The Buff Motion edit added grammar errors that the original does not have: "they was excellent" and "They're attention to detail".
- The Arke edit kept "He is competent and confident" after changing the subject to "The Shrink team".
- CloudNC (Alex Quaye) is the only site quote with no public review behind it.

---

## By company

### CloudNC (case study: live `/projects/cloudnc-from-fragmented-forms-to-a-21-conversion-rate-increase`, staging `/case-studies/cloudnc`)

**Alex Quaye, Head of Growth, CloudNC**

> We needed a Webflow partner who could move fast and help us make the right calls on important technical decisions. Shrink delivered above and beyond our expectations, and built a system we actually use every day. We're looking forward to continuing the work together as we continue to grow.

- Sources:
  - Live site: Home and the 4 services pages (slider).
  - Live CMS: Clients item `69a98f144e4928f6f3f330c0`, wrapped in straight quotes.
  - Staging CMS: Clients item `6a8f0de0c1c35822dba7a049` (relationship "18m", industry "AI manufacturing").
  - Prototypes: `~/shrink-prototypes/ss2027-gap/services-page.html` and `build_services_page.py`, which have a full quote card plus a 21% / 60 / 660+ stats strip.
- Excerpt variant: "“Shrink delivered above and beyond our expectations, and built a system we actually use every day.”"
  - Staging home hero marquee (https://ss-2027.webflow.io/), captioned "Alex Quaye, Head of Growth at CloudNC".
  - `~/shrink-prototypes/ss2027-gap/lead-pages.html` and `quiz-pages.html`.
- Date: not shown. Rating: n/a (not a review).
- Avatar: yes, a photo.
  - Live: https://cdn.prod.website-files.com/69a96f697ab6e4371c49913d/69a98f144e4928f6f3f33077_699e1c36cf87244a5f9d2a38_697a26b68e1f5e026f061332_alex-q.avif
  - Staging hero: https://cdn.prod.website-files.com/6a8daa3ae6b8009a3d00e586/6ac3c7c2f98624a70540e298_hero-marquee-quote-alex-quaye.avif, plus CloudNC icon `6ac3a18851cab540bc042dd0_CNC-Icon_SS-Home.svg`.
- Not on Google or Contra.

### Buff Motion (case study: live `/projects/buff-motion-when-a-motion-studios-website-finally-moves`, staging `/case-studies/buff-motion`)

**Tom Allen, Co-founder, Buff Motion**

- Google review (5 stars, "a year ago", photo avatar):

> We partnered with Ben on the development of our studio site and he was excellent from start to finish. His attention to detail and diligence throughout was excellent, it really felt like he cared as much as we did about the final outcome. Would fully recommend ⭐️⭐️⭐️⭐️⭐️

- Website and CMS variant (live site slider, live CMS `69a98f144e4928f6f3f330be`, staging CMS `6a8f0de0c1c35822dba7a047`):

> We partnered with Shrink on the development of our studio site and they was excellent from start to finish. They're attention to detail and diligence throughout was excellent, it really felt like they cared as much as we did about the final outcome. Would fully recommend.

- Avatar on site: yes, a photo. https://cdn.prod.website-files.com/69a96f697ab6e4371c49913d/69a98f134e4928f6f3f33068_699e1c364e28ea1788ad00f7_6977ce288fba7f89904ee5a7_tom%2525201.avif

### Steamhaus (case study: live `/projects/steamhaus`, staging `/case-studies/steamhaus`)

**Ally Marouane, Digital Marketing Manager, Steamhaus**

- Google review (5 stars, "a year ago", photo avatar):

> Such a great experience working with Shrink, helping us get our site live and always being so responsive! There's nothing we threw at them that they couldn't help with :)

- Website and CMS variant (live site slider, live CMS `69a98ec62d34f14d0814a266`, staging CMS `6a8f0da1e4eedce80f386993`):

> Such a great experience working with Shrink, helping us get our site live and always being so responsive! There's nothing we threw at them that they couldn't help with.

- Avatar on site: yes, a photo. https://cdn.prod.website-files.com/69a96f697ab6e4371c49913d/69a98ec62d34f14d0814a220_699e1c39aa919535be1fd4c1_69947078ad2f83fde9f4f159_ally.jpeg

### Asset Reality (no case study)

**Hugo Hoyland, Chief Strategy Officer, Asset Reality**

- Google review (5 stars, "a year ago", letter avatar "H"):

> Wholeheartedly recommend Ben - true attention to detail, great communication throughout, and brilliant with even the most seemingly trivial technical details. We spoke/tested several web dev firms before meeting Shrink and haven't looked back since

- Website and CMS variant (live site slider, live CMS `69a98f144e4928f6f3f330bc`, staging CMS `6a8f0de0c1c35822dba7a045`):

> Wholeheartedly recommend Shrink - true attention to detail, great communication throughout, and brilliant with even the most seemingly trivial technical details. We spoke/tested several web dev firms before meeting Shrink and haven't looked back since.

- Avatar on site: the file is named like a logo, not a portrait. https://cdn.prod.website-files.com/69a96f697ab6e4371c49913d/69a98f144e4928f6f3f3308a_699e1c360f2afe40ab623757_69947324b5a30dbf54f58151_hugo-h-asset.svg
- Asset Reality is also listed on the Webflow partner profile Sites.

### Arke (no case study)

**Alex Watson, Managing Director, Arke**

- Google review (5 stars, "a year ago", photo avatar; the reviewer has 7 reviews):

> Ben and the team supported our marketing agency with some incredibly innovative and strategic digital strategies and web builds. He is competent and confident, and approaches projects with the organisation and communication you want/need for complex projects.

- Website and CMS variant (live site slider, live CMS `69a98ef3d5d6e787eb38dadb`, staging CMS `6a8f0de0c1c35822dba7a03d`):

> The Shrink team supported our marketing agency with some incredibly innovative and strategic digital strategies and web builds. He is competent and confident, and approaches projects with the organisation and communication you want/need for complex projects.

- Avatar on site: the Arke logo. https://cdn.prod.website-files.com/69a96f697ab6e4371c49913d/69a98ef3d5d6e787eb38dacd_699e1c37d576d48e50c0214e_699471cdf669a0606e900935_ark-logo.svg

### Hyperfox (no case study)

**Thomas Cardon, Marketing Manager, Hyperfox**

- Google review (5 stars, "a year ago", letter avatar "T"):

> I highly recommend Ben from Schrink Studio for building scalable Webflow sites! Together, we built a scalable design system that made it super easy to create and update new pages without needing a developer every time. It’s not the first time we’ve worked together, and it definitely won’t be the last. Fast, attention to detail, collaborative, and just real solid work.

- Website and CMS variant (live site slider, live CMS `69a98edef3cdc762d58d9563`, staging CMS `6a8f0da1e4eedce80f38699f`):

> Shrink built a scalable design system that made it super easy to create and update new pages without needing a developer every time. It's not the first time we've worked together, and it definitely won't be the last. Fast, attention to detail, collaborative, and just real solid work.

- Avatar on site: the Hyperfox logo. https://cdn.prod.website-files.com/69a96f697ab6e4371c49913d/69a98eddf3cdc762d58d9545_699e1c38bcff55f77ede9aeb_69947116a71e1f5399832ab0_hf-logo.svg
- Hyperfox is also listed on the Webflow partner profile Sites.

### Gravita (client in CMS, no case study)

**Benn Raistrick** (role not shown; the review names Gravita)

- Google review (5 stars, "a year ago", photo avatar):

> Shrink has been a Trusted and valuable partner for Gravita for a while now delivering high-end Webflow and design support on a number of large projects from SME's to Enterprise scale. I would highly recommend the team.

- Not used on the site. The Gravita Clients items (live `69a98ef3d5d6e787eb38dadf`, staging `6a8f0de0c1c35822dba7a041`) have empty testimonial fields.

### Nu Quantum (no case study)

**Nicolas Sanchez** (role not shown)

- Google review (5 stars, "a year ago", letter avatar "N"):

> I highly recommend Ben and Shrink Studio for their web design services with Webflow. They were helpful and efficient while building a landing page for us Nu Quantum. They maintained excellent communication, provided insightful expertise, and delivered on time without compromising quality. The entire process was smooth and enjoyable, resulting in a landing page we are proud of.

### Brand Engine (no case study)

**Michael Ussery** (Contra organisation "Brand Engine", Wilmington, USA; relationship: Client)

- Contra review (5 stars, 21 May 2025, photo avatar https://media.contra.com/image/upload/h_300,w_300/gvgwixc61xybmmwr9fum.webp). Source: https://contra.com/benhammond

> Ben was incredible!  Great design, great to work with- will 10/10 work with again!

### Company not stated

**Charlotte Curl** (Google, 5 stars, "a year ago", photo avatar):

> Ben at Shrink was a total godsend and hugely improved the Webflow site I was working on. It had historically been poorly managed and was in a total mess. He cleaned up everything in the back end and gave us really well thought out, beautifully designed and flexible templates to use moving forwards. He was super easy to work with, strategic and proactive, and did a super job. I wouldn't hesitate to work with Shrink again.

**Lo Furneaux** (Google, 5 stars, "a year ago", photo avatar):

> I can’t recommend Shrink Studio highly enough! Ben created a responsive website that perfectly matched our brief in an incredibly tight timescale. Throughout the entire process, Ben was flexible and accommodating, taking on all our changes without hesitation or complaint. He was always quick to respond to our questions and explained things clearly and confidently, ensuring we understood every step of the way.
>
> What really impressed me was his ability to go above and beyond, suggesting improvements we hadn’t even thought of, which significantly enhanced the final product. His attention to detail and commitment to delivering a top-quality result were evident in every aspect of the project. Ben is not only skilled but also a pleasure to work with, and I wouldn’t hesitate to work with him again in the future.

Google source: the Business Profile "Shrink Studio | Webflow Premium Partner London" (https://share.google/xwrM1ox4Lb0ZJQtPo), 5.0 from 9 reviews. Topic chips: strategic (2), communication (3), project (3).

---

## Placeholders, incomplete and excluded items

- **Adfin (staging CMS, Clients `6a8f0de0c1c35822dba7a04d`):** `testimonial-name` "Tom Pope" and `testimonial-role` "Co-Founder & CEO" are set, but there is no quote text and no avatar. This is a slot waiting for a quote.
- **Services prototype (`~/shrink-prototypes/ss2027-gap/services-page.html`, `build_services_page.py`):**
  - The "In their words" card has Adfin and Forest tabs, but only CloudNC content exists.
  - The photo slot is a placeholder reading "Photo: Alex Quaye".
- **Staging About page:** `LAUNCH.md` lists "the testimonial card" as an addition to review, but it is not on the published staging page.
- **Excluded:** `~/Sites/camassist-cn/index.html` has a Chinese-language testimonial (贾雨, 深圳市特尔精密制造有限公司). It is a CAM Assist product customer quote on the CloudNC site Shrink built, not a review of Shrink.
- No lorem ipsum or template-filler testimonials were found on any page or in either CMS.
