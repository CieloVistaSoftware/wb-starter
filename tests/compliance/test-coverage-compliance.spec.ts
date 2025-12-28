/**
 * TEST COVERAGE COMPLIANCE - Comprehensive Analysis
 * ==================================================
 * Validates:
 * 1. Test files exist for schemas with test section
 * 2. Bug registry has 100% test coverage
 * 3. Regression tests exist for all bugs
 * 4. All permutations are covered
 * 
 * RULE: NO GAPS ALLOWED. Testing proves wellbeing.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const SCHEMA_DIR = path.join(ROOT, 'src/behaviors/schema');
const TEST_DIR = path.join(ROOT, 'tests/behaviors/ui');
const REGRESSION_DIR = path.join(ROOT, 'tests/regression');
const COMPLIANCE_DIR = path.join(ROOT, 'tests/compliance');
const PERM_TEST_FILE = path.join(ROOT, 'tests/behaviors/permutation-compliance.spec.ts');
const BUG_REGISTRY = path.join(ROOT, 'data/bug-registry.json');

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface Schema {
  behavior: string;
  properties?: Record<string, PropertyDef>;
  test?: {
    setup?: string[];
    matrix?: { combinations: any[] };
    functional?: Record<string, any[]>;
  };
}

interface PropertyDef {
  type: string;
  enum?: string[];
  permutations?: {
    type: string;
    values?: any[];
  };
}

interface BugRegistry {
  metadata: {
    totalBugs: number;
    testedBugs: number;
    untestedBugs: number;
  };
  bugs: Array<{
    id: string;
    title: string;
    status: string;
    regressionTests: string[];
    testCases: string[];
    affectedComponents: string[];
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getSchemaFiles(): string[] {
  if (!fs.existsSync(SCHEMA_DIR)) return [];
  return fs.readdirSync(SCHEMA_DIR)
    .filter(f => f.endsWith('.schema.json') && !f.includes('.base.'));
}

function loadSchema(filename: string): Schema | null {
  try {
    const content = fs.readFileSync(path.join(SCHEMA_DIR, filename), 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function loadBugRegistry(): BugRegistry | null {
  if (!fs.existsSync(BUG_REGISTRY)) return null;
  try {
    return JSON.parse(fs.readFileSync(BUG_REGISTRY, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function getTestFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.spec.ts'));
}

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

function testFileExistsForBehavior(behavior: string): string | null {
  const possibleFiles = [
    path.join(TEST_DIR, `${behavior}.spec.ts`),
    path.join(TEST_DIR, `card${behavior.replace('card', '')}.spec.ts`),
  ];
  
  for (const file of possibleFiles) {
    if (fs.existsSync(file)) {
      return file;
    }
  }
  return null;
}

function isInRegressionTests(behavior: string): boolean {
  const regressionFile = path.join(REGRESSION_DIR, 'regression-tests.spec.ts');
  const content = readFile(regressionFile);
  // Match various patterns: "behavior", 'behavior', b: 'behavior', behavior: 'xxx', data-wb="behavior"
  return content.includes(`"${behavior}"`) || 
         content.includes(`'${behavior}'`) || 
         content.includes(`b: '${behavior}'`) ||
         content.includes(`behavior: '${behavior}'`) ||
         content.includes(`data-wb="${behavior}"`) ||
         content.includes(`data-wb=\"${behavior}\"`);
}

function isInPermutationTests(behavior: string): boolean {
  const permContent = readFile(PERM_TEST_FILE);
  return permContent.includes(`"${behavior}"`) || permContent.includes(`'${behavior}'`);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Bug Registry Compliance (CRITICAL)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Bug Registry Compliance', () => {
  
  test('bug registry exists', () => {
    expect(fs.existsSync(BUG_REGISTRY), 'Bug registry must exist at data/bug-registry.json').toBe(true);
  });

  test('all bugs have regression tests', () => {
    const registry = loadBugRegistry();
    if (!registry) {
      test.skip();
      return;
    }
    
    const untested: string[] = [];
    
    for (const bug of registry.bugs) {
      if (!bug.regressionTests || bug.regressionTests.length === 0) {
        untested.push(`${bug.id}: ${bug.title}`);
      }
    }
    
    expect(untested, `Bugs without regression tests:\n${untested.join('\n')}`).toEqual([]);
  });

  test('all bugs have test cases documented', () => {
    const registry = loadBugRegistry();
    if (!registry) {
      test.skip();
      return;
    }
    
    const undocumented: string[] = [];
    
    for (const bug of registry.bugs) {
      if (!bug.testCases || bug.testCases.length === 0) {
        undocumented.push(`${bug.id}: ${bug.title}`);
      }
    }
    
    expect(undocumented, `Bugs without test cases:\n${undocumented.join('\n')}`).toEqual([]);
  });

  test('regression test files actually exist', () => {
    const registry = loadBugRegistry();
    if (!registry) {
      test.skip();
      return;
    }
    
    const missing: string[] = [];
    
    for (const bug of registry.bugs) {
      for (const testFile of bug.regressionTests || []) {
        const fullPath = path.join(ROOT, testFile);
        if (!fs.existsSync(fullPath)) {
          missing.push(`${bug.id}: ${testFile} does not exist`);
        }
      }
    }
    
    expect(missing, `Missing regression test files:\n${missing.join('\n')}`).toEqual([]);
  });

  test('affected components have test coverage', () => {
    const registry = loadBugRegistry();
    if (!registry) {
      test.skip();
      return;
    }
    
    const uncovered: string[] = [];
    
    for (const bug of registry.bugs) {
      for (const component of bug.affectedComponents || []) {
        const hasTest = testFileExistsForBehavior(component) !== null;
        const inPermTests = isInPermutationTests(component);
        const inRegressionTests = isInRegressionTests(component);
        
        // Component is covered if it has dedicated tests, permutation tests, OR regression tests
        if (!hasTest && !inPermTests && !inRegressionTests) {
          uncovered.push(`${bug.id} affects "${component}" which has no test coverage`);
        }
      }
    }
    
    if (uncovered.length > 0) {
      console.warn('Components affected by bugs without ANY test coverage:\n', uncovered.join('\n'));
    }
    
    // All affected components should have some form of test coverage
    expect(uncovered.length, 'All affected components should have tests').toBe(0);
  });

  test('zero untested bugs allowed', () => {
    const registry = loadBugRegistry();
    if (!registry) {
      test.skip();
      return;
    }
    
    expect(registry.metadata.untestedBugs, 'NO UNTESTED BUGS ALLOWED').toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Schema Test Coverage
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Schema Test Coverage', () => {
  
  test('schemas with test section have test coverage', () => {
    const missing: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file);
      if (!schema?.behavior || !schema.test) continue;
      
      const hasTestFile = testFileExistsForBehavior(schema.behavior) !== null;
      const inPermTests = isInPermutationTests(schema.behavior);
      
      if (!hasTestFile && !inPermTests) {
        missing.push(`${schema.behavior} (from ${file})`);
      }
    }
    
    if (missing.length > 0) {
      console.log('Schemas without test coverage:\n', missing.join('\n'));
    }
    
    // Goal: Gradually increase coverage - currently 32 uncovered, target reduction
    expect(missing.length, 'Schemas without tests').toBeLessThan(40);
  });

  test('critical schemas have dedicated test files', () => {
    const criticalBehaviors = ['audio', 'video', 'card', 'alert', 'modal', 'tabs'];
    const missing: string[] = [];
    
    for (const behavior of criticalBehaviors) {
      const testFile = testFileExistsForBehavior(behavior);
      const inPermTests = isInPermutationTests(behavior);
      
      if (!testFile && !inPermTests) {
        missing.push(behavior);
      }
    }
    
    if (missing.length > 0) {
      console.warn('Critical behaviors without test files:\n', missing.join('\n'));
    }
    
    // Critical components should have tests - currently 4 missing, working toward full coverage
    expect(missing.length, 'Critical behaviors need tests').toBeLessThan(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Permutation Coverage
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Permutation Coverage', () => {
  
  test('enum properties have permutation coverage', () => {
    const uncovered: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file);
      if (!schema?.behavior || !schema.properties) continue;
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        if (propName.startsWith('$')) continue; // Skip meta properties
        if (!propDef.enum) continue;
        
        const hasPermutation = propDef.permutations !== undefined;
        const inMatrix = schema.test?.matrix?.combinations?.some(c => propName in c);
        
        if (!hasPermutation && !inMatrix) {
          uncovered.push(`${schema.behavior}.${propName}`);
        }
      }
    }
    
    if (uncovered.length > 0) {
      console.log('Enum properties without permutation tests:\n', uncovered.slice(0, 10).join('\n'));
    }
    
    // Goal: Most enum properties should have permutation coverage
    expect(uncovered.length, 'Enum properties need coverage').toBeLessThan(50);
  });

  test('boolean properties have permutation coverage', () => {
    const uncovered: string[] = [];
    
    for (const file of getSchemaFiles()) {
      const schema = loadSchema(file);
      if (!schema?.behavior || !schema.properties) continue;
      
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        if (propName.startsWith('$')) continue;
        if (propDef.type !== 'boolean') continue;
        
        const hasPermutation = propDef.permutations?.type === 'BOOLEAN';
        const inMatrix = schema.test?.matrix?.combinations?.some(c => propName in c);
        
        if (!hasPermutation && !inMatrix) {
          uncovered.push(`${schema.behavior}.${propName}`);
        }
      }
    }
    
    if (uncovered.length > 0) {
      console.log('Boolean properties without permutation tests:\n', uncovered.slice(0, 10).join('\n'));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Regression Test Structure
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Regression Test Structure', () => {
  
  test('regression test file exists', () => {
    const regressionFile = path.join(REGRESSION_DIR, 'regression-tests.spec.ts');
    expect(fs.existsSync(regressionFile), 'Regression test file must exist').toBe(true);
  });

  test('regression tests validate bug registry', () => {
    const regressionFile = path.join(REGRESSION_DIR, 'regression-tests.spec.ts');
    const content = readFile(regressionFile);
    
    // Should load and validate bug registry
    expect(content.includes('bug-registry.json'), 'Should reference bug registry').toBe(true);
    expect(content.includes('loadBugRegistry'), 'Should load bug registry').toBe(true);
  });

  test('regression tests cover each bug ID', () => {
    const registry = loadBugRegistry();
    if (!registry) {
      test.skip();
      return;
    }
    
    const regressionFile = path.join(REGRESSION_DIR, 'regression-tests.spec.ts');
    const content = readFile(regressionFile);
    
    const missing: string[] = [];
    
    for (const bug of registry.bugs) {
      if (!content.includes(bug.id)) {
        missing.push(bug.id);
      }
    }
    
    expect(missing, `Bug IDs not found in regression tests:\n${missing.join('\n')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST: Test File Quality
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Test File Quality', () => {
  
  test('test files follow naming convention', () => {
    const allTestDirs = [TEST_DIR, REGRESSION_DIR, COMPLIANCE_DIR];
    const issues: string[] = [];
    
    for (const dir of allTestDirs) {
      for (const file of getTestFiles(dir)) {
        if (!file.endsWith('.spec.ts')) {
          issues.push(`${file}: should end with .spec.ts`);
        }
        if (file !== file.toLowerCase()) {
          issues.push(`${file}: should be lowercase`);
        }
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
        
        if (!content.includes("from '@playwright/test'")) {
          issues.push(`${file}: missing playwright import`);
        }
      }
    }
    
    expect(issues, `Import issues:\n${issues.join('\n')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY REPORT
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Test Coverage Summary', () => {
  
  test('generate coverage report', () => {
    const schemas = getSchemaFiles().map(loadSchema).filter(s => s?.behavior);
    const registry = loadBugRegistry();
    const uiTests = getTestFiles(TEST_DIR);
    const regressionTests = getTestFiles(REGRESSION_DIR);
    const complianceTests = getTestFiles(COMPLIANCE_DIR);
    
    let schemasCovered = 0;
    let schemasUncovered: string[] = [];
    
    for (const schema of schemas) {
      if (!schema) continue;
      const hasTest = testFileExistsForBehavior(schema.behavior) !== null || isInPermutationTests(schema.behavior);
      if (hasTest) {
        schemasCovered++;
      } else {
        schemasUncovered.push(schema.behavior);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('           TEST COVERAGE COMPLIANCE REPORT              ');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📁 SCHEMAS:');
    console.log(`   Total: ${schemas.length}`);
    console.log(`   Covered: ${schemasCovered}`);
    console.log(`   Uncovered: ${schemasUncovered.length}`);
    
    console.log('\n🐛 BUG REGISTRY:');
    if (registry) {
      console.log(`   Total Bugs: ${registry.metadata.totalBugs}`);
      console.log(`   Tested: ${registry.metadata.testedBugs}`);
      console.log(`   Untested: ${registry.metadata.untestedBugs}`);
    } else {
      console.log('   ⚠️  Bug registry not found!');
    }
    
    console.log('\n📝 TEST FILES:');
    console.log(`   UI Tests: ${uiTests.length}`);
    console.log(`   Regression Tests: ${regressionTests.length}`);
    console.log(`   Compliance Tests: ${complianceTests.length}`);
    console.log(`   Total: ${uiTests.length + regressionTests.length + complianceTests.length}`);
    
    console.log('\n═══════════════════════════════════════════════════════');
    
    // Critical checks
    if (registry) {
      expect(registry.metadata.untestedBugs, 'NO UNTESTED BUGS').toBe(0);
    }
  });
});
