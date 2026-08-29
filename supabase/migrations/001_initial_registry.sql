-- ============================================
-- Lil Tours & Travel — Initial Registry Schema
-- Migration: 001_initial_registry
-- ============================================

-- Enums
CREATE TYPE enquiry_source AS ENUM (
  'website', 'whatsapp', 'field_marketing', 'referral', 'social_media', 'walk_in', 'other'
);

CREATE TYPE enquiry_status AS ENUM (
  'new', 'contacted', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE service_type AS ENUM (
  'tourism', 'work_abroad', 'visa', 'passport', 'air_ticket',
  'hotel', 'airbnb', 'car_hire', 'delivery', 'consultancy'
);

-- ============================================
-- Clients
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  district TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Normalize phone for deduplication
CREATE UNIQUE INDEX idx_clients_phone_unique ON clients (phone);

-- ============================================
-- Enquiries
-- ============================================
CREATE TABLE enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service service_type NOT NULL,
  destination TEXT,
  preferred_date DATE,
  notes TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  source enquiry_source NOT NULL DEFAULT 'website',
  status enquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_enquiries_client_id ON enquiries (client_id);
CREATE INDEX idx_enquiries_service ON enquiries (service);
CREATE INDEX idx_enquiries_status ON enquiries (status);
CREATE INDEX idx_enquiries_created_at ON enquiries (created_at DESC);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- No public read access. Only service_role (server) can access.
-- The server-side API uses the service_role key, bypassing RLS.

-- Deny anonymous/public access explicitly
CREATE POLICY "Deny public read on clients"
  ON clients FOR SELECT
  USING (false);

CREATE POLICY "Deny public insert on clients"
  ON clients FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public update on clients"
  ON clients FOR UPDATE
  USING (false);

CREATE POLICY "Deny public delete on clients"
  ON clients FOR DELETE
  USING (false);

CREATE POLICY "Deny public read on enquiries"
  ON enquiries FOR SELECT
  USING (false);

CREATE POLICY "Deny public insert on enquiries"
  ON enquiries FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public update on enquiries"
  ON enquiries FOR UPDATE
  USING (false);

CREATE POLICY "Deny public delete on enquiries"
  ON enquiries FOR DELETE
  USING (false);
