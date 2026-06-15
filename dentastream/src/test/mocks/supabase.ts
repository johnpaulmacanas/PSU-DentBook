import { vi } from 'vitest';

export interface QueryResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

/** A chainable + thenable mock of the Supabase query builder. */
export interface MockBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: (onFulfilled?: (v: QueryResult) => unknown, onRejected?: (e: unknown) => unknown) => Promise<unknown>;
}

const CHAIN_METHODS = [
  'select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'filter', 'match',
  'order', 'limit',
] as const;

/**
 * Build a query-builder mock whose chain methods return the same builder and
 * whose terminal ops (.single/.maybeSingle/await) resolve to `result`.
 *
 * Every chain method is a vi.fn, so tests can assert e.g. that `.eq('id', x)`
 * was called (proving parameterized queries, not string interpolation).
 */
export function makeBuilder<T = unknown>(result: QueryResult<T>): MockBuilder {
  const builder = {} as MockBuilder;
  for (const m of CHAIN_METHODS) {
    builder[m] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result as QueryResult).then(onFulfilled, onRejected);
  return builder;
}

/** Convenience: a success result. */
export function ok<T>(data: T): QueryResult<T> {
  return { data, error: null };
}

/** Convenience: an error result. */
export function fail(message: string): QueryResult<never> {
  return { data: null, error: { message } };
}

export interface SupabaseMock {
  from: ReturnType<typeof vi.fn>;
  auth: {
    signInWithPassword: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    getUser: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
  };
  channel: ReturnType<typeof vi.fn>;
  removeChannel: ReturnType<typeof vi.fn>;
}

/** A fresh mock Supabase client. Configure `from` per test. */
export function createSupabaseMock(): SupabaseMock {
  return {
    from: vi.fn(),
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    channel: vi.fn(),
    removeChannel: vi.fn(),
  };
}
