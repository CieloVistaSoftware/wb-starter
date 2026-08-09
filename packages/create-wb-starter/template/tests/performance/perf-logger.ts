import * as fs from 'fs';
import * as path from 'path';

const RESULTS_FILE = path.join(process.cwd(), 'data', 'performance-results.json');

export interface PerfResult {
  timestamp: string;
  category: 'load' | 'interaction' | 'resource';
  name: string;
  value: number;
  unit: string;
  threshold?: number;
}

export function logPerfResult(result: Omit<PerfResult, 'timestamp'>) {
  let data: PerfResult[] = [];
  
  // Ensure directory exists
  const dir = path.dirname(RESULTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Read existing data
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
      data = JSON.parse(content);
    } catch (e) {
      console.error('Error reading perf results:', e);
    }
  }

  // Add new result
  const entry: PerfResult = {
    timestamp: new Date().toISOString(),
    ...result
  };
  
  data.push(entry);

  // Keep only last 1000 entries to prevent infinite growth
  if (data.length > 1000) {
    data = data.slice(-1000);
  }

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2));
}
