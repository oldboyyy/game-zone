// Export a clean working-tree snapshot without Git history, secrets, runtime logs or builds.
// Does not commit, push, delete or change the source workspace.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'game-zone-release-'));
const files = new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean));
let copied = 0;
for (const name of files) {
  const parts = name.split('/');
  const base = parts.at(-1);
  if (parts.some(p => ['.git', '.vscode', '.agents', '.codex', '.aws', '.playwright-mcp', 'node_modules', '.next', '.next-dev', 'dist'].includes(p))) continue;
  if ((base.startsWith('.env') && !base.endsWith('.example')) || /\.(log|dump|pem|key|tsbuildinfo)$/.test(base) || base === '.DS_Store') continue;
  const source = path.join(root, name);
  if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) continue;
  const target = path.join(destination, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  copied++;
}
console.log(JSON.stringify({ destination, files: copied, published: false }));
