// Локальные секреты живут только в процессе и меняются при перезапуске.
require('dotenv').config({ quiet: true });
const { randomBytes } = require('node:crypto');
const { spawn } = require('node:child_process');
const env = { ...process.env, NODE_ENV: 'development' };
const defaults = {
  DATABASE_URL: 'postgresql://adi@localhost:5432/gamezone_dev',
  REDIS_URL: 'redis://localhost:6379', PORT: '5001',
  CLIENT_URL_DEV: 'http://localhost:3000', ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3001',
};
for (const [key, value] of Object.entries(defaults)) if (!env[key]) env[key] = value;
for (const key of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'SESSION_SECRET', 'COOKIE_SECRET']) {
  if (!env[key]) env[key] = randomBytes(32).toString('hex');
}
const child = spawn('npm', ['run', 'dev'], { env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 0; });
