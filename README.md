# Shrink

The JavaScript bundle for the **Shrink Studio** site (2026 rebuild). TypeScript compiled and minified by esbuild, then served to Webflow over jsDelivr.

The site is built in **Webflow** using the **[Lumos](https://lumos.timothyricks.com/) framework** for its class and variable system. This repo is only the behaviour layer: GSAP interactions, sliders, form handling and anything else that needs real JavaScript. All styling lives in Webflow.

## How the pieces fit

- **Webflow + Lumos** own structure and CSS. Class names, utilities and design tokens are all Lumos. Ben builds the pages in the Designer.
- **This bundle** owns behaviour. Modules are added per section as they are needed, the bundle starts empty and grows with the build.
- **`.claude/skills/lumos-skill`** keeps any AI assistant on Lumos conventions (vanilla HTML/CSS/JS, `u-` utilities, `--_theme---*` colour variables, the `_wrap` component pattern). It triggers automatically in this repo.

## Stack

- [TypeScript](https://www.typescriptlang.org/) source, bundled with [esbuild](https://esbuild.github.io/)
- [pnpm](https://pnpm.io/) (>=10) for package management
- [Playwright](https://playwright.dev/) for end-to-end tests
- [Changesets](https://github.com/changesets/changesets) for versioning and changelogs
- ESLint + Prettier (Finsweet shared configs) for linting and formatting

## Getting started

Install dependencies:

```bash
pnpm install
```

First time using Playwright in this repo, also install the browsers:

```bash
pnpm playwright install
```

## Development

```bash
pnpm dev
```

This runs esbuild in watch mode and serves the compiled files from `http://localhost:3000` with live reload. Point Webflow at a file while developing:

```html
<script defer src="http://localhost:3000/index.js"></script>
```

## Production build

```bash
pnpm build
```

Outputs minified files to `dist/`.

## Deploy (jsDelivr)

Deployment follows the standard Shrink pattern: push to the default branch and jsDelivr serves `dist/` straight from GitHub.

```html
<script defer src="https://cdn.jsdelivr.net/gh/shrinkstudio/shrink@master/dist/index.js"></script>
```

After a push, purge the jsDelivr cache so the CDN picks up the new build (visit the matching `https://purge.jsdelivr.net/gh/shrinkstudio/shrink@master/dist/index.js` URL). For anything production-critical, pin to a commit SHA instead of `@master` rather than using `@latest`.

## Building multiple entry points

Add files to the `ENTRY_POINTS` array in [`bin/build.js`](bin/build.js) to output more than one bundle:

```javascript
const ENTRY_POINTS = ['src/index.ts', 'src/home/hero.ts'];
```

esbuild also handles CSS entry points and a `$utils/*` path alias (configured in [`tsconfig.json`](tsconfig.json)) so imports stay clean:

```typescript
import example from '$utils/example';
```

## Scripts

- `pnpm dev` — watch build + local server on `localhost:3000`
- `pnpm build` — production build to `dist/`
- `pnpm lint` — ESLint + Prettier check
- `pnpm lint:fix` — auto-fix lint issues
- `pnpm check` — TypeScript type-check
- `pnpm format` — format with Prettier
- `pnpm test` — run Playwright tests
- `pnpm test:ui` — run Playwright tests in UI mode

## Testing

Tests live in [`/tests`](tests). Playwright runs `pnpm dev` in the background so the served files are available during a run (change this in `playwright.config.ts`). If the project has no tests yet, you can comment out the test job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) to speed up CI.

## CI

Opening a Pull Request runs lint, type-check and tests via the shared workflows in `.github/workflows/ci.yml`.
