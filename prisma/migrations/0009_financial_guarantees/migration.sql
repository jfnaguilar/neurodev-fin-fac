-- Financial guarantees: responsável financeiro, fiadores e garantias reais

-- Link aluno → responsável financeiro
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "responsible_id" TEXT,
  ADD CONSTRAINT "customers_responsible_id_fkey"
    FOREIGN KEY ("responsible_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Pagador efetivo nos títulos a receber (pode diferir do aluno)
ALTER TABLE "receivable_titles"
  ADD COLUMN IF NOT EXISTS "payer_id" TEXT,
  ADD CONSTRAINT "receivable_titles_payer_id_fkey"
    FOREIGN KEY ("payer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tipos para garantidores e garantias
CREATE TYPE "GuarantorType" AS ENUM ('GUARANTOR', 'CO_DEBTOR');
CREATE TYPE "GuaranteeType" AS ENUM ('PROPERTY', 'VEHICLE', 'BANK_GUARANTEE', 'INSURANCE', 'FINANCIAL', 'OTHER');

-- Fiadores / Coobrigados
CREATE TABLE IF NOT EXISTS "guarantors" (
  "id"            TEXT          NOT NULL,
  "tenant_id"     TEXT          NOT NULL,
  "contract_id"   TEXT,
  "name"          TEXT          NOT NULL,
  "document"      TEXT,
  "document_type" TEXT          DEFAULT 'CPF',
  "email"         TEXT,
  "phone"         TEXT,
  "address"       JSONB,
  "type"          "GuarantorType" NOT NULL DEFAULT 'GUARANTOR',
  "notes"         TEXT,
  "is_active"     BOOLEAN       NOT NULL DEFAULT true,
  "created_at"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3)  NOT NULL,
  CONSTRAINT "guarantors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guarantors_contract_id_fkey"
    FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Garantias reais (imóvel, veículo, carta fiança, etc.)
CREATE TABLE IF NOT EXISTS "real_guarantees" (
  "id"                  TEXT           NOT NULL,
  "tenant_id"           TEXT           NOT NULL,
  "contract_id"         TEXT,
  "type"                "GuaranteeType" NOT NULL,
  "description"         TEXT           NOT NULL,
  "estimated_value"     DECIMAL(15,2),
  "registration_number" TEXT,
  "details"             JSONB          NOT NULL DEFAULT '{}',
  "is_active"           BOOLEAN        NOT NULL DEFAULT true,
  "created_at"          TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3)   NOT NULL,
  CONSTRAINT "real_guarantees_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "real_guarantees_contract_id_fkey"
    FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "guarantors_tenant_id_idx"      ON "guarantors"("tenant_id");
CREATE INDEX IF NOT EXISTS "guarantors_contract_id_idx"    ON "guarantors"("contract_id");
CREATE INDEX IF NOT EXISTS "real_guarantees_tenant_id_idx" ON "real_guarantees"("tenant_id");
CREATE INDEX IF NOT EXISTS "real_guarantees_contract_id_idx" ON "real_guarantees"("contract_id");
