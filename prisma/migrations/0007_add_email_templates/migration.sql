-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('BOLETO', 'PIX', 'NF');

-- CreateTable
CREATE TABLE "email_templates" (
  "id"         TEXT NOT NULL,
  "tenant_id"  TEXT NOT NULL,
  "type"       "EmailTemplateType" NOT NULL,
  "subject"    TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_tenant_id_type_key" ON "email_templates"("tenant_id", "type");
