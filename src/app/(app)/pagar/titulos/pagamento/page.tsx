"use client";
import React, { useState } from "react";
import { Search, CheckCircle2, DollarSign, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockTitulos = [
  { id: "1", number: "PAG-2025-001", supplier: "Fornecedor ABC Ltda", dueDate: "2026-05-05", value: 45000, parcela: "1/1", situation: "RELEASED" },
  { id: "2", number: "PAG-2025-002", supplier: "Editora Saraiva S.A.", dueDate: "2026-05-01", value: 28500, parcela: "2/3", situation: "OVERDUE" },
  { id: "3", number: "PAG-2025-003", supplier: "Manutenção Predial", dueDate: "2026-05-10", value: 18000, parcela: "1/1", situation: "RELEASED" },
  { id: "4", number: "PAG-2025-004", supplier: "Software TI Sistemas", dueDate: "2026-05-15", value: 12000, parcela: "1/2", situation: "RELEASED" },
  { id: "5", number: "PAG-2025-005", supplier: "Gráfica Impressos ME", dueDate: "2026-04-28", value: 8500, parcela: "3/3", situation: "OVERDUE" },
];

const paymentMethods = [
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "DOC", label: "DOC" },
  { value: "CHECK", label: "Cheque" },
  { value: "BANK_SLIP", label: "Boleto" },
];

export default function PagamentoTitulosPage() {
  const [titulos, setTitulos] = useState(mockTitulos);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");

  const filtered = titulos.filter((t) =>
    t.number.toLowerCase().includes(search.toLowerCase()) ||
    t.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectedItems = titulos.filter((t) => selected.includes(t.id));
  const totalSelected = selectedItems.reduce((sum, t) => sum + t.value, 0);

  const handlePagar = () => {
    setTitulos((prev) => prev.filter((t) => !selected.includes(t.id)));
    setSelected([]);
    setOpenConfirm(false);
    toast({ title: "Pagamentos registrados com sucesso!", description: `${selectedItems.length} título(s) pagos.` });
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
            <Select defaultValue="ALL">
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
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="h-4 w-4 rounded border-input" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? filtered.map((t) => t.id) : [])} />
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Número</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Credor</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Parcela</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id} className={`hover:bg-muted/20 transition-colors cursor-pointer ${selected.includes(t.id) ? "bg-primary/5" : ""}`} onClick={() => toggleSelect(t.id)}>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="h-4 w-4 rounded border-input" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{t.number}</td>
                  <td className="py-3 px-4 font-medium">{t.supplier}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{t.parcela}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={t.situation === "OVERDUE" ? "text-red-600 font-medium" : "text-muted-foreground"}>{formatDate(t.dueDate)}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(t.value)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.situation === "OVERDUE" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                      {t.situation === "OVERDUE" ? "Vencido" : "Liberado"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum título disponível para pagamento.</td></tr>}
            </tbody>
          </table>
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
              <Input placeholder="Observação sobre o pagamento (opcional)..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirm(false)}>Cancelar</Button>
            <Button onClick={handlePagar}><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
