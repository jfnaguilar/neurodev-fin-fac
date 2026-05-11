"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit, GraduationCap, UserCheck, Trash2, Loader2,
  Users, Shield, AlertCircle, ChevronDown, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExportImportBar } from "@/components/ui/ExportImportBar";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Responsible { id: string; name: string; document: string | null; email: string | null; phone: string | null }
interface Customer {
  id: string;
  name: string;
  enrollmentId: string | null;
  type: string;
  document: string | null;
  documentType: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  responsibleId: string | null;
  responsible: Responsible | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = { STUDENT: "Aluno", RESPONSIBLE: "Responsável", OTHER: "Outro" };
const TYPE_ICONS: Record<string, React.ElementType> = { STUDENT: GraduationCap, RESPONSIBLE: UserCheck, OTHER: Users };
const TYPE_COLORS: Record<string, string> = {
  STUDENT:     "bg-blue-100 text-blue-700 border-blue-200",
  RESPONSIBLE: "bg-violet-100 text-violet-700 border-violet-200",
  OTHER:       "bg-slate-100 text-slate-600 border-slate-200",
};

function applyCPFMask(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

const emptyForm = () => ({
  id: "", name: "", type: "STUDENT", enrollmentId: "", document: "", email: "", phone: "", responsibleId: "",
});

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const { toast } = useToast();
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showForm, setShowForm]     = useState(false);
  const [formData, setFormData]     = useState<any>(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Responsáveis para o seletor
  const responsibles = customers.filter((c) => c.type === "RESPONSIBLE" && c.isActive);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)              params.set("search", search);
      if (typeFilter !== "ALL") params.set("type",   typeFilter);
      const res = await fetch(`/api/customers?${params}`);
      if (res.ok) {
        const { data } = await res.json();
        setCustomers(data);
      }
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openNew  = () => { setFormData(emptyForm()); setShowForm(true); };
  const openEdit = (c: Customer) => { setFormData({ ...c, document: c.document ?? "", responsibleId: c.responsibleId ?? "" }); setShowForm(true); };

  const handleSave = async () => {
    if (!formData.name?.trim()) return;
    setSaving(true);
    try {
      const isEdit = Boolean(formData.id);
      const url    = isEdit ? `/api/customers/${formData.id}` : "/api/customers";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        name:          formData.name.trim(),
        type:          formData.type,
        enrollmentId:  formData.enrollmentId?.trim() || undefined,
        document:      formData.document?.trim() || undefined,
        documentType:  "CPF",
        email:         formData.email?.trim() || undefined,
        phone:         formData.phone?.trim() || undefined,
        responsibleId: formData.responsibleId || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erro ao salvar", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: "Salvo!", description: `${formData.name} cadastrado com sucesso.` });
      setShowForm(false);
      fetchCustomers();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Inativar "${name}"?`)) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Cliente inativado" });
      fetchCustomers();
    }
  };

  const filtered = customers.filter((c) => {
    const s = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(s) || (c.enrollmentId ?? "").toLowerCase().includes(s) || (c.document ?? "").includes(s);
    const matchType   = typeFilter === "ALL" || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Clientes / Alunos</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Clientes / Alunos</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportBar entity="clientes" onImportSuccess={fetchCustomers} />
          <Button size="sm" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Novo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, matrícula ou CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Matrícula</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">CPF</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">E-mail</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Responsável</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const Icon = TYPE_ICONS[c.type] ?? Users;
                  const isExpanded = expandedId === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <tr
                        className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${!c.isActive ? "opacity-50" : ""}`}
                      >
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {c.name}
                            {!c.isActive && <Badge variant="outline" className="text-xs text-slate-400">Inativo</Badge>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{c.enrollmentId ?? "—"}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-xs ${TYPE_COLORS[c.type]}`}>{TYPE_LABELS[c.type]}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{c.document ?? "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{c.email ?? "—"}</td>
                        <td className="py-3 px-4">
                          {c.responsible ? (
                            <button
                              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800"
                              onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            >
                              <Shield className="h-3 w-3" />
                              {c.responsible.name}
                              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id, c.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && c.responsible && (
                        <tr className="bg-violet-50/50">
                          <td colSpan={7} className="py-2 px-8">
                            <div className="flex items-center gap-6 text-xs text-violet-700">
                              <span className="font-medium flex items-center gap-1"><Shield className="h-3 w-3" />Responsável Financeiro</span>
                              <span>{c.responsible.name}</span>
                              {c.responsible.document && <span className="font-mono">{c.responsible.document}</span>}
                              {c.responsible.email && <span>{c.responsible.email}</span>}
                              {c.responsible.phone && <span>{c.responsible.phone}</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Cadastrar primeiro cliente
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{formData.id ? "Editar Cliente" : "Novo Cliente / Aluno"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5 col-span-2">
                <Label>Nome Completo <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Nome completo..."
                  value={formData.name}
                  onChange={(e) => setFormData((p: any) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tipo <span className="text-red-500">*</span></Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((p: any) => ({ ...p, type: v, responsibleId: "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Aluno</SelectItem>
                    <SelectItem value="RESPONSIBLE">Responsável</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Nº Matrícula</Label>
                <Input
                  placeholder="MAT-0000-000"
                  value={formData.enrollmentId}
                  onChange={(e) => setFormData((p: any) => ({ ...p, enrollmentId: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={formData.document}
                  onChange={(e) => setFormData((p: any) => ({ ...p, document: applyCPFMask(e.target.value) }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p: any) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData((p: any) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              {/* Responsável — só para alunos */}
              {formData.type === "STUDENT" && (
                <div className="col-span-2 space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-violet-500" />
                    Responsável Financeiro
                  </Label>
                  {responsibles.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Cadastre primeiro um cliente do tipo "Responsável" para vincular.
                    </div>
                  ) : (
                    <Select
                      value={formData.responsibleId || "none"}
                      onValueChange={(v) => setFormData((p: any) => ({ ...p, responsibleId: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar responsável..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Próprio aluno paga —</SelectItem>
                        {responsibles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} {r.document ? `(${r.document})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco se o próprio aluno é o pagador dos títulos.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !formData.name?.trim()}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
