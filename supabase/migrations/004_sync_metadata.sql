-- ============================================
-- Lil Tours & Travel — Sync Metadata
-- Migration: 004_sync_metadata
-- ============================================

-- Idempotency table for sync operations
CREATE TABLE sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sync_operations_operation_id ON sync_operations (operation_id);
CREATE INDEX idx_sync_operations_user_id ON sync_operations (user_id);
CREATE INDEX idx_sync_operations_entity ON sync_operations (entity_type, entity_id);

-- Version field for conflict detection
ALTER TABLE field_leads ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Update version on changes
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_field_leads_version
  BEFORE UPDATE ON field_leads
  FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_follow_ups_version
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION increment_version();

-- RLS for sync_operations
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny public read on sync_operations"
  ON sync_operations FOR SELECT USING (false);

CREATE POLICY "Deny public insert on sync_operations"
  ON sync_operations FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny public update on sync_operations"
  ON sync_operations FOR UPDATE USING (false);

CREATE POLICY "Deny public delete on sync_operations"
  ON sync_operations FOR DELETE USING (false);
