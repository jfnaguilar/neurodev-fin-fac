"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface PaymentTitle {
  id: string;
  documentNumber: string | null;
  dueDate: string;
  originalValue: number;
  currentBalance: number;
  situation: string;
  paymentMethod: string | null;
  supplier: { id: string; name: string; document: string | null } | null;
  installments: { number: number; dueDate: string; value: number; situation: string }[];
}

const paymentMethods = [
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "DOC", label: "DOC" },
  { value: "CHECK", label: "Cheque" },
  { value: "BANK_SLIP", label: "Boleto" },
];

const situationFilter: Record<string, string[]> = {
  ALL: ["RELEASED", "OVERDUE"],
  RELEASED: ["RELEASED"],
  OVERDUE: ["OVERDUE"],
};

export default function PagamentoTitulosPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("id");

  const [titulos, setTitulos] = useState<PaymentTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [situacao, setSituacao] = useState("ALL");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [observation, setObservation] = useState("");

  const tenantId = (session?.user as any)?.currentTenantId;

  const fetchTitulos = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/titulos/pagar?tenantId=${tenantId}&situation=ALL&limit=200`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const payable = (json.data ?? []).filter((t: PaymentTitle) =>
        ["RELEASED", "OVERDUE"].includes(t.situation)
      );
      setTitulos(payable);
      if (preselectedId) {
        const found = payable.find((t: PaymentTitle) => t.id === preselectedId);
        if (found) setSelected([preselectedId]);
      }
    } catch {
      toast({ title: "Erro ao carregar títulos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tenantId, preselectedId]);

  useEffect(() => { fetchTitulos(); }, [fetchTitulos]);

  const filtered = titulos.filter((t) => {
    const matchesSit = situationFilter[situacao]?.includes(t.situation);
    const matchesSearch =
      (t.documentNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.supplier?.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesSit && matchesSearch;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectedItems = titulos.filter((t) => selected.includes(t.id));
  const totalSelected = selectedItems.reduce((sum, t) => sum + Number(t.currentBalance), 0);

  const handlePagar = async () => {
    if (!selectedItems.length) return;
    setSaving(true);
    try {
      await Promise.all(
        selectedItems.map((t) =>
          fetch(`/api/titulos/pagar/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ situation: "PAID", paymentDate, paymentMethod, observation }),
          })
        )
      );
      toast({ title: "Pagamentos registrados!", description: `${selectedItems.length} título(s) pago(s).` });
      setSelected([]);
      setObservation("");
      setOpenConfirm(false);
      fetchTitulos();
    } catch {
      toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pagamento de Títulos</h1>
          <p className="text-sm text-muted-foreground">Contas a Pagar › Títulos › Pagamento</p>
        </div>
        <Button size="sm" disabled={selected.length === 0} onClick={() => setOpenConfirm(true)}>
          <DollarSign className="h-3.5 w-3.5 mr-1.5" />Pagar Selecionados ({selected.length})
        </Button>
      </div>

      {selected.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm font-medium">{selected.length} título(s) selecionado(s)</span>
            <span className="font-bold text-primary">{formatCurrency(totalSelected)}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar título ou credor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={situacao} onValueChange={setSituacao}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os títulos</SelectItem>
                <SelectItem value="RELEASED">Liberados</SelectItem>
                <SelectItem value="OVERDUE">Vencidos</SelectItem>
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
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="h-4 w-4 rounded border-input"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={(e) => setSelected(e.target.checked ? filtered.map((t) => t.id) : [])} />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Número</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Credor</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Parcela</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Saldo</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => {
                  const inst = t.installments[0];
                  const parcela = inst ? `${inst.number}/${t.installments.length}` : "—";
                  return (
                    <tr key={t.id}
                      className={`hover:bg-muted/20 transition-colors cursor-pointer ${selected.includes(t.id) ? "bg-primary/5" : ""}`}
                      onClick={() => toggleSelect(t.id)}>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="h-4 w-4 rounded border-input"
                          checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{t.documentNumber ?? t.id.slice(0, 8)}</td>
                      <td className="py-3 px-4 font-medium">{t.supplier?.name ?? "—"}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{parcela}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={t.situation === "OVERDUE" ? "text-red-600 font-medium" : "text-muted-foreground"}>
                          {formatDate(t.dueDate)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(Number(t.currentBalance))}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.situation === "OVERDUE" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                          {t.situation === "OVERDUE" ? "Vencido" : "Liberado"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum título disponível para pagamento.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirmar Pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-medium">Resumo do Pagamento</p>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Títulos selecionados:</span><span className="font-medium">{selected.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total a pagar:</span><span className="font-bold text-primary">{formatCurrency(totalSelected)}</span></div>
            </div>
            <div className="space-y-1.5">
              <Label>Data do Pagamento</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Input placeholder="Observação sobre o pagamento (opcional)..." value={observation} onChange={(e) => setObservation(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirm(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handlePagar} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
