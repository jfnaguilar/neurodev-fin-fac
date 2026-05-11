import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Abacate Pay webhook events:
// billing.paid, billing.expired, billing.cancelled

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string;
  const billing = (body.data as Record<string, unknown>) ?? {};
  const externalId = (billing.id ?? billing._id) as string;

  if (!externalId) {
    return NextResponse.json({ received: true });
  }

  const boleto = await prisma.boletoEmission.findFirst({
    where: { externalId, provider: "ABACATE" },
  });
  if (!boleto) {
    return NextResponse.json({ received: true });
  }

  let status: string | null = null;
  let paidAt: Date | undefined;

  if (event === "billing.paid") {
    status = "PAID";
    paidAt = billing.updatedAt ? new Date(billing.updatedAt as string) : new Date();
  } else if (event === "billing.expired") {
    status = "EXPIRED";
  } else if (event === "billing.cancelled") {
    status = "CANCELLED";
  }

  if (status) {
    await prisma.boletoEmission.update({
      where: { id: boleto.id },
      data: { status: status as any, paidAt: paidAt ?? null },
    });
  }

  return NextResponse.json({ received: true });
}
