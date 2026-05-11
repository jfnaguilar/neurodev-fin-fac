import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const center = await prisma.costCenter.findFirst({ where: { id: params.id, tenantId } });
  if (!center) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { code, name, type, parentId, isActive } = await req.json();

  if (code && code !== center.code) {
    const dup = await prisma.costCenter.findFirst({ where: { tenantId, code: code.trim(), id: { not: params.id } } });
    if (dup) return NextResponse.json({ error: "Código já cadastrado" }, { status: 409 });
  }

  const updated = await prisma.costCenter.update({
    where: { id: params.id },
    data: {
      code: code?.trim() ?? center.code,
      name: name?.trim() ?? center.name,
      type: type ?? center.type,
      parentId: parentId || null,
      isActive: isActive ?? center.isActive,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const center = await prisma.costCenter.findFirst({ where: { id: params.id, tenantId } });
  if (!center) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.costCenter.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
