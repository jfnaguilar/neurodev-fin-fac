import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { format } from "date-fns";
import {
  createStripeBoleto,
  getStripePaymentIntentStatus,
  cancelStripeBoleto,
} from "@/lib/providers/stripe";
import {
  findOrCreateAsaasCustomer,
  createAsaasBoleto,
  getAsaasPaymentStatus,
  cancelAsaasPayment,
} from "@/lib/providers/asaas";
import {
  createPagSeguroBoleto,
  getPagSeguroChargeStatus,
  cancelPagSeguroCharge,
} from "@/lib/providers/pagseguro";
import {
  createAbacateBoleto,
  getAbacateBillingStatus,
  cancelAbacateBilling,
} from "@/lib/providers/abacate";

export interface EmitirBoletoInput {
  tenantId: string;
  receivableTitleId: string;
  customer: {
    name: string;
    email?: string;
    cpfCnpj: string;
    phone?: string;
  };
  amount: number;
  dueDate: Date;
  description: string;
}

async function getActiveConfig(tenantId: string, provider: string) {
  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId, provider: provider as any, isActive: true },
  });
  if (!cfg?.apiKeyEnc) throw new Error(`Provider ${provider} não configurado para este tenant`);
  return { apiKey: decrypt(cfg.apiKeyEnc), isSandbox: cfg.isSandbox, settings: cfg.settings as Record<string, string> };
}

async function resolveProvider(tenantId: string): Promise<string> {
  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId, isActive: true, provider: { in: ["STRIPE", "ASAAS", "PAGSEGURO", "ABACATE"] } },
    orderBy: { updatedAt: "desc" },
  });
  if (!cfg) throw new Error("Nenhum provider de boleto ativo para este tenant. Configure em Admin → Integrações.");
  return cfg.provider;
}

export async function emitirBoleto(input: EmitirBoletoInput) {
  const provider = await resolveProvider(input.tenantId);
  const { apiKey, isSandbox, settings } = await getActiveConfig(input.tenantId, provider);

  let externalId: string;
  let barCode: string;
  let digitableLine: string;
  let pdfUrl: string;

  if (provider === "STRIPE") {
    const result = await createStripeBoleto(apiKey, {
      amount: input.amount,
      dueDate: input.dueDate,
      customer: {
        name: input.customer.name,
        email: input.customer.email ?? "",
        taxId: input.customer.cpfCnpj,
      },
      description: input.description,
      isSandbox,
    });
    externalId = result.externalId;
    barCode = result.barCode;
    digitableLine = result.digitableLine;
    pdfUrl = result.pdfUrl;
  } else if (provider === "ASAAS") {
    const customerId = await findOrCreateAsaasCustomer(apiKey, isSandbox, input.customer);
    const result = await createAsaasBoleto({
      apiKey,
      isSandbox,
      customerId,
      amount: input.amount,
      dueDate: format(input.dueDate, "yyyy-MM-dd"),
      description: input.description,
      externalRef: input.receivableTitleId,
    });
    externalId = result.externalId;
    barCode = result.barCode;
    digitableLine = result.digitableLine;
    pdfUrl = result.pdfUrl;
  } else if (provider === "PAGSEGURO") {
    const result = await createPagSeguroBoleto({
      combined: apiKey,
      isSandbox,
      referenceId: input.receivableTitleId,
      description: input.description,
      amount: input.amount,
      dueDate: format(input.dueDate, "yyyy-MM-dd"),
      holder: {
        name: input.customer.name,
        taxId: input.customer.cpfCnpj,
        email: input.customer.email,
      },
      notificationUrl: settings?.webhookUrl,
    });
    externalId = result.externalId;
    barCode = result.barCode;
    digitableLine = result.digitableLine;
    pdfUrl = result.pdfUrl;
  } else if (provider === "ABACATE") {
    const result = await createAbacateBoleto({
      apiKey,
      externalId: input.receivableTitleId,
      description: input.description,
      amount: input.amount,
      dueDate: format(input.dueDate, "yyyy-MM-dd"),
      customer: {
        name: input.customer.name,
        email: input.customer.email ?? "",
        taxId: input.customer.cpfCnpj,
        cellphone: input.customer.phone,
      },
    });
    externalId = result.externalId;
    barCode = result.barCode ?? "";
    digitableLine = result.digitableLine ?? "";
    pdfUrl = result.billingUrl;
  } else {
    throw new Error(`Provider desconhecido: ${provider}`);
  }

  return prisma.boletoEmission.create({
    data: {
      tenantId: input.tenantId,
      receivableTitleId: input.receivableTitleId,
      provider,
      externalId,
      barCode,
      digitableLine,
      pdfUrl,
      dueDate: input.dueDate,
      amount: input.amount,
      status: "PENDING",
    },
  });
}

