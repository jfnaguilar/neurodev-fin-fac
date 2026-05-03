"use client";
import React, { useState } from "react";
import { BarChart3, Download, FileText, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

const chartData = [
  { month: "Nov/25", value: 142000 }, { month: "Dez/25", value: 178000 },
  { month: "Jan/26", value: 160000 }, { month: "Fev/26", value: 155000 },
  { month: "Mar/26", value: 170000 }, { month: "Abr/26", value: 165000 },
  { month: "Mai/26", value: 168000 },
];

const byGroup = [
  { group: "Serviços", value: 95000, pct: "36%" },
  { group: "Material Didático", value: 72000, pct: "27%" },
  { group: "Tecnologia", value: 48000, pct: "18%" },
  { group: "Manutenção", value: 32000, pct: "12%" },
  { group: "Outros", value: 18000, pct: "7%" },
];

const reports = [
  { id: "1", title: "Contas a Pagar — Geral", description: "Listagem completa com filtros por credor, vencimento e situação" },
  { id: "2", title: "Posição de Pagamentos", description: "Resumo de pagamentos realizados no período" },
  { id: "3", title: "Inadimplência com Credores", description: "Títulos vencidos e não pagos agrupados por credor" },
  { id: "4", title: "Pagamentos por Centro de Custo", description: "Distribuição de despesas por CC no período" },
  { id: "5", title: "Previsão de Pagamentos", description: "Fluxo de caixa de saídas para os próximos 30/60/90 dias" },
];

export default function RelatoriosPagarPage() {
  const [period, setPeriod] = useState("2026-05");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Relatórios — Contas a Pagar</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Consultas › Relatórios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle className="text-sm">Pagamentos por Mês</CardTitle><CardDescription>Últimos 7 meses</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Distribuição por Grupo</CardTitle><CardDescription>Mês atual</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byGroup.map((g) => (
                <div key={g.group} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{g.group}</span>
                    <span className="font-medium tabular-nums">{formatCurrency(g.value)} <span className="text-muted-foreground text-xs">({g.pct})</span></span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: g.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Relatórios Disponíveis</CardTitle>
          <CardDescription>Selecione o período e gere o relatório desejado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-1.5">
              <Label>Competência</Label>
              <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-36" />
            </div>
            <div className="space-y-1.5">
              <Label>Formato</Label>
              <Select defaultValue="PDF">
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0"><Download className="h-3.5 w-3.5 mr-1.5" />Gerar</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
