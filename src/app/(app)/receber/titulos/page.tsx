"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Download, Upload, Eye, CheckCircle, RotateCcw, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getTitleSituationLabel, getTitleSituationColor, isOverdue, daysDiff } from "@/lib/utils";

const mockReceivables = [
  { id: "1", customerName: "João Silva", enrollmentId: "MAT-2024-001", dueDate: "2026-05-05", originalValue: 1850, currentBalance: 1850, situation: "RELEASED", daysOverdue: 0 },
  { id: "2", customerName: "Maria Oliveira", enrollmentId: "MAT-2024-002", dueDate: "2026-04-05", originalValue: 2100, currentBalance: 2100, situation: "OVERDUE", daysOverdue: 27 },
  { id: "3", customerName: "Pedro Santos", enrollmentId: "MAT-2025-045", dueDate: "2026-05-05", originalValue: 1950, currentBalance: 1950, situation: "RELEASED", daysOverdue: 0 },
  { id: "4", customerName: "Ana Costa", enrollmentId: "MAT-2023-089", dueDate: "2026-03-05", originalValue: 1800, currentBalance: 1950, situation: "OVERDUE", daysOverdue: 58 },
  { id: "5", customerName: "Carlos Lima", enrollmentId: "MAT-2025-012", dueDate: "2026-05-05", originalValue: 2200, currentBalance: 0, situation: "RECEIVED", daysOverdue: 0 },
];

const situationOptions = [
  { value: "ALL", label: "Todas as Situações" },
  { value: "RELEASED", label: "A Receber" },
  { value: "RECEIVED", label: "Recebido" },
  { value: "OVERDUE", label: "Vencido" },
  { value: "CANCELED", label: "Cancelado" },
];

export default function TitulosReceberPage() {
  const [search, setSearch] = useState("");
  const [situation, setSituation] = useState("ALL");

  const filtered = mockReceivables.filter((t) => {
    const matchSearch = t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.enrollmentId.toLowerCase().includes(search.toLowerCase());
    const matchSit = situation === "ALL" || t.situation === situation;
    return matchSearch && matchSit;
  });

  const overdueTotals = filtered.filter((t) => t.situation === "OVERDUE");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Títulos a Receber</h1>
          <p className="text-sm text-muted-foreground">Contas a Receber › Títulos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-1.5" />Importar</Button>
          <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Exportar</Button>
          <Button size="sm" asChild>
            <Link href="/receber/titulos/inclusao"><Plus className="h-3.5 w-3.5 mr-1.5" />Incluir Título</Link>
          </Button>
        </div>
      </div>

      {/* Inadimplência Alert */}
      {overdueTotals.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="text-sm text-red-700">
            <span className="font-semibold">{overdueTotals.length} título(s) vencido(s)</span> — Total em atraso:{" "}
            <span className="font-bold">{formatCurrency(overdueTotals.reduce((s, t) => s + t.currentBalance, 0))}</span>
          </span>
          <Button size="sm" variant="outline" className="ml-auto border-red-300 text-red-700 hover:bg-red-100" asChild>
            <Link href="/receber/consultas/inadimplencia">Ver Inadimplência</Link>
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar por aluno ou matrícula..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={situation} onValueChange={setSituation}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {situationOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" className="w-36" />
            <Input type="date" className="w-36" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno/Cliente</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Matrícula</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Vencimento</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Original</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Saldo</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Atraso</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((title) => (
                  <tr key={title.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{title.customerName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{title.enrollmentId}</td>
                    <td className="py-3 px-4">
                      <span className={title.situation === "OVERDUE" ? "text-red-600 font-medium" : ""}>
                        {title.situation === "OVERDUE" && "🔴 "}{formatDate(title.dueDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(title.originalValue)}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold">{formatCurrency(title.currentBalance)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTitleSituationColor(title.situation)}`}>
                        {getTitleSituationLabel(title.situation)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {title.daysOverdue > 0 && (
                        <span className="text-red-600 font-medium text-xs">{title.daysOverdue} dias</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        {title.situation === "RELEASED" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={`/receber/titulos/recebimento?id=${title.id}`}><CheckCircle className="h-3.5 w-3.5 text-green-600" /></Link>
                          </Button>
                        )}
                        {title.situation === "RECEIVED" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7"><RotateCcw className="h-3.5 w-3.5 text-yellow-600" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground text-sm">Nenhum título encontrado.</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t bg-muted/30">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-sm text-muted-foreground">{filtered.length} título(s)</td>
                  <td className="py-3 px-4 text-right text-sm font-semibold tabular-nums">{formatCurrency(filtered.reduce((s, t) => s + t.originalValue, 0))}</td>
                  <td className="py-3 px-4 text-right text-sm font-bold tabular-nums">{formatCurrency(filtered.reduce((s, t) => s + t.currentBalance, 0))}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