export async function sincronizarStatusBoleto(boletoId: string) {
  const boleto = await prisma.boletoEmission.findUniqueOrThrow({ where: { id: boletoId } });
  const { apiKey, isSandbox } = await getActiveConfig(boleto.tenantId, boleto.provider);

  let status: string;
  let paidAt: Date | undefined;

  if (boleto.provider === "STRIPE") {
    const s = await getStripePaymentIntentStatus(apiKey, boleto.externalId);
    status = s.status === "succeeded" ? "PAID" : s.status === "canceled" ? "CANCELLED" : "PENDING";
    paidAt = s.paidAt;
  } else if (boleto.provider === "ASAAS") {
    const s = await getAsaasPaymentStatus(apiKey, isSandbox, boleto.externalId);
    status = s.status === "RECEIVED" || s.status === "CONFIRMED" ? "PAID"
      : s.status === "CANCELLED" ? "CANCELLED"
      : s.status === "OVERDUE" ? "EXPIRED"
      : "PENDING";
    paidAt = s.paidAt;
  } else if (boleto.provider === "PAGSEGURO") {
    const s = await getPagSeguroChargeStatus(apiKey, isSandbox, boleto.externalId);
    status = s.status === "PAID" ? "PAID"
      : s.status === "CANCELED" ? "CANCELLED"
      : s.status === "DECLINED" ? "EXPIRED"
      : "PENDING";
    paidAt = s.paidAt;
  } else if (boleto.provider === "ABACATE") {
    const s = await getAbacateBillingStatus(apiKey, boleto.externalId);
    status = s.status === "PAID" || s.status === "COMPLETED" ? "PAID"
      : s.status === "CANCELLED" ? "CANCELLED"
      : s.status === "EXPIRED" ? "EXPIRED"
      : "PENDING";
    paidAt = s.paidAt;
  } else {
    throw new Error(`Provider desconhecido: ${boleto.provider}`);
  }

  return prisma.boletoEmission.update({
    where: { id: boletoId },
    data: { status: status as any, paidAt: paidAt ?? undefined },
  });
}

export async function cancelarBoleto(boletoId: string) {
  const boleto = await prisma.boletoEmission.findUniqueOrThrow({ where: { id: boletoId } });
  const { apiKey, isSandbox } = await getActiveConfig(boleto.tenantId, boleto.provider);

  if (boleto.provider === "STRIPE") {
    await cancelStripeBoleto(apiKey, boleto.externalId);
  } else if (boleto.provider === "ASAAS") {
    await cancelAsaasPayment(apiKey, isSandbox, boleto.externalId);
  } else if (boleto.provider === "PAGSEGURO") {
    await cancelPagSeguroCharge(apiKey, isSandbox, boleto.externalId);
  } else if (boleto.provider === "ABACATE") {
    await cancelAbacateBilling(apiKey, boleto.externalId);
  }

  return prisma.boletoEmission.update({
    where: { id: boletoId },
    data: { status: "CANCELLED", canceledAt: new Date() },
  });
}
