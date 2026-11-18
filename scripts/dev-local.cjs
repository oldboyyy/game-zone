const { spawn } = require('node:child_process');
const path = require('node:path');
if (Number(process.versions.node.split('.')[0]) !== 22) {
  console.error('Для GameZone нужен Node.js 22. Запустите: npx --yes --package=node@22 -c "npm run dev"');
  process.exit(1);
}
const root = path.resolve(__dirname, '..');
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
const options = [
  ['сервер', 'src/server', [process.execPath, 'scripts/dev-local.cjs'], { PORT: '5001', CLIENT_URL_DEV: 'http://localhost:3000', ALLOWED_ORIGINS: 'http://localhost:3000' }],
  ['сайт', 'src/client', [process.execPath, 'node_modules/next/dist/bin/next', 'dev', '--port', '3000'], {
    NEXT_PUBLIC_DEMO_MODE: 'false', NEXT_PUBLIC_USE_DEMO_CATALOG: 'false',
    NEXT_PUBLIC_API_URL_DEV: 'http://localhost:5001/api/v1', NEXT_PUBLIC_SOCKET_URL: 'http://localhost:5001',
    NEXT_PUBLIC_STORE_CURRENCY: 'KZT',
  }],
];
console.log('GameZone: магазин http://localhost:3000 · API http://localhost:5001');
console.log('PostgreSQL и Redis должны быть запущены. Ctrl+C остановит оба процесса.');
for (const [label, dir, command, env] of options) {
  const child = spawn(command[0], command.slice(1), {
    cwd: path.join(root, dir), stdio: 'inherit', env: { ...process.env, ...env },
  });
  children.push(child);
  child.on('error', (error) => { console.error(label + ': ' + error.message); stop(1); });
  child.on('exit', (code, signal) => { if (!stopping) stop(code ?? (signal ? 1 : 0)); });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
