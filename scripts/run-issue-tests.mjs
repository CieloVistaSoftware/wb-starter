/**
 * Run Issue Tests and Update Log
 * ================================
 * Runs all issue tests and updates the issue-test-log.json with results.
 * 
 * Usage: node scripts/run-issue-tests.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const TEST_LOG_PATH = join(PROJECT_ROOT, 'data/issue-test-log.json');
const TEST_RESULTS_PATH = join(PROJECT_ROOT, 'data/issue-test-results.json');

/**
 * Run playwright tests for issues project
 */
async function runTests() {
  console.log('🧪 Running Issue Tests...\n');
  
  return new Promise((resolve, reject) => {
    const args = [
      'playwright', 'test',
      '--project=issues',
      '--workers=4',
      '--reporter=json',
      '--output', join(PROJECT_ROOT, 'data/test-results')
    ];
    
    const proc = spawn('npx', args, {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    proc.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr
      });
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse test results and update log
 */
function updateTestLog(testResult) {
  // Load existing log
  let log = { issues: [] };
  if (existsSync(TEST_LOG_PATH)) {
    log = JSON.parse(readFileSync(TEST_LOG_PATH, 'utf-8'));
  }
  
  // Update with run info
  log.lastTestRun = new Date().toISOString();
  log.lastExitCode = testResult.exitCode;
  log.testStatus = testResult.exitCode === 0 ? 'passed' : 'failed';
  
  // Parse stdout for test results if available
  const passMatch = testResult.stdout.match(/(\d+) passed/);
  const failMatch = testResult.stdout.match(/(\d+) failed/);
  const skipMatch = testResult.stdout.match(/(\d+) skipped/);
  
  log.results = {
    passed: passMatch ? parseInt(passMatch[1]) : 0,
    failed: failMatch ? parseInt(failMatch[1]) : 0,
    skipped: skipMatch ? parseInt(skipMatch[1]) : 0
  };
  
  // Save updated log
  writeFileSync(TEST_LOG_PATH, JSON.stringify(log, null, 2));
  console.log(`\n📝 Updated test log: ${TEST_LOG_PATH}`);
  
  return log;
}

/**
 * Main
 */
async function main() {
  console.log('📋 Issue Test Runner');
  console.log('====================\n');
  
  try {
    const result = await runTests();
    const log = updateTestLog(result);
    
    console.log('\n📊 Summary:');
    console.log(`   Status: ${log.testStatus}`);
    console.log(`   Passed: ${log.results.passed}`);
    console.log(`   Failed: ${log.results.failed}`);
    console.log(`   Skipped: ${log.results.skipped}`);
    
    process.exit(result.exitCode);
  } catch (err) {
    console.error('❌ Error running tests:', err);
    process.exit(1);
  }
}

main();
