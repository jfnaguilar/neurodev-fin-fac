import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { testAsaasConnection } from "@/lib/providers/asaas";
import { testFocusNFeConnection } from "@/lib/providers/focusnfe";
import { testPagSeguroConnection } from "@/lib/providers/pagseguro";
import { testAbacateConnection } from "@/lib/providers/abacate";
import { testResendConnection } from "@/lib/providers/resend";
import { testSmtpConnection, parseSmtpSettings } from "@/lib/providers/smtp";
import { testGenneraConnection } from "@/lib/providers/gennera";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const { provider } = await req.json();

  const cfg = await prisma.integrationConfig.findFirst({ where: { tenantId, provider } });
  if (!cfg?.apiKeyEnc) {
    return NextResponse.json({ ok: false, message: "API key não configurada" }, { status: 400 });
  }

  const apiKey = decrypt(cfg.apiKeyEnc);
  let ok = false;
  let message = "";

  try {
    if (provider === "ASAAS") {
      ok = await testAsaasConnection(apiKey, cfg.isSandbox);
      message = ok ? "Conexão Asaas estabelecida com sucesso" : "Falha na conexão com Asaas";
    } else if (provider === "FOCUSNFE") {
      ok = await testFocusNFeConnection(apiKey);
      message = ok ? "Conexão FocusNFe estabelecida com sucesso" : "Falha na conexão com FocusNFe";
    } else if (provider === "STRIPE") {
      // Test Stripe via account endpoint
      const res = await fetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      ok = res.ok;
      message = ok ? "Conexão Stripe estabelecida com sucesso" : "API key Stripe inválida";
    } else if (provider === "PAGSEGURO") {
      ok = await testPagSeguroConnection(apiKey, cfg.isSandbox);
      message = ok ? "Conexão PagSeguro estabelecida com sucesso" : "Falha na conexão com PagSeguro";
    } else if (provider === "ABACATE") {
      ok = await testAbacateConnection(apiKey);
      message = ok ? "Conexão Abacate Pay estabelecida com sucesso" : "Falha na conexão com Abacate Pay";
    } else if (provider === "RESEND") {
      ok = await testResendConnection(apiKey);
      message = ok ? "Conexão Resend estabelecida com sucesso" : "API key Resend inválida";
    } else if (provider === "SMTP") {
      const settings = (cfg.settings ?? {}) as Record<string, string>;
      ok = await testSmtpConnection(parseSmtpSettings(settings, apiKey));
      message = ok ? "Conexão SMTP estabelecida com sucesso" : "Falha na conexão SMTP — verifique host, porta e credenciais";
    } else if (provider === "GENNERA") {
      const settings = (cfg.settings ?? {}) as Record<string, string>;
      ok = await testGenneraConnection(settings, apiKey);
      message = ok ? "Conexão Gennera estabelecida com sucesso" : "Falha na autenticação com Gennera — verifique idInstituição, usuário e senha";
    } else {
      return NextResponse.json({ ok: false, message: "Provider inválido" }, { status: 400 });
    }

    if (ok) {
      await prisma.integrationConfig.update({
        where: { tenantId_provider: { tenantId, provider } },
        data: { testedAt: new Date() },
      });
    }

    return NextResponse.json({ ok, message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro de conexão";
    return NextResponse.json({ ok: false, message: msg });
  }
}
