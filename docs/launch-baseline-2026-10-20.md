# Launch baseline, 20 October 2026

The numbers on the day www.shrink.studio moved to the ss-2027 site (domain over at 17:46 BST, analytics head code published 17:54 BST). Everything below describes the OLD site. Compare the new site against these, same windows, in four and twelve weeks.

Sources: PostHog project "Shrink Studio Marketing Site" (id 132694, EU), Orbit workspace shrink.studio (pixel installed 9 Oct, so Orbit pixel figures cover 11 days), Google Search Console via Orbit.

## PostHog, last 28 days (22 Sep to 20 Oct)

| Metric | Value | Previous 28 days | Change |
| --- | --- | --- | --- |
| Visitors | 474 | 328 | +45% |
| Pageviews | 565 | 402 | +41% |
| Sessions | 510 | 350 | +46% |
| Session duration | 140 s | 125 s | +12% |
| Bounce rate | 43.7% | 31.7% | +38% (worse) |

Last 7 days: 196 visitors, 220 pageviews, 205 sessions, 122 s, bounce 62.0%. The 7-day bounce is inflated by launch-day checking.

Top pages, 28 days (visitors, bounce): `/` 367 (34%), `/about` 25 (76%), `/services` 19 (80%), `/contact` 18 (88%), `/projects` 11 (83%), `/services/development` 9, `/services/optimisation` 8, `/services/webflow-migration` 7, the seven `/legals/*` pages 2 to 5 each. 65% of all pageviews are the home page.

Channels, 28 days (visitors): Direct 242, Referral 201, Organic Search 24, Organic Social 11, Organic Video 1. Organic search is 5% of visitors.

Named events live from 17:54 on 20 Oct: `contact_form_submitted`, `scroll_depth` (25/50/75/100), `solution-click`, `related-reading-click`, `article-read`, `ask-ai`. Zero history before today.

## Google Search Console, 28 days (22 Sep to 19 Oct, via Orbit)

| Metric | Value | Previous period | Change |
| --- | --- | --- | --- |
| Impressions | 870 | 947 | -8.1% |
| Clicks | 22 | 28 | -21.4% |
| CTR | 2.53% | 2.96% | -14.5% |
| Average position | 5.3 | 3.9 | worse by 1.4 |

Queries (22 in total). Non-branded: "webflow agency london" 357 impressions, 0 clicks, position 5.6 (best page /about at 2.9); "webflow agencies in london" 63, 0 clicks, 3.6 (home at 1); "webflow designer london" 59, 0, 6.7; "webflow design agency london" 31, 0, 4.1; "london webflow agency" 17, 0, 5.1; "webflow development london" 6, 1 click. Branded: "shrink studio" 33 impressions, 14 clicks, 42% CTR. The non-branded London queries get impressions at positions 3 to 7 and no clicks: the click-through problem to beat.

## Orbit pixel, 28 days (11 days of data, from 9 Oct)

257 visitors, 381 pageviews, 0 conversions (no goals configured yet). Sources: direct 60%, referral 33%, organic search 5%, social 2%. Countries: US 78, India 22, GB 19, China 17, Canada 10. Daily visitors 10 to 29 on normal days, 72 on launch day.

## Orbit site health (audit at 17:54 on launch day, 70 pages crawled, new site)

Score 96 (was 100). Google verdict: issues. AI verdict: reachable, every search and live bot allowed. Lab Core Web Vitals on the home page: LCP 8.2 s, CLS 0.085, TBT 242 ms, performance 59 (lab only, throttled; no field data yet).

Open issues:
- Blocker: 11 internally linked pages return 404 (`/book-a-call`, every `/legals/*` from /legal). Fixed by the Policies slug re-save and the launch 301s.
- Warning: 12 pages share titles, all `/contact?service=…` variants of the one contact page. Harmless; canonical covers it once set.
- Warning: no XML sitemap (sitemap off in Site settings).
- Warning: Google reports a Review snippets structured-data error on `/services`.
- No llms.txt.

## Orbit AI visibility (weekly scan, 15 prompts, 20 Oct)

Mentioned in 0 of 15 prompts on ChatGPT, Gemini, Google AI Overviews and AI Mode. The 9 Oct scan had one ChatGPT mention and citation ("how do I choose between Webflow agencies in London"), lost by 13 Oct. Domains cited instead: webflow.com (12), linkedin.com, help.webflow.com, wearetenet.com, reddit.com, videsigns.uk, youtube.com (4 each), stan.vision, makebuild.studio (3).

## PageSpeed Insights, home page, 21 Oct (day after launch, Lighthouse 13.5, no field data)

| | Mobile | Desktop |
| --- | --- | --- |
| Performance | 70 | 87 |
| Accessibility | 89 | 92 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 3.1 s | 1.0 s |
| LCP | 7.0 s | 1.6 s |
| TBT | 0 ms | 160 ms |
| CLS | 0.009 | 0.032 |
| Speed Index | 3.7 s | 1.4 s |

Re-run 21 Oct 11:59 after moving GSAP to deferred footer scripts: desktop Performance 93 (from 87), mobile 63 (from 70, within run-to-run variance; no field data yet).

Top audits: render-blocking requests (600 ms / 820 ms), image delivery (630 / 810 KiB), unused JavaScript 266 KiB, cache lifetimes 444 KiB. Fix list in LAUNCH.md under "PageSpeed".

## First two days on the new site (PostHog, read 22 Oct 19:30)

Pageviews by day: 148 on 20 Oct (from 17:54), 192 on 21 Oct, 89 on 22 Oct by 19:30. The old site averaged about 20 a day. Visitors and sessions equal pageviews because PostHog runs in memory mode until a visitor accepts cookies, so every page load counts as a new person and session and internal clicks show as referrer www.shrink.studio. Compare pageviews, never visitors, until that changes.

Scroll depth since launch, share of page sessions reaching each mark: home (146) 49% / 38% / 31% / 24%; about (28) 61 / 61 / 54 / 43; pricing (14) 71 / 64 / 43 / 21; Adfin case study (16) 63 / 38 / 38 / 13; PHP2Shell article (9) 67 / 56 / 33 / 11. Events: article-read 11, ask-ai 4, solution-click 1, contact_form_submitted 0.

## What to check against this

- Bounce on the home page and the service pages (new site has a lot more to read).
- Clicks on the five London Webflow queries (new titles and descriptions).
- Organic search share of visitors.
- AI mentions on the 15 prompts after the new copy and schema have been crawled.
- Lab LCP once field data exists, and after the hero image preload work.
- Conversions once Orbit goals and the PostHog `contact_form_submitted` event have a month of data.
