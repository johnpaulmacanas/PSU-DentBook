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
import { PatientService } from './PatientService';

beforeEach(() => vi.clearAllMocks());

describe('PatientService.getByProfileId', () => {
  it('queries by profile_id and returns null when none exists', async () => {
    const builder = makeBuilder(ok(null));
    mock.from.mockReturnValue(builder);

    const res = await PatientService.getByProfileId('u1');
    expect(builder.eq).toHaveBeenCalledWith('profile_id', 'u1');
    expect(res.data).toBeNull();
    expect(res.error).toBeNull();
  });
});

describe('PatientService.getOrCreateByProfile', () => {
  it('returns the existing row without creating one', async () => {
    mock.from.mockReturnValue(makeBuilder(ok({ id: 'p1', profile_id: 'u1' })));
    const res = await PatientService.getOrCreateByProfile('u1');
    expect(res.data?.id).toBe('p1');
    // Only one from() call (the lookup); no insert.
    expect(mock.from).toHaveBeenCalledTimes(1);
  });

  it('creates a row with a generated code when none exists', async () => {
    // 1st call: lookup -> null. 2nd call: insert -> created row.
    mock.from.mockReturnValueOnce(makeBuilder(ok(null)));
    const insertBuilder = makeBuilder(ok({ id: 'p2', profile_id: 'u2' }));
    mock.from.mockReturnValueOnce(insertBuilder);

    const res = await PatientService.getOrCreateByProfile('u2');
    expect(res.data?.id).toBe('p2');
    const inserted = insertBuilder.insert.mock.calls[0][0];
    expect(inserted.profile_id).toBe('u2');
    expect(inserted.patient_code).toMatch(/^P-/);
  });
});

describe('PatientService.update', () => {
  it('sanitizes medical notes and sends age/gender', async () => {
    const builder = makeBuilder(ok({ id: 'p1' }));
    mock.from.mockReturnValue(builder);

    await PatientService.update('p1', { age: 30, gender: 'F', medical_notes: '<i>note</i>' });
    const patch = builder.update.mock.calls[0][0];
    expect(patch.age).toBe(30);
    expect(patch.gender).toBe('F');
    expect(patch.medical_notes).toBe('note'); // HTML stripped
    expect(builder.eq).toHaveBeenCalledWith('id', 'p1');
  });

  it('nulls medical notes when cleared', async () => {
    const builder = makeBuilder(ok({ id: 'p1' }));
    mock.from.mockReturnValue(builder);

    await PatientService.update('p1', { medical_notes: null });
    expect(builder.update.mock.calls[0][0].medical_notes).toBeNull();
  });

  it('returns an error tuple on failure', async () => {
    mock.from.mockReturnValue(makeBuilder(fail('denied')));
    const res = await PatientService.update('p1', { age: 5 });
    expect(res.error).toBe('denied');
  });
});
