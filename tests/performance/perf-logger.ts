import * as fs from 'fs';
import * as path from 'path';

/**
 * #1433: one append-only file per worker process, one JSON line per result.
 *
 * This used to read data/performance-results.json, push, and write the whole
 * array back. Two workers doing that at once interleaved their writes, and the
 * file came back as invalid JSON ("Unexpected non-whitespace character after
 * JSON at position 26280"). It was also a TRACKED file, so every perf run left
 * the checkout dirty. Appending a line to a file only this process writes
 * cannot corrupt anything, and data/test-results/ is not tracked.
 *
 * public/performance-dashboard.html reads them through server.js's
 * /api/performance-results, merged with the frozen history in
 * data/performance-results.json.
 */
export const RESULTS_DIR = path.join(process.cwd(), 'data', 'test-results', 'performance');

export interface PerfResult {
  timestamp: string;
  category: 'load' | 'interaction' | 'resource';
  name: string;
  value: number;
  unit: string;
  threshold?: number;
}

export function logPerfResult(result: Omit<PerfResult, 'timestamp'>) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const entry: PerfResult = { timestamp: new Date().toISOString(), ...result };
  fs.appendFileSync(path.join(RESULTS_DIR, `${process.pid}.jsonl`), JSON.stringify(entry) + '\n');
}
