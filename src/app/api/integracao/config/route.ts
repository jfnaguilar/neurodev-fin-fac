import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, mask } from "@/lib/encryption";

const PROVIDERS = ["STRIPE", "ASAAS", "FOCUSNFE", "PAGSEGURO", "ABACATE", "RESEND", "SMTP", "GENNERA"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  try {
    const configs = await prisma.integrationConfig.findMany({
      where: { tenantId },
    });

    // Return one entry per provider, masking the API key
    const result = PROVIDERS.map((provider) => {
      const cfg = configs.find((c) => c.provider === provider);
      const settings = (cfg?.settings ?? {}) as Record<string, string>;
      return {
        provider,
        isActive: cfg?.isActive ?? false,
        isSandbox: cfg?.isSandbox ?? true,
        hasApiKey: Boolean(cfg?.apiKeyEnc),
        apiKeyMasked: cfg?.apiKeyEnc ? mask(decrypt(cfg.apiKeyEnc)) : null,
        settings: {
          webhookSecret: settings.webhookSecret ? mask(settings.webhookSecret) : null,
          pixExpirationDays: settings.pixExpirationDays ?? null,
          cnpj: settings.cnpj ?? null,
          codigoServico: settings.codigoServico ?? null,
          itemListaServico: settings.itemListaServico ?? null,
          aliquota: settings.aliquota ?? null,
          municipioPrestacao: settings.municipioPrestacao ?? null,
          municipalServiceCode: settings.municipalServiceCode ?? null,
          fromEmail: settings.fromEmail ?? null,
          fromName: settings.fromName ?? null,
          smtpHost: settings.smtpHost ?? null,
          smtpPort: settings.smtpPort ?? null,
          smtpSecure: settings.smtpSecure ?? null,
          smtpUser: settings.smtpUser ?? null,
          idInstitution: settings.idInstitution ?? null,
          username: settings.username ?? null,
          autoSyncEnabled: settings.autoSyncEnabled ?? null,
          delinquencyDaysThreshold: settings.delinquencyDaysThreshold ?? null,
          autoBlockOnDelinquency: settings.autoBlockOnDelinquency ?? null,
        },
        testedAt: cfg?.testedAt ?? null,
        updatedAt: cfg?.updatedAt ?? null,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const body = await req.json();
  const { provider, isActive, isSandbox, apiKey, settings } = body;

  if (!PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Provider inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.integrationConfig.findFirst({
      where: { tenantId, provider },
    });

    const data: Record<string, unknown> = { isActive, isSandbox, updatedAt: new Date() };

    // Only update apiKey if a new one is provided (non-empty, not the masked value)
    if (apiKey && !apiKey.includes("••")) {
      data.apiKeyEnc = encrypt(apiKey);
    }

    // Settings without sensitive fields overwriting masked values
    if (settings) {
      const currentSettings = (existing?.settings ?? {}) as Record<string, string>;
      const merged: Record<string, string> = { ...currentSettings };
      for (const [k, v] of Object.entries(settings as Record<string, string>)) {
        if (v && !String(v).includes("••")) merged[k] = v;
      }
      data.settings = merged;
    }

    const cfg = await prisma.integrationConfig.upsert({
      where: { tenantId_provider: { tenantId, provider } },
      create: { tenantId, provider, isActive, isSandbox, ...data },
      update: data,
    });

    return NextResponse.json({ ok: true, provider: cfg.provider, isActive: cfg.isActive });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
