import type { ServiceResult } from '../types';

export function handleSupabaseError<T>(error: unknown): ServiceResult<T> {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : 'An unexpected error occurred.';
  console.error('[DentaStream Error]', message);
  return { data: null, error: message };
}
