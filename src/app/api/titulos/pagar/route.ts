import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTitleSchema = z.object({
  tenantId: z.string(),
  supplierId: z.string(),
  contractId: z.string().optional(),
  documentType: z.enum(["CONTRACT", "ENROLLMENT", "REENROLLMENT", "INVOICE_IN", "RECEIPT", "OTHER"]),
  documentNumber: z.string().optional(),
  emissionDate: z.string(),
  observation: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentUnit: z.string().optional(),
  accountCode: z.string().optional(),
  installments: z.array(z.object({
    dueDate: z.string(),
    value: z.number().positive(),
  })).min(1),
  ratings: z.array(z.object({
    ratingType: z.enum(["STUDENT", "CLASS", "TEACHER", "GENERAL"]),
    referenceId: z.string(),
    referenceName: z.string(),
    value: z.number(),
    percentage: z.number(),
  })).optional(),
  createdBy: z.string(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const situation = searchParams.get("situation");
  const supplierId = searchParams.get("supplierId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId obrigatório" }, { status: 400 });
  }

  try {
    const where: Record<string, unknown> = { tenantId };
    if (situation && situation !== "ALL") where.situation = situation;
    if (supplierId) where.supplierId = supplierId;

    const [titles, total] = await Promise.all([
      prisma.paymentTitle.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, document: true } },
          installments: true,
          ratings: true,
        },
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentTitle.count({ where }),
    ]);

    return NextResponse.json({ data: titles, total, page, limit });
  } catch (error) {
    console.error("[GET /api/titulos/pagar]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTitleSchema.parse(body);

    const totalValue = data.installments.reduce((sum, i) => sum + i.value, 0);

    const title = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentTitle.create({
        data: {
          tenantId: data.tenantId,
          supplierId: data.supplierId,
          contractId: data.contractId,
          documentType: data.documentType as "CONTRACT" | "ENROLLMENT" | "REENROLLMENT" | "INVOICE_IN" | "RECEIPT" | "OTHER",
          documentNumber: data.documentNumber,
          emissionDate: new Date(data.emissionDate),
          dueDate: new Date(data.installments[0].dueDate),
          originalValue: totalValue,
          currentBalance: totalValue,
          observation: data.observation,
          paymentMethod: data.paymentMethod as "CASH" | "PIX" | "TED" | "DOC" | "CHECK" | "CARD" | "ADF_COMPENSATION" | "BANK_SLIP" | undefined,
          paymentUnit: data.paymentUnit,
          accountCode: data.accountCode,
          situation: "RELEASED",
          createdBy: data.createdBy,
          ctbNominalDone: true,
          ctbNominalAt: new Date(),
          installments: {
            create: data.installments.map((inst, idx) => ({
              number: idx + 1,
              dueDate: new Date(inst.dueDate),
              value: inst.value,
              balance: inst.value,
              situation: "RELEASED" as const,
            })),
          },
        },
        include: { installments: true },
      });

      if (data.ratings && data.ratings.length > 0) {
        await tx.titleRating.createMany({
          data: data.ratings.map((r) => ({
            paymentTitleId: created.id,
            ratingType: r.ratingType as "STUDENT" | "CLASS" | "TEACHER" | "GENERAL",
            referenceId: r.referenceId,
            referenceName: r.referenceName,
            value: r.value,
            percentage: r.percentage,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId: data.tenantId,
          tableName: "payment_titles",
          recordId: created.id,
          action: "INSERT",
          newValues: { id: created.id, totalValue, situation: "RELEASED" },
          changedBy: data.createdBy,
          ipAddress: request.headers.get("x-forwarded-for") ?? "unknown",
          userAgent: request.headers.get("user-agent") ?? "unknown",
        },
      });

      return created;
    });

    return NextResponse.json({ data: title }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 422 });
    }
    console.error("[POST /api/titulos/pagar]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
