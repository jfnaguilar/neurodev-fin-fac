import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getItem, getAccounts } from "@/lib/pluggy";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = (session.user as any).currentTenantId as string;

  try {
    const connections = await prisma.pluggyConnection.findMany({
      where: { tenantId },
      include: { accounts: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(connections);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = (session.user as any).currentTenantId as string;
  const { itemId } = await req.json();

  if (!itemId) {
    return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });
  }

  try {
    const item = await getItem(itemId);

    const connection = await prisma.pluggyConnection.upsert({
      where: { itemId },
      create: {
        tenantId,
        itemId,
        connectorId: item.connector.id,
        bankName: item.connector.name,
        status: item.status,
        error: item.error?.message ?? null,
        lastSync: new Date(),
      },
      update: {
        status: item.status,
        error: item.error?.message ?? null,
        lastSync: new Date(),
        bankName: item.connector.name,
      },
    });

    const accounts = await getAccounts(itemId);

    await Promise.all(
      accounts.map((acc) =>
        prisma.pluggyAccount.upsert({
          where: { pluggyId: acc.id },
          create: {
            connectionId: connection.id,
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
            name: acc.name,
            bankData: (acc.bankData as object) ?? {},
            syncedAt: new Date(),
          },
        })
      )
    );

    const result = await prisma.pluggyConnection.findUnique({
      where: { id: connection.id },
      include: { accounts: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
