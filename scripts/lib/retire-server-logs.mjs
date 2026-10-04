/**
 * Retention for data/test-server-logs/ (#1130).
 *
 * #1074 made every test run keep its dev-server output, one file per run --
 * deliberately: the logs are the evidence. Nothing retired them, so the folder
 * grew without limit (measured 2026-10-04: 128 logs, 136 MB in one checkout).
 *
 * THE POLICY, and the reason it is this one: logs are never deleted (John's
 * rule). A log older than RETIRE_AFTER_DAYS is COMPRESSED in place --
 * `run.log` becomes `run.log.gz` beside it, byte-for-byte recoverable with any
 * gunzip -- and the original is removed only after the compressed copy has
 * been read back and matched. Text logs compress about 10:1, so the folder
 * stays readable and small without one line of evidence being lost.
 *
 *   - Recent logs (younger than RETIRE_AFTER_DAYS) stay plain text, so the
 *     run anyone is debugging today is still a plain `cat` away.
 *   - A log that fails to compress, or whose round-trip does not match, is
 *     left exactly as it was and reported.
 *   - Nothing here deletes a .gz, and nothing touches a file that is not
 *     `*.log`.
 *
 * Runs at the start of every scripts/test-async.mjs run, which prints the
 * one-line summary this returns -- so the run says what it did.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';

export const RETIRE_AFTER_DAYS = 7;

/**
 * Compress every `*.log` in `dir` last modified more than `days` ago.
 * Returns what it did; never throws for a single bad file.
 */
export function retireServerLogs(dir, { days = RETIRE_AFTER_DAYS, now = Date.now() } = {}) {
  const result = { compressed: [], kept: [], failed: [], bytesBefore: 0, bytesAfter: 0 };
  if (!existsSync(dir)) return result;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.log')) continue;
    const file = join(dir, name);
    try {
      const st = statSync(file);
      if (!st.isFile() || st.mtimeMs >= cutoff) { result.kept.push(name); continue; }
      const gz = file + '.gz';
      if (existsSync(gz)) { result.failed.push(`${name}: ${name}.gz already exists, left both as they are`); continue; }
      const original = readFileSync(file);
      writeFileSync(gz, gzipSync(original, { level: 9 }));
      if (!gunzipSync(readFileSync(gz)).equals(original)) {
        unlinkSync(gz); // our own copy, which did not match; the original is untouched
        result.failed.push(`${name}: compressed copy did not match, original kept`);
        continue;
      }
      unlinkSync(file);
      result.compressed.push(name);
      result.bytesBefore += original.length;
      result.bytesAfter += statSync(gz).size;
    } catch (err) {
      result.failed.push(`${name}: ${err && err.message ? err.message : err}`);
    }
  }
  return result;
}

/** One line for the run's output: what was retired, and anything left alone. */
export function describeRetirement(r, days = RETIRE_AFTER_DAYS) {
  const mb = (n) => (n / 1048576).toFixed(1);
  const head = r.compressed.length
    ? `server logs: compressed ${r.compressed.length} older than ${days} days (${mb(r.bytesBefore)} MB -> ${mb(r.bytesAfter)} MB, kept as .log.gz)`
    : `server logs: nothing older than ${days} days to compress`;
  return r.failed.length ? `${head}; left as-is: ${r.failed.join('; ')}` : head;
}
