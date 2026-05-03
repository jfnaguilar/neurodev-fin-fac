"use client";
import React, { useState } from "react";
import { Search, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const mockLogs = [
  { id: "1", datetime: "2026-05-10 09:14:32", type: "REMESSA", format: "CNAB 240", bank: "341 — Itaú", filename: "PGTO_241_20260510.rem", records: 4, status: "SUCCESS", message: "Arquivo transmitido com sucesso" },
  { id: "2", datetime: "2026-05-10 09:12:01", type: "REMESSA", format: "CNAB 400", bank: "033 — Santander", filename: "COB_400_20260510.rem", records: 6, status: "SUCCESS", message: "Arquivo transmitido com sucesso" },
  { id: "3", datetime: "2026-05-09 14:35:18", type: "RETORNO", format: "CNAB 240", bank: "341 — Itaú", filename: "RETORNO_241_20260509.ret", records: 4, status: "SUCCESS", message: "4 registros processados, 0 erros" },
  { id: "4", datetime: "2026-05-08 11:20:45", type: "RETORNO", format: "CNAB 400", bank: "033 — Santander", filename: "RETORNO_400_20260508.ret", records: 6, status: "ERROR", message: "Falha ao processar: código de banco inválido no registro 3" },
  { id: "5", datetime: "2026-05-07 08:55:03", type: "REMESSA", format: "CNAB 240", bank: "237 — Bradesco", filename: "COB_241_20260507.rem", records: 3, status: "PENDING", message: "Aguardando confirmação do banco" },
  { id: "6", datetime: "2026-05-05 16:10:22", type: "RETORNO", format: "CNAB 240", bank: "237 — Bradesco", filename: "RETORNO_241_20260505.ret", records: 3, status: "SUCCESS", message: "3 boletos confirmados, 0 rejeitados" },
];

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  SUCCESS: { label: "Sucesso", icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: "text-green-700 bg-green-50" },
  ERROR: { label: "Erro", icon: <XCircle className="h-3.5 w-3.5" />, className: "text-red-700 bg-red-50" },
  PENDING: { label: "Pendente", icon: <Clock className="h-3.5 w-3.5" />, className: "text-yellow-700 bg-yellow-50" },
};

export default function BancarioLogPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = mockLogs.filter((l) => {
    const matchSearch = l.filename.toLowerCase().includes(search.toLowerCase()) || l.bank.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || l.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || l.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Log de Integrações Bancárias</h1>
          <p className="text-sm text-muted-foreground">Integrações Bancárias › Log</p>
        </div>
        <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />Atualizar
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-2xl font-bold text-green-600">{mockLogs.filter((l) => l.status === "SUCCESS").length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Transmissões OK</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-2xl font-bold text-red-600">{mockLogs.filter((l) => l.status === "ERROR").length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Erros</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{mockLogs.filter((l) => l.status === "PENDING").length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pendentes</p>
        </CardContent></Card>
      </div>
      <Card><CardContent className="pt-4 pb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar arquivo ou banco..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              <SelectItem value="REMESSA">Remessa</SelectItem>
              <SelectItem value="RETORNO">Retorno</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="SUCCESS">Sucesso</SelectItem>
              <SelectItem value="ERROR">Erro</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data/Hora</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Tipo</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Arquivo</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Banco</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Formato</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Registros</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Mensagem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((l) => {
              const sc = statusConfig[l.status];
              return (
                <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">{l.datetime}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${l.type === "REMESSA" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{l.type}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{l.filename}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{l.bank}</td>
                  <td className="py-3 px-4 text-xs">{l.format}</td>
                  <td className="py-3 px-4 text-center">{l.records}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sc?.className ?? ""}`}>{sc?.icon}{sc?.label}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{l.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
