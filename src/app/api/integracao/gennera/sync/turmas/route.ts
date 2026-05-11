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
    data: { tenantId, provider: "GENNERA", syncType: "TURMAS", status: "RUNNING" },
  });

  let created = 0;
  let updated = 0;
  let errors = 0;
  const details: { offerId: number; name: string; status: string; error?: string }[] = [];

  try {
    const client = buildGenneraClient(settings, password);
    const offers = await client.getAllCurriculumOffers();

    for (const offer of offers) {
      try {
        const existing = await prisma.classGroup.findFirst({
          where: { tenantId, genneraClassId: offer.id },
        });

        const data = {
          name: offer.name,
          course: offer.course ?? undefined,
          period: offer.period ?? undefined,
          genneraClassId: offer.id,
          isActive: offer.isActive,
        };

        if (existing) {
          await prisma.classGroup.update({ where: { id: existing.id }, data });
          updated++;
          details.push({ offerId: offer.id, name: offer.name, status: "updated" });
        } else {
          // Try to find by code first
          const byCode = await prisma.classGroup.findFirst({
            where: { tenantId, code: offer.code },
          });

          if (byCode) {
            await prisma.classGroup.update({ where: { id: byCode.id }, data });
            updated++;
            details.push({ offerId: offer.id, name: offer.name, status: "linked" });
          } else {
            await prisma.classGroup.create({
              data: { tenantId, code: offer.code, ...data },
            });
            created++;
            details.push({ offerId: offer.id, name: offer.name, status: "created" });
          }
        }
      } catch (err) {
        errors++;
        details.push({
          offerId: offer.id,
          name: offer.name,
          status: "error",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "DONE",
        recordsTotal: offers.length,
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
      total: offers.length,
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
