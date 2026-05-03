"use client";

import React, { useState } from "react";
import { Search, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const mockAuditLogs = [
  { id: "1", tableName: "payment_titles", recordId: "T-2026-001", action: "INSERT", changedBy: "Maria Financeiro", changedAt: "2026-05-02T10:30:00", ipAddress: "192.168.1.100", summary: "Título a pagar incluído — R$ 45.000,00" },
  { id: "2", tableName: "payment_titles", recordId: "T-2026-001", action: "APPROVAL", changedBy: "João Aprovador", changedAt: "2026-05-02T11:15:00", ipAddress: "192.168.1.101", summary: "Título aprovado — Nível 1" },
  { id: "3", tableName: "payment_titles", recordId: "T-2026-001", action: "PAYMENT", changedBy: "Maria Financeiro", changedAt: "2026-05-02T14:00:00", ipAddress: "192.168.1.100", summary: "Pagamento efetuado — R$ 45.000,00" },
  { id: "4", tableName: "suppliers", recordId: "SUP-001", action: "UPDATE", changedBy: "Administrador", changedAt: "2026-05-01T09:00:00", ipAddress: "192.168.1.1", summary: "Dados de fornecedor atualizados" },
  { id: "5", tableName: "users", recordId: "USR-005", action: "INSERT", changedBy: "Administrador", changedAt: "2026-04-30T16:30:00", ipAddress: "192.168.1.1", summary: "Novo usuário criado — ana@neurodev.com" },
];

const actionColors: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  APPROVAL: "bg-purple-100 text-purple-800",
  CANCEL: "bg-orange-100 text-orange-800",
  PAYMENT: "bg-teal-100 text-teal-800",
  REVERSAL: "bg-yellow-100 text-yellow-800",
};

const tableLabels: Record<string, string> = {
  payment_titles: "Títulos a Pagar",
  receivable_titles: "Títulos a Receber",
  suppliers: "Fornecedores",
  customers: "Clientes",
  users: "Usuários",
};

export default function AuditoriaPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Log de Auditoria</h1>
          <p className="text-sm text-muted-foreground">Administração › Log de Auditoria</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Exportar</Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar por usuário ou registro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select>
              <SelectTrigger className="w-44"><SelectValue placeholder="Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Ações</SelectItem>
                <SelectItem value="INSERT">Inclusão</SelectItem>
                <SelectItem value="UPDATE">Alteração</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
                <SelectItem value="APPROVAL">Aprovação</SelectItem>
                <SelectItem value="PAYMENT">Pagamento</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-36" />
            <Input type="date" className="w-36" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Data/Hora</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Usuário</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tabela</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ação</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">IP</th>
              </tr>
            </thead>
            <tbody>
              {mockAuditLogs.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(new Date(log.changedAt))}<br />
                    {new Date(log.changedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-3 px-4 font-medium">{log.changedBy}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{tableLabels[log.tableName] ?? log.tableName}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] ?? "bg-gray-100 text-gray-800"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{log.summary}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs tabular-nums">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
