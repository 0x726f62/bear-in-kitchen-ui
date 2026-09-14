import { env } from 'cloudflare:workers';

export type Role = 'USER' | 'EDITOR' | 'ADMIN';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  role: Role;
}

export function getDb(): D1Database {
  return env.DB;
}

export function canEdit(role: Role): boolean {
  return role === 'EDITOR' || role === 'ADMIN';
}
