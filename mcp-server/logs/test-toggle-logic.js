/**
 * Quick test for auto-refresh toggle logic
 * Run: node mcp-server/logs/test-toggle-logic.js
 */

// Simulate the toggle logic from log-viewer.html
let _autoRefreshId = null;
let refreshCount = 0;

function mockSetInterval(fn, ms) {
  const id = Math.random();
  console.log(`  [setInterval] Created interval ${id}`);
  // Simulate interval
  const intervalId = setInterval(() => {
    refreshCount++;
    console.log(`  [Interval ${id}] Tick #${refreshCount}`);
  }, ms);
  return intervalId;
}

function mockClearInterval(id) {
  console.log(`  [clearInterval] Cleared interval ${id}`);
  clearInterval(id);
}

// This is the exact logic from log-viewer.html
function toggleAutoRefresh() {
  if (_autoRefreshId !== null) {
    // Currently ON - turn OFF
    mockClearInterval(_autoRefreshId);
    _autoRefreshId = null;
    console.log('[Toggle] State: OFF');
    return 'off';
  } else {
    // Currently OFF - turn ON
    _autoRefreshId = mockSetInterval(() => {}, 500);
    console.log('[Toggle] State: ON');
    return 'on';
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
  console.log('=== Auto-Refresh Toggle Logic Tests ===\n');
  let passed = 0, failed = 0;
  
  function test(name, condition, msg) {
    if (condition) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}: ${msg}`);
      failed++;
    }
  }
  
  // Test 1: Initial state is OFF
  console.log('\n--- Test 1: Initial state ---');
  test('Initial state is OFF', _autoRefreshId === null, `Expected null, got ${_autoRefreshId}`);
  
  // Test 2: First toggle turns ON
  console.log('\n--- Test 2: Toggle to ON ---');
  let state = toggleAutoRefresh();
  test('First toggle returns "on"', state === 'on', `Expected "on", got "${state}"`);
  test('Interval ID is set', _autoRefreshId !== null, 'Expected interval ID to be set');
  
  // Test 3: Second toggle turns OFF
  console.log('\n--- Test 3: Toggle to OFF ---');
  state = toggleAutoRefresh();
  test('Second toggle returns "off"', state === 'off', `Expected "off", got "${state}"`);
  test('Interval ID is null', _autoRefreshId === null, `Expected null, got ${_autoRefreshId}`);
  
  // Test 4: No ticks when OFF
  console.log('\n--- Test 4: No ticks when OFF ---');
  const countBefore = refreshCount;
  await sleep(600);
  const countAfter = refreshCount;
  test('No ticks when OFF', countBefore === countAfter, `Count changed from ${countBefore} to ${countAfter}`);
  
  // Test 5: Ticks happen when ON
  console.log('\n--- Test 5: Ticks when ON ---');
  toggleAutoRefresh(); // ON
  const countStart = refreshCount;
  await sleep(1200);
  const countEnd = refreshCount;
  test('Ticks happen when ON', countEnd > countStart, `Count was ${countStart}, now ${countEnd}`);
  toggleAutoRefresh(); // OFF
  
  // Test 6: After OFF, no more ticks
  console.log('\n--- Test 6: No ticks after OFF ---');
  const countOffBefore = refreshCount;
  await sleep(600);
  const countOffAfter = refreshCount;
  test('No ticks after OFF', countOffBefore === countOffAfter, `Count changed from ${countOffBefore} to ${countOffAfter}`);
  
  // Test 7: Rapid toggling
  console.log('\n--- Test 7: Rapid toggle (10 times, should end OFF) ---');
  for (let i = 0; i < 10; i++) {
    toggleAutoRefresh();
  }
  test('After 10 toggles, state is OFF', _autoRefreshId === null, `Expected null, got ${_autoRefreshId}`);
  const countRapidBefore = refreshCount;
  await sleep(600);
  const countRapidAfter = refreshCount;
  test('No orphaned intervals', countRapidBefore === countRapidAfter, `Count changed from ${countRapidBefore} to ${countRapidAfter}`);
  
  // Summary
  console.log('\n=== Results ===');
  console.log(`${passed} passed, ${failed} failed`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
