"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, Download, TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";

interface ReceivableTitle {
  id: string;
  documentNumber: string | null;
  dueDate: string;
  originalValue: number;
  currentBalance: number;
  situation: string;
  customer: { name: string } | null;
}

const situationConfig: Record<string, { label: string; className: string }> = {
  RECEIVED: { label: "Recebido", className: "bg-green-50 text-green-700" },
  RELEASED: { label: "Aberto", className: "bg-blue-50 text-blue-700" },
  OVERDUE: { label: "Vencido", className: "bg-red-50 text-red-700" },
  PENDING_APPROVAL: { label: "Pend. Aprovação", className: "bg-yellow-50 text-yellow-700" },
  CANCELED: { label: "Cancelado", className: "bg-gray-100 text-gray-500" },
};

export default function ConsultaTitulosReceberPage() {
  const { data: session } = useSession();
  const [titulos, setTitulos] = useState<ReceivableTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const tenantId = (session?.user as any)?.currentTenantId;

  const fetchTitulos = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/titulos/receber?tenantId=${tenantId}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTitulos(json.data ?? []);
    } catch {
      toast({ title: "Erro ao carregar títulos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchTitulos(); }, [fetchTitulos]);

  const filtered = titulos.filter((t) => {
    const matchSearch =
      (t.customer?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.documentNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.situation === statusFilter;
    const matchDate =
      (!dateFrom || new Date(t.dueDate) >= new Date(dateFrom)) &&
      (!dateTo || new Date(t.dueDate) <= new Date(dateTo));
    return matchSearch && matchStatus && matchDate;
  });

  const allTotal = titulos.reduce((s, t) => s + Number(t.originalValue), 0);
  const received = titulos.filter((t) => t.situation === "RECEIVED").reduce((s, t) => s + Number(t.originalValue), 0);
  const open = titulos.filter((t) => ["RELEASED", "PENDING_APPROVAL"].includes(t.situation)).reduce((s, t) => s + Number(t.currentBalance), 0);
  const overdue = titulos.filter((t) => t.situation === "OVERDUE").reduce((s, t) => s + Number(t.currentBalance), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Consulta de Títulos a Receber</h1>
          <p className="text-sm text-muted-foreground">Contas a Receber › Consultas › Títulos</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Exportar</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
            <div><p className="text-xs text-muted-foreground">Total Emitido</p><p className="text-lg font-bold">{formatCurrency(allTotal)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
            <div><p className="text-xs text-muted-foreground">Recebido</p><p className="text-lg font-bold text-green-600">{formatCurrency(received)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><Clock className="h-4 w-4 text-blue-600" /></div>
            <div><p className="text-xs text-muted-foreground">A Receber</p><p className="text-lg font-bold text-blue-600">{formatCurrency(open)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50"><AlertCircle className="h-4 w-4 text-red-600" /></div>
            <div><p className="text-xs text-muted-foreground">Vencidos</p><p className="text-lg font-bold text-red-600">{formatCurrency(overdue)}</p></div>
          </div>
        </CardContent></Card>
      </div>
      <Card><CardContent className="pt-4 pb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar aluno ou número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="RELEASED">Abertos</SelectItem>
              <SelectItem value="RECEIVED">Recebidos</SelectItem>
              <SelectItem value="OVERDUE">Vencidos</SelectItem>
              <SelectItem value="CANCELED">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno/Cliente</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Original</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Saldo</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{t.documentNumber ?? t.id.slice(0, 8)}</td>
                  <td className="py-3 px-4">{t.customer?.name ?? "—"}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(t.dueDate)}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(Number(t.originalValue))}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(Number(t.currentBalance))}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${situationConfig[t.situation]?.className ?? "bg-gray-100 text-gray-500"}`}>
                      {situationConfig[t.situation]?.label ?? t.situation}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum título encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
        {!loading && (
          <div className="border-t px-4 py-3 flex justify-between text-sm">
            <span className="text-muted-foreground">{filtered.length} título(s)</span>
            <span className="font-semibold">{formatCurrency(filtered.reduce((s, t) => s + Number(t.originalValue), 0))}</span>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
