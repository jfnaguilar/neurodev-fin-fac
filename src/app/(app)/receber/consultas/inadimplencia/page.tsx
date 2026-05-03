"use client";

import React, { useState } from "react";
import { AlertTriangle, Download, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const mockOverdue = [
  { customerName: "Ana Costa", enrollmentId: "MAT-2023-089", daysOverdue: 58, balance: 5400, course: "Direito" },
  { customerName: "Maria Oliveira", enrollmentId: "MAT-2024-002", daysOverdue: 27, balance: 2100, course: "Medicina" },
  { customerName: "Roberto Alves", enrollmentId: "MAT-2022-156", daysOverdue: 92, balance: 8750, course: "Engenharia" },
  { customerName: "Fernanda Lima", enrollmentId: "MAT-2024-078", daysOverdue: 15, balance: 1850, course: "Pedagogia" },
  { customerName: "Lucas Mendes", enrollmentId: "MAT-2023-201", daysOverdue: 45, balance: 3900, course: "Administração" },
];

const agingData = [
  { range: "1-15 dias", value: 1850, count: 1 },
  { range: "16-30 dias", value: 2100, count: 1 },
  { range: "31-60 dias", value: 9300, count: 2 },
  { range: "61-90 dias", value: 0, count: 0 },
  { range: "+90 dias", value: 8750, count: 1 },
];

const COLORS = ["#fbbf24", "#f97316", "#ef4444", "#dc2626", "#991b1b"];

export default function InadimplenciaPage() {
  const [period, setPeriod] = useState("30");

  const totalOverdue = mockOverdue.reduce((s, t) => s + t.balance, 0);
  const totalStudents = mockOverdue.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inadimplência</h1>
          <p className="text-sm text-muted-foreground">Contas a Receber › Consultas › Inadimplência</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Exportar Relatório</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalOverdue)}</p>
                <p className="text-xs text-red-600">Total Inadimplente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">Alunos Inadimplentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div>
              <p className="text-2xl font-bold">
                {((totalOverdue / (mockOverdue.reduce((s) => s + 2000, 0) + totalOverdue)) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Taxa de Inadimplência</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aging de Inadimplência</CardTitle>
          <CardDescription>Distribuição por faixa de atraso</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {agingData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relação de Inadimplentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Matrícula</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Curso</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Dias em Atraso</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Saldo Devedor</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockOverdue.sort((a, b) => b.daysOverdue - a.daysOverdue).map((item, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{item.customerName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{item.enrollmentId}</td>
                  <td className="py-3 px-4">{item.course}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${item.daysOverdue > 60 ? "text-red-600" : item.daysOverdue > 30 ? "text-orange-600" : "text-yellow-600"}`}>
                      {item.daysOverdue} dias
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-red-600">{formatCurrency(item.balance)}</td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="outline" className="text-xs h-7">Negociar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-muted/30">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-sm font-medium">{totalStudents} aluno(s)</td>
                <td className="py-3 px-4 text-right font-bold text-red-600 tabular-nums">{formatCurrency(totalOverdue)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
