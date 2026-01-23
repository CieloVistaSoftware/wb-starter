import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start ONLY the server, skip docs manifest
const serverPath = path.join(__dirname, '..', 'server.js');

const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3000' }
});

child.on('exit', code => {
  process.exit(code);
});
