"use client";

import React, { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ratingTypes = [
  { value: "STUDENT", label: "Por Aluno" },
  { value: "CLASS", label: "Por Turma" },
  { value: "TEACHER", label: "Por Professor" },
  { value: "GENERAL", label: "Avulso (Centro de Custo)" },
];

interface RatingLine {
  id: string;
  type: string;
  reference: string;
  value: string;
  percentage: string;
}

export default function RateioManualPage() {
  const [totalValue, setTotalValue] = useState(0);
  const [lines, setLines] = useState<RatingLine[]>([
    { id: "1", type: "GENERAL", reference: "", value: "", percentage: "" },
  ]);

  const addLine = () =>
    setLines((prev) => [...prev, { id: Date.now().toString(), type: "GENERAL", reference: "", value: "", percentage: "" }]);

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  const updateLine = (id: string, field: keyof RatingLine, val: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));

  const totalRated = lines.reduce((s, l) => s + (parseFloat(l.value) || 0), 0);
  const remaining = totalValue - totalRated;
  const isBalanced = Math.abs(remaining) < 0.01;

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Rateio Manual</h1>
        <p className="text-sm text-muted-foreground">Rateio › Rateio Manual</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Título / Lançamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Título / Referência</Label>
              <Input placeholder="Buscar título para ratear..." />
            </div>
            <div className="space-y-1.5">
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Distribuição do Rateio</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-3.5 w-3.5 mr-1" />Adicionar Linha
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground">Total do título:</span>
              <span className="font-bold ml-1.5 tabular-nums">{formatCurrency(totalValue)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rateado:</span>
              <span className="font-bold ml-1.5 tabular-nums">{formatCurrency(totalRated)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Restante:</span>
              <span className={`font-bold ml-1.5 tabular-nums ${remaining !== 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(remaining)}
              </span>
            </div>
            {isBalanced && totalValue > 0 && (
              <Badge className="bg-green-100 text-green-800 ml-auto">Rateio Balanceado</Badge>
            )}
            {!isBalanced && totalValue > 0 && (
              <Badge className="bg-red-100 text-red-800 ml-auto">Rateio com Divergência</Badge>
            )}
          </div>

          <div className="space-y-2">
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-background">
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Critério</Label>
                  <Select value={line.type} onValueChange={(v) => updateLine(line.id, "type", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ratingTypes.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-5 space-y-1">
                  <Label className="text-xs">Referência (Nome/Código)</Label>
                  <Input className="h-8 text-xs" placeholder={line.type === "STUDENT" ? "Nome do aluno..." : line.type === "CLASS" ? "Código da turma..." : "Referência..."} value={line.reference} onChange={(e) => updateLine(line.id, "reference", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input className="h-8 text-xs" type="number" step="0.01" placeholder="0,00" value={line.value} onChange={(e) => updateLine(line.id, "value", e.target.value)} />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">%</Label>
                  <Input className="h-8 text-xs" type="number" step="0.01" placeholder="%" value={line.percentage} readOnly />
                </div>
                <div className="col-span-1">
                  {lines.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeLine(line.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button disabled={!isBalanced || totalValue <= 0}>
          <Save className="h-4 w-4 mr-1.5" />
          Salvar Rateio
        </Button>
      </div>
    </div>
  );
}
