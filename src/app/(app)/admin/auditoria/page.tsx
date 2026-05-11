"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Download, Loader2, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  changedAt: string;
  ipAddress: string | null;
  summary: string | null;
  user?: { name: string | null; email: string } | null;
}

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
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.currentTenantId as string | undefined;

  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [action, setAction]   = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  const fetchLogs = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ tenantId, page: String(page), limit: "50" });
      if (action !== "ALL") params.set("action", action);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/auditoria?${params}`);
      if (res.ok) {
        const { data, total: t } = await res.json();
        setLogs(data);
        setTotal(t);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, action, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return !search
      || (l.user?.name ?? "").toLowerCase().includes(q)
      || (l.user?.email ?? "").toLowerCase().includes(q)
      || l.recordId.toLowerCase().includes(q)
      || (l.summary ?? "").toLowerCase().includes(q);
  });

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
              <Input placeholder="Buscar por usuário, registro ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Ações</SelectItem>
                <SelectItem value="INSERT">Inclusão</SelectItem>
                <SelectItem value="UPDATE">Alteração</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
                <SelectItem value="APPROVAL">Aprovação</SelectItem>
                <SelectItem value="PAYMENT">Pagamento</SelectItem>
                <SelectItem value="REVERSAL">Estorno</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-36" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <Input type="date" className="w-36" value={dateTo}   onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(new Date(log.changedAt))}<br />
                      {new Date(log.changedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 font-medium">{log.user?.name ?? log.user?.email ?? "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{tableLabels[log.tableName] ?? log.tableName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] ?? "bg-gray-100 text-gray-800"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{log.summary ?? "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs tabular-nums">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Nenhum registro de auditoria encontrado.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {total > 50 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} registros no total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => setPage((p) => p + 1)}>Próximo</Button>
          </div>
        </div>
      )}
    </div>
  );
}
