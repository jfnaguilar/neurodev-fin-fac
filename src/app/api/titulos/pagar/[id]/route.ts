import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const title = await prisma.paymentTitle.findFirst({ where: { id: params.id, tenantId } });
  if (!title) return NextResponse.json({ error: "Título não encontrado" }, { status: 404 });

  const { situation, paymentDate, paymentMethod, observation } = await req.json();

  const newSituation = situation ?? title.situation;

  let newBalance: number | typeof title.currentBalance = title.currentBalance;
  let paidAt = title.paidAt;

  if (newSituation === "PAID") {
    newBalance = 0;
    paidAt = paymentDate ? new Date(paymentDate) : new Date();
  } else if (newSituation === "CANCELED") {
    newBalance = 0;
    paidAt = null;
  } else if (newSituation === "RELEASED" && (title.situation === "PAID" || title.situation === "CANCELED")) {
    newBalance = title.originalValue;
    paidAt = null;
  }

  const updated = await prisma.paymentTitle.update({
    where: { id: params.id },
    data: {
      situation: newSituation,
      paidAt,
      paymentMethod: paymentMethod ?? title.paymentMethod,
      currentBalance: newBalance,
      observation: observation ?? title.observation,
      cancelReason: newSituation === "CANCELED" ? (observation ?? null) : title.cancelReason,
      canceledAt: newSituation === "CANCELED" ? new Date() : title.canceledAt,
    },
  });

  return NextResponse.json({ data: updated });
}
