"use client";
import React, { useState } from "react";
import { Search, Download, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const mockTitulos = [
  { id: "1", number: "REC-2025-001", customer: "João Silva", course: "Engenharia Civil", dueDate: "2026-05-05", value: 2800, status: "PAID" },
  { id: "2", number: "REC-2025-002", customer: "Maria Oliveira", course: "Medicina", dueDate: "2026-05-05", value: 4500, status: "PAID" },
  { id: "3", number: "REC-2025-003", customer: "Pedro Santos", course: "Direito", dueDate: "2026-04-05", value: 2200, status: "OVERDUE" },
  { id: "4", number: "REC-2025-004", customer: "Ana Costa", course: "Arquitetura", dueDate: "2026-05-10", value: 1800, status: "OPEN" },
  { id: "5", number: "REC-2025-005", customer: "Lucas Ferreira", course: "Psicologia", dueDate: "2026-05-10", value: 3200, status: "OPEN" },
  { id: "6", number: "REC-2025-006", customer: "Carla Mendes", course: "Medicina", dueDate: "2026-03-15", value: 4500, status: "OVERDUE" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: "Recebido", className: "bg-green-50 text-green-700" },
  OPEN: { label: "Aberto", className: "bg-blue-50 text-blue-700" },
  OVERDUE: { label: "Vencido", className: "bg-red-50 text-red-700" },
};

export default function ConsultaTitulosReceberPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");

  const filtered = mockTitulos.filter((t) => {
    const matchSearch = t.number.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchCourse = courseFilter === "ALL" || t.course === courseFilter;
    return matchSearch && matchStatus && matchCourse;
  });

  const total = mockTitulos.reduce((s, t) => s + t.value, 0);
  const received = mockTitulos.filter((t) => t.status === "PAID").reduce((s, t) => s + t.value, 0);
  const open = mockTitulos.filter((t) => t.status === "OPEN").reduce((s, t) => s + t.value, 0);
  const overdue = mockTitulos.filter((t) => t.status === "OVERDUE").reduce((s, t) => s + t.value, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Consulta de Títulos a Receber</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Consultas › Títulos</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
            <div><p className="text-xs text-muted-foreground">Total Emitido</p><p className="text-lg font-bold">{formatCurrency(total)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
            <div><p className="text-xs text-muted-foreground">Recebido</p><p className="text-lg font-bold text-green-600">{formatCurrency(received)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><Clock className="h-4 w-4 text-blue-600" /></div>
            <div><p className="text-xs text-muted-foreground">A Receber</p><p className="text-lg font-bold text-blue-600">{formatCurrency(open)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50"><AlertCircle className="h-4 w-4 text-red-600" /></div>
            <div><p className="text-xs text-muted-foreground">Vencidos</p><p className="text-lg font-bold text-red-600">{formatCurrency(overdue)}</p></div>
          </div>
        </CardContent></Card>
      </div>
      <Card><CardContent className="pt-4 pb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar aluno ou número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="OPEN">Abertos</SelectItem>
              <SelectItem value="PAID">Recebidos</SelectItem>
              <SelectItem value="OVERDUE">Vencidos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Curso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os cursos</SelectItem>
              <SelectItem value="Medicina">Medicina</SelectItem>
              <SelectItem value="Engenharia Civil">Engenharia Civil</SelectItem>
              <SelectItem value="Direito">Direito</SelectItem>
              <SelectItem value="Arquitetura">Arquitetura</SelectItem>
              <SelectItem value="Psicologia">Psicologia</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><Download className="h-3.5 w-3.5" /></Button>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Curso</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
              <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-mono text-xs">{t.number}</td>
                <td className="py-3 px-4">{t.customer}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{t.course}</td>
                <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(t.dueDate)}</td>
                <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(t.value)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig[t.status]?.className ?? ""}`}>
                    {statusConfig[t.status]?.label ?? t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t px-4 py-3 flex justify-between text-sm">
          <span className="text-muted-foreground">{filtered.length} título(s)</span>
          <span className="font-semibold">{formatCurrency(filtered.reduce((s, t) => s + t.value, 0))}</span>
        </div>
      </CardContent></Card>
    </div>
  );
}
