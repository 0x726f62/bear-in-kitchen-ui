import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve('dist');
const html = (path) => readFileSync(join(root, path), 'utf8');

test('public routes render full HTML with Czech document language', () => {
  for (const path of ['index.html', 'about-me/index.html', 'tricks-and-tips/index.html', '404.html']) {
    const page = html(path);
    assert.match(page, /<html lang="cs"/);
    assert.match(page, /<main/);
    assert.match(page, /<h1/);
  }
});

test('draft recipes are only emitted in an explicit preview build', () => {
  const recipePath = 'recipe/ZcWqZjnIW81zafRQ41DG/index.html';
  if (process.env.INCLUDE_DRAFTS === 'true') {
    const page = html(recipePath);
    assert.match(page, /Salát se sýrem brie/);
    assert.match(page, /name="robots" content="noindex"/);
    assert.doesNotMatch(page, /application\/ld\+json/);
  } else {
    assert.equal(existsSync(join(root, recipePath)), false);
    assert.doesNotMatch(html('index.html'), /ZcWqZjnIW81zafRQ41DG/);
  }
});

test('production includes exactly the five published recipes', () => {
  if (process.env.INCLUDE_DRAFTS === 'true') return;
  const recipeRoot = join(root, 'recipe');
  const recipeDirectories = readdirSync(recipeRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
  assert.equal(recipeDirectories.length, 5);
  const homepage = html('index.html');
  for (const title of ['Tiramisu', 'Krutonky', 'Italské houbové rizoto', 'Špagety Carbonara', 'Čokoládové muffiny s višněmi']) {
    assert.match(homepage, new RegExp(title));
  }
  assert.match(homepage, /id="ingredient-select"/);
  assert.match(homepage, /data-ingredients="[^"]*vejce/);
});

test('generated local links and image sources resolve to build artifacts', () => {
  const files = readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html'));
  for (const file of files) {
    for (const match of html(file).matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
      const path = decodeURIComponent(match[1]);
      if (path.startsWith('//')) continue;
      const target = join(root, path.endsWith('/') ? `${path}index.html` : path);
      assert.equal(existsSync(target), true, `${file}: missing ${path}`);
    }
  }
});
