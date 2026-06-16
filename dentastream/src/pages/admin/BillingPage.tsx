import { useState } from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import { InvoiceService } from '../../services/InvoiceService';
import { ReceiptService } from '../../services/ReceiptService';
import { InvoiceStatusBadge } from '../../components/ui/StatusBadge';
import { formatMoney, formatDate } from '../../lib/format';

/**
 * Admin billing hub: view all invoices, adjust amounts, issue receipts.
 */
export function BillingPage() {
  const { invoices, loading, error, reload } = useInvoices();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Inline amount editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const unpaidCount = invoices.filter(i => i.status === 'unpaid').length;
  const paidCount = invoices.filter(i => i.status === 'paid').length;

  async function issueReceipt(invoiceId: string) {
    setBusyId(invoiceId);
    setNotice(null);
    const { data, error } = await ReceiptService.issue(invoiceId);
    setBusyId(null);
    if (error) { setNotice(`Error: ${error}`); return; }
    setNotice(`Receipt ${data?.receipt_no ?? ''} issued successfully.`);
    await reload();
  }

  function startEditAmount(id: string, current: number) {
    setEditingId(id);
    setEditAmount(String(current));
  }

  async function saveAmount(id: string) {
    const num = parseFloat(editAmount);
    if (!Number.isFinite(num) || num < 0) return;
    setBusyId(id);
    const { error } = await InvoiceService.updateAmount(id, num);
    setBusyId(null);
    setEditingId(null);
    if (error) { setNotice(`Error: ${error}`); return; }
    await reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Billing</h1>
        <p className="mt-1 text-sm text-dark-5">Manage invoices, adjust amounts, and issue receipts.</p>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-light/20 text-green'}`}>
          {notice}
        </p>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-green">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Unpaid</p>
          <p className="mt-1 text-2xl font-bold text-dark-4">{unpaidCount}</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Paid</p>
          <p className="mt-1 text-2xl font-bold text-primary">{paidCount}</p>
        </div>
      </div>

      {/* Invoices table */}
      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">All Invoices</h2>
        </div>
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="px-5 py-10 text-center text-sm text-red-500">{error}</p>
        ) : invoices.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Procedure</th>
                  <th className="px-5 py-3 hidden md:table-cell">Type</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 font-medium text-dark">
                      {inv.appointment?.patient?.profile?.full_name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-dark-5">{inv.appointment?.procedure ?? '—'}</td>
                    <td className="px-5 py-3.5 text-dark-5 capitalize hidden md:table-cell">{inv.kind}</td>
                    <td className="px-5 py-3.5">
                      {editingId === inv.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-dark-5">₱</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            className="w-24 rounded border border-primary bg-white px-2 py-1 text-sm outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => void saveAmount(inv.id)}
                            disabled={busyId === inv.id}
                            className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded px-2 py-1 text-xs font-medium text-dark-5 hover:bg-gray-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => inv.status === 'unpaid' && startEditAmount(inv.id, inv.amount)}
                          className={`font-medium ${inv.status === 'unpaid' ? 'cursor-pointer text-dark hover:text-primary' : 'cursor-default text-dark'}`}
                          title={inv.status === 'unpaid' ? 'Click to edit amount' : ''}
                        >
                          {formatMoney(inv.amount)}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><InvoiceStatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{formatDate(inv.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {inv.status === 'unpaid' ? (
                        <button
                          type="button"
                          onClick={() => void issueReceipt(inv.id)}
                          disabled={busyId === inv.id}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                        >
                          {busyId === inv.id ? 'Processing…' : 'Issue Receipt'}
                        </button>
                      ) : (
                        <span className="text-xs text-dark-5">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
