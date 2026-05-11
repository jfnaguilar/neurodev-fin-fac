import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import {
  ColDef,
  buildTemplate,
  buildDataSheet,
  workbookToBuffer,
  excelResponse,
} from "@/lib/excel";
import { format } from "date-fns";

// ─── Column definitions per entity ───────────────────────────────────────────

const COLS: Record<string, ColDef[]> = {
  clientes: [
    { key: "name",         header: "Nome",            width: 30, required: true },
    { key: "document",     header: "CPF/CNPJ",        width: 18, required: true, hint: "Somente dígitos" },
    { key: "documentType", header: "Tipo Documento",  width: 14, type: "enum", enumValues: ["CPF", "CNPJ"] },
    { key: "type",         header: "Tipo",            width: 14, type: "enum", enumValues: ["STUDENT", "RESPONSIBLE", "OTHER"] },
    { key: "enrollmentId", header: "Matrícula",       width: 16 },
    { key: "email",        header: "E-mail",          width: 28 },
    { key: "phone",        header: "Telefone",        width: 16 },
  ],
  fornecedores: [
    { key: "name",         header: "Razão Social",    width: 30, required: true },
    { key: "tradeName",    header: "Nome Fantasia",   width: 24 },
    { key: "document",     header: "CNPJ/CPF",        width: 18, required: true, hint: "Somente dígitos" },
    { key: "documentType", header: "Tipo Documento",  width: 14, type: "enum", enumValues: ["CNPJ", "CPF"] },
    { key: "group",        header: "Grupo",           width: 18 },
    { key: "subgroup",     header: "Subgrupo",        width: 18 },
    { key: "email",        header: "E-mail",          width: 28 },
    { key: "phone",        header: "Telefone",        width: 16 },
  ],
  "plano-contas": [
    { key: "code",        header: "Código",      width: 14, required: true, hint: "Ex: 1.1.01" },
    { key: "name",        header: "Nome",        width: 30, required: true },
    { key: "type",        header: "Tipo",        width: 12, required: true, type: "enum", enumValues: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] },
    { key: "nature",      header: "Natureza",    width: 12, required: true, type: "enum", enumValues: ["DEBIT", "CREDIT"] },
    { key: "parentCode",  header: "Código Pai",  width: 14, hint: "Código da conta pai (opcional)" },
    { key: "isAnalytical",header: "Analítica",   width: 12, type: "boolean", hint: "SIM = conta de lançamento; NÃO = sintética" },
  ],
  "centros-custo": [
    { key: "code",     header: "Código",  width: 14, required: true },
    { key: "name",     header: "Nome",    width: 28, required: true },
    { key: "type",     header: "Tipo",    width: 14, required: true, type: "enum", enumValues: ["STUDENT", "CLASS", "TEACHER", "GENERAL"] },
    { key: "parentCode",header: "Código Pai", width: 14 },
  ],
  turmas: [
    { key: "code",         header: "Código",      width: 14, required: true },
    { key: "name",         header: "Nome",        width: 28, required: true },
    { key: "course",       header: "Curso",       width: 24 },
    { key: "period",       header: "Período",     width: 14 },
    { key: "studentCount", header: "Qtd Alunos",  width: 12, type: "number" },
  ],
  "titulos-receber": [
    { key: "customerDocument", header: "CPF/CNPJ Cliente", width: 18, required: true, hint: "Somente dígitos" },
    { key: "documentNumber",   header: "Nº Documento",     width: 16 },
    { key: "documentType",     header: "Tipo Origem",      width: 16, type: "enum", enumValues: ["CONTRACT", "ENROLLMENT", "REENROLLMENT", "RECEIPT", "OTHER"] },
    { key: "emissionDate",     header: "Data Emissão",     width: 14, required: true, type: "date" },
    { key: "dueDate",          header: "Data Vencimento",  width: 14, required: true, type: "date" },
    { key: "originalValue",    header: "Valor (R$)",       width: 14, required: true, type: "number", hint: "Use ponto como separador decimal: 1500.00" },
    { key: "observation",      header: "Observação",       width: 30 },
    { key: "accountCode",      header: "Conta Contábil",   width: 14 },
  ],
  "titulos-pagar": [
    { key: "supplierDocument", header: "CNPJ/CPF Fornecedor", width: 20, required: true, hint: "Somente dígitos" },
    { key: "documentNumber",   header: "Nº Documento",        width: 16 },
    { key: "documentType",     header: "Tipo Origem",         width: 16, type: "enum", enumValues: ["CONTRACT", "ENROLLMENT", "INVOICE_IN", "RECEIPT", "OTHER"] },
    { key: "emissionDate",     header: "Data Emissão",        width: 14, required: true, type: "date" },
    { key: "dueDate",          header: "Data Vencimento",     width: 14, required: true, type: "date" },
    { key: "originalValue",    header: "Valor (R$)",          width: 14, required: true, type: "number", hint: "Use ponto como separador decimal: 1500.00" },
    { key: "paymentMethod",    header: "Forma Pagamento",     width: 16, type: "enum", enumValues: ["PIX", "TED", "DOC", "BANK_SLIP", "CHECK", "CASH"] },
    { key: "observation",      header: "Observação",          width: 30 },
    { key: "accountCode",      header: "Conta Contábil",      width: 14 },
  ],
};

