#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { statSync } from 'fs';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { hours: 24, lockDir: 'Lock', dry: false, agent: process.env.UNLOCK_AGENT_NAME || '', model: process.env.UNLOCK_AGENT_MODEL || '', cleanIssues: false, pendingFile: 'data/pending-issues.json' };
  args.forEach((a, i) => {
    if (a.startsWith('--hours=')) opts.hours = Number(a.split('=')[1]);
    if (a.startsWith('--lock-dir=')) opts.lockDir = a.split('=')[1];
    if (a === '--dry') opts.dry = true;
    if (a.startsWith('--agent=')) opts.agent = a.split('=')[1];
    if (a.startsWith('--model=')) opts.model = a.split('=')[1];
    if (a === '--clean-issues') opts.cleanIssues = true;
    if (a.startsWith('--pending-file=')) opts.pendingFile = a.split('=')[1];
    if (a === '--help') {
      console.log('Usage: node scripts/unlock-stale-locks.mjs [--hours=24] [--lock-dir=Lock] [--dry] [--agent="Name"] [--model="Model"] [--clean-issues] [--pending-file=path]');
      process.exit(0);
    }
  });
  return opts;
}

async function readLockFileTimestamp(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const match = content.match(/Timestamp:\s*(.+)/);
    if (match) {
      const t = new Date(match[1].trim());
      if (!isNaN(t)) return t;
    }
  } catch (e) {}
  // fallback to mtime
  try { return statSync(filePath).mtime; } catch (e) { return null; }
}

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch(e){}
}

async function appendUnlockLog(lockDir, event) {
  const logPath = path.join(lockDir, 'unlock-log.json');
  let logs = [];
  try {
    const text = await fs.readFile(logPath, 'utf8');
    logs = JSON.parse(text);
  } catch (e) { logs = []; }
  logs.push(event);
  await fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf8');
}

/**
 * Clean pending issues file by removing entries missing a non-empty description
 * - Backs up original file to data/backups/pending-issues-backup-<ts>.json
 * - Appends an event to Lock/unlock-log.json for audit
 */
async function cleanPendingIssues(pendingFile, opts) {
  try {
    const fpath = path.resolve(pendingFile);
    const text = await fs.readFile(fpath, 'utf8');
    const data = JSON.parse(text);
    if (!Array.isArray(data.issues)) {
      console.warn('pending file does not contain an issues array, skipping');
      return;
    }
    const origCount = data.issues.length;
    const removed = data.issues.filter(i => !i.description || String(i.description).trim() === '');
    if (removed.length === 0) {
      console.log('No empty-description issues found');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    const backupDir = path.join(path.dirname(fpath),'backups');
    await ensureDir(backupDir);
    const backupPath = path.join(backupDir, `pending-issues-backup-${timestamp}.json`);
    await fs.writeFile(backupPath, text, 'utf8');

    const kept = data.issues.filter(i => i.description && String(i.description).trim() !== '');
    const newData = { ...data, issues: kept };
    if (!opts.dry) {
      await fs.writeFile(fpath, JSON.stringify(newData, null, 2), 'utf8');
    }

    // Audit log
    const event = {
      action: 'remove-empty-issues',
      removedCount: removed.length,
      removedIds: removed.map(i => i.id || null),
      backup: backupPath,
      timestamp: new Date().toISOString(),
      runBy: opts.agent || 'unlock-stale-locks',
      model: opts.model || ''
    };
    await appendUnlockLog(opts.lockDir, event);
    console.log(`Removed ${removed.length} issues lacking descriptions (backup: ${backupPath})`);
  } catch (e) {
    console.warn('Error cleaning pending issues:', e.message || e);
  }
}

async function releaseLock(filePath, opts, reason='stale-unlock') {
  const dir = opts.lockDir;
  const base = path.basename(filePath);
  const releasedDir = path.join(dir, 'released');
  await ensureDir(releasedDir);

  const content = await fs.readFile(filePath, 'utf8');
  const now = new Date().toISOString();
  const releaseNote = `\n\nLOCK RELEASED\nReleased: ${now}\nReleased by: ${opts.agent || 'unlock-stale-locks'}\nModel: ${opts.model || ''}\nReason: ${reason}\n`;
  const newContent = content + releaseNote;
  const dest = path.join(releasedDir, `RELEASED-${base}`);
  await fs.writeFile(dest, newContent, 'utf8');
  await fs.unlink(filePath);

  // Log event
  await appendUnlockLog(dir, { file: base, releasedAt: now, releasedBy: opts.agent || 'unlock-stale-locks', model: opts.model || '', reason });
  console.log(`Released ${base} -> ${path.relative(process.cwd(), dest)}`);
}

(async function main(){
  const opts = parseArgs();
  const thresholdMs = (opts.hours || 24) * 60 * 60 * 1000;
  const dir = opts.lockDir;

  console.log(`Scanning ${dir} for stale locks older than ${opts.hours}h${opts.dry ? ' (dry-run)' : ''}`);

  // Ensure the lock directory exists (idempotent) so tests and runs are deterministic
  try {
    await ensureDir(dir);
  } catch (e) {
    console.error('Could not create lock directory:', e);
    process.exit(1);
  }

  // Ensure unlock-log exists (initialize to []) to make audit consistent
  const logPath = path.join(dir, 'unlock-log.json');
  try {
    await fs.access(logPath);
  } catch (e) {
    // create if missing
    try { await fs.writeFile(logPath, '[]', 'utf8'); } catch (w) { console.warn('Could not initialize unlock-log.json', w); }
  }

  const files = await fs.readdir(dir);
  const locked = files.filter(f => f.startsWith('LOCKED-') && f.endsWith('.md'));
  for (const f of locked) {
    const fp = path.join(dir, f);
    const ts = await readLockFileTimestamp(fp);
    if (!ts) {
      console.warn(`Could not determine timestamp for ${f}, skipping`);
      continue;
    }
    const age = Date.now() - ts.getTime();
    if (age > thresholdMs) {
      console.log(`Stale: ${f} (age ${(age/3600000).toFixed(2)}h)`);
      if (opts.dry) continue;
      if (!opts.agent) {
        console.warn('No agent identity supplied (--agent or UNLOCK_AGENT_NAME); refusing to release unless --agent is provided');
        continue;
      }
      await releaseLock(fp, opts);
    }
  }

  // Optionally clean pending issues if requested
  if (opts.cleanIssues) {
    if (!opts.pendingFile) {
      console.warn('No pendingFile specified, skipping cleanIssues');
    } else {
      if (!opts.agent) {
        console.warn('Cleaning issues requires an agent identity (--agent). Skipping.');
      } else {
        await cleanPendingIssues(opts.pendingFile, opts);
      }
    }
  }

  console.log('Done.');
})();
