const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../app/utils/placeholderImage.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
new Function('exports', compiled)(exportsObject);
const { generatePlaceholderImage } = exportsObject;

test('Русское название кодируется без ошибки btoa', () => {
  const url = generatePlaceholderImage('Игровая мышь');
  assert.match(decodeURIComponent(url.split(',')[1]), /ИМ/);
});
test('Одинаковое название даёт стабильную картинку', () => {
  assert.equal(generatePlaceholderImage('Игровая мышь'), generatePlaceholderImage('Игровая мышь'));
});
test('Специальные XML-символы экранируются', () => {
  const svg = decodeURIComponent(generatePlaceholderImage('< &').split(',')[1]);
  assert.match(svg, /&lt;&amp;/);
});
test('Пустое название и Unicode поддерживаются', () => {
  for (const name of ['', '🎮 Game', '日本語 商品']) assert.doesNotThrow(() => generatePlaceholderImage(name));
});
