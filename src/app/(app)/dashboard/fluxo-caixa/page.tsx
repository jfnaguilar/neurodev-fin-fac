"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CashflowPoint {
  period: string;
  entradas: number;
  saidas: number;
  projecao: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color ?? entry.fill }}>{entry.name}</span>
          <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

const LegendaBadges = () => (
  <div className="flex gap-2 flex-wrap">
    <Badge variant="outline" className="gap-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Entradas</Badge>
    <Badge variant="outline" className="gap-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />Saídas</Badge>
    <Badge variant="outline" className="gap-1.5 text-xs text-blue-700 border-blue-200"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />Rec. Projetado</Badge>
    <Badge variant="outline" className="gap-1.5 text-xs text-orange-700 border-orange-200"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />Pag. Projetado</Badge>
  </div>
);

export default function FluxoCaixaPage() {
  const [monthlyData, setMonthlyData] = useState<CashflowPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCashflow = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/cashflow");
      if (res.ok) {
        const { data } = await res.json();
        setMonthlyData(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCashflow(); }, [fetchCashflow]);

  const totalEntradas = monthlyData.filter((d) => !d.projecao).reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = monthlyData.filter((d) => !d.projecao).reduce((s, d) => s + d.saidas, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h1>
        <p className="text-muted-foreground text-sm">Análise por período com projeções — baseado em títulos cadastrados</p>
      </div>

      <Tabs defaultValue="mensal">
        <TabsList>
          <TabsTrigger value="mensal">Por Mês</TabsTrigger>
          <TabsTrigger value="semanal">Por Semana</TabsTrigger>
          <TabsTrigger value="semestral">Por Semestre</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Fluxo Mensal</CardTitle>
                  <CardDescription>6 meses passados + mês atual + 5 meses futuros</CardDescription>
                </div>
                <LegendaBadges />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                  Sem dados de fluxo de caixa. Cadastre títulos a receber e a pagar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="entradas" name="Entradas" radius={[3, 3, 0, 0]} maxBarSize={28}>
                      {monthlyData.map((e, i) => <Cell key={i} fill={e.projecao ? "#3b82f6" : "#22c55e"} />)}
                    </Bar>
                    <Bar dataKey="saidas" name="Saídas" radius={[3, 3, 0, 0]} maxBarSize={28}>
                      {monthlyData.map((e, i) => <Cell key={i} fill={e.projecao ? "#f97316" : "#ef4444"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {monthlyData.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Entradas (realizado)</p>
                    <p className="text-2xl font-bold text-green-600 tabular-nums mt-1">{formatCurrency(totalEntradas)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Saídas (realizado)</p>
                    <p className="text-2xl font-bold text-red-600 tabular-nums mt-1">{formatCurrency(totalSaidas)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                    <p className={`text-2xl font-bold tabular-nums mt-1 ${totalEntradas - totalSaidas >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(totalEntradas - totalSaidas)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">Detalhamento Mensal</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Mês</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Entradas</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Saídas</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Saldo</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((row, i) => {
                          const saldo = row.entradas - row.saidas;
                          return (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-2 px-3 font-medium">{row.period}</td>
                              <td className="py-2 px-3 text-right tabular-nums text-green-600">{formatCurrency(row.entradas)}</td>
                              <td className="py-2 px-3 text-right tabular-nums text-red-600">{formatCurrency(row.saidas)}</td>
                              <td className={`py-2 px-3 text-right tabular-nums font-semibold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(saldo)}</td>
                              <td className="py-2 px-3 text-center">
                                {row.projecao
                                  ? <Badge variant="secondary" className="text-xs">Projeção</Badge>
                                  : <Badge variant="outline" className="text-xs text-green-600 border-green-600">Realizado</Badge>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="semanal" className="pt-4">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Fluxo semanal disponível após integração bancária (Open Finance ou CNAB retorno).
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semestral" className="pt-4">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Agrupamento semestral disponível após acumulação de pelo menos 6 meses de dados.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
