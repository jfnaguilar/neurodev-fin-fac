import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const existing = await prisma.customer.findFirst({ where: { id: params.id, tenantId } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, type, enrollmentId, document, documentType, email, phone, address, responsibleId, isActive } = body;

  // Check enrollmentId uniqueness (if changed)
  if (enrollmentId && enrollmentId !== existing.enrollmentId) {
    const dup = await prisma.customer.findFirst({ where: { tenantId, enrollmentId, id: { not: params.id } } });
    if (dup) return NextResponse.json({ error: "Matrícula já cadastrada" }, { status: 409 });
  }

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: {
      ...(name        !== undefined ? { name: name.trim() }                              : {}),
      ...(type        !== undefined ? { type }                                           : {}),
      ...(enrollmentId !== undefined ? { enrollmentId: enrollmentId?.trim() || null }   : {}),
      ...(document    !== undefined ? { document: document?.replace(/\D/g, "") || null } : {}),
      ...(documentType !== undefined ? { documentType }                                  : {}),
      ...(email       !== undefined ? { email: email?.trim() || null }                  : {}),
      ...(phone       !== undefined ? { phone: phone?.trim() || null }                  : {}),
      ...(address     !== undefined ? { address }                                        : {}),
      ...(responsibleId !== undefined ? { responsibleId: responsibleId || null }        : {}),
      ...(isActive    !== undefined ? { isActive }                                       : {}),
    },
    include: { responsible: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ data: customer });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const existing = await prisma.customer.findFirst({ where: { id: params.id, tenantId } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Soft-delete: mark inactive
  await prisma.customer.update({ where: { id: params.id }, data: { isActive: false } });

  return NextResponse.json({ ok: true });
}
