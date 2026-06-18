-- 05_payments.sql  —  Payment gateway tracking
-- Run AFTER 04_parity.sql

-- Tracks payment attempts through external gateways (PayMongo, PayPal).
CREATE TABLE IF NOT EXISTS payment_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  gateway      text NOT NULL CHECK (gateway IN ('paymongo', 'paypal', 'cash')),
  gateway_session_id text,           -- PayMongo checkout session ID or PayPal order ID
  amount       numeric(12,2) NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  paid_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookup by invoice
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session ON payment_transactions(gateway_session_id);

-- RLS: everyone can see their own payment transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Admin can see all
CREATE POLICY payment_transactions_admin_all ON payment_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Patients can see transactions on their own invoices
CREATE POLICY payment_transactions_patient_select ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN appointments a ON a.id = i.appointment_id
      JOIN patients p ON p.id = a.patient_id
      WHERE i.id = payment_transactions.invoice_id
        AND p.profile_id = auth.uid()
    )
  );

-- Service role (edge functions) can insert/update
CREATE POLICY payment_transactions_service_all ON payment_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;
