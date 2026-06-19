import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInvoices } from '../../hooks/useInvoices';
import { ReceiptService } from '../../services/ReceiptService';
import { MedicalCertificateService } from '../../services/MedicalCertificateService';
import { PrescriptionService } from '../../services/PrescriptionService';
import { PaymentService } from '../../services/PaymentService';
import { InvoiceStatusBadge, AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { formatMoney, formatDate } from '../../lib/format';
import type { MedicalCertificate, Prescription, Invoice } from '../../types';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

/**
 * Patient billing page with dual payment gateway support:
 * - PayMongo QRPh (hosted checkout redirect)
 * - PayPal Sandbox (inline buttons)
 * Plus invoices, prescriptions, and certificates.
 */
export function PatientBillingPage() {
  const { invoices, loading, error, reload } = useInvoices();
  const [certs, setCerts] = useState<MedicalCertificate[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Payment method picker
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Check for payment redirect result
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      setNotice('Payment received! Your invoice will be updated shortly.');
      void reload();
    } else if (paymentStatus === 'cancelled') {
      setNotice('Payment was cancelled. You can try again anytime.');
    }
  }, [searchParams, reload]);

  useEffect(() => {
    MedicalCertificateService.listAll().then(({ data }) => setCerts(data ?? []));
    PrescriptionService.listAll().then(({ data }) => setPrescriptions(data ?? []));
  }, []);

  // Load PayPal SDK lazily when payment modal opens
  useEffect(() => {
    if (!paymentInvoice || paypalLoaded || !PAYPAL_CLIENT_ID) return;
    if (document.getElementById('paypal-sdk')) { setPaypalLoaded(true); return; }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=PHP`;
    script.onload = () => setPaypalLoaded(true);
    document.body.appendChild(script);
  }, [paymentInvoice, paypalLoaded]);

  async function payWithQRPh(inv: Invoice) {
    setBusyId(inv.id);
    setNotice(null);
    const { data, error } = await PaymentService.createPayMongoCheckout(
      inv.id,
      inv.amount,
      inv.appointment?.procedure ?? 'Dental Service',
    );
    setBusyId(null);
    if (error) { setNotice(`Error: ${error}`); return; }
    if (data?.checkout_url) {
      window.location.href = data.checkout_url;
    }
  }

  async function payWithCash(invoiceId: string) {
    setBusyId(invoiceId);
    setNotice(null);
    const { data, error } = await ReceiptService.issue(invoiceId);
    setBusyId(null);
    if (error) { setNotice(error); return; }
    setNotice(`Payment recorded. Receipt ${data?.receipt_no ?? ''} issued.`);
    setPaymentInvoice(null);
    await reload();
  }

  // PayPal button rendering
  useEffect(() => {
    if (!paymentInvoice || !paypalLoaded || !window.paypal) return;
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    container.innerHTML = '';

    window.paypal.Buttons({
      createOrder: async () => {
        const { data, error } = await PaymentService.createPayPalOrder(
          paymentInvoice.id,
          paymentInvoice.amount,
          paymentInvoice.appointment?.procedure ?? 'Dental Service',
        );
        if (error || !data) throw new Error(error ?? 'Failed to create order');
        return data.order_id;
      },
      onApprove: async (data: { orderID: string }) => {
        const result = await PaymentService.capturePayPalOrder(data.orderID, paymentInvoice.id);
        if (result.error) {
          setNotice(`PayPal error: ${result.error}`);
        } else {
          setNotice('PayPal payment completed! Invoice updated.');
          setPaymentInvoice(null);
          await reload();
        }
      },
      onError: (err: Error) => {
        console.error('PayPal error:', err);
        setNotice('PayPal payment failed. Please try again.');
      },
    }).render('#paypal-button-container');
  }, [paymentInvoice, paypalLoaded, reload]);

  function printPrescription(rx: Prescription) {
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    const patientName = rx.appointment?.patient?.profile?.full_name ?? 'Patient';
    const doctorName = rx.appointment?.doctor?.profile?.full_name ?? 'Doctor';
    w.document.write(`
      <html><head><title>Prescription</title>
      <style>
        body { font-family: Georgia, serif; padding: 48px; color: #1f2937; }
        h1 { text-align: center; }
        .row { margin: 12px 0; }
        .label { font-weight: bold; }
        .rx { font-size: 1.5em; font-weight: bold; margin: 24px 0; }
        .sig { margin-top: 64px; }
      </style></head><body>
        <h1>℞ Prescription</h1>
        <div class="row"><span class="label">Patient:</span> ${patientName}</div>
        <div class="row"><span class="label">Date:</span> ${formatDate(rx.created_at)}</div>
        <hr/>
        <div class="rx">${rx.medication}</div>
        <div class="row"><span class="label">Dosage:</span> ${rx.dosage ?? '—'}</div>
        <div class="row"><span class="label">Frequency:</span> ${rx.frequency ?? '—'}</div>
        <div class="row"><span class="label">Duration:</span> ${rx.duration ?? '—'}</div>
        ${rx.notes ? `<div class="row"><span class="label">Notes:</span> ${rx.notes}</div>` : ''}
        <div class="sig">_______________________________<br/>${doctorName}<br/>Attending Dentist</div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
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
        <h1 className="text-2xl font-bold text-dark">Billing &amp; Records</h1>
        <p className="mt-1 text-sm text-dark-5">Pay invoices, view prescriptions, and print your medical certificates.</p>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.startsWith('Error') || notice.includes('failed') || notice.includes('cancelled') ? 'bg-red-50 text-red-600' : 'bg-green-light/20 text-green'}`}>
          {notice}
        </p>
      )}

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
                {invoices.map(inv => {
                  const isCancelled = inv.appointment?.status === 'cancelled';
                  return (
                  <tr key={inv.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 text-dark">{inv.appointment?.procedure ?? '—'}</td>
                    <td className="px-5 py-3.5 text-dark-5 capitalize">{inv.kind}</td>
                    <td className="px-5 py-3.5 font-medium text-dark">{formatMoney(inv.amount)}</td>
                    <td className="px-5 py-3.5">
                      {isCancelled
                        ? <AppointmentStatusBadge status="cancelled" />
                        : <InvoiceStatusBadge status={inv.status} />}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isCancelled ? (
                        <span className="text-xs text-dark-5">—</span>
                      ) : inv.status === 'unpaid' ? (
                        <button
                          type="button"
                          onClick={() => setPaymentInvoice(inv)}
                          disabled={busyId === inv.id}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-xs text-dark-5">Paid</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Prescriptions */}
      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">Prescriptions</h2>
        </div>
        {prescriptions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">No prescriptions yet.</p>
        ) : (
          <ul className="divide-y divide-stroke">
            {prescriptions.map(rx => (
              <li key={rx.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-dark">{rx.medication}</p>
                  <p className="text-xs text-dark-5">
                    {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ') || '—'}
                    {' · '}{formatDate(rx.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => printPrescription(rx)}
                  className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1"
                >
                  Print
                </button>
              </li>
            ))}
          </ul>
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

      {/* ===== Payment Method Picker Modal ===== */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Choose Payment Method</h2>
            <p className="mt-1 text-sm text-dark-5">
              {paymentInvoice.appointment?.procedure ?? 'Invoice'} · {formatMoney(paymentInvoice.amount)}
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {/* PayMongo QRPh */}
              <button
                type="button"
                onClick={() => void payWithQRPh(paymentInvoice)}
                disabled={busyId === paymentInvoice.id}
                className="flex items-center gap-3 rounded-xl border border-stroke px-4 py-3.5 text-left transition hover:bg-gray-1 disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-light/20">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-green">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="2"/>
                    <line x1="20" y1="14" x2="20" y2="21" stroke="currentColor" strokeWidth="2"/>
                    <line x1="14" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark">QR Ph / GCash / Card</p>
                  <p className="text-xs text-dark-5">Pay via PayMongo — scan QR, use GCash, or card</p>
                </div>
              </button>

              {/* PayPal */}
              {PAYPAL_CLIENT_ID && (
                <div className="rounded-xl border border-stroke px-4 py-3.5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-600">
                        <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark">PayPal</p>
                      <p className="text-xs text-dark-5">Pay with your PayPal account</p>
                    </div>
                  </div>
                  <div id="paypal-button-container" className="min-h-[48px]">
                    {!paypalLoaded && <p className="text-xs text-dark-5">Loading PayPal…</p>}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-2 text-xs text-dark-5">
                <div className="h-px flex-1 bg-stroke" />
                or
                <div className="h-px flex-1 bg-stroke" />
              </div>

              {/* Cash (walk-in) */}
              <button
                type="button"
                onClick={() => void payWithCash(paymentInvoice.id)}
                disabled={busyId === paymentInvoice.id}
                className="flex items-center gap-3 rounded-xl border border-stroke px-4 py-3.5 text-left transition hover:bg-gray-1 disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-amber-600">
                    <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark">Mark as Paid (Cash)</p>
                  <p className="text-xs text-dark-5">For walk-in payments already settled at the clinic</p>
                </div>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Type augmentation for PayPal SDK loaded via script tag
declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: Error) => void;
      }) => { render: (selector: string) => void };
    };
  }
}
