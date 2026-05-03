"use client";
import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const mockEntries = [
  { id: "1", date: "2026-05-02", doc: "REC-2025-001", description: "Mensalidade — João Silva / Eng. Civil", debit: "1.1.1 — Contas a Receber", credit: "4.1.1 — Receita de Mensalidades", value: 2800 },
  { id: "2", date: "2026-05-02", doc: "REC-2025-002", description: "Mensalidade — Maria Oliveira / Medicina", debit: "1.1.1 — Contas a Receber", credit: "4.1.1 — Receita de Mensalidades", value: 4500 },
  { id: "3", date: "2026-05-02", doc: "REC-BAIXA-001", description: "Baixa recebimento — João Silva", debit: "1.1.2 — Banco Itaú", credit: "1.1.1 — Contas a Receber", value: 2800 },
  { id: "4", date: "2026-05-02", doc: "REC-BAIXA-002", description: "Baixa recebimento — Maria Oliveira", debit: "1.1.2 — Banco Itaú", credit: "1.1.1 — Contas a Receber", value: 4500 },
  { id: "5", date: "2026-04-05", doc: "REC-2025-003", description: "Mensalidade — Pedro Santos / Direito", debit: "1.1.1 — Contas a Receber", credit: "4.1.1 — Receita de Mensalidades", value: 2200 },
];

export default function ContabilizacaoReceberPage() {
  const [dateFrom, setDateFrom] = useState("2026-05-01");
  const [dateTo, setDateTo] = useState("2026-05-31");
  const [account, setAccount] = useState("ALL");

  const totalDebit = mockEntries.reduce((s, e) => s + e.value, 0);
  const totalCredit = mockEntries.reduce((s, e) => s + e.value, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Contabilização — Contas a Receber</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Consultas › Contabilização</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5"><Label>Data Inicial</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Data Final</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Conta</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="1.1.1">1.1.1 — Contas a Receber</SelectItem>
                <SelectItem value="1.1.2">1.1.2 — Banco Itaú</SelectItem>
                <SelectItem value="4.1.1">4.1.1 — Receita de Mensalidades</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full"><Download className="h-3.5 w-3.5 mr-1.5" />Exportar</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Lançamentos</p>
          <p className="text-2xl font-bold">{mockEntries.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Débito</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDebit)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Crédito</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCredit)}</p>
        </CardContent></Card>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Documento</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Descrição</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Débito</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Crédito</th>
              <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockEntries.map((e) => (
              <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-center text-muted-foreground text-xs">{formatDate(e.date)}</td>
                <td className="py-3 px-4 font-mono text-xs">{e.doc}</td>
                <td className="py-3 px-4 text-xs">{e.description}</td>
                <td className="py-3 px-4 text-xs text-blue-700">{e.debit}</td>
                <td className="py-3 px-4 text-xs text-green-700">{e.credit}</td>
                <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(e.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t px-4 py-3 flex gap-6 justify-end text-sm">
          <span className="text-muted-foreground">{mockEntries.length} lançamento(s)</span>
          <span className="font-semibold">{formatCurrency(totalDebit)}</span>
        </div>
      </CardContent></Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Relatórios</CardTitle></CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          {["Razão — Contas a Receber", "Diário de Recebimentos", "Balancete Analítico", "Posição por Conta"].map((r) => (
            <Button key={r} variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />{r}</Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
