import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { matchesRecipe } from '../src/lib/search.mjs';

test('Czech search ignores accents, case and extra whitespace', () => {
  assert.equal(matchesRecipe('Tvarohové větrné mlýny', 'Sladké', '  MLYNY tvarohove ', ''), true);
});
test('category and all search terms must match together', () => {
  assert.equal(matchesRecipe('Jahodová bublanina', 'Sladké', 'jahodova', 'Sladké'), true);
  assert.equal(matchesRecipe('Jahodová bublanina', 'Sladké', 'jahodova', 'Polévky'), false);
  assert.equal(matchesRecipe('Jahodová bublanina', 'Sladké', 'jahodova polevka', ''), false);
});
test('clearing filters restores all recipes', () => {
  assert.equal(matchesRecipe('Jahodová bublanina', 'Sladké', '', ''), true);
});
test('ingredient filter requires every selected canonical ingredient', () => {
  const recipeIngredients = ['mouka', 'vejce', 'cukr'];
  assert.equal(matchesRecipe('Bublanina', 'Sladké', '', '', recipeIngredients, ['vejce', 'mouka']), true);
  assert.equal(matchesRecipe('Bublanina', 'Sladké', '', '', recipeIngredients, ['vejce', 'maslo']), false);
});
test('every recipe ingredient points to the canonical catalog', () => {
  const catalog = JSON.parse(readFileSync('src/data/ingredients.json', 'utf8'));
  const ids = new Set(catalog.map(ingredient => ingredient.id));
  for (const file of readdirSync('src/content/recipes').filter(name => name.endsWith('.json'))) {
    const recipe = JSON.parse(readFileSync(`src/content/recipes/${file}`, 'utf8'));
    for (const ingredient of recipe.ingredients) {
      assert.equal(ids.has(ingredient.ingredientId), true, `${file}: unknown ingredient ${ingredient.ingredientId}`);
    }
  }
});
