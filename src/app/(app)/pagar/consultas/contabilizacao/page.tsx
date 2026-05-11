"use client";
import React, { useState } from "react";
import { Download, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const mockLancamentos: { id: string; date: string; titleNumber: string; debit: string; credit: string; value: number; costCenter: string; histotico: string }[] = [];

export default function ContabilizacaoPagarPage() {
  const [period, setPeriod] = useState("2026-04");
  const [costCenter, setCostCenter] = useState("ALL");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Contabilização — Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">Contas a Pagar › Consultas › Contabilização</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Exportar</Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-4">
            <div className="space-y-1.5">
              <Label>Competência</Label>
              <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-36" />
            </div>
            <div className="space-y-1.5">
              <Label>Centro de Custo</Label>
              <Select value={costCenter} onValueChange={setCostCenter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ADM">ADM — Administrativo</SelectItem>
                  <SelectItem value="ENG">ENG — Engenharia Civil</SelectItem>
                  <SelectItem value="MED">MED — Medicina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Lançamentos</p><p className="text-2xl font-bold">{mockLancamentos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Débito</p><p className="text-2xl font-bold tabular-nums">{formatCurrency(mockLancamentos.reduce((s, l) => s + l.value, 0))}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Crédito</p><p className="text-2xl font-bold tabular-nums">{formatCurrency(mockLancamentos.reduce((s, l) => s + l.value, 0))}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground w-28">Data</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground w-28">Título</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Débito</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Crédito</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">CC</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockLancamentos.map((l) => (
                <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(l.date)}</td>
                  <td className="py-3 px-4 font-mono text-xs">{l.titleNumber}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{l.debit}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{l.credit}</td>
                  <td className="py-3 px-4 text-center"><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{l.costCenter}</span></td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(l.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
