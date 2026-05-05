-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('STRIPE', 'ASAAS', 'FOCUSNFE');
CREATE TYPE "BoletoStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED');
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PROCESSING', 'ISSUED', 'CANCELLED', 'ERROR');

-- CreateTable: integration_configs
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "api_key_enc" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_sandbox" BOOLEAN NOT NULL DEFAULT true,
    "tested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: boleto_emissions
CREATE TABLE "boleto_emissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "receivable_title_id" TEXT,
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "bar_code" TEXT,
    "digitable_line" TEXT,
    "pdf_url" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "BoletoStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "webhook_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "boleto_emissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: invoice_emissions
CREATE TABLE "invoice_emissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "receivable_title_id" TEXT,
    "payment_title_id" TEXT,
    "provider" TEXT NOT NULL,
    "external_id" TEXT,
    "ref" TEXT,
    "protocol" TEXT,
    "access_key" TEXT,
    "series" TEXT,
    "number" TEXT,
    "pdf_url" TEXT,
    "xml_url" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "issued_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoice_emissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_tenant_id_provider_key"
    ON "integration_configs"("tenant_id", "provider");

-- AddForeignKey
ALTER TABLE "boleto_emissions" ADD CONSTRAINT "boleto_emissions_receivable_title_id_fkey"
    FOREIGN KEY ("receivable_title_id") REFERENCES "receivable_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_emissions" ADD CONSTRAINT "invoice_emissions_receivable_title_id_fkey"
    FOREIGN KEY ("receivable_title_id") REFERENCES "receivable_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_emissions" ADD CONSTRAINT "invoice_emissions_payment_title_id_fkey"
    FOREIGN KEY ("payment_title_id") REFERENCES "payment_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
