const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const script = path.join(__dirname, '../scripts/check-production.cjs');
const valid = {
  DATABASE_URL: 'postgresql://user:private-password@localhost/gamezone',
  REDIS_URL: 'redis://localhost:6379',
  ACCESS_TOKEN_SECRET: 'a'.repeat(32), REFRESH_TOKEN_SECRET: 'b'.repeat(32),
  SESSION_SECRET: 'c'.repeat(32), COOKIE_SECRET: 'd'.repeat(32),
  ALLOWED_ORIGINS: 'https://store.example.com,http://localhost:3000',
  CLIENT_URL_PROD: 'https://store.example.com',
};
test('deployment configuration rejects missing values without leaking secrets', () => {
  const result = spawnSync(process.execPath, [script], { env: { ...valid, SESSION_SECRET: '' }, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SESSION_SECRET is required/);
  assert.doesNotMatch(result.stderr, /private-password/);
});
test('deployment configuration accepts complete setup and rejects malformed origins', () => {
  assert.equal(spawnSync(process.execPath, [script], { env: valid }).status, 0);
  assert.equal(spawnSync(process.execPath, [script], { env: { ...valid, ALLOWED_ORIGINS: 'https://example.com/path' } }).status, 1);
});
