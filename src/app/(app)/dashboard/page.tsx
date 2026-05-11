"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TrendingDown, TrendingUp, DollarSign, AlertTriangle, Landmark, Loader2 } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTenantStore } from "@/store/tenant";

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  title, value, subtitle, icon: Icon, loading, color,
}: {
  title: string; value: number | null; subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  color: "blue" | "green" | "red" | "yellow";
}) {
  const colorMap = {
    blue:   "text-blue-600 bg-blue-50",
    green:  "text-green-600 bg-green-50",
    red:    "text-red-600 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
  };
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            {loading || value === null ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(value)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color ?? entry.fill }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────

interface DashboardSummary {
  currentBalance: number;
  monthReceivables: number;
  monthPayables: number;
  overdueReceivables: number;
  bankBalance: number | null;
  bankAccountCount: number;
  lastBankSync: string | null;
}

interface CashflowPoint {
  period: string;
  entradas: number;
  saidas: number;
  projecao: boolean;
}

interface TitleItem {
  id: string;
  dueDate: string;
  currentBalance: number;
  originalValue: number;
  situation: string;
  supplier?: { name: string };
  customer?: { name: string; enrollmentId: string | null };
}

export default function DashboardPage() {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;

  const [summary, setSummary]   = useState<DashboardSummary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [topPay, setTopPay]     = useState<TitleItem[]>([]);
  const [topRec, setTopRec]     = useState<TitleItem[]>([]);
  const [loadingKpi, setLoadingKpi]   = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!tenantId) return;

    // KPI cards + bank balance
    setLoadingKpi(true);
    fetch(`/api/dashboard?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then(({ data }) => { if (data) setSummary(data); })
      .catch(() => {})
      .finally(() => setLoadingKpi(false));

    // Cashflow chart
    setLoadingChart(true);
    fetch("/api/dashboard/cashflow")
      .then((r) => r.json())
      .then(({ data }) => { if (data) setCashflow(data); })
      .catch(() => {})
      .finally(() => setLoadingChart(false));

    // Top payables this month
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const endMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    fetch(`/api/titulos/pagar?tenantId=${tenantId}&limit=5`)
      .then((r) => r.json())
      .then(({ data }) => { if (data) setTopPay(data.slice(0, 5)); })
      .catch(() => {});

    fetch(`/api/titulos/receber?tenantId=${tenantId}&limit=5`)
      .then((r) => r.json())
      .then(({ data }) => { if (data) setTopRec(data.slice(0, 5)); })
      .catch(() => {});
  }, [tenantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmtSync = (iso: string | null) => {
    if (!iso) return null;
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  };

  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm capitalize">Visão geral financeira — {currentMonth}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Posição Líquida"
          value={summary?.currentBalance ?? null}
          subtitle="A receber menos a pagar"
          icon={DollarSign}
          loading={loadingKpi}
          color="blue"
        />
        <SummaryCard
          title="Recebimentos Previstos"
          value={summary?.monthReceivables ?? null}
          subtitle="Mês corrente"
          icon={TrendingUp}
          loading={loadingKpi}
          color="green"
        />
        <SummaryCard
          title="Pagamentos Previstos"
          value={summary?.monthPayables ?? null}
          subtitle="Mês corrente"
          icon={TrendingDown}
          loading={loadingKpi}
          color="red"
        />
        <SummaryCard
          title="Inadimplência"
          value={summary?.overdueReceivables ?? null}
          subtitle="Títulos vencidos a receber"
          icon={AlertTriangle}
          loading={loadingKpi}
          color="yellow"
        />
      </div>

      {/* Bank balance (Open Finance) */}
      {summary?.bankBalance !== null && summary?.bankBalance !== undefined && (
        <Card className="border-blue-900/40 bg-blue-950/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-900/40 shrink-0">
                  <Landmark className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posição Bancária Real</p>
                  <p className="text-2xl font-bold tabular-nums text-blue-400">{formatCurrency(summary.bankBalance)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>{summary.bankAccountCount} conta(s) via Open Finance</span>
                {summary.lastBankSync && <span>Sync: {fmtSync(summary.lastBankSync)}</span>}
                <Badge variant="outline" className="text-blue-400 border-blue-800 text-xs gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 inline-block" />
                  Open Finance
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cashflow chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Realizado e projetado — 12 meses</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Entradas</Badge>
              <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />Saídas</Badge>
              <Badge variant="outline" className="gap-1.5 text-blue-700 border-blue-200"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />Prev. Entradas</Badge>
              <Badge variant="outline" className="gap-1.5 text-orange-700 border-orange-200"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />Prev. Saídas</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingChart ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : cashflow.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              Sem dados de fluxo de caixa ainda.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cashflow} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="entradas" name="Entradas" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {cashflow.map((e, i) => <Cell key={i} fill={e.projecao ? "#3b82f6" : "#22c55e"} />)}
                </Bar>
                <Bar dataKey="saidas" name="Saídas" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {cashflow.map((e, i) => <Cell key={i} fill={e.projecao ? "#f97316" : "#ef4444"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maiores Pagamentos Previstos</CardTitle>
            <CardDescription>Próximos vencimentos — Contas a Pagar</CardDescription>
          </CardHeader>
          <CardContent>
            {topPay.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum título a pagar cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {topPay.map((item, i) => {
                  const isOvd = item.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10)
                    && !["PAID", "CANCELED"].includes(item.situation);
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.supplier?.name ?? "—"}</p>
                          <p className={`text-xs ${isOvd ? "text-red-500" : "text-muted-foreground"}`}>
                            Venc: {formatDate(item.dueDate)}{isOvd ? " · VENCIDO" : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums shrink-0 text-red-600">
                        {formatCurrency(Number(item.currentBalance))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maiores Recebimentos Previstos</CardTitle>
            <CardDescription>Próximos vencimentos — Contas a Receber</CardDescription>
          </CardHeader>
          <CardContent>
            {topRec.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum título a receber cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {topRec.map((item, i) => {
                  const isOvd = item.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10)
                    && !["RECEIVED", "CANCELED"].includes(item.situation);
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.customer?.name ?? "—"}</p>
                          <p className={`text-xs ${isOvd ? "text-red-500" : "text-muted-foreground"}`}>
                            Venc: {formatDate(item.dueDate)}{isOvd ? " · VENCIDO" : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums shrink-0 text-green-600">
                        {formatCurrency(Number(item.currentBalance))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
