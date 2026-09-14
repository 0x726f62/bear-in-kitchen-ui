import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { canEdit, type AppUser } from './db';

const SESSION_COOKIE = 'bik_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function randomToken(size = 32): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

const cookieOptions = (secure: boolean) => ({
  httpOnly: true,
  secure,
  sameSite: 'strict' as const,
  path: '/',
});

export function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export async function createSession(context: APIContext, userId: string, returnTo: unknown = '/'): Promise<Response> {
  const sessionToken = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString().replace('T', ' ').slice(0, 19);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP'),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(sessionToken), userId, expiresAt),
  ]);
  context.cookies.set(SESSION_COOKIE, sessionToken, { ...cookieOptions(new URL(context.request.url).protocol === 'https:'), maxAge: SESSION_SECONDS });
  return context.redirect(safeReturnTo(returnTo), 303);
}

export async function authAttemptKey(request: Request, scope: 'login' | 'register', email = ''): Promise<string> {
  const address = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  return `${scope}:${await sha256(`${address}\n${email.toLocaleLowerCase('en-US')}`)}`;
}

export async function loginAttemptKeys(request: Request, email: string): Promise<string[]> {
  const address = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  return Promise.all([
    sha256(address).then(hash => `login-address:${hash}`),
    sha256(email.toLocaleLowerCase('en-US')).then(hash => `login-account:${hash}`),
  ]);
}

export async function isRateLimited(db: D1Database, key: string, scope: 'login' | 'register'): Promise<boolean> {
  const window = scope === 'login' ? '-15 minutes' : '-1 hour';
  const limit = scope === 'login' ? 5 : 3;
  const row = await db.prepare(`SELECT failures FROM auth_attempts WHERE attempt_key = ? AND window_started > datetime('now', ?)`).bind(key, window).first<{ failures: number }>();
  return Boolean(row && row.failures >= limit);
}

export async function recordAuthFailure(db: D1Database, key: string, scope: 'login' | 'register'): Promise<void> {
  const window = scope === 'login' ? '-15 minutes' : '-1 hour';
  await db.batch([
    db.prepare("DELETE FROM auth_attempts WHERE window_started <= datetime('now', '-1 day')"),
    db.prepare(`
      INSERT INTO auth_attempts (attempt_key, failures) VALUES (?, 1)
      ON CONFLICT(attempt_key) DO UPDATE SET
        failures = CASE WHEN window_started <= datetime('now', ?) THEN 1 ELSE failures + 1 END,
        window_started = CASE WHEN window_started <= datetime('now', ?) THEN CURRENT_TIMESTAMP ELSE window_started END
    `).bind(key, window, window),
  ]);
}

export async function clearAuthFailures(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM auth_attempts WHERE attempt_key = ?').bind(key).run();
}

export async function getCurrentUser(request: Request, db: D1Database): Promise<AppUser | null> {
  const encodedToken = request.headers.get('cookie')?.match(/(?:^|;\s*)bik_session=([^;]+)/)?.[1];
  if (!encodedToken) return null;
  let token: string;
  try { token = decodeURIComponent(encodedToken); } catch { return null; }
  const row = await db.prepare(`
    SELECT users.id, users.email, users.display_name, users.photo_url, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > CURRENT_TIMESTAMP
  `).bind(await sha256(token)).first<{
    id: string; email: string; display_name: string; photo_url: string | null; role: AppUser['role'];
  }>();
  return row ? { id: row.id, email: row.email, displayName: row.display_name, photoUrl: row.photo_url, role: row.role } : null;
}

export async function requireUser(context: APIContext): Promise<AppUser | Response> {
  const user = await getCurrentUser(context.request, env.DB);
  if (user) return user;
  const path = new URL(context.request.url).pathname;
  return path.startsWith('/api/')
    ? new Response('Unauthorized', { status: 401 })
    : context.redirect(`/login/?returnTo=${encodeURIComponent(path)}`);
}

export async function requireEditor(context: APIContext): Promise<AppUser | Response> {
  const result = await requireUser(context);
  if (result instanceof Response) return result;
  return canEdit(result.role) ? result : new Response('Forbidden', { status: 403 });
}

export async function requireAdmin(context: APIContext): Promise<AppUser | Response> {
  const result = await requireUser(context);
  if (result instanceof Response) return result;
  return result.role === 'ADMIN' ? result : new Response('Forbidden', { status: 403 });
}

export function requireSameOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin');
  return origin && origin === new URL(request.url).origin ? null : new Response('Invalid request origin', { status: 403 });
}

export async function signOut(context: APIContext): Promise<Response> {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  context.cookies.delete(SESSION_COOKIE, { path: '/' });
  return context.redirect('/', 303);
}