// ─── Sample rows per entity ───────────────────────────────────────────────────

const SAMPLES: Record<string, Record<string, unknown>[]> = {
  clientes: [
    { name: "João da Silva", document: "12345678901", documentType: "CPF", type: "STUDENT", enrollmentId: "2024001", email: "joao@email.com", phone: "11999999999" },
    { name: "Maria Souza",   document: "98765432100", documentType: "CPF", type: "STUDENT", enrollmentId: "2024002", email: "maria@email.com", phone: "11988888888" },
  ],
  fornecedores: [
    { name: "Tech Suprimentos Ltda", tradeName: "TechSup", document: "11222333000181", documentType: "CNPJ", group: "TI", email: "contato@techsup.com", phone: "1133334444" },
    { name: "Gráfica Rápida Eireli",  tradeName: "GráficaR", document: "44555666000195", documentType: "CNPJ", group: "Serviços", email: "orcamento@graficaR.com", phone: "1122225555" },
  ],
  "plano-contas": [
    { code: "1", name: "ATIVO", type: "ASSET", nature: "DEBIT", isAnalytical: "NÃO" },
    { code: "1.1", name: "ATIVO CIRCULANTE", type: "ASSET", nature: "DEBIT", parentCode: "1", isAnalytical: "NÃO" },
    { code: "1.1.01", name: "Caixa", type: "ASSET", nature: "DEBIT", parentCode: "1.1", isAnalytical: "SIM" },
  ],
  "centros-custo": [
    { code: "CC001", name: "Administração Geral", type: "GENERAL" },
    { code: "CC002", name: "Turma Engenharia 2024", type: "CLASS" },
  ],
  turmas: [
    { code: "ENG2024A", name: "Engenharia de Software 2024/A", course: "Engenharia de Software", period: "Manhã", studentCount: 40 },
    { code: "ADM2024B", name: "Administração 2024/B", course: "Administração", period: "Noite", studentCount: 35 },
  ],
  "titulos-receber": [
    { customerDocument: "12345678901", documentNumber: "MENS-2024-001", documentType: "ENROLLMENT", emissionDate: "01/03/2024", dueDate: "10/03/2024", originalValue: "1500.00", observation: "Mensalidade Março/2024", accountCode: "3.1.01" },
    { customerDocument: "98765432100", documentNumber: "MENS-2024-002", documentType: "ENROLLMENT", emissionDate: "01/03/2024", dueDate: "10/03/2024", originalValue: "1500.00", observation: "Mensalidade Março/2024", accountCode: "3.1.01" },
  ],
  "titulos-pagar": [
    { supplierDocument: "11222333000181", documentNumber: "NF-1234", documentType: "INVOICE_IN", emissionDate: "01/03/2024", dueDate: "31/03/2024", originalValue: "3500.00", paymentMethod: "PIX", observation: "Serviços de TI Março", accountCode: "5.2.01" },
    { supplierDocument: "44555666000195", documentNumber: "NF-5678", documentType: "INVOICE_IN", emissionDate: "05/03/2024", dueDate: "05/04/2024", originalValue: "800.00",  paymentMethod: "TED", observation: "Material gráfico",   accountCode: "5.3.02" },
  ],
};

// ─── Fetch current data per entity ───────────────────────────────────────────

