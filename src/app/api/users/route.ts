import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const tenantRoles = await prisma.userTenantRole.findMany({
    where: { tenantId },
    include: {
      user: {
        select: { id: true, name: true, email: true, mfaEnabled: true, isActive: true, lastLoginAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const data = tenantRoles.map(({ id: roleId, role, isActive: tenantIsActive, user }) => ({
    roleId,
    role,
    tenantIsActive,
    ...user,
  }));

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;
  const requesterRole = (session.user as any).role as string;
  if (requesterRole !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { name, email, role } = await req.json();
  if (!name?.trim() || !email?.trim() || !role) {
    return NextResponse.json({ error: "Nome, e-mail e perfil são obrigatórios" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase() },
    });
  }

  const existing = await prisma.userTenantRole.findFirst({ where: { userId: user.id, tenantId } });
  if (existing) {
    return NextResponse.json({ error: "Usuário já cadastrado neste tenant" }, { status: 409 });
  }

  const tenantRole = await prisma.userTenantRole.create({
    data: { userId: user.id, tenantId, role },
    include: { user: { select: { id: true, name: true, email: true, mfaEnabled: true, isActive: true, lastLoginAt: true } } },
  });

  return NextResponse.json({ data: { roleId: tenantRole.id, role: tenantRole.role, tenantIsActive: tenantRole.isActive, ...tenantRole.user } }, { status: 201 });
}
