-- ============================================
-- Lil Tours & Travel — Field Leads & Follow-Ups
-- Migration: 003_field_leads_followups
-- ============================================

-- Field lead lifecycle
CREATE TYPE field_lead_status AS ENUM (
  'new', 'contacted', 'interested', 'follow_up', 'converted', 'not_interested', 'lost'
);

-- Field lead sources
CREATE TYPE field_lead_source AS ENUM (
  'field_marketing', 'office_visit', 'referral', 'event', 'social_media', 'phone', 'whatsapp', 'other'
);

-- Follow-up statuses
CREATE TYPE followup_status AS ENUM (
  'pending', 'completed', 'missed', 'cancelled'
);

-- ============================================
-- Field Leads
-- ============================================
CREATE TABLE field_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  district TEXT,
  date_of_birth DATE,
  service_interest service_type NOT NULL,
  notes TEXT,
  status field_lead_status NOT NULL DEFAULT 'new',
  source field_lead_source NOT NULL DEFAULT 'field_marketing',
  created_by UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX idx_field_leads_status ON field_leads (status);
CREATE INDEX idx_field_leads_created_by ON field_leads (created_by);
CREATE INDEX idx_field_leads_assigned_to ON field_leads (assigned_to);
CREATE INDEX idx_field_leads_next_follow_up ON field_leads (next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX idx_field_leads_created_at ON field_leads (created_at DESC);
CREATE INDEX idx_field_leads_phone ON field_leads (phone);

-- ============================================
-- Follow-Ups
-- ============================================
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_lead_id UUID NOT NULL REFERENCES field_leads(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE RESTRICT,
  due_at TIMESTAMPTZ NOT NULL,
  status followup_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  outcome TEXT,
  created_by UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_follow_ups_field_lead ON follow_ups (field_lead_id);
CREATE INDEX idx_follow_ups_assigned_to ON follow_ups (assigned_to);
CREATE INDEX idx_follow_ups_due_at ON follow_ups (due_at);
CREATE INDEX idx_follow_ups_status ON follow_ups (status);

-- ============================================
-- Triggers
-- ============================================
CREATE TRIGGER trg_field_leads_updated_at
  BEFORE UPDATE ON field_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_follow_ups_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Permissions
-- ============================================
INSERT INTO permissions (key, description) VALUES
  ('field_leads.view_all', 'View all field leads across team'),
  ('field_leads.update', 'Update field lead records'),
  ('field_leads.assign', 'Assign field leads to staff'),
  ('followups.view', 'View follow-ups'),
  ('followups.create', 'Create follow-ups'),
  ('followups.update', 'Update follow-up status');

-- Admin gets all new permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE key IN (
  'field_leads.view_all', 'field_leads.update', 'field_leads.assign',
  'followups.view', 'followups.create', 'followups.update'
);

-- Supervisor gets field lead + follow-up permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'supervisor', id FROM permissions WHERE key IN (
  'field_leads.create', 'field_leads.view', 'field_leads.view_all',
  'field_leads.update', 'field_leads.assign',
  'followups.view', 'followups.create', 'followups.update'
);

-- Field marketer gets limited permissions (own leads only)
INSERT INTO role_permissions (role, permission_id)
SELECT 'field_marketer', id FROM permissions WHERE key IN (
  'field_leads.create', 'field_leads.view', 'field_leads.update',
  'followups.view', 'followups.create', 'followups.update'
);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE field_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Deny anonymous/public access
CREATE POLICY "Deny public read on field_leads"
  ON field_leads FOR SELECT USING (false);

CREATE POLICY "Deny public insert on field_leads"
  ON field_leads FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny public update on field_leads"
  ON field_leads FOR UPDATE USING (false);

CREATE POLICY "Deny public delete on field_leads"
  ON field_leads FOR DELETE USING (false);

CREATE POLICY "Deny public read on follow_ups"
  ON follow_ups FOR SELECT USING (false);

CREATE POLICY "Deny public insert on follow_ups"
  ON follow_ups FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny public update on follow_ups"
  ON follow_ups FOR UPDATE USING (false);

CREATE POLICY "Deny public delete on follow_ups"
  ON follow_ups FOR DELETE USING (false);

-- Also update field_leads permissions from Phase 2 migration
-- The original migration had field_leads.create and field_leads.view
-- These remain; the new ones above add the rest
