import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES } from "@/lib/email-render";

const VALID_TYPES = ["BOLETO", "PIX", "NF"] as const;
type TemplateType = typeof VALID_TYPES[number];

export async function PUT(
  req: Request,
  { params }: { params: { type: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.currentTenantId as string;
  const userId = user.id as string;

  const type = params.type.toUpperCase() as TemplateType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const body = await req.json();
  const subject: string = (body.subject ?? "").trim();
  const html: string = (body.body ?? "").trim();

  if (!subject || !html) {
    return NextResponse.json({ error: "Assunto e corpo são obrigatórios" }, { status: 422 });
  }

  const template = await prisma.emailTemplate.upsert({
    where: { tenantId_type: { tenantId, type } },
    create: { tenantId, type, subject, body: html, updatedBy: userId },
    update: { subject, body: html, updatedBy: userId },
  });

  return NextResponse.json({ id: template.id, type, subject, isCustom: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { type: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tenantId = (session.user as any).currentTenantId as string;
  const type = params.type.toUpperCase() as TemplateType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  await prisma.emailTemplate.deleteMany({ where: { tenantId, type } });

  return NextResponse.json({ ...DEFAULT_TEMPLATES[type], isCustom: false });
}
