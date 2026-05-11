"use client";

import React, { useState } from "react";
import { Plus, Edit, ShieldCheck, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const initialWorkflows: { id: string; name: string; minValue: number; maxValue: number | null; escalationHours: number; levels: { level: number; approvers: string[]; escalationHours: number }[]; isActive: boolean }[] = [];

const emptyForm = () => ({ id: "", name: "", minValue: "", maxValue: "", escalationHours: "24" });

export default function AlcadasPage() {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());

  const openNew = () => { setFormData(emptyForm()); setShowForm(true); };
  const openEdit = (wf: typeof initialWorkflows[0]) => {
    setFormData({
      id: wf.id,
      name: wf.name,
      minValue: String(wf.minValue),
      maxValue: wf.maxValue != null ? String(wf.maxValue) : "",
      escalationHours: String(wf.escalationHours),
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.minValue === "") return;
    const min = parseFloat(formData.minValue) || 0;
    const max = formData.maxValue !== "" ? parseFloat(formData.maxValue) : null;
    const hours = parseInt(formData.escalationHours) || 24;
    const maxLabel = max != null ? formatCurrency(max) : "Sem limite";
    const nameLabel = formData.name || `${formatCurrency(min)} — ${maxLabel}`;

    const newWf = {
      id: formData.id || String(Date.now()),
      name: nameLabel,
      minValue: min,
      maxValue: max,
      escalationHours: hours,
      levels: [{ level: 1, approvers: ["Aprovador Padrão"], escalationHours: hours }],
      isActive: true,
    };

    setWorkflows((prev) => {
      const idx = prev.findIndex((w) => w.id === formData.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = { ...arr[idx], ...newWf }; return arr; }
      return [...prev, newWf];
    });
    toast({ title: "Alçada salva!", description: `"${nameLabel}" configurada com sucesso.` });
    setShowForm(false);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p: any) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Alçadas de Aprovação</h1>
          <p className="text-sm text-muted-foreground">Administração › Alçadas de Aprovação</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Alçada
        </Button>
      </div>

      <div className="grid gap-4">
        {workflows.map((wf) => (
          <Card key={wf.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {wf.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {formatCurrency(wf.minValue)} — {wf.maxValue ? formatCurrency(wf.maxValue) : "Sem limite"}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(wf)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setWorkflows((p) => p.filter((x) => x.id !== wf.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {wf.levels.map((level) => (
                  <div key={level.level} className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border text-sm">
                    <span className="font-semibold text-primary">Nível {level.level}</span>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex flex-wrap gap-1">
                      {level.approvers.map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">/ Escala em {level.escalationHours}h</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {workflows.length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma alçada configurada.</CardContent></Card>
        )}
      </div>

      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{formData.id ? "Editar Alçada" : "Nova Alçada de Aprovação"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nome / Descrição <span className="text-red-500">*</span></Label>
                <Input placeholder="Ex: Até R$ 1.000" value={formData.name} onChange={set("name")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor Mínimo (R$) <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="0" value={formData.minValue} onChange={set("minValue")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor Máximo (R$)</Label>
                  <Input type="number" placeholder="Sem limite (deixe vazio)" value={formData.maxValue} onChange={set("maxValue")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Escalação automática (horas)</Label>
                <Input type="number" placeholder="24" value={formData.escalationHours} onChange={set("escalationHours")} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formData.name || formData.minValue === ""}>Salvar Alçada</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
