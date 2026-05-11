"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  GraduationCap, Users, FileText, CreditCard, AlertTriangle,
  RefreshCw, CheckCircle, XCircle, Loader2, Clock, ArrowRight,
  Activity, BarChart3, Wifi, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SyncLogEntry {
  id: string;
  syncType: string;
  status: string;
  recordsTotal: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsError: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface StatusData {
  isConfigured: boolean;
  isActive: boolean;
  connectionOk: boolean | null;
  testedAt: string | null;
  settings: {
    idInstitution: string | null;
    username: string | null;
    cnpj: string | null;
    autoSyncEnabled: string;
    delinquencyDaysThreshold: string;
  };
  counts: { customers: number; classes: number; receivable: number };
  lastSyncByType: Record<string, { at: string; created: number; updated: number }>;
  recentLogs: SyncLogEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SYNC_TYPES: { key: string; label: string; icon: React.ElementType; endpoint: string; description: string }[] = [
  {
    key: "ALUNOS",
    label: "Alunos",
    icon: Users,
    endpoint: "/api/integracao/gennera/sync/alunos",
    description: "Importa pessoas do Gennera como Clientes/Alunos",
  },
  {
    key: "TURMAS",
    label: "Turmas / Cursos",
    icon: GraduationCap,
    endpoint: "/api/integracao/gennera/sync/turmas",
    description: "Importa ofertas curriculares como Turmas",
  },
  {
    key: "MATRICULAS",
    label: "Matrículas / Faturas",
    icon: FileText,
    endpoint: "/api/integracao/gennera/sync/matriculas",
    description: "Importa contratos e faturas como Títulos a Receber",
  },
  {
    key: "PAGAMENTOS",
    label: "Pagamentos",
    icon: CreditCard,
    endpoint: "/api/integracao/gennera/sync/pagamentos",
    description: "Marca títulos como recebidos conforme pagamentos no Gennera",
  },
  {
    key: "INADIMPLENCIA_NOTIFICAR",
    label: "Notificar Inadimplência",
    icon: AlertTriangle,
    endpoint: "/api/integracao/gennera/inadimplencia/notificar",
    description: "Atualiza flag de inadimplência nas matrículas do Gennera",
  },
];

function statusBadge(status: string) {
  switch (status) {
    case "DONE":    return <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
    case "RUNNING": return <Badge className="bg-blue-950 text-blue-400 border-blue-800 text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Executando</Badge>;
    case "ERROR":   return <Badge className="bg-red-950 text-red-400 border-red-800 text-xs"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
    default:        return <Badge className="bg-slate-800 text-slate-400 text-xs">{status}</Badge>;
  }
}

function fmtDatetime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
}

// ─── Sync Card ─────────────────────────────────────────────────────────────────

function SyncCard({
  syncType,
  lastSync,
  onSync,
  running,
}: {
  syncType: typeof SYNC_TYPES[number];
  lastSync?: StatusData["lastSyncByType"][string];
  onSync: (endpoint: string, key: string) => Promise<void>;
  running: boolean;
}) {
  const Icon = syncType.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-blue-400">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{syncType.label}</p>
        <p className="text-xs text-slate-500 truncate">{syncType.description}</p>
        {lastSync && (
          <p className="text-xs text-slate-500 mt-0.5">
            Última sincronização: {fmtRelative(lastSync.at)}
            <span className="ml-2 text-emerald-500">{lastSync.created} criados</span>
            <span className="ml-1 text-blue-400">{lastSync.updated} atualizados</span>
          </p>
        )}
        {!lastSync && (
          <p className="text-xs text-slate-600 mt-0.5">Nunca sincronizado</p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onSync(syncType.endpoint, syncType.key)}
        disabled={running}
        className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 shrink-0"
      >
        {running
          ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
        Sincronizar
      </Button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GenneraIntegracaoPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integracao/gennera/status");
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSync = async (endpoint: string, key: string) => {
    setRunning(key);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        const parts = [
          data.created !== undefined && `${data.created} criados`,
          data.updated !== undefined && `${data.updated} atualizados`,
          data.processed !== undefined && `${data.processed} processados`,
          data.flagged !== undefined && `${data.flagged} marcados inadimplentes`,
          data.cleared !== undefined && `${data.cleared} limpos`,
          data.errors > 0 && `${data.errors} erros`,
        ].filter(Boolean).join(", ");
        toast({ title: "Sincronização concluída", description: parts || "Nenhum registro processado" });
        await fetchStatus();
      } else {
        toast({ title: "Erro na sincronização", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao chamar a API", variant: "destructive" });
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-400" />
            Integração Gennera
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Admin › Integrações › Gennera — sistema acadêmico
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          className="border-slate-700 bg-slate-800/50 text-slate-300"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Atualizar
        </Button>
      </div>

      {/* Connection status */}
      {status && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          !status.isConfigured ? "bg-amber-950/20 border-amber-900/40" :
          !status.isActive ? "bg-slate-900 border-slate-800" :
          status.connectionOk === true ? "bg-emerald-950/20 border-emerald-900/40" :
          status.connectionOk === false ? "bg-red-950/20 border-red-900/40" :
          "bg-slate-900 border-slate-800"
        }`}>
          <div className="shrink-0 mt-0.5">
            {!status.isConfigured && <AlertTriangle className="h-4 w-4 text-amber-400" />}
            {status.isConfigured && !status.isActive && <WifiOff className="h-4 w-4 text-slate-500" />}
            {status.isConfigured && status.isActive && status.connectionOk === true && <Wifi className="h-4 w-4 text-emerald-400" />}
            {status.isConfigured && status.isActive && status.connectionOk === false && <WifiOff className="h-4 w-4 text-red-400" />}
            {status.isConfigured && status.isActive && status.connectionOk === null && <Wifi className="h-4 w-4 text-blue-400" />}
          </div>
          <div className="flex-1">
            {!status.isConfigured && (
              <p className="text-sm text-amber-300 font-medium">Não configurado</p>
            )}
            {status.isConfigured && !status.isActive && (
              <p className="text-sm text-slate-400 font-medium">Integração inativa</p>
            )}
            {status.isConfigured && status.isActive && status.connectionOk === true && (
              <p className="text-sm text-emerald-300 font-medium">Conectado ao Gennera</p>
            )}
            {status.isConfigured && status.isActive && status.connectionOk === false && (
              <p className="text-sm text-red-300 font-medium">Falha na conexão</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {status.settings.idInstitution
                ? `Instituição: ${status.settings.idInstitution} · Usuário: ${status.settings.username ?? "—"}`
                : "Configure em Admin → Integrações e ative o provedor Gennera"}
            </p>
            {status.testedAt && (
              <p className="text-xs text-slate-600 mt-1">
                Último teste: {fmtDatetime(status.testedAt)}
              </p>
            )}
          </div>
          {status.isConfigured && (
            <a
              href="/admin/integracoes"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
            >
              Configurar <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Counts */}
      {status && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Alunos sincronizados", value: status.counts.customers, icon: Users, color: "text-blue-400" },
            { label: "Turmas sincronizadas", value: status.counts.classes, icon: GraduationCap, color: "text-violet-400" },
            { label: "Títulos importados", value: status.counts.receivable, icon: FileText, color: "text-emerald-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <Icon className={`h-5 w-5 ${color} mx-auto mb-1.5`} />
              <p className="text-2xl font-bold text-white">{value.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sync actions */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Sincronizações Manuais
        </p>
        <div className="space-y-3">
          {SYNC_TYPES.map((st) => (
            <SyncCard
              key={st.key}
              syncType={st}
              lastSync={status?.lastSyncByType[st.key]}
              onSync={handleSync}
              running={running === st.key}
            />
          ))}
        </div>
      </div>

      {/* Sync order guide */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          Ordem recomendada de sincronização
        </p>
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
          {["Alunos", "Turmas", "Matrículas / Faturas", "Pagamentos", "Notificar Inadimplência"].map((s, i, arr) => (
            <React.Fragment key={s}>
              <span className="text-slate-300">{s}</span>
              {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-slate-600" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-2">
          Execute Alunos antes de Matrículas (as faturas precisam de clientes cadastrados).
          Configure o limiar de inadimplência em Admin → Integrações → Gennera → Configurar.
        </p>
      </div>

      {/* Recent sync logs */}
      {status && status.recentLogs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Histórico Recente
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-500 px-4 py-2 font-medium">Tipo</th>
                  <th className="text-left text-slate-500 px-4 py-2 font-medium">Status</th>
                  <th className="text-right text-slate-500 px-4 py-2 font-medium">Total</th>
                  <th className="text-right text-slate-500 px-4 py-2 font-medium">Criados</th>
                  <th className="text-right text-slate-500 px-4 py-2 font-medium">Atualizados</th>
                  <th className="text-right text-slate-500 px-4 py-2 font-medium">Erros</th>
                  <th className="text-left text-slate-500 px-4 py-2 font-medium">Iniciado</th>
                </tr>
              </thead>
              <tbody>
                {status.recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 text-slate-300 font-mono">{log.syncType}</td>
                    <td className="px-4 py-2.5">{statusBadge(log.status)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{log.recordsTotal}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-400">{log.recordsCreated}</td>
                    <td className="px-4 py-2.5 text-right text-blue-400">{log.recordsUpdated}</td>
                    <td className="px-4 py-2.5 text-right text-red-400">{log.recordsError || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-500">{fmtDatetime(log.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
