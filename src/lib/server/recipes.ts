export interface DatabaseRecipe {
  id: string;
  title: string;
  description: string;
  draft: boolean;
  category: string;
  published: Date;
  imageKey: string | null;
  photoAlt: string;
  serves: number;
  minutes: number;
  difficulty: 'Snadné' | 'Střední' | 'Náročné';
  tags: string[];
  ingredients: Array<{ ingredientId: string; name: string; quantity?: number; unit: string }>;
  steps: Array<{ content: string; tip: boolean; imageKey: string | null; photoAlt?: string }>;
}

type RecipeRow = Omit<DatabaseRecipe, 'draft' | 'published' | 'tags' | 'ingredients' | 'steps'> & { draft: number; published: string };

function mapRecipe(row: RecipeRow): DatabaseRecipe {
  return { ...row, draft: row.draft === 1, published: new Date(`${row.published}T00:00:00Z`), tags: [], ingredients: [], steps: [] };
}

export async function getDatabaseRecipes(db: D1Database, includeDrafts: boolean): Promise<DatabaseRecipe[]> {
  const where = includeDrafts ? '' : 'WHERE draft = 0';
  const recipeResult = await db.prepare(`SELECT id, title, description, draft, category, published, image_key AS imageKey, image_alt AS photoAlt, serves, minutes, difficulty FROM recipes ${where} ORDER BY published DESC, id`).all<RecipeRow>();
  const recipes = recipeResult.results.map(mapRecipe);
  if (!recipes.length) return recipes;
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const ids = recipes.map(recipe => recipe.id);
  const placeholders = ids.map(() => '?').join(',');
  const [ingredientResult, tagResult] = await Promise.all([
    db.prepare(`SELECT recipe_id, ingredient_id, display_name, quantity, unit FROM recipe_ingredients WHERE recipe_id IN (${placeholders}) ORDER BY recipe_id, position`).bind(...ids).all<{ recipe_id: string; ingredient_id: string; display_name: string; quantity: number | null; unit: string }>(),
    db.prepare(`SELECT recipe_id, tag FROM recipe_tags WHERE recipe_id IN (${placeholders}) ORDER BY recipe_id, tag`).bind(...ids).all<{ recipe_id: string; tag: string }>(),
  ]);
  for (const item of ingredientResult.results) byId.get(item.recipe_id)?.ingredients.push({ ingredientId: item.ingredient_id, name: item.display_name, ...(item.quantity == null ? {} : { quantity: item.quantity }), unit: item.unit });
  for (const item of tagResult.results) byId.get(item.recipe_id)?.tags.push(item.tag);
  return recipes;
}

export async function getDatabaseRecipe(db: D1Database, id: string): Promise<DatabaseRecipe | null> {
  const row = await db.prepare('SELECT id, title, description, draft, category, published, image_key AS imageKey, image_alt AS photoAlt, serves, minutes, difficulty FROM recipes WHERE id = ?').bind(id).first<RecipeRow>();
  if (!row) return null;
  const recipe = mapRecipe(row);
  const [ingredientResult, tagResult, stepResult] = await Promise.all([
    db.prepare('SELECT ingredient_id, display_name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ? ORDER BY position').bind(id).all<{ ingredient_id: string; display_name: string; quantity: number | null; unit: string }>(),
    db.prepare('SELECT tag FROM recipe_tags WHERE recipe_id = ? ORDER BY tag').bind(id).all<{ tag: string }>(),
    db.prepare('SELECT content, tip, image_key, image_alt FROM recipe_steps WHERE recipe_id = ? ORDER BY position').bind(id).all<{ content: string; tip: number; image_key: string | null; image_alt: string | null }>(),
  ]);
  recipe.ingredients = ingredientResult.results.map(item => ({ ingredientId: item.ingredient_id, name: item.display_name, ...(item.quantity == null ? {} : { quantity: item.quantity }), unit: item.unit }));
  recipe.tags = tagResult.results.map(item => item.tag);
  recipe.steps = stepResult.results.map(item => ({ content: item.content, tip: item.tip === 1, imageKey: item.image_key, ...(item.image_alt ? { photoAlt: item.image_alt } : {}) }));
  return recipe;
}
