import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitirNFe } from "@/lib/nfe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const body = await req.json();
  const { receivableTitleId, paymentTitleId, serviceDescription, asaasPaymentId } = body;

  if (!receivableTitleId && !paymentTitleId) {
    return NextResponse.json({ error: "Informe receivableTitleId ou paymentTitleId" }, { status: 400 });
  }

  let tomador = { name: "Consumidor Final", cpfCnpj: undefined as string | undefined };
  let amount = 0;

  if (receivableTitleId) {
    const title = await prisma.receivableTitle.findFirst({
      where: { id: receivableTitleId, tenantId },
      include: { customer: true },
    });
    if (!title) return NextResponse.json({ error: "Título a receber não encontrado" }, { status: 404 });
    tomador = {
      name: title.customer.name,
      cpfCnpj: title.customer.document ?? undefined,
    };
    amount = Number(title.originalValue);
  } else if (paymentTitleId) {
    const title = await prisma.paymentTitle.findFirst({
      where: { id: paymentTitleId, tenantId },
      include: { supplier: true },
    });
    if (!title) return NextResponse.json({ error: "Título a pagar não encontrado" }, { status: 404 });
    tomador = { name: title.supplier.name, cpfCnpj: title.supplier.document };
    amount = Number(title.originalValue);
  }

  try {
    const invoice = await emitirNFe({
      tenantId,
      receivableTitleId,
      paymentTitleId,
      serviceDescription: serviceDescription ?? "Serviço educacional",
      amount,
      tomador,
      asaasPaymentId,
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao emitir NF-e";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
