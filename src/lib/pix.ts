import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { format, addDays } from "date-fns";
import {
  findOrCreateAsaasCustomer,
  createAsaasPix,
  getAsaasPixStatus,
  cancelAsaasPix,
} from "@/lib/providers/asaas";

export interface EmitirPixInput {
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

async function getAsaasConfig(tenantId: string) {
  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId, provider: "ASAAS", isActive: true },
  });
  if (!cfg?.apiKeyEnc) {
    throw new Error("Asaas não configurado para este tenant. Configure em Admin → Integrações.");
  }
  const settings = (cfg.settings ?? {}) as Record<string, string>;
  return {
    apiKey: decrypt(cfg.apiKeyEnc),
    isSandbox: cfg.isSandbox,
    pixExpirationDays: parseInt(settings.pixExpirationDays ?? "1", 10),
  };
}

export async function emitirPix(input: EmitirPixInput) {
  const { apiKey, isSandbox, pixExpirationDays } = await getAsaasConfig(input.tenantId);

  const customerId = await findOrCreateAsaasCustomer(apiKey, isSandbox, input.customer);

  // Due date = max(input.dueDate, today + pixExpirationDays) to ensure QR code is valid
  const minDue = addDays(new Date(), pixExpirationDays);
  const effectiveDue = input.dueDate > minDue ? input.dueDate : minDue;

  const result = await createAsaasPix({
    apiKey,
    isSandbox,
    customerId,
    amount: input.amount,
    dueDate: format(effectiveDue, "yyyy-MM-dd"),
    description: input.description,
    externalRef: input.receivableTitleId,
  });

  return prisma.pixEmission.create({
    data: {
      tenantId: input.tenantId,
      receivableTitleId: input.receivableTitleId,
      provider: "ASAAS",
      externalId: result.externalId,
      qrCode: result.qrCode,
      qrCodeImage: result.qrCodeImage,
      txId: result.txId,
      expiresAt: result.expiresAt,
      amount: input.amount,
      status: "PENDING",
    },
  });
}

export async function sincronizarStatusPix(pixId: string) {
  const pix = await prisma.pixEmission.findUniqueOrThrow({ where: { id: pixId } });

  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId: pix.tenantId, provider: "ASAAS" as any, isActive: true },
  });
  if (!cfg?.apiKeyEnc) throw new Error("Asaas não configurado");

  const apiKey = decrypt(cfg.apiKeyEnc);
  const s = await getAsaasPixStatus(apiKey, cfg.isSandbox, pix.externalId);

  let status: string;
  let paidAt: Date | undefined;

  if (s.status === "RECEIVED" || s.status === "CONFIRMED") {
    status = "PAID";
    paidAt = s.paidAt;
  } else if (s.status === "CANCELLED" || s.status === "DELETED") {
    status = "CANCELLED";
  } else if (s.status === "OVERDUE") {
    status = "EXPIRED";
  } else {
    status = "PENDING";
  }

  return prisma.pixEmission.update({
    where: { id: pixId },
    data: { status: status as any, paidAt: paidAt ?? undefined },
  });
}

export async function cancelarPix(pixId: string) {
  const pix = await prisma.pixEmission.findUniqueOrThrow({ where: { id: pixId } });

  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId: pix.tenantId, provider: "ASAAS" as any, isActive: true },
  });
  if (!cfg?.apiKeyEnc) throw new Error("Asaas não configurado");

  const apiKey = decrypt(cfg.apiKeyEnc);
  await cancelAsaasPix(apiKey, cfg.isSandbox, pix.externalId);

  return prisma.pixEmission.update({
    where: { id: pixId },
    data: { status: "CANCELLED", canceledAt: new Date() },
  });
}
