import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";

  const accounts = await prisma.chartOfAccount.findMany({
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

  return NextResponse.json({ data: accounts, total: accounts.length });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const { code, name, type, nature, parentId, isAnalytical, isActive } = await req.json();
  if (!code?.trim() || !name?.trim()) return NextResponse.json({ error: "Código e nome obrigatórios" }, { status: 400 });

  const dup = await prisma.chartOfAccount.findFirst({ where: { tenantId, code: code.trim() } });
  if (dup) return NextResponse.json({ error: "Código já cadastrado" }, { status: 409 });

  const account = await prisma.chartOfAccount.create({
    data: {
      tenantId,
      code: code.trim(),
      name: name.trim(),
      type: type ?? "EXPENSE",
      nature: nature ?? "DEBIT",
      parentId: parentId || undefined,
      isAnalytical: isAnalytical ?? true,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({ data: account }, { status: 201 });
}
