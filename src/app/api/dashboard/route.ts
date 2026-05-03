import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId obrigatório" }, { status: 400 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const [
      totalPayables,
      weekPayables,
      monthPayables,
      totalReceivables,
      weekReceivables,
      monthReceivables,
      overduePayables,
      overdueReceivables,
    ] = await Promise.all([
      // Saldo total a pagar (liberados)
      prisma.paymentTitle.aggregate({
        where: { tenantId, situation: { in: ["RELEASED", "BANK"] } },
        _sum: { currentBalance: true },
      }),
      // Pagamentos semana
      prisma.paymentTitle.aggregate({
        where: { tenantId, situation: { in: ["RELEASED", "BANK"] }, dueDate: { gte: startOfWeek, lte: endOfWeek } },
        _sum: { currentBalance: true },
      }),
      // Pagamentos mês
      prisma.paymentTitle.aggregate({
        where: { tenantId, situation: { in: ["RELEASED", "BANK"] }, dueDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { currentBalance: true },
      }),
      // Saldo total a receber
      prisma.receivableTitle.aggregate({
        where: { tenantId, situation: { in: ["RELEASED"] } },
        _sum: { currentBalance: true },
      }),
      // Recebimentos semana
      prisma.receivableTitle.aggregate({
        where: { tenantId, situation: "RELEASED", dueDate: { gte: startOfWeek, lte: endOfWeek } },
        _sum: { currentBalance: true },
      }),
      // Recebimentos mês
      prisma.receivableTitle.aggregate({
        where: { tenantId, situation: "RELEASED", dueDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { currentBalance: true },
      }),
      // Vencidos a pagar
      prisma.paymentTitle.aggregate({
        where: { tenantId, situation: { in: ["RELEASED", "BANK"] }, dueDate: { lt: now } },
        _sum: { currentBalance: true },
      }),
      // Vencidos a receber
      prisma.receivableTitle.aggregate({
        where: { tenantId, situation: "RELEASED", dueDate: { lt: now } },
        _sum: { currentBalance: true },
      }),
    ]);

    const totalRec = Number(totalReceivables._sum.currentBalance ?? 0);
    const totalPay = Number(totalPayables._sum.currentBalance ?? 0);

    const summary = {
      currentBalance: totalRec - totalPay,
      weekReceivables: Number(weekReceivables._sum.currentBalance ?? 0),
      monthReceivables: Number(monthReceivables._sum.currentBalance ?? 0),
      weekPayables: Number(weekPayables._sum.currentBalance ?? 0),
      monthPayables: Number(monthPayables._sum.currentBalance ?? 0),
      netPosition: totalRec - totalPay,
      overduePayables: Number(overduePayables._sum.currentBalance ?? 0),
      overdueReceivables: Number(overdueReceivables._sum.currentBalance ?? 0),
    };

    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
