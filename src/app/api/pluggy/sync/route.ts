import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getItem, getAccounts, getTransactions } from "@/lib/pluggy";
import { format, subDays } from "date-fns";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = (session.user as any).currentTenantId as string;
  const body = await req.json().catch(() => ({}));
  const connectionId: string | undefined = body.connectionId;

  const where = connectionId
    ? { id: connectionId, tenantId }
    : { tenantId };

  const connections = await prisma.pluggyConnection.findMany({ where });

  if (connections.length === 0) {
    return NextResponse.json({ error: "Nenhuma conexão encontrada" }, { status: 404 });
  }

  const results: { connectionId: string; accounts: number; transactions: number; error?: string }[] = [];

  for (const conn of connections) {
    try {
      const item = await getItem(conn.itemId);

      await prisma.pluggyConnection.update({
        where: { id: conn.id },
        data: {
          status: item.status,
          error: item.error?.message ?? null,
          lastSync: new Date(),
        },
      });

      if (item.status !== "UPDATED" && item.status !== "UPDATING") {
        results.push({ connectionId: conn.id, accounts: 0, transactions: 0, error: `Item status: ${item.status}` });
        continue;
      }

      const accounts = await getAccounts(conn.itemId);

      await Promise.all(
        accounts.map((acc) =>
          prisma.pluggyAccount.upsert({
            where: { pluggyId: acc.id },
            create: {
              connectionId: conn.id,
              tenantId,
              pluggyId: acc.id,
              name: acc.name,
              number: acc.number ?? null,
              bankData: (acc.bankData as object) ?? {},
              type: acc.type,
              subtype: acc.subtype ?? null,
              currencyCode: acc.currencyCode ?? "BRL",
              balance: acc.balance,
              syncedAt: new Date(),
            },
            update: {
              balance: acc.balance,
              bankData: (acc.bankData as object) ?? {},
              syncedAt: new Date(),
            },
          })
        )
      );

      const savedAccounts = await prisma.pluggyAccount.findMany({
        where: { connectionId: conn.id },
      });

      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 90), "yyyy-MM-dd");

      let txCount = 0;

      for (const acc of savedAccounts) {
        const transactions = await getTransactions(acc.pluggyId, from, to);

        for (const tx of transactions) {
          await prisma.pluggyTransaction.upsert({
            where: { pluggyId: tx.id },
            create: {
              accountId: acc.id,
              tenantId,
              pluggyId: tx.id,
              date: new Date(tx.date),
              description: tx.description,
              amount: tx.amount,
              type: tx.type,
              category: tx.category ?? null,
              bankData: undefined,
            },
            update: {
              description: tx.description,
              amount: tx.amount,
              category: tx.category ?? null,
            },
          });
          txCount++;
        }
      }

      results.push({ connectionId: conn.id, accounts: accounts.length, transactions: txCount });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      results.push({ connectionId: conn.id, accounts: 0, transactions: 0, error: message });
    }
  }

  return NextResponse.json({ results });
}
