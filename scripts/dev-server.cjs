const { spawn } = require('child_process');
const path = require('path');

const serverCwd = path.join(__dirname, '..', 'server');
const child = spawn('npm.cmd', ['run', 'dev'], {
  cwd: serverCwd,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
