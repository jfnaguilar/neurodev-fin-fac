import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sincronizarStatusBoleto, cancelarBoleto } from "@/lib/boleto";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const boleto = await prisma.boletoEmission.findFirst({
    where: { id: params.id, tenantId },
  });
  if (!boleto) return NextResponse.json({ error: "Boleto não encontrado" }, { status: 404 });

  // Auto-refresh status from provider
  try {
    const updated = await sincronizarStatusBoleto(params.id);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(boleto);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const boleto = await prisma.boletoEmission.findFirst({ where: { id: params.id, tenantId } });
  if (!boleto) return NextResponse.json({ error: "Boleto não encontrado" }, { status: 404 });
  if (boleto.status !== "PENDING") {
    return NextResponse.json({ error: "Apenas boletos pendentes podem ser cancelados" }, { status: 400 });
  }

  try {
    const updated = await cancelarBoleto(params.id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao cancelar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
