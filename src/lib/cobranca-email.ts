import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { sendViaResend } from "@/lib/providers/resend";
import { sendViaSmtp, parseSmtpSettings } from "@/lib/providers/smtp";
import {
  boletoEmailHtml, boletoEmailSubject,
  pixEmailHtml, pixEmailSubject,
  nfEmailHtml, nfEmailSubject,
} from "@/lib/email-templates";
import { renderTemplate, DEFAULT_TEMPLATES } from "@/lib/email-render";
import { format } from "date-fns";

export type CobrancaEmailType = "BOLETO" | "PIX" | "NF";

export interface EnviarCobrancaEmailInput {
  tenantId: string;
  tenantName: string;
  type: CobrancaEmailType;
  documentId: string;
  to: string;
  replyTo?: string;
}

// ─── Resolve active email provider ───────────────────────────────────────────

async function getEmailConfig(tenantId: string) {
  const cfg = await prisma.integrationConfig.findFirst({
    where: { tenantId, isActive: true, provider: { in: ["RESEND", "SMTP"] } },
    orderBy: { updatedAt: "desc" },
  });
  if (!cfg?.apiKeyEnc) {
    throw new Error(
      "Nenhum provedor de e-mail ativo. Configure Resend ou SMTP em Admin → Integrações."
    );
  }
  return cfg;
}

// ─── Resolve custom template (falls back to DEFAULT_TEMPLATES) ───────────────

async function resolveTemplate(
  tenantId: string,
  type: CobrancaEmailType
): Promise<{ subject: string; body: string; isCustom: boolean }> {
  const saved = await prisma.emailTemplate.findUnique({
    where: { tenantId_type: { tenantId, type } },
  });
  if (saved?.isActive) {
    return { subject: saved.subject, body: saved.body, isCustom: true };
  }
  return { ...DEFAULT_TEMPLATES[type], isCustom: false };
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return format(d, "dd/MM/yyyy");
}

