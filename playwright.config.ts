import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'fs';

// tests/compliance/ has grown to 79 files (~2 min for a full run) — running
// the whole thing on every iteration wastes time when only one area is
// being worked on. Split into topic-based sub-projects (compliance-css,
// compliance-docs, etc.) so `npx playwright test --project=compliance-css`
// runs just that slice. The full `compliance` project (all 79 files,
// unchanged) stays as the pre-push gate — see package.json's
// test:compliance script. Categories live in a single JSON file so the
// project list and the file-to-category mapping can't drift apart.
const complianceCategories: Record<string, string[]> = JSON.parse(
  readFileSync('./scripts/tools/compliance-categories.json', 'utf-8')
);

/**
 * TIERED TEST EXECUTION WITH STOP GATES
 * ======================================
 * 
 * Gates are enforced by npm scripts using && chaining.
 * If any tier fails, subsequent tiers do NOT run.
 * 
 * npm run test:compliance  → Tier 1 only
 * npm run test:base        → Tier 1 → Tier 2 (stops if Tier 1 fails)
 * npm run test:behaviors   → Tier 1 → Tier 2 → Tier 3 (stops on any failure)
 * npm run test             → All tiers with gates
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ TIER 1: STATIC COMPLIANCE (no browser, no server)              │
 * │ Location: tests/compliance/                                     │
 * │ - Schema validation                                             │
 * │ - Source-schema compliance (JS matches schema)                  │
 * │ - CSS OOP compliance                                            │
 * │ - Test coverage compliance (test files match schema.test)       │
 * │                                                                 │
 * │ ❌ If ANY fail → STOP (no point testing in browser)            │
 * └─────────────────────────────────────────────────────────────────┘
 *                              ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ TIER 2: BASE BEHAVIOR TESTS (browser required)                 │
 * │ Location: tests/behaviors/ui/                                   │
 * │ - Base card rendering                                           │
 * │ - Core behavior initialization                                  │
 * │                                                                 │
 * │ ❌ If ANY fail → STOP                                          │
 * └─────────────────────────────────────────────────────────────────┘
 *                              ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ TIER 3: DECORATED BEHAVIORS (browser required)                 │
 * │ Location: tests/behaviors/                                      │
 * │ - Permutation compliance (full component tests)                 │
 * │ - Individual component tests                                    │
 * │ - Interaction tests                                             │
 * └─────────────────────────────────────────────────────────────────┘
 */

