import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const supplier = await prisma.supplier.findFirst({ where: { id: params.id, tenantId } });
  if (!supplier) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      name: body.name ?? supplier.name,
      tradeName: body.tradeName,
      document: body.document ? body.document.replace(/\D/g, "") : supplier.document,
      group: body.group,
      subgroup: body.subgroup,
      email: body.email,
      phone: body.phone,
      isActive: body.isActive ?? supplier.isActive,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const supplier = await prisma.supplier.findFirst({ where: { id: params.id, tenantId } });
  if (!supplier) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.supplier.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
