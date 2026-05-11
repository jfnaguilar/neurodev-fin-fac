"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, FilePlus, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type NFStatus = "IMPORTADA" | "PROCESSADA" | "ERRO";

interface NotaFiscal {
  id: string;
  chave: string;
  numero: string;
  serie: string;
  emissao: string;
  fornecedor: string;
  cnpjFornecedor: string;
  valorTotal: number;
  valorIPI: number;
  valorICMS: number;
  itens: number;
  status: NFStatus;
  arquivo: string;
  contaGerada?: string;
}

const mockNotas: NotaFiscal[] = [];

const statusColors: Record<NFStatus, string> = {
  IMPORTADA: "bg-blue-50 text-blue-700",
  PROCESSADA: "bg-green-50 text-green-700",
  ERRO: "bg-red-50 text-red-700",
};

function DropZone({ onFile, accept, label }: { onFile: (name: string) => void; accept: string; label: string }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (name: string) => { if (name) onFile(name); };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handle(f.name); }}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">Arraste e solte ou clique para selecionar</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f.name); e.target.value = ""; }} />
    </div>
  );
}

export default function NotasFiscaisPage() {
  const [notas, setNotas] = useState<NotaFiscal[]>(mockNotas);
  const [selectedNF, setSelectedNF] = useState<NotaFiscal | null>(null);
  const [openGerarConta, setOpenGerarConta] = useState(false);
  const [formGerar, setFormGerar] = useState({ dueDate: "", contaBancaria: "341-CC-001", parcelas: "1" });

  const handleXMLUpload = (filename: string) => {
    const newNF: NotaFiscal = {
      id: String(Date.now()),
      chave: `3526${Math.floor(Math.random() * 1e14).toString().padStart(14, "0")}550010000${Math.floor(Math.random() * 100000).toString().padStart(6, "0")}`,
      numero: String(Math.floor(Math.random() * 900000 + 100000)),
      serie: "001",
      emissao: new Date().toISOString().slice(0, 10),
      fornecedor: "Fornecedor Importado",
      cnpjFornecedor: "00.000.000/0001-00",
      valorTotal: Math.round(Math.random() * 10000 + 500),
      valorIPI: 0,
      valorICMS: 0,
      itens: Math.floor(Math.random() * 10 + 1),
      status: "IMPORTADA",
      arquivo: filename,
    };
    setNotas((prev) => [newNF, ...prev]);
    toast({ title: "NF-e importada!", description: `Arquivo "${filename}" lido com sucesso. Verifique os dados e gere a conta a pagar.` });
  };

  const handleDANFEUpload = (filename: string) => {
    toast({ title: "DANFE recebido", description: `"${filename}" — extração de dados via OCR simulada. Verifique e confirme os dados manualmente.` });
  };

  const handleGerarConta = () => {
    if (!selectedNF || !formGerar.dueDate) return;
    const numParcelas = parseInt(formGerar.parcelas) || 1;
    const valorParcela = selectedNF.valorTotal / numParcelas;
    const numero = `PAG-NF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100))}`;

    setNotas((prev) => prev.map((n) =>
      n.id === selectedNF.id ? { ...n, status: "PROCESSADA" as NFStatus, contaGerada: numero } : n
    ));
    toast({
      title: "Conta a pagar gerada!",
      description: `${numParcelas}x de ${formatCurrency(valorParcela)} — ${numero} — Fornecedor: ${selectedNF.fornecedor}.`,
    });
    setOpenGerarConta(false);
    setSelectedNF(null);
    setFormGerar({ dueDate: "", contaBancaria: "341-CC-001", parcelas: "1" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Importação de Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Notas Fiscais</p>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Importe o XML da NF-e ou o PDF da DANFE para gerar automaticamente a conta a pagar correspondente.</span>
      </div>

      <Tabs defaultValue="xml">
        <TabsList>
          <TabsTrigger value="xml"><FileText className="h-3.5 w-3.5 mr-1.5" />Importar XML (NF-e)</TabsTrigger>
          <TabsTrigger value="danfe"><Upload className="h-3.5 w-3.5 mr-1.5" />Importar DANFE (PDF)</TabsTrigger>
        </TabsList>

        <TabsContent value="xml" className="mt-4">
          <DropZone
            accept=".xml"
            label="Selecione o arquivo XML da NF-e (padrão SEFAZ)"
            onFile={handleXMLUpload}
          />
        </TabsContent>

        <TabsContent value="danfe" className="mt-4">
          <DropZone
            accept=".pdf"
            label="Selecione o PDF da DANFE para extração de dados"
            onFile={handleDANFEUpload}
          />
        </TabsContent>
      </Tabs>

      <div>
        <h2 className="text-sm font-semibold mb-3">Notas Fiscais Importadas</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">NF-e / Série</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Fornecedor</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">CNPJ</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Emissão</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Itens</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Total</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notas.map((nf) => (
                  <tr key={nf.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-medium">{nf.numero}/{nf.serie}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]" title={nf.arquivo}>{nf.arquivo}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{nf.fornecedor}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{nf.cnpjFornecedor}</td>
                    <td className="py-3 px-4 text-center text-xs text-muted-foreground">{formatDate(nf.emissao)}</td>
                    <td className="py-3 px-4 text-center tabular-nums text-muted-foreground">{nf.itens}</td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(nf.valorTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="space-y-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[nf.status]}`}>{nf.status}</span>
                        {nf.contaGerada && <div className="text-xs font-mono text-green-600">{nf.contaGerada}</div>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {nf.status === "IMPORTADA" && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setSelectedNF(nf); setOpenGerarConta(true); }}>
                            <FilePlus className="h-3 w-3 mr-1" />Gerar Conta
                          </Button>
                        )}
                        {nf.status === "PROCESSADA" && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Processada
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setNotas((p) => p.filter((x) => x.id !== nf.id))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {notas.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Nenhuma NF importada. Use a área acima para fazer upload.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {openGerarConta && selectedNF && (
        <Dialog open={openGerarConta} onOpenChange={setOpenGerarConta}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Gerar Conta a Pagar</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Fornecedor:</span><span className="font-medium">{selectedNF.fornecedor}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">NF-e nº:</span><span className="font-mono">{selectedNF.numero}/{selectedNF.serie}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Emissão:</span><span>{formatDate(selectedNF.emissao)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor total:</span><span className="font-bold text-primary">{formatCurrency(selectedNF.valorTotal)}</span></div>
                {selectedNF.valorICMS > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">ICMS:</span><span>{formatCurrency(selectedNF.valorICMS)}</span></div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Data de Vencimento <span className="text-red-500">*</span></Label>
                <Input type="date" value={formGerar.dueDate} onChange={(e) => setFormGerar((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Qtd. Parcelas</Label>
                <Select value={formGerar.parcelas} onValueChange={(v) => setFormGerar((p) => ({ ...p, parcelas: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 6, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}x de {formatCurrency(selectedNF.valorTotal / n)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Conta Bancária para Débito</Label>
                <Select value={formGerar.contaBancaria} onValueChange={(v) => setFormGerar((p) => ({ ...p, contaBancaria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="341-CC-001">341 — Itaú C/C 001</SelectItem>
                    <SelectItem value="237-CC-001">237 — Bradesco C/C 001</SelectItem>
                    <SelectItem value="001-CC-001">001 — BB C/C 001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenGerarConta(false)}>Cancelar</Button>
              <Button onClick={handleGerarConta} disabled={!formGerar.dueDate}>
                <FilePlus className="h-3.5 w-3.5 mr-1.5" />Gerar Conta a Pagar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
