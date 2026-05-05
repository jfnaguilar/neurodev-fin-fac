import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DATE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // ±3 dias

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tenantId = (session.user as any).currentTenantId as string;
  const body = await req.json().catch(() => ({}));
  const transactionId: string | undefined = body.transactionId;

  try {
    const txWhere = transactionId
      ? { id: transactionId, tenantId, reconciled: false }
      : { tenantId, reconciled: false };

    const transactions = await prisma.pluggyTransaction.findMany({ where: txWhere });

    let reconciledCount = 0;

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const from = new Date(txDate.getTime() - DATE_WINDOW_MS);
      const to = new Date(txDate.getTime() + DATE_WINDOW_MS);
      const absAmount = Math.abs(Number(tx.amount));

      // DEBIT: try PaymentTitle (paid)
      if (tx.type === "DEBIT") {
        const payTitle = await prisma.paymentTitle.findFirst({
          where: {
            tenantId,
            situation: "PAID",
            paidAt: { gte: from, lte: to },
            currentBalance: { lte: absAmount * 1.01, gte: absAmount * 0.99 },
          },
          select: { id: true },
        });

        if (payTitle) {
          await prisma.pluggyTransaction.update({
            where: { id: tx.id },
            data: { reconciled: true, titleId: payTitle.id, titleType: "PAYMENT" },
          });
          reconciledCount++;
          continue;
        }
      }

      // CREDIT: try ReceivableTitle (received)
      if (tx.type === "CREDIT") {
        const recTitle = await prisma.receivableTitle.findFirst({
          where: {
            tenantId,
            situation: "RECEIVED",
            receivedAt: { gte: from, lte: to },
            currentBalance: { lte: absAmount * 1.01, gte: absAmount * 0.99 },
          },
          select: { id: true },
        });

        if (recTitle) {
          await prisma.pluggyTransaction.update({
            where: { id: tx.id },
            data: { reconciled: true, titleId: recTitle.id, titleType: "RECEIVABLE" },
          });
          reconciledCount++;
        }
      }
    }

    return NextResponse.json({ reconciled: reconciledCount, total: transactions.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
