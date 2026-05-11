-- Add PixEmission table and PixStatus enum for PIX payment collection via Asaas

CREATE TYPE "PixStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED');

CREATE TABLE "pix_emissions" (
  "id"                   TEXT NOT NULL,
  "tenant_id"            TEXT NOT NULL,
  "receivable_title_id"  TEXT,
  "provider"             TEXT NOT NULL,
  "external_id"          TEXT NOT NULL,
  "qr_code"              TEXT,
  "qr_code_image"        TEXT,
  "tx_id"                TEXT,
  "expires_at"           TIMESTAMP(3),
  "amount"               DECIMAL(15,2) NOT NULL,
  "status"               "PixStatus" NOT NULL DEFAULT 'PENDING',
  "paid_at"              TIMESTAMP(3),
  "canceled_at"          TIMESTAMP(3),
  "webhook_data"         JSONB,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "pix_emissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pix_emissions_tenant_id_idx"    ON "pix_emissions"("tenant_id");
CREATE INDEX "pix_emissions_external_id_idx"  ON "pix_emissions"("external_id");
CREATE INDEX "pix_emissions_status_idx"       ON "pix_emissions"("status");

ALTER TABLE "pix_emissions"
  ADD CONSTRAINT "pix_emissions_receivable_title_id_fkey"
  FOREIGN KEY ("receivable_title_id")
  REFERENCES "receivable_titles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
