"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, GraduationCap, Users, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ExportImportBar } from "@/components/ui/ExportImportBar";

interface ClassGroup {
  id: string;
  code: string;
  name: string;
  course: string | null;
  period: string | null;
  studentCount: number;
  isActive: boolean;
  teacher?: { id: string; name: string } | null;
}

interface Teacher {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
}

function applyCPFMask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const emptyClass = () => ({ id: "", code: "", name: "", course: "", period: "" });
const emptyTeacher = () => ({ id: "", name: "", document: "", email: "", phone: "" });

export default function TurmasPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [search, setSearch] = useState("");
  const [openClass, setOpenClass] = useState(false);
  const [openTeacher, setOpenTeacher] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(emptyClass());
  const [editingTeacher, setEditingTeacher] = useState<any>(emptyTeacher());
  const [saving, setSaving] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const res = await fetch("/api/classes");
      if (res.ok) { const { data } = await res.json(); setClasses(data); }
    } finally { setLoadingClasses(false); }
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      const res = await fetch("/api/teachers");
      if (res.ok) { const { data } = await res.json(); setTeachers(data); }
    } finally { setLoadingTeachers(false); }
  }, []);

  useEffect(() => { fetchClasses(); fetchTeachers(); }, [fetchClasses, fetchTeachers]);

  const filteredClasses = classes.filter((c) => {
    const q = search.toLowerCase();
    return !search || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.course ?? "").toLowerCase().includes(q);
  });

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase();
    return !search || t.name.toLowerCase().includes(q) || (t.email ?? "").toLowerCase().includes(q);
  });

  const handleSaveClass = async () => {
    if (!editingClass.code || !editingClass.name) return;
    setSaving(true);
    try {
      let res: Response;
      if (editingClass.id) {
        res = await fetch(`/api/classes/${editingClass.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingClass) });
      } else {
        res = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingClass) });
      }
      if (res.ok) {
        toast({ title: editingClass.id ? "Turma atualizada!" : "Turma criada!" });
        setOpenClass(false);
        fetchClasses();
      } else {
        const { error } = await res.json();
        toast({ title: "Erro", description: error, variant: "destructive" });
      }
    } finally { setSaving(false); }
  };

  const handleSaveTeacher = async () => {
    if (!editingTeacher.name) return;
    setSaving(true);
    try {
      let res: Response;
      if (editingTeacher.id) {
        res = await fetch(`/api/teachers/${editingTeacher.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingTeacher) });
      } else {
        res = await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingTeacher) });
      }
      if (res.ok) {
        toast({ title: editingTeacher.id ? "Professor atualizado!" : "Professor criado!" });
        setOpenTeacher(false);
        fetchTeachers();
      } else {
        const { error } = await res.json();
        toast({ title: "Erro", description: error, variant: "destructive" });
      }
    } finally { setSaving(false); }
  };

  const handleDeleteClass = async (c: ClassGroup) => {
    if (!confirm(`Desativar turma "${c.name}"?`)) return;
    const res = await fetch(`/api/classes/${c.id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Turma desativada." }); fetchClasses(); }
  };

  const handleDeleteTeacher = async (t: Teacher) => {
    if (!confirm(`Desativar professor "${t.name}"?`)) return;
    const res = await fetch(`/api/teachers/${t.id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Professor desativado." }); fetchTeachers(); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Turmas / Professores</h1>
        <p className="text-sm text-muted-foreground">Cadastros › Turmas e Professores</p>
      </div>

      <Tabs defaultValue="turmas">
        <TabsList>
          <TabsTrigger value="turmas"><GraduationCap className="h-3.5 w-3.5 mr-1.5" />Turmas</TabsTrigger>
          <TabsTrigger value="professores"><Users className="h-3.5 w-3.5 mr-1.5" />Professores</TabsTrigger>
        </TabsList>

        <TabsContent value="turmas" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar turma ou curso..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <ExportImportBar entity="turmas" onImportSuccess={fetchClasses} />
              <Button size="sm" onClick={() => { setEditingClass(emptyClass()); setOpenClass(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Turma
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingClasses ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Código</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome / Curso</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Período</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Professor</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Alunos</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredClasses.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-primary">{t.code}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{t.name}</p>
                          {t.course && <p className="text-xs text-muted-foreground">{t.course}</p>}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{t.period ?? "—"}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{t.teacher?.name ?? "—"}</td>
                        <td className="py-3 px-4 text-center tabular-nums">{t.studentCount}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${t.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {t.isActive ? "Ativa" : "Inativa"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingClass({ id: t.id, code: t.code, name: t.name, course: t.course ?? "", period: t.period ?? "" }); setOpenClass(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteClass(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredClasses.length === 0 && (
                      <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhuma turma encontrada.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professores" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar professor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" onClick={() => { setEditingTeacher(emptyTeacher()); setOpenTeacher(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Professor
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingTeachers ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">CPF</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">E-mail</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Telefone</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTeachers.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium">{p.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.document ?? "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.email ?? "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.phone ?? "—"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {p.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTeacher({ id: p.id, name: p.name, document: p.document ?? "", email: p.email ?? "", phone: p.phone ?? "" }); setOpenTeacher(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteTeacher(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTeachers.length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum professor encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openClass} onOpenChange={setOpenClass}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingClass.id ? "Editar Turma" : "Nova Turma"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Código <span className="text-red-500">*</span></Label>
              <Input placeholder="Ex: ENG-2025-A" value={editingClass.code} onChange={(e) => setEditingClass((p: any) => ({ ...p, code: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Nome <span className="text-red-500">*</span></Label>
              <Input placeholder="Nome da turma..." value={editingClass.name} onChange={(e) => setEditingClass((p: any) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Curso</Label>
              <Input placeholder="Nome do curso..." value={editingClass.course} onChange={(e) => setEditingClass((p: any) => ({ ...p, course: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Input placeholder="2025/1" value={editingClass.period} onChange={(e) => setEditingClass((p: any) => ({ ...p, period: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenClass(false)}>Cancelar</Button>
            <Button onClick={handleSaveClass} disabled={!editingClass.code || !editingClass.name || saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openTeacher} onOpenChange={setOpenTeacher}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTeacher.id ? "Editar Professor" : "Novo Professor"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome Completo <span className="text-red-500">*</span></Label>
              <Input placeholder="Prof. Dr. ..." value={editingTeacher.name} onChange={(e) => setEditingTeacher((p: any) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input
                placeholder="000.000.000-00"
                value={editingTeacher.document}
                onChange={(e) => setEditingTeacher((p: any) => ({ ...p, document: applyCPFMask(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" placeholder="professor@faculdade.edu.br" value={editingTeacher.email} onChange={(e) => setEditingTeacher((p: any) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={editingTeacher.phone} onChange={(e) => setEditingTeacher((p: any) => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTeacher(false)}>Cancelar</Button>
            <Button onClick={handleSaveTeacher} disabled={!editingTeacher.name || saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
