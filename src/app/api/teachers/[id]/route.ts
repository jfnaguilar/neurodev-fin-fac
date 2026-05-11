import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const teacher = await prisma.teacher.findFirst({ where: { id: params.id, tenantId } });
  if (!teacher) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { name, document, email, phone, isActive } = await req.json();
  const updated = await prisma.teacher.update({
    where: { id: params.id },
    data: {
      name: name?.trim() ?? teacher.name,
      document: document?.replace(/\D/g, "") || teacher.document,
      email: email?.trim() || teacher.email,
      phone: phone?.trim() || teacher.phone,
      isActive: isActive ?? teacher.isActive,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const teacher = await prisma.teacher.findFirst({ where: { id: params.id, tenantId } });
  if (!teacher) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.teacher.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
