"use client";
import React, { useState } from "react";
import { Upload, CheckCircle2, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockRetorno: { id: string; number: string; customer: string; value: number; status: string; message: string }[] = [];

export default function RetornoRemessaReceberPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processed, setProcessed] = useState(false);

  const handleProcess = () => {
    if (!file) return;
    setProcessed(true);
    toast({ title: "Retorno processado!", description: `${mockRetorno.filter((r) => r.status === "RECEIVED").length} recebimentos confirmados.` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Retorno de Remessa — Cobrança</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Remessas › Retorno</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Importar Arquivo de Retorno</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Convênio</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="341">341 - Itaú (CNAB 400)</SelectItem>
                  <SelectItem value="033">033 - Santander (CNAB 400)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Layout</Label>
              <Select defaultValue="CNAB400"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNAB400">CNAB 400 — Cobrança</SelectItem>
                  <SelectItem value="CNAB240">CNAB 240 — Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors relative ${file ? "border-green-400 bg-green-50" : "border-muted-foreground/30 hover:border-primary/50"}`}>
            {file ? (
              <div className="space-y-1">
                <FileText className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-sm font-medium text-green-700">{file.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Selecione o arquivo de retorno bancário</p>
                <p className="text-xs text-muted-foreground">.ret, .txt — Máx. 10 MB</p>
              </div>
            )}
            <input type="file" accept=".ret,.txt" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button onClick={handleProcess} disabled={!file}><Upload className="h-3.5 w-3.5 mr-1.5" />Processar Retorno</Button>
        </CardContent>
      </Card>
      {processed && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Resultado do Processamento</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mockRetorno.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-mono text-xs">{r.number}</td>
                    <td className="py-3 px-4">{r.customer}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(r.value)}</td>
                    <td className="py-3 px-4 text-center">
                      {r.status === "RECEIVED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-50 text-green-700"><CheckCircle2 className="h-3 w-3" />Recebido</span>
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
