"use client";
import React, { useState } from "react";
import { Shield, Download, Trash2, Eye, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockSolicitacoes = [
  { id: "1", titular: "João Silva", cpf: "123.456.789-00", tipo: "ACESSO", data: "2026-04-15", status: "ATENDIDA", prazo: "2026-05-15" },
  { id: "2", titular: "Maria Oliveira", cpf: "987.654.321-00", tipo: "EXCLUSAO", data: "2026-04-20", status: "PENDENTE", prazo: "2026-05-20" },
  { id: "3", titular: "Pedro Santos", cpf: "111.222.333-44", tipo: "PORTABILIDADE", data: "2026-05-01", status: "PENDENTE", prazo: "2026-05-31" },
];

const statusConfig: Record<string, string> = {
  PENDENTE: "bg-yellow-50 text-yellow-700",
  ATENDIDA: "bg-green-50 text-green-700",
  RECUSADA: "bg-red-50 text-red-700",
};

const tipoLabel: Record<string, string> = {
  ACESSO: "Acesso a Dados",
  EXCLUSAO: "Exclusão de Dados",
  PORTABILIDADE: "Portabilidade",
  CORRECAO: "Correção",
  OPOSICAO: "Oposição ao Tratamento",
};

export default function LgpdPage() {
  const [solicitacoes, setSolicitacoes] = useState(mockSolicitacoes);
  const [retemDados, setRetemDados] = useState("60");
  const [politicaVersao, setPoliticaVersao] = useState("v2.1 — Abril 2026");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">LGPD — Privacidade e Proteção de Dados</h1>
        <p className="text-sm text-muted-foreground">Administração › LGPD e Privacidade</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Configurações de Retenção de Dados</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Retenção de dados financeiros (meses)</Label>
                <Input type="number" value={retemDados} onChange={(e) => setRetemDados(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Versão da Política de Privacidade</Label>
                <Input value={politicaVersao} onChange={(e) => setPoliticaVersao(e.target.value)} />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Bases Legais para Tratamento</p>
              {[
                { label: "Execução de contrato (mensalidades, matrículas)", checked: true },
                { label: "Cumprimento de obrigação legal (fiscal, contábil)", checked: true },
                { label: "Legítimo interesse (comunicações internas)", checked: true },
                { label: "Consentimento (marketing, newsletters)", checked: false },
              ].map((b) => (
                <label key={b.label} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-input" defaultChecked={b.checked} />
                  {b.label}
                </label>
              ))}
            </div>
            <Button onClick={() => toast({ title: "Configurações LGPD salvas!" })} className="w-full sm:w-auto">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Salvar Configurações
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Documentos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              "Política de Privacidade",
              "Termo de Uso",
              "Mapeamento de Dados (RIPD)",
              "Relatório de Impacto",
            ].map((doc) => (
              <div key={doc} className="flex items-center justify-between text-sm">
                <span>{doc}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Solicitações de Titulares de Dados (LGPD Art. 18)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Titular</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">CPF</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Solicitação</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Data</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Prazo</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {solicitacoes.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">{s.titular}</td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.cpf}</td>
                  <td className="py-3 px-4 text-xs">{tipoLabel[s.tipo] ?? s.tipo}</td>
                  <td className="py-3 px-4 text-center text-xs text-muted-foreground">{formatDate(s.data)}</td>
                  <td className="py-3 px-4 text-center text-xs text-muted-foreground">{formatDate(s.prazo)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[s.status] ?? ""}`}>{s.status}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                      {s.status === "PENDENTE" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => { setSolicitacoes((p) => p.map((x) => x.id === s.id ? { ...x, status: "ATENDIDA" } : x)); toast({ title: "Solicitação atendida." }); }}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setSolicitacoes((p) => p.filter((x) => x.id !== s.id))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
