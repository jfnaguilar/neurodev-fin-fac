import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES } from "@/lib/email-render";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const saved = await prisma.emailTemplate.findMany({ where: { tenantId } });

  const result: Record<string, { subject: string; body: string; isCustom: boolean }> = {};
  for (const type of ["BOLETO", "PIX", "NF"] as const) {
    const found = saved.find((t) => t.type === type);
    result[type] = found
      ? { subject: found.subject, body: found.body, isCustom: true }
      : { ...DEFAULT_TEMPLATES[type], isCustom: false };
  }

  return NextResponse.json(result);
}
