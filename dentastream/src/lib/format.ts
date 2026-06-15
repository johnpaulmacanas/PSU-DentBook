/**
 * Shared, pure formatters. Centralizes date/time/money/label rendering so
 * pages don't each re-implement it (DRY). No DB, no React — unit-testable.
 */
import type { AppointmentStatus, Concern, RequestStatus, InvoiceStatus } from '../types';

/** "Mar 12, 2026" from an ISO string. Returns '—' for null/invalid input. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "09:00 AM" from an ISO string. Returns '—' for null/invalid input. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/** "Mar 12, 2026 · 09:00 AM" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

/** "₱1,200.00" */
export function formatMoney(amount: number | null | undefined): string {
  const n = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
  missed: 'Missed',
  completed: 'Completed',
};

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}

const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
};

export function requestStatusLabel(status: RequestStatus): string {
  return REQUEST_STATUS_LABELS[status] ?? status;
}

const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
};

export function invoiceStatusLabel(status: InvoiceStatus): string {
  return INVOICE_STATUS_LABELS[status] ?? status;
}

const CONCERN_LABELS: Record<Concern, string> = {
  checkup: 'Check-up / Cleaning',
  tooth_pain: 'Tooth pain',
  broken_tooth: 'Broken or chipped tooth',
  gum_problem: 'Gum problem',
  whitening: 'Whitening / Cosmetics',
  braces: 'Braces / Alignment',
  tooth_removal: 'Tooth removal',
  child_visit: 'Child dental visit',
  follow_up: 'Follow-up appointment',
  not_sure: 'Not sure (let dentist assess)',
};

export function concernLabel(concern: Concern): string {
  return CONCERN_LABELS[concern] ?? concern;
}

/** All concerns as {value,label} pairs for building <select> options. */
export const CONCERN_OPTIONS: { value: Concern; label: string }[] =
  (Object.keys(CONCERN_LABELS) as Concern[]).map((value) => ({
    value,
    label: CONCERN_LABELS[value],
  }));

/** Tailwind classes for an appointment-status badge. */
export function appointmentStatusClasses(status: AppointmentStatus): string {
  switch (status) {
    case 'completed':   return 'bg-green-light/20 text-green';
    case 'scheduled':   return 'bg-primary/10 text-primary';
    case 'rescheduled': return 'bg-yellow-100 text-yellow-700';
    case 'pending':     return 'bg-gray-2 text-dark-4';
    case 'cancelled':   return 'bg-red-50 text-red-500';
    case 'missed':      return 'bg-red-50 text-red-500';
    default:            return 'bg-gray-2 text-dark-4';
  }
}
