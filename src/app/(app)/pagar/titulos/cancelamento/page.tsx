"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

interface PaymentTitle {
  id: string;
  documentNumber: string | null;
  dueDate: string;
  currentBalance: number;
  situation: string;
  supplier: { name: string } | null;
}

const situationColors: Record<string, string> = {
  RELEASED: "bg-blue-50 text-blue-700",
  PENDING_APPROVAL: "bg-yellow-50 text-yellow-700",
  OVERDUE: "bg-red-50 text-red-700",
};
const situationLabels: Record<string, string> = {
  RELEASED: "Liberado",
  PENDING_APPROVAL: "Pend. Aprovação",
  OVERDUE: "Vencido",
};

export default function CancelamentoTitulosPage() {
  const { data: session } = useSession();
  const [titulos, setTitulos] = useState<PaymentTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [situacao, setSituacao] = useState("ALL");
  const [selected, setSelected] = useState<PaymentTitle | null>(null);
  const [motivo, setMotivo] = useState("");
  const [open, setOpen] = useState(false);

  const tenantId = (session?.user as any)?.currentTenantId;

  const fetchTitulos = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/titulos/pagar?tenantId=${tenantId}&limit=200`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const cancelable = (json.data ?? []).filter((t: PaymentTitle) =>
        ["RELEASED", "OVERDUE", "PENDING_APPROVAL"].includes(t.situation)
      );
      setTitulos(cancelable);
    } catch {
      toast({ title: "Erro ao carregar títulos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchTitulos(); }, [fetchTitulos]);

  const filtered = titulos.filter((t) => {
    const matchesSit = situacao === "ALL" || t.situation === situacao;
    const matchesSearch =
      (t.documentNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.supplier?.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesSit && matchesSearch;
  });

  const handleCancelar = async () => {
    if (!selected || !motivo.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/titulos/pagar/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: "CANCELED", observation: motivo }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Título cancelado!", description: `${selected.documentNumber ?? selected.id.slice(0, 8)} foi cancelado.` });
      setOpen(false);
      setSelected(null);
      setMotivo("");
      fetchTitulos();
    } catch {
      toast({ title: "Erro ao cancelar título", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Cancelamento de Títulos</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Títulos › Cancelamento</p>
      </div>
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-red-800">O cancelamento é irreversível. Títulos já pagos não podem ser cancelados — utilize o Estorno de Pagamento.</p>
      </div>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar título ou credor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={situacao} onValueChange={setSituacao}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os títulos</SelectItem>
                <SelectItem value="RELEASED">Liberados</SelectItem>
                <SelectItem value="OVERDUE">Vencidos</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pend. Aprovação</SelectItem>
              </SelectContent>
            </Select>
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
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Saldo</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{t.documentNumber ?? t.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-medium">{t.supplier?.name ?? "—"}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(t.dueDate)}</td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(Number(t.currentBalance))}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${situationColors[t.situation] ?? "bg-gray-100 text-gray-500"}`}>
                        {situationLabels[t.situation] ?? t.situation}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="outline" size="sm" className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => { setSelected(t); setOpen(true); }}>
                        <XCircle className="h-3 w-3 mr-1" />Cancelar
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum título disponível para cancelamento.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-destructive">Cancelar Título</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Título:</span><span className="font-mono">{selected.documentNumber ?? selected.id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Credor:</span><span className="font-medium">{selected.supplier?.name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Saldo:</span><span className="font-bold">{formatCurrency(Number(selected.currentBalance))}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo do Cancelamento *</Label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Informe o motivo..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={!motivo.trim() || saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
