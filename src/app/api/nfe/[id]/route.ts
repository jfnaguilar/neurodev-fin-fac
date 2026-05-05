import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sincronizarStatusNFe, cancelarNFe } from "@/lib/nfe";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const inv = await prisma.invoiceEmission.findFirst({ where: { id: params.id, tenantId } });
  if (!inv) return NextResponse.json({ error: "NF-e não encontrada" }, { status: 404 });

  if (inv.status === "PROCESSING") {
    try {
      const updated = await sincronizarStatusNFe(params.id);
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json(inv);
    }
  }
  return NextResponse.json(inv);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const inv = await prisma.invoiceEmission.findFirst({ where: { id: params.id, tenantId } });
  if (!inv) return NextResponse.json({ error: "NF-e não encontrada" }, { status: 404 });
  if (!["PROCESSING", "ISSUED"].includes(inv.status)) {
    return NextResponse.json({ error: "NF-e não pode ser cancelada neste status" }, { status: 400 });
  }

  try {
    const updated = await cancelarNFe(params.id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao cancelar NF-e";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
