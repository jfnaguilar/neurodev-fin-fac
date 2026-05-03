import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const action = searchParams.get("action");
  const tableName = searchParams.get("tableName");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId obrigatório" }, { status: 400 });
  }

  try {
    const where: Record<string, unknown> = { tenantId };
    if (action) where.action = action;
    if (tableName) where.tableName = tableName;
    if (from || to) {
      where.changedAt = {};
      if (from) (where.changedAt as Record<string, Date>).gte = new Date(from);
      if (to) (where.changedAt as Record<string, Date>).lte = new Date(to + "T23:59:59");
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { changedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ data: logs, total, page, limit });
  } catch (error) {
    console.error("[GET /api/auditoria]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
