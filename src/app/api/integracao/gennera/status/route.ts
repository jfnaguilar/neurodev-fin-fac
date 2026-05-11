import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { buildGenneraClient } from "@/lib/providers/gennera";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId, provider: "GENNERA" },
  });

  const settings = (cfg?.settings ?? {}) as Record<string, string>;
  const isConfigured = Boolean(cfg?.apiKeyEnc && settings.idInstitution && settings.username);

  let connectionOk: boolean | null = null;

  if (isConfigured && cfg?.isActive) {
    try {
      const password = decrypt(cfg.apiKeyEnc!);
      const client = buildGenneraClient(settings, password);
      const result = await client.testConnection();
      connectionOk = result.ok;
    } catch {
      connectionOk = false;
    }
  }

  // Last sync per type
  const lastSyncs = await prisma.syncLog.findMany({
    where: { tenantId, provider: "GENNERA", status: "DONE" },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  const lastSyncByType: Record<string, { at: Date; created: number; updated: number }> = {};
  for (const log of lastSyncs) {
    if (!lastSyncByType[log.syncType]) {
      lastSyncByType[log.syncType] = {
        at: log.startedAt,
        created: log.recordsCreated,
        updated: log.recordsUpdated,
      };
    }
  }

  // Summary counts
  const [customers, classes, receivable] = await Promise.all([
    prisma.customer.count({ where: { tenantId, genneraPersonId: { not: null } } }),
    prisma.classGroup.count({ where: { tenantId, genneraClassId: { not: null } } }),
    prisma.receivableTitle.count({ where: { tenantId, genneraInvoiceId: { not: null } } }),
  ]);

  // Recent sync logs
  const recentLogs = await prisma.syncLog.findMany({
    where: { tenantId, provider: "GENNERA" },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    isConfigured,
    isActive: cfg?.isActive ?? false,
    connectionOk,
    testedAt: cfg?.testedAt ?? null,
    settings: {
      idInstitution: settings.idInstitution ?? null,
      username: settings.username ?? null,
      cnpj: settings.cnpj ?? null,
      autoSyncEnabled: settings.autoSyncEnabled ?? "false",
      delinquencyDaysThreshold: settings.delinquencyDaysThreshold ?? "30",
    },
    counts: { customers, classes, receivable },
    lastSyncByType,
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      syncType: l.syncType,
      status: l.status,
      recordsTotal: l.recordsTotal,
      recordsCreated: l.recordsCreated,
      recordsUpdated: l.recordsUpdated,
      recordsError: l.recordsError,
      errorMessage: l.errorMessage,
      startedAt: l.startedAt,
      finishedAt: l.finishedAt,
    })),
  });
}
