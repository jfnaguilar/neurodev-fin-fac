"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Mail, CheckCircle, Clock, XCircle, AlertTriangle,
  RefreshCw, Loader2, FileText, QrCode, Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnviarCobrancaButton, CobrancaType } from "@/components/billing/EnviarCobrancaButton";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Emission {
  id: string;
  type: CobrancaType;
  provider: string;
  customerName: string;
  customerEmail: string | null;
  amount: number | null;
  dueDate: string | null;
  status: string;
  emailSentAt: string | null;
  emailSentTo: string | null;
  pdfUrl?: string | null;
  digitableLine?: string | null;
  qrCode?: string | null;
  number?: string | null;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: string | null) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";

const fmtDateTime = (d: string | null) =>
  d ? format(new Date(d), "dd/MM HH:mm", { locale: ptBR }) : null;

function TypeBadge({ type }: { type: CobrancaType }) {
  const map = {
    BOLETO: { label: "Boleto", icon: Receipt, cls: "bg-blue-950 text-blue-300 border-blue-800" },
    PIX: { label: "PIX", icon: QrCode, cls: "bg-green-950 text-green-300 border-green-800" },
    NF: { label: "NF-e", icon: FileText, cls: "bg-purple-950 text-purple-300 border-purple-800" },
  };
  const { label, icon: Icon, cls } = map[type];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    PENDING:    { label: "Pendente",   cls: "bg-yellow-950 text-yellow-300 border-yellow-800", icon: <Clock className="h-3 w-3" /> },
    PROCESSING: { label: "Processando",cls: "bg-blue-950 text-blue-300 border-blue-800",       icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    PAID:       { label: "Pago",       cls: "bg-emerald-950 text-emerald-300 border-emerald-800", icon: <CheckCircle className="h-3 w-3" /> },
    RECEIVED:   { label: "Recebido",   cls: "bg-emerald-950 text-emerald-300 border-emerald-800", icon: <CheckCircle className="h-3 w-3" /> },
    ISSUED:     { label: "Emitida",    cls: "bg-emerald-950 text-emerald-300 border-emerald-800", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED:  { label: "Cancelado",  cls: "bg-slate-800 text-slate-400 border-slate-700",    icon: <XCircle className="h-3 w-3" /> },
    EXPIRED:    { label: "Expirado",   cls: "bg-red-950 text-red-400 border-red-900",           icon: <AlertTriangle className="h-3 w-3" /> },
    ERROR:      { label: "Erro",       cls: "bg-red-950 text-red-400 border-red-900",           icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const { label, cls, icon } = map[status] ?? { label: status, cls: "bg-slate-800 text-slate-400 border-slate-700", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {icon}{label}
    </span>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function CobrancasPage() {
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"ALL" | CobrancaType>("ALL");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const p = reset ? 1 : page;
    const params = new URLSearchParams({ type: typeFilter, page: String(p) });
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/cobrancas/emissoes?${params}`);
      if (res.ok) {
        const json = await res.json();
        setEmissions(reset ? json.data : (prev) => [...prev, ...json.data]);
        setHasMore(json.data.length === json.limit);
        if (reset) setPage(1);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, page]);

  useEffect(() => { load(true); setPage(1); }, [typeFilter, statusFilter]);

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-white">Cobranças Emitidas</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Boletos, PIX e Notas Fiscais emitidos. Envie por e-mail diretamente para o cliente.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => load(true)}
          disabled={loading}
          className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Atualizar</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "BOLETO", "PIX", "NF"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              typeFilter === t
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {t === "ALL" ? "Todos" : t === "NF" ? "NF-e/NFSe" : t}
          </button>
        ))}
        <div className="h-6 w-px bg-slate-700 self-center mx-1" />
        {(["", "PENDING", "PAID", "ISSUED", "CANCELLED", "EXPIRED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s
                ? "bg-slate-600 border-slate-500 text-white"
                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {s === "" ? "Qualquer status" : s === "PAID" ? "Pago" : s === "ISSUED" ? "Emitida" : s === "PENDING" ? "Pendente" : s === "CANCELLED" ? "Cancelado" : "Expirado"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading && emissions.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-500 text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : emissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
            <Receipt className="h-6 w-6 opacity-40" />
            <span>Nenhuma cobrança emitida encontrada.</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Valor</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Vencimento</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">E-mail</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {emissions.map((e) => (
                <tr key={`${e.type}-${e.id}`} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <TypeBadge type={e.type} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium text-xs truncate max-w-[140px]">{e.customerName}</p>
                    {e.customerEmail && (
                      <p className="text-slate-500 text-xs truncate max-w-[140px]">{e.customerEmail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-300 text-xs">
                    {e.amount !== null ? BRL(e.amount) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs">
                    {fmtDate(e.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {e.emailSentAt ? (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Mail className="h-3 w-3" />
                        <span className="text-xs">{fmtDateTime(e.emailSentAt)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <EnviarCobrancaButton
                      type={e.type}
                      documentId={e.id}
                      defaultEmail={e.emailSentTo ?? e.customerEmail ?? ""}
                      customerName={e.customerName}
                      amount={e.amount ?? undefined}
                      variant="icon"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {hasMore && (
          <div className="px-4 py-3 border-t border-slate-800">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setPage((p) => p + 1); load(); }}
              disabled={loading}
              className="text-slate-400 hover:text-white text-xs"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Carregar mais
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
