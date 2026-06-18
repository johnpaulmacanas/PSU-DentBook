import { useEffect, useMemo, useState } from 'react';
import { useAppointments } from '../../hooks/useAppointments';
import { useInvoices } from '../../hooks/useInvoices';
import { usePatients } from '../../hooks/usePatients';
import { supabase } from '../../lib/supabase';
import { formatMoney } from '../../lib/format';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Admin reports & analytics page — revenue, appointment stats, patient growth. */
export function ReportsPage() {
  const { invoices } = useInvoices();
  const { appointments } = useAppointments();
  const { patients } = usePatients();

  const [gatewayMap, setGatewayMap] = useState<Record<string, string>>({});

  // Load payment gateway info
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('payment_transactions')
        .select('invoice_id, gateway, status')
        .eq('status', 'paid');
      if (data) {
        const map: Record<string, string> = {};
        for (const row of data) map[row.invoice_id] = row.gateway;
        setGatewayMap(map);
      }
    }
    void load();
  }, [invoices]);

  // Revenue by month (last 6 months)
  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const months: { label: string; revenue: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthInvoices = invoices.filter(inv => {
        if (inv.status !== 'paid') return false;
        const created = new Date(inv.created_at);
        return created.getMonth() === month && created.getFullYear() === year;
      });
      months.push({ label, revenue: monthInvoices.reduce((s, i) => s + i.amount, 0), count: monthInvoices.length });
    }
    return months;
  }, [invoices]);

  // Revenue by gateway
  const revenueByGateway = useMemo(() => {
    const totals = { paymongo: 0, paypal: 0, cash: 0 };
    const counts = { paymongo: 0, paypal: 0, cash: 0 };
    for (const inv of invoices) {
      if (inv.status !== 'paid') continue;
      const gw = (gatewayMap[inv.id] || 'cash') as keyof typeof totals;
      totals[gw] += inv.amount;
      counts[gw]++;
    }
    return { totals, counts };
  }, [invoices, gatewayMap]);

  // Appointment stats
  const apptStats = useMemo(() => {
    const total = appointments.length || 1;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    const missed = appointments.filter(a => a.status === 'missed').length;
    return {
      total: appointments.length,
      completed,
      cancelled,
      missed,
      completionRate: Math.round((completed / total) * 100),
      cancellationRate: Math.round((cancelled / total) * 100),
      missedRate: Math.round((missed / total) * 100),
    };
  }, [appointments]);

  // Revenue by procedure type
  const revenueByProcedure = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    for (const inv of invoices) {
      if (inv.status !== 'paid') continue;
      const proc = inv.appointment?.procedure ?? 'Unknown';
      if (!map[proc]) map[proc] = { revenue: 0, count: 0 };
      map[proc].revenue += inv.amount;
      map[proc].count++;
    }
    return Object.entries(map)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10);
  }, [invoices]);

  // Patient growth
  const patientGrowth = useMemo(() => {
    const now = new Date();
    const thisMonth = patients.filter(p => {
      const profile = p.profile;
      if (!profile) return false;
      const created = new Date(profile.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    const lastMonth = patients.filter(p => {
      const profile = p.profile;
      if (!profile) return false;
      const created = new Date(profile.created_at);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return created.getMonth() === lm.getMonth() && created.getFullYear() === lm.getFullYear();
    }).length;
    return { thisMonth, lastMonth, delta: thisMonth - lastMonth };
  }, [patients]);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const maxMonthRevenue = Math.max(...revenueByMonth.map(m => m.revenue), 1);

  function printReport() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-6 print:gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-dark-5">Revenue, appointment performance, and patient metrics.</p>
        </div>
        <button
          type="button"
          onClick={printReport}
          className="shrink-0 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors print:hidden"
        >
          🖨 Print Report
        </button>
      </div>

      {/* ===== Revenue Summary Cards ===== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-green">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Via PayMongo</p>
          <p className="mt-1 text-2xl font-bold text-green">{formatMoney(revenueByGateway.totals.paymongo)}</p>
          <p className="mt-0.5 text-xs text-dark-5">{revenueByGateway.counts.paymongo} transactions</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Via PayPal</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{formatMoney(revenueByGateway.totals.paypal)}</p>
          <p className="mt-0.5 text-xs text-dark-5">{revenueByGateway.counts.paypal} transactions</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Via Cash</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{formatMoney(revenueByGateway.totals.cash)}</p>
          <p className="mt-0.5 text-xs text-dark-5">{revenueByGateway.counts.cash} transactions</p>
        </div>
      </div>

      {/* ===== Revenue by Month ===== */}
      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">Monthly Revenue (Last 6 Months)</h2>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {revenueByMonth.map(m => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-dark-5">{m.label}</span>
                <div className="relative h-6 flex-1 rounded-full bg-gray-1">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${(m.revenue / maxMonthRevenue) * 100}%`, minWidth: m.revenue > 0 ? 8 : 0 }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs font-semibold text-dark">{formatMoney(m.revenue)}</span>
                <span className="w-16 shrink-0 text-right text-xs text-dark-5">{m.count} inv.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* ===== Appointment Performance ===== */}
        <div className="rounded-xl border border-stroke bg-white shadow-sm">
          <div className="border-b border-stroke px-5 py-4">
            <h2 className="font-semibold text-dark">Appointment Performance</h2>
          </div>
          <div className="p-5">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-1 p-3 text-center">
                <p className="text-2xl font-bold text-dark">{apptStats.total}</p>
                <p className="text-xs text-dark-5">Total Appointments</p>
              </div>
              <div className="rounded-lg bg-gray-1 p-3 text-center">
                <p className="text-2xl font-bold text-green">{apptStats.completionRate}%</p>
                <p className="text-xs text-dark-5">Completion Rate</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-dark-5">Completed ({apptStats.completed})</span>
                  <span className="font-semibold text-green">{apptStats.completionRate}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-1">
                  <div className="h-full rounded-full bg-green transition-all" style={{ width: `${apptStats.completionRate}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-dark-5">Cancelled ({apptStats.cancelled})</span>
                  <span className="font-semibold text-red-500">{apptStats.cancellationRate}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-1">
                  <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${apptStats.cancellationRate}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-dark-5">Missed ({apptStats.missed})</span>
                  <span className="font-semibold text-amber-500">{apptStats.missedRate}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-1">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${apptStats.missedRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Revenue by Procedure + Patient Growth ===== */}
        <div className="flex flex-col gap-4">
          {/* Revenue by procedure */}
          <div className="rounded-xl border border-stroke bg-white shadow-sm">
            <div className="border-b border-stroke px-5 py-4">
              <h2 className="font-semibold text-dark">Top Procedures by Revenue</h2>
            </div>
            {revenueByProcedure.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-dark-5">No paid invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                      <th className="px-5 py-2.5">Procedure</th>
                      <th className="px-5 py-2.5 text-right">Count</th>
                      <th className="px-5 py-2.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {revenueByProcedure.map(([proc, data]) => (
                      <tr key={proc} className="hover:bg-gray-1">
                        <td className="px-5 py-2.5 font-medium text-dark">{proc}</td>
                        <td className="px-5 py-2.5 text-right text-dark-5">{data.count}</td>
                        <td className="px-5 py-2.5 text-right font-semibold text-green">{formatMoney(data.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Patient growth */}
          <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase text-dark-5">Patient Growth</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-2xl font-bold text-dark">{patientGrowth.thisMonth}</p>
                <p className="text-xs text-dark-5">New this month</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-dark-4">{patientGrowth.lastMonth}</p>
                <p className="text-xs text-dark-5">Last month</p>
              </div>
              <div className="flex-1 text-right">
                <p className={`text-2xl font-bold ${patientGrowth.delta >= 0 ? 'text-green' : 'text-red-500'}`}>
                  {patientGrowth.delta >= 0 ? '+' : ''}{patientGrowth.delta}
                </p>
                <p className="text-xs text-dark-5">Change</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
