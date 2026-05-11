"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Eye, CheckCircle, RotateCcw, AlertTriangle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getTitleSituationLabel, getTitleSituationColor } from "@/lib/utils";
import { ExportImportBar } from "@/components/ui/ExportImportBar";
import { useSession } from "next-auth/react";

interface Title {
  id: string;
  dueDate: string;
  originalValue: number;
  currentBalance: number;
  situation: string;
  documentNumber: string | null;
  customer: { id: string; name: string; enrollmentId: string | null };
  payer?: { id: string; name: string } | null;
}

const SITUATION_OPTIONS = [
  { value: "ALL",              label: "Todas as Situações" },
  { value: "RELEASED",        label: "A Receber" },
  { value: "OVERDUE",         label: "Vencido" },
  { value: "RECEIVED",        label: "Recebido" },
  { value: "CANCELED",        label: "Cancelado" },
  { value: "PENDING_APPROVAL", label: "Pend. Aprovação" },
];

export default function TitulosReceberPage() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.currentTenantId as string | undefined;

  const [titles, setTitles]       = useState<Title[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [situation, setSituation] = useState("ALL");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");

  const fetchTitles = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ tenantId });
      if (situation !== "ALL") params.set("situation", situation);
      const res = await fetch(`/api/titulos/receber?${params}`);
      if (res.ok) {
        const { data } = await res.json();
        setTitles(data);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, situation]);

  useEffect(() => { fetchTitles(); }, [fetchTitles]);

  // Client-side search + date filter
  const filtered = titles.filter((t) => {
    const s = search.toLowerCase();
    const matchSearch = !search
      || t.customer.name.toLowerCase().includes(s)
      || (t.customer.enrollmentId ?? "").toLowerCase().includes(s)
      || (t.documentNumber ?? "").toLowerCase().includes(s);
    const due = t.dueDate.slice(0, 10);
    const matchFrom = !dateFrom || due >= dateFrom;
    const matchTo   = !dateTo   || due <= dateTo;
    return matchSearch && matchFrom && matchTo;
  });

  const today = new Date().toISOString().slice(0, 10);
  const overdueTitles = filtered.filter((t) =>
    ["OVERDUE", "RELEASED"].includes(t.situation) && t.dueDate.slice(0, 10) < today
  );
  const totalBalance   = filtered.reduce((s, t) => s + Number(t.currentBalance), 0);
  const totalOriginal  = filtered.reduce((s, t) => s + Number(t.originalValue), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Títulos a Receber</h1>
          <p className="text-sm text-muted-foreground">Contas a Receber › Títulos</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportBar entity="titulos-receber" onImportSuccess={fetchTitles} />
          <Button size="sm" asChild>
            <Link href="/receber/titulos/inclusao"><Plus className="h-3.5 w-3.5 mr-1.5" />Incluir Título</Link>
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueTitles.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="text-sm text-red-700">
            <span className="font-semibold">{overdueTitles.length} título(s) vencido(s)</span>
            {" "}— Total em atraso:{" "}
            <span className="font-bold">{formatCurrency(overdueTitles.reduce((s, t) => s + Number(t.currentBalance), 0))}</span>
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
              <Input
                placeholder="Buscar por aluno, matrícula ou nº documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={situation} onValueChange={setSituation}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SITUATION_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" className="w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="De" />
            <Input type="date" className="w-36" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   placeholder="Até" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Pagador</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Matrícula</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Vencimento</th>
                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Original</th>
                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">Saldo</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((title) => {
                    const due   = title.dueDate.slice(0, 10);
                    const isOvd = ["OVERDUE", "RELEASED"].includes(title.situation) && due < today;
                    const payer = title.payer && title.payer.id !== title.customer.id ? title.payer.name : null;
                    return (
                      <tr key={title.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{title.customer.name}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{payer ?? <span className="italic">próprio</span>}</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{title.customer.enrollmentId ?? "—"}</td>
                        <td className="py-3 px-4">
                          <span className={isOvd ? "text-red-600 font-medium" : ""}>
                            {isOvd && "● "}{formatDate(title.dueDate)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(Number(title.originalValue))}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold">{formatCurrency(Number(title.currentBalance))}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTitleSituationColor(title.situation)}`}>
                            {getTitleSituationLabel(title.situation)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                            {["RELEASED", "OVERDUE"].includes(title.situation) && (
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
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-14 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhum título encontrado.</p>
                        <Button size="sm" variant="outline" className="mt-3" asChild>
                          <Link href="/receber/titulos/inclusao"><Plus className="h-3.5 w-3.5 mr-1.5" />Incluir Título</Link>
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot className="border-t bg-muted/30">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-sm text-muted-foreground">{filtered.length} título(s)</td>
                      <td className="py-3 px-4 text-right text-sm font-semibold tabular-nums">{formatCurrency(totalOriginal)}</td>
                      <td className="py-3 px-4 text-right text-sm font-bold tabular-nums">{formatCurrency(totalBalance)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
