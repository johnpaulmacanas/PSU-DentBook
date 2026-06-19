import { describe, it, expect, vi, beforeEach } from 'vitest';

const mock = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    signInWithPassword: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));
vi.mock('../lib/supabase', () => ({ supabase: mock }));

import { makeBuilder, ok, fail } from '../test/mocks/supabase';
import { ProfileService } from './ProfileService';

beforeEach(() => vi.clearAllMocks());

describe('ProfileService.listAll', () => {
  it('selects all profiles ordered by name', async () => {
    const builder = makeBuilder(ok([{ id: 'p1' }, { id: 'p2' }]));
    mock.from.mockReturnValue(builder);

    const res = await ProfileService.listAll();
    expect(mock.from).toHaveBeenCalledWith('profiles');
    expect(builder.order).toHaveBeenCalledWith('full_name');
    expect(res.data).toHaveLength(2);
    expect(res.error).toBeNull();
  });

  it('returns an error tuple on failure', async () => {
    mock.from.mockReturnValue(makeBuilder(fail('rls denied')));
    const res = await ProfileService.listAll();
    expect(res.data).toBeNull();
    expect(res.error).toBe('rls denied');
  });
});

describe('ProfileService.listByRole', () => {
  it('filters by role with a parameterized .eq', async () => {
    const builder = makeBuilder(ok([{ id: 'd1', role: 'doctor' }]));
    mock.from.mockReturnValue(builder);

    await ProfileService.listByRole('doctor');
    expect(builder.eq).toHaveBeenCalledWith('role', 'doctor');
    expect(builder.order).toHaveBeenCalledWith('full_name');
  });
});

describe('ProfileService.update', () => {
  it('sanitizes text fields and passes date/sex through', async () => {
    const builder = makeBuilder(ok({ id: 'u1' }));
    mock.from.mockReturnValue(builder);

    await ProfileService.update('u1', {
      full_name: '<b>Maria</b>',
      address: 'a"b',
      birthdate: '1990-01-01',
      sex: 'F',
    });

    const patch = builder.update.mock.calls[0][0];
    expect(patch.full_name).toBe('Maria');     // HTML stripped
    expect(patch.address).toBe('ab');          // quote stripped
    expect(patch.birthdate).toBe('1990-01-01'); // passed through
    expect(patch.sex).toBe('F');
    expect(builder.eq).toHaveBeenCalledWith('id', 'u1');
  });
});
