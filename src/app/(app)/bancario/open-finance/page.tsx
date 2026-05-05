"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2,
  RefreshCw,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Link2,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: string, error?: string) {
  if (error || status === "LOGIN_ERROR" || status === "INVALID_CREDENTIALS") {
    return <Badge className="bg-red-950 text-red-400 border-red-800 text-xs">{error ? "Erro" : "Credencial inválida"}</Badge>;
  }
  if (status === "UPDATING") {
    return <Badge className="bg-yellow-950 text-yellow-400 border-yellow-800 text-xs">Atualizando…</Badge>;
  }
  if (status === "UPDATED") {
    return <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs">Conectado</Badge>;
  }
  return <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-xs">{status}</Badge>;
}

function fmtCurrency(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function accountTypeLabel(type: string, subtype?: string) {
  const labels: Record<string, string> = {
    BANK: "Conta Bancária",
    CREDIT: "Cartão de Crédito",
    INVESTMENT: "Investimento",
  };
  const subtypeLabels: Record<string, string> = {
    CHECKING_ACCOUNT: "Conta Corrente",
    SAVINGS_ACCOUNT: "Poupança",
    CREDIT_CARD: "Cartão de Crédito",
  };
  return subtypeLabels[subtype ?? ""] ?? labels[type] ?? type;
}

// ─── Sync Settings Modal ──────────────────────────────────────────────────────

interface SyncSettings {
  mode: "MANUAL" | "SCHEDULED";
  scheduledTime: string;
}

function SyncSettingsPanel({
  settings,
  onChange,
}: {
  settings: SyncSettings;
  onChange: (s: SyncSettings) => void;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Settings className="h-4 w-4 text-slate-400" />
        Configuração de Sincronização
      </div>
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            onClick={() => onChange({ ...settings, mode: "MANUAL" })}
            className={`flex-1 rounded-lg border p-3 text-left text-sm transition-colors ${
              settings.mode === "MANUAL"
                ? "border-blue-500 bg-blue-950/40 text-blue-300"
                : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
            }`}
          >
            <div className="font-medium mb-0.5">Manual</div>
            <div className="text-xs opacity-70">Sincroniza apenas quando solicitado</div>
          </button>
          <button
            onClick={() => onChange({ ...settings, mode: "SCHEDULED" })}
            className={`flex-1 rounded-lg border p-3 text-left text-sm transition-colors ${
              settings.mode === "SCHEDULED"
                ? "border-blue-500 bg-blue-950/40 text-blue-300"
                : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
            }`}
          >
            <div className="font-medium mb-0.5">Agendado</div>
            <div className="text-xs opacity-70">Sincroniza automaticamente toda madrugada (D-1)</div>
          </button>
        </div>
        {settings.mode === "SCHEDULED" && (
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 whitespace-nowrap">Horário de sync:</label>
            <input
              type="time"
              value={settings.scheduledTime}
              onChange={(e) => onChange({ ...settings, scheduledTime: e.target.value })}
              className="h-8 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-500">Dados de D-1 disponíveis no expediente</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pluggy Connect Widget loader ─────────────────────────────────────────────

declare global {
  interface Window {
    PluggyConnect?: new (config: {
      connectToken: string;
      includeSandbox?: boolean;
      onSuccess: (itemData: { item: { id: string } }) => void;
      onError: (error: unknown) => void;
      onClose: () => void;
    }) => { init: () => void };
  }
}

function usePluggyScript() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || typeof window === "undefined") return;
    const existing = document.querySelector('script[src*="pluggy-connect"]');
    if (existing) { loaded.current = true; return; }

    const script = document.createElement("script");
    script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.9.1/pluggy-connect.js";
    script.async = true;
    script.onload = () => { loaded.current = true; };
    document.head.appendChild(script);
  }, []);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OpenFinancePage() {
  const { toast } = useToast();
  usePluggyScript();

  const [connections, setConnections] = useState<PluggyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    mode: "MANUAL",
    scheduledTime: "05:00",
  });

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pluggy/items");
      if (res.ok) {
        const data = await res.json();
        setConnections(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/pluggy/connect-token", { method: "POST", body: JSON.stringify({}) });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }

      if (!window.PluggyConnect) {
        toast({
          title: "Widget não carregado",
          description: "Aguarde o carregamento do Pluggy Connect e tente novamente.",
          variant: "destructive",
        });
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
        },
        onError: (err) => {
          console.error("Pluggy error:", err);
          toast({ title: "Erro na conexão", description: "Não foi possível conectar a conta.", variant: "destructive" });
        },
        onClose: () => setConnecting(false),
      });

      pluggy.init();
    } catch (err) {
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
        const totalTx = (data.results as { transactions: number }[]).reduce((s, r) => s + r.transactions, 0);
        toast({ title: "Sincronização concluída", description: `${totalTx} transação(ões) importada(s).` });
        fetchConnections();
      } else {
        toast({ title: "Erro na sincronização", description: data.error, variant: "destructive" });
      }
    } finally {
      setSyncing(null);
    }
  }, [fetchConnections, toast]);

  const handleDisconnect = useCallback(async (connectionId: string, bankName: string) => {
    if (!confirm(`Desconectar ${bankName}? Todos os dados bancários deste vínculo serão removidos.`)) return;

    const res = await fetch(`/api/pluggy/items/${connectionId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Conta desconectada", description: `${bankName} foi removido.` });
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } else {
      toast({ title: "Erro", description: "Não foi possível remover a conexão.", variant: "destructive" });
    }
  }, [toast]);

  const totalBalance = connections
    .flatMap((c) => c.accounts)
    .filter((a) => a.type === "BANK")
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-400" />
            Open Finance
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Conecte suas contas bancárias via Open Finance (Pluggy) para visualização de saldos e conciliação automática.
          </p>
        </div>
        <div className="flex gap-2">
          {connections.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync()}
              disabled={syncing !== null}
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing === "all" ? "animate-spin" : ""}`} />
              Sincronizar Tudo
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {connecting ? "Aguardando…" : "Conectar Conta"}
          </Button>
        </div>
      </div>

      {/* Sync Settings */}
      <SyncSettingsPanel settings={syncSettings} onChange={setSyncSettings} />

      {/* Summary */}
      {connections.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Saldo Total (Contas)</p>
            <p className={`text-xl font-semibold ${totalBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmtCurrency(totalBalance)}
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

      {/* Connections */}
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
            Conecte uma conta bancária via Open Finance para visualizar saldos e transações em tempo real.
          </p>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Conectar Primeira Conta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              syncing={syncing === conn.id}
              onSync={() => handleSync(conn.id)}
              onDisconnect={() => handleDisconnect(conn.id, conn.bankName)}
            />
          ))}
        </div>
      )}

      {/* LGPD Notice */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex gap-3">
        <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Os dados bancários são capturados em <strong className="text-slate-400">modo leitura</strong> via Pluggy (Open Finance Brasil regulado pelo BACEN).
          Nenhuma transação é executada por este sistema. Os tokens de acesso são armazenados com segurança e podem ser revogados a qualquer momento.
          O tratamento de dados está em conformidade com a <strong className="text-slate-400">LGPD</strong>.
        </p>
      </div>
    </div>
  );
}

// ─── Connection Card ──────────────────────────────────────────────────────────

function ConnectionCard({
  connection,
  syncing,
  onSync,
  onDisconnect,
}: {
  connection: PluggyConnection;
  syncing: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Bank Header */}
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
            <Clock className="h-3 w-3" />
            Última sync: {fmtDate(connection.lastSync)}
          </div>
          {connection.error && (
            <p className="text-xs text-red-400 mt-0.5">{connection.error}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSync}
            disabled={syncing}
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

      {/* Accounts */}
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
          {account.number && (
            <span className="text-xs text-slate-500">· Ag/Cc: {account.number}</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 pl-5">{accountTypeLabel(account.type, account.subtype)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${account.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {fmtCurrency(account.balance)}
        </p>
        {account.syncedAt && (
          <p className="text-xs text-slate-600 mt-0.5">
            <CheckCircle className="h-2.5 w-2.5 inline mr-0.5" />
            {fmtDate(account.syncedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
