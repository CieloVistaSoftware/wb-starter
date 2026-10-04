// Flat ESLint config (ESLint 9+/10). Replaces the legacy .eslintrc the editor
// extension kept failing to find. Scoped to JS only — the extension should not
// try to lint HTML/CSS here.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// #1237: each environment's globals, declared. Without these, every console,
// process and Buffer in server.js, .husky/ and scripts/ was an "undefined
// variable" -- 550 of 659 errors -- and the real errors were invisible under
// them. Explicit lists in this file's style; `globals` is only a transitive
// dependency.
const NODE_GLOBALS = {
  console: 'readonly', process: 'readonly', Buffer: 'readonly', URL: 'readonly',
  URLSearchParams: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
  setInterval: 'readonly', clearInterval: 'readonly', setImmediate: 'readonly',
  clearImmediate: 'readonly', queueMicrotask: 'readonly', structuredClone: 'readonly',
  globalThis: 'readonly', fetch: 'readonly', AbortController: 'readonly',
  TextEncoder: 'readonly', TextDecoder: 'readonly', performance: 'readonly',
};
// sw.js runs in a ServiceWorkerGlobalScope: no window, no document.
const SERVICE_WORKER_GLOBALS = {
  self: 'readonly', caches: 'readonly', clients: 'readonly', fetch: 'readonly',
  Request: 'readonly', Response: 'readonly', URL: 'readonly', console: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', Promise: 'readonly',
};

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'data/**',
      'test-results/**',
      'playwright-report/**',
      'docs/**',
      '**/*.min.js',
      // Recorded third-party CDN responses served by the offline test
      // fixture (tests/fixtures/offline/README.md) -- not our code.
      'tests/fixtures/offline/**',
      // #1237: retired code, kept for reference. .gitignore already says so;
      // it was linted only because its files are still tracked (255 errors).
      'archive/**',
      // Vendored Highlight.js 11.11.1 build (BSD-3), not our code.
      'src/lib/highlight.js',
    ],
  },
  js.configs.recommended,
  // #1237: an empty catch is how this codebase says "best effort, and a
  // failure here changes nothing" (a missing optional file, a stat on a path
  // that may be gone). Any other empty block is still an error.
  { rules: { 'no-empty': ['error', { allowEmptyCatch: true }] } },
  {
    files: ['src/**/*.js', 'scripts/**/*.{js,mjs}', 'tests/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
        customElements: 'readonly',
        location: 'readonly',
        history: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        getComputedStyle: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        queueMicrotask: 'readonly',
        process: 'readonly',
        // #1237: browser APIs src/ uses that this list was missing.
        NodeFilter: 'readonly',
        performance: 'readonly',
        CSS: 'readonly',
        Image: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLAudioElement: 'readonly',
        FormData: 'readonly',
        AbortController: 'readonly',
        FileReader: 'readonly',
        Response: 'readonly',
        alert: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },

  // ── Node (#1237) ──────────────────────────────────────────────────────────
  {
    files: [
      'server.js', 'server/**/*.js', 'mcp-server/**/*.js',
      '.husky/**/*.{js,mjs}', 'scripts/**/*.{js,mjs,cjs}', 'packages/**/*.{js,mjs}',
      'eslint.config.js',
    ],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: NODE_GLOBALS },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
  // The VS Code extension is CommonJS, as the extension host loads it.
  {
    files: ['vscode/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...NODE_GLOBALS, require: 'readonly', module: 'writable', exports: 'writable', __dirname: 'readonly' },
    },
  },
  // ── Service worker (#1237) ────────────────────────────────────────────────
  {
    files: ['sw.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: SERVICE_WORKER_GLOBALS },
  },

  // ── Type-aware linting for the .ts test suite (issue #840) ─────────────────
  //
  // Before this block, NOTHING checked the 546 .spec.ts files. Playwright hands
  // them to Babel, which STRIPS types and runs — it would execute them
  // identically if every annotation in them were nonsense. jsconfig.json only
  // ever included `**/*.js`, so the tests were outside it entirely. Three
  // layers that should have caught it, all independently absent.
  //
  // What it cost: 149 unawaited `WB.scan()` calls against 66 correct ones.
  // scan() is async and dynamically imports behavior modules, so
  //
  //     page.evaluate(() => { WB.scan(el); });   // returns before scan finishes
  //     await expect(el).toHaveClass(/x-help/);  // class="" — nothing attached
  //
  // expect() polls 5s, which hides it on an idle machine; under 8 workers the
  // import loses the race and `retries: 1` passed it warm. Reported as "flaky",
  // exit 0, gate green over a real defect. The incorrect form being the MAJORITY
  // is the tell — the correct ones were care, not an enforced rule.
  //
  // no-floating-promises is the ONLY thing that catches this. tsc does not, at
  // any strictness — verified. The rule needs type information, which is why
  // tsconfig.json now exists.
  //
  // Deliberately narrow: this rule set, on tests/**/*.ts only. Everything else
  // would drown the signal. See tsconfig.json for why strict is off.
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // The point of the whole exercise.
      '@typescript-eslint/no-floating-promises': 'error',
      // The inverse mistake: awaiting something that was never a promise. Cheap,
      // and it catches `await someSyncHelper()` reading as if it were async.
      '@typescript-eslint/await-thenable': 'error',

      // Core no-undef is wrong on TypeScript: the compiler already resolves
      // identifiers, and the rule cannot see type-only or ambient declarations,
      // so it reports every `Locator`, `Page`, and global.d.ts `WB` as undefined.
      // Off here is the standard typescript-eslint recommendation, not a waiver.
      'no-undef': 'off',
      // Same reason — the base rule mis-handles TS-only syntax (type imports,
      // parameter properties, overload signatures). Hand it to the TS-aware one.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
