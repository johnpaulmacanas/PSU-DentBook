import { useEffect, useState } from 'react';
import { ClinicSettingsService } from '../../services/ClinicSettingsService';
import { formatMoney, formatDate } from '../../lib/format';
import type { Invoice } from '../../types';

interface PrintableReceiptProps {
  invoice: Invoice;
  receiptNo?: string;
  paymentMethod?: string;
  onClose: () => void;
}

/**
 * Printable receipt/invoice modal. Opens a styled document that maps to a
 * clean print layout. Shared between admin and patient billing pages.
 */
export function PrintableReceipt({ invoice, receiptNo, paymentMethod, onClose }: PrintableReceiptProps) {
  const [clinicName, setClinicName] = useState('DentaStream Dental Clinic');

  useEffect(() => {
    ClinicSettingsService.getAll().then(({ data }) => {
      if (data?.clinic_name) setClinicName(data.clinic_name);
    });
  }, []);

  const isPaid = invoice.status === 'paid';
  const patient = invoice.appointment?.patient?.profile?.full_name ?? '—';
  const doctor = invoice.appointment?.doctor?.profile?.full_name ?? 'Unassigned';
  const procedure = invoice.appointment?.procedure ?? '—';
  const scheduledAt = invoice.appointment?.scheduled_at;
  const visitNotes = invoice.appointment?.visit_notes;

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=700,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${isPaid ? 'Receipt' : 'Invoice'} — ${clinicName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; max-width: 700px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
          .header h1 { font-size: 22px; font-weight: 700; color: #0f172a; }
          .header p { font-size: 12px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge-paid { background: #dcfce7; color: #16a34a; }
          .badge-unpaid { background: #fef3c7; color: #d97706; }
          .doc-title { font-size: 18px; font-weight: 700; margin: 16px 0 20px; text-align: center; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .info-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
          .info-box .value { font-size: 14px; font-weight: 600; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #0f172a; border-bottom: none; }
          .notes { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 24px; }
          .notes .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; margin-bottom: 6px; }
          .notes p { font-size: 13px; color: #334155; line-height: 1.5; }
          .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; }
          .footer p { font-size: 11px; color: #94a3b8; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${clinicName}</h1>
          <p>Dental Services</p>
        </div>

        <div style="text-align: center; margin-bottom: 16px;">
          <span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}">${isPaid ? 'PAID' : 'UNPAID'}</span>
        </div>

        <div class="doc-title">${isPaid ? 'Official Receipt' : 'Invoice'}</div>

        <div class="info-grid">
          <div class="info-box">
            <div class="label">Patient</div>
            <div class="value">${patient}</div>
          </div>
          <div class="info-box">
            <div class="label">Attending Dentist</div>
            <div class="value">${doctor}</div>
          </div>
          ${receiptNo ? `
          <div class="info-box">
            <div class="label">Receipt No.</div>
            <div class="value">${receiptNo}</div>
          </div>` : `
          <div class="info-box">
            <div class="label">Invoice Type</div>
            <div class="value" style="text-transform: capitalize;">${invoice.kind}</div>
          </div>`}
          <div class="info-box">
            <div class="label">Date</div>
            <div class="value">${scheduledAt ? new Date(scheduledAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
          </div>
          ${paymentMethod ? `
          <div class="info-box">
            <div class="label">Payment Method</div>
            <div class="value">${paymentMethod === 'paymongo' ? 'PayMongo (QR Ph / GCash / Card)' : paymentMethod === 'paypal' ? 'PayPal' : 'Cash'}</div>
          </div>` : ''}
          <div class="info-box">
            <div class="label">Issued</div>
            <div class="value">${new Date(invoice.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${procedure}</td>
              <td style="text-align: right;">₱${invoice.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td style="text-align: right;">₱${invoice.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        ${visitNotes ? `
        <div class="notes">
          <div class="label">Visit Notes</div>
          <p>${visitNotes}</p>
        </div>` : ''}

        <div class="footer">
          <p>Thank you for choosing ${clinicName}!</p>
          <p style="margin-top: 4px;">This is a computer-generated document. No signature required.</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-stroke bg-white shadow-lg">
        {/* Preview header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4">
          <h2 className="text-lg font-bold text-dark">{isPaid ? 'Receipt' : 'Invoice'} Preview</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              🖨 Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1"
            >
              Close
            </button>
          </div>
        </div>

        {/* On-screen preview */}
        <div className="p-6">
          <div className="text-center border-b border-stroke pb-4 mb-5">
            <h3 className="text-xl font-bold text-dark">{clinicName}</h3>
            <p className="text-xs text-dark-5 mt-1">Dental Services</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${isPaid ? 'bg-green-light/20 text-green' : 'bg-amber-100 text-amber-700'}`}>
              {isPaid ? 'PAID' : 'UNPAID'}
            </span>
          </div>

          <h4 className="text-center text-lg font-bold text-dark mb-5">{isPaid ? 'Official Receipt' : 'Invoice'}</h4>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-lg bg-gray-1 p-3">
              <p className="text-[10px] font-semibold uppercase text-dark-5">Patient</p>
              <p className="text-sm font-semibold text-dark">{patient}</p>
            </div>
            <div className="rounded-lg bg-gray-1 p-3">
              <p className="text-[10px] font-semibold uppercase text-dark-5">Attending Dentist</p>
              <p className="text-sm font-semibold text-dark">{doctor}</p>
            </div>
            {receiptNo && (
              <div className="rounded-lg bg-gray-1 p-3">
                <p className="text-[10px] font-semibold uppercase text-dark-5">Receipt No.</p>
                <p className="text-sm font-semibold text-dark">{receiptNo}</p>
              </div>
            )}
            <div className="rounded-lg bg-gray-1 p-3">
              <p className="text-[10px] font-semibold uppercase text-dark-5">Date</p>
              <p className="text-sm font-semibold text-dark">{scheduledAt ? formatDate(scheduledAt) : '—'}</p>
            </div>
            {paymentMethod && (
              <div className="rounded-lg bg-gray-1 p-3">
                <p className="text-[10px] font-semibold uppercase text-dark-5">Payment Method</p>
                <p className="text-sm font-semibold text-dark">
                  {paymentMethod === 'paymongo' ? 'PayMongo' : paymentMethod === 'paypal' ? 'PayPal' : 'Cash'}
                </p>
              </div>
            )}
          </div>

          <table className="w-full text-sm mb-5">
            <thead>
              <tr className="border-b-2 border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stroke">
                <td className="px-4 py-3 text-dark">{procedure}</td>
                <td className="px-4 py-3 text-right text-dark">{formatMoney(invoice.amount)}</td>
              </tr>
              <tr className="border-t-2 border-dark">
                <td className="px-4 py-3 font-bold text-dark">Total</td>
                <td className="px-4 py-3 text-right font-bold text-dark text-base">{formatMoney(invoice.amount)}</td>
              </tr>
            </tbody>
          </table>

          {visitNotes && (
            <div className="rounded-lg bg-gray-1 p-3 mb-5">
              <p className="text-[10px] font-semibold uppercase text-dark-5 mb-1">Visit Notes</p>
              <p className="text-sm text-dark">{visitNotes}</p>
            </div>
          )}

          <div className="text-center border-t border-stroke pt-4">
            <p className="text-xs text-dark-5">Thank you for choosing {clinicName}!</p>
            <p className="text-[10px] text-dark-5 mt-1">This is a computer-generated document. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
