import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const type   = url.searchParams.get("type") ?? "ALL";

  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      ...(type !== "ALL" ? { type: type as any } : {}),
      ...(search ? {
        OR: [
          { name:         { contains: search, mode: "insensitive" } },
          { enrollmentId: { contains: search, mode: "insensitive" } },
          { document:     { contains: search } },
          { email:        { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      responsible: { select: { id: true, name: true, document: true, email: true, phone: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: customers, total: customers.length });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const body = await req.json();
  const { name, type, enrollmentId, document, documentType, email, phone, address, responsibleId, isActive } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  // Check unique enrollmentId within tenant
  if (enrollmentId) {
    const dup = await prisma.customer.findFirst({ where: { tenantId, enrollmentId } });
    if (dup) return NextResponse.json({ error: "Matrícula já cadastrada" }, { status: 409 });
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId,
      name: name.trim(),
      type: type ?? "STUDENT",
      enrollmentId: enrollmentId?.trim() || undefined,
      document: document?.replace(/\D/g, "") || undefined,
      documentType: documentType ?? "CPF",
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address ?? undefined,
      responsibleId: responsibleId || undefined,
      isActive: isActive ?? true,
    },
    include: { responsible: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ data: customer }, { status: 201 });
}
