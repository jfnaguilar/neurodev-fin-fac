"use client";
import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, GraduationCap, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const initialTurmas = [
  { id: "1", code: "ENG-2025-A", course: "Engenharia Civil", period: "2025/1", shift: "Noturno", students: 45, isCostCenter: false, isActive: true },
  { id: "2", code: "MED-2024-A", course: "Medicina", period: "2024/2", shift: "Integral", students: 60, isCostCenter: true, isActive: true },
  { id: "3", code: "DIR-2025-B", course: "Direito", period: "2025/1", shift: "Matutino", students: 50, isCostCenter: false, isActive: true },
  { id: "4", code: "ADM-2024-C", course: "Administração", period: "2024/2", shift: "Noturno", students: 38, isCostCenter: false, isActive: false },
];

const initialProfessores = [
  { id: "1", name: "Prof. Dr. Carlos Mendes", cpf: "123.456.789-01", email: "carlos@faculdade.edu.br", discipline: "Cálculo Estrutural", isActive: true },
  { id: "2", name: "Profa. Dra. Ana Lima", cpf: "987.654.321-00", email: "ana@faculdade.edu.br", discipline: "Anatomia Humana", isActive: true },
  { id: "3", name: "Prof. Dr. Pedro Costa", cpf: "111.222.333-44", email: "pedro@faculdade.edu.br", discipline: "Direito Civil", isActive: true },
  { id: "4", name: "Prof. Me. Lucas Ferreira", cpf: "444.555.666-77", email: "lucas@faculdade.edu.br", discipline: "Gestão Empresarial", isActive: false },
];

function applyCPFMask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

const emptyTurma = () => ({ code: "", course: "", period: "", shift: "NOTURNO", isCostCenter: false });
const emptyProf = () => ({ name: "", cpf: "", email: "", discipline: "" });

export default function TurmasPage() {
  const [turmas, setTurmas] = useState(initialTurmas);
  const [professores, setProfessores] = useState(initialProfessores);
  const [search, setSearch] = useState("");
  const [openTurma, setOpenTurma] = useState(false);
  const [openProf, setOpenProf] = useState(false);
  const [editingTurma, setEditingTurma] = useState<any>(emptyTurma());
  const [editingProf, setEditingProf] = useState<any>(emptyProf());
  const [cpfError, setCpfError] = useState("");

  const filteredTurmas = turmas.filter((t) =>
    t.code.toLowerCase().includes(search.toLowerCase()) ||
    t.course.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProfs = professores.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.discipline.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveTurma = () => {
    if (!editingTurma.code || !editingTurma.course) return;
    setTurmas((prev) => [...prev, { ...editingTurma, id: String(Date.now()), students: 0, isActive: true }]);
    if (editingTurma.isCostCenter) {
      toast({ title: "Centro de Custo criado!", description: `CC "${editingTurma.course}" foi criado automaticamente.` });
    }
    setOpenTurma(false);
    setEditingTurma(emptyTurma());
  };

  const handleSaveProf = () => {
    if (!editingProf.name) return;
    if (editingProf.cpf && !isValidCPF(editingProf.cpf)) {
      setCpfError("CPF inválido");
      return;
    }
    setProfessores((prev) => [...prev, { ...editingProf, id: String(Date.now()), isActive: true }]);
    setOpenProf(false);
    setEditingProf(emptyProf());
    setCpfError("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Turmas / Professores</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Turmas e Professores</p>
        </div>
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
            <Button size="sm" onClick={() => { setEditingTurma(emptyTurma()); setOpenTurma(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Turma
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Código</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Curso</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Período</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Turno</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Alunos</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">C. Custo</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTurmas.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-primary">{t.code}</td>
                      <td className="py-3 px-4 font-medium">{t.course}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{t.period}</td>
                      <td className="py-3 px-4 text-center"><Badge variant="outline" className="text-xs">{t.shift}</Badge></td>
                      <td className="py-3 px-4 text-center tabular-nums">{t.students}</td>
                      <td className="py-3 px-4 text-center">
                        {t.isCostCenter
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">Sim</span>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${t.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {t.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setTurmas((p) => p.filter((x) => x.id !== t.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTurmas.length === 0 && (
                    <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Nenhuma turma encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professores" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar professor ou disciplina..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" onClick={() => { setEditingProf(emptyProf()); setCpfError(""); setOpenProf(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Professor
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">CPF</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Disciplina</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">E-mail</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                    <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProfs.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.cpf}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.discipline}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setProfessores((prev) => prev.filter((x) => x.id !== p.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProfs.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum professor encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openTurma} onOpenChange={setOpenTurma}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Turma</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Código *</Label>
              <Input placeholder="Ex: ENG-2025-A" value={editingTurma.code} onChange={(e) => setEditingTurma((p: any) => ({ ...p, code: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Curso *</Label>
              <Input placeholder="Nome do curso..." value={editingTurma.course} onChange={(e) => setEditingTurma((p: any) => ({ ...p, course: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Período</Label>
                <Input placeholder="2025/1" value={editingTurma.period} onChange={(e) => setEditingTurma((p: any) => ({ ...p, period: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Turno</Label>
                <Select value={editingTurma.shift} onValueChange={(v) => setEditingTurma((p: any) => ({ ...p, shift: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATUTINO">Matutino</SelectItem>
                    <SelectItem value="VESPERTINO">Vespertino</SelectItem>
                    <SelectItem value="NOTURNO">Noturno</SelectItem>
                    <SelectItem value="INTEGRAL">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCostCenter"
                className="h-4 w-4 rounded border-input cursor-pointer"
                checked={editingTurma.isCostCenter}
                onChange={(e) => setEditingTurma((p: any) => ({ ...p, isCostCenter: e.target.checked }))}
              />
              <Label htmlFor="isCostCenter" className="cursor-pointer font-normal">É Centro de Custo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTurma(false)}>Cancelar</Button>
            <Button onClick={handleSaveTurma} disabled={!editingTurma.code || !editingTurma.course}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openProf} onOpenChange={setOpenProf}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Professor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome Completo *</Label>
              <Input placeholder="Prof. Dr. ..." value={editingProf.name} onChange={(e) => setEditingProf((p: any) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input
                placeholder="000.000.000-00"
                value={editingProf.cpf}
                onChange={(e) => {
                  const masked = applyCPFMask(e.target.value);
                  setEditingProf((p: any) => ({ ...p, cpf: masked }));
                  setCpfError("");
                }}
                className={cpfError ? "border-destructive" : ""}
              />
              {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" placeholder="professor@faculdade.edu.br" value={editingProf.email} onChange={(e) => setEditingProf((p: any) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Disciplina Principal</Label>
              <Input placeholder="Nome da disciplina..." value={editingProf.discipline} onChange={(e) => setEditingProf((p: any) => ({ ...p, discipline: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenProf(false)}>Cancelar</Button>
            <Button onClick={handleSaveProf} disabled={!editingProf.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
