import { spawnSync } from 'child_process';

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  return r.status || 0;
}

const rawArgs = process.argv.slice(2);
const isFull = rawArgs.includes('--full') || rawArgs.includes('--ordered') || process.env.CI === 'true';
// forward any extra args (except the control flags) to the underlying test runner
const forwardArgs = rawArgs.filter(a => a !== '--full' && a !== '--ordered');

if (isFull) {
  // Ordered sequence (fail-fast)
  const seq = [
    ['npm', ['run', 'test:compliance', '--', ...forwardArgs]],
    ['npm', ['run', 'test:fast', '--', ...forwardArgs]],
    ['npx', ['playwright', 'test', '--project=base', ...forwardArgs]],
    ['npx', ['playwright', 'test', '--project=behaviors', ...forwardArgs]],
    ['npx', ['playwright', 'test', '--project=regression', ...forwardArgs]]
  ];

  for (const [cmd, args] of seq) {
    const code = run(cmd, args);
    if (code !== 0) process.exit(code);
  }
  process.exit(0);
} else {
  // Fast default for developer feedback
  const code = run('npm', ['run', 'test:fast', '--', ...forwardArgs]);
  process.exit(code);
}
