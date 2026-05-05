"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingDown, TrendingUp, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, Landmark,
} from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useTenantStore } from "@/store/tenant";

// Mai/26 é mês corrente — projeção começa em Jun/26
const cashFlowData = [
  { period: "Nov/25", entradas: 185000, saidas: 142000, projecao: false },
  { period: "Dez/25", entradas: 220000, saidas: 178000, projecao: false },
  { period: "Jan/26", entradas: 195000, saidas: 160000, projecao: false },
  { period: "Fev/26", entradas: 210000, saidas: 155000, projecao: false },
  { period: "Mar/26", entradas: 230000, saidas: 170000, projecao: false },
  { period: "Abr/26", entradas: 198000, saidas: 165000, projecao: false },
  { period: "Mai/26", entradas: 215000, saidas: 168000, projecao: false },
  { period: "Jun/26", entradas: 225000, saidas: 172000, projecao: true },
  { period: "Jul/26", entradas: 240000, saidas: 185000, projecao: true },
  { period: "Ago/26", entradas: 235000, saidas: 180000, projecao: true },
  { period: "Set/26", entradas: 228000, saidas: 175000, projecao: true },
  { period: "Out/26", entradas: 250000, saidas: 190000, projecao: true },
];

const topPayables = [
  { name: "Fornecedor ABC Ltda", value: 45000, dueDate: "05/05/2026", overdue: false },
  { name: "Editora Saraiva S.A.", value: 28500, dueDate: "01/05/2026", overdue: true },
  { name: "Manutenção Predial", value: 18000, dueDate: "10/05/2026", overdue: false },
  { name: "Software TI Sistemas", value: 12000, dueDate: "15/05/2026", overdue: false },
  { name: "Gráfica Impressos", value: 8500, dueDate: "28/04/2026", overdue: true },
];

const topReceivables = [
  { name: "Turma Engenharia 2025", value: 125000, dueDate: "05/05/2026", overdue: false },
  { name: "Turma Medicina 2024", value: 98000, dueDate: "05/05/2026", overdue: false },
  { name: "Turma Direito 2025", value: 76000, dueDate: "05/05/2026", overdue: false },
  { name: "Matrículas Avulsas", value: 42000, dueDate: "10/05/2026", overdue: false },
  { name: "Cursos Extensão", value: 15000, dueDate: "30/04/2026", overdue: true },
];

function SummaryCard({
  title, value, subtitle, icon: Icon, trend, trendValue, color,
}: {
  title: string; value: number; subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down"; trendValue?: string;
  color: "blue" | "green" | "red" | "yellow";
}) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
  };

  return (
    <Card>
      <CardContent className="pt-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(value)}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-3">
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
            )}
            <span className={`text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
              {trendValue}
            </span>
            <span className="text-xs text-muted-foreground">vs. mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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
  }
  return null;
};

export default function DashboardPage() {
  const { currentTenant } = useTenantStore();
  const [bankBalance, setBankBalance] = useState<number | null>(null);
  const [bankAccountCount, setBankAccountCount] = useState(0);
  const [lastBankSync, setLastBankSync] = useState<string | null>(null);

  useEffect(() => {
    const tenantId = currentTenant?.id ?? "dev-tenant";
    fetch(`/api/dashboard?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.bankBalance !== undefined && data.data.bankBalance !== null) {
          setBankBalance(data.data.bankBalance);
          setBankAccountCount(data.data.bankAccountCount ?? 0);
          setLastBankSync(data.data.lastBankSync ?? null);
        }
      })
      .catch(() => {});
  }, [currentTenant?.id]);

  const fmtSync = (iso: string | null) => {
    if (!iso) return null;
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral financeira — Maio 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Posição Líquida" value={47000} subtitle="Saldo atual do período" icon={DollarSign} trend="up" trendValue="+12,5%" color="blue" />
        <SummaryCard title="Recebimentos Previstos" value={215000} subtitle="Próximos 30 dias" icon={TrendingUp} trend="up" trendValue="+8,3%" color="green" />
        <SummaryCard title="Pagamentos Previstos" value={168000} subtitle="Próximos 30 dias" icon={TrendingDown} trend="down" trendValue="+3,1%" color="red" />
        <SummaryCard title="Inadimplência" value={23500} subtitle="Títulos vencidos há +30 dias" icon={AlertTriangle} trend="down" trendValue="-2,8%" color="yellow" />
      </div>

      {bankBalance !== null && (
        <Card className="border-blue-900/40 bg-blue-950/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-900/40 shrink-0">
                  <Landmark className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posição Bancária Real</p>
                  <p className="text-2xl font-bold tabular-nums text-blue-400">{formatCurrency(bankBalance)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>{bankAccountCount} conta(s) via Open Finance</span>
                {lastBankSync && <span>Sync: {fmtSync(lastBankSync)}</span>}
                <Badge variant="outline" className="text-blue-400 border-blue-800 text-xs gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 inline-block" />
                  Open Finance
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Realizado e projetado — 12 meses</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Entradas
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />Saídas
              </Badge>
              <Badge variant="outline" className="gap-1.5 text-blue-700 border-blue-200">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />Recebimentos Projetados
              </Badge>
              <Badge variant="outline" className="gap-1.5 text-orange-700 border-orange-200">
                <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />Pagamentos Projetados
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashFlowData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="entradas" name="Entradas" radius={[3, 3, 0, 0]} maxBarSize={32}>
                {cashFlowData.map((entry, index) => (
                  <Cell key={index} fill={entry.projecao ? "#3b82f6" : "#22c55e"} />
                ))}
              </Bar>
              <Bar dataKey="saidas" name="Saídas" radius={[3, 3, 0, 0]} maxBarSize={32}>
                {cashFlowData.map((entry, index) => (
                  <Cell key={index} fill={entry.projecao ? "#f97316" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maiores Pagamentos Previstos</CardTitle>
            <CardDescription>Top 5 do mês corrente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPayables.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className={`text-xs ${item.overdue ? "text-red-500" : "text-muted-foreground"}`}>
                        Venc: {item.dueDate} {item.overdue && "· VENCIDO"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0 text-red-600">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maiores Recebimentos Previstos</CardTitle>
            <CardDescription>Top 5 do mês corrente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topReceivables.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className={`text-xs ${item.overdue ? "text-red-500" : "text-muted-foreground"}`}>
                        Venc: {item.dueDate} {item.overdue && "· VENCIDO"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0 text-green-600">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
