import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/db';
import { requireEditor, requireSameOrigin } from '../../../lib/server/auth';
import { json, positiveInteger, text } from '../../../lib/server/validation';
export const prerender = false;

type IngredientInput = { ingredientId?: unknown; name?: unknown; quantity?: unknown; unit?: unknown };
type StepInput = { content?: unknown; tip?: unknown };

export const POST: APIRoute = async context => {
  const originError = requireSameOrigin(context.request);
  if (originError) return originError;
  const user = await requireEditor(context);
  if (user instanceof Response) return user;
  const body = await context.request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return json({ error: 'Neplatná data receptu.' }, 400);

  const title = text(body.title, 160);
  const description = text(body.description, 3000);
  const category = text(body.category, 80);
  const photoAltInput = text(body.photoAlt, 200);
  const serves = positiveInteger(body.serves);
  const minutes = positiveInteger(body.minutes);
  const difficulty = ['Snadné', 'Střední', 'Náročné'].includes(String(body.difficulty)) ? String(body.difficulty) : null;
  const draft = body.draft !== false;
  const rawIngredients = Array.isArray(body.ingredients) ? body.ingredients as IngredientInput[] : [];
  const rawSteps = Array.isArray(body.steps) ? body.steps as StepInput[] : [];
  if (rawIngredients.length > 100 || rawSteps.length > 100 || (Array.isArray(body.tags) && body.tags.length > 50)) return json({ error: 'Recept obsahuje příliš mnoho položek.' }, 400);
  const ingredients = rawIngredients.map(item => ({
    ingredientId: text(item.ingredientId, 100), name: text(item.name, 160),
    quantity: item.quantity === '' || item.quantity == null ? null : Number(item.quantity), unit: typeof item.unit === 'string' ? item.unit.trim().slice(0, 40) : '',
  }));
  const steps = rawSteps.map(item => ({ content: text(item.content, 5000), tip: item.tip === true }));
  const tags = Array.isArray(body.tags) ? [...new Set(body.tags.map(value => text(value, 80)).filter((value): value is string => Boolean(value)))] : [];
  if (!title || !description || !category || !serves || !minutes || !difficulty) return json({ error: 'Vyplňte všechna povinná pole.' }, 400);
  const photoAlt = photoAltInput ?? `${title} – hotový pokrm`;
  if (!ingredients.length || ingredients.some(item => !item.ingredientId || !item.name || (item.quantity !== null && (!Number.isFinite(item.quantity) || item.quantity <= 0)))) return json({ error: 'Recept musí mít platné ingredience.' }, 400);
  if (!steps.some(step => step.content && !step.tip) || steps.some(step => !step.content)) return json({ error: 'Recept musí mít alespoň jeden platný krok.' }, 400);

  const db = getDb();
  const knownIngredients = await db.prepare(`SELECT id FROM ingredients WHERE id IN (${ingredients.map(() => '?').join(',')})`).bind(...ingredients.map(item => item.ingredientId)).all<{ id: string }>();
  if (knownIngredients.results.length !== new Set(ingredients.map(item => item.ingredientId)).size) return json({ error: 'Některá ingredience už neexistuje.' }, 400);
  if (tags.length) {
    const knownTags = await db.prepare(`SELECT name FROM tags WHERE name IN (${tags.map(() => '?').join(',')})`).bind(...tags).all<{ name: string }>();
    if (knownTags.results.length !== tags.length) return json({ error: 'Některý štítek už neexistuje.' }, 400);
  }
  const id = crypto.randomUUID().replaceAll('-', '').slice(0, 20);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const statements = [
    db.prepare(`INSERT INTO recipes (id, title, description, draft, category, published, image_key, image_alt, serves, minutes, difficulty, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`).bind(id, title, description, draft ? 1 : 0, category, today, photoAlt, serves, minutes, difficulty, user.id, now, now),
    ...ingredients.map((item, position) => db.prepare('INSERT INTO recipe_ingredients (recipe_id, position, ingredient_id, display_name, quantity, unit) VALUES (?, ?, ?, ?, ?, ?)').bind(id, position, item.ingredientId, item.name, item.quantity, item.unit)),
    ...steps.map((step, position) => db.prepare('INSERT INTO recipe_steps (recipe_id, position, content, tip, image_key, image_alt) VALUES (?, ?, ?, ?, NULL, NULL)').bind(id, position, step.content, step.tip ? 1 : 0)),
    ...tags.map(tag => db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)').bind(id, tag)),
  ];
  await db.batch(statements);
  return json({ id, message: 'Recept byl uložen.' }, 201);
};
