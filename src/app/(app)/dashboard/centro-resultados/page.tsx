"use client";

import React, { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

type DreItem = { name: string; currentPeriod: number; previousPeriod: number };
type DreSection = { category: string; items: DreItem[] };

const dreBase: DreSection[] = [
  { category: "RECEITAS", items: [
    { name: "Mensalidades", currentPeriod: 850000, previousPeriod: 810000 },
    { name: "Matrículas e Re-matrículas", currentPeriod: 120000, previousPeriod: 95000 },
    { name: "Cursos de Extensão", currentPeriod: 45000, previousPeriod: 38000 },
    { name: "Outras Receitas", currentPeriod: 22000, previousPeriod: 19000 },
  ]},
  { category: "DESPESAS PESSOAL", items: [
    { name: "Salários e Encargos", currentPeriod: -380000, previousPeriod: -365000 },
    { name: "Benefícios", currentPeriod: -45000, previousPeriod: -42000 },
    { name: "Treinamentos", currentPeriod: -8000, previousPeriod: -6000 },
  ]},
  { category: "DESPESAS OPERACIONAIS", items: [
    { name: "Aluguel e Condomínio", currentPeriod: -85000, previousPeriod: -85000 },
    { name: "Utilities (Luz, Água, Internet)", currentPeriod: -22000, previousPeriod: -20000 },
    { name: "Material Didático", currentPeriod: -35000, previousPeriod: -28000 },
    { name: "Manutenção Predial", currentPeriod: -18000, previousPeriod: -15000 },
    { name: "Marketing", currentPeriod: -25000, previousPeriod: -22000 },
    { name: "Outros", currentPeriod: -15000, previousPeriod: -13000 },
  ]},
];

const monthOrder = ["2026-02", "2026-03", "2026-04", "2026-05"];

const monthMultipliers: Record<string, number> = {
  "2026-02": 0.89,
  "2026-03": 0.92,
  "2026-04": 0.95,
  "2026-05": 1.0,
};

const monthMeta: Record<string, { current: string; prev: string }> = {
  "2026-05": { current: "Mai/26", prev: "Abr/26" },
  "2026-04": { current: "Abr/26", prev: "Mar/26" },
  "2026-03": { current: "Mar/26", prev: "Fev/26" },
};

function scaleDreData(base: DreSection[], currentMult: number, prevMult: number): DreSection[] {
  return base.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      currentPeriod: Math.round(item.currentPeriod * currentMult),
      previousPeriod: Math.round(item.currentPeriod * prevMult),
    })),
  }));
}

