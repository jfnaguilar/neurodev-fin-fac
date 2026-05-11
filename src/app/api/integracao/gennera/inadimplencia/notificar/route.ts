// Flags delinquent students in Gennera based on overdue ReceivableTitles.
// Uses the configurable delinquencyDaysThreshold setting (default 30 days).
// PATCH /institutions/{id}/enrollments/{enrollmentId} with { isDelinquent: true/false }

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { buildGenneraClient } from "@/lib/providers/gennera";
import { differenceInDays } from "date-fns";

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
  const threshold = parseInt(settings.delinquencyDaysThreshold ?? "30", 10);

  const log = await prisma.syncLog.create({
    data: { tenantId, provider: "GENNERA", syncType: "INADIMPLENCIA_NOTIFICAR", status: "RUNNING" },
  });

  let flagged = 0;
  let cleared = 0;
  let errors = 0;
  const details: { personId: number; enrollmentId: number; status: string; error?: string }[] = [];

  try {
    const client = buildGenneraClient(settings, password);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find overdue titles with Gennera link
    const overdueTitles = await prisma.receivableTitle.findMany({
      where: {
        tenantId,
        genneraInvoiceId: { not: null },
        currentBalance: { gt: 0 },
        dueDate: { lt: today },
        situation: { in: ["OVERDUE", "RELEASED"] },
      },
      include: { customer: true },
    });

    // Group by customer, find max days overdue per customer
    const delinquentCustomerIds = new Set<string>();
    const customerEnrollments = new Map<string, number>(); // customerId → genneraEnrollmentId

    for (const title of overdueTitles) {
      const days = differenceInDays(today, title.dueDate);
      if (days >= threshold) {
        delinquentCustomerIds.add(title.customerId);
      }
    }

    // Get Gennera enrollments to find enrollmentId per person
    const enrollments = await client.getAllEnrollments();
    const enrollmentByPersonId = new Map<number, number>();
    for (const en of enrollments) {
      if (!enrollmentByPersonId.has(en.personId)) {
        enrollmentByPersonId.set(en.personId, en.id);
      }
    }

    // Get all customers synced from Gennera
    const syncedCustomers = await prisma.customer.findMany({
      where: { tenantId, genneraPersonId: { not: null } },
      select: { id: true, genneraPersonId: true },
    });

    for (const customer of syncedCustomers) {
      if (!customer.genneraPersonId) continue;
      const enrollmentId = enrollmentByPersonId.get(customer.genneraPersonId);
      if (!enrollmentId) continue;

      const isDelinquent = delinquentCustomerIds.has(customer.id);

      try {
        await client.updateEnrollmentDelinquency(enrollmentId, isDelinquent);
        if (isDelinquent) {
          flagged++;
          details.push({ personId: customer.genneraPersonId, enrollmentId, status: "flagged" });
        } else {
          cleared++;
          details.push({ personId: customer.genneraPersonId, enrollmentId, status: "cleared" });
        }
      } catch (err) {
        errors++;
        details.push({
          personId: customer.genneraPersonId,
          enrollmentId,
          status: "error",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "DONE",
        recordsTotal: syncedCustomers.length,
        recordsCreated: 0,
        recordsUpdated: flagged + cleared,
        recordsError: errors,
        details: details as any,
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      syncLogId: log.id,
      flagged,
      cleared,
      errors,
      threshold,
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
