"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard, FileText, Zap, CheckCircle, XCircle, AlertCircle,
  Eye, EyeOff, Save, Loader2, RefreshCw, ExternalLink, Info, Settings,
  GraduationCap, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = "STRIPE" | "ASAAS" | "FOCUSNFE" | "PAGSEGURO" | "ABACATE" | "RESEND" | "SMTP" | "GENNERA";

interface ProviderConfig {
  provider: Provider;
  isActive: boolean;
  isSandbox: boolean;
  hasApiKey: boolean;
  apiKeyMasked: string | null;
  settings: Record<string, string | null>;
  testedAt: string | null;
  updatedAt: string | null;
}

// ─── Provider metadata ────────────────────────────────────────────────────────

const PROVIDER_META: Record<Provider, {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  features: string[];
  docsUrl: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  sandboxLabel: string;
  extraFields?: { key: string; label: string; placeholder: string; hint?: string }[];
}> = {
  STRIPE: {
    name: "Stripe",
    description: "Emissão de boletos para clientes internacionais e premium. Secret key começa com sk_live_ (produção) ou sk_test_ (sandbox).",
    icon: CreditCard,
    color: "text-indigo-400",
    features: ["Boleto bancário", "Checkout hospedado", "Webhook em tempo real"],
    docsUrl: "https://dashboard.stripe.com/apikeys",
    apiKeyLabel: "Secret Key",
    apiKeyPlaceholder: "sk_live_... ou sk_test_...",
    sandboxLabel: "Modo Teste (sk_test_)",
    extraFields: [
      { key: "webhookSecret", label: "Webhook Secret", placeholder: "whsec_...", hint: "Criado em Developers → Webhooks → Endpoint URL: /api/webhooks/stripe" },
    ],
  },
  ASAAS: {
    name: "Asaas",
    description: "Gateway brasileiro completo: boleto, PIX e NFSe. Suporta split de pagamento, subcontas e cobrança recorrente.",
    icon: Zap,
    color: "text-yellow-400",
    features: ["Boleto bancário", "PIX (QR Code + Copia-e-cola)", "NFSe (Nota Fiscal de Serviços)", "Webhook em tempo real", "Split de pagamento"],
    docsUrl: "https://docs.asaas.com",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "$aact_... (produção) ou $aasp_... (sandbox)",
    sandboxLabel: "Modo Sandbox",
    extraFields: [
      { key: "pixExpirationDays", label: "Validade do PIX (dias)", placeholder: "1", hint: "Dias de validade do QR Code PIX a partir da data de emissão (padrão: 1 dia)" },
      { key: "municipalServiceCode", label: "Código Serviço Municipal (NFSe)", placeholder: "0101", hint: "Código LC116 para emissão de nota fiscal de serviço" },
    ],
  },
  FOCUSNFE: {
    name: "Focus NFe",
    description: "Plataforma especializada em emissão de NF-e (produto) e NFSe (serviço). Suporta todos os municípios brasileiros.",
    icon: FileText,
    color: "text-emerald-400",
    features: ["NF-e (produto)", "NFSe (serviço)", "NFC-e", "Cancelamento e inutilização"],
    docsUrl: "https://focusnfe.com.br/documentacao",
    apiKeyLabel: "Token API",
    apiKeyPlaceholder: "token_sandbox_... ou token_producao_...",
    sandboxLabel: "Ambiente Homologação",
    extraFields: [
      { key: "cnpj", label: "CNPJ Emissor", placeholder: "00.000.000/0001-00", hint: "CNPJ cadastrado no FocusNFe" },
      { key: "codigoServico", label: "Código Serviço (padrão)", placeholder: "0101" },
      { key: "itemListaServico", label: "Item Lista Serviço LC116", placeholder: "01.01" },
      { key: "aliquota", label: "Alíquota ISS (%)", placeholder: "5" },
      { key: "municipioPrestacao", label: "Código IBGE Município", placeholder: "3550308", hint: "Ex: 3550308 = São Paulo" },
    ],
  },
  PAGSEGURO: {
    name: "PagSeguro (PagBank)",
    description: "Gateway brasileiro líder de mercado. Autenticação OAuth2 via Client ID + Client Secret. Suporta boleto bancário com código de barras nativo.",
    icon: CreditCard,
    color: "text-orange-400",
    features: ["Boleto bancário", "Código de barras nativo", "Webhook em tempo real", "Sandbox incluso"],
    docsUrl: "https://dev.pagbank.uol.com.br/reference",
    apiKeyLabel: "Client ID : Client Secret",
    apiKeyPlaceholder: "clientId:clientSecret",
    sandboxLabel: "Modo Sandbox",
    extraFields: [],
  },
  ABACATE: {
    name: "Abacate Pay",
    description: "Fintech brasileira focada em boleto e PIX. Autenticação por API Key. Retorna uma página de checkout hospedada com boleto e PIX integrados.",
    icon: Zap,
    color: "text-green-400",
    features: ["Boleto bancário", "PIX", "Página de checkout hospedada", "Webhook de eventos"],
    docsUrl: "https://abacatepay.readme.io/reference",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "eyJ... (Bearer token)",
    sandboxLabel: "Modo Teste",
    extraFields: [],
  },
  RESEND: {
    name: "Resend",
    description: "Plataforma moderna de e-mail transacional. Configure um domínio verificado no Resend e insira a API key. Sem servidores SMTP para gerenciar.",
    icon: FileText,
    color: "text-rose-400",
    features: ["E-mail de boleto (com linha digitável)", "E-mail de PIX (QR Code inline)", "E-mail de NF-e/NFSe (PDF + XML)", "Alta entregabilidade"],
    docsUrl: "https://resend.com/docs",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "re_...",
    sandboxLabel: "Modo Teste (envia apenas para e-mails verificados)",
    extraFields: [
      { key: "fromEmail", label: "E-mail Remetente", placeholder: "financeiro@suaempresa.com.br", hint: "Deve ser de um domínio verificado no Resend" },
      { key: "fromName", label: "Nome do Remetente", placeholder: "Financeiro NeuroDev" },
    ],
  },
  SMTP: {
    name: "SMTP",
    description: "Envio de e-mails via servidor SMTP próprio. Compatible com Gmail, Outlook, Amazon SES, Mailgun e qualquer servidor SMTP.",
    icon: Settings,
    color: "text-slate-400",
    features: ["Boleto, PIX e NF-e por e-mail", "Servidor próprio / provedor de sua escolha", "Gmail, SES, Mailgun, Brevo e outros"],
    docsUrl: "https://nodemailer.com/smtp/",
    apiKeyLabel: "Senha SMTP",
    apiKeyPlaceholder: "Senha do servidor SMTP (armazenada criptografada)",
    sandboxLabel: "Modo Teste (não envia de fato — apenas valida conexão)",
    extraFields: [
      { key: "smtpHost", label: "Host SMTP", placeholder: "smtp.gmail.com", hint: "" },
      { key: "smtpPort", label: "Porta SMTP", placeholder: "587", hint: "587 (STARTTLS) ou 465 (SSL)" },
      { key: "smtpSecure", label: "SSL/TLS (porta 465)", placeholder: "false", hint: "Use 'true' para porta 465; 'false' para 587/25" },
      { key: "smtpUser", label: "Usuário SMTP", placeholder: "financeiro@suaempresa.com.br" },
      { key: "fromEmail", label: "E-mail Remetente", placeholder: "financeiro@suaempresa.com.br" },
      { key: "fromName", label: "Nome do Remetente", placeholder: "Financeiro NeuroDev" },
    ],
  },
  GENNERA: {
    name: "Gennera",
    description: "Sistema acadêmico Gennera. Sincroniza alunos, matrículas, contratos e pagamentos com o financeiro. Autenticação por usuário + senha da instituição.",
    icon: GraduationCap,
    color: "text-blue-400",
    features: ["Sync de alunos (Persons)", "Sync de matrículas e faturas", "Importação de pagamentos", "Notificação de inadimplência", "Sync de turmas / cursos"],
    docsUrl: "https://api2.gennera.com.br/docs/",
    apiKeyLabel: "Senha do usuário Gennera",
    apiKeyPlaceholder: "Senha de acesso à API Gennera (armazenada criptografada)",
    sandboxLabel: "Ambiente de homologação Gennera",
    extraFields: [
      { key: "idInstitution", label: "ID da Instituição", placeholder: "123", hint: "Número da instituição cadastrada no Gennera (idInstitution)" },
      { key: "username", label: "Usuário (login)", placeholder: "usuario@faculdade.edu.br", hint: "Login de acesso à API do Gennera" },
      { key: "cnpj", label: "CNPJ da Instituição", placeholder: "00.000.000/0001-00", hint: "Apenas para referência/auditoria — não usado na autenticação" },
      { key: "delinquencyDaysThreshold", label: "Limiar de inadimplência (dias)", placeholder: "30", hint: "Número de dias em atraso para considerar o aluno inadimplente no Gennera" },
      { key: "autoSyncEnabled", label: "Sync automático habilitado", placeholder: "false", hint: "Ative 'true' para sincronizar automaticamente via cron (requer configuração de scheduler)" },
      { key: "autoBlockOnDelinquency", label: "Bloquear matrícula ao inadimplir", placeholder: "false", hint: "Se 'true', atualiza o status da matrícula para bloqueado no Gennera quando inadimplente" },
    ],
  },
};

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({ initial }: { initial: ProviderConfig }) {
  const { toast } = useToast();
  const meta = PROVIDER_META[initial.provider];

  const [config, setConfig] = useState(initial);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fmtDate = (iso: string | null) => {
    if (!iso) return null;
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/integracao/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          isActive: config.isActive,
          isSandbox: config.isSandbox,
          apiKey: apiKey || undefined,
          settings: extraValues,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Configuração salva", description: `${meta.name} atualizado com sucesso.` });
        setConfig((prev) => ({ ...prev, isActive: data.isActive, hasApiKey: apiKey ? true : prev.hasApiKey }));
        setApiKey("");
      } else {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/integracao/testar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: config.provider }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Conexão OK", description: data.message });
        setConfig((prev) => ({ ...prev, testedAt: new Date().toISOString() }));
      } else {
        toast({ title: "Falha na conexão", description: data.message, variant: "destructive" });
      }
    } finally {
      setTesting(false);
    }
  };

  const Icon = meta.icon;

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${config.isActive ? "border-slate-700" : "border-slate-800"}`}>
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 ${meta.color}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{meta.name}</span>
            {config.isActive ? (
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />Ativo
              </Badge>
            ) : (
              <Badge className="bg-slate-800 text-slate-500 border-slate-700 text-xs">Inativo</Badge>
            )}
            {config.isSandbox && config.isActive && (
              <Badge className="bg-yellow-950 text-yellow-400 border-yellow-800 text-xs">Sandbox</Badge>
            )}
            {config.testedAt && (
              <span className="text-xs text-slate-500">
                <CheckCircle className="h-3 w-3 inline mr-0.5 text-emerald-500" />
                Testado {fmtDate(config.testedAt)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{meta.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Active toggle */}
          <button
            onClick={() => setConfig((prev) => ({ ...prev, isActive: !prev.isActive }))}
            className={`relative h-5 w-9 rounded-full transition-colors ${config.isActive ? "bg-blue-600" : "bg-slate-700"}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${config.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700"
          >
            {expanded ? "Fechar" : "Configurar"}
          </button>
        </div>
      </div>

      {/* Features chips */}
      {!expanded && (
        <div className="px-5 pb-4 flex gap-2 flex-wrap">
          {meta.features.map((f) => (
            <span key={f} className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{f}</span>
          ))}
        </div>
      )}

      {/* Expanded configuration */}
      {expanded && (
        <>
          <Separator className="bg-slate-800" />
          <div className="px-5 py-5 space-y-4">
            {/* Description + docs */}
            <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg">
              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 leading-relaxed">{meta.description}</p>
                <a
                  href={meta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="h-3 w-3" /> Documentação
                </a>
              </div>
            </div>

            {/* Sandbox toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300 font-medium">{meta.sandboxLabel}</p>
                <p className="text-xs text-slate-500">Desative apenas quando pronto para produção</p>
              </div>
              <button
                onClick={() => setConfig((prev) => ({ ...prev, isSandbox: !prev.isSandbox }))}
                className={`relative h-5 w-9 rounded-full transition-colors ${config.isSandbox ? "bg-yellow-600" : "bg-slate-700"}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${config.isSandbox ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{meta.apiKeyLabel}</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config.hasApiKey ? `Atual: ${config.apiKeyMasked} (deixe em branco para manter)` : meta.apiKeyPlaceholder}
                  className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Extra provider-specific fields */}
            {meta.extraFields?.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{field.label}</label>
                <input
                  type="text"
                  value={extraValues[field.key] ?? ""}
                  onChange={(e) => setExtraValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={
                    config.settings[field.key]
                      ? `Atual: ${config.settings[field.key]} (deixe em branco para manter)`
                      : field.placeholder
                  }
                  className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {field.hint && <p className="text-xs text-slate-500">{field.hint}</p>}
              </div>
            ))}

            {/* Webhook URL info */}
            {config.provider === "STRIPE" && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-400 font-medium mb-1">URL do Webhook (configurar no Stripe Dashboard):</p>
                <code className="text-xs text-blue-400 font-mono break-all">
                  {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhooks/stripe
                </code>
              </div>
            )}
            {config.provider === "ASAAS" && (
              <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                <p className="text-xs text-slate-400 font-medium">URL do Webhook (configurar no painel Asaas → Integrações → Webhook):</p>
                <code className="text-xs text-blue-400 font-mono break-all">
                  {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhooks/asaas
                </code>
                <p className="text-xs text-slate-500">
                  Eventos tratados: <strong className="text-slate-400">PAYMENT_RECEIVED</strong>, <strong className="text-slate-400">PAYMENT_OVERDUE</strong>, <strong className="text-slate-400">PAYMENT_DELETED</strong> (boleto e PIX) e <strong className="text-slate-400">INVOICE_AUTHORIZED</strong> (NFSe).
                </p>
              </div>
            )}
            {config.provider === "PAGSEGURO" && (
              <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                <p className="text-xs text-slate-400 font-medium">URL do Webhook (configurar em PagBank → Notificações):</p>
                <code className="text-xs text-blue-400 font-mono break-all">
                  {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhooks/pagseguro
                </code>
                <p className="text-xs text-slate-500">
                  Credenciais no formato <strong className="text-slate-400">clientId:clientSecret</strong> — obtidas no console PagBank em Sua Conta → Credenciais.
                </p>
              </div>
            )}
            {config.provider === "ABACATE" && (
              <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                <p className="text-xs text-slate-400 font-medium">URL do Webhook (configurar no dashboard Abacate Pay):</p>
                <code className="text-xs text-blue-400 font-mono break-all">
                  {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhooks/abacate
                </code>
                <p className="text-xs text-slate-500">
                  Eventos suportados: <strong className="text-slate-400">billing.paid</strong>, <strong className="text-slate-400">billing.expired</strong>, <strong className="text-slate-400">billing.cancelled</strong>
                </p>
              </div>
            )}
            {config.provider === "GENNERA" && (
              <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-lg space-y-2">
                <p className="text-xs text-blue-300 font-medium flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Painel de Sincronização Gennera
                </p>
                <p className="text-xs text-blue-200/70 leading-relaxed">
                  Após salvar e testar a conexão, acesse o painel dedicado para executar e acompanhar as sincronizações.
                </p>
                <a
                  href="/admin/integracoes/gennera"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  Abrir painel de sincronização <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Salvar
              </Button>
              {config.hasApiKey && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing}
                  className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                  Testar Conexão
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegracoesPage() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integracao/config");
      if (res.ok) setConfigs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Integrações de Pagamento e Faturamento</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Configure os provedores de boleto e nota fiscal para este tenant. As API keys são armazenadas criptografadas (AES-256-GCM).
        </p>
      </div>

      {/* Pluggy notice */}
      <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 flex gap-3">
        <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-300 leading-relaxed">
          <strong>Sobre o Pluggy:</strong> A integração Pluggy já está ativa em{" "}
          <span className="font-mono">Integrações Bancárias → Open Finance</span>.
          O Pluggy é um <strong>agregador de dados bancários em modo leitura</strong> (Open Finance Brasil) e
          não emite boletos. Para emissão de cobranças, use Stripe, Asaas, PagSeguro ou Abacate Pay abaixo.
        </div>
      </div>

      {/* Provider cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Pagamento e Faturamento</p>
            <div className="space-y-4">
              {configs
                .filter((c) => ["STRIPE", "ASAAS", "FOCUSNFE", "PAGSEGURO", "ABACATE"].includes(c.provider))
                .map((cfg) => <ProviderCard key={cfg.provider} initial={cfg} />)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Envio de Cobranças por E-mail</p>
            <div className="space-y-4">
              {configs
                .filter((c) => ["RESEND", "SMTP"].includes(c.provider))
                .map((cfg) => <ProviderCard key={cfg.provider} initial={cfg} />)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Integração Acadêmica</p>
            <div className="space-y-4">
              {configs
                .filter((c) => ["GENNERA"].includes(c.provider))
                .map((cfg) => <ProviderCard key={cfg.provider} initial={cfg} />)}
            </div>
          </div>
        </div>
      )}

      {/* Boleto/NF-e API summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Endpoints de Integração</h2>
        <div className="space-y-2 text-xs font-mono text-slate-400">
          {[
            ["POST", "/api/boleto/emitir", "Emite boleto a partir de um título a receber"],
            ["GET", "/api/boleto/{id}", "Consulta status do boleto (atualiza automaticamente)"],
            ["DELETE", "/api/boleto/{id}", "Cancela boleto pendente"],
            ["POST", "/api/pix/emitir", "Emite cobrança PIX (QR Code + copia-e-cola) via Asaas"],
            ["GET", "/api/pix/{id}", "Consulta status do PIX (atualiza automaticamente)"],
            ["DELETE", "/api/pix/{id}", "Cancela cobrança PIX pendente"],
            ["POST", "/api/nfe/emitir", "Emite NF-e/NFSe a partir de um título"],
            ["GET", "/api/nfe/{id}", "Consulta status da nota fiscal"],
            ["DELETE", "/api/nfe/{id}", "Cancela nota fiscal emitida"],
          ].map(([method, path, desc]) => (
            <div key={path} className="flex items-start gap-3">
              <span className={`shrink-0 font-bold ${method === "POST" ? "text-emerald-400" : method === "DELETE" ? "text-red-400" : "text-blue-400"}`}>
                {method}
              </span>
              <span className="text-white shrink-0">{path}</span>
              <span className="text-slate-500 hidden sm:inline">— {desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security notice */}
      <div className="flex gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
        <XCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          As API keys são <strong className="text-slate-400">criptografadas com AES-256-GCM</strong> antes de serem
          armazenadas no banco de dados. Nenhuma chave trafega em texto puro após o salvamento.
          O sistema <strong className="text-slate-400">nunca exibe a chave completa</strong> novamente após configurada —
          apenas os primeiros e últimos 4 caracteres são mostrados para confirmação.
        </p>
      </div>
    </div>
  );
}
