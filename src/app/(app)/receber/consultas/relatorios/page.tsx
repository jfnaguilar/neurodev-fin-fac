"use client";
import React, { useState } from "react";
import { Download, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const monthlyData = [
  { month: "Jan", emitido: 38000, recebido: 32000 },
  { month: "Fev", emitido: 42000, recebido: 38000 },
  { month: "Mar", emitido: 39000, recebido: 35000 },
  { month: "Abr", emitido: 45000, recebido: 40000 },
  { month: "Mai", emitido: 19000, recebido: 7300 },
];

const reports = [
  { id: "1", name: "Extrato de Recebimentos", description: "Recebimentos por período com detalhamento por aluno" },
  { id: "2", name: "Inadimplência por Curso", description: "Títulos vencidos agrupados por curso" },
  { id: "3", name: "Recebimento por Forma de Pagamento", description: "Distribuição por boleto, cartão, transferência" },
  { id: "4", name: "Fluxo de Caixa — Receber", description: "Projeção de recebimentos por período" },
  { id: "5", name: "Posição de Alunos Inadimplentes", description: "Alunos com títulos vencidos e valores em aberto" },
  { id: "6", name: "Curva de Recebimento", description: "Percentual recebido por dia após vencimento" },
];

export default function RelatoriosReceberPage() {
  const [period, setPeriod] = useState("2026-05");
  const [course, setCourse] = useState("ALL");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Relatórios — Contas a Receber</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Consultas › Relatórios</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="h-4 w-4" />Emitido vs. Recebido — 2026</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Competência</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026-05">Maio 2026</SelectItem>
                  <SelectItem value="2026-04">Abril 2026</SelectItem>
                  <SelectItem value="2026-03">Março 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Curso</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os cursos</SelectItem>
                  <SelectItem value="MED">Medicina</SelectItem>
                  <SelectItem value="ENG">Engenharia Civil</SelectItem>
                  <SelectItem value="DIR">Direito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="emitido" fill="hsl(var(--primary)/0.4)" radius={[4, 4, 0, 0]} name="Emitido" />
              <Bar dataKey="recebido" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Recebido" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-primary/40" />Emitido</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-primary" />Recebido</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Relatórios Disponíveis</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Relatório</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground hidden md:table-cell">Descrição</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium">{r.name}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">{r.description}</td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: `${r.name} gerado!`, description: "Arquivo disponível para download." })}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />Gerar
                    </Button>
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
