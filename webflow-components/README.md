# Shrink — Webflow Code Components

React components published to the Shrink Studio Webflow site as native
[Code Components](https://developers.webflow.com/code-components/introduction)
(DevLink). Library id `shrink-tools`, group **Shrink**.

Same setup as the Adfin Tools library: components are self-contained (Shadow DOM,
scoped styles), so they drop into any page and read as part of the site. Palette
and type mirror the ss-2027 MAST tokens (blue `#4469fc`, ink `#0a0a0a`, smoke
`#f4f4f5`, muted `#50565f`, 1.5px borders, 4px radius, Helvetica Now Display).

## Components

### Readiness Quiz (`src/ReadinessQuiz`)

"Ready to brief a build?" — a 7-question readiness quiz for venture-backed teams.
Intro card, one question at a time, then a results screen. Ported from the live
tools.shrink.studio quiz (now retired) so it matches the proven tool. Figma: intro `3793-6378`,
results `3793-7390`.

Results screen: two-axis score (**Readiness** = moment+clarity+team / 9,
**Urgency** = gapExternal+gapInternal / 6), a "what the next site needs" list
(from the jobs-to-be-done multi-select), a "where we'd start" engagement
recommendation (Seed Website / Clarity Sprint / Discovery), a lead-capture form,
and a shareable result link.

- `quiz.ts` — questions, two-axis scoring, engagement routing, share-link
  encoding (pure, unit-tested). Edit questions/scoring/copy here.
- `styles.ts` — scoped CSS (MAST palette).
- `ReadinessQuiz.tsx` — the UI (intro / quiz / results phases; single + multi
  select).
- `ReadinessQuiz.webflow.tsx` — Webflow declaration. Editable props: theme,
  intro copy, button labels, and the two integration endpoints below.

**Integration endpoints (props):**

- **Lead submit endpoint**: where the form POSTs JSON `{ form: "quiz", id,
  pageUrl, contact, result, answers }`. Defaults to
  `https://shrink-site-api.vercel.app/api/forms` (`~/shrink/api/forms.ts`), which
  writes the Contact (and a Deal when the result is "ready") to Airtable Shrink OS.
  CORS allows shrink.studio, www.shrink.studio and *.webflow.io.
- **Share link page**: the page the shareable link opens
  (`<page>?c=<slug>&d=<encoded answers>`). Empty = the page the quiz is on; the
  component reads `?d=` on load and opens straight on the results.
- **Opt-in label**: the resources checkbox; ticked adds them to the Mailing list.

## Develop

```bash
npm install
npm run check        # tsc --noEmit
npm test             # scoring unit tests
```

### Local visual preview

Renders the component into a real shadow root (light + dark), like Webflow does.

```bash
npx esbuild .preview/index.tsx --bundle --format=esm --jsx=automatic --outfile=.preview/bundle.js
python3 -m http.server 8795 --directory .preview
```

Then open http://localhost:8795. (Helvetica Now Display is the host site's font;
the preview falls back to Helvetica/Arial, so type weight differs slightly.)

## Publish to Webflow

Needs `WEBFLOW_API_TOKEN` for the site's workspace in the environment.

```bash
npm run import       # webflow devlink import -> pushes the library to Webflow
```

The component then appears in the Designer's Components panel under **Shrink**.
Add it to a page, set the CTA link + copy in the props panel.
