import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sincronizarStatusPix, cancelarPix } from "@/lib/pix";

// GET — fetch current status (refreshes from Asaas)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  try {
    const pix = await sincronizarStatusPix(params.id);
    if (pix.tenantId !== tenantId) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json(pix);
  } catch (err: unknown) {
    // If not found, try returning stored record without sync
    try {
      const stored = await prisma.pixEmission.findUnique({ where: { id: params.id } });
      if (!stored || stored.tenantId !== tenantId) {
        return NextResponse.json({ error: "PIX não encontrado" }, { status: 404 });
      }
      return NextResponse.json(stored);
    } catch {
      const message = err instanceof Error ? err.message : "Erro";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}

// DELETE — cancel pending PIX
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  try {
    const pix = await prisma.pixEmission.findUnique({ where: { id: params.id } });
    if (!pix || pix.tenantId !== tenantId) {
      return NextResponse.json({ error: "PIX não encontrado" }, { status: 404 });
    }
    if (pix.status !== "PENDING") {
      return NextResponse.json({ error: "Apenas PIX pendente pode ser cancelado" }, { status: 422 });
    }

    const updated = await cancelarPix(params.id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao cancelar PIX";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
