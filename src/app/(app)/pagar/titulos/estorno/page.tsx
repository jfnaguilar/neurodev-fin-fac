"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

interface PaidTitle {
  id: string;
  documentNumber: string | null;
  paidAt: string | null;
  originalValue: number;
  paymentMethod: string | null;
  supplier: { name: string } | null;
}

const METHOD_LABELS: Record<string, string> = {
  PIX: "PIX", TED: "TED", DOC: "DOC", BANK_SLIP: "Boleto",
  CARD: "Cartão", CASH: "Dinheiro", CHECK: "Cheque",
};

export default function EstornoPagamentoPage() {
  const { data: session } = useSession();
  const [titulos, setTitulos] = useState<PaidTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PaidTitle | null>(null);
  const [motivo, setMotivo] = useState("");
  const [open, setOpen] = useState(false);

  const tenantId = (session?.user as any)?.currentTenantId;

  const fetchTitulos = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/titulos/pagar?tenantId=${tenantId}&situation=PAID&limit=200`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTitulos(json.data ?? []);
    } catch {
      toast({ title: "Erro ao carregar títulos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchTitulos(); }, [fetchTitulos]);

  const filtered = titulos.filter((p) =>
    (p.documentNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEstornar = async () => {
    if (!selected || !motivo.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/titulos/pagar/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: "RELEASED", observation: motivo }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Estorno registrado!", description: `Pagamento ${selected.documentNumber ?? selected.id.slice(0, 8)} estornado.` });
      setOpen(false);
      setSelected(null);
      setMotivo("");
      fetchTitulos();
    } catch {
      toast({ title: "Erro ao registrar estorno", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Número</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Credor</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data Pagamento</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Forma</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{p.documentNumber ?? p.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-medium">{p.supplier?.name ?? "—"}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium">
                        {METHOD_LABELS[p.paymentMethod ?? ""] ?? p.paymentMethod ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-green-700">{formatCurrency(Number(p.originalValue))}</td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setSelected(p); setOpen(true); }}>
                        <RotateCcw className="h-3 w-3 mr-1" />Estornar
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum título pago encontrado.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirmar Estorno</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Título:</span><span className="font-mono">{selected.documentNumber ?? selected.id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Credor:</span><span className="font-medium">{selected.supplier?.name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-bold text-red-600">{formatCurrency(Number(selected.originalValue))}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo do Estorno *</Label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Informe o motivo do estorno..." />
              </div>
              <div className="space-y-1.5">
                <Label>Data do Estorno</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} readOnly />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEstornar} disabled={!motivo.trim() || saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
