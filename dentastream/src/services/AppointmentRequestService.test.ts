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

// Mock the composed services so we can assert the orchestration in approve().
vi.mock('./PatientService', () => ({
  PatientService: { getOrCreateByProfile: vi.fn() },
}));
vi.mock('./AppointmentService', () => ({
  AppointmentService: { create: vi.fn() },
}));
vi.mock('./InvoiceService', () => ({
  InvoiceService: { create: vi.fn() },
}));

import { AppointmentRequestService } from './AppointmentRequestService';
import { PatientService } from './PatientService';
import { AppointmentService } from './AppointmentService';
import { InvoiceService } from './InvoiceService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AppointmentRequestService.create', () => {
  it('rejects without consent before touching the DB', async () => {
    const res = await AppointmentRequestService.create({
      patient_profile_id: 'u1', concern: 'checkup', consent: false,
    });
    expect(res.error).toMatch(/consent/i);
    expect(mock.from).not.toHaveBeenCalled();
  });

  it('sanitizes optional text fields and inserts', async () => {
    const builder = makeBuilder(ok({ id: 'r1' }));
    mock.from.mockReturnValue(builder);

    await AppointmentRequestService.create({
      patient_profile_id: 'u1',
      concern: 'tooth_pain',
      consent: true,
      notes: '<b>hurts</b>',
      allergies: undefined,
    });

    expect(mock.from).toHaveBeenCalledWith('appointment_requests');
    const row = builder.insert.mock.calls[0][0];
    expect(row.notes).toBe('hurts');     // HTML stripped
    expect(row.allergies).toBeNull();    // undefined -> null
    expect(row.consent).toBe(true);
  });
});

describe('AppointmentRequestService.listPending', () => {
  it('filters by pending status', async () => {
    const builder = makeBuilder(ok([]));
    mock.from.mockReturnValue(builder);
    await AppointmentRequestService.listPending();
    expect(builder.eq).toHaveBeenCalledWith('request_status', 'pending');
  });
});

describe('AppointmentRequestService.approve', () => {
  function stubRequestLoad() {
    // First from() call loads the request row via .single().
    mock.from.mockReturnValueOnce(makeBuilder(ok({
      id: 'r1', patient_profile_id: 'u1', preferred_doctor_id: 'd1',
      concern: 'checkup', notes: null,
    })));
  }

  it('creates patient -> appointment -> invoice, then approves', async () => {
    stubRequestLoad();
    vi.mocked(PatientService.getOrCreateByProfile).mockResolvedValue(ok({ id: 'p1' }) as never);
    vi.mocked(AppointmentService.create).mockResolvedValue(ok({ id: 'a1' }) as never);
    vi.mocked(InvoiceService.create).mockResolvedValue(ok({ id: 'inv1' }) as never);
    // Final update flipping the request to approved.
    const updateBuilder = makeBuilder(ok({}));
    mock.from.mockReturnValueOnce(updateBuilder);

    const res = await AppointmentRequestService.approve('r1', {
      scheduled_at: '2026-03-12T09:00:00Z',
      initial_amount: 500,
    });

    expect(res.error).toBeNull();
    expect(res.data?.id).toBe('a1');
    expect(PatientService.getOrCreateByProfile).toHaveBeenCalledWith('u1');
    expect(AppointmentService.create).toHaveBeenCalledOnce();
    // Appointment derived the procedure label and linked the request.
    const apptArg = vi.mocked(AppointmentService.create).mock.calls[0][0];
    expect(apptArg.request_id).toBe('r1');
    expect(apptArg.status).toBe('scheduled');
    expect(InvoiceService.create).toHaveBeenCalledWith(
      expect.objectContaining({ appointment_id: 'a1', amount: 500 }),
    );
    expect(updateBuilder.update).toHaveBeenCalledWith({ request_status: 'approved' });
  });

  it('stops if the patient row cannot be resolved', async () => {
    stubRequestLoad();
    vi.mocked(PatientService.getOrCreateByProfile).mockResolvedValue({ data: null, error: 'no patient' } as never);

    const res = await AppointmentRequestService.approve('r1', { scheduled_at: 'x' });
    expect(res.error).toBe('no patient');
    expect(AppointmentService.create).not.toHaveBeenCalled();
  });

  it('stops if appointment creation fails', async () => {
    stubRequestLoad();
    vi.mocked(PatientService.getOrCreateByProfile).mockResolvedValue(ok({ id: 'p1' }) as never);
    vi.mocked(AppointmentService.create).mockResolvedValue({ data: null, error: 'cannot create' } as never);

    const res = await AppointmentRequestService.approve('r1', { scheduled_at: 'x' });
    expect(res.error).toBe('cannot create');
    expect(InvoiceService.create).not.toHaveBeenCalled();
  });
});

describe('AppointmentRequestService.decline', () => {
  it('sets request_status to declined', async () => {
    const builder = makeBuilder(ok({}));
    mock.from.mockReturnValue(builder);
    await AppointmentRequestService.decline('r1');
    expect(builder.update).toHaveBeenCalledWith({ request_status: 'declined' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'r1');
  });
});
