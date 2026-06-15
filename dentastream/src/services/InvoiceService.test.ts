import { describe, it, expect, vi, beforeEach } from 'vitest';

const mock = vi.hoisted(() => ({
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
}));
vi.mock('../lib/supabase', () => ({ supabase: mock }));

import { makeBuilder, ok, fail } from '../test/mocks/supabase';

import { InvoiceService } from './InvoiceService';

beforeEach(() => vi.clearAllMocks());

describe('InvoiceService.create', () => {
  it('defaults kind to initial and coerces a bad amount to 0', async () => {
    const builder = makeBuilder(ok({ id: 'inv1' }));
    mock.from.mockReturnValue(builder);

    await InvoiceService.create({ appointment_id: 'a1', amount: Number.NaN });
    const row = builder.insert.mock.calls[0][0];
    expect(row.kind).toBe('initial');
    expect(row.amount).toBe(0);
    expect(row.appointment_id).toBe('a1');
  });

  it('returns an error tuple on failure', async () => {
    mock.from.mockReturnValue(makeBuilder(fail('denied')));
    const res = await InvoiceService.create({ appointment_id: 'a1', amount: 100 });
    expect(res.error).toBe('denied');
  });
});

describe('InvoiceService.markPaid', () => {
  it('updates status to paid for the given id', async () => {
    const builder = makeBuilder(ok({ id: 'inv1', status: 'paid' }));
    mock.from.mockReturnValue(builder);

    await InvoiceService.markPaid('inv1');
    expect(builder.update).toHaveBeenCalledWith({ status: 'paid' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'inv1');
  });
});