function fmtCurrency(amount: number): string {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function linkButton(href: string, label: string, bg: string): string {
  return `<a href="${href}" style="display:inline-block;background:${bg};color:white;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-family:Arial,sans-serif">${label}</a>`;
}

// ─── Send helper ──────────────────────────────────────────────────────────────

async function dispatch(
  cfg: Awaited<ReturnType<typeof getEmailConfig>>,
  opts: { to: string; subject: string; html: string; replyTo?: string }
) {
  const apiKey = decrypt(cfg.apiKeyEnc!);
  const settings = (cfg.settings ?? {}) as Record<string, string>;
  const fromName = settings.fromName ?? "Financeiro";
  const fromEmail = settings.fromEmail ?? "";
  const from = `${fromName} <${fromEmail}>`;

  if (cfg.provider === "RESEND") {
    await sendViaResend(apiKey, { ...opts, from });
  } else if (cfg.provider === "SMTP") {
    const smtpSettings = parseSmtpSettings(settings, apiKey);
    await sendViaSmtp(smtpSettings, opts);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function enviarCobrancaPorEmail(input: EnviarCobrancaEmailInput): Promise<void> {
  const [cfg, tmpl] = await Promise.all([
    getEmailConfig(input.tenantId),
    resolveTemplate(input.tenantId, input.type),
  ]);

  const today = fmtDate(new Date());

  if (input.type === "BOLETO") {
    const boleto = await prisma.boletoEmission.findUniqueOrThrow({
      where: { id: input.documentId },
      include: { receivableTitle: { include: { customer: true } } },
    });

    let html: string;
    let subject: string;

    if (tmpl.isCustom) {
      const vars: Record<string, string> = {
        aluno:           boleto.receivableTitle?.customer?.name ?? "Cliente",
        empresa:         input.tenantName,
        parcela:         boleto.receivableTitle?.documentNumber ?? "Cobrança",
        data_vencimento: fmtDate(boleto.dueDate),
        valor:           fmtCurrency(Number(boleto.amount)),
        data_atual:      today,
        linha_digitavel: boleto.digitableLine ?? "",
        codigo_barras:   boleto.barCode ?? "",
        link_pdf:        boleto.pdfUrl
          ? linkButton(boleto.pdfUrl, "📄 Baixar Boleto PDF", "#1e3a5f")
          : "",
      };
      html    = renderTemplate(tmpl.body, vars);
      subject = renderTemplate(tmpl.subject, vars);
    } else {
      html    = boletoEmailHtml(input.tenantName, {
        customerName:  boleto.receivableTitle?.customer?.name ?? "Cliente",
        amount:        Number(boleto.amount),
        dueDate:       boleto.dueDate,
        digitableLine: boleto.digitableLine ?? "",
        barCode:       boleto.barCode ?? undefined,
        pdfUrl:        boleto.pdfUrl ?? undefined,
      });
      subject = boletoEmailSubject(input.tenantName, Number(boleto.amount), boleto.dueDate);
    }

    await dispatch(cfg, { to: input.to, subject, html, replyTo: input.replyTo });
    await prisma.boletoEmission.update({
      where: { id: input.documentId },
      data: { emailSentAt: new Date(), emailSentTo: input.to },
    });

  } else if (input.type === "PIX") {
    const pix = await prisma.pixEmission.findUniqueOrThrow({
      where: { id: input.documentId },
      include: { receivableTitle: { include: { customer: true } } },
    });

    let html: string;
    let subject: string;

    if (tmpl.isCustom) {
      const qrImg = pix.qrCodeImage
        ? `<img src="${pix.qrCodeImage}" alt="QR Code PIX" style="width:180px;height:180px;border:4px solid #00897b;border-radius:8px;display:block;margin:0 auto" />`
        : "";
      const vars: Record<string, string> = {
        aluno:           pix.receivableTitle?.customer?.name ?? "Cliente",
        empresa:         input.tenantName,
        parcela:         pix.receivableTitle?.documentNumber ?? "Cobrança PIX",
        data_vencimento: fmtDate(pix.expiresAt),
        valor:           fmtCurrency(Number(pix.amount)),
        data_atual:      today,
        pix_copia_cola:  pix.qrCode ?? "",
        qrcode_img:      qrImg,
      };
      html    = renderTemplate(tmpl.body, vars);
      subject = renderTemplate(tmpl.subject, vars);
    } else {
      html    = pixEmailHtml(input.tenantName, {
        customerName: pix.receivableTitle?.customer?.name ?? "Cliente",
        amount:       Number(pix.amount),
        expiresAt:    pix.expiresAt,
        qrCode:       pix.qrCode ?? "",
        qrCodeImage:  pix.qrCodeImage ?? undefined,
      });
      subject = pixEmailSubject(input.tenantName, Number(pix.amount));
    }

    await dispatch(cfg, { to: input.to, subject, html, replyTo: input.replyTo });
    await prisma.pixEmission.update({
      where: { id: input.documentId },
      data: { emailSentAt: new Date(), emailSentTo: input.to },
    });

  } else if (input.type === "NF") {
    const nf = await prisma.invoiceEmission.findUniqueOrThrow({
      where: { id: input.documentId },
      include: {
        receivableTitle: { include: { customer: true } },
        paymentTitle:    { include: { supplier: true } },
      },
    });

    const recipientName =
      nf.receivableTitle?.customer?.name ?? nf.paymentTitle?.supplier?.name ?? "Cliente";

    let html: string;
    let subject: string;

    if (tmpl.isCustom) {
      const vars: Record<string, string> = {
        aluno:           recipientName,
        empresa:         input.tenantName,
        parcela:         nf.receivableTitle?.documentNumber ?? nf.paymentTitle?.documentNumber ?? "Cobrança",
        data_vencimento: fmtDate(nf.issuedAt),
        valor:           fmtCurrency(Number(nf.receivableTitle?.originalValue ?? nf.paymentTitle?.originalValue ?? 0)),
        data_atual:      today,
        numero_nf:       nf.number ?? "",
        link_pdf:        nf.pdfUrl  ? linkButton(nf.pdfUrl,  "📄 Baixar PDF NF", "#7c3aed") : "",
        link_xml:        nf.xmlUrl  ? linkButton(nf.xmlUrl,  "📋 Baixar XML",    "#6d28d9") : "",
      };
      html    = renderTemplate(tmpl.body, vars);
      subject = renderTemplate(tmpl.subject, vars);
    } else {
      html    = nfEmailHtml(input.tenantName, {
        customerName: recipientName,
        number:       nf.number   ?? undefined,
        protocol:     nf.protocol ?? undefined,
        pdfUrl:       nf.pdfUrl   ?? undefined,
        xmlUrl:       nf.xmlUrl   ?? undefined,
        issuedAt:     nf.issuedAt,
      });
      subject = nfEmailSubject(input.tenantName, nf.number ?? undefined);
    }

    await dispatch(cfg, { to: input.to, subject, html, replyTo: input.replyTo });
    await prisma.invoiceEmission.update({
      where: { id: input.documentId },
      data: { emailSentAt: new Date(), emailSentTo: input.to },
    });
  }
}
