-- ============================================
-- Lil Tours & Travel — Money Lending
-- Migration: 005_money_lending
-- ============================================

-- Enums
CREATE TYPE loan_status AS ENUM (
  'pending', 'approved', 'cancelled', 'paid'
);

-- ============================================
-- Loan Requests
-- ============================================
CREATE TABLE loan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  national_id TEXT,
  district TEXT,
  loan_amount NUMERIC(12, 2) NOT NULL,
  loan_purpose TEXT NOT NULL,
  repayment_period INTEGER NOT NULL,
  monthly_payment NUMERIC(12, 2) NOT NULL,
  employment_status TEXT NOT NULL,
  monthly_income NUMERIC(12, 2),
  income_source TEXT,
  collateral_description TEXT,
  guarantor_name TEXT,
  guarantor_phone TEXT,
  status loan_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  approved_by UUID REFERENCES staff_profiles(id),
  approved_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Loan Payments (Track Sheet)
-- ============================================
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loan_requests(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly',
  expected_amount NUMERIC(12, 2) NOT NULL,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_loan_requests_client_id ON loan_requests (client_id);
CREATE INDEX idx_loan_requests_status ON loan_requests (status);
CREATE INDEX idx_loan_requests_created_at ON loan_requests (created_at DESC);
CREATE INDEX idx_loan_payments_loan_id ON loan_payments (loan_id);
CREATE INDEX idx_loan_payments_status ON loan_payments (status);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE TRIGGER trg_loan_requests_updated_at
  BEFORE UPDATE ON loan_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny public read on loan_requests"
  ON loan_requests FOR SELECT USING (false);
CREATE POLICY "Deny public insert on loan_requests"
  ON loan_requests FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public update on loan_requests"
  ON loan_requests FOR UPDATE USING (false);
CREATE POLICY "Deny public delete on loan_requests"
  ON loan_requests FOR DELETE USING (false);

CREATE POLICY "Deny public read on loan_payments"
  ON loan_payments FOR SELECT USING (false);
CREATE POLICY "Deny public insert on loan_payments"
  ON loan_payments FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public update on loan_payments"
  ON loan_payments FOR UPDATE USING (false);
CREATE POLICY "Deny public delete on loan_payments"
  ON loan_payments FOR DELETE USING (false);
