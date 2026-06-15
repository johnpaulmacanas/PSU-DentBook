import type { AppointmentStatus, RequestStatus, InvoiceStatus } from '../../types';
import {
  appointmentStatusLabel,
  appointmentStatusClasses,
  requestStatusLabel,
  invoiceStatusLabel,
} from '../../lib/format';

const PILL = 'inline-block rounded-full px-2.5 py-1 text-xs font-medium';

/** Badge for an appointment status, colored per status. */
export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={[PILL, appointmentStatusClasses(status)].join(' ')}>{appointmentStatusLabel(status)}</span>;
}

/** Badge for a request status. */
export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const classes =
    status === 'approved' ? 'bg-green-light/20 text-green'
    : status === 'declined' ? 'bg-red-50 text-red-500'
    : 'bg-yellow-100 text-yellow-700';
  return <span className={[PILL, classes].join(' ')}>{requestStatusLabel(status)}</span>;
}

/** Badge for an invoice status. */
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const classes = status === 'paid' ? 'bg-green-light/20 text-green' : 'bg-yellow-100 text-yellow-700';
  return <span className={[PILL, classes].join(' ')}>{invoiceStatusLabel(status)}</span>;
}
