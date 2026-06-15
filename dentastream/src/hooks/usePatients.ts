import { useCallback, useEffect, useState } from 'react';
import { PatientService } from '../services/PatientService';
import type { Patient } from '../types';

/**
 * Loads all patients via {@link PatientService}. Admin/doctor patient lists
 * use this. Components never call Supabase directly.
 */
export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await PatientService.listAll();
    if (error) setError(error);
    else setPatients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { patients, loading, error, reload };
}
