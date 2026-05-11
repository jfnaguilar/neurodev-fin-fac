import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmt = (d: Date | string) =>
  format(new Date(d), "dd/MM/yyyy", { locale: ptBR });

// ─── Base layout ─────────────────────────────────────────────────────────────

function base(tenantName: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <!-- header -->
      <tr><td style="background:#1e293b;padding:24px 32px;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Cobrança</p>
        <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;">${tenantName}</p>
      </td></tr>
      <!-- body -->
      <tr><td style="padding:32px;">
        ${content}
      </td></tr>
      <!-- footer -->
      <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
          Este e-mail foi enviado automaticamente por ${tenantName}. Não responda a esta mensagem.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function infoRow(label: string, value: string, highlight = false): string {
  return `<tr>
    <td style="padding:8px 0;color:#64748b;font-size:13px;width:160px;">${label}</td>
    <td style="padding:8px 0;color:${highlight ? "#0f172a" : "#334155"};font-size:13px;font-weight:${highlight ? "700" : "400"};">${value}</td>
  </tr>`;
}

function ctaButton(text: string, href: string, color = "#2563eb"): string {
  return `<a href="${href}" target="_blank"
    style="display:inline-block;margin-top:4px;padding:10px 20px;background:${color};color:#ffffff;
           font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">
    ${text}
  </a>`;
}

// ─── Boleto ───────────────────────────────────────────────────────────────────

interface BoletoEmailData {
  customerName: string;
  amount: number;
  dueDate: Date | string;
  digitableLine: string;
  barCode?: string;
  pdfUrl?: string;
  description?: string;
}

export function boletoEmailHtml(tenantName: string, data: BoletoEmailData): string {
  const content = `
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong>${data.customerName}</strong>.</p>
    <p style="margin:0 0 24px;color:#334155;font-size:14px;">
      Segue abaixo o boleto para pagamento.${data.description ? " <em>" + data.description + "</em>." : ""}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Valor", BRL(data.amount), true)}
      ${infoRow("Vencimento", fmt(data.dueDate), true)}
    </table>

    <div style="margin:24px 0;padding:16px;background:#f1f5f9;border-radius:8px;border-left:4px solid #2563eb;">
      <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Linha Digitável</p>
      <p style="margin:0;color:#0f172a;font-size:15px;font-family:monospace;font-weight:700;letter-spacing:.04em;word-break:break-all;">
        ${data.digitableLine || "—"}
      </p>
    </div>

    ${data.pdfUrl ? `<p style="margin:0 0 8px;">${ctaButton("📄 Baixar Boleto PDF", data.pdfUrl)}</p>` : ""}

    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Pague em qualquer banco, lotérica ou aplicativo bancário.<br>
      Após o vencimento, o boleto poderá sofrer acréscimo de multa e juros.
    </p>`;

  return base(tenantName, content);
}

export function boletoEmailSubject(tenantName: string, amount: number, dueDate: Date | string): string {
  return `Boleto ${BRL(amount)} – Vencimento ${fmt(dueDate)} | ${tenantName}`;
}

// ─── PIX ─────────────────────────────────────────────────────────────────────

interface PixEmailData {
  customerName: string;
  amount: number;
  expiresAt?: Date | string | null;
  qrCode: string;          // copia-e-cola payload
  qrCodeImage?: string;    // base64 PNG (sem prefixo)
  description?: string;
}

export function pixEmailHtml(tenantName: string, data: PixEmailData): string {
  const qrImageTag = data.qrCodeImage
    ? `<img src="data:image/png;base64,${data.qrCodeImage}" alt="QR Code PIX"
            width="200" height="200" style="display:block;margin:0 auto 12px;" />`
    : "";

  const content = `
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong>${data.customerName}</strong>.</p>
    <p style="margin:0 0 24px;color:#334155;font-size:14px;">
      Sua cobrança via <strong>PIX</strong> está disponível.${data.description ? " <em>" + data.description + "</em>." : ""}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Valor", BRL(data.amount), true)}
      ${data.expiresAt ? infoRow("Válido até", fmt(data.expiresAt)) : ""}
    </table>

    <div style="margin:24px 0;text-align:center;padding:24px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
      <p style="margin:0 0 16px;color:#166534;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">QR Code PIX</p>
      ${qrImageTag}
      <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.06em;">Ou use o PIX Copia e Cola:</p>
      <div style="background:#ffffff;border:1px solid #d1fae5;border-radius:6px;padding:12px;word-break:break-all;">
        <code style="font-size:11px;color:#065f46;line-height:1.6;">${data.qrCode}</code>
      </div>
    </div>

    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Abra o aplicativo do seu banco, escolha <strong>Pagar com PIX</strong> e escaneie o QR Code<br>
      ou copie e cole o código acima. O pagamento é confirmado em segundos.
    </p>`;

  return base(tenantName, content);
}

export function pixEmailSubject(tenantName: string, amount: number): string {
  return `Cobrança PIX ${BRL(amount)} | ${tenantName}`;
}

// ─── Nota Fiscal ─────────────────────────────────────────────────────────────

interface NfEmailData {
  customerName: string;
  number?: string;
  protocol?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  description?: string;
  issuedAt?: Date | string | null;
}

export function nfEmailHtml(tenantName: string, data: NfEmailData): string {
  const content = `
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong>${data.customerName}</strong>.</p>
    <p style="margin:0 0 24px;color:#334155;font-size:14px;">
      Sua Nota Fiscal de Serviços foi emitida com sucesso.${data.description ? "<br><em>" + data.description + "</em>" : ""}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${data.number ? infoRow("Número da NF", data.number, true) : ""}
      ${data.protocol ? infoRow("Protocolo", data.protocol) : ""}
      ${data.issuedAt ? infoRow("Emissão", fmt(data.issuedAt)) : ""}
    </table>

    <div style="margin:24px 0;display:flex;gap:12px;">
      ${data.pdfUrl ? `<p style="margin:0 0 8px;">${ctaButton("📄 Baixar NF-e (PDF)", data.pdfUrl, "#7c3aed")}</p>` : ""}
      ${data.xmlUrl ? `<p style="margin:0 0 8px;">${ctaButton("📂 Baixar NF-e (XML)", data.xmlUrl, "#0f766e")}</p>` : ""}
    </div>

    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      Guarde este documento. A Nota Fiscal de Serviços é um documento fiscal obrigatório.
    </p>`;

  return base(tenantName, content);
}

export function nfEmailSubject(tenantName: string, number?: string): string {
  return `Nota Fiscal de Serviços${number ? " nº " + number : ""} | ${tenantName}`;
}
