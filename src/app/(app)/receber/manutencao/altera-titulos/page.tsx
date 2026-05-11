"use client";
import React, { useState } from "react";
import { Search, Edit, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Titulo = { id: string; number: string; customer: string; dueDate: string; value: number; course: string };
const mockTitulos: Titulo[] = [];

export default function AlteraTitulosReceberPage() {
  const [titulos, setTitulos] = useState(mockTitulos);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Titulo | null>(null);
  const [editValue, setEditValue] = useState<Partial<Titulo>>({});

  const filtered = titulos.filter((t) =>
    t.number.toLowerCase().includes(search.toLowerCase()) ||
    t.customer.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (t: Titulo) => { setEditing(t); setEditValue({ ...t }); };

  const handleSave = () => {
    if (!editing) return;
    setTitulos((prev) => prev.map((t) => t.id === editing.id ? { ...t, ...editValue } as Titulo : t));
    toast({ title: "Título atualizado!", description: `${editing.number} alterado com sucesso.` });
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Altera Títulos a Receber</h1>
        <p className="text-sm text-muted-foreground">Contas a Receber › Manutenção › Altera Títulos</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Card><CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar aluno ou número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="py-3 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => (
                  <tr key={t.id} className={`hover:bg-muted/20 cursor-pointer ${editing?.id === t.id ? "bg-primary/5" : ""}`} onClick={() => startEdit(t)}>
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs">{t.number}</p>
                      <p className="text-muted-foreground text-xs">{t.customer}</p>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">{formatCurrency(t.value)}</td>
                    <td className="py-3 px-4 text-center"><Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </div>
        <div>
          {editing ? (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Editar: {editing.number}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5"><Label>Aluno/Cliente</Label><Input value={editValue.customer ?? ""} onChange={(e) => setEditValue((p) => ({ ...p, customer: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Vencimento</Label><Input type="date" value={editValue.dueDate ?? ""} onChange={(e) => setEditValue((p) => ({ ...p, dueDate: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Valor</Label><Input value={String(editValue.value ?? "")} onChange={(e) => setEditValue((p) => ({ ...p, value: Number(e.target.value) }))} /></div>
                </div>
                <div className="space-y-1.5"><Label>Observação</Label><Input placeholder="Motivo da alteração..." /></div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="flex items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">Selecione um título para editar.</p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
