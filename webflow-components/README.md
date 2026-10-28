# Shrink: Webflow Code Components

React components published to the Shrink Studio Webflow site as native
[Code Components](https://developers.webflow.com/code-components/introduction)
(DevLink). Library id `shrink-tools`, group **Shrink**.

Components are self-contained (Shadow DOM, scoped styles) and read the ss-2027
MAST variables from the host page: custom properties inherit through the shadow
boundary, so `--primary--text`, `--_components---button--border-radius`,
`--_typography---h4--font-size` and friends resolve exactly as they do for the
site's own elements in the same Section. Every `var()` carries a fallback so
the local preview still renders in the right palette. The shared tokens,
buttons, option rows, list rows and form controls live in `src/shared/base.ts`
(class prefix `sk-`); each component adds only its own pieces.

Both tools expect to sit inside a page **Card** instance (Frame prop `none`,
the default). Set Frame to `card` when a page gives them no card of their own.

## Components

### Readiness Quiz (`src/ReadinessQuiz`)

"Ready to brief a build?": a 7-question readiness quiz for venture-backed teams.
Intro card, one question at a time, then a results screen. Ported from the live
tools.shrink.studio quiz (now retired) so it matches the proven tool. Figma: intro `3793-6378`,
results `3793-7390`.

Results screen: two-axis score (**Readiness** = moment+clarity+team / 9,
**Urgency** = gapExternal+gapInternal / 6), a "what the next site needs" list
(from the jobs-to-be-done multi-select), a "where we'd start" engagement
recommendation (Seed Website / Clarity Sprint / Discovery), a lead-capture form,
and a shareable result link.

- `quiz.ts`: questions, two-axis scoring, engagement routing, share-link
  encoding (pure, unit-tested). Edit questions/scoring/copy here.
- `styles.ts`: result-specific CSS on top of `src/shared/base.ts`.
- `ReadinessQuiz.tsx`: the UI (intro / quiz / results phases; single + multi
  select).
- `ReadinessQuiz.webflow.tsx`: Webflow declaration. Editable props: theme,
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

### Project Calculator (`src/Calculator`)

"What would your site cost?" A short branching question flow (project type,
pages, design, CMS, extras, discovery, timing; separate web app and retainer
branches) priced off the Shrink rate card the internal scoping tool uses.
Ported from the retired tools.shrink.studio calculator, with floors from the
Pricing page (Development from £15,000, Optimisation from £5,000 a month,
Compound £10,000 a month).

Results screen, matching the page's "What you leave with" list: the **price
range** for the build; **what moved the figure** (pages, integrations and
timing always first, then design, CMS, discovery and extras, each as the cost
above the lightest option, with "where the money goes" under a disclosure);
the **next step**, a call (`/calls/intro`, or `/calls/compound` for Compound)
or a brief (`/contact?service=development`), with a package pointer where one
fits (Seed Website, Clarity Sprint, Compound). A "Keep this estimate" form
posts the lead.

- `model.ts`: questions, rate card, effort weights, drivers, next-step rules
  (pure, unit-tested in `tests/calculator.test.ts`). Tune here.
- `styles.ts`: result-specific CSS on top of `src/shared/base.ts`.
- `Calculator.tsx`: the UI. `Calculator.webflow.tsx`: the Webflow declaration.

**Props:** theme, frame, intro copy and bullets, button labels, "Offer a web
app or product" (boolean, hides that project type), the three next-step links,
opt-in label, lead submit endpoint, small print.

**Lead submit:** POSTs JSON `{ form: "calculator", id, pageUrl, contact,
estimate, drivers, nextStep, answers }` to the same `api/forms` handler, which
upserts the Contact (and Company from a work email) and always creates a Deal
at Lead with the range, the drivers and the answers in its notes. Opt-in adds
the Mailing list record with Source "Calculator".

## Develop

```bash
npm install
npm run check        # tsc --noEmit
npm test             # scoring unit tests
```

### Local visual preview

Renders both components into real shadow roots inside a fake page Card, like
Webflow does. `.preview/` is gitignored; recreate `index.html` + `index.tsx`
from the git history of this README if missing (they mount `ReadinessQuiz` and
`Calculator` into `#quiz` / `#calc` hosts).

```bash
../node_modules/.pnpm/esbuild@0.24.2/node_modules/esbuild/bin/esbuild .preview/index.tsx --bundle --format=esm --jsx=automatic --outfile=.preview/bundle.js
python3 -m http.server 8795 --directory .preview
```

Then open http://localhost:8795 (or the `shrink-tools-preview` entry in
`.claude/launch.json`). Inter Variable is the host site's font; the preview
falls back to Arial.

## Publish to Webflow

Needs `WEBFLOW_API_TOKEN` for the site's workspace in the environment.

```bash
npm run import       # webflow devlink import -> pushes the library to Webflow
```

The component then appears in the Designer's Components panel under **Shrink**.
Add it to a page (inside a Card instance), set the copy in the props panel.
After each `npm run import`, the Designer shows a library update to accept.
