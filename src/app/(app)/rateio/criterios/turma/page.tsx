"use client";
import React, { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Criterio = { id: string; turma: string; curso: string; periodo: string; centroCusto: string; percentual: number };

const mockCriterios: Criterio[] = [];

export default function RateioCriterioTurmaPage() {
  const [criterios, setCriterios] = useState<Criterio[]>(mockCriterios);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ turma: "", curso: "", periodo: "", centroCusto: "", percentual: "" });

  const handleSave = () => {
    setCriterios((p) => [...p, { id: String(p.length + 1), ...form, percentual: Number(form.percentual) }]);
    toast({ title: "Critério por turma criado!" });
    setOpen(false);
    setForm({ turma: "", curso: "", periodo: "", centroCusto: "", percentual: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Critério de Rateio — Por Turma</h1>
          <p className="text-sm text-muted-foreground">Rateio › Critérios › Por Turma</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Novo Critério</Button>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        Define qual centro de custo absorve as receitas de cada turma. Aplica-se a todos os alunos da turma.
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Turma</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Curso</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Período</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Centro de Custo</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">%</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {criterios.map((c) => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-mono text-xs font-medium">{c.turma}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{c.curso}</td>
                <td className="py-3 px-4 text-center text-xs">{c.periodo}</td>
                <td className="py-3 px-4 text-xs">{c.centroCusto}</td>
                <td className="py-3 px-4 text-center font-semibold tabular-nums">{c.percentual}%</td>
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
          <DialogHeader><DialogTitle>Novo Critério por Turma</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Turma *</Label>
                <Select value={form.turma} onValueChange={(v) => setForm((p) => ({ ...p, turma: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENG-2023-A">ENG-2023-A</SelectItem>
                    <SelectItem value="MED-2022-A">MED-2022-A</SelectItem>
                    <SelectItem value="DIR-2024-B">DIR-2024-B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Período</Label>
                <Input placeholder="2026/1" value={form.periodo} onChange={(e) => setForm((p) => ({ ...p, periodo: e.target.value }))} />
              </div>
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
            <Button onClick={handleSave} disabled={!form.turma || !form.centroCusto || !form.percentual}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
