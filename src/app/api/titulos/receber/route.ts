import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReceivableSchema = z.object({
  tenantId: z.string(),
  customerId: z.string(),
  contractId: z.string().optional(),
  documentType: z.enum(["CONTRACT", "ENROLLMENT", "REENROLLMENT", "INVOICE_IN", "RECEIPT", "OTHER"]),
  emissionDate: z.string(),
  installments: z.array(z.object({
    dueDate: z.string(),
    value: z.number().positive(),
  })).min(1),
  observation: z.string().optional(),
  createdBy: z.string(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const situation = searchParams.get("situation");
  const overdue = searchParams.get("overdue") === "true";

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId obrigatório" }, { status: 400 });
  }

  try {
    const where: Record<string, unknown> = { tenantId };
    if (situation && situation !== "ALL") where.situation = situation;
    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.situation = { in: ["RELEASED", "OVERDUE"] };
    }

    const [titles, total] = await Promise.all([
      prisma.receivableTitle.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, enrollmentId: true } },
          installments: true,
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.receivableTitle.count({ where }),
    ]);

    return NextResponse.json({ data: titles, total });
  } catch (error) {
    console.error("[GET /api/titulos/receber]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createReceivableSchema.parse(body);

    const totalValue = data.installments.reduce((sum, i) => sum + i.value, 0);

    const title = await prisma.$transaction(async (tx) => {
      const created = await tx.receivableTitle.create({
        data: {
          tenantId: data.tenantId,
          customerId: data.customerId,
          contractId: data.contractId,
          documentType: data.documentType as "CONTRACT" | "ENROLLMENT" | "REENROLLMENT" | "INVOICE_IN" | "RECEIPT" | "OTHER",
          emissionDate: new Date(data.emissionDate),
          dueDate: new Date(data.installments[0].dueDate),
          originalValue: totalValue,
          currentBalance: totalValue,
          observation: data.observation,
          situation: "RELEASED",
          createdBy: data.createdBy,
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

      await tx.auditLog.create({
        data: {
          tenantId: data.tenantId,
          tableName: "receivable_titles",
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
    console.error("[POST /api/titulos/receber]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
