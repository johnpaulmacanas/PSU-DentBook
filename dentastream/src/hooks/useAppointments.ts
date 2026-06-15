import { useCallback, useEffect, useState } from 'react';
import { AppointmentService } from '../services/AppointmentService';
import type { Appointment, AppointmentStatus } from '../types';

interface UseAppointmentsFilters {
  status?: AppointmentStatus;
  date?: string;
}

/**
 * Loads the full appointment list (admin scope) with optional filters and
 * exposes a `reload` for refreshing after mutations. Wraps
 * {@link AppointmentService} so components never call Supabase directly.
 */
export function useAppointments(filters?: UseAppointmentsFilters) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await AppointmentService.listAll(filters);
    if (error) setError(error);
    else setAppointments(data ?? []);
    setLoading(false);
  }, [filters?.status, filters?.date]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { appointments, loading, error, reload };
}
