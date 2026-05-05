import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tenantId = (session.user as any).currentTenantId as string;
  const { searchParams } = new URL(req.url);

  const accountId = searchParams.get("accountId") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const reconciled = searchParams.get("reconciled");
  const type = searchParams.get("type") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(200, Number(searchParams.get("pageSize") ?? "50"));

  try {
    const where: Record<string, unknown> = { tenantId };

    if (accountId) {
      where.accountId = accountId;
    } else {
      // Only return transactions for accounts belonging to this tenant
      const accounts = await prisma.pluggyAccount.findMany({
        where: { tenantId },
        select: { id: true },
      });
      where.accountId = { in: accounts.map((a) => a.id) };
    }

    if (from || to) {
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
      };
    }
    if (reconciled !== null && reconciled !== undefined && reconciled !== "") {
      where.reconciled = reconciled === "true";
    }
    if (type) where.type = type;

    const [total, transactions] = await Promise.all([
      prisma.pluggyTransaction.count({ where }),
      prisma.pluggyTransaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          account: {
            select: { id: true, name: true, pluggyId: true, connection: { select: { bankName: true } } },
          },
        },
      }),
    ]);

    return NextResponse.json({ transactions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch {
    return NextResponse.json({ transactions: [], total: 0, page: 1, pageSize, totalPages: 0 });
  }
}
