"use client";
import React, { useState } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockAcertos = [
  { id: "1", adfNumber: "ADF-2025-001", titleNumber: "PAG-2025-030", supplier: "Fornecedor ABC Ltda", date: "2026-04-20", value: 12000 },
  { id: "2", adfNumber: "ADF-2025-002", titleNumber: "PAG-2025-031", supplier: "Tech Solutions S.A.", date: "2026-04-22", value: 3000 },
];

type Acerto = typeof mockAcertos[0];

export default function EstornoAcertoADFPage() {
  const [acertos, setAcertos] = useState(mockAcertos);
  const [selected, setSelected] = useState<Acerto | null>(null);
  const [motivo, setMotivo] = useState("");
  const [open, setOpen] = useState(false);

  const handleEstorno = () => {
    if (!selected || !motivo) return;
    setAcertos((p) => p.filter((a) => a.id !== selected.id));
    toast({ title: "Estorno do acerto realizado!", description: `Acerto ${selected.adfNumber} estornado.` });
    setOpen(false);
    setSelected(null);
    setMotivo("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Estorno Acerto ADF</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Adiantamento a Fornecedor › Estorno de Acerto</p>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
        <p className="text-sm text-yellow-800">O estorno desfaz o acerto realizado, restituindo o saldo ao ADF. Requer justificativa obrigatória.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">ADF</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título Acertado</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Fornecedor</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data Acerto</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {acertos.map((a) => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{a.adfNumber}</td>
                  <td className="py-3 px-4 font-mono text-xs">{a.titleNumber}</td>
                  <td className="py-3 px-4">{a.supplier}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(a.date)}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(a.value)}</td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setSelected(a); setOpen(true); }}>
                      <RotateCcw className="h-3 w-3 mr-1" />Estornar
                    </Button>
                  </td>
                </tr>
              ))}
              {acertos.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum acerto disponível para estorno.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirmar Estorno de Acerto</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">ADF:</span><span className="font-mono">{selected.adfNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Título:</span><span className="font-mono">{selected.titleNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-bold">{formatCurrency(selected.value)}</span></div>
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
