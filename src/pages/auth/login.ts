import type { APIRoute } from 'astro';
import { getDb } from '../../lib/server/db';
import { clearAuthFailures, createSession, isRateLimited, loginAttemptKeys, recordAuthFailure, requireSameOrigin, safeReturnTo } from '../../lib/server/auth';
import { performDummyPasswordCheck, verifyPassword } from '../../lib/server/passwords';
export const prerender = false;

function failure(context: Parameters<APIRoute>[0], error: string, returnTo: string): Response {
  return context.redirect(`/login/?error=${encodeURIComponent(error)}&returnTo=${encodeURIComponent(returnTo)}`, 303);
}

export const POST: APIRoute = async context => {
  const originError = requireSameOrigin(context.request);
  if (originError) return originError;
  const form = await context.request.formData();
  const email = typeof form.get('email') === 'string' ? String(form.get('email')).trim().toLocaleLowerCase('en-US') : '';
  const password = typeof form.get('password') === 'string' ? String(form.get('password')) : '';
  const returnTo = safeReturnTo(form.get('returnTo'));
  const keys = await loginAttemptKeys(context.request, email);
  if ((await Promise.all(keys.map(key => isRateLimited(getDb(), key, 'login')))).some(Boolean)) return failure(context, 'too_many_attempts', returnTo);

  const user = email && password && Array.from(password).length <= 128
    ? await getDb().prepare('SELECT id, password_hash, password_salt, password_iterations FROM users WHERE email = ?').bind(email).first<{ id: string; password_hash: string | null; password_salt: string | null; password_iterations: number | null }>()
    : null;
  const valid = user?.password_hash && user.password_salt && user.password_iterations
    ? await verifyPassword(password, user.password_hash, user.password_salt, user.password_iterations)
    : (await performDummyPasswordCheck(password.slice(0, 128)), false);
  if (!user || !valid) {
    await Promise.all(keys.map(key => recordAuthFailure(getDb(), key, 'login')));
    return failure(context, 'invalid_credentials', returnTo);
  }
  await Promise.all(keys.map(key => clearAuthFailures(getDb(), key)));
  return createSession(context, user.id, returnTo);
};
