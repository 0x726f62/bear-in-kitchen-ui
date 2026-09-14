import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/db';
import { requireEditor, requireSameOrigin } from '../../../lib/server/auth';
import { json, normalizeName, slugify, text } from '../../../lib/server/validation';
export const prerender = false;

export const POST: APIRoute = async context => {
  const originError = requireSameOrigin(context.request);
  if (originError) return originError;
  const user = await requireEditor(context);
  if (user instanceof Response) return user;
  const body = await context.request.json().catch(() => null) as Record<string, unknown> | null;
  const name = text(body?.name, 120);
  if (!name) return json({ error: 'Zadejte název ingredience.' }, 400);
  const normalized = normalizeName(name);
  const id = `${slugify(name) || 'ingredient'}-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await getDb().prepare('INSERT INTO ingredients (id, name, normalized_name) VALUES (?, ?, ?)').bind(id, name, normalized).run();
    return json({ id, name }, 201);
  } catch {
    return json({ error: 'Ingredience s tímto názvem už existuje.' }, 409);
  }
};
