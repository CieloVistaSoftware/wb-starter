import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import assert from 'assert';

async function writeLock(dir, name, timestamp) {
  const content = `Locked by: Test User\nTimestamp: ${timestamp}\nPurpose: test lock`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), content, 'utf8');
}

function runUnlock(args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join('scripts','unlock-stale-locks.mjs'), ...args], { cwd, stdio: 'pipe' });
    let out = '';
    p.stdout.on('data', d => out += d.toString());
    p.stderr.on('data', d => out += d.toString());
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`exit ${code}: ${out}`)));
  });
}

(async () => {
  const tmpDir = path.join(process.cwd(), 'tmp-lock-test');
  const lockDir = path.join(tmpDir, 'Lock');
  await fs.rm(tmpDir, { recursive: true, force: true });
  const oldTs = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(); // 2 hours ago
  await writeLock(lockDir, 'LOCKED-test-1.md', oldTs);

  try {
    // Dry run should not remove
    await runUnlock(['--hours=1','--lock-dir='+lockDir,'--dry','--agent=TestAgent','--model=TestModel'], process.cwd());
    const exists1 = await fs.readFile(path.join(lockDir,'LOCKED-test-1.md'),'utf8');
    assert(exists1.includes('Locked by'));

    // Run real release
    await runUnlock(['--hours=1','--lock-dir='+lockDir,'--agent=TestAgent','--model=TestModel'], process.cwd());
    // Original should be gone
    let exists=false;
    try { await fs.access(path.join(lockDir,'LOCKED-test-1.md')); exists=true;} catch(e){ exists=false; }
    assert(!exists, 'lock file should be removed');
    const released = await fs.readFile(path.join(lockDir,'released','RELEASED-LOCKED-test-1.md'),'utf8');
    assert(released.includes('LOCK RELEASED'));
    const log = JSON.parse(await fs.readFile(path.join(lockDir,'unlock-log.json'),'utf8'));
    assert(log.length >= 1);
    console.log('unlock-stale-locks test passed');
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch (e) {
    console.error('unlock test failed', e);
    process.exit(1);
  }
})();