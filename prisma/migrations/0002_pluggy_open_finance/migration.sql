-- CreateTable: Open Finance integration (Pluggy)

CREATE TABLE "pluggy_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "connector_id" INTEGER NOT NULL,
    "bank_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPDATED',
    "error" TEXT,
    "last_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pluggy_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pluggy_accounts" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pluggy_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT,
    "bank_data" JSONB NOT NULL DEFAULT '{}',
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "currency_code" TEXT NOT NULL DEFAULT 'BRL',
    "balance" DECIMAL(15,2) NOT NULL,
    "synced_at" TIMESTAMP(3),
    CONSTRAINT "pluggy_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pluggy_transactions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pluggy_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "bank_data" JSONB,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "title_id" TEXT,
    "title_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pluggy_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pluggy_connections_item_id_key" ON "pluggy_connections"("item_id");
CREATE UNIQUE INDEX "pluggy_accounts_pluggy_id_key" ON "pluggy_accounts"("pluggy_id");
CREATE UNIQUE INDEX "pluggy_transactions_pluggy_id_key" ON "pluggy_transactions"("pluggy_id");

-- AddForeignKey
ALTER TABLE "pluggy_accounts" ADD CONSTRAINT "pluggy_accounts_connection_id_fkey"
    FOREIGN KEY ("connection_id") REFERENCES "pluggy_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pluggy_transactions" ADD CONSTRAINT "pluggy_transactions_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "pluggy_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
