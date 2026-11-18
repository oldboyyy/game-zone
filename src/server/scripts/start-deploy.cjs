const { spawnSync } = require('node:child_process');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
process.env.NODE_ENV = 'production';
if (process.env.RENDER_EXTERNAL_URL) {
  process.env.CLIENT_URL_PROD ||= process.env.RENDER_EXTERNAL_URL;
  process.env.ALLOWED_ORIGINS ||= process.env.RENDER_EXTERNAL_URL;
}
require('./check-production.cjs');
const migration = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
  stdio: 'inherit', env: process.env,
});
if (migration.status !== 0) process.exit(migration.status || 1);
require('../dist/server.js');
