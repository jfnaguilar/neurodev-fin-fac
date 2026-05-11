// Imports confirmed payments from Gennera and marks ReceivableTitles as RECEIVED.
// Only applies to titles that were created by GENNERA_SYNC (have genneraInvoiceId).

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { buildGenneraClient } from "@/lib/providers/gennera";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId, provider: "GENNERA", isActive: true },
  });
  if (!cfg?.apiKeyEnc) {
    return NextResponse.json({ error: "Gennera não configurado ou inativo" }, { status: 400 });
  }

  const settings = (cfg.settings ?? {}) as Record<string, string>;
  const password = decrypt(cfg.apiKeyEnc);

  const log = await prisma.syncLog.create({
    data: { tenantId, provider: "GENNERA", syncType: "PAGAMENTOS", status: "RUNNING" },
  });

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  const details: { paymentId: number; invoiceId: number; status: string; error?: string }[] = [];

  try {
    const client = buildGenneraClient(settings, password);
    const payments = await client.getAllPayments();

    for (const payment of payments) {
      try {
        const title = await prisma.receivableTitle.findFirst({
          where: { tenantId, genneraInvoiceId: payment.invoiceId },
        });

        if (!title) {
          skipped++;
          details.push({ paymentId: payment.id, invoiceId: payment.invoiceId, status: "skipped_not_found" });
          continue;
        }

        if (title.situation === "RECEIVED") {
          skipped++;
          details.push({ paymentId: payment.id, invoiceId: payment.invoiceId, status: "skipped_already_received" });
          continue;
        }

        await prisma.receivableTitle.update({
          where: { id: title.id },
          data: {
            situation: "RECEIVED",
            currentBalance: 0,
            receivedAt: new Date(payment.paidAt),
            receivedBy: "GENNERA_SYNC",
            paymentMethod: payment.method === "PIX" ? "PIX" : payment.method === "BOLETO" ? "BANK_SLIP" : undefined,
          },
        });

        processed++;
        details.push({ paymentId: payment.id, invoiceId: payment.invoiceId, status: "marked_received" });
      } catch (err) {
        errors++;
        details.push({
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          status: "error",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "DONE",
        recordsTotal: payments.length,
        recordsCreated: 0,
        recordsUpdated: processed,
        recordsError: errors,
        details: details as any,
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      syncLogId: log.id,
      total: payments.length,
      processed,
      skipped,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "ERROR", errorMessage: message, finishedAt: new Date() },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
