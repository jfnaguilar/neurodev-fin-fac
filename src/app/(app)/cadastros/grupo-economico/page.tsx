"use client";
import React, { useState } from "react";
import { Plus, Search, Edit, Building2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCNPJ } from "@/lib/utils";

type Grupo = { id: string; name: string; cnpj: string; description: string; isActive: boolean; empresas: string[] };
const mockGrupos: Grupo[] = [];
const emptyGrupo = (): Partial<Grupo> => ({ name: "", cnpj: "", description: "", isActive: true });

export default function GrupoEconomicoPage() {
  const [grupos, setGrupos] = useState(mockGrupos);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Grupo>>(emptyGrupo());
  const [isEdit, setIsEdit] = useState(false);

  const filtered = grupos.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.cnpj.includes(search.replace(/\D/g, ""))
  );

  const openCreate = () => { setEditing(emptyGrupo()); setIsEdit(false); setOpen(true); };
  const openEdit = (g: Grupo) => { setEditing({ ...g }); setIsEdit(true); setOpen(true); };
  const handleSave = () => {
    if (!editing.name || !editing.cnpj) return;
    if (isEdit) {
      setGrupos((prev) => prev.map((g) => g.id === editing.id ? { ...g, ...editing } as Grupo : g));
    } else {
      setGrupos((prev) => [...prev, { ...editing, id: String(Date.now()), empresas: [] } as Grupo]);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Grupo Econômico</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Grupo Econômico</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Grupo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome do Grupo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">CNPJ da Mantenedora</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Empresas</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium">{g.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground tabular-nums">{formatCNPJ(g.cnpj)}</td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{g.description}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline">{g.empresas.length} empresa(s)</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${g.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {g.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setGrupos((p) => p.filter((x) => x.id !== g.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum grupo encontrado.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isEdit ? "Editar Grupo Econômico" : "Novo Grupo Econômico"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do Grupo *</Label>
              <Input value={editing.name ?? ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Grupo Educacional..." />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ da Mantenedora *</Label>
              <Input value={editing.cnpj ?? ""} onChange={(e) => setEditing((p) => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={editing.description ?? ""} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Descrição do grupo..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ativo-grupo" className="h-4 w-4 rounded border-input" checked={editing.isActive ?? true} onChange={(e) => setEditing((p) => ({ ...p, isActive: e.target.checked }))} />
              <Label htmlFor="ativo-grupo">Grupo Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
