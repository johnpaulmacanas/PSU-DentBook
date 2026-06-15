import { useCallback, useEffect, useState } from 'react';
import { AppointmentRequestService } from '../services/AppointmentRequestService';
import type { AppointmentRequest } from '../types';

type Scope =
  | { kind: 'pending' }
  | { kind: 'mine'; profileId: string };

/**
 * Loads appointment requests. Pass `{ kind: 'pending' }` for the admin queue,
 * or `{ kind: 'mine', profileId }` for a patient's own requests. Wraps
 * {@link AppointmentRequestService} so components never touch Supabase.
 */
export function useAppointmentRequests(scope: Scope) {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scopeKey = scope.kind === 'mine' ? `mine:${scope.profileId}` : 'pending';

  const reload = useCallback(async () => {
    setLoading(true);
    const result = scope.kind === 'mine'
      ? await AppointmentRequestService.listMine(scope.profileId)
      : await AppointmentRequestService.listPending();
    if (result.error) setError(result.error);
    else setRequests(result.data ?? []);
    setLoading(false);
    // scopeKey captures the meaningful inputs; service methods are static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { requests, loading, error, reload };
}