function DRESection({ category, items, currentLabel, prevLabel }: { category: string; items: DreItem[]; currentLabel: string; prevLabel: string }) {
  const total = items.reduce((s, i) => s + i.currentPeriod, 0);
  const prevTotal = items.reduce((s, i) => s + i.previousPeriod, 0);
  const variation = prevTotal !== 0 ? ((total - prevTotal) / Math.abs(prevTotal)) * 100 : 0;
  const isRevenue = total > 0;

  return (
    <div>
      <div className="flex items-center justify-between py-2 border-b-2 mb-1">
        <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{category}</span>
        <div className="flex gap-6 text-sm font-semibold">
          <span className={isRevenue ? "text-green-600" : "text-red-600"}>{formatCurrency(total)}</span>
          <span className="text-muted-foreground">{formatCurrency(prevTotal)}</span>
          <span className={`text-xs ${variation >= 0 ? "text-green-600" : "text-red-600"}`}>
            {variation >= 0 ? "+" : ""}{variation.toFixed(1)}%
          </span>
        </div>
      </div>
      {items.map((item, i) => {
        const var2 = item.previousPeriod !== 0 ? ((item.currentPeriod - item.previousPeriod) / Math.abs(item.previousPeriod)) * 100 : 0;
        return (
          <div key={i} className="flex items-center justify-between py-1.5 px-2 hover:bg-muted/30 rounded text-sm">
            <span className="text-muted-foreground">{item.name}</span>
            <div className="flex gap-6">
              <span className={`tabular-nums font-medium ${item.currentPeriod >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(item.currentPeriod)}</span>
              <span className="tabular-nums text-muted-foreground w-28 text-right">{formatCurrency(item.previousPeriod)}</span>
              <span className={`text-xs w-14 text-right ${var2 >= 0 ? "text-green-600" : "text-red-600"}`}>{var2 >= 0 ? "+" : ""}{var2.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CentroResultadosPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-05");

  const currentMult = monthMultipliers[selectedMonth] ?? 1.0;
  const prevMonthKey = monthOrder[monthOrder.indexOf(selectedMonth) - 1];
  const prevMult = monthMultipliers[prevMonthKey] ?? currentMult * 0.95;

  const dreData = useMemo(
    () => scaleDreData(dreBase, currentMult, prevMult),
    [currentMult, prevMult]
  );
  const meta = monthMeta[selectedMonth] ?? { current: "Mai/26", prev: "Abr/26" };

  const totalReceitas = dreData[0].items.reduce((s, i) => s + i.currentPeriod, 0);
  const totalDespesas = dreData.slice(1).flatMap((d) => d.items).reduce((s, i) => s + i.currentPeriod, 0);
  const resultado = totalReceitas + totalDespesas;

  const expenseDistribution = useMemo(() => {
    const pessoal = dreData.find((s) => s.category === "DESPESAS PESSOAL");
    const operacional = dreData.find((s) => s.category === "DESPESAS OPERACIONAIS");
    const pessoalTotal = Math.abs(pessoal?.items.reduce((s, i) => s + i.currentPeriod, 0) ?? 0);
    const aluguel = Math.abs(operacional?.items.find((i) => i.name.includes("Aluguel"))?.currentPeriod ?? 0);
    const material = Math.abs(operacional?.items.find((i) => i.name.includes("Material"))?.currentPeriod ?? 0);
    const marketing = Math.abs(operacional?.items.find((i) => i.name.includes("Marketing"))?.currentPeriod ?? 0);
    const outros = Math.abs(
      operacional?.items
        .filter((i) => !i.name.includes("Aluguel") && !i.name.includes("Material") && !i.name.includes("Marketing"))
        .reduce((s, i) => s + i.currentPeriod, 0) ?? 0
    );
    return [
      { name: "Pessoal", value: pessoalTotal, fill: "#3b82f6" },
      { name: "Aluguel", value: aluguel, fill: "#8b5cf6" },
      { name: "Material Didático", value: material, fill: "#f59e0b" },
      { name: "Marketing", value: marketing, fill: "#10b981" },
      { name: "Outros", value: outros, fill: "#6b7280" },
    ];
  }, [dreData]);

  const handleExportDRE = () => {
    const rows = dreData.flatMap((section) =>
      section.items.map((item) => `${section.category};${item.name};${item.currentPeriod};${item.previousPeriod}`)
    );
    const header = `Categoria;Conta;${meta.current};${meta.prev}`;
    const footer = `RESULTADO OPERACIONAL;;${resultado};`;
    const csv = [header, ...rows, footer].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DRE_${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Centro de Resultados</h1>
          <p className="text-sm text-muted-foreground">DRE Gerencial — {meta.current}</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-05">Mai/2026</SelectItem>
              <SelectItem value="2026-04">Abr/2026</SelectItem>
              <SelectItem value="2026-03">Mar/2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportDRE}><Download className="h-3.5 w-3.5 mr-1.5" />Exportar DRE</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="text-sm text-green-700">Total Receitas</p>
            <p className="text-2xl font-bold text-green-700 tabular-nums">{formatCurrency(totalReceitas)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-sm text-red-700">Total Despesas</p>
            <p className="text-2xl font-bold text-red-700 tabular-nums">{formatCurrency(Math.abs(totalDespesas))}</p>
          </CardContent>
        </Card>
        <Card className={resultado >= 0 ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-4">
            <p className={`text-sm ${resultado >= 0 ? "text-blue-700" : "text-red-700"}`}>Resultado do Período</p>
            <p className={`text-2xl font-bold tabular-nums ${resultado >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatCurrency(resultado)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-end justify-between">
              <CardTitle className="text-base">DRE Gerencial</CardTitle>
              <div className="flex gap-6 text-xs text-muted-foreground font-medium mr-2">
                <span>{meta.current}</span>
                <span>{meta.prev}</span>
                <span>Var%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {dreData.map((section, i) => (
              <DRESection key={i} category={section.category} items={section.items} currentLabel={meta.current} prevLabel={meta.prev} />
            ))}
            <div className="flex items-center justify-between py-3 border-t-2 border-double">
              <span className="font-bold">RESULTADO OPERACIONAL</span>
              <span className={`font-bold text-lg tabular-nums ${resultado >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(resultado)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Despesas</CardTitle>
            <CardDescription className="text-xs">Por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={expenseDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                  {expenseDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconSize={10} iconType="circle" formatter={(value) => <span className="text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
