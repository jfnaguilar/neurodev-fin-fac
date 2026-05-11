// ─── Variable registry ────────────────────────────────────────────────────────

export interface TemplateVar {
  key: string;
  description: string;
}

export const COMMON_VARS: TemplateVar[] = [
  { key: "$aluno",           description: "Nome completo do aluno/cliente" },
  { key: "$empresa",         description: "Nome da instituição de ensino" },
  { key: "$parcela",         description: "Número ou descrição da parcela" },
  { key: "$data_vencimento", description: "Data de vencimento (DD/MM/AAAA)" },
  { key: "$valor",           description: "Valor formatado (R$ 1.850,00)" },
  { key: "$data_atual",      description: "Data de hoje (DD/MM/AAAA)" },
];

export const TYPE_VARS: Record<string, TemplateVar[]> = {
  BOLETO: [
    { key: "$linha_digitavel", description: "Linha digitável do boleto" },
    { key: "$link_pdf",        description: "Botão link para download do PDF do boleto" },
  ],
  PIX: [
    { key: "$pix_copia_cola", description: "Código PIX copia e cola (texto completo)" },
    { key: "$qrcode_img",     description: "Imagem do QR Code PIX (tag <img> inline)" },
  ],
  NF: [
    { key: "$numero_nf", description: "Número da nota fiscal emitida" },
    { key: "$link_pdf",  description: "Botão link para download do PDF da NF" },
    { key: "$link_xml",  description: "Botão link para download do XML da NF" },
  ],
};

// ─── Sample values for live preview ──────────────────────────────────────────

export const SAMPLE_VARS: Record<string, string> = {
  aluno:           "João da Silva",
  empresa:         "Faculdade Exemplo",
  parcela:         "Mensalidade 05/2026",
  data_vencimento: "10/05/2026",
  valor:           "R$ 1.850,00",
  data_atual:      "05/05/2026",
  linha_digitavel: "10493.90008 00000.752226 02000.117182 9 94850000185000",
  link_pdf:        '<a href="#" style="display:inline-block;background:#1e3a5f;color:white;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-family:Arial,sans-serif">&#128196; Baixar Boleto PDF</a>',
  pix_copia_cola:  "00020126360014BR.GOV.BCB.PIX01142025050500000001234560212MENSALIDADE0526053039865802BR5913JOAO DA SILVA6009SAO PAULO63041D3E",
  qrcode_img:      '<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2YwZjlmNiIgcng9IjgiLz48dGV4dCB4PSI5MCIgeT0iODUiIGZpbGw9IiMwMDg5N2IiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTMiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZHk9IjAuM2VtIj5RUiBDb2RlIFBJWDwvdGV4dD48L3N2Zz4=" alt="QR Code PIX" style="width:180px;height:180px;border:4px solid #00897b;border-radius:8px;display:block;margin:0 auto" />',
  numero_nf:       "NFS-e 00001234",
  link_xml:        '<a href="#" style="display:inline-block;background:#7c3aed;color:white;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-family:Arial,sans-serif">&#128203; Baixar XML</a>',
};

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\$([a-zA-Z_]+)/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? val : `$${key}`;
  });
}

// ─── Default templates ────────────────────────────────────────────────────────

const BASE_CSS = `
  body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:24px}
  .card{background:#fff;max-width:600px;margin:0 auto;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.1)}
  .header{padding:28px 24px;text-align:center}
  .header h2{margin:0 0 4px;font-size:20px}
  .header p{margin:0;opacity:.85;font-size:13px}
  .body{padding:28px 24px}
  .body p{color:#334155;line-height:1.6;margin:0 0 12px}
  .info-table{width:100%;border-collapse:collapse;margin:16px 0}
  .info-table td{padding:8px 12px;font-size:14px}
  .info-table tr:nth-child(odd) td{background:#f8fafc}
  .lbl{color:#64748b}
  .val{font-weight:700;text-align:right}
  .code-box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:12px 16px;font-family:monospace;font-size:12px;word-break:break-all;margin:12px 0;color:#334155}
  .center{text-align:center;margin:20px 0}
  .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;font-size:11px;color:#94a3b8;text-align:center}
  .note{font-size:11px;color:#94a3b8;margin-top:20px;line-height:1.5}
`;

