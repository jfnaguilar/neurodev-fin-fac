import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const account = await prisma.chartOfAccount.findFirst({ where: { id: params.id, tenantId } });
  if (!account) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { code, name, type, nature, parentId, isAnalytical, isActive } = await req.json();

  if (code && code !== account.code) {
    const dup = await prisma.chartOfAccount.findFirst({ where: { tenantId, code: code.trim(), id: { not: params.id } } });
    if (dup) return NextResponse.json({ error: "Código já cadastrado" }, { status: 409 });
  }

  const updated = await prisma.chartOfAccount.update({
    where: { id: params.id },
    data: {
      code: code?.trim() ?? account.code,
      name: name?.trim() ?? account.name,
      type: type ?? account.type,
      nature: nature ?? account.nature,
      parentId: parentId || null,
      isAnalytical: isAnalytical ?? account.isAnalytical,
      isActive: isActive ?? account.isActive,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const account = await prisma.chartOfAccount.findFirst({ where: { id: params.id, tenantId } });
  if (!account) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.chartOfAccount.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
