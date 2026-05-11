import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { emitirPix } from "@/lib/pix";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  try {
    const body = await req.json();
    const { receivableTitleId, customer, amount, dueDate, description } = body;

    if (!receivableTitleId || !customer?.cpfCnpj || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Campos obrigatórios: receivableTitleId, customer.cpfCnpj, amount, dueDate" },
        { status: 400 }
      );
    }

    const pix = await emitirPix({
      tenantId,
      receivableTitleId,
      customer,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      description: description ?? "Cobrança PIX",
    });

    return NextResponse.json(pix, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao emitir PIX";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
