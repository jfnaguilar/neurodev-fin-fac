"use client";
import React, { useState } from "react";
import { Search, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const mockRateios: { id: string; data: string; titulo: string; aluno: string; centroCusto: string; percentual: number; valor: number; competencia: string; tipo: string }[] = [];

export default function ConsultaRateioPage() {
  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState("2026-05");
  const [tipoFilter, setTipoFilter] = useState("ALL");

  const filtered = mockRateios.filter((r) => {
    const matchSearch = r.titulo.toLowerCase().includes(search.toLowerCase()) || r.aluno.toLowerCase().includes(search.toLowerCase()) || r.centroCusto.toLowerCase().includes(search.toLowerCase());
    const matchPeriodo = !periodo || r.competencia === periodo;
    const matchTipo = tipoFilter === "ALL" || r.tipo === tipoFilter;
    return matchSearch && matchPeriodo && matchTipo;
  });

  const total = filtered.reduce((s, r) => s + r.valor, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Consulta de Rateios</h1>
        <p className="text-sm text-muted-foreground">Rateio › Consulta</p>
      </div>
      <Card><CardContent className="pt-4 pb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar título, aluno ou CC..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="space-y-0 flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Competência</Label>
            <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="w-40" />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="AUTOMATICO">Automático</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><Download className="h-3.5 w-3.5" /></Button>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno/Referência</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Centro de Custo</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">%</th>
              <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-center text-xs text-muted-foreground">{formatDate(r.data)}</td>
                <td className="py-3 px-4 font-mono text-xs">{r.titulo}</td>
                <td className="py-3 px-4 text-xs">{r.aluno}</td>
                <td className="py-3 px-4 text-xs">{r.centroCusto}</td>
                <td className="py-3 px-4 text-center font-semibold tabular-nums">{r.percentual}%</td>
                <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(r.valor)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.tipo === "AUTOMATICO" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}>{r.tipo === "AUTOMATICO" ? "Automático" : "Manual"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t px-4 py-3 flex justify-between text-sm">
          <span className="text-muted-foreground">{filtered.length} lançamento(s)</span>
          <span className="font-semibold">{formatCurrency(total)}</span>
        </div>
      </CardContent></Card>
    </div>
  );
}
