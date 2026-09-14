const ITERATIONS = 600_000;
const MIN_LENGTH = 15;
const MAX_LENGTH = 128;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: Uint8Array.from(salt).buffer, iterations }, key, 256);
  return new Uint8Array(bits);
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return 'Zadejte heslo.';
  const length = Array.from(password).length;
  if (length < MIN_LENGTH) return `Heslo musí mít alespoň ${MIN_LENGTH} znaků.`;
  if (length > MAX_LENGTH) return `Heslo může mít nejvýše ${MAX_LENGTH} znaků.`;
  return null;
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string; iterations: number }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: toBase64Url(await derive(password, salt, ITERATIONS)), salt: toBase64Url(salt), iterations: ITERATIONS };
}

export async function verifyPassword(password: string, expectedHash: string, salt: string, iterations: number): Promise<boolean> {
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 2_000_000) return false;
  let actual: Uint8Array;
  let expected: Uint8Array;
  try {
    actual = await derive(password, fromBase64Url(salt), iterations);
    expected = fromBase64Url(expectedHash);
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

export async function performDummyPasswordCheck(password: string): Promise<void> {
  await derive(password, new Uint8Array(16), ITERATIONS);
}
