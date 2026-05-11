// Syncs Gennera contracts + invoices → ReceivableTitle
// Strategy: for each active invoice in Gennera, upsert a ReceivableTitle
// linked to the Customer by genneraPersonId.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { buildGenneraClient, GenneraInvoice } from "@/lib/providers/gennera";

function invoiceStatusToSituation(status: string): string {
  switch (status.toUpperCase()) {
    case "PAID":      return "RECEIVED";
    case "CANCELLED": return "CANCELED";
    case "OVERDUE":   return "OVERDUE";
    default:          return "RELEASED";
  }
}

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
    data: { tenantId, provider: "GENNERA", syncType: "MATRICULAS", status: "RUNNING" },
  });

  let created = 0;
  let updated = 0;
  let errors = 0;
  const details: { invoiceId: number; status: string; error?: string }[] = [];

  try {
    const client = buildGenneraClient(settings, password);

    // Fetch all invoices from Gennera
    const invoices: GenneraInvoice[] = await client.getAllInvoices();

    // Build a map personId → customer.id for quick lookup
    const personCustomerMap = new Map<number, string>();
    const allCustomers = await prisma.customer.findMany({
      where: { tenantId, genneraPersonId: { not: null } },
      select: { id: true, genneraPersonId: true },
    });
    for (const c of allCustomers) {
      if (c.genneraPersonId) personCustomerMap.set(c.genneraPersonId, c.id);
    }

    for (const inv of invoices) {
      try {
        const customerId = personCustomerMap.get(inv.personId);
        if (!customerId) {
          errors++;
          details.push({ invoiceId: inv.id, status: "error", error: `Person ${inv.personId} não encontrado — sincronize alunos primeiro` });
          continue;
        }

        const situation = invoiceStatusToSituation(inv.status) as any;
        const dueDate = new Date(inv.dueDate);
        const value = inv.value;

        const existing = await prisma.receivableTitle.findFirst({
          where: { tenantId, genneraInvoiceId: inv.id },
        });

        if (existing) {
          await prisma.receivableTitle.update({
            where: { id: existing.id },
            data: {
              dueDate,
              originalValue: value,
              currentBalance: inv.paymentDate ? 0 : value,
              situation,
              receivedAt: inv.paymentDate ? new Date(inv.paymentDate) : null,
              genneraContractId: inv.contractId,
            },
          });
          updated++;
          details.push({ invoiceId: inv.id, status: "updated" });
        } else {
          const installmentNum = inv.installmentNumber ?? 1;
          await prisma.receivableTitle.create({
            data: {
              tenantId,
              customerId,
              documentType: "ENROLLMENT",
              documentNumber: `GEN-${inv.contractId}-${installmentNum}`,
              emissionDate: new Date(),
              dueDate,
              originalValue: value,
              currentBalance: inv.paymentDate ? 0 : value,
              situation,
              observation: inv.description ?? undefined,
              receivedAt: inv.paymentDate ? new Date(inv.paymentDate) : null,
              genneraInvoiceId: inv.id,
              genneraContractId: inv.contractId,
              createdBy: "GENNERA_SYNC",
            },
          });
          created++;
          details.push({ invoiceId: inv.id, status: "created" });
        }
      } catch (err) {
        errors++;
        details.push({
          invoiceId: inv.id,
          status: "error",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "DONE",
        recordsTotal: invoices.length,
        recordsCreated: created,
        recordsUpdated: updated,
        recordsError: errors,
        details: details as any,
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      syncLogId: log.id,
      total: invoices.length,
      created,
      updated,
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
