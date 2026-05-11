import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ColDef, parseImportBuffer, ParsedRow } from "@/lib/excel";
import { parse as parseDate, isValid } from "date-fns";

// ─── Column definitions (mirrors export route) ────────────────────────────────

const COLS: Record<string, ColDef[]> = {
  clientes: [
    { key: "name",         header: "Nome",            width: 30, required: true },
    { key: "document",     header: "CPF/CNPJ",        width: 18 },
    { key: "documentType", header: "Tipo Documento",  width: 14, type: "enum", enumValues: ["CPF", "CNPJ"] },
    { key: "type",         header: "Tipo",            width: 14, type: "enum", enumValues: ["STUDENT", "RESPONSIBLE", "OTHER"] },
    { key: "enrollmentId", header: "Matrícula",       width: 16 },
    { key: "email",        header: "E-mail",          width: 28 },
    { key: "phone",        header: "Telefone",        width: 16 },
  ],
  fornecedores: [
    { key: "name",         header: "Razão Social",    width: 30, required: true },
    { key: "tradeName",    header: "Nome Fantasia",   width: 24 },
    { key: "document",     header: "CNPJ/CPF",        width: 18, required: true },
    { key: "documentType", header: "Tipo Documento",  width: 14, type: "enum", enumValues: ["CNPJ", "CPF"] },
    { key: "group",        header: "Grupo",           width: 18 },
    { key: "subgroup",     header: "Subgrupo",        width: 18 },
    { key: "email",        header: "E-mail",          width: 28 },
    { key: "phone",        header: "Telefone",        width: 16 },
  ],
  "plano-contas": [
    { key: "code",         header: "Código",      width: 14, required: true },
    { key: "name",         header: "Nome",        width: 30, required: true },
    { key: "type",         header: "Tipo",        width: 12, required: true, type: "enum", enumValues: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] },
    { key: "nature",       header: "Natureza",    width: 12, required: true, type: "enum", enumValues: ["DEBIT", "CREDIT"] },
    { key: "parentCode",   header: "Código Pai",  width: 14 },
    { key: "isAnalytical", header: "Analítica",   width: 12, type: "enum", enumValues: ["SIM", "NÃO"] },
  ],
  "centros-custo": [
    { key: "code",       header: "Código",     width: 14, required: true },
    { key: "name",       header: "Nome",       width: 28, required: true },
    { key: "type",       header: "Tipo",       width: 14, required: true, type: "enum", enumValues: ["STUDENT", "CLASS", "TEACHER", "GENERAL"] },
    { key: "parentCode", header: "Código Pai", width: 14 },
  ],
  turmas: [
    { key: "code",         header: "Código",     width: 14, required: true },
    { key: "name",         header: "Nome",       width: 28, required: true },
    { key: "course",       header: "Curso",      width: 24 },
    { key: "period",       header: "Período",    width: 14 },
    { key: "studentCount", header: "Qtd Alunos", width: 12, type: "number" },
  ],
  "titulos-receber": [
    { key: "customerDocument", header: "CPF/CNPJ Cliente",  width: 18, required: true },
    { key: "documentNumber",   header: "Nº Documento",      width: 16 },
    { key: "documentType",     header: "Tipo Origem",       width: 16, required: true, type: "enum", enumValues: ["CONTRACT", "ENROLLMENT", "REENROLLMENT", "RECEIPT", "OTHER"] },
    { key: "emissionDate",     header: "Data Emissão",      width: 14, required: true, type: "date" },
    { key: "dueDate",          header: "Data Vencimento",   width: 14, required: true, type: "date" },
    { key: "originalValue",    header: "Valor (R$)",        width: 14, required: true, type: "number" },
    { key: "observation",      header: "Observação",        width: 30 },
    { key: "accountCode",      header: "Conta Contábil",    width: 14 },
  ],
  "titulos-pagar": [
    { key: "supplierDocument", header: "CNPJ/CPF Fornecedor", width: 20, required: true },
    { key: "documentNumber",   header: "Nº Documento",        width: 16 },
    { key: "documentType",     header: "Tipo Origem",         width: 16, required: true, type: "enum", enumValues: ["CONTRACT", "ENROLLMENT", "INVOICE_IN", "RECEIPT", "OTHER"] },
    { key: "emissionDate",     header: "Data Emissão",        width: 14, required: true, type: "date" },
    { key: "dueDate",          header: "Data Vencimento",     width: 14, required: true, type: "date" },
    { key: "originalValue",    header: "Valor (R$)",          width: 14, required: true, type: "number" },
    { key: "paymentMethod",    header: "Forma Pagamento",     width: 16, type: "enum", enumValues: ["PIX", "TED", "DOC", "BANK_SLIP", "CHECK", "CASH"] },
    { key: "observation",      header: "Observação",          width: 30 },
    { key: "accountCode",      header: "Conta Contábil",      width: 14 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseD(str: string): Date {
  const d = parseDate(str.trim(), "dd/MM/yyyy", new Date());
  if (!isValid(d)) throw new Error(`Data inválida: "${str}"`);
  return d;
}

function parseValue(str: string): number {
  const n = parseFloat(str.replace(",", "."));
  if (isNaN(n) || n < 0) throw new Error(`Valor inválido: "${str}"`);
  return n;
}

// ─── Per-entity import logic ──────────────────────────────────────────────────

async function importEntity(
  tenantId: string,
  userId: string,
  entity: string,
  rows: ParsedRow[]
): Promise<{ total: number; created: number; errors: { row: number; message: string }[] }> {
  const errors: { row: number; message: string }[] = [];
  let created = 0;

  for (const row of rows) {
    if (row.errors.length > 0) {
      errors.push({ row: row.rowIndex, message: row.errors.join("; ") });
      continue;
    }

    try {
      const d = row.data;

      switch (entity) {
        case "clientes": {
          await prisma.customer.create({
            data: {
              tenantId,
              name: d.name,
              document: d.document || null,
              documentType: d.documentType || null,
              type: (d.type as any) || "STUDENT",
              enrollmentId: d.enrollmentId || null,
              email: d.email || null,
              phone: d.phone || null,
            },
          });
          break;
        }

        case "fornecedores": {
          await prisma.supplier.create({
            data: {
              tenantId,
              name: d.name,
              tradeName: d.tradeName || null,
              document: d.document,
              documentType: d.documentType || "CNPJ",
              group: d.group || null,
              subgroup: d.subgroup || null,
              email: d.email || null,
              phone: d.phone || null,
            },
          });
          break;
        }

        case "plano-contas": {
          let parentId: string | null = null;
          if (d.parentCode) {
            const parent = await prisma.chartOfAccount.findUnique({
              where: { tenantId_code: { tenantId, code: d.parentCode } },
            });
            if (!parent) throw new Error(`Código pai não encontrado: "${d.parentCode}"`);
            parentId = parent.id;
          }
          await prisma.chartOfAccount.create({
            data: {
              tenantId,
              code: d.code,
              name: d.name,
              type: d.type as any,
              nature: d.nature as any,
              parentId,
              level: parentId ? 2 : 1,
              isAnalytical: d.isAnalytical === "SIM",
            },
          });
          break;
        }

        case "centros-custo": {
          let parentId: string | null = null;
          if (d.parentCode) {
            const parent = await prisma.costCenter.findUnique({
              where: { tenantId_code: { tenantId, code: d.parentCode } },
            });
            if (!parent) throw new Error(`Código pai não encontrado: "${d.parentCode}"`);
            parentId = parent.id;
          }
          await prisma.costCenter.create({
            data: {
              tenantId,
              code: d.code,
              name: d.name,
              type: d.type as any,
              parentId,
            },
          });
          break;
        }

        case "turmas": {
          const studentCount = d.studentCount ? parseInt(d.studentCount, 10) : 0;
          await prisma.classGroup.create({
            data: {
              tenantId,
              code: d.code,
              name: d.name,
              course: d.course || null,
              period: d.period || null,
              studentCount: isNaN(studentCount) ? 0 : studentCount,
            },
          });
          break;
        }

        case "titulos-receber": {
          const customer = await prisma.customer.findFirst({
            where: { tenantId, document: d.customerDocument },
          });
          if (!customer) throw new Error(`Cliente não encontrado para o documento: "${d.customerDocument}"`);

          const value = parseValue(d.originalValue);
          await prisma.receivableTitle.create({
            data: {
              tenantId,
              customerId: customer.id,
              documentType: d.documentType as any,
              documentNumber: d.documentNumber || null,
              emissionDate: parseD(d.emissionDate),
              dueDate: parseD(d.dueDate),
              originalValue: value,
              currentBalance: value,
              situation: "RELEASED",
              observation: d.observation || null,
              accountCode: d.accountCode || null,
              createdBy: userId,
            },
          });
          break;
        }

        case "titulos-pagar": {
          const supplier = await prisma.supplier.findFirst({
            where: { tenantId, document: d.supplierDocument },
          });
          if (!supplier) throw new Error(`Fornecedor não encontrado para o documento: "${d.supplierDocument}"`);

          const value = parseValue(d.originalValue);
          await prisma.paymentTitle.create({
            data: {
              tenantId,
              supplierId: supplier.id,
              documentType: d.documentType as any,
              documentNumber: d.documentNumber || null,
              emissionDate: parseD(d.emissionDate),
              dueDate: parseD(d.dueDate),
              originalValue: value,
              currentBalance: value,
              situation: "PENDING_APPROVAL",
              paymentMethod: d.paymentMethod ? (d.paymentMethod as any) : null,
              observation: d.observation || null,
              accountCode: d.accountCode || null,
              createdBy: userId,
            },
          });
          break;
        }

        default:
          throw new Error("Entidade não suportada");
      }

      created++;
    } catch (err: any) {
      const msg: string = err?.meta?.target
        ? `Registro duplicado (${err.meta.target.join(", ")})`
        : (err?.message ?? "Erro ao salvar");
      errors.push({ row: row.rowIndex, message: msg });
    }
  }

  return { total: rows.length, created, errors };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: { entity: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.currentTenantId as string;
  const userId = user.id as string;

  const entity = params.entity;
  const cols = COLS[entity];
  if (!cols) return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  const buffer = await file.arrayBuffer();

  let rows: ParsedRow[];
  try {
    rows = await parseImportBuffer(buffer, cols);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Arquivo inválido" }, { status: 422 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ total: 0, created: 0, errors: [] });
  }

  const result = await importEntity(tenantId, userId, entity, rows);
  return NextResponse.json(result);
}
