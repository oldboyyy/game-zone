// Never print environment values: connection URLs and signing secrets are private.
const required = ['DATABASE_URL', 'REDIS_URL', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'SESSION_SECRET', 'COOKIE_SECRET', 'ALLOWED_ORIGINS', 'CLIENT_URL_PROD'];
const errors = [];
for (const key of required) if (!process.env[key]?.trim()) errors.push(`${key} is required`);
for (const key of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'SESSION_SECRET', 'COOKIE_SECRET']) {
  if (process.env[key] && process.env[key].length < 32) errors.push(`${key} must contain at least 32 characters`);
}
for (const [key, protocols] of [['DATABASE_URL', ['postgres:', 'postgresql:']], ['REDIS_URL', ['redis:', 'rediss:']], ['CLIENT_URL_PROD', ['https:', 'http:']]]) {
  if (!process.env[key]) continue;
  try { if (!protocols.includes(new URL(process.env[key]).protocol)) throw new Error(); }
  catch { errors.push(`${key} must be a valid URL with an appropriate protocol`); }
}
for (const origin of (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)) {
  try { const url = new URL(origin.trim()); if (!['https:', 'http:'].includes(url.protocol) || url.origin !== origin.trim()) throw new Error(); }
  catch { errors.push('ALLOWED_ORIGINS must contain comma-separated origins without paths'); }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Deployment configuration validated. No secret values printed.');
