import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";

  const teachers = await prisma.teacher.findMany({
    where: {
      tenantId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: teachers, total: teachers.length });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const { name, document, email, phone } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const teacher = await prisma.teacher.create({
    data: {
      tenantId,
      name: name.trim(),
      document: document?.replace(/\D/g, "") || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
    },
  });

  return NextResponse.json({ data: teacher }, { status: 201 });
}
