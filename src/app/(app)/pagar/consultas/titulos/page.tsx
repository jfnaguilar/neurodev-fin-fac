"use client";
import React, { useState } from "react";
import { Search, Download, Eye, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getTitleSituationLabel, getTitleSituationColor } from "@/lib/utils";

const mockTitulos = [
  { id: "1", number: "PAG-2025-001", supplier: "Fornecedor ABC Ltda", group: "Serviços", dueDate: "2026-05-05", value: 45000, situation: "RELEASED" },
  { id: "2", number: "PAG-2025-002", supplier: "Editora Saraiva S.A.", group: "Material", dueDate: "2026-05-01", value: 28500, situation: "OVERDUE" },
  { id: "3", number: "PAG-2025-003", supplier: "Manutenção Predial", group: "Serviços", dueDate: "2026-05-10", value: 18000, situation: "RELEASED" },
  { id: "4", number: "PAG-2025-010", supplier: "Tech Solutions S.A.", group: "Tecnologia", dueDate: "2026-04-30", value: 12000, situation: "PAID" },
  { id: "5", number: "PAG-2025-011", supplier: "Gráfica Impressos ME", group: "Serviços", dueDate: "2026-04-28", value: 8500, situation: "PAID" },
  { id: "6", number: "PAG-2025-020", supplier: "Fornecedor ABC Ltda", group: "Serviços", dueDate: "2026-06-10", value: 5000, situation: "PENDING_APPROVAL" },
];

export default function ConsultaTitulosPagarPage() {
  const [search, setSearch] = useState("");
  const [situation, setSituation] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = mockTitulos.filter((t) => {
    const matchSearch = t.supplier.toLowerCase().includes(search.toLowerCase()) || t.number.toLowerCase().includes(search.toLowerCase());
    const matchSit = situation === "ALL" || t.situation === situation;
    return matchSearch && matchSit;
  });

  const totals = {
    count: filtered.length,
    total: filtered.reduce((s, t) => s + t.value, 0),
    paid: filtered.filter((t) => t.situation === "PAID").reduce((s, t) => s + t.value, 0),
    open: filtered.filter((t) => t.situation !== "PAID" && t.situation !== "CANCELED").reduce((s, t) => s + t.value, 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Consulta de Títulos — Por Credor</h1>
          <p className="text-sm text-muted-foreground">Contas a Pagar › Consultas › Títulos</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Exportar</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Registros", value: totals.count, unit: "títulos" },
          { label: "Total", value: formatCurrency(totals.total), unit: "" },
          { label: "Pagos", value: formatCurrency(totals.paid), unit: "" },
          { label: "Em Aberto", value: formatCurrency(totals.open), unit: "" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold tabular-nums">{s.value}</p>
              {s.unit && <p className="text-xs text-muted-foreground">{s.unit}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar credor ou número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={situation} onValueChange={setSituation}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Situação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as situações</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pend. Aprovação</SelectItem>
                <SelectItem value="RELEASED">Liberado</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="CANCELED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" placeholder="De" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" placeholder="Até" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Número</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Credor</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grupo</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{t.number}</td>
                  <td className="py-3 px-4 font-medium">{t.supplier}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.group}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(t.dueDate)}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(t.value)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTitleSituationColor(t.situation)}`}>{getTitleSituationLabel(t.situation)}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
