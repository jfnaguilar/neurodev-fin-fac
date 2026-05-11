"use client";
import React, { useState } from "react";
import { Search, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Titulo = { id: string; number: string; supplier: string; dueDate: string; value: number };
const mockTitulos: Titulo[] = [];

export default function AlteraValorPage() {
  const [titulos, setTitulos] = useState(mockTitulos);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Titulo | null>(null);
  const [newValue, setNewValue] = useState("");
  const [motivo, setMotivo] = useState("");

  const filtered = titulos.filter((t) =>
    t.number.toLowerCase().includes(search.toLowerCase()) ||
    t.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!selected || !newValue || !motivo) return;
    const parsedValue = Number(newValue.replace(",", "."));
    setTitulos((prev) => prev.map((t) => t.id === selected.id ? { ...t, value: parsedValue } : t));
    toast({ title: "Valor alterado!", description: `${selected.number}: de ${formatCurrency(selected.value)} para ${formatCurrency(parsedValue)}` });
    setSelected(null);
    setNewValue("");
    setMotivo("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Altera Valor de Título</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Manutenção › Altera Valor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título / Credor</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Atual</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((t) => (
                    <tr key={t.id} className={`hover:bg-muted/20 cursor-pointer transition-colors ${selected?.id === t.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`} onClick={() => { setSelected(t); setNewValue(String(t.value)); }}>
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs">{t.number}</p>
                        <p className="text-muted-foreground text-xs">{t.supplier}</p>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(t.dueDate)}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(t.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div>
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Alterar Valor — {selected.number}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Credor:</span><span>{selected.supplier}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor atual:</span><span className="font-bold">{formatCurrency(selected.value)}</span></div>
                </div>
                <div className="space-y-1.5">
                  <Label>Novo Valor (R$) *</Label>
                  <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="0,00" className="tabular-nums" />
                  {newValue && (
                    <p className="text-xs text-muted-foreground">
                      Diferença: {formatCurrency(Number(newValue.replace(",", ".")) - selected.value)}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Motivo da Alteração *</Label>
                  <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Justifique a alteração de valor..." />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={handleSave} disabled={!newValue || !motivo}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button>
                  <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">Selecione um título para alterar seu valor.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
