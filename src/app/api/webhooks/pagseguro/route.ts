import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PagSeguro sends webhooks with a notification code; events are fetched via polling.
// Webhook body: { id, type, charges: [...] }

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const charges = (body.charges as Array<Record<string, unknown>>) ?? [];

  for (const charge of charges) {
    const externalId = charge.id as string;
    if (!externalId) continue;

    const boleto = await prisma.boletoEmission.findFirst({
      where: { externalId, provider: "PAGSEGURO" },
    });
    if (!boleto) continue;

    const rawStatus = (charge.status as string) ?? "";
    let status: string;
    let paidAt: Date | undefined;

    if (rawStatus === "PAID") {
      status = "PAID";
      paidAt = charge.paid_at ? new Date(charge.paid_at as string) : new Date();
    } else if (rawStatus === "CANCELED") {
      status = "CANCELLED";
    } else if (rawStatus === "DECLINED") {
      status = "EXPIRED";
    } else {
      continue;
    }

    await prisma.boletoEmission.update({
      where: { id: boleto.id },
      data: { status: status as any, paidAt: paidAt ?? null },
    });
  }

  return NextResponse.json({ received: true });
}
