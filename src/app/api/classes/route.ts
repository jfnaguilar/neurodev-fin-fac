import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";

  const classes = await prisma.classGroup.findMany({
    where: {
      tenantId,
      ...(search ? {
        OR: [
          { name:   { contains: search, mode: "insensitive" } },
          { code:   { contains: search, mode: "insensitive" } },
          { course: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: { teacher: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: classes, total: classes.length });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const { code, name, course, period, teacherId, isActive } = await req.json();
  if (!code?.trim() || !name?.trim()) return NextResponse.json({ error: "Código e nome obrigatórios" }, { status: 400 });

  const dup = await prisma.classGroup.findFirst({ where: { tenantId, code: code.trim() } });
  if (dup) return NextResponse.json({ error: "Código já cadastrado" }, { status: 409 });

  const classGroup = await prisma.classGroup.create({
    data: {
      tenantId,
      code: code.trim(),
      name: name.trim(),
      course: course?.trim() || undefined,
      period: period?.trim() || undefined,
      teacherId: teacherId || undefined,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({ data: classGroup }, { status: 201 });
}
