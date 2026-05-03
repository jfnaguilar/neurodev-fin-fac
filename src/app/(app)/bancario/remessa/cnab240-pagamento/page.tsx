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

const mockTitulos = [
  { id: "1", number: "PAG-2025-010", supplier: "TechSupply Ltda", dueDate: "2026-05-10", value: 4800, type: "TED", docType: "DM" },
  { id: "2", number: "PAG-2025-011", supplier: "Manutenção Pro", dueDate: "2026-05-10", value: 2300, type: "PIX", docType: "NF" },
  { id: "3", number: "PAG-2025-012", supplier: "Serviços Gerais SA", dueDate: "2026-05-12", value: 6700, type: "DOC", docType: "NF" },
];

function downloadArquivoCNAB(linhas: number, largura: 240 | 400, filename: string) {
  const pad = (s: string) => s.padEnd(largura, " ").substring(0, largura);
  const rows = [
    pad(`0REMESSA341FACULDADE NEURODEV LTDA${new Date().toLocaleDateString("pt-BR").replace(/\//g, "")}`),
    pad(`10001LOTE001PGTO`),
    ...Array.from({ length: linhas }, (_, i) => pad(`3${String(i + 1).padStart(5, "0")}A001`)),
    pad(`50001${String(linhas + 2).padStart(6, "0")}`),
    pad(`9${String(linhas + 4).padStart(6, "0")}`),
  ];
  const blob = new Blob([rows.join("\r\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function Cnab240PagamentoPage() {
  const [covenant, setCovenant] = useState("");
  const [date, setDate] = useState("2026-05-10");
  const [selected, setSelected] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  const toggleSelect = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const total = mockTitulos.filter((t) => selected.includes(t.id)).reduce((s, t) => s + t.value, 0);

  const handleGenerate = () => {
    if (!covenant || selected.length === 0) return;
    setGenerated(true);
    toast({ title: "Remessa CNAB 240 gerada!", description: `${selected.length} pagamento(s) incluídos.` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Remessa CNAB 240 — Pagamento</h1>
        <p className="text-sm text-muted-foreground">Integrações Bancárias › Remessa › CNAB 240 Pagamento</p>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
        <FileCode className="h-4 w-4 shrink-0" />
        <span>Gera arquivo no padrão <strong>CNAB 240</strong> para pagamentos (TED, DOC, PIX, boletos de fornecedores). Compatível com Itaú, Bradesco, BB e CEF.</span>
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
                    <SelectItem value="341-PGTO">341 — Itaú (CNAB 240)</SelectItem>
                    <SelectItem value="237-PGTO">237 — Bradesco (CNAB 240)</SelectItem>
                    <SelectItem value="001-PGTO">001 — Banco do Brasil (CNAB 240)</SelectItem>
                    <SelectItem value="104-PGTO">104 — CEF (CNAB 240)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Data de Pagamento</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Lote</Label><Input defaultValue="001" /></div>
            </CardContent>
          </Card>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="h-4 w-4 rounded border-input"
                      checked={selected.length === mockTitulos.length}
                      onChange={(e) => setSelected(e.target.checked ? mockTitulos.map((t) => t.id) : [])} />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Fornecedor</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Venc.</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Tipo</th>
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
                    <td className="py-3 px-4 text-xs">{t.supplier}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground text-xs">{formatDate(t.dueDate)}</td>
                    <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded text-xs bg-muted">{t.type}</span></td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">{formatCurrency(t.value)}</td>
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
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Selecionados:</span><span>{selected.length} pagamento(s)</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total:</span><span className="font-bold">{formatCurrency(total)}</span></div>
              <Button className="w-full" onClick={handleGenerate} disabled={!covenant || selected.length === 0}>
                <Send className="h-3.5 w-3.5 mr-1.5" />Gerar Remessa
              </Button>
            </CardContent>
          </Card>
          {generated && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-4 w-4" /><span className="text-sm font-medium">Arquivo gerado!</span></div>
                <p className="text-xs text-green-600 font-mono">PGTO_241_20260510.rem</p>
                <div className="text-xs text-green-700 space-y-0.5">
                  <div className="flex justify-between"><span>Header de arquivo:</span><span>1 registro</span></div>
                  <div className="flex justify-between"><span>Header de lote:</span><span>1 registro</span></div>
                  <div className="flex justify-between"><span>Segmento A:</span><span>{selected.length} registro(s)</span></div>
                  <div className="flex justify-between"><span>Trailer de lote:</span><span>1 registro</span></div>
                  <div className="flex justify-between"><span>Trailer de arquivo:</span><span>1 registro</span></div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-green-300 text-green-700" onClick={() => downloadArquivoCNAB(selected.length, 240, "PGTO_241_20260510.rem")}><Download className="h-3.5 w-3.5 mr-1.5" />Baixar</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
