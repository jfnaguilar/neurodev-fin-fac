import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const group = await prisma.classGroup.findFirst({ where: { id: params.id, tenantId } });
  if (!group) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { code, name, course, period, teacherId, isActive } = await req.json();

  if (code && code !== group.code) {
    const dup = await prisma.classGroup.findFirst({ where: { tenantId, code: code.trim(), id: { not: params.id } } });
    if (dup) return NextResponse.json({ error: "Código já cadastrado" }, { status: 409 });
  }

  const updated = await prisma.classGroup.update({
    where: { id: params.id },
    data: {
      code: code?.trim() ?? group.code,
      name: name?.trim() ?? group.name,
      course: course?.trim() || group.course,
      period: period?.trim() || group.period,
      teacherId: teacherId || group.teacherId,
      isActive: isActive ?? group.isActive,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const group = await prisma.classGroup.findFirst({ where: { id: params.id, tenantId } });
  if (!group) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.classGroup.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
