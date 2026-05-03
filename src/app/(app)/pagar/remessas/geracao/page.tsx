"use client";
import React, { useState } from "react";
import { Send, Download, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockTitulos = [
  { id: "1", number: "PAG-2025-001", supplier: "Fornecedor ABC Ltda", dueDate: "2026-05-05", value: 45000, bank: "341 - Itaú" },
  { id: "2", number: "PAG-2025-003", supplier: "Manutenção Predial", dueDate: "2026-05-10", value: 18000, bank: "001 - Banco do Brasil" },
  { id: "3", number: "PAG-2025-004", supplier: "Software TI Sistemas", dueDate: "2026-05-15", value: 12000, bank: "341 - Itaú" },
];

export default function GeracaoRemessaPagarPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [covenant, setCovenant] = useState("");
  const [generated, setGenerated] = useState(false);

  const toggleSelect = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const total = mockTitulos.filter((t) => selected.includes(t.id)).reduce((s, t) => s + t.value, 0);

  const handleGenerate = () => {
    if (selected.length === 0 || !covenant) return;
    setGenerated(true);
    toast({ title: "Remessa gerada!", description: `Arquivo CNAB gerado com ${selected.length} título(s).` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Geração de Remessa — Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Remessas › Geração</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Parâmetros da Remessa</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Convênio Bancário *</Label>
                <Select value={covenant} onValueChange={setCovenant}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="001-PAG">001 - Banco do Brasil (CNAB 240)</SelectItem>
                    <SelectItem value="341-PAG">341 - Itaú (CNAB 240)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Competência</Label>
                <Input type="month" defaultValue="2026-05" />
              </div>
              <div className="space-y-1.5">
                <Label>Data Pagamento</Label>
                <Input type="date" defaultValue="2026-05-05" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input type="checkbox" className="h-4 w-4 rounded border-input" checked={selected.length === mockTitulos.length}
                        onChange={(e) => setSelected(e.target.checked ? mockTitulos.map((t) => t.id) : [])} />
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Credor</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Banco</th>
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
                      <td className="py-3 px-4">{t.supplier}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(t.dueDate)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{t.bank}</td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium">{formatCurrency(t.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Selecionados:</span><span className="font-medium">{selected.length} título(s)</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total:</span><span className="font-bold text-primary">{formatCurrency(total)}</span></div>
              <Button className="w-full" onClick={handleGenerate} disabled={selected.length === 0 || !covenant}>
                <Send className="h-3.5 w-3.5 mr-1.5" />Gerar Remessa
              </Button>
            </CardContent>
          </Card>
          {generated && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Remessa gerada!</span>
                </div>
                <p className="text-xs text-green-600">REMESSA_PAG_20260505.txt</p>
                <Button variant="outline" size="sm" className="w-full border-green-300 text-green-700">
                  <Download className="h-3.5 w-3.5 mr-1.5" />Baixar Arquivo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
