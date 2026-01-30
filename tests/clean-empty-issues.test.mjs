import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import assert from 'assert';

function runUnlock(args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join('scripts','unlock-stale-locks.mjs'), ...args], { cwd, stdio: 'pipe' });
    let out = '';
    p.stdout.on('data', d => out += d.toString());
    p.stderr.on('data', d => out += d.toString());
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`exit ${code}: ${out}`)));
  });
}

async function writePending(tmpDataDir, issues) {
  await fs.mkdir(tmpDataDir, { recursive: true });
  const data = { issues };
  await fs.writeFile(path.join(tmpDataDir, 'pending-issues.json'), JSON.stringify(data, null, 2), 'utf8');
}

(async () => {
  const tmp = path.join(process.cwd(), 'tmp-clean-issues');
  const lockDir = path.join(tmp, 'Lock');
  const dataDir = path.join(tmp, 'data');
  await fs.rm(tmp, { recursive: true, force: true });

  const issues = [
    { id: '1', description: 'A valid issue' },
    { id: '2', description: '' },
    { id: '3' },
    { id: '4', description: 'Another valid' }
  ];
  await writePending(dataDir, issues);

  try {
    // Run clean with agent identity
    await runUnlock(['--clean-issues', `--pending-file=${path.join(dataDir,'pending-issues.json')}`, '--agent=TestAgent','--model=TestModel','--lock-dir='+lockDir], process.cwd());

    const updated = JSON.parse(await fs.readFile(path.join(dataDir,'pending-issues.json'),'utf8'));
    const ids = updated.issues.map(i => i.id);
    assert.deepStrictEqual(ids.sort(), ['1','4']);

    // Backup should exist
    const backups = await fs.readdir(dataDir);
    const hasBackup = backups.some(f => f.startsWith('backups')) || false;
    // check actual backup file existence
    const backupDir = path.join(dataDir,'backups');
    const files = await fs.readdir(backupDir);
    assert(files.length >= 1);

    // Log should have event
    const log = JSON.parse(await fs.readFile(path.join(lockDir,'unlock-log.json'),'utf8'));
    const ev = log.find(e => e.action === 'remove-empty-issues');
    assert(ev && ev.removedCount === 2);

    console.log('clean-empty-issues test passed');
    await fs.rm(tmp, { recursive: true, force: true });
  } catch (e) {
    console.error('clean-empty-issues test failed', e);
    process.exit(1);
  }
})();