"use client";
import React, { useState } from "react";
import { Send, Download, CheckCircle2, FileCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockBoletos: { id: string; number: string; customer: string; dueDate: string; value: number; nossoNumero: string }[] = [];

function downloadArquivoCNAB240Cob(linhas: number, filename: string) {
  const pad = (s: string) => s.padEnd(240, " ").substring(0, 240);
  const rows = [
    pad(`0REMESSA341FACULDADE NEURODEV LTDA`),
    pad(`10001LOTE001COB`),
    ...Array.from({ length: linhas }, (_, i) => pad(`3${String(i + 1).padStart(5, "0")}P001`)),
    ...Array.from({ length: linhas }, (_, i) => pad(`3${String(i + 1 + linhas).padStart(5, "0")}Q001`)),
    pad(`50001${String(linhas * 2 + 2).padStart(6, "0")}`),
    pad(`9${String(linhas * 2 + 4).padStart(6, "0")}`),
  ];
  const blob = new Blob([rows.join("\r\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function Cnab240CobPage() {
  const [covenant, setCovenant] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  const toggleSelect = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const total = mockBoletos.filter((b) => selected.includes(b.id)).reduce((s, b) => s + b.value, 0);

  const handleGenerate = () => {
    if (!covenant || selected.length === 0) return;
    setGenerated(true);
    toast({ title: "Remessa CNAB 240 Cobrança gerada!", description: `${selected.length} boleto(s) incluídos.` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Remessa CNAB 240 — Cobrança</h1>
        <p className="text-sm text-muted-foreground">Integrações Bancárias › Remessa › CNAB 240 Cobrança</p>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-sm text-indigo-800">
        <FileCode className="h-4 w-4 shrink-0" />
        <span>Gera arquivo no padrão <strong>CNAB 240</strong> para cobrança bancária (boletos e débito automático). Compatível com Itaú, CEF e BB.</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Parâmetros</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Convênio *</Label>
                <Select value={covenant} onValueChange={setCovenant}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="341-COB240">341 — Itaú (CNAB 240)</SelectItem>
                    <SelectItem value="104-COB240">104 — CEF (CNAB 240)</SelectItem>
                    <SelectItem value="001-COB240">001 — BB (CNAB 240)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Competência</Label><Input type="month" defaultValue="2026-05" /></div>
              <div className="space-y-1.5">
                <Label>Modalidade</Label>
                <Select defaultValue="BOL">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOL">Boleto Simples</SelectItem>
                    <SelectItem value="DEB">Débito Automático</SelectItem>
                    <SelectItem value="CHQ">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="h-4 w-4 rounded border-input"
                      checked={selected.length === mockBoletos.length}
                      onChange={(e) => setSelected(e.target.checked ? mockBoletos.map((b) => b.id) : [])} />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nosso Número</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Venc.</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mockBoletos.map((b) => (
                  <tr key={b.id} className={`hover:bg-muted/20 cursor-pointer ${selected.includes(b.id) ? "bg-primary/5" : ""}`} onClick={() => toggleSelect(b.id)}>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-4 w-4 rounded border-input" checked={selected.includes(b.id)} onChange={() => toggleSelect(b.id)} />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{b.number}</td>
                    <td className="py-3 px-4 text-xs">{b.customer}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{b.nossoNumero}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground text-xs">{formatDate(b.dueDate)}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">{formatCurrency(b.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Boletos:</span><span>{selected.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total:</span><span className="font-bold text-green-600">{formatCurrency(total)}</span></div>
              <Button className="w-full" onClick={handleGenerate} disabled={!covenant || selected.length === 0}>
                <Send className="h-3.5 w-3.5 mr-1.5" />Gerar Remessa
              </Button>
            </CardContent>
          </Card>
          {generated && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-4 w-4" /><span className="text-sm font-medium">Arquivo gerado!</span></div>
                <p className="text-xs text-green-600 font-mono">COB_241_20260510.rem</p>
                <div className="text-xs text-green-700 space-y-0.5">
                  <div className="flex justify-between"><span>Segmento P:</span><span>{selected.length} registro(s)</span></div>
                  <div className="flex justify-between"><span>Segmento Q:</span><span>{selected.length} registro(s)</span></div>
                  <div className="flex justify-between font-medium mt-1"><span>Total bytes:</span><span>{(selected.length * 2 + 4) * 240}</span></div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-green-300 text-green-700"><Download className="h-3.5 w-3.5 mr-1.5" />Baixar</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
