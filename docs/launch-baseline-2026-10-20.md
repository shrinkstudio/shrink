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

## PageSpeed, 26 Oct 11:51 (home, mobile, Lighthouse 13.5, before the 26 Oct fixes)
Performance 58, Accessibility 89, Best Practices 100, SEO 100, Agentic Browsing 2/3. FCP 7.1 s, LCP 10.7 s, TBT 60 ms, CLS 0, Speed Index 7.2 s. Render-blocking savings estimate 4.6 s. Orbit lab run the same minute: performance 63, LCP 6.9 s, CLS 0.009.

## Local Lighthouse 12, 28 Oct (before the speed pass)
Lighthouse 12 run locally from London, headless Chrome, incognito, performance only. Mobile was run twice per page; run 1 often hit a cold Webflow edge cache (TTFB 1.4 to 2.3 s against 0.5 s warm), so read the pair as a range.

| Page | Mobile perf | Mobile FCP | Mobile LCP | Mobile CLS | Desktop perf | Desktop LCP | Desktop CLS | Weight |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| / | 63 / 82 | 3.7 / 2.0 s | 6.7 / 4.5 s | 0.009 | 65 | 3.6 s | 0.079 | 2.2 MiB |
| /services/development | 68 / 81 | 4.5 / 3.3 s | 5.1 / 3.9 s | 0.000 | 98 | 0.9 s | 0.011 | 1.6 MiB |
| /case-studies/adfin | 63 / 67 | 4.3 / 3.3 s | 10.4 / 9.4 s | 0.008 | 91 | 1.9 s | 0.033 | 1.7 MiB |
| /resources/aeo-for-b2b-saas | 73 / 79 | 4.3 / 3.4 s | 4.3 / 4.0 s | 0.001 | 92 | 1.4 s | 0.004 | 1.4 MiB |
| /tools/project-calculator | 66 / 64 | 3.4 / 3.3 s | 10.3 / 9.5 s | 0.002 | 88 | 2.3 s | 0.000 | 1.4 MiB |

LCP elements: home = hero marquee AVIF (mobile eager; desktop picks a lazy one); case study = hero card background image, set to lazy (load delay 6.9 to 8.1 s); services and article = body text (render delay, so FCP-bound); calculator = the CookieYes banner text on mobile. Desktop CLS on home is the hero logo cluster images (no size until they load). Fix list in LAUNCH.md under "Speed pass (28 Oct)".

## Local Lighthouse 12, 28 Oct, after the speed pass publish
Same setup as the before run. Mobile run 1 on home hit a cold cache straight after the publish (TTFB 3.9 s simulated), so read run 2 there.

| Page | Mobile perf | Mobile FCP | Mobile LCP | Mobile CLS | Desktop perf | Desktop LCP | Desktop CLS | Weight |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| / | 58 / 95 (was 63 / 82) | 4.6 / 1.8 s | 8.0 / 2.8 s (was 4.5 best) | 0.016 | 79 (was 65) | 2.1 s (was 3.6) | 0.084 | 1.0 MiB (was 2.2) |
| /services/development | 95 / 98 (was 68 / 81) | 2.1 / 1.8 s | 2.1 / 1.8 s (was 3.9 best) | 0.028 | 99 | 0.7 s | 0.011 | 0.7 MiB (was 1.6) |
| /case-studies/adfin | 74 / 98 (was 63 / 67) | 2.3 / 1.8 s | 5.8 / 2.0 s (was 9.4 best) | 0.036 | 99 (was 91) | 0.9 s | 0.032 | 0.65 MiB (was 1.7) |
| /resources/aeo-for-b2b-saas | 93 / 90 (was 73 / 79) | 2.4 / 2.8 s | 2.4 / 3.0 s (was 4.0 best) | 0.028 | 100 (was 92) | 0.6 s | 0.004 | 0.55 MiB (was 1.4) |
| /tools/project-calculator | 89 / 90 (was 66 / 64) | 2.9 / 2.8 s | 2.9 / 3.0 s (was 9.5 best) | 0.000 | 99 (was 88) | 0.7 s | 0.000 | 2.4 MiB (1.6 MB avatar, fixed and staged) |

The small CLS rise (0.016 to 0.036 mobile, 0.077 desktop home) is now "web font loaded": pages paint before Inter arrives, so the swap moves text. A preload for the woff2 is staged in the head.
