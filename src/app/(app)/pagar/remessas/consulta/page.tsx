"use client";
import React, { useState } from "react";
import { Search, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const mockRemessas: { id: string; filename: string; bank: string; date: string; titles: number; value: number; status: string }[] = [];

const statusLabels: Record<string, string> = { SENT: "Enviada", RETURNED: "Retorno Processado", PENDING: "Aguardando Retorno" };
const statusColors: Record<string, string> = { SENT: "bg-blue-50 text-blue-700", RETURNED: "bg-green-50 text-green-700", PENDING: "bg-yellow-50 text-yellow-700" };

export default function ConsultaRemessasPagarPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = mockRemessas.filter((r) => {
    const matchSearch = r.filename.toLowerCase().includes(search.toLowerCase()) || r.bank.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Consulta de Remessas</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Remessas › Consulta</p>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar por arquivo ou banco..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="SENT">Enviadas</SelectItem>
                <SelectItem value="RETURNED">Retorno Processado</SelectItem>
                <SelectItem value="PENDING">Aguardando Retorno</SelectItem>
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
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Arquivo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Banco</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Títulos</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Total</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{r.filename}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.bank}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(r.date)}</td>
                  <td className="py-3 px-4 text-center">{r.titles}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(r.value)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status] ?? ""}`}>{statusLabels[r.status] ?? r.status}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
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
