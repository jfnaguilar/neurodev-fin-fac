"use client";
import React, { useState } from "react";
import { Search, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockTitulos = [
  { id: "1", number: "PAG-2025-001", supplier: "Fornecedor ABC Ltda", dueDate: "2026-05-05", value: 45000 },
  { id: "2", number: "PAG-2025-002", supplier: "Editora Saraiva S.A.", dueDate: "2026-05-01", value: 28500 },
  { id: "3", number: "PAG-2025-003", supplier: "Manutenção Predial", dueDate: "2026-05-10", value: 18000 },
  { id: "4", number: "PAG-2025-004", supplier: "Software TI Sistemas", dueDate: "2026-05-15", value: 12000 },
  { id: "5", number: "PAG-2025-006", supplier: "Gráfica Impressos ME", dueDate: "2026-05-20", value: 4200 },
];

export default function AlteraVencimentoPage() {
  const [titulos, setTitulos] = useState(mockTitulos);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState("DATA_FIXA");
  const [newDate, setNewDate] = useState("");
  const [days, setDays] = useState("");
  const [motivo, setMotivo] = useState("");

  const filtered = titulos.filter((t) =>
    t.number.toLowerCase().includes(search.toLowerCase()) ||
    t.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleApply = () => {
    if (selected.length === 0) return;
    toast({ title: "Vencimento alterado!", description: `${selected.length} título(s) atualizado(s).` });
    setSelected([]);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Altera Vencimento em Massa</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Manutenção › Altera Vencimento</p>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4 space-y-4">
          <p className="text-sm font-medium">Configuração da Alteração</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de Alteração</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DATA_FIXA">Data Fixa</SelectItem>
                  <SelectItem value="ADIAR_DIAS">Adiar N dias</SelectItem>
                  <SelectItem value="ANTECIPAR_DIAS">Antecipar N dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "DATA_FIXA" ? (
              <div className="space-y-1.5">
                <Label>Nova Data de Vencimento</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Número de Dias</Label>
                <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Ex: 15" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Justificativa..." />
            </div>
          </div>
          <Button onClick={handleApply} disabled={selected.length === 0}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Aplicar nos Selecionados ({selected.length})
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar título ou credor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento Atual</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id} className={`hover:bg-muted/20 cursor-pointer transition-colors ${selected.includes(t.id) ? "bg-primary/5" : ""}`} onClick={() => toggleSelect(t.id)}>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="h-4 w-4 rounded border-input" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{t.number}</td>
                  <td className="py-3 px-4 font-medium">{t.supplier}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />{formatDate(t.dueDate)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(t.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