async function fetchData(tenantId: string, entity: string) {
  const fmtD = (d: Date | null | undefined) =>
    d ? format(d, "dd/MM/yyyy") : "";

  switch (entity) {
    case "clientes":
      return (await prisma.customer.findMany({ where: { tenantId }, orderBy: { name: "asc" } })).map((r) => ({
        name: r.name, document: r.document ?? "", documentType: r.documentType ?? "",
        type: r.type, enrollmentId: r.enrollmentId ?? "", email: r.email ?? "", phone: r.phone ?? "",
      }));
    case "fornecedores":
      return (await prisma.supplier.findMany({ where: { tenantId }, orderBy: { name: "asc" } })).map((r) => ({
        name: r.name, tradeName: r.tradeName ?? "", document: r.document,
        documentType: r.documentType, group: r.group ?? "", subgroup: r.subgroup ?? "",
        email: r.email ?? "", phone: r.phone ?? "",
      }));
    case "plano-contas":
      return (await prisma.chartOfAccount.findMany({ where: { tenantId }, orderBy: { code: "asc" } })).map((r) => ({
        code: r.code, name: r.name, type: r.type, nature: r.nature,
        parentCode: "", isAnalytical: r.isAnalytical ? "SIM" : "NÃO",
      }));
    case "centros-custo":
      return (await prisma.costCenter.findMany({ where: { tenantId }, orderBy: { code: "asc" } })).map((r) => ({
        code: r.code, name: r.name, type: r.type, parentCode: "",
      }));
    case "turmas":
      return (await prisma.classGroup.findMany({ where: { tenantId }, orderBy: { code: "asc" } })).map((r) => ({
        code: r.code, name: r.name, course: r.course ?? "",
        period: r.period ?? "", studentCount: r.studentCount,
      }));
    case "titulos-receber":
      return (await prisma.receivableTitle.findMany({
        where: { tenantId }, include: { customer: true }, orderBy: { dueDate: "desc" }, take: 5000,
      })).map((r) => ({
        customerDocument: r.customer.document ?? "",
        documentNumber: r.documentNumber ?? "",
        documentType: r.documentType,
        emissionDate: fmtD(r.emissionDate),
        dueDate: fmtD(r.dueDate),
        originalValue: Number(r.originalValue).toFixed(2),
        observation: r.observation ?? "",
        accountCode: r.accountCode ?? "",
      }));
    case "titulos-pagar":
      return (await prisma.paymentTitle.findMany({
        where: { tenantId }, include: { supplier: true }, orderBy: { dueDate: "desc" }, take: 5000,
      })).map((r) => ({
        supplierDocument: r.supplier.document ?? "",
        documentNumber: r.documentNumber ?? "",
        documentType: r.documentType,
        emissionDate: fmtD(r.emissionDate),
        dueDate: fmtD(r.dueDate),
        originalValue: Number(r.originalValue).toFixed(2),
        paymentMethod: r.paymentMethod ?? "",
        observation: r.observation ?? "",
        accountCode: r.accountCode ?? "",
      }));
    default:
      return [];
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: { entity: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const entity = params.entity;
  const cols = COLS[entity];
  if (!cols) return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });

  const isTemplate = new URL(req.url).searchParams.get("template") === "true";

  const wb = new ExcelJS.Workbook();
  wb.creator = "NeuroDev FIN";
  wb.created = new Date();

  if (isTemplate) {
    buildTemplate(wb, "Dados", cols, SAMPLES[entity] ?? []);

    // Instructions sheet
    const info = wb.addWorksheet("Instruções");
    info.getCell("A1").value = `Planilha modelo — ${entity}`;
    info.getCell("A1").font = { bold: true, size: 12 };
    info.getCell("A3").value = "• Preencha a partir da linha 3 (linhas 1 e 2 são cabeçalho).";
    info.getCell("A4").value = "• Colunas com fundo vermelho escuro são OBRIGATÓRIAS.";
    info.getCell("A5").value = "• Não altere os cabeçalhos das colunas.";
    info.getCell("A6").value = "• Datas no formato DD/MM/AAAA.";
    info.getCell("A7").value = "• Valores monetários com ponto decimal: 1500.00";
    ["A3", "A4", "A5", "A6", "A7"].forEach((c) => { info.getCell(c).font = { color: { argb: "FF94A3B8" } }; });
    info.getColumn("A").width = 60;

    const buf = await workbookToBuffer(wb);
    return excelResponse(buf, `modelo_${entity}`);
  }

  const rows = await fetchData(tenantId, entity);
  buildDataSheet(wb, entity, cols, rows as Record<string, unknown>[]);

  const buf = await workbookToBuffer(wb);
  const date = format(new Date(), "yyyy-MM-dd");
  return excelResponse(buf, `${entity}_${date}`);
}
