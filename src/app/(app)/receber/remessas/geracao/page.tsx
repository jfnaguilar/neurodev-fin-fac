"use client";
import React, { useState } from "react";
import { Send, Download, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockTitulos: { id: string; number: string; customer: string; dueDate: string; value: number }[] = [];

export default function GeracaoRemessaReceberPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [covenant, setCovenant] = useState("");
  const [generated, setGenerated] = useState(false);

  const toggleSelect = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const total = mockTitulos.filter((t) => selected.includes(t.id)).reduce((s, t) => s + t.value, 0);

  const handleGenerate = () => {
    if (!covenant || selected.length === 0) return;
    setGenerated(true);
    toast({ title: "Remessa de cobrança gerada!", description: `${selected.length} boleto(s) incluídos.` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Geração de Remessa — Cobrança</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Remessas › Geração</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Parâmetros</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Convênio *</Label>
                <Select value={covenant} onValueChange={setCovenant}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="341-COB">341 - Itaú (CNAB 400)</SelectItem>
                    <SelectItem value="033-COB">033 - Santander (CNAB 400)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Competência</Label><Input type="month" defaultValue="2026-05" /></div>
              <div className="space-y-1.5"><Label>Vencimento Boleto</Label><Input type="date" defaultValue="2026-05-10" /></div>
            </CardContent>
          </Card>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="h-4 w-4 rounded border-input" checked={selected.length === mockTitulos.length}
                      onChange={(e) => setSelected(e.target.checked ? mockTitulos.map((t) => t.id) : [])} />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mockTitulos.map((t) => (
                  <tr key={t.id} className={`hover:bg-muted/20 cursor-pointer ${selected.includes(t.id) ? "bg-primary/5" : ""}`} onClick={() => toggleSelect(t.id)}>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-4 w-4 rounded border-input" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{t.number}</td>
                    <td className="py-3 px-4">{t.customer}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(t.dueDate)}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">{formatCurrency(t.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Selecionados:</span><span>{selected.length} boleto(s)</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total:</span><span className="font-bold text-green-600">{formatCurrency(total)}</span></div>
              <Button className="w-full" onClick={handleGenerate} disabled={!covenant || selected.length === 0}>
                <Send className="h-3.5 w-3.5 mr-1.5" />Gerar Remessa
              </Button>
            </CardContent>
          </Card>
          {generated && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-4 w-4" /><span className="text-sm font-medium">Remessa gerada!</span></div>
                <p className="text-xs text-green-600">REMESSA_COB_20260510.rem</p>
                <Button variant="outline" size="sm" className="w-full border-green-300 text-green-700"><Download className="h-3.5 w-3.5 mr-1.5" />Baixar</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
