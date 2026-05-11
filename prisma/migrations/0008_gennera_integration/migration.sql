-- Gennera academic integration: enum, new columns, sync_logs table

-- Add GENNERA to IntegrationProvider enum
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GENNERA';

-- Add Gennera reference fields to customers
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "gennera_person_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "gennera_user_id"   INTEGER,
  ADD COLUMN IF NOT EXISTS "gennera_last_sync"  TIMESTAMP(3);

-- Add Gennera reference field to class_groups
ALTER TABLE "class_groups"
  ADD COLUMN IF NOT EXISTS "gennera_class_id" INTEGER;

-- Add Gennera reference fields to receivable_titles
ALTER TABLE "receivable_titles"
  ADD COLUMN IF NOT EXISTS "gennera_invoice_id"  INTEGER,
  ADD COLUMN IF NOT EXISTS "gennera_contract_id" INTEGER;

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS "sync_logs" (
  "id"              TEXT          NOT NULL,
  "tenant_id"       TEXT          NOT NULL,
  "provider"        TEXT          NOT NULL DEFAULT 'GENNERA',
  "sync_type"       TEXT          NOT NULL,
  "status"          TEXT          NOT NULL DEFAULT 'RUNNING',
  "records_total"   INTEGER       NOT NULL DEFAULT 0,
  "records_created" INTEGER       NOT NULL DEFAULT 0,
  "records_updated" INTEGER       NOT NULL DEFAULT 0,
  "records_error"   INTEGER       NOT NULL DEFAULT 0,
  "error_message"   TEXT,
  "details"         JSONB         NOT NULL DEFAULT '[]',
  "started_at"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at"     TIMESTAMP(3),
  CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sync_logs_tenant_id_idx"
  ON "sync_logs"("tenant_id");

CREATE INDEX IF NOT EXISTS "sync_logs_sync_type_started_at_idx"
  ON "sync_logs"("sync_type", "started_at" DESC);
