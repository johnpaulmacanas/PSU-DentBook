import { useCallback, useEffect, useState } from 'react';
import { InvoiceService } from '../services/InvoiceService';
import type { Invoice } from '../types';

/**
 * Loads all invoices visible to the current user (RLS scopes by role). The
 * patient billing page and admin views use this. Wraps {@link InvoiceService}.
 */
export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await InvoiceService.listAll();
    if (error) setError(error);
    else setInvoices(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { invoices, loading, error, reload };
}
