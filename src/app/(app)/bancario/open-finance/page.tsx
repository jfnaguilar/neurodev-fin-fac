"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2, RefreshCw, Trash2, Plus, CheckCircle, AlertCircle,
  Clock, ArrowDownLeft, ArrowUpRight, Link2, Settings, Wifi, WifiOff,
  ArrowLeftRight, Search, ChevronLeft, ChevronRight, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PluggyAccount {
  id: string;
  pluggyId: string;
  name: string;
  number?: string;
  type: string;
  subtype?: string;
  balance: number;
  currencyCode: string;
  syncedAt?: string;
}

interface PluggyConnection {
  id: string;
  bankName: string;
  status: string;
  error?: string;
  lastSync?: string;
  accounts: PluggyAccount[];
}

interface PluggyTransaction {
  id: string;
  pluggyId: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  reconciled: boolean;
  titleId?: string;
  account: { id: string; name: string; connection: { bankName: string } };
}

interface SyncConfig {
  syncMode: "MANUAL" | "SCHEDULED";
  scheduledTime: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: string, error?: string) {
  if (error || status === "LOGIN_ERROR" || status === "INVALID_CREDENTIALS") {
    return <Badge className="bg-red-950 text-red-400 border-red-800 text-xs">Erro</Badge>;
  }
  if (status === "UPDATING") {
    return <Badge className="bg-yellow-950 text-yellow-400 border-yellow-800 text-xs">Atualizando…</Badge>;
  }
  if (status === "UPDATED") {
    return <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs">Conectado</Badge>;
  }
  return <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-xs">{status}</Badge>;
}

const fmtCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
};

const fmtDateShort = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

function accountTypeLabel(type: string, subtype?: string) {
  const s: Record<string, string> = {
    CHECKING_ACCOUNT: "Conta Corrente", SAVINGS_ACCOUNT: "Poupança", CREDIT_CARD: "Cartão de Crédito",
  };
  const t: Record<string, string> = { BANK: "Conta Bancária", CREDIT: "Crédito", INVESTMENT: "Investimento" };
  return s[subtype ?? ""] ?? t[type] ?? type;
}

// ─── Pluggy Connect Widget ────────────────────────────────────────────────────

declare global {
  interface Window {
    PluggyConnect?: new (config: {
      connectToken: string;
      includeSandbox?: boolean;
      onSuccess: (d: { item: { id: string } }) => void;
      onError: (e: unknown) => void;
      onClose: () => void;
    }) => { init: () => void };
  }
}

function usePluggyScript() {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || typeof window === "undefined") return;
    if (document.querySelector('script[src*="pluggy-connect"]')) { loaded.current = true; return; }
    const s = document.createElement("script");
    s.src = "https://cdn.pluggy.ai/pluggy-connect/v2.9.1/pluggy-connect.js";
    s.async = true;
    s.onload = () => { loaded.current = true; };
    document.head.appendChild(s);
  }, []);
}

// ─── Sync Settings Panel ──────────────────────────────────────────────────────

function SyncSettingsPanel({
  config,
  saving,
  onChange,
}: {
  config: SyncConfig;
  saving: boolean;
  onChange: (c: SyncConfig) => void;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Settings className="h-4 w-4 text-slate-400" />
        Configuração de Sincronização
        {saving && <span className="text-xs text-slate-500 ml-1">Salvando…</span>}
      </div>
      <div className="flex gap-3">
        {(["MANUAL", "SCHEDULED"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChange({ ...config, syncMode: mode })}
            className={`flex-1 rounded-lg border p-3 text-left text-sm transition-colors ${
              config.syncMode === mode
                ? "border-blue-500 bg-blue-950/40 text-blue-300"
                : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
            }`}
          >
            <div className="font-medium mb-0.5">{mode === "MANUAL" ? "Manual" : "Agendado"}</div>
            <div className="text-xs opacity-70">
              {mode === "MANUAL" ? "Sincroniza apenas quando solicitado" : "Sync automático toda madrugada (D-1)"}
            </div>
          </button>
        ))}
      </div>
      {config.syncMode === "SCHEDULED" && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 whitespace-nowrap">Horário:</label>
          <input
            type="time"
            value={config.scheduledTime}
            onChange={(e) => onChange({ ...config, scheduledTime: e.target.value })}
            className="h-8 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-500">Dados de D-1 disponíveis no expediente</span>
        </div>
      )}
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

