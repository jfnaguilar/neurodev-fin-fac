"use client";
import React, { useState } from "react";
import { Search, RotateCcw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockRecebidos = [
  { id: "1", number: "REC-2025-010", customer: "João Silva", receiptDate: "2026-04-30", value: 2800, paymentMethod: "PIX" },
  { id: "2", number: "REC-2025-009", customer: "Maria Oliveira", receiptDate: "2026-04-28", value: 4500, paymentMethod: "Boleto" },
  { id: "3", number: "REC-2025-008", customer: "Pedro Santos", receiptDate: "2026-04-25", value: 2200, paymentMethod: "PIX" },
];

type Recebido = typeof mockRecebidos[0];

export default function EstornoRecebimentoPage() {
  const [recebidos, setRecebidos] = useState(mockRecebidos);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Recebido | null>(null);
  const [motivo, setMotivo] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = recebidos.filter((r) =>
    r.number.toLowerCase().includes(search.toLowerCase()) ||
    r.customer.toLowerCase().includes(search.toLowerCase())
  );

  const handleEstorno = () => {
    if (!selected || !motivo) return;
    setRecebidos((p) => p.filter((r) => r.id !== selected.id));
    toast({ title: "Estorno registrado!", description: `Recebimento ${selected.number} estornado.` });
    setOpen(false);
    setSelected(null);
    setMotivo("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Estorno de Recebimento</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Títulos › Estorno</p>
      </div>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
        <p className="text-sm text-yellow-800">O estorno desfaz o recebimento registrado. O título volta para a situação Liberado e o valor não é devolvido automaticamente.</p>
      </div>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar aluno ou número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Número</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno/Cliente</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data Recebimento</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Forma</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{r.number}</td>
                  <td className="py-3 px-4 font-medium">{r.customer}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(r.receiptDate)}</td>
                  <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs">{r.paymentMethod}</span></td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums text-green-700">{formatCurrency(r.value)}</td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setSelected(r); setOpen(true); }}>
                      <RotateCcw className="h-3 w-3 mr-1" />Estornar
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum recebimento encontrado.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirmar Estorno de Recebimento</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Título:</span><span className="font-mono">{selected.number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Aluno:</span><span>{selected.customer}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-bold text-green-600">{formatCurrency(selected.value)}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo do Estorno *</Label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Informe o motivo..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEstorno} disabled={!motivo}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
