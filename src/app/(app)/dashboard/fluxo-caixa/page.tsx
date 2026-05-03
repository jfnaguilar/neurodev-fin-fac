"use client";

import React, { useState } from "react";
import { BarChart, Bar, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const weeklyData = [
  { period: "S18/Abr", entradas: 42000, saidas: 38000, saldo: 4000, projecao: false },
  { period: "S19/Abr", entradas: 35000, saidas: 41000, saldo: -6000, projecao: false },
  { period: "S20/Abr", entradas: 48000, saidas: 32000, saldo: 16000, projecao: false },
  { period: "S21/Abr", entradas: 55000, saidas: 44000, saldo: 11000, projecao: false },
  { period: "S22/Abr", entradas: 61000, saidas: 39000, saldo: 22000, projecao: false },
  { period: "S23/Abr", entradas: 38000, saidas: 45000, saldo: -7000, projecao: false },
  { period: "S24/Abr", entradas: 52000, saidas: 36000, saldo: 16000, projecao: false },
  { period: "S25/Abr", entradas: 44000, saidas: 38000, saldo: 6000, projecao: false },
  { period: "S01/Mai", entradas: 58000, saidas: 42000, saldo: 16000, projecao: false },
  { period: "S02/Mai", entradas: 46000, saidas: 40000, saldo: 6000, projecao: true },
  { period: "S03/Mai", entradas: 51000, saidas: 43000, saldo: 8000, projecao: true },
  { period: "S04/Mai", entradas: 62000, saidas: 45000, saldo: 17000, projecao: true },
];

const monthlyData = [
  { period: "Nov/25", entradas: 185000, saidas: 142000, saldo: 43000, projecao: false },
  { period: "Dez/25", entradas: 220000, saidas: 178000, saldo: 42000, projecao: false },
  { period: "Jan/26", entradas: 195000, saidas: 160000, saldo: 35000, projecao: false },
  { period: "Fev/26", entradas: 210000, saidas: 155000, saldo: 55000, projecao: false },
  { period: "Mar/26", entradas: 230000, saidas: 170000, saldo: 60000, projecao: false },
  { period: "Abr/26", entradas: 198000, saidas: 165000, saldo: 33000, projecao: false },
  { period: "Mai/26", entradas: 215000, saidas: 168000, saldo: 47000, projecao: false },
  { period: "Jun/26", entradas: 225000, saidas: 172000, saldo: 53000, projecao: true },
  { period: "Jul/26", entradas: 240000, saidas: 185000, saldo: 55000, projecao: true },
  { period: "Ago/26", entradas: 235000, saidas: 180000, saldo: 55000, projecao: true },
  { period: "Set/26", entradas: 228000, saidas: 175000, saldo: 53000, projecao: true },
  { period: "Out/26", entradas: 250000, saidas: 190000, saldo: 60000, projecao: true },
];

const semesterData = [
  { period: "2S/2025", entradas: 1200000, saidas: 980000, saldo: 220000, projecao: false },
  { period: "1S/2026", entradas: 1350000, saidas: 1050000, saldo: 300000, projecao: false },
  { period: "2S/2026", entradas: 1450000, saidas: 1120000, saldo: 330000, projecao: true },
  { period: "1S/2027", entradas: 1520000, saidas: 1180000, saldo: 340000, projecao: true },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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
  }
  return null;
};

function exportarPDF(titulo: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { window.print(); return; }
  printWindow.document.write(`<html><head><title>${titulo}</title><style>body{font-family:sans-serif;padding:20px}h2{margin-bottom:10px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f5f5}@media print{button{display:none}}</style></head><body>`);
  printWindow.document.write(`<h2>${titulo} — NeuroDev FIN</h2>`);
  printWindow.document.write(`<p>Gerado em: ${new Date().toLocaleString("pt-BR")}</p>`);
  printWindow.document.write(`<table><tr><th>Período</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Tipo</th></tr>`);
  const data = titulo.includes("Semanal") ? weeklyData : titulo.includes("Semestral") ? semesterData : monthlyData;
  data.forEach(r => {
    printWindow.document.write(`<tr><td>${r.period}</td><td>R$ ${r.entradas.toLocaleString("pt-BR")}</td><td>R$ ${r.saidas.toLocaleString("pt-BR")}</td><td>R$ ${r.saldo.toLocaleString("pt-BR")}</td><td>${r.projecao ? "Projeção" : "Realizado"}</td></tr>`);
  });
  printWindow.document.write(`</table><br/><button onclick="window.print()">Imprimir / Salvar como PDF</button></body></html>`);
  printWindow.document.close();
  printWindow.focus();
}

