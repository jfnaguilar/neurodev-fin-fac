import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = (session.user as any).currentTenantId as string;

  const connection = await prisma.pluggyConnection.findFirst({
    where: { id: params.id, tenantId },
  });

  if (!connection) {
    return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 });
  }

  await prisma.pluggyConnection.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
