"use client";
import React, { useState } from "react";
import { Plus, Search, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Criterio = { id: string; aluno: string; curso: string; centroCusto: string; percentual: number; ativo: boolean };

const mockCriterios: Criterio[] = [];

export default function RateioCriterioAlunoPage() {
  const [criterios, setCriterios] = useState<Criterio[]>(mockCriterios);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ aluno: "", curso: "", centroCusto: "", percentual: "" });

  const filtered = criterios.filter((c) =>
    c.aluno.toLowerCase().includes(search.toLowerCase()) || c.curso.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    setCriterios((p) => [...p, { id: String(p.length + 1), ...form, percentual: Number(form.percentual), ativo: true }]);
    toast({ title: "Critério por aluno criado!" });
    setOpen(false);
    setForm({ aluno: "", curso: "", centroCusto: "", percentual: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Critério de Rateio — Por Aluno</h1>
          <p className="text-sm text-muted-foreground">Rateio › Critérios › Por Aluno</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Novo Critério</Button>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        Define qual centro de custo absorve as receitas de cada aluno. O total dos percentuais de um aluno deve somar 100%.
      </div>
      <Card><CardContent className="pt-4 pb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar aluno ou curso..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Aluno</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Curso</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Centro de Custo</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">%</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-medium">{c.aluno}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{c.curso}</td>
                <td className="py-3 px-4 text-xs">{c.centroCusto}</td>
                <td className="py-3 px-4 text-center font-semibold tabular-nums">{c.percentual}%</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.ativo ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>{c.ativo ? "Ativo" : "Inativo"}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => setCriterios((p) => p.filter((x) => x.id !== c.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Critério por Aluno</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Aluno *</Label>
              <Select value={form.aluno} onValueChange={(v) => setForm((p) => ({ ...p, aluno: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="João Silva">João Silva</SelectItem>
                  <SelectItem value="Maria Oliveira">Maria Oliveira</SelectItem>
                  <SelectItem value="Pedro Santos">Pedro Santos</SelectItem>
                  <SelectItem value="Ana Costa">Ana Costa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Centro de Custo *</Label>
              <Select value={form.centroCusto} onValueChange={(v) => setForm((p) => ({ ...p, centroCusto: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC-001 — Engenharia">CC-001 — Engenharia</SelectItem>
                  <SelectItem value="CC-002 — Medicina">CC-002 — Medicina</SelectItem>
                  <SelectItem value="CC-003 — Direito">CC-003 — Direito</SelectItem>
                  <SelectItem value="CC-004 — Administrativo">CC-004 — Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Percentual (%) *</Label>
              <Input type="number" min="1" max="100" placeholder="100" value={form.percentual} onChange={(e) => setForm((p) => ({ ...p, percentual: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.aluno || !form.centroCusto || !form.percentual}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