const LegendaBadges = () => (
  <div className="flex gap-2 flex-wrap">
    <Badge variant="outline" className="gap-1.5 text-xs">
      <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Entradas
    </Badge>
    <Badge variant="outline" className="gap-1.5 text-xs">
      <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />Saídas
    </Badge>
    <Badge variant="outline" className="gap-1.5 text-xs text-blue-700 border-blue-200">
      <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />Rec. Projetado
    </Badge>
    <Badge variant="outline" className="gap-1.5 text-xs text-orange-700 border-orange-200">
      <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />Pag. Projetado
    </Badge>
  </div>
);

export default function FluxoCaixaPage() {
  const [activeTab, setActiveTab] = useState("mensal");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h1>
        <p className="text-muted-foreground text-sm">Análise por período com projeções</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="semanal">Por Semana</TabsTrigger>
          <TabsTrigger value="mensal">Por Mês</TabsTrigger>
          <TabsTrigger value="semestral">Por Semestre</TabsTrigger>
        </TabsList>

        {/* Semanal */}
        <TabsContent value="semanal" className="space-y-4">
          {activeTab === "semanal" && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle>Fluxo Semanal</CardTitle>
                      <CardDescription>12 semanas — 9 realizadas + 3 projetadas</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <LegendaBadges />
                      <Button variant="outline" size="sm" onClick={() => exportarPDF("Fluxo de Caixa Semanal")}>Exportar PDF</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0} stroke="hsl(var(--border))" />
                      <Bar dataKey="entradas" name="Entradas" radius={[3, 3, 0, 0]} maxBarSize={28}>
                        {weeklyData.map((e, i) => <Cell key={i} fill={e.projecao ? "#3b82f6" : "#22c55e"} />)}
                      </Bar>
                      <Bar dataKey="saidas" name="Saídas" radius={[3, 3, 0, 0]} maxBarSize={28}>
                        {weeklyData.map((e, i) => <Cell key={i} fill={e.projecao ? "#f97316" : "#ef4444"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Detalhamento Semanal</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Semana</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Entradas</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Saídas</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Saldo</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyData.map((row, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2 px-3 font-medium">{row.period}</td>
                            <td className="py-2 px-3 text-right tabular-nums text-green-600">{formatCurrency(row.entradas)}</td>
                            <td className="py-2 px-3 text-right tabular-nums text-red-600">{formatCurrency(row.saidas)}</td>
                            <td className={`py-2 px-3 text-right tabular-nums font-semibold ${row.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(row.saldo)}</td>
                            <td className="py-2 px-3 text-center">
                              {row.projecao ? (
                                <Badge variant="secondary" className="text-xs">Projeção</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">Realizado</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Mensal */}
        <TabsContent value="mensal" className="space-y-4">
          {activeTab === "mensal" && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle>Fluxo Mensal</CardTitle>
                      <CardDescription>12 meses — 7 realizados + 5 projetados</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <LegendaBadges />
                      <Button variant="outline" size="sm" onClick={() => exportarPDF("Fluxo de Caixa Mensal")}>Exportar PDF</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
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
                        {monthlyData.map((row, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2 px-3 font-medium">{row.period}</td>
                            <td className="py-2 px-3 text-right tabular-nums text-green-600">{formatCurrency(row.entradas)}</td>
                            <td className="py-2 px-3 text-right tabular-nums text-red-600">{formatCurrency(row.saidas)}</td>
                            <td className={`py-2 px-3 text-right tabular-nums font-semibold ${row.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(row.saldo)}</td>
                            <td className="py-2 px-3 text-center">
                              {row.projecao ? (
                                <Badge variant="secondary" className="text-xs">Projeção</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">Realizado</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Semestral */}
        <TabsContent value="semestral" className="space-y-4">
          {activeTab === "semestral" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>Fluxo Semestral</CardTitle>
                    <CardDescription>4 semestres — 2 realizados + 2 projetados</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <LegendaBadges />
                    <Button variant="outline" size="sm" onClick={() => exportarPDF("Fluxo de Caixa Semestral")}>Exportar PDF</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={semesterData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="entradas" name="Entradas" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {semesterData.map((e, i) => <Cell key={i} fill={e.projecao ? "#3b82f6" : "#22c55e"} />)}
                    </Bar>
                    <Bar dataKey="saidas" name="Saídas" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {semesterData.map((e, i) => <Cell key={i} fill={e.projecao ? "#f97316" : "#ef4444"} />)}
                    </Bar>
                    <Bar dataKey="saldo" name="Saldo" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
