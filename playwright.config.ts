import { defineConfig } from '@playwright/test';

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
    trace: 'on-first-retry',
  },
  
  // Web server - automatically starts before tests
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
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
      testDir: './tests/behaviors/ui',
      testMatch: [
        'card.spec.ts',
        'behaviors.spec.ts',
      ],
    },
    
    // ═══════════════════════════════════════════════════════════════
    // TIER 3: DECORATED BEHAVIORS
    // Full component testing - all variants, interactions, events
    // GATE: compliance + base must pass first (enforced by npm scripts)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'behaviors',
      testDir: './tests/behaviors',
      testMatch: [
        'behavior-validation.spec.ts',
        'builder-api.spec.ts',
        'builder-mkel.spec.ts',
        'permutation-compliance.spec.ts',
        'semantics-new.spec.ts',
        'semantics-code-scroll.spec.ts',
        'js-syntax-compliance.spec.ts',
        'ui/cardbutton.spec.ts',
        'ui/cardchip.spec.ts',
        'ui/cardhero.spec.ts',
        'ui/cardoverlay.spec.ts',
        'ui/cardportfolio.spec.ts',
        'ui/cardproduct.spec.ts',
        'ui/cardprogressbar.spec.ts',
        'ui/cardspinner.spec.ts',
        'ui/notes.spec.ts',
        'notes-updates.spec.ts',
        'ui/audio.spec.ts',
        'ui/feedback-visual.spec.ts',
        'ui/behavior-verification.spec.ts',
        'ui/builder-sidebar.spec.ts',
        'ui/figure.spec.ts',
        'behaviors-showcase.spec.ts',
        'pill-shortcut.spec.ts',
        'input-switch.spec.ts',
        'scrollalong.spec.ts',
        'header.spec.ts',
        'components-page.spec.ts',
        'global-attributes.spec.ts',
        'pce.spec.ts',
        'pce-demo.spec.ts',
      ],
      // Explicitly exclude deprecated files
      testIgnore: [
        '**/compliance.spec.ts',
        '**/schema-compliance.spec.ts',
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
    // TIER 6: PERFORMANCE TESTS
    // Tests for load time and runtime performance
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'performance',
      testDir: './tests/performance',
      testMatch: '**/*.spec.ts',
    },
  ],
});
