import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppointments } from '../../hooks/useAppointments';
import { useAppointmentRequests } from '../../hooks/useAppointmentRequests';
import { usePatients } from '../../hooks/usePatients';
import { useInvoices } from '../../hooks/useInvoices';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { formatTime, formatDate, formatMoney } from '../../lib/format';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Admin dashboard — clinic command center with revenue, schedule, and quick actions. */
export function DashboardPage() {
  const { appointments, loading } = useAppointments();
  const { requests } = useAppointmentRequests({ kind: 'pending' });
  const { patients } = usePatients();
  const { invoices } = useInvoices();

  const today = useMemo(
    () => appointments
      .filter(a => isToday(a.scheduled_at))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [appointments],
  );

  // Revenue
  const totalRevenue = useMemo(() => invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0), [invoices]);
  const unpaidBalance = useMemo(() => invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0), [invoices]);

  // Week-at-a-glance: appointments per day of the current week
  const weekData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const a of appointments) {
      if (isThisWeek(a.scheduled_at)) {
        counts[new Date(a.scheduled_at).getDay()]++;
      }
    }
    const max = Math.max(...counts, 1);
    return counts.map((count, i) => ({ day: DAY_NAMES[i], count, pct: (count / max) * 100 }));
  }, [appointments]);

  // Recent activity: last 5 appointments by update time
  const recentActivity = useMemo(
    () => [...appointments]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5),
    [appointments],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
        <p className="mt-1 text-sm text-dark-5">Clinical workflow command center.</p>
      </div>

      {/* ===== Stats Row ===== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-green">{formatMoney(totalRevenue)}</p>
          <p className="mt-0.5 text-xs text-dark-5">{formatMoney(unpaidBalance)} unpaid</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Pending Requests</p>
          <p className="mt-1 text-2xl font-bold text-primary">{requests.length}</p>
          <p className="mt-0.5 text-xs text-dark-5">Awaiting approval</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Today's Visits</p>
          <p className="mt-1 text-2xl font-bold text-dark">{today.length}</p>
          <p className="mt-0.5 text-xs text-dark-5">{appointments.filter(a => a.status === 'completed').length} completed total</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-dark-5">Patients</p>
          <p className="mt-1 text-2xl font-bold text-dark">{patients.length}</p>
          <p className="mt-0.5 text-xs text-dark-5">Registered in clinic</p>
        </div>
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          to="/appointments"
          className="flex items-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3.5 shadow-sm transition hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-primary" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark">New Appointment</p>
            <p className="text-xs text-dark-5 hidden sm:block">Walk-in or phone booking</p>
          </div>
        </Link>
        <Link
          to="/requests"
          className="flex items-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3.5 shadow-sm transition hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-amber-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark">Process Request</p>
            <p className="text-xs text-dark-5 hidden sm:block">{requests.length} pending</p>
          </div>
        </Link>
        <Link
          to="/billing"
          className="flex items-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3.5 shadow-sm transition hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-light/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-green" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark">Record Payment</p>
            <p className="text-xs text-dark-5 hidden sm:block">{invoices.filter(i => i.status === 'unpaid').length} unpaid</p>
          </div>
        </Link>
      </div>

      {/* ===== Main Content ===== */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Today's schedule */}
        <div className="rounded-xl border border-stroke bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
            <h2 className="font-semibold text-dark">Today's Appointments</h2>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {today.length} visits
            </span>
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-dark-5">Loading…</p>
          ) : today.length === 0 ? (
            <p className="py-10 text-center text-sm text-dark-5">No appointments scheduled today.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3 hidden md:table-cell">Dentist</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Procedure</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {today.map(a => (
                    <tr key={a.id} className="hover:bg-gray-1">
                      <td className="px-5 py-3.5 font-medium text-dark">{formatTime(a.scheduled_at)}</td>
                      <td className="px-5 py-3.5 text-dark">{a.patient?.profile?.full_name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{a.doctor?.profile?.full_name ?? 'Unassigned'}</td>
                      <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{a.procedure}</td>
                      <td className="px-5 py-3.5"><AppointmentStatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Week at a glance */}
          <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase text-dark-5">This Week</h3>
            <div className="flex items-end justify-between gap-1" style={{ height: 80 }}>
              {weekData.map(({ day, count, pct }) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${Math.max(pct, 4)}%`, minHeight: 3 }}
                    title={`${count} appointment${count !== 1 ? 's' : ''}`}
                  />
                  <span className="text-[10px] font-medium text-dark-5">{day}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-dark-5">
              {weekData.reduce((s, d) => s + d.count, 0)} appointments this week
            </p>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-stroke bg-white shadow-sm">
            <div className="border-b border-stroke px-5 py-4">
              <h3 className="text-xs font-semibold uppercase text-dark-5">Recent Activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <p className="px-5 py-6 text-center text-xs text-dark-5">No recent activity.</p>
            ) : (
              <ul className="divide-y divide-stroke">
                {recentActivity.map(a => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-dark">{a.patient?.profile?.full_name ?? 'Patient'}</p>
                      <p className="text-xs text-dark-5">{a.procedure} · {formatDate(a.updated_at)}</p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
