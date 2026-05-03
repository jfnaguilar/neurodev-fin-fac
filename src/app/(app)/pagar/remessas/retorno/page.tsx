"use client";
import React, { useState } from "react";
import { Upload, CheckCircle2, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockRetorno = [
  { id: "1", number: "PAG-2025-001", supplier: "Fornecedor ABC Ltda", value: 45000, status: "PAID", message: "Pagamento confirmado" },
  { id: "2", number: "PAG-2025-003", supplier: "Manutenção Predial", value: 18000, status: "PAID", message: "Pagamento confirmado" },
  { id: "3", number: "PAG-2025-007", supplier: "Gráfica Impressos", value: 4200, status: "REJECTED", message: "Dados bancários inválidos" },
];

export default function RetornoRemessaPagarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processed, setProcessed] = useState(false);

  const handleProcess = () => {
    if (!file) return;
    setProcessed(true);
    toast({ title: "Retorno processado!", description: `${mockRetorno.length} registros processados.` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Retorno de Remessa — Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Remessas › Retorno</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Importar Arquivo de Retorno</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Convênio Bancário</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">001 - Banco do Brasil</SelectItem>
                  <SelectItem value="341">341 - Itaú Unibanco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Retorno</Label>
              <Select defaultValue="CNAB240">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNAB240">CNAB 240 — Pagamento</SelectItem>
                  <SelectItem value="CNAB400">CNAB 400 — Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? "border-green-400 bg-green-50" : "border-muted-foreground/30 hover:border-primary/50"}`}>
            {file ? (
              <div className="space-y-1">
                <FileText className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-sm font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Arraste o arquivo de retorno ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground">.txt, .rem, .ret — Máx. 10 MB</p>
              </div>
            )}
            <input type="file" accept=".txt,.rem,.ret" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" style={{ position: "relative" }}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button onClick={handleProcess} disabled={!file}><Upload className="h-3.5 w-3.5 mr-1.5" />Processar Retorno</Button>
        </CardContent>
      </Card>

      {processed && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Resultado do Processamento</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Credor</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mockRetorno.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-mono text-xs">{r.number}</td>
                    <td className="py-3 px-4">{r.supplier}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(r.value)}</td>
                    <td className="py-3 px-4 text-center">
                      {r.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-50 text-green-700"><CheckCircle2 className="h-3 w-3" />Pago</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-50 text-red-700"><AlertTriangle className="h-3 w-3" />Rejeitado</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
