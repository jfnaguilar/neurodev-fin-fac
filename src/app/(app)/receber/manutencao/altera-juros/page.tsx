"use client";
import React, { useState } from "react";
import { Search, Save, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Titulo = { id: string; number: string; customer: string; dueDate: string; value: number; juros: number; multa: number; desconto: number };
const mockTitulos: Titulo[] = [];

export default function AlteraJurosReceberPage() {
  const [titulos, setTitulos] = useState(mockTitulos);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Titulo | null>(null);
  const [juros, setJuros] = useState("");
  const [multa, setMulta] = useState("");
  const [desconto, setDesconto] = useState("");
  const [motivo, setMotivo] = useState("");

  const filtered = titulos.filter((t) =>
    t.number.toLowerCase().includes(search.toLowerCase()) ||
    t.customer.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!selected) return;
    setTitulos((prev) => prev.map((t) => t.id === selected.id
      ? { ...t, juros: Number(juros) || 0, multa: Number(multa) || 0, desconto: Number(desconto) || 0 }
      : t
    ));
    toast({ title: "Juros/Multa/Desconto alterados!", description: `${selected.number} atualizado.` });
    setSelected(null);
    setMotivo("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Altera Juros / Multa / Desconto</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Manutenção › Altera Juros</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Card><CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Principal</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Juros</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => (
                  <tr key={t.id} className={`hover:bg-muted/20 cursor-pointer ${selected?.id === t.id ? "bg-primary/5" : ""}`} onClick={() => { setSelected(t); setJuros(String(t.juros)); setMulta(String(t.multa)); setDesconto(String(t.desconto)); }}>
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs">{t.number}</p>
                      <p className="text-xs text-muted-foreground">{t.customer}</p>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(t.value)}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-red-600">{formatCurrency(t.juros)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </div>
        <div>
          {selected ? (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Juros/Multa — {selected.number}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Devedor:</span><span>{selected.customer}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Principal:</span><span className="font-bold">{formatCurrency(selected.value)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Vencimento:</span><span>{formatDate(selected.dueDate)}</span></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label>Juros (R$)</Label><Input value={juros} onChange={(e) => setJuros(e.target.value)} placeholder="0,00" /></div>
                  <div className="space-y-1.5"><Label>Multa (R$)</Label><Input value={multa} onChange={(e) => setMulta(e.target.value)} placeholder="0,00" /></div>
                  <div className="space-y-1.5"><Label>Desconto (R$)</Label><Input value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="0,00" /></div>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>Total a Receber:</span>
                    <span className="text-green-600">{formatCurrency(selected.value + Number(juros || 0) + Number(multa || 0) - Number(desconto || 0))}</span>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Motivo *</Label><Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Justificativa..." /></div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={handleSave} disabled={!motivo}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button>
                  <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="flex items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">Selecione um título para alterar juros/multa/desconto.</p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
