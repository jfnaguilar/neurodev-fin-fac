import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const title = await prisma.receivableTitle.findFirst({ where: { id: params.id, tenantId } });
  if (!title) return NextResponse.json({ error: "Título não encontrado" }, { status: 404 });

  const { situation, receiptDate, paymentMethod, observation } = await req.json();

  const newSituation = situation ?? title.situation;

  let newBalance: number | typeof title.currentBalance = title.currentBalance;
  let receivedAt = title.receivedAt;

  if (newSituation === "RECEIVED") {
    newBalance = 0;
    receivedAt = receiptDate ? new Date(receiptDate) : new Date();
  } else if (newSituation === "CANCELED") {
    newBalance = 0;
    receivedAt = null;
  } else if (newSituation === "RELEASED" && (title.situation === "RECEIVED" || title.situation === "CANCELED")) {
    newBalance = title.originalValue;
    receivedAt = null;
  }

  const updated = await prisma.receivableTitle.update({
    where: { id: params.id },
    data: {
      situation: newSituation,
      receivedAt,
      paymentMethod: paymentMethod ?? title.paymentMethod,
      currentBalance: newBalance,
      observation: observation ?? title.observation,
      canceledAt: newSituation === "CANCELED" ? new Date() : title.canceledAt,
    },
  });

  return NextResponse.json({ data: updated });
}