function TransactionsTab({ connections }: { connections: PluggyConnection[] }) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PluggyTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filterAccount, setFilterAccount] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterReconciled, setFilterReconciled] = useState("");
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const allAccounts = connections.flatMap((c) =>
    c.accounts.map((a) => ({ ...a, bankName: c.bankName }))
  );

  const fetchTransactions = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: "50" });
    if (filterAccount) params.set("accountId", filterAccount);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    if (filterType) params.set("type", filterType);
    if (filterReconciled !== "") params.set("reconciled", filterReconciled);

    try {
      const res = await fetch(`/api/pluggy/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [filterAccount, filterFrom, filterTo, filterType, filterReconciled]);

  useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);

  const handleReconcile = async (txId?: string) => {
    setReconcilingId(txId ?? "all");
    try {
      const res = await fetch("/api/pluggy/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txId ? { transactionId: txId } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Conciliação concluída", description: `${data.reconciled} de ${data.total} transações conciliadas.` });
        fetchTransactions(page);
      } else {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      }
    } finally {
      setReconcilingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Filter className="h-4 w-4 text-slate-400" /> Filtros
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as contas</option>
            {allAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.bankName} — {a.name}</option>
            ))}
          </select>
          <input
            type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
            placeholder="De"
            className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
            placeholder="Até"
            className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Débito e Crédito</option>
            <option value="DEBIT">Débito</option>
            <option value="CREDIT">Crédito</option>
          </select>
          <select
            value={filterReconciled} onChange={(e) => setFilterReconciled(e.target.value)}
            className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="false">Não conciliados</option>
            <option value="true">Conciliados</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{total} transação(ões) encontrada(s)</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReconcile()}
            disabled={reconcilingId !== null}
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 text-xs h-8"
          >
            <ArrowLeftRight className="h-3 w-3 mr-1.5" />
            {reconcilingId === "all" ? "Conciliando…" : "Conciliar Tudo"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando…</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Nenhuma transação encontrada</p>
            <p className="text-slate-500 text-xs mt-1">Ajuste os filtros ou sincronize as contas</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Data</th>
                    <th className="text-left px-4 py-3 font-medium">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium">Conta</th>
                    <th className="text-left px-4 py-3 font-medium">Categoria</th>
                    <th className="text-right px-4 py-3 font-medium">Valor</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDateShort(tx.date)}</td>
                      <td className="px-4 py-3 text-white max-w-[220px] truncate">{tx.description}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {tx.account.connection.bankName}<br />
                        <span className="text-slate-500">{tx.account.name}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{tx.category ?? "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-semibold tabular-nums">
                        <span className={tx.type === "CREDIT" ? "text-emerald-400" : "text-red-400"}>
                          {tx.type === "CREDIT" ? "+" : "-"}{fmtCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tx.reconciled ? (
                          <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />Conciliado
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-800 text-slate-500 border-slate-700 text-xs">Pendente</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!tx.reconciled && (
                          <button
                            onClick={() => handleReconcile(tx.id)}
                            disabled={reconcilingId !== null}
                            className="text-xs text-slate-500 hover:text-blue-400 transition-colors disabled:opacity-50 whitespace-nowrap"
                            title="Conciliar esta transação"
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                <span className="text-xs text-slate-500">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => fetchTransactions(page - 1)}
                    disabled={page <= 1}
                    className="h-7 w-7 rounded border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => fetchTransactions(page + 1)}
                    disabled={page >= totalPages}
                    className="h-7 w-7 rounded border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OpenFinancePage() {
  const { toast } = useToast();
  usePluggyScript();

  const [connections, setConnections] = useState<PluggyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({ syncMode: "MANUAL", scheduledTime: "05:00" });
  const [savingConfig, setSavingConfig] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pluggy/items");
      if (res.ok) setConnections(await res.json().then((d) => (Array.isArray(d) ? d : [])));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load config on mount
  useEffect(() => {
    fetchConnections();
    fetch("/api/pluggy/config")
      .then((r) => r.json())
      .then((c) => setSyncConfig({ syncMode: c.syncMode ?? "MANUAL", scheduledTime: c.scheduledTime ?? "05:00" }))
      .catch(() => {});
  }, [fetchConnections]);

  // Debounced save when config changes
  const handleConfigChange = useCallback((cfg: SyncConfig) => {
    setSyncConfig(cfg);
    clearTimeout(saveTimer.current);
    setSavingConfig(true);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/pluggy/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cfg),
        });
      } finally {
        setSavingConfig(false);
      }
    }, 800);
  }, []);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/pluggy/connect-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        setConnecting(false);
        return;
      }

      if (!window.PluggyConnect) {
        toast({ title: "Widget não carregado", description: "Aguarde e tente novamente.", variant: "destructive" });
        setConnecting(false);
        return;
      }

      const pluggy = new window.PluggyConnect({
        connectToken: data.connectToken,
        includeSandbox: process.env.NODE_ENV !== "production",
        onSuccess: async ({ item }) => {
          const saveRes = await fetch("/api/pluggy/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId: item.id }),
          });
          if (saveRes.ok) {
            toast({ title: "Conta conectada!", description: "Dados bancários importados com sucesso." });
            fetchConnections();
          } else {
            const err = await saveRes.json();
            toast({ title: "Erro ao salvar conexão", description: err.error, variant: "destructive" });
          }
          setConnecting(false);
        },
        onError: () => {
          toast({ title: "Erro na conexão", description: "Não foi possível conectar a conta.", variant: "destructive" });
          setConnecting(false);
        },
        onClose: () => setConnecting(false),
      });
      pluggy.init();
    } catch {
      toast({ title: "Erro", description: "Falha ao iniciar conexão bancária.", variant: "destructive" });
      setConnecting(false);
    }
  }, [fetchConnections, toast]);

  const handleSync = useCallback(async (connectionId?: string) => {
    setSyncing(connectionId ?? "all");
    try {
      const res = await fetch("/api/pluggy/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionId ? { connectionId } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        const tx = (data.results as { transactions: number }[]).reduce((s, r) => s + r.transactions, 0);
        toast({ title: "Sincronização concluída", description: `${tx} transação(ões) importada(s).` });
        fetchConnections();
      } else {
        toast({ title: "Erro na sincronização", description: data.error, variant: "destructive" });
      }
    } finally {
      setSyncing(null);
    }
  }, [fetchConnections, toast]);

  const handleDisconnect = useCallback(async (id: string, bankName: string) => {
    if (!confirm(`Desconectar ${bankName}? Todos os dados deste vínculo serão removidos.`)) return;
    const res = await fetch(`/api/pluggy/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Conta desconectada", description: `${bankName} removido.` });
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } else {
      toast({ title: "Erro", description: "Não foi possível remover.", variant: "destructive" });
    }
  }, [toast]);

  const totalBankBalance = connections
    .flatMap((c) => c.accounts)
    .filter((a) => a.type === "BANK")
    .reduce((s, a) => s + a.balance, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-400" /> Open Finance
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Contas bancárias via Open Finance (Pluggy) — leitura, sync e conciliação automática.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {connections.length > 0 && (
            <Button
              variant="outline" size="sm"
              onClick={() => handleSync()}
              disabled={syncing !== null}
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing === "all" ? "animate-spin" : ""}`} />
              Sincronizar Tudo
            </Button>
          )}
          <Button
            size="sm" onClick={handleConnect} disabled={connecting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {connecting ? "Aguardando…" : "Conectar Conta"}
          </Button>
        </div>
      </div>

      {/* Sync settings (always visible) */}
      <SyncSettingsPanel config={syncConfig} saving={savingConfig} onChange={handleConfigChange} />

      {/* Tabs */}
      <Tabs defaultValue="contas">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="contas" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
            Contas Conectadas
          </TabsTrigger>
          <TabsTrigger value="transacoes" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
            Transações
          </TabsTrigger>
        </TabsList>

        {/* ── Aba: Contas ─────────────────────────────────────────── */}
        <TabsContent value="contas" className="mt-4 space-y-4">
          {/* Summary */}
          {connections.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Saldo Total (Contas)</p>
                <p className={`text-xl font-semibold ${totalBankBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmtCurrency(totalBankBalance)}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Bancos Conectados</p>
                <p className="text-xl font-semibold text-white">{connections.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Contas Vinculadas</p>
                <p className="text-xl font-semibold text-white">
                  {connections.flatMap((c) => c.accounts).length}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse h-28" />
              ))}
            </div>
          ) : connections.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-12 text-center">
              <WifiOff className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Nenhuma conta conectada</p>
              <p className="text-slate-500 text-sm mt-1 mb-4">
                Conecte uma conta bancária via Open Finance para visualizar saldos e transações.
              </p>
              <Button
                size="sm" onClick={handleConnect} disabled={connecting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />Conectar Primeira Conta
              </Button>
            </div>
          ) : (
            connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                syncing={syncing === conn.id}
                onSync={() => handleSync(conn.id)}
                onDisconnect={() => handleDisconnect(conn.id, conn.bankName)}
              />
            ))
          )}

          {/* LGPD Notice */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex gap-3">
            <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Dados capturados em <strong className="text-slate-400">modo leitura</strong> via Pluggy (Open Finance Brasil / BACEN).
              Nenhuma transação é executada. Tokens armazenados com segurança e revogáveis a qualquer momento. Em conformidade com a <strong className="text-slate-400">LGPD</strong>.
            </p>
          </div>
        </TabsContent>

        {/* ── Aba: Transações ──────────────────────────────────────── */}
        <TabsContent value="transacoes" className="mt-4">
          {connections.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-10 text-center">
              <p className="text-slate-400 text-sm">Conecte ao menos uma conta para ver transações.</p>
            </div>
          ) : (
            <TransactionsTab connections={connections} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Connection Card ──────────────────────────────────────────────────────────

function ConnectionCard({
  connection, syncing, onSync, onDisconnect,
}: {
  connection: PluggyConnection;
  syncing: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{connection.bankName}</span>
            {statusBadge(connection.status, connection.error)}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
            <Clock className="h-3 w-3" /> Última sync: {fmtDate(connection.lastSync)}
          </div>
          {connection.error && <p className="text-xs text-red-400 mt-0.5">{connection.error}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSync} disabled={syncing}
            className="h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title="Sincronizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onDisconnect}
            className="h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-red-950 hover:border-red-800 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
            title="Desconectar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Link2 className="h-3 w-3" />
            {connection.accounts.length} conta(s)
          </button>
        </div>
      </div>

      {expanded && connection.accounts.length > 0 && (
        <>
          <Separator className="bg-slate-800" />
          <div className="divide-y divide-slate-800/60">
            {connection.accounts.map((acc) => (
              <AccountRow key={acc.id} account={acc} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AccountRow({ account }: { account: PluggyAccount }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {account.balance >= 0
            ? <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            : <ArrowUpRight className="h-3.5 w-3.5 text-red-400 shrink-0" />
          }
          <span className="text-sm text-white truncate">{account.name}</span>
          {account.number && <span className="text-xs text-slate-500">· {account.number}</span>}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 pl-5">{accountTypeLabel(account.type, account.subtype)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${account.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {fmtCurrency(account.balance)}
        </p>
        {account.syncedAt && (
          <p className="text-xs text-slate-600 mt-0.5">
            <CheckCircle className="h-2.5 w-2.5 inline mr-0.5" />{fmtDate(account.syncedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
