import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const supplierSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(2),
  tradeName: z.string().optional(),
  document: z.string().min(11),
  documentType: z.enum(["CNPJ", "CPF"]).default("CNPJ"),
  group: z.string().optional(),
  subgroup: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  bankAccounts: z.array(z.object({
    bankCode: z.string(),
    agency: z.string(),
    account: z.string(),
    type: z.string(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const search = searchParams.get("search");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId obrigatório" }, { status: 400 });
  }

  try {
    const where: Record<string, unknown> = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { document: { contains: search.replace(/\D/g, "") } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: suppliers, total: suppliers.length });
  } catch (error) {
    console.error("[GET /api/fornecedores]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = supplierSchema.parse(body);

    const existing = await prisma.supplier.findFirst({
      where: { tenantId: data.tenantId, document: data.document.replace(/\D/g, "") },
    });

    if (existing) {
      return NextResponse.json({ error: "CNPJ/CPF já cadastrado neste tenant" }, { status: 409 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        tradeName: data.tradeName,
        document: data.document.replace(/\D/g, ""),
        documentType: data.documentType,
        group: data.group,
        subgroup: data.subgroup,
        email: data.email,
        phone: data.phone,
        address: data.address,
        bankAccounts: data.bankAccounts ?? [],
      },
    });

    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 422 });
    }
    console.error("[POST /api/fornecedores]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
