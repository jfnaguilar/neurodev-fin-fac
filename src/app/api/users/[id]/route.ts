import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;
  const requesterRole = (session.user as any).role as string;
  if (requesterRole !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { role, tenantIsActive } = await req.json();

  const tenantRole = await prisma.userTenantRole.findFirst({ where: { userId: params.id, tenantId } });
  if (!tenantRole) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const updated = await prisma.userTenantRole.update({
    where: { id: tenantRole.id },
    data: {
      role: role ?? tenantRole.role,
      isActive: tenantIsActive ?? tenantRole.isActive,
    },
    include: { user: { select: { id: true, name: true, email: true, mfaEnabled: true, isActive: true, lastLoginAt: true } } },
  });

  return NextResponse.json({ data: { roleId: updated.id, role: updated.role, tenantIsActive: updated.isActive, ...updated.user } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;
  const requesterRole = (session.user as any).role as string;
  if (requesterRole !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const tenantRole = await prisma.userTenantRole.findFirst({ where: { userId: params.id, tenantId } });
  if (!tenantRole) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.userTenantRole.update({ where: { id: tenantRole.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
