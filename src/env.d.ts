declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
  }
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run<T = unknown>(): Promise<T>;
}

declare module 'cloudflare:workers' {
  export const env: Cloudflare.Env;
}
