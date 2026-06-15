import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../services/AppointmentService', () => ({
  AppointmentService: { listAll: vi.fn() },
}));

import { useAppointments } from './useAppointments';
import { AppointmentService } from '../services/AppointmentService';

beforeEach(() => vi.clearAllMocks());

describe('useAppointments', () => {
  it('loads appointments on mount', async () => {
    vi.mocked(AppointmentService.listAll).mockResolvedValue({
      data: [{ id: 'a1' }] as never, error: null,
    });

    const { result } = renderHook(() => useAppointments());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error from the service', async () => {
    vi.mocked(AppointmentService.listAll).mockResolvedValue({ data: null, error: 'boom' });

    const { result } = renderHook(() => useAppointments());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
  });

  it('passes filters through to the service', async () => {
    vi.mocked(AppointmentService.listAll).mockResolvedValue({ data: [], error: null });
    renderHook(() => useAppointments({ status: 'scheduled' }));
    await waitFor(() =>
      expect(AppointmentService.listAll).toHaveBeenCalledWith({ status: 'scheduled' }),
    );
  });
});
