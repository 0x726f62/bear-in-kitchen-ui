import type { APIRoute } from 'astro';
import { getDb } from '../../lib/server/db';
import { authAttemptKey, createSession, isRateLimited, recordAuthFailure, requireSameOrigin, safeReturnTo } from '../../lib/server/auth';
import { hashPassword, validatePassword } from '../../lib/server/passwords';
export const prerender = false;

function failure(context: Parameters<APIRoute>[0], error: string, returnTo: string): Response {
  return context.redirect(`/login/?registerError=${encodeURIComponent(error)}&returnTo=${encodeURIComponent(returnTo)}`, 303);
}

export const POST: APIRoute = async context => {
  const originError = requireSameOrigin(context.request);
  if (originError) return originError;
  const form = await context.request.formData();
  const name = typeof form.get('name') === 'string' ? String(form.get('name')).trim() : '';
  const email = typeof form.get('email') === 'string' ? String(form.get('email')).trim().toLocaleLowerCase('en-US') : '';
  const password = typeof form.get('password') === 'string' ? String(form.get('password')) : '';
  const confirmation = typeof form.get('passwordConfirmation') === 'string' ? String(form.get('passwordConfirmation')) : '';
  const returnTo = safeReturnTo(form.get('returnTo'));
  const key = await authAttemptKey(context.request, 'register');
  if (await isRateLimited(getDb(), key, 'register')) return failure(context, 'too_many_attempts', returnTo);
  if (!name || name.length > 100) return failure(context, 'invalid_name', returnTo);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return failure(context, 'invalid_email', returnTo);
  const passwordError = validatePassword(password);
  if (passwordError) return failure(context, 'invalid_password', returnTo);
  if (password !== confirmation) return failure(context, 'password_mismatch', returnTo);

  await recordAuthFailure(getDb(), key, 'register');
  const credentials = await hashPassword(password);
  const id = crypto.randomUUID();
  try {
    await getDb().prepare(`INSERT INTO users (id, email, display_name, role, password_hash, password_salt, password_iterations) VALUES (?, ?, ?, 'USER', ?, ?, ?)`)
      .bind(id, email, name, credentials.hash, credentials.salt, credentials.iterations).run();
  } catch {
    return failure(context, 'account_exists', returnTo);
  }
  return createSession(context, id, returnTo);
};
