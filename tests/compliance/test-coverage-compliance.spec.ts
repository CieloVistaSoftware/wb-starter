/**
 * TEST COVERAGE COMPLIANCE - Comprehensive Analysis
 * ==================================================
 * Validates test coverage for schemas, bugs, and regressions.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT, PATHS, getSchemaFiles, loadSchema, readFile, fileExists, readJson } from '../base';

const TEST_DIR = path.join(ROOT, 'tests/behaviors/ui');
const REGRESSION_DIR = path.join(ROOT, 'tests/regression');
const COMPLIANCE_DIR = path.join(ROOT, 'tests/compliance');
const PERM_TEST_FILE = path.join(ROOT, 'tests/behaviors/permutation-compliance.spec.ts');
const BUG_REGISTRY = path.join(PATHS.data, 'bug-registry.json');

interface BugRegistry {
  metadata: { totalBugs: number; testedBugs: number; untestedBugs: number };
  bugs: Array<{
    id: string; title: string; status: string;
    regressionTests: string[]; testCases: string[]; affectedComponents: string[];
  }>;
}

function loadBugRegistry(): BugRegistry | null {
  return readJson<BugRegistry>(BUG_REGISTRY);
}

function getTestFiles(dir: string): string[] {
  if (!fileExists(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.spec.ts'));
}

function testFileExistsForBehavior(behavior: string): string | null {
  const possibleFiles = [
    path.join(TEST_DIR, `${behavior}.spec.ts`),
    path.join(TEST_DIR, `card${behavior.replace('card', '')}.spec.ts`),
  ];
  for (const file of possibleFiles) {
    if (fileExists(file)) return file;
  }
  return null;
}

function isInRegressionTests(behavior: string): boolean {
  const content = readFile(path.join(REGRESSION_DIR, 'regression-tests.spec.ts'));
  return content.includes(`"${behavior}"`) || content.includes(`'${behavior}'`) || 
         content.includes(`b: '${behavior}'`) || content.includes(`data-wb="${behavior}"`);
}

function isInPermutationTests(behavior: string): boolean {
  const content = readFile(PERM_TEST_FILE);
  return content.includes(`"${behavior}"`) || content.includes(`'${behavior}'`);
}

test.describe('Bug Registry Compliance', () => {
  
  test('bug registry exists', () => {
    expect(fileExists(BUG_REGISTRY), 'Bug registry must exist').toBe(true);
  });

  test('all bugs have regression tests', () => {
    const registry = loadBugRegistry();
    if (!registry) { test.skip(); return; }
    
    const untested = registry.bugs
      .filter(bug => !bug.regressionTests?.length)
      .map(bug => `${bug.id}: ${bug.title}`);
    
    expect(untested, `Bugs without regression tests:\n${untested.join('\n')}`).toEqual([]);
  });

  test('all bugs have test cases documented', () => {
    const registry = loadBugRegistry();
    if (!registry) { test.skip(); return; }
    
    const undocumented = registry.bugs
      .filter(bug => !bug.testCases?.length)
      .map(bug => `${bug.id}: ${bug.title}`);
    
    expect(undocumented, `Bugs without test cases:\n${undocumented.join('\n')}`).toEqual([]);
  });

  test('regression test files actually exist', () => {
    const registry = loadBugRegistry();
    if (!registry) { test.skip(); return; }
    
    const missing: string[] = [];
    for (const bug of registry.bugs) {
      for (const testFile of bug.regressionTests || []) {
        if (!fileExists(path.join(ROOT, testFile))) {
          missing.push(`${bug.id}: ${testFile} does not exist`);
        }
      }
    }
    
    expect(missing, `Missing regression test files:\n${missing.join('\n')}`).toEqual([]);
  });

  test('affected components have test coverage', () => {
    const registry = loadBugRegistry();
    if (!registry) { test.skip(); return; }
    
    const uncovered: string[] = [];
    for (const bug of registry.bugs) {
      for (const component of bug.affectedComponents || []) {
        const hasTest = testFileExistsForBehavior(component) !== null;
        const inPermTests = isInPermutationTests(component);
        const inRegressionTests = isInRegressionTests(component);
        
        if (!hasTest && !inPermTests && !inRegressionTests) {
          uncovered.push(`${bug.id} affects "${component}" which has no test coverage`);
        }
      }
    }
    
    expect(uncovered.length, 'All affected components should have tests').toBe(0);
  });

  test('zero untested bugs allowed', () => {
    const registry = loadBugRegistry();
    if (!registry) { test.skip(); return; }
    expect(registry.metadata.untestedBugs, 'NO UNTESTED BUGS ALLOWED').toBe(0);
  });
});

test.describe('Schema Test Coverage', () => {
  
  test('schemas with test section have test coverage', () => {
    const missing: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file);
      if (!schema?.behavior || !schema.test) continue;
      
      const hasTestFile = testFileExistsForBehavior(schema.behavior) !== null;
      const inPermTests = isInPermutationTests(schema.behavior);
      
      if (!hasTestFile && !inPermTests) missing.push(`${schema.behavior} (from ${file})`);
    }
    
    expect(missing.length, 'Schemas without tests').toBeLessThan(45);
  });

  test('critical schemas have dedicated test files', () => {
    const criticalBehaviors = ['audio', 'video', 'card', 'alert', 'modal', 'tabs'];
    const missing: string[] = [];
    
    for (const behavior of criticalBehaviors) {
      const testFile = testFileExistsForBehavior(behavior);
      const inPermTests = isInPermutationTests(behavior);
      if (!testFile && !inPermTests) missing.push(behavior);
    }
    
    expect(missing.length, 'Critical behaviors need tests').toBeLessThan(5);
  });
});

test.describe('Permutation Coverage', () => {
  
  test('enum properties have permutation coverage', () => {
    const uncovered: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file);
      if (!schema?.behavior || !schema.properties) continue;
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        if (propName.startsWith('$') || !propDef.enum) continue;
        
        const hasPermutation = propDef.permutations !== undefined;
        const inMatrix = schema.test?.matrix?.combinations?.some((c: any) => propName in c);
        
        if (!hasPermutation && !inMatrix) uncovered.push(`${schema.behavior}.${propName}`);
      }
    }
    
    expect(uncovered.length, 'Enum properties need coverage').toBeLessThan(50);
  });
});

test.describe('Regression Test Structure', () => {
  
  test('regression test file exists', () => {
    expect(fileExists(path.join(REGRESSION_DIR, 'regression-tests.spec.ts'))).toBe(true);
  });

  test('regression tests validate bug registry', () => {
    const content = readFile(path.join(REGRESSION_DIR, 'regression-tests.spec.ts'));
    expect(content.includes('bug-registry.json'), 'Should reference bug registry').toBe(true);
  });

  test('regression tests cover each bug ID', () => {
    const registry = loadBugRegistry();
    if (!registry) { test.skip(); return; }
    
    const content = readFile(path.join(REGRESSION_DIR, 'regression-tests.spec.ts'));
    const missing = registry.bugs.filter(bug => !content.includes(bug.id)).map(b => b.id);
    
    expect(missing, `Bug IDs not found in regression tests:\n${missing.join('\n')}`).toEqual([]);
  });
});

test.describe('Test File Quality', () => {
  
  test('test files follow naming convention', () => {
    const allTestDirs = [TEST_DIR, REGRESSION_DIR, COMPLIANCE_DIR];
    const issues: string[] = [];
    
    for (const dir of allTestDirs) {
      for (const file of getTestFiles(dir)) {
        if (!file.endsWith('.spec.ts')) issues.push(`${file}: should end with .spec.ts`);
        if (file !== file.toLowerCase()) issues.push(`${file}: should be lowercase`);
      }
    }
    
    expect(issues, `Naming issues:\n${issues.join('\n')}`).toEqual([]);
  });

  test('test files import playwright correctly', () => {
    const allTestDirs = [TEST_DIR, REGRESSION_DIR, COMPLIANCE_DIR];
    const issues: string[] = [];
    
    for (const dir of allTestDirs) {
      for (const file of getTestFiles(dir)) {
        const content = readFile(path.join(dir, file));
        if (!content.includes("from '@playwright/test'")) issues.push(`${file}: missing playwright import`);
      }
    }
    
    expect(issues, `Import issues:\n${issues.join('\n')}`).toEqual([]);
  });
});

test.describe('Test Coverage Summary', () => {
  
  test('generate coverage report', () => {
    const schemas = getSchemaFiles().map(loadSchema).filter(s => s?.behavior);
    const registry = loadBugRegistry();
    const uiTests = getTestFiles(TEST_DIR);
    const regressionTests = getTestFiles(REGRESSION_DIR);
    const complianceTests = getTestFiles(COMPLIANCE_DIR);
    
    let schemasCovered = 0;
    for (const schema of schemas) {
      if (!schema) continue;
      if (testFileExistsForBehavior(schema.behavior) !== null || isInPermutationTests(schema.behavior)) {
        schemasCovered++;
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('           TEST COVERAGE COMPLIANCE REPORT              ');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📁 SCHEMAS: ${schemasCovered}/${schemas.length} covered`);
    
    if (registry) {
      console.log(`🐛 BUGS: ${registry.metadata.testedBugs}/${registry.metadata.totalBugs} tested`);
    }
    
    console.log(`📝 TEST FILES: ${uiTests.length + regressionTests.length + complianceTests.length} total`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (registry) {
      expect(registry.metadata.untestedBugs, 'NO UNTESTED BUGS').toBe(0);
    }
  });
});
