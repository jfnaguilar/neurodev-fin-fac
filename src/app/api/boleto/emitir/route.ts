import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitirBoleto } from "@/lib/boleto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const body = await req.json();
  const { receivableTitleId } = body;

  if (!receivableTitleId) {
    return NextResponse.json({ error: "receivableTitleId obrigatório" }, { status: 400 });
  }

  // Fetch title data to build boleto params
  const title = await prisma.receivableTitle.findFirst({
    where: { id: receivableTitleId, tenantId },
    include: { customer: true },
  });

  if (!title) return NextResponse.json({ error: "Título não encontrado" }, { status: 404 });

  // Check if there's already a pending boleto for this title
  const existing = await prisma.boletoEmission.findFirst({
    where: { receivableTitleId, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ error: "Já existe um boleto pendente para este título", boleto: existing }, { status: 409 });
  }

  try {
    const boleto = await emitirBoleto({
      tenantId,
      receivableTitleId,
      customer: {
        name: title.customer.name,
        email: title.customer.email ?? undefined,
        cpfCnpj: title.customer.document ?? "00000000000",
        phone: title.customer.phone ?? undefined,
      },
      amount: Number(title.currentBalance),
      dueDate: title.dueDate,
      description: `Título ${title.documentNumber ?? receivableTitleId} — ${title.customer.name}`,
    });

    return NextResponse.json(boleto, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao emitir boleto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
