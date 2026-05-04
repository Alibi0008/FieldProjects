const { spawn } = require('child_process');
const path = require('path');

const rootCwd = path.join(__dirname, '..');
const serverCwd = path.join(rootCwd, 'server');

const children = [
  spawn('npm.cmd', ['run', 'dev'], {
    cwd: rootCwd,
    stdio: 'inherit',
    shell: true,
  }),
  spawn('npm.cmd', ['run', 'dev'], {
    cwd: serverCwd,
    stdio: 'inherit',
    shell: true,
  }),
];

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

let exited = false;
for (const child of children) {
  child.on('exit', (code) => {
    if (!exited) {
      exited = true;
      shutdown();
      process.exit(code ?? 0);
    }
  });
}
