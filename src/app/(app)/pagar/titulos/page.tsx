"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  CheckCircle,
  RotateCcw,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getTitleSituationLabel, getTitleSituationColor, isOverdue } from "@/lib/utils";

const mockTitles = [
  { id: "1", supplierName: "Fornecedor ABC Ltda", documentNumber: "NF-001234", documentType: "INVOICE_IN", dueDate: "2026-05-01", originalValue: 45000, currentBalance: 45000, situation: "RELEASED", hasAdf: false, createdAt: "2026-04-28" },
  { id: "2", supplierName: "Editora Saraiva S.A.", documentNumber: "NF-005678", documentType: "INVOICE_IN", dueDate: "2026-04-30", originalValue: 28500, currentBalance: 28500, situation: "OVERDUE", hasAdf: false, createdAt: "2026-04-20" },
  { id: "3", supplierName: "Manutenção Predial", documentNumber: "REC-0089", documentType: "RECEIPT", dueDate: "2026-05-10", originalValue: 18000, currentBalance: 14000, situation: "RELEASED", hasAdf: true, createdAt: "2026-05-01" },
  { id: "4", supplierName: "Software TI Sistemas", documentNumber: "NF-002345", documentType: "INVOICE_IN", dueDate: "2026-05-15", originalValue: 12000, currentBalance: 12000, situation: "PENDING_APPROVAL", hasAdf: false, createdAt: "2026-05-02" },
  { id: "5", supplierName: "Gráfica Impressos", documentNumber: "NF-007890", documentType: "INVOICE_IN", dueDate: "2026-04-28", originalValue: 8500, currentBalance: 8500, situation: "OVERDUE", hasAdf: false, createdAt: "2026-04-15" },
];

const situationOptions = [
  { value: "ALL", label: "Todas as Situações" },
  { value: "PENDING_APPROVAL", label: "Pendente Aprovação" },
  { value: "RELEASED", label: "Liberado" },
  { value: "PAID", label: "Pago" },
  { value: "OVERDUE", label: "Vencido" },
  { value: "CANCELED", label: "Cancelado" },
];

export default function TitulosPagarPage() {
  const [search, setSearch] = useState("");
  const [situation, setSituation] = useState("ALL");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = mockTitles.filter((t) => {
    const matchSearch = t.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      (t.documentNumber?.toLowerCase().includes(search.toLowerCase()));
    const matchSit = situation === "ALL" || t.situation === situation;
    return matchSearch && matchSit;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const totalSelected = filtered
    .filter((t) => selected.includes(t.id))
    .reduce((sum, t) => sum + t.currentBalance, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Títulos a Pagar</h1>
          <p className="text-sm text-muted-foreground">Contas a Pagar › Títulos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar
          </Button>
          <Button size="sm" asChild>
            <Link href="/pagar/titulos/inclusao">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Incluir Título
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por credor ou documento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={situation} onValueChange={setSituation}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {situationOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" className="w-36" placeholder="Venc. de" />
            <Input type="date" className="w-36" placeholder="Venc. até" />
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions bar (when selected) */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{selected.length} título(s) selecionado(s)</span>
          <span className="text-sm text-muted-foreground">Total: {formatCurrency(totalSelected)}</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" asChild>
              <Link href="/pagar/titulos/pagamento">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Pagar Selecionados
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected([])}>
              Limpar seleção
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left w-10">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={() => {
                        if (selected.length === filtered.length) setSelected([]);
                        else setSelected(filtered.map((t) => t.id));
                      }}
                    />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground">
                      Credor <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Documento</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground">
                      Vencimento <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Original</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Saldo</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((title) => {
                  const overdue = isOverdue(title.dueDate) && title.situation !== "PAID" && title.situation !== "CANCELED";
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {title.hasAdf && (
                            <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" title="Possui ADF vinculado" />
                          )}
                          <span className="font-medium">{title.supplierName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{title.documentNumber}</td>
                      <td className="py-3 px-4">
                        <span className={overdue ? "text-red-600 font-medium" : ""}>
                          {overdue && "● "}{formatDate(title.dueDate)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(title.originalValue)}</td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold">{formatCurrency(title.currentBalance)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTitleSituationColor(title.situation)}`}>
                          {getTitleSituationLabel(title.situation)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {title.situation === "RELEASED" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Pagar" asChild>
                              <Link href={`/pagar/titulos/pagamento?id=${title.id}`}>
                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                              </Link>
                            </Button>
                          )}
                          {title.situation === "PAID" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Estornar" asChild>
                              <Link href={`/pagar/titulos/estorno?id=${title.id}`}>
                                <RotateCcw className="h-3.5 w-3.5 text-yellow-600" />
                              </Link>
                            </Button>
                          )}
                          {title.situation === "RELEASED" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Cancelar">
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
                    <td colSpan={8} className="py-10 text-center text-muted-foreground text-sm">
                      Nenhum título encontrado com os filtros informados.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t bg-muted/30">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-sm text-muted-foreground">
                    {filtered.length} título(s)
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-semibold tabular-nums">
                    {formatCurrency(filtered.reduce((s, t) => s + t.originalValue, 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold tabular-nums">
                    {formatCurrency(filtered.reduce((s, t) => s + t.currentBalance, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
