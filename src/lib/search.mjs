/** @param {string} value */
export function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('cs').trim();
}

/**
 * @param {string} text
 * @param {string} recipeCategory
 * @param {string} query
 * @param {string} category
 * @param {string[]} recipeIngredients
 * @param {string[]} selectedIngredients
 */
export function matchesRecipe(text, recipeCategory, query, category, recipeIngredients = [], selectedIngredients = []) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const searchable = normalizeSearch(text);
  const availableIngredients = new Set(recipeIngredients);
  return (!category || recipeCategory === category)
    && terms.every((term) => searchable.includes(term))
    && selectedIngredients.every((ingredient) => availableIngredients.has(ingredient));
}
