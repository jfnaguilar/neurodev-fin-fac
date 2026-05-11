"use client";
import React, { useState } from "react";
import { Search, CheckCircle, XCircle, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const mockHistorico: { id: string; titleNumber: string; supplier: string; value: number; requestedBy: string; approvedBy: string; date: string; result: string; observation: string }[] = [];

export default function HistoricoAprovacoesPage() {
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");

  const filtered = mockHistorico.filter((h) => {
    const matchSearch = h.titleNumber.toLowerCase().includes(search.toLowerCase()) || h.supplier.toLowerCase().includes(search.toLowerCase());
    const matchResult = resultFilter === "ALL" || h.result === resultFilter;
    return matchSearch && matchResult;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Aprovações / Rejeições — Histórico</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Aprovações › Histórico</p>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar por título ou fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Resultado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="APPROVED">Aprovados</SelectItem>
                <SelectItem value="REJECTED">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Credor</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Solicitado por</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aprovador</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((h) => (
                <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{h.titleNumber}</td>
                  <td className="py-3 px-4 font-medium">{h.supplier}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold">{formatCurrency(h.value)}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{h.requestedBy}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{h.approvedBy}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(h.date)}</td>
                  <td className="py-3 px-4 text-center">
                    {h.result === "APPROVED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3" />Aprovado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                        <XCircle className="h-3 w-3" />Rejeitado
                      </span>
                    )}
                    {h.observation && <p className="text-xs text-muted-foreground mt-0.5 max-w-[120px] truncate">{h.observation}</p>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
