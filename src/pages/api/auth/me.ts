import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/server/auth';
import { getDb } from '../../../lib/server/db';
import { json } from '../../../lib/server/validation';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const user = await getCurrentUser(request, getDb());
  if (!user) return json({ error: 'Unauthorized' }, 401);
  return json({ displayName: user.displayName, photoUrl: user.photoUrl, role: user.role });
};
