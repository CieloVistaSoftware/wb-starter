# Vendored third-party code

The site loads **nothing** from a CDN — not in dev, not in tests, not on the
published GitHub Pages site. Every external dependency the browser needs lives
in this directory and is loaded by a relative (module-relative where it is
loaded from JS) URL, so it also works under the Pages sub-path `/wb-starter/`.

`tests/compliance/no-external-requests.spec.ts` is the guard: it drives real
pages and fails on any request that leaves localhost.

Do not reference `/node_modules/` from the browser — it is not deployed.

## Packages

| Path | Package | Version | Source | License |
|---|---|---|---|---|
| `highlight.js` | highlight.js (browser build) | 11.11.1 | https://highlightjs.org (pre-existing) | BSD-3-Clause |
| `hljs-styles/*.min.css` | highlight.js themes | 11.11.1 | npm `highlight.js@11.11.1` → `styles/<id>.min.css` | BSD-3-Clause (`hljs-styles/LICENSE`) |
| `marked/marked.umd.js` | marked | 17.0.1 | npm `marked@17.0.1` → `lib/marked.umd.js` | MIT (`marked/LICENSE.md`) |
| `ajv/ajv.esm.js` | ajv (+ fast-deep-equal, json-schema-traverse, uri-js) | 8.12.0 | npm `ajv@8.12.0`, bundled to one ESM file | MIT (`ajv/THIRD-PARTY-LICENSES.txt`) |
| `chart.js/chart.umd.min.js` | Chart.js | 4.5.1 | npm `chart.js@4.5.1` → `dist/chart.umd.min.js` | MIT (`chart.js/LICENSE.md`) |
| `fonts/` | Inter (v20), JetBrains Mono (v24), IBM Plex Sans (v23) woff2 | Google Fonts API, 2026-09-25 | `fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700` | SIL OFL 1.1 (`fonts/OFL-*.txt`) |
| `frameworks/react/react.development.js` | react (UMD dev) | 18.3.1 | npm `react@18.3.1` → `umd/` | MIT |
| `frameworks/react-dom/react-dom.development.js` | react-dom (UMD dev) | 18.3.1 | npm `react-dom@18.3.1` → `umd/` | MIT |
| `frameworks/vue/vue.global.js` | vue (global dev build) | 3.5.43 | npm `vue@3.5.43` → `dist/vue.global.js` | MIT |
| `frameworks/htmx/htmx.min.js` | htmx.org | 1.9.10 | npm `htmx.org@1.9.10` → `dist/htmx.min.js` | BSD-2-Clause |
| `frameworks/babel-standalone/babel.min.js` | @babel/standalone | 7.29.9 | npm `@babel/standalone@7.29.9` → `babel.min.js` | MIT |
| `frameworks/babel-plugin-jsx-dom-expressions/` | babel-plugin-jsx-dom-expressions (+ its @babel/types, parse5, html-entities deps) | 0.40.10 | npm, bundled to one ESM file | MIT (`THIRD-PARTY-LICENSES.txt`) |
| `frameworks/svelte/` | svelte runtime + compiler | 4.2.20 | npm `svelte@4.2.20`, bundled ESM | MIT (`THIRD-PARTY-LICENSES.txt`) |
| `frameworks/solid-js/` | solid-js + solid-js/web | 1.9.15 | npm `solid-js@1.9.15`, bundled ESM (browser build) | MIT (`THIRD-PARTY-LICENSES.txt`) |
| `frameworks/angular/` | @angular/core, compiler, platform-browser, common 17.3.12; zone.js 0.14.10; rxjs 7.8.2; tslib 2.8.1 | see left | npm, bundled ESM | MIT / Apache-2.0 / 0BSD (`THIRD-PARTY-LICENSES.txt`) |

Notes:

- `hljs-styles/` holds one stylesheet for every theme id in `CODE_THEMES`
  (`src/wb-viewmodels/codecontrol.js`) plus `atom-one-dark-reasonable`, the
  default of `src/wb-viewmodels/semantics/code.js`. `dracula` does not exist at
  the top level of highlight.js 11 (it was a 404 on cdnjs too), so
  `hljs-styles/dracula.min.css` is highlight.js's own `styles/base16/dracula.min.css`.
- `fonts/fonts.css` is Google's CSS for the families above with every `src:`
  rewritten to `./files/*.woff2`. All unicode-range subsets are kept, so only
  the ones a page actually uses are downloaded.
- `//# sourceMappingURL=` comments were stripped from files whose `.map` is not
  vendored (marked, Chart.js, @babel/standalone).

## Bundled ESM files (ajv, svelte, solid-js, angular, jsx-dom-expressions)

These packages ship CommonJS, or ESM with bare imports a browser cannot
resolve, so they were bundled with esbuild 0.28.2 from the exact npm versions
above. Packages whose entries must share runtime state (svelte ⇄ svelte/internal,
solid-js ⇄ solid-js/web, @angular/*) are built together with code splitting, so
every entry imports the same shared chunk under `chunks/`.

```js
// npm i esbuild@0.28.2 ajv@8.12.0 svelte@4.2.20 solid-js@1.9.15 \
//   babel-plugin-jsx-dom-expressions@0.40.10 zone.js@0.14.10 rxjs@7 \
//   @angular/{core,compiler,common,platform-browser}@17.3.12
const common = {
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true,
  legalComments: 'eof', conditions: ['browser', 'module', 'import', 'default'],
  define: { 'process.env.NODE_ENV': '"production"',
            'process.env.BABEL_TYPES_8_BREAKING': 'false', 'process.env.BABEL_8_BREAKING': 'false' },
  // @babel/helper-module-imports requires node's `assert`; a 5-line CJS shim
  // (function assert(v, m) { if (!v) throw new Error(m) }; module.exports = assert).
  alias: { assert: './shims/assert.cjs' },
};
// ajv:  entry `import Ajv from 'ajv'; export default Ajv; export { Ajv };` -> ajv/ajv.esm.js
// jsx:  entry `export { default } from 'babel-plugin-jsx-dom-expressions'`
// split (splitting: true, chunkNames: 'chunks/[name]-[hash]'):
//   svelte:   { svelte, internal: 'svelte/internal', 'disclose-version': 'svelte/internal/disclose-version', compiler: 'svelte/compiler' }
//   solid-js: { 'solid-js': 'solid-js', web: 'solid-js/web' }
//   angular:  { zone: 'zone.js', compiler: '@angular/compiler', core: '@angular/core', 'platform-browser': '@angular/platform-browser' }
```

## Updating a package

1. Get the exact version (`npm pack <pkg>@<version>` or install into a scratch
   directory — never into this repo's `node_modules`).
2. Replace the files here (rebuild with the recipe above for bundled ones) and
   the package's license file.
3. Update the version in this table.
4. Run `tests/compliance/no-external-requests.spec.ts`,
   `tests/integration/frameworks-demo.spec.ts` and the code-theme specs in
   `tests/regression/`.
