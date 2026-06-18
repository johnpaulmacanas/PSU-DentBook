import { useEffect, useMemo, useState } from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import { InvoiceService } from '../../services/InvoiceService';
import { ReceiptService } from '../../services/ReceiptService';
import { InvoiceStatusBadge, AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { PrintableReceipt } from '../../components/billing/PrintableReceipt';
import { formatMoney, formatDate } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import type { Invoice } from '../../types';

type PayGateway = 'cash' | 'paymongo' | 'paypal';
type StatusFilter = 'all' | 'unpaid' | 'paid';

/**
 * Admin billing hub: view all invoices, filter by status, search, adjust amounts,
 * process payments with gateway tracking, and print.
 */
export function BillingPage() {
  const { invoices, loading, error, reload } = useInvoices();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  // Inline amount editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  // Payment gateway modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  // Receipt preview
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);

  // Payment gateway info per invoice
  const [paymentGateways, setPaymentGateways] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadGateways() {
      const { data } = await supabase
        .from('payment_transactions')
        .select('invoice_id, gateway, status')
        .eq('status', 'paid');
      if (data) {
        const map: Record<string, string> = {};
        for (const row of data) map[row.invoice_id] = row.gateway;
        setPaymentGateways(map);
      }
    }
    void loadGateways();
  }, [invoices]);

  // Derived stats
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const unpaidCount = invoices.filter(i => i.status === 'unpaid').length;
  const unpaidTotal = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.amount, 0);
  const paidCount = invoices.filter(i => i.status === 'paid').length;

  // Revenue by gateway
  const gwRevenue = useMemo(() => {
    const totals = { paymongo: 0, paypal: 0, cash: 0 };
    for (const inv of invoices) {
      if (inv.status !== 'paid') continue;
      const gw = (paymentGateways[inv.id] || 'cash') as keyof typeof totals;
      totals[gw] += inv.amount;
    }
    return totals;
  }, [invoices, paymentGateways]);

  // Filtered invoices
  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(i =>
        (i.appointment?.patient?.profile?.full_name ?? '').toLowerCase().includes(q) ||
        (i.appointment?.procedure ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, statusFilter, search]);

  async function processPayment(inv: Invoice, gateway: PayGateway) {
    setBusyId(inv.id);
    setNotice(null);

    const { error: txError } = await supabase.from('payment_transactions').insert({
      invoice_id: inv.id,
      gateway,
      gateway_session_id: gateway === 'cash' ? `cash-${Date.now()}` : null,
      amount: inv.amount,
      status: 'paid',
      paid_at: new Date().toISOString(),
    });

    if (txError) console.error('payment_transactions insert error:', txError);

    const { data, error: rcptError } = await ReceiptService.issue(inv.id);
    setBusyId(null);
    setPaymentInvoice(null);

    if (rcptError) { setNotice(`Error: ${rcptError}`); return; }
    setNotice(`Receipt ${data?.receipt_no ?? ''} issued. Payment via ${gateway === 'paymongo' ? 'PayMongo' : gateway === 'paypal' ? 'PayPal' : 'Cash'}.`);
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Billing</h1>
          <p className="mt-1 text-sm text-dark-5">Manage invoices, process payments, and track revenue.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="shrink-0 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors print:hidden"
        >
          🖨 Print
        </button>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-light/20 text-green'}`}>
          {notice}
        </p>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Total Revenue</p>
          <p className="mt-1 text-xl font-bold text-green">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Unpaid</p>
          <p className="mt-1 text-xl font-bold text-dark-4">{unpaidCount}</p>
          <p className="text-xs text-dark-5">{formatMoney(unpaidTotal)}</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Paid</p>
          <p className="mt-1 text-xl font-bold text-primary">{paidCount}</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">PayMongo</p>
          <p className="mt-1 text-xl font-bold text-green">{formatMoney(gwRevenue.paymongo)}</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">PayPal</p>
          <p className="mt-1 text-xl font-bold text-blue-600">{formatMoney(gwRevenue.paypal)}</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Cash</p>
          <p className="mt-1 text-xl font-bold text-amber-600">{formatMoney(gwRevenue.cash)}</p>
        </div>
      </div>

      {/* Invoices table */}
      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-stroke px-5 py-3 print:hidden">
          <div className="flex items-center gap-1">
            {(['all', 'unpaid', 'paid'] as StatusFilter[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  statusFilter === f ? 'bg-primary text-white' : 'text-dark-5 hover:bg-gray-1',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient or procedure…"
            className="ml-auto w-56 rounded-lg border border-stroke bg-gray-1 px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="px-5 py-10 text-center text-sm text-red-500">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">No invoices match your filters.</p>
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
                  <th className="px-5 py-3 hidden lg:table-cell">Paid Via</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {filtered.map(inv => {
                  const isCancelled = inv.appointment?.status === 'cancelled';
                  return (
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
                              type="number" min="0" step="0.01"
                              value={editAmount}
                              onChange={e => setEditAmount(e.target.value)}
                              className="w-24 rounded border border-primary bg-white px-2 py-1 text-sm outline-none"
                              autoFocus
                            />
                            <button type="button" onClick={() => void saveAmount(inv.id)} disabled={busyId === inv.id}
                              className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10">✓</button>
                            <button type="button" onClick={() => setEditingId(null)}
                              className="rounded px-2 py-1 text-xs font-medium text-dark-5 hover:bg-gray-1">✕</button>
                          </div>
                        ) : (
                          <button type="button"
                            onClick={() => inv.status === 'unpaid' && !isCancelled && startEditAmount(inv.id, inv.amount)}
                            className={`font-medium ${inv.status === 'unpaid' && !isCancelled ? 'cursor-pointer text-dark hover:text-primary' : 'cursor-default text-dark'}`}
                            title={inv.status === 'unpaid' && !isCancelled ? 'Click to edit amount' : ''}>
                            {formatMoney(inv.amount)}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isCancelled
                          ? <AppointmentStatusBadge status="cancelled" />
                          : <InvoiceStatusBadge status={inv.status} />}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {inv.status === 'paid' ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            paymentGateways[inv.id] === 'paymongo' ? 'bg-green-light/20 text-green' :
                            paymentGateways[inv.id] === 'paypal' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {paymentGateways[inv.id] === 'paymongo' ? 'PayMongo' :
                             paymentGateways[inv.id] === 'paypal' ? 'PayPal' : 'Cash'}
                          </span>
                        ) : (
                          <span className="text-xs text-dark-5">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{formatDate(inv.created_at)}</td>
                      <td className="px-5 py-3.5 text-right print:hidden">
                        <div className="flex justify-end gap-1.5">
                          {!isCancelled && (
                            <button type="button" onClick={() => setReceiptInvoice(inv)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                              {inv.status === 'paid' ? '🧾 Receipt' : '🧾 Invoice'}
                            </button>
                          )}
                          {isCancelled ? (
                            <span className="text-xs text-dark-5">—</span>
                          ) : inv.status === 'unpaid' ? (
                            <button type="button" onClick={() => setPaymentInvoice(inv)} disabled={busyId === inv.id}
                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                              {busyId === inv.id ? 'Processing…' : 'Process Payment'}
                            </button>
                          ) : (
                            <span className="text-xs text-dark-5">Paid</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Payment Gateway Picker Modal ===== */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Process Payment</h2>
            <p className="mt-1 text-sm text-dark-5">
              {paymentInvoice.appointment?.patient?.profile?.full_name ?? 'Patient'} ·{' '}
              {paymentInvoice.appointment?.procedure ?? 'Invoice'} · {formatMoney(paymentInvoice.amount)}
            </p>
            <p className="mt-4 text-xs font-medium text-dark-5 uppercase">Select payment method received:</p>
            <div className="mt-3 flex flex-col gap-3">
              {([
                { gw: 'cash' as PayGateway, label: 'Cash', sub: 'Walk-in or over-the-counter cash payment', bgClass: 'bg-amber-100', textClass: 'text-amber-600',
                  icon: <><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></> },
                { gw: 'paymongo' as PayGateway, label: 'PayMongo (QR Ph / GCash / Card)', sub: 'Patient paid via PayMongo gateway', bgClass: 'bg-green-light/20', textClass: 'text-green',
                  icon: <><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></> },
                { gw: 'paypal' as PayGateway, label: 'PayPal', sub: 'Patient paid via PayPal', bgClass: 'bg-blue-100', textClass: 'text-blue-600',
                  icon: <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" fill="currentColor"/> },
              ]).map(opt => (
                <button key={opt.gw} type="button" onClick={() => void processPayment(paymentInvoice, opt.gw)} disabled={busyId === paymentInvoice.id}
                  className="flex items-center gap-3 rounded-xl border border-stroke px-4 py-3.5 text-left transition hover:bg-gray-1 disabled:opacity-60">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${opt.bgClass}`}>
                    <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${opt.textClass}`}>{opt.icon}</svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark">{opt.label}</p>
                    <p className="text-xs text-dark-5">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setPaymentInvoice(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Receipt/Invoice Preview Modal ===== */}
      {receiptInvoice && (
        <PrintableReceipt
          invoice={receiptInvoice}
          receiptNo={receiptInvoice.status === 'paid' ? `RCT-${receiptInvoice.id.slice(0, 8).toUpperCase()}` : undefined}
          paymentMethod={paymentGateways[receiptInvoice.id] || 'cash'}
          onClose={() => setReceiptInvoice(null)}
        />
      )}
    </div>
  );
}
