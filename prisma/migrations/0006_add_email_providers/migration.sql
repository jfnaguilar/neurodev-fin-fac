-- Add RESEND and SMTP to IntegrationProvider enum
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'RESEND';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'SMTP';

-- Track email sends on each emission type
ALTER TABLE "boleto_emissions"
  ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "email_sent_to" TEXT;

ALTER TABLE "pix_emissions"
  ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "email_sent_to" TEXT;

ALTER TABLE "invoice_emissions"
  ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "email_sent_to" TEXT;
