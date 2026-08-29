-- ============================================
-- Lil Tours & Travel — Staff Auth & Roles
-- Migration: 002_staff_auth_roles
-- ============================================

-- Roles enum
CREATE TYPE staff_role AS ENUM (
  'admin', 'supervisor', 'data_entrant', 'field_marketer'
);

-- ============================================
-- Staff Profiles
-- ============================================
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role staff_role NOT NULL DEFAULT 'data_entrant',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_profiles_user_id ON staff_profiles (user_id);
CREATE INDEX idx_staff_profiles_role ON staff_profiles (role);
CREATE INDEX idx_staff_profiles_active ON staff_profiles (is_active) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER trg_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Permissions
-- ============================================
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
  role staff_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);

-- Insert permissions
INSERT INTO permissions (key, description) VALUES
  ('registry.view', 'View registry dashboard'),
  ('clients.view', 'View client list'),
  ('clients.create', 'Create new clients'),
  ('clients.update', 'Update client records'),
  ('enquiries.view', 'View enquiries'),
  ('enquiries.create', 'Create enquiries'),
  ('enquiries.update', 'Update enquiry status'),
  ('staff.view', 'View staff members'),
  ('staff.manage', 'Manage staff accounts'),
  ('reports.view', 'View reports'),
  ('field_leads.create', 'Create field leads'),
  ('field_leads.view', 'View field leads');

-- Assign permissions to roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

INSERT INTO role_permissions (role, permission_id)
SELECT 'supervisor', id FROM permissions WHERE key IN (
  'registry.view', 'clients.view', 'clients.create', 'clients.update',
  'enquiries.view', 'enquiries.create', 'enquiries.update', 'reports.view'
);

INSERT INTO role_permissions (role, permission_id)
SELECT 'data_entrant', id FROM permissions WHERE key IN (
  'registry.view', 'clients.view', 'clients.create', 'clients.update',
  'enquiries.view', 'enquiries.create'
);

INSERT INTO role_permissions (role, permission_id)
SELECT 'field_marketer', id FROM permissions WHERE key IN (
  'registry.view'
);

-- ============================================
-- RLS — Staff Profiles
-- ============================================
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Staff can read their own profile
CREATE POLICY "Staff read own profile"
  ON staff_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all staff profiles
CREATE POLICY "Admins read all staff"
  ON staff_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.role = 'admin' AND sp.is_active = true
    )
  );

-- Admins can insert staff profiles
CREATE POLICY "Admins create staff"
  ON staff_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.role = 'admin' AND sp.is_active = true
    )
  );

-- Admins can update staff profiles
CREATE POLICY "Admins update staff"
  ON staff_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.role = 'admin' AND sp.is_active = true
    )
  );

-- Permissions and role_permissions: read-only for authenticated staff
CREATE POLICY "Authenticated read permissions"
  ON permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read role_permissions"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- RLS for existing tables: staff access via service_role
-- The server API uses service_role to bypass RLS.
-- Authenticated users access data only through the API.
-- ============================================
