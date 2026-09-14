import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = existsSync(resolve('dist/client')) ? resolve('dist/client') : resolve('dist');
const html = (path) => readFileSync(join(root, path), 'utf8');

test('public routes render full HTML with Czech document language', () => {
  for (const path of ['about-me/index.html', 'tricks-and-tips/index.html', '404.html']) {
    const page = html(path);
    assert.match(page, /<html lang="cs"/);
    assert.match(page, /<main/);
    assert.match(page, /<h1/);
  }
});

test('database-backed catalog, recipes, login, editor and admin ship in the Worker', () => {
  assert.equal(existsSync(resolve('dist/server/entry.mjs')), true);
  assert.equal(existsSync(join(root, 'index.html')), false);
  assert.equal(existsSync(join(root, 'recipe')), false);
  const serverSource = readdirSync(resolve('dist/server'), { recursive: true })
    .filter(file => file.endsWith('.mjs'))
    .map(file => readFileSync(join(resolve('dist/server'), file), 'utf8'))
    .join('\n');
  assert.match(serverSource, /\/auth\/login/);
  assert.match(serverSource, /\/auth\/register/);
  assert.doesNotMatch(serverSource, /\/auth\/google/);
});

test('generated local links and image sources resolve to build artifacts', () => {
  const isServerRoute = (path) => path === '/' || path === '/login/' || path === '/editor/' || path === '/admin/' || path.startsWith('/recipe/');
  const files = readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html'));
  for (const file of files) {
    for (const match of html(file).matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
      const path = decodeURIComponent(match[1]);
      if (path.startsWith('//')) continue;
      if (isServerRoute(path)) continue;
      const target = join(root, path.endsWith('/') ? `${path}index.html` : path);
      assert.equal(existsSync(target), true, `${file}: missing ${path}`);
    }
  }
});
