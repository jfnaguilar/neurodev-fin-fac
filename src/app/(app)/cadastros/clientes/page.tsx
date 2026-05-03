"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, Eye, GraduationCap, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const initialCustomers = [
  { id: "1", name: "João Silva", enrollmentId: "MAT-2024-001", type: "STUDENT", course: "Engenharia Civil", email: "joao@email.com", cpf: "123.456.789-09", isActive: true },
  { id: "2", name: "Maria Oliveira", enrollmentId: "MAT-2024-002", type: "STUDENT", course: "Medicina", email: "maria@email.com", cpf: "987.654.321-00", isActive: true },
  { id: "3", name: "Pedro Santos", enrollmentId: "MAT-2025-045", type: "STUDENT", course: "Direito", email: "pedro@email.com", cpf: "111.222.333-96", isActive: true },
  { id: "4", name: "Responsável - Carlos Lima", enrollmentId: "MAT-2025-045", type: "RESPONSIBLE", course: "—", email: "carlos@email.com", cpf: "444.555.666-09", isActive: true },
];

const typeLabels: Record<string, string> = { STUDENT: "Aluno", RESPONSIBLE: "Responsável", OTHER: "Outro" };

function applyCPFMask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const emptyForm = () => ({ id: "", name: "", type: "STUDENT", enrollmentId: "", cpf: "", email: "", course: "" });

export default function ClientesPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());

  const filtered = useMemo(() => customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.enrollmentId.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || c.type === typeFilter;
    return matchSearch && matchType;
  }), [customers, search, typeFilter]);

  const openNew = () => { setFormData(emptyForm()); setShowForm(true); };
  const openEdit = (c: typeof initialCustomers[0]) => { setFormData({ ...c }); setShowForm(true); };

  const handleSave = () => {
    if (!formData.name || !formData.type) return;
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === formData.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = formData; return arr; }
      return [...prev, { ...formData, id: String(Date.now()), isActive: true }];
    });
    toast({ title: "Cliente salvo!", description: `${formData.name} cadastrado com sucesso.` });
    setShowForm(false);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p: any) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Clientes / Alunos</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Clientes / Alunos</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou matrícula..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="STUDENT">Alunos</SelectItem>
                <SelectItem value="RESPONSIBLE">Responsáveis</SelectItem>
                <SelectItem value="OTHER">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Matrícula</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Curso</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">E-mail</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      {customer.type === "STUDENT" && <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />}
                      {customer.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{customer.enrollmentId}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-xs">{typeLabels[customer.type]}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{customer.course}</td>
                  <td className="py-3 px-4 text-muted-foreground">{customer.email}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(customer)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setCustomers((p) => p.filter((x) => x.id !== customer.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{formData.id ? "Editar Cliente" : "Novo Cliente / Aluno"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5 col-span-2">
                <Label>Nome Completo <span className="text-red-500">*</span></Label>
                <Input placeholder="Nome completo..." value={formData.name} onChange={set("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo <span className="text-red-500">*</span></Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Aluno</SelectItem>
                    <SelectItem value="RESPONSIBLE">Responsável</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nº Matrícula</Label>
                <Input placeholder="MAT-0000-000" value={formData.enrollmentId} onChange={set("enrollmentId")} />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData((p: any) => ({ ...p, cpf: applyCPFMask(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" placeholder="email@exemplo.com" value={formData.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Curso</Label>
                <Input placeholder="Nome do curso..." value={formData.course} onChange={set("course")} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.type}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
