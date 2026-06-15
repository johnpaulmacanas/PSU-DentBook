import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client module before importing the service under test.
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

import { AppointmentService } from './AppointmentService';

const SAMPLE = {
  id: 'a1', patient_id: 'p1', doctor_id: 'd1', scheduled_at: '2026-03-12T09:00:00Z',
  procedure: 'Cleaning', status: 'scheduled', room: null, notes: null,
  created_at: '', updated_at: '',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AppointmentService.create', () => {
  it('sanitizes the procedure and returns the row', async () => {
    const builder = makeBuilder(ok(SAMPLE));
    mock.from.mockReturnValue(builder);

    const res = await AppointmentService.create({
      patient_id: 'p1',
      doctor_id: 'd1',
      scheduled_at: '2026-03-12T09:00:00Z',
      procedure: '<b>Cleaning</b>',
    });

    expect(mock.from).toHaveBeenCalledWith('appointments');
    const inserted = builder.insert.mock.calls[0][0];
    expect(inserted.procedure).toBe('Cleaning'); // HTML stripped
    expect(res.error).toBeNull();
    expect(res.data?.id).toBe('a1');
  });

  it('allows a null doctor (optional dentist)', async () => {
    const builder = makeBuilder(ok({ ...SAMPLE, doctor_id: null }));
    mock.from.mockReturnValue(builder);

    await AppointmentService.create({ patient_id: 'p1', scheduled_at: 'x', procedure: 'Checkup' });
    expect(builder.insert.mock.calls[0][0].doctor_id).toBeNull();
  });

  it('returns an error tuple on failure', async () => {
    mock.from.mockReturnValue(makeBuilder(fail('insert denied')));
    const res = await AppointmentService.create({ patient_id: 'p1', scheduled_at: 'x', procedure: 'y' });
    expect(res.data).toBeNull();
    expect(res.error).toBe('insert denied');
  });
});

describe('AppointmentService.listForDoctor', () => {
  it('filters by doctor_id with a parameterized .eq (no interpolation)', async () => {
    const builder = makeBuilder(ok([SAMPLE]));
    mock.from.mockReturnValue(builder);

    await AppointmentService.listForDoctor('d1');
    expect(builder.eq).toHaveBeenCalledWith('doctor_id', 'd1');
    expect(builder.order).toHaveBeenCalledWith('scheduled_at');
  });

  it('maps sort keys to real columns', async () => {
    const builder = makeBuilder(ok([SAMPLE]));
    mock.from.mockReturnValue(builder);

    await AppointmentService.listForDoctor('d1', 'service');
    expect(builder.order).toHaveBeenCalledWith('procedure');

    await AppointmentService.listForDoctor('d1', 'status');
    expect(builder.order).toHaveBeenCalledWith('status');
  });
});

describe('AppointmentService status transitions', () => {
  it('schedule() sets status to scheduled', async () => {
    const builder = makeBuilder(ok(SAMPLE));
    mock.from.mockReturnValue(builder);

    await AppointmentService.schedule('a1', { scheduled_at: '2026-03-12T10:00:00Z' });
    expect(builder.update.mock.calls[0][0].status).toBe('scheduled');
    expect(builder.eq).toHaveBeenCalledWith('id', 'a1');
  });

  it('reschedule() sets status to rescheduled', async () => {
    const builder = makeBuilder(ok(SAMPLE));
    mock.from.mockReturnValue(builder);

    await AppointmentService.reschedule('a1', '2026-03-13T10:00:00Z');
    expect(builder.update.mock.calls[0][0].status).toBe('rescheduled');
  });

  it('markMissed() sets status to missed', async () => {
    const builder = makeBuilder(ok(SAMPLE));
    mock.from.mockReturnValue(builder);

    await AppointmentService.markMissed('a1');
    expect(builder.update.mock.calls[0][0].status).toBe('missed');
  });
});