export default defineConfig({
  testDir: './tests',
  outputDir: './data/test-results',
  reporter: [
    ['./scripts/tools/test-reporter.ts'],
    ['list']
  ],
  
  // Fail fast option via env var
  maxFailures: process.env.FAIL_FAST === 'true' ? 1 : undefined,
  
  fullyParallel: true,
  workers: 8,
  retries: 1,
  timeout: 30000,
  
  expect: {
    timeout: 5000
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
  },
  
  // Web server - automatically starts before tests.
  // reuseExistingServer must be true even in CI: ci-tests.yml starts the
  // server itself (node server.js &) before invoking Playwright, so Playwright
  // must reuse it rather than trying to bind port 3000 a second time (which
  // fails with "port 3000 is already used"). When no server is running
  // (e.g. ci-compliance.yml), Playwright still starts one via `command`.
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 10000,
    // Never pop a browser when Playwright starts the dev server for tests.
    env: { WB_NO_OPEN: '1' },
  },
  
  projects: [
    // ═══════════════════════════════════════════════════════════════
    // TIER 1: STATIC COMPLIANCE
    // Pure file analysis - no browser, no server needed
    // Runs FAST (milliseconds per test)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'compliance',
      testDir: './tests/compliance',
      testMatch: '**/*.spec.ts',
      retries: 0,  // Static tests - no point retrying
    },

    // ═══════════════════════════════════════════════════════════════
    // COMPLIANCE SUB-PROJECTS — same 79 files as `compliance` above,
    // split by topic for fast iteration. Run e.g.:
    //   npx playwright test --project=compliance-css
    // Full `compliance` (all categories) is the pre-push-to-.io gate —
    // don't reach for it while iterating on one area.
    // ═══════════════════════════════════════════════════════════════
    ...Object.entries(complianceCategories).map(([category, files]) => ({
      name: `compliance-${category}`,
      testDir: './tests/compliance',
      testMatch: files,
      retries: 0,
    })),


    // ═══════════════════════════════════════════════════════════════
    // VIEWS: WB Views System Tests
    // Tests the custom element factory system
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'views',
      testDir: './tests/views',
      testMatch: '**/*.spec.ts',
    },
    
    // ═══════════════════════════════════════════════════════════════
    // TIER 2: BASE BEHAVIOR TESTS
    // Tests core functionality before testing variants
    // GATE: compliance must pass first (enforced by npm scripts)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'base',
      testDir: './tests',
      testMatch: [
        'cards/card.spec.ts',
        'behaviors/behaviors.spec.ts',
      ],
    },
    
    // ═══════════════════════════════════════════════════════════════
    // TIER 3: DECORATED BEHAVIORS
    // Full component testing - all variants, interactions, events
    // GATE: compliance + base must pass first (enforced by npm scripts)
    //
    // Auto-discovers all .spec.ts files in these directories:
    // - behaviors/ (all behavior tests)
    // - cards/ (card variant tests)
    // - components/ (component tests)
    // - pages/ (page integration tests)
    // - semantics/ (semantic rendering tests)
    // Plus root-level darkmode-standard.spec.ts
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'behaviors',
      testDir: './tests',
      testMatch: [
        'behaviors/behavior-verification.spec.ts',
        'behaviors/**/*.spec.ts',
        'cards/**/*.spec.ts',
        'components/**/*.spec.ts',
        'pages/**/*.spec.ts',
        'semantics/**/*.spec.ts',
        'demos/**/*.spec.ts',
        'darkmode-standard.spec.ts',
      ],
    },
    // ═══════════════════════════════════════════════════════════════
    // TIER 4: FUNCTIONAL TESTS
    // Schema-driven browser tests for user interactions
    // Reads test.functional from schemas and executes in Playwright
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'functional',
      testDir: './tests/behaviors',
      testMatch: ['functional-runner.spec.ts'],
    },
    
    // ═══════════════════════════════════════════════════════════════
    // TIER 5: REGRESSION TESTS
    // Tests for specific bug fixes
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'regression',
      testDir: './tests/regression',
      testMatch: '**/*.spec.ts',
    },
    
    // ═══════════════════════════════════════════════════════════════
    // INTEGRATION TESTS
    // Phase 2: Wizard validation, builder integration, end-to-end flows
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'integration',
      testDir: './tests/integration',
      testMatch: '**/*.spec.ts',
      // The components page hydrates 38 wb-demos (page-source fetch + WB.scan +
      // hljs each); under a full parallel run browsers are CPU-starved and the
      // default 30s timeout flakes. 60s absorbs the contention — the underlying
      // hydration latency is tracked as a performance issue.
      //
      // #269 follow-up: wb-demo.js now lazy-builds blocks via
      // IntersectionObserver (#312), which should make this stopgap
      // unnecessary — cold hydration measured ~1s steady-state. NOT yet
      // reverted to the 30s default: needs 3 consecutive clean integration
      // runs to confirm before removing the stopgap (issue's own acceptance
      // criteria), which hasn't been done yet.
      timeout: 60000,
    },
    
    // ═══════════════════════════════════════════════════════════════
    // SCHEMA VIEWER TESTS
    // Tests that all schemas render correctly in the schema viewer
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'schema-viewer',
      testDir: './tests',
      testMatch: 'schema-viewer.spec.ts',
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CROSS-BROWSER TESTING
    // Run critical tests on Firefox and Safari/WebKit
    // Use: npm run test:firefox, npm run test:webkit, npm run test:browsers
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'firefox',
      testDir: './tests',
      testMatch: [
        'cards/card.spec.ts',
        'behaviors/behaviors.spec.ts',
        'pages/all-components.spec.ts',
      ],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests',
      testMatch: [
        'cards/card.spec.ts',
        'behaviors/behaviors.spec.ts',
        'pages/all-components.spec.ts',
      ],
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      testDir: './tests',
      testMatch: [
        'cards/card.spec.ts',
        'behaviors/behaviors.spec.ts',
      ],
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      testDir: './tests',
      testMatch: [
        'cards/card.spec.ts',
        'behaviors/behaviors.spec.ts',
      ],
      use: { ...devices['iPhone 12'] },
    },
    
    // ═══════════════════════════════════════════════════════════════
    // MOBILE VALIDATION — Visual screenshots + layout checks
    // Run: npm run test:mobile-validation
    // Two devices: Pixel 5 (Android) + iPhone 12 (iOS)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'mobile-validation-pixel',
      testDir: './tests/mobile',
      testMatch: '**/*.spec.ts',
      retries: 0,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-validation-iphone',
      testDir: './tests/mobile',
      testMatch: '**/*.spec.ts',
      retries: 0,
      use: { ...devices['iPhone 12'] },
    },

    // ═══════════════════════════════════════════════════════════════
    // PERFORMANCE TESTS (optional)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'performance',
      testDir: './tests',
      // Was 'performance.spec.ts' -- a file that has never existed. The real
      // suite lives in tests/performance/*.spec.ts (load-time.spec.ts,
      // interaction.spec.ts, resources.spec.ts); this project silently
      // matched zero tests, so the "sub 2s" load-time gate has never
      // actually run under any npm script or CI job.
      testMatch: 'performance/**/*.spec.ts',
    },
  ],
});