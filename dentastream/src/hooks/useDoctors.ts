import { useCallback, useEffect, useState } from 'react';
import { DoctorService } from '../services/DoctorService';
import type { Doctor } from '../types';

/**
 * Loads all doctors via {@link DoctorService}. Used by the intake form's
 * "preferred dentist" picker and admin scheduling. Components never call
 * Supabase directly.
 */
export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await DoctorService.listAll();
    if (error) setError(error);
    else setDoctors(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { doctors, loading, error, reload };
}
