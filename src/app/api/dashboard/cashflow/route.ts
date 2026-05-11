// Returns monthly cash flow (realized + projected) from real title data
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const today = new Date();
  // 6 months past + current + 5 months future = 12 periods
  const months: { start: Date; end: Date; label: string; projecao: boolean }[] = [];
  for (let i = -6; i <= 5; i++) {
    const d = i < 0 ? subMonths(today, -i) : addMonths(today, i);
    months.push({
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, "MMM/yy", { locale: ptBR }),
      projecao: i > 0,
    });
  }

  const data = await Promise.all(
    months.map(async ({ start, end, label, projecao }) => {
      const [entradas, saidas] = await Promise.all([
        prisma.receivableTitle.aggregate({
          where: { tenantId, dueDate: { gte: start, lte: end }, situation: { not: "CANCELED" } },
          _sum: { originalValue: true },
        }),
        prisma.paymentTitle.aggregate({
          where: { tenantId, dueDate: { gte: start, lte: end }, situation: { not: "CANCELED" } },
          _sum: { originalValue: true },
        }),
      ]);
      return {
        period: label,
        entradas: Number(entradas._sum.originalValue ?? 0),
        saidas:   Number(saidas._sum.originalValue ?? 0),
        projecao,
      };
    })
  );

  return NextResponse.json({ data });
}
