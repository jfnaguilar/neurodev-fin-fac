"use client";
import React, { useState } from "react";
import { Search, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockTitulos = [
  { id: "1", number: "REC-2025-020", customer: "João Silva", dueDate: "2026-06-05", value: 2800, situation: "RELEASED" },
  { id: "2", number: "REC-2025-021", customer: "Carlos Lima", dueDate: "2026-06-05", value: 1500, situation: "RELEASED" },
  { id: "3", number: "REC-2025-022", customer: "Ana Costa", dueDate: "2026-05-30", value: 1800, situation: "RELEASED" },
];

type Titulo = typeof mockTitulos[0];

export default function CancelamentoTitulosReceberPage() {
  const [titulos, setTitulos] = useState(mockTitulos);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Titulo | null>(null);
  const [motivo, setMotivo] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = titulos.filter((t) =>
    t.number.toLowerCase().includes(search.toLowerCase()) ||
    t.customer.toLowerCase().includes(search.toLowerCase())
  );

  const handleCancelar = () => {
    if (!selected || !motivo) return;
    setTitulos((p) => p.filter((t) => t.id !== selected.id));
    toast({ title: "Título cancelado!", description: `${selected.number} foi cancelado.` });
    setOpen(false); setSelected(null); setMotivo("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Cancelamento de Títulos</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Títulos › Cancelamento</p>
      </div>
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-red-800">Apenas títulos não recebidos podem ser cancelados. A operação é irreversível.</p>
      </div>
      <Card><CardContent className="pt-4 pb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar aluno ou número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Número</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno/Cliente</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
              <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-mono text-xs">{t.number}</td>
                <td className="py-3 px-4 font-medium">{t.customer}</td>
                <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(t.dueDate)}</td>
                <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(t.value)}</td>
                <td className="py-3 px-4 text-center">
                  <Button variant="outline" size="sm" className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50" onClick={() => { setSelected(t); setOpen(true); }}>
                    <XCircle className="h-3 w-3 mr-1" />Cancelar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-destructive">Cancelar Título a Receber</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Título:</span><span className="font-mono">{selected.number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Aluno:</span><span>{selected.customer}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-bold">{formatCurrency(selected.value)}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo do Cancelamento *</Label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Informe o motivo..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={!motivo}>
              <XCircle className="h-3.5 w-3.5 mr-1.5" />Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
