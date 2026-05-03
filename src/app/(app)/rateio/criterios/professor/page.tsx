"use client";
import React, { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Criterio = { id: string; professor: string; disciplina: string; centroCusto: string; percentual: number };

const mockCriterios: Criterio[] = [
  { id: "1", professor: "Dr. Carlos Mendes", disciplina: "Cálculo Estrutural", centroCusto: "CC-001 — Engenharia", percentual: 100 },
  { id: "2", professor: "Dra. Ana Paula Lima", disciplina: "Anatomia Humana", centroCusto: "CC-002 — Medicina", percentual: 100 },
  { id: "3", professor: "Dr. Roberto Alves", disciplina: "Direito Constitucional", centroCusto: "CC-003 — Direito", percentual: 60 },
  { id: "4", professor: "Dr. Roberto Alves", disciplina: "Direito Constitucional", centroCusto: "CC-005 — Pesquisa", percentual: 40 },
];

export default function RateioCriterioProfessorPage() {
  const [criterios, setCriterios] = useState<Criterio[]>(mockCriterios);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ professor: "", disciplina: "", centroCusto: "", percentual: "" });

  const handleSave = () => {
    setCriterios((p) => [...p, { id: String(p.length + 1), ...form, percentual: Number(form.percentual) }]);
    toast({ title: "Critério por professor criado!" });
    setOpen(false);
    setForm({ professor: "", disciplina: "", centroCusto: "", percentual: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Critério de Rateio — Por Professor</h1>
          <p className="text-sm text-muted-foreground">Rateio › Critérios › Por Professor</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Novo Critério</Button>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        Define como as despesas de professores são distribuídas entre centros de custo, por disciplina.
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Professor</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Disciplina</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Centro de Custo</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">%</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {criterios.map((c) => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-medium">{c.professor}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{c.disciplina}</td>
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
          <DialogHeader><DialogTitle>Novo Critério por Professor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Professor *</Label>
              <Select value={form.professor} onValueChange={(v) => setForm((p) => ({ ...p, professor: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr. Carlos Mendes">Dr. Carlos Mendes</SelectItem>
                  <SelectItem value="Dra. Ana Paula Lima">Dra. Ana Paula Lima</SelectItem>
                  <SelectItem value="Dr. Roberto Alves">Dr. Roberto Alves</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Disciplina</Label>
              <Input placeholder="Nome da disciplina" value={form.disciplina} onChange={(e) => setForm((p) => ({ ...p, disciplina: e.target.value }))} />
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
                  <SelectItem value="CC-005 — Pesquisa">CC-005 — Pesquisa</SelectItem>
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
            <Button onClick={handleSave} disabled={!form.professor || !form.centroCusto || !form.percentual}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
