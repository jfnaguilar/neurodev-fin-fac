import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import {
  createAsaasNFSe,
  getAsaasInvoiceStatus,
  cancelAsaasInvoice,
} from "@/lib/providers/asaas";
import {
  emitirFocusNFSe,
  consultarFocusNFSe,
  cancelarFocusNFSe,
} from "@/lib/providers/focusnfe";
import { randomUUID } from "crypto";

export interface EmitirNFeInput {
  tenantId: string;
  receivableTitleId?: string;
  paymentTitleId?: string;
  serviceDescription: string;
  amount: number;
  tomador: {
    name: string;
    cpfCnpj?: string;
    email?: string;
  };
  // FocusNFe-specific (optional, falls back to tenant settings)
  codigoServico?: string;
  itemListaServico?: string;
  aliquota?: number;
  municipioPrestacao?: string;
  // Asaas-specific
  asaasPaymentId?: string;
}

async function getActiveNFeConfig(tenantId: string) {
  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId, isActive: true, provider: { in: ["ASAAS", "FOCUSNFE"] } },
    orderBy: { provider: "asc" }, // ASAAS before FOCUSNFE alphabetically
  });
  if (!cfg?.apiKeyEnc) throw new Error("Nenhum provider de NF-e/NFSe ativo. Configure em Admin → Integrações.");
  const settings = cfg.settings as Record<string, string>;
  return { provider: cfg.provider, apiKey: decrypt(cfg.apiKeyEnc), isSandbox: cfg.isSandbox, settings };
}

export async function emitirNFe(input: EmitirNFeInput) {
  const { provider, apiKey, isSandbox, settings } = await getActiveNFeConfig(input.tenantId);

  let externalId: string | undefined;
  let ref: string | undefined;
  let status: string;
  let pdfUrl: string | undefined;
  let xmlUrl: string | undefined;
  let protocol: string | undefined;
  let number: string | undefined;

  if (provider === "ASAAS") {
    if (!input.asaasPaymentId) throw new Error("asaasPaymentId obrigatório para NFSe via Asaas");
    const result = await createAsaasNFSe({
      apiKey,
      isSandbox,
      paymentId: input.asaasPaymentId,
      serviceDescription: input.serviceDescription,
      municipalServiceCode: settings.municipalServiceCode ?? "0101",
    });
    externalId = result.externalId;
    status = result.status;
    pdfUrl = result.pdfUrl;
    xmlUrl = result.xmlUrl;
    protocol = result.protocol;
    number = result.number;
  } else if (provider === "FOCUSNFE") {
    ref = `NFS-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const result = await emitirFocusNFSe(apiKey, {
      ref,
      cnpjPrestador: settings.cnpj ?? "",
      codigoServico: input.codigoServico ?? settings.codigoServico ?? "0101",
      itemListaServico: input.itemListaServico ?? settings.itemListaServico ?? "01.01",
      aliquota: input.aliquota ?? Number(settings.aliquota ?? "5"),
      discriminacao: input.serviceDescription,
      municipioPrestacao: input.municipioPrestacao ?? settings.municipioPrestacao ?? "3550308",
      valorServicos: input.amount,
      tomador: {
        cnpjCpf: input.tomador.cpfCnpj,
        razaoSocial: input.tomador.name,
        email: input.tomador.email,
      },
    });
    status = result.status;
    pdfUrl = result.pdfUrl;
    xmlUrl = result.xmlUrl;
    protocol = result.protocol;
    number = result.numero;
    if (result.erros?.length) {
      const msg = result.erros.map((e) => e.mensagem).join("; ");
      return prisma.invoiceEmission.create({
        data: {
          tenantId: input.tenantId,
          receivableTitleId: input.receivableTitleId,
          paymentTitleId: input.paymentTitleId,
          provider,
          ref,
          status: "ERROR",
          errorMessage: msg,
        },
      });
    }
  } else {
    throw new Error(`Provider NF-e desconhecido: ${provider}`);
  }

  return prisma.invoiceEmission.create({
    data: {
      tenantId: input.tenantId,
      receivableTitleId: input.receivableTitleId,
      paymentTitleId: input.paymentTitleId,
      provider,
      externalId,
      ref,
      status: status === "AUTHORIZED" || status === "ISSUED" ? "ISSUED" : "PROCESSING",
      pdfUrl,
      xmlUrl,
      protocol,
      number,
      issuedAt: status === "AUTHORIZED" || status === "ISSUED" ? new Date() : null,
    },
  });
}

export async function sincronizarStatusNFe(invoiceId: string) {
  const inv = await prisma.invoiceEmission.findUniqueOrThrow({ where: { id: invoiceId } });
  const { provider, apiKey, isSandbox } = await getActiveNFeConfig(inv.tenantId);

  let status: string;
  let pdfUrl: string | undefined;
  let xmlUrl: string | undefined;
  let protocol: string | undefined;
  let number: string | undefined;
  let errorMessage: string | undefined;

  if (provider === "ASAAS" && inv.externalId) {
    const r = await getAsaasInvoiceStatus(apiKey, isSandbox, inv.externalId);
    status = r.status === "AUTHORIZED" ? "ISSUED" : r.status === "CANCELLED" ? "CANCELLED" : "PROCESSING";
    pdfUrl = r.pdfUrl;
    xmlUrl = r.xmlUrl;
    protocol = r.protocol;
    number = r.number;
  } else if (provider === "FOCUSNFE" && inv.ref) {
    const r = await consultarFocusNFSe(apiKey, inv.ref);
    status = r.status === "autorizado" ? "ISSUED" : r.status === "cancelado" ? "CANCELLED" : r.status === "erro" ? "ERROR" : "PROCESSING";
    pdfUrl = r.pdfUrl;
    xmlUrl = r.xmlUrl;
    protocol = r.protocol;
    number = r.numero;
    errorMessage = r.erros?.map((e) => e.mensagem).join("; ");
  } else {
    return inv;
  }

  return prisma.invoiceEmission.update({
    where: { id: invoiceId },
    data: {
      status: status as any,
      pdfUrl: pdfUrl ?? inv.pdfUrl,
      xmlUrl: xmlUrl ?? inv.xmlUrl,
      protocol: protocol ?? inv.protocol,
      number: number ?? inv.number,
      errorMessage: errorMessage ?? inv.errorMessage,
      issuedAt: status === "ISSUED" ? (inv.issuedAt ?? new Date()) : inv.issuedAt,
      canceledAt: status === "CANCELLED" ? new Date() : inv.canceledAt,
    },
  });
}

export async function cancelarNFe(invoiceId: string) {
  const inv = await prisma.invoiceEmission.findUniqueOrThrow({ where: { id: invoiceId } });
  const { provider, apiKey, isSandbox } = await getActiveNFeConfig(inv.tenantId);

  if (provider === "ASAAS" && inv.externalId) {
    await cancelAsaasInvoice(apiKey, isSandbox, inv.externalId);
  } else if (provider === "FOCUSNFE" && inv.ref) {
    await cancelarFocusNFSe(apiKey, inv.ref);
  }

  return prisma.invoiceEmission.update({
    where: { id: invoiceId },
    data: { status: "CANCELLED", canceledAt: new Date() },
  });
}
