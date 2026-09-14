import type { APIRoute } from 'astro';
import { requireSameOrigin, signOut } from '../../lib/server/auth';
export const prerender = false;
export const POST: APIRoute = async context => requireSameOrigin(context.request) ?? signOut(context);
