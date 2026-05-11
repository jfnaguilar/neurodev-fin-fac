"use client";
import React, { useState } from "react";
import { Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockPreview: { id: string; titulo: string; aluno: string; valor: number; centroCusto: string; percentual: number; valorRateado: number }[] = [];

export default function RateioAutomaticoPage() {
  const [periodo, setPeriodo] = useState("2026-05");
  const [tipo, setTipo] = useState("ALL");
  const [previewed, setPreviewed] = useState(false);
  const [processed, setProcessed] = useState(false);

  const handlePreview = () => setPreviewed(true);

  const handleProcess = () => {
    setProcessed(true);
    toast({ title: "Rateio automático executado!", description: `${mockPreview.length} lançamentos gerados.` });
  };

  const totalRateado = mockPreview.reduce((s, r) => s + r.valorRateado, 0);
  const semCriterio = 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Rateio Automático</h1>
        <p className="text-sm text-muted-foreground">Rateio › Rateio Automático</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Parâmetros de Execução</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Competência *</Label><Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Tipo de Título</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="REC">Contas a Receber</SelectItem>
                  <SelectItem value="PAG">Contas a Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Critério Prioritário</Label>
              <Select defaultValue="ALUNO">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALUNO">Por Aluno</SelectItem>
                  <SelectItem value="TURMA">Por Turma</SelectItem>
                  <SelectItem value="PROFESSOR">Por Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePreview}><AlertCircle className="h-3.5 w-3.5 mr-1.5" />Pré-visualizar</Button>
            <Button onClick={handleProcess} disabled={!previewed}><Play className="h-3.5 w-3.5 mr-1.5" />Executar Rateio</Button>
          </div>
        </CardContent>
      </Card>
      {previewed && (
        <>
          {processed && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Rateio executado com sucesso! {mockPreview.length} lançamentos gerados para competência {periodo}.</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{new Set(mockPreview.map((r) => r.titulo)).size}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Títulos Rateados</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRateado)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Rateado</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{semCriterio}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sem Critério</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Pré-visualização do Rateio</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno</th>
                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Título</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Centro de Custo</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">%</th>
                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Rateado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockPreview.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{r.titulo}</td>
                      <td className="py-3 px-4 text-xs">{r.aluno}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">{formatCurrency(r.valor)}</td>
                      <td className="py-3 px-4 text-xs">{r.centroCusto}</td>
                      <td className="py-3 px-4 text-center font-semibold">{r.percentual}%</td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold">{formatCurrency(r.valorRateado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
