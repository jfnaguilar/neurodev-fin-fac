"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, Eye, CheckCircle, RotateCcw, XCircle, ArrowUpDown, Loader2, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getTitleSituationLabel, getTitleSituationColor } from "@/lib/utils";
import { ExportImportBar } from "@/components/ui/ExportImportBar";
import { useSession } from "next-auth/react";

interface Title {
  id: string;
  documentNumber: string | null;
  documentType: string;
  dueDate: string;
  originalValue: number;
  currentBalance: number;
  situation: string;
  supplier: { id: string; name: string; document: string };
}

const SITUATION_OPTIONS = [
  { value: "ALL",               label: "Todas as Situações" },
  { value: "PENDING_APPROVAL",  label: "Pendente Aprovação" },
  { value: "RELEASED",         label: "Liberado" },
  { value: "PAID",             label: "Pago" },
  { value: "OVERDUE",          label: "Vencido" },
  { value: "CANCELED",         label: "Cancelado" },
];

export default function TitulosPagarPage() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.currentTenantId as string | undefined;

  const [titles, setTitles]       = useState<Title[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [situation, setSituation] = useState("ALL");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [selected, setSelected]   = useState<string[]>([]);

  const fetchTitles = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ tenantId });
      if (situation !== "ALL") params.set("situation", situation);
      const res = await fetch(`/api/titulos/pagar?${params}`);
      if (res.ok) {
        const { data } = await res.json();
        setTitles(data);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, situation]);

  useEffect(() => { fetchTitles(); }, [fetchTitles]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = titles.filter((t) => {
    const s = search.toLowerCase();
    const matchSearch = !search
      || t.supplier.name.toLowerCase().includes(s)
      || (t.documentNumber ?? "").toLowerCase().includes(s);
    const due = t.dueDate.slice(0, 10);
    const matchFrom = !dateFrom || due >= dateFrom;
    const matchTo   = !dateTo   || due <= dateTo;
    return matchSearch && matchFrom && matchTo;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const totalSelected = filtered
    .filter((t) => selected.includes(t.id))
    .reduce((s, t) => s + Number(t.currentBalance), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Títulos a Pagar</h1>
          <p className="text-sm text-muted-foreground">Contas a Pagar › Títulos</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportBar entity="titulos-pagar" onImportSuccess={fetchTitles} />
          <Button size="sm" asChild>
            <Link href="/pagar/titulos/inclusao"><Plus className="h-3.5 w-3.5 mr-1.5" />Incluir Título</Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por credor ou nº documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={situation} onValueChange={setSituation}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SITUATION_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" className="w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" className="w-36" value={dateTo}   onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Batch actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{selected.length} título(s) selecionado(s)</span>
          <span className="text-sm text-muted-foreground">Total: {formatCurrency(totalSelected)}</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" asChild>
              <Link href="/pagar/titulos/pagamento"><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Pagar Selecionados</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected([])}>Limpar seleção</Button>
          </div>
        </div>
      )}

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
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selected.length === filtered.length && filtered.length > 0}
                        onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map((t) => t.id))}
                      />
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">Credor <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Documento</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">Vencimento <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Original</th>
                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">Saldo</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((title) => {
                    const due   = title.dueDate.slice(0, 10);
                    const isOvd = ["OVERDUE", "RELEASED", "PENDING_APPROVAL"].includes(title.situation) && due < today;
                    return (
                      <tr key={title.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selected.includes(title.id)}
                            onChange={() => toggleSelect(title.id)}
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{title.supplier.name}</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{title.documentNumber ?? "—"}</td>
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
                                <Link href={`/pagar/titulos/pagamento?id=${title.id}`}><CheckCircle className="h-3.5 w-3.5 text-green-600" /></Link>
                              </Button>
                            )}
                            {title.situation === "PAID" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <Link href={`/pagar/titulos/estorno?id=${title.id}`}><RotateCcw className="h-3.5 w-3.5 text-yellow-600" /></Link>
                              </Button>
                            )}
                            {["RELEASED", "PENDING_APPROVAL"].includes(title.situation) && (
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <XCircle className="h-3.5 w-3.5 text-red-600" />
                              </Button>
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
                          <Link href="/pagar/titulos/inclusao"><Plus className="h-3.5 w-3.5 mr-1.5" />Incluir Título</Link>
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot className="border-t bg-muted/30">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-sm text-muted-foreground">{filtered.length} título(s)</td>
                      <td className="py-3 px-4 text-right text-sm font-semibold tabular-nums">
                        {formatCurrency(filtered.reduce((s, t) => s + Number(t.originalValue), 0))}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold tabular-nums">
                        {formatCurrency(filtered.reduce((s, t) => s + Number(t.currentBalance), 0))}
                      </td>
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
