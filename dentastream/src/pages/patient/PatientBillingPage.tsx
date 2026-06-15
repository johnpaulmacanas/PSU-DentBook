import { useEffect, useState } from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import { ReceiptService } from '../../services/ReceiptService';
import { MedicalCertificateService } from '../../services/MedicalCertificateService';
import { InvoiceStatusBadge } from '../../components/ui/StatusBadge';
import { formatMoney, formatDate } from '../../lib/format';
import type { MedicalCertificate } from '../../types';

/**
 * Patient billing: invoices (pay -> issues a receipt) and printable medical
 * certificates. Printing uses the browser's print dialog (window.print).
 */
export function PatientBillingPage() {
  const { invoices, loading, error, reload } = useInvoices();
  const [certs, setCerts] = useState<MedicalCertificate[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    MedicalCertificateService.listAll().then(({ data }) => setCerts(data ?? []));
  }, []);

  async function pay(invoiceId: string) {
    setBusyId(invoiceId);
    setNotice(null);
    const { data, error } = await ReceiptService.issue(invoiceId);
    setBusyId(null);
    if (error) { setNotice(error); return; }
    setNotice(`Payment recorded. Receipt ${data?.receipt_no ?? ''} issued.`);
    await reload();
  }

  function printCertificate(cert: MedicalCertificate) {
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    const patientName = cert.appointment?.patient?.profile?.full_name ?? 'Patient';
    w.document.write(`
      <html><head><title>Medical Certificate</title>
      <style>
        body { font-family: Georgia, serif; padding: 48px; color: #1f2937; }
        h1 { text-align: center; }
        .row { margin: 12px 0; }
        .label { font-weight: bold; }
        .sig { margin-top: 64px; }
      </style></head><body>
        <h1>Medical Certificate</h1>
        <div class="row"><span class="label">Patient:</span> ${patientName}</div>
        <div class="row"><span class="label">Diagnosis:</span> ${cert.diagnosis ?? '—'}</div>
        <div class="row"><span class="label">Recommendation:</span> ${cert.recommendation ?? '—'}</div>
        <div class="row"><span class="label">Valid:</span> ${formatDate(cert.valid_from)} to ${formatDate(cert.valid_to)}</div>
        <div class="row"><span class="label">Issued:</span> ${formatDate(cert.issued_at)}</div>
        <div class="sig">_______________________________<br/>Attending Dentist</div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Billing &amp; Certificates</h1>
        <p className="mt-1 text-sm text-dark-5">Pay invoices and print your medical certificates.</p>
      </div>

      {notice && <p className="rounded-lg bg-green-light/20 px-3 py-2 text-sm text-green">{notice}</p>}

      {/* Invoices */}
      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">Invoices</h2>
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
                  <th className="px-5 py-3">Procedure</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 text-dark">{inv.appointment?.procedure ?? '—'}</td>
                    <td className="px-5 py-3.5 text-dark-5 capitalize">{inv.kind}</td>
                    <td className="px-5 py-3.5 font-medium text-dark">{formatMoney(inv.amount)}</td>
                    <td className="px-5 py-3.5"><InvoiceStatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      {inv.status === 'unpaid' ? (
                        <button
                          type="button"
                          onClick={() => void pay(inv.id)}
                          disabled={busyId === inv.id}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                        >
                          {busyId === inv.id ? 'Processing…' : 'Pay Bill'}
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
      </section>

      {/* Certificates */}
      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">Medical Certificates</h2>
        </div>
        {certs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">No certificates issued yet.</p>
        ) : (
          <ul className="divide-y divide-stroke">
            {certs.map(cert => (
              <li key={cert.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-dark">{cert.diagnosis ?? 'Medical certificate'}</p>
                  <p className="text-xs text-dark-5">Issued {formatDate(cert.issued_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => printCertificate(cert)}
                  className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1"
                >
                  Print
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
