import * as esbuild from 'esbuild';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';

/**
 * esbuild plugin that inlines Web Workers into the main bundle.
 *
 * The vendored Finsweet list package does `import FilterWorker from './filter.worker.js'`
 * and then `new FilterWorker()`. That relies on Finsweet's own build step, which we don't
 * have. This plugin bundles the worker source separately, embeds it as a string, and
 * exports a Worker subclass backed by a Blob URL, so the whole thing ships as one file
 * (required: we serve a single script from jsDelivr, no sibling worker asset).
 *
 * @param {{ minify?: boolean, target?: string }} [options]
 * @returns {import('esbuild').Plugin}
 */
export const inlineWorkerPlugin = (options = {}) => ({
  name: 'inline-worker',

  setup(build) {
    const { minify = false, target = 'es2020' } = options;

    // `./filter.worker.js` on disk is `filter.worker.ts` — resolve both spellings.
    build.onResolve({ filter: /\.worker(\.[jt]s)?$/ }, (args) => {
      if (args.namespace === 'inline-worker') return;

      const base = resolve(args.resolveDir, args.path).replace(/\.[jt]s$/, '');
      const path = ['.ts', '.js'].map((ext) => base + ext).find(existsSync);

      if (!path) return;

      return { path, namespace: 'inline-worker' };
    });

    build.onLoad({ filter: /.*/, namespace: 'inline-worker' }, async (args) => {
      const result = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        write: false,
        format: 'iife',
        platform: 'browser',
        minify,
        target,
        // Workers can't be ES modules here (classic worker via Blob), so no splitting.
        logLevel: 'silent',
      });

      const code = result.outputFiles[0].text;

      // One Blob URL shared by the whole worker pool.
      const contents = `
const __workerUrl = URL.createObjectURL(
  new Blob([${JSON.stringify(code)}], { type: 'text/javascript' })
);

export default class InlineWorker extends Worker {
  constructor(options) {
    super(__workerUrl, options);
  }
}
`;

      return { contents, loader: 'js', resolveDir: dirname(args.path) };
    });
  },
});
