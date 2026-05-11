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
    data: { tenantId, provider: "GENNERA", syncType: "ALUNOS", status: "RUNNING" },
  });

  let created = 0;
  let updated = 0;
  let errors = 0;
  const details: { personId: number; name: string; status: string; error?: string }[] = [];

  try {
    const client = buildGenneraClient(settings, password);
    const persons = await client.getAllPersons();

    for (const person of persons) {
      try {
        const existing = await prisma.customer.findFirst({
          where: { tenantId, genneraPersonId: person.id },
        });

        const data = {
          name: person.name,
          document: person.document ?? undefined,
          documentType: person.document ? "CPF" : undefined,
          email: person.email ?? undefined,
          phone: person.phone ?? undefined,
          enrollmentId: person.ra ?? undefined,
          genneraPersonId: person.id,
          genneraUserId: person.userId ?? undefined,
          genneraLastSync: new Date(),
          isActive: person.isActive,
        };

        if (existing) {
          await prisma.customer.update({ where: { id: existing.id }, data });
          updated++;
          details.push({ personId: person.id, name: person.name, status: "updated" });
        } else {
          // Check if there's a customer with same enrollmentId (RA) to link
          const byRa = person.ra
            ? await prisma.customer.findFirst({ where: { tenantId, enrollmentId: person.ra } })
            : null;

          if (byRa) {
            await prisma.customer.update({ where: { id: byRa.id }, data });
            updated++;
            details.push({ personId: person.id, name: person.name, status: "linked" });
          } else {
            await prisma.customer.create({
              data: { tenantId, type: "STUDENT", ...data },
            });
            created++;
            details.push({ personId: person.id, name: person.name, status: "created" });
          }
        }
      } catch (err) {
        errors++;
        details.push({
          personId: person.id,
          name: person.name,
          status: "error",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "DONE",
        recordsTotal: persons.length,
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
      total: persons.length,
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
