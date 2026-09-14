import type { APIRoute } from 'astro';
import { getDb, type Role } from '../../../../lib/server/db';
import { requireAdmin, requireSameOrigin } from '../../../../lib/server/auth';
import { json } from '../../../../lib/server/validation';
export const prerender = false;

export const PATCH: APIRoute = async context => {
  const originError = requireSameOrigin(context.request);
  if (originError) return originError;
  const admin = await requireAdmin(context);
  if (admin instanceof Response) return admin;
  const id = context.params.id;
  const body = await context.request.json().catch(() => null) as { role?: Role } | null;
  if (!id || !body || !['USER', 'EDITOR'].includes(body.role ?? '')) return json({ error: 'Role může být pouze USER nebo EDITOR.' }, 400);
  const target = await getDb().prepare('SELECT role FROM users WHERE id = ?').bind(id).first<{ role: Role }>();
  if (!target) return json({ error: 'Uživatel nebyl nalezen.' }, 404);
  if (target.role === 'ADMIN') return json({ error: 'Role ADMIN se spravuje pouze ručně v databázi.' }, 403);
  await getDb().prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(body.role, id).run();
  return json({ id, role: body.role });
};
