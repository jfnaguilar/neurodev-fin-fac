"use client";
import React, { useState } from "react";
import { Search, RotateCcw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockPagos = [
  { id: "1", number: "PAG-2025-010", supplier: "Tech Solutions S.A.", paymentDate: "2026-04-30", value: 12000, paymentMethod: "PIX", bank: "341 - Itaú" },
  { id: "2", number: "PAG-2025-009", supplier: "Fornecedor ABC Ltda", paymentDate: "2026-04-28", value: 45000, paymentMethod: "TED", bank: "001 - Banco do Brasil" },
  { id: "3", number: "PAG-2025-008", supplier: "Manutenção Predial", paymentDate: "2026-04-25", value: 18000, paymentMethod: "PIX", bank: "341 - Itaú" },
];

type Pago = typeof mockPagos[0];

export default function EstornoPagamentoPage() {
  const [pagos, setPagos] = useState(mockPagos);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Pago | null>(null);
  const [motivo, setMotivo] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = pagos.filter((p) =>
    p.number.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const handleEstornar = () => {
    if (!selected || !motivo.trim()) return;
    setPagos((prev) => prev.filter((p) => p.id !== selected.id));
    setOpen(false);
    setSelected(null);
    setMotivo("");
    toast({ title: "Estorno registrado!", description: `Pagamento ${selected.number} estornado com sucesso.` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Estorno de Pagamento</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Títulos › Estorno</p>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
        <p className="text-sm text-yellow-800">O estorno de pagamento só pode ser feito em títulos pagos. A operação requer justificativa e gera registro no log de auditoria.</p>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar título pago..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Número</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Credor</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data Pagamento</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Forma</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Banco</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Pago</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{p.number}</td>
                  <td className="py-3 px-4 font-medium">{p.supplier}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(p.paymentDate)}</td>
                  <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium">{p.paymentMethod}</span></td>
                  <td className="py-3 px-4 text-muted-foreground">{p.bank}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums text-green-700">{formatCurrency(p.value)}</td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setSelected(p); setOpen(true); }}>
                      <RotateCcw className="h-3 w-3 mr-1" />Estornar
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum título pago encontrado.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirmar Estorno</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Título:</span><span className="font-mono">{selected.number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Credor:</span><span className="font-medium">{selected.supplier}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-bold text-red-600">{formatCurrency(selected.value)}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo do Estorno *</Label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Informe o motivo do estorno..." />
              </div>
              <div className="space-y-1.5">
                <Label>Data do Estorno</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEstornar} disabled={!motivo.trim()}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