export const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  BOLETO: {
    subject: "$empresa — Boleto: $parcela (Venc. $data_vencimento)",
    body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${BASE_CSS}
  .header{background:#1e3a5f;color:#fff}
  .amount{font-size:26px;font-weight:700;color:#1e3a5f}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h2>$empresa</h2>
    <p>Cobrança por Boleto Bancário</p>
  </div>
  <div class="body">
    <p>Olá, <strong>$aluno</strong>!</p>
    <p>Encaminhamos o boleto referente a <strong>$parcela</strong>. Efetue o pagamento até a data de vencimento para evitar juros e multa.</p>
    <table class="info-table">
      <tr><td class="lbl">Referência</td><td class="val">$parcela</td></tr>
      <tr><td class="lbl">Vencimento</td><td class="val">$data_vencimento</td></tr>
      <tr><td class="lbl">Valor</td><td class="val amount">$valor</td></tr>
    </table>
    <p style="color:#64748b;font-size:13px;margin-bottom:4px">Linha Digitável:</p>
    <div class="code-box">$linha_digitavel</div>
    <div class="center">$link_pdf</div>
    <p class="note">
      Caso já tenha efetuado o pagamento, desconsidere este e-mail.
      Dúvidas? Responda este e-mail ou entre em contato com nossa secretaria.
    </p>
  </div>
  <div class="footer">Enviado em $data_atual · $empresa</div>
</div>
</body>
</html>`,
  },

  PIX: {
    subject: "$empresa — Cobrança PIX: $parcela",
    body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${BASE_CSS}
  .header{background:#00897b;color:#fff}
  .amount{font-size:26px;font-weight:700;color:#00897b}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h2>$empresa</h2>
    <p>Cobrança via PIX</p>
  </div>
  <div class="body">
    <p>Olá, <strong>$aluno</strong>!</p>
    <p>Segue o QR Code PIX referente a <strong>$parcela</strong>. Pague de forma rápida e sem taxas diretamente pelo seu banco.</p>
    <table class="info-table">
      <tr><td class="lbl">Referência</td><td class="val">$parcela</td></tr>
      <tr><td class="lbl">Vencimento</td><td class="val">$data_vencimento</td></tr>
      <tr><td class="lbl">Valor</td><td class="val amount">$valor</td></tr>
    </table>
    <div class="center">$qrcode_img</div>
    <p style="color:#64748b;font-size:13px;margin:16px 0 4px">PIX Copia e Cola:</p>
    <div class="code-box">$pix_copia_cola</div>
    <p class="note">
      O QR Code tem validade. Em caso de expiração, solicite novo código.
      Caso já tenha pago, desconsidere este e-mail.
    </p>
  </div>
  <div class="footer">Enviado em $data_atual · $empresa</div>
</div>
</body>
</html>`,
  },

  NF: {
    subject: "$empresa — Nota Fiscal Emitida: $parcela",
    body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${BASE_CSS}
  .header{background:#7c3aed;color:#fff}
  .btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:20px 0}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h2>$empresa</h2>
    <p>Nota Fiscal Emitida com Sucesso</p>
  </div>
  <div class="body">
    <p>Olá, <strong>$aluno</strong>!</p>
    <p>Sua nota fiscal referente a <strong>$parcela</strong> foi emitida e está disponível para download.</p>
    <table class="info-table">
      <tr><td class="lbl">Número da NF</td><td class="val">$numero_nf</td></tr>
      <tr><td class="lbl">Referência</td><td class="val">$parcela</td></tr>
      <tr><td class="lbl">Valor</td><td class="val">$valor</td></tr>
      <tr><td class="lbl">Data de Emissão</td><td class="val">$data_atual</td></tr>
    </table>
    <div class="btns">$link_pdf $link_xml</div>
    <p class="note">
      Guarde este documento para sua declaração de imposto de renda.
      Dúvidas? Responda este e-mail ou entre em contato com nossa secretaria.
    </p>
  </div>
  <div class="footer">Enviado em $data_atual · $empresa</div>
</div>
</body>
</html>`,
  },
};
