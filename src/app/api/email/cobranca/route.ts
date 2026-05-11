import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enviarCobrancaPorEmail, CobrancaEmailType } from "@/lib/cobranca-email";

const VALID_TYPES: CobrancaEmailType[] = ["BOLETO", "PIX", "NF"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;
  const tenantName = (session.user as any).currentTenantName as string ?? "NeuroDev FIN";

  try {
    const body = await req.json();
    const { type, documentId, to, replyTo } = body;

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "type deve ser BOLETO, PIX ou NF" }, { status: 400 });
    }
    if (!documentId || !to) {
      return NextResponse.json({ error: "documentId e to são obrigatórios" }, { status: 400 });
    }

    // Validate email belongs to this tenant
    const isOwner = await validateOwnership(tenantId, type, documentId);
    if (!isOwner) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    await enviarCobrancaPorEmail({ tenantId, tenantName, type, documentId, to, replyTo });

    return NextResponse.json({ ok: true, sentTo: to });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao enviar e-mail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function validateOwnership(
  tenantId: string,
  type: CobrancaEmailType,
  documentId: string
): Promise<boolean> {
  if (type === "BOLETO") {
    const r = await prisma.boletoEmission.findFirst({ where: { id: documentId, tenantId } });
    return Boolean(r);
  }
  if (type === "PIX") {
    const r = await prisma.pixEmission.findFirst({ where: { id: documentId, tenantId } });
    return Boolean(r);
  }
  const r = await prisma.invoiceEmission.findFirst({ where: { id: documentId, tenantId } });
  return Boolean(r);
}
