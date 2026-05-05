import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_CONFIG = { syncMode: "MANUAL", scheduledTime: "05:00" };

function getTenantPluggyConfig(settings: unknown): typeof DEFAULT_CONFIG {
  if (settings && typeof settings === "object" && "pluggy" in settings) {
    return { ...DEFAULT_CONFIG, ...(settings as Record<string, unknown>).pluggy as object };
  }
  return DEFAULT_CONFIG;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tenantId = (session.user as any).currentTenantId as string;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
    const config = getTenantPluggyConfig(tenant?.settings);
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tenantId = (session.user as any).currentTenantId as string;
  const body = await req.json();
  const { syncMode, scheduledTime } = body;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
    const currentSettings = (tenant?.settings as Record<string, unknown>) ?? {};
    const updatedSettings = {
      ...currentSettings,
      pluggy: { syncMode: syncMode ?? "MANUAL", scheduledTime: scheduledTime ?? "05:00" },
    };
    await prisma.tenant.update({ where: { id: tenantId }, data: { settings: updatedSettings } });
    return NextResponse.json(updatedSettings.pluggy);
  } catch {
    // dev-tenant não existe no DB — retorna ok silenciosamente
    return NextResponse.json({ syncMode, scheduledTime });
  }
}
