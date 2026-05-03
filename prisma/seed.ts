import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Grupo Econômico
  const group = await prisma.economicGroup.upsert({
    where: { document: "12345678000190" },
    update: {},
    create: {
      name: "Grupo Educacional NeuroDev",
      document: "12345678000190",
    },
  });
  console.log("✓ Grupo econômico criado");

  // Tenant principal
  const tenant = await prisma.tenant.upsert({
    where: { cnpj: "12345678000190" },
    update: {},
    create: {
      economicGroupId: group.id,
      cnpj: "12345678000190",
      companyName: "NeuroDev Faculdade Ltda",
      tradeName: "NeuroDev Faculdade",
      schemaName: "neurodev_faculdade",
      isActive: true,
      settings: {
        approvalRequired: true,
        defaultPaymentMethod: "PIX",
        interestRatePerDay: 0.033,
        fineRate: 2.0,
      },
    },
  });
  console.log("✓ Tenant criado:", tenant.cnpj);

  // Tenant secundário (mesmo grupo)
  const tenant2 = await prisma.tenant.upsert({
    where: { cnpj: "98765432000117" },
    update: {},
    create: {
      economicGroupId: group.id,
      cnpj: "98765432000117",
      companyName: "NeuroDev Instituto de Pós-Graduação",
      tradeName: "NeuroDev Pós",
      schemaName: "neurodev_pos",
      isActive: true,
      settings: {},
    },
  });
  console.log("✓ Tenant 2 criado:", tenant2.cnpj);

  // Usuário admin
  const passwordHash = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@neurodev.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@neurodev.com",
      passwordHash,
      mfaEnabled: false,
      isActive: true,
    },
  });

  await prisma.userTenantRole.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: adminUser.id,
      tenantId: tenant.id,
      role: "ADMIN",
      permissions: { all: true },
    },
  });
  console.log("✓ Admin criado:", adminUser.email);

  // Usuário financeiro
  const finUser = await prisma.user.upsert({
    where: { email: "financeiro@neurodev.com" },
    update: {},
    create: {
      name: "Maria Financeiro",
      email: "financeiro@neurodev.com",
      passwordHash: await bcrypt.hash("fin123", 10),
      isActive: true,
    },
  });

  await prisma.userTenantRole.upsert({
    where: { userId_tenantId: { userId: finUser.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: finUser.id,
      tenantId: tenant.id,
      role: "FINANCIAL",
      permissions: {
        paymentTitles: { read: true, write: true, pay: true },
        receivableTitles: { read: true, write: true, receive: true },
      },
    },
  });
  console.log("✓ Usuário financeiro criado");

  // Usuário aprovador
  const approverUser = await prisma.user.upsert({
    where: { email: "aprovador@neurodev.com" },
    update: {},
    create: {
      name: "João Aprovador",
      email: "aprovador@neurodev.com",
      passwordHash: await bcrypt.hash("apr123", 10),
      isActive: true,
    },
  });

  await prisma.userTenantRole.upsert({
    where: { userId_tenantId: { userId: approverUser.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: approverUser.id,
      tenantId: tenant.id,
      role: "APPROVER",
      permissions: { approve: true },
    },
  });
  console.log("✓ Usuário aprovador criado");

  // Plano de Contas
  const accounts = [
    { code: "1", name: "ATIVO", type: "ASSET" as const, nature: "DEBIT" as const, level: 1, isAnalytical: false },
    { code: "1.1", name: "ATIVO CIRCULANTE", type: "ASSET" as const, nature: "DEBIT" as const, level: 2, isAnalytical: false },
    { code: "1.1.01", name: "Caixa e Equivalentes", type: "ASSET" as const, nature: "DEBIT" as const, level: 3, isAnalytical: true },
    { code: "1.1.02", name: "Contas a Receber", type: "ASSET" as const, nature: "DEBIT" as const, level: 3, isAnalytical: true },
    { code: "2", name: "PASSIVO", type: "LIABILITY" as const, nature: "CREDIT" as const, level: 1, isAnalytical: false },
    { code: "2.1", name: "PASSIVO CIRCULANTE", type: "LIABILITY" as const, nature: "CREDIT" as const, level: 2, isAnalytical: false },
    { code: "2.1.01", name: "Fornecedores a Pagar", type: "LIABILITY" as const, nature: "CREDIT" as const, level: 3, isAnalytical: true },
    { code: "3", name: "RECEITAS", type: "REVENUE" as const, nature: "CREDIT" as const, level: 1, isAnalytical: false },
    { code: "3.1", name: "Receitas de Mensalidades", type: "REVENUE" as const, nature: "CREDIT" as const, level: 2, isAnalytical: true },
    { code: "3.2", name: "Receitas de Matrículas", type: "REVENUE" as const, nature: "CREDIT" as const, level: 2, isAnalytical: true },
    { code: "4", name: "DESPESAS", type: "EXPENSE" as const, nature: "DEBIT" as const, level: 1, isAnalytical: false },
    { code: "4.1", name: "Despesas de Pessoal", type: "EXPENSE" as const, nature: "DEBIT" as const, level: 2, isAnalytical: false },
    { code: "4.1.01", name: "Salários", type: "EXPENSE" as const, nature: "DEBIT" as const, level: 3, isAnalytical: true },
    { code: "4.2", name: "Despesas Operacionais", type: "EXPENSE" as const, nature: "DEBIT" as const, level: 2, isAnalytical: false },
    { code: "4.2.01", name: "Aluguel", type: "EXPENSE" as const, nature: "DEBIT" as const, level: 3, isAnalytical: true },
    { code: "4.2.02", name: "Material Didático", type: "EXPENSE" as const, nature: "DEBIT" as const, level: 3, isAnalytical: true },
  ];

  for (const acc of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: acc.code } },
      update: {},
      create: { tenantId: tenant.id, ...acc },
    });
  }
  console.log("✓ Plano de contas criado");

  // Centros de Custo
  const costCenters = [
    { code: "CC-001", name: "Engenharia Civil", type: "CLASS" as const },
    { code: "CC-002", name: "Medicina", type: "CLASS" as const },
    { code: "CC-003", name: "Direito", type: "CLASS" as const },
    { code: "CC-004", name: "Administração", type: "CLASS" as const },
    { code: "CC-100", name: "Administrativo", type: "GENERAL" as const },
    { code: "CC-101", name: "TI", type: "GENERAL" as const },
    { code: "CC-102", name: "Marketing", type: "GENERAL" as const },
  ];

  for (const cc of costCenters) {
    await prisma.costCenter.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: cc.code } },
      update: {},
      create: { tenantId: tenant.id, ...cc },
    });
  }
  console.log("✓ Centros de custo criados");

  // Fornecedores
  const suppliers = [
    {
      name: "Fornecedor ABC Ltda",
      document: "11122233000144",
      group: "Serviços",
      subgroup: "Manutenção",
      email: "contato@abc.com",
      phone: "(11) 3333-0000",
    },
    {
      name: "Editora Saraiva S.A.",
      document: "44455566000177",
      group: "Material",
      subgroup: "Didático",
      email: "comercial@saraiva.com",
      phone: "(11) 3333-1111",
    },
    {
      name: "Tech Solutions S.A.",
      document: "77788899000155",
      group: "Tecnologia",
      subgroup: "Software",
      email: "vendas@tech.com",
      phone: "(11) 3333-2222",
    },
    {
      name: "Manutenção Predial ME",
      document: "22233344000166",
      group: "Serviços",
      subgroup: "Predial",
      email: "orcamento@manutencao.com",
      phone: "(11) 3333-3333",
    },
  ];

  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { tenantId_document: { tenantId: tenant.id, document: sup.document } },
      update: {},
      create: { tenantId: tenant.id, ...sup, bankAccounts: [] },
    });
  }
  console.log("✓ Fornecedores criados");

  // Clientes / Alunos
  const customers = [
    { name: "João Silva", enrollmentId: "MAT-2024-001", type: "STUDENT" as const, email: "joao@email.com" },
    { name: "Maria Oliveira", enrollmentId: "MAT-2024-002", type: "STUDENT" as const, email: "maria@email.com" },
    { name: "Pedro Santos", enrollmentId: "MAT-2025-045", type: "STUDENT" as const, email: "pedro@email.com" },
    { name: "Ana Costa", enrollmentId: "MAT-2023-089", type: "STUDENT" as const, email: "ana@email.com" },
  ];

  for (const cust of customers) {
    const existing = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, enrollmentId: cust.enrollmentId },
    });
    if (!existing) {
      await prisma.customer.create({
        data: { tenantId: tenant.id, ...cust },
      });
    }
  }
  console.log("✓ Clientes/alunos criados");

  // Convênios bancários
  await prisma.bankCovenant.upsert({
    where: { id: "covenant-itau-001" },
    update: {},
    create: {
      id: "covenant-itau-001",
      tenantId: tenant.id,
      bankCode: "341",
      bankName: "Itaú Unibanco",
      agency: "1234",
      account: "56789-0",
      covenantCode: "12345",
      wallet: "109",
      layout: "CNAB240",
      type: "PAYMENT",
    },
  });

  await prisma.bankCovenant.upsert({
    where: { id: "covenant-bradesco-001" },
    update: {},
    create: {
      id: "covenant-bradesco-001",
      tenantId: tenant.id,
      bankCode: "237",
      bankName: "Bradesco",
      agency: "5678",
      account: "98765-4",
      covenantCode: "67890",
      wallet: "09",
      layout: "CNAB400",
      type: "COLLECTION",
    },
  });
  console.log("✓ Convênios bancários criados");

  // Alçadas de aprovação
  await prisma.approvalWorkflow.upsert({
    where: { id: "workflow-001" },
    update: {},
    create: {
      id: "workflow-001",
      tenantId: tenant.id,
      name: "Até R$ 1.000",
      minValue: 0,
      maxValue: 1000,
      escalationHours: 4,
      levels: [{ level: 1, approvers: [approverUser.id], label: "Aprovador Nível 1" }],
    },
  });

  await prisma.approvalWorkflow.upsert({
    where: { id: "workflow-002" },
    update: {},
    create: {
      id: "workflow-002",
      tenantId: tenant.id,
      name: "R$ 1.001 a R$ 10.000",
      minValue: 1001,
      maxValue: 10000,
      escalationHours: 8,
      levels: [
        { level: 1, approvers: [finUser.id], label: "Financeiro" },
        { level: 2, approvers: [approverUser.id], label: "Aprovador" },
      ],
    },
  });

  await prisma.approvalWorkflow.upsert({
    where: { id: "workflow-003" },
    update: {},
    create: {
      id: "workflow-003",
      tenantId: tenant.id,
      name: "Acima de R$ 10.000",
      minValue: 10001,
      maxValue: null,
      escalationHours: 24,
      levels: [
        { level: 1, approvers: [finUser.id], label: "Financeiro" },
        { level: 2, approvers: [approverUser.id], label: "Aprovador" },
        { level: 3, approvers: [adminUser.id], label: "Administrador" },
      ],
    },
  });
  console.log("✓ Alçadas criadas");

  // Títulos a pagar de exemplo
  const supplier = await prisma.supplier.findFirst({ where: { tenantId: tenant.id } });
  if (supplier) {
    const existingTitle = await prisma.paymentTitle.findFirst({ where: { tenantId: tenant.id } });
    if (!existingTitle) {
      await prisma.paymentTitle.create({
        data: {
          tenantId: tenant.id,
          supplierId: supplier.id,
          documentType: "INVOICE_IN",
          documentNumber: "NF-001234",
          emissionDate: new Date("2026-04-15"),
          dueDate: new Date("2026-05-15"),
          originalValue: 45000,
          currentBalance: 45000,
          situation: "RELEASED",
          observation: "NF referente a serviços de manutenção predial",
          ctbNominalDone: true,
          ctbNominalAt: new Date("2026-04-15"),
          createdBy: adminUser.id,
          installments: {
            create: [
              { number: 1, dueDate: new Date("2026-05-15"), value: 45000, balance: 45000, situation: "RELEASED" },
            ],
          },
        },
      });
      await prisma.paymentTitle.create({
        data: {
          tenantId: tenant.id,
          supplierId: supplier.id,
          documentType: "INVOICE_IN",
          documentNumber: "NF-001235",
          emissionDate: new Date("2026-03-15"),
          dueDate: new Date("2026-04-15"),
          originalValue: 12000,
          currentBalance: 12000,
          situation: "RELEASED",
          observation: "NF de software — vencida",
          ctbNominalDone: true,
          ctbNominalAt: new Date("2026-03-15"),
          createdBy: adminUser.id,
          installments: {
            create: [
              { number: 1, dueDate: new Date("2026-04-15"), value: 12000, balance: 12000, situation: "RELEASED" },
            ],
          },
        },
      });
      console.log("✓ Títulos a pagar de exemplo criados");
    }
  }

  // Títulos a receber de exemplo
  const customer = await prisma.customer.findFirst({ where: { tenantId: tenant.id } });
  if (customer) {
    const existingReceivable = await prisma.receivableTitle.findFirst({ where: { tenantId: tenant.id } });
    if (!existingReceivable) {
      await prisma.receivableTitle.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          documentType: "ENROLLMENT",
          documentNumber: "MAT-2024-001/05",
          emissionDate: new Date("2026-04-01"),
          dueDate: new Date("2026-05-05"),
          originalValue: 1850,
          currentBalance: 1850,
          situation: "RELEASED",
          createdBy: adminUser.id,
          installments: {
            create: [
              { number: 1, dueDate: new Date("2026-05-05"), value: 1850, balance: 1850, situation: "RELEASED" },
            ],
          },
        },
      });
      console.log("✓ Títulos a receber de exemplo criados");
    }
  }

  console.log("\n✅ Seed concluído com sucesso!");
  console.log("\nCredenciais de acesso:");
  console.log("  admin@neurodev.com     / admin123  (Administrador)");
  console.log("  financeiro@neurodev.com / fin123   (Financeiro)");
  console.log("  aprovador@neurodev.com  / apr123   (Aprovador)");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
