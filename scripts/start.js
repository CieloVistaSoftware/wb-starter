/**
 * Clean Start Script
 * Kills any existing processes on ports 3000/3001 before starting server
 */
import { exec, spawn } from 'child_process';
import { platform } from 'os';

const PORTS = [3000, 3001];

async function killPort(port) {
  return new Promise((resolve) => {
    if (platform() === 'win32') {
      // Windows: find PID and kill
      exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
        if (stdout) {
          const lines = stdout.trim().split('\n');
          const pids = new Set();
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') pids.add(pid);
          });
          pids.forEach(pid => {
            exec(`taskkill /PID ${pid} /F`, () => {});
          });
        }
        setTimeout(resolve, 300);
      });
    } else {
      // Mac/Linux
      exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, () => {
        setTimeout(resolve, 300);
      });
    }
  });
}

async function start() {
  console.log('  Cleaning up ports...');
  
  for (const port of PORTS) {
    await killPort(port);
  }
  
  // Run docs manifest update
  await new Promise((resolve) => {
    exec('node scripts/update-docs-manifest.js', (err) => resolve());
  });
  
  console.log('  Starting server...\n');
  
  // Start the actual server
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

start();
