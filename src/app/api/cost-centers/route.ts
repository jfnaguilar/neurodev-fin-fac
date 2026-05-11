import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";

  const centers = await prisma.costCenter.findMany({
    where: {
      tenantId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: { parent: { select: { id: true, code: true, name: true } } },
    orderBy: [{ code: "asc" }],
  });

  return NextResponse.json({ data: centers, total: centers.length });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const { code, name, type, parentId, isActive } = await req.json();
  if (!code?.trim() || !name?.trim()) return NextResponse.json({ error: "Código e nome obrigatórios" }, { status: 400 });

  const dup = await prisma.costCenter.findFirst({ where: { tenantId, code: code.trim() } });
  if (dup) return NextResponse.json({ error: "Código já cadastrado" }, { status: 409 });

  const center = await prisma.costCenter.create({
    data: { tenantId, code: code.trim(), name: name.trim(), type: type ?? "GENERAL", parentId: parentId || undefined, isActive: isActive ?? true },
  });

  return NextResponse.json({ data: center }, { status: 201 });
}
