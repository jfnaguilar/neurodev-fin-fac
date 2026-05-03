"use client";
import React, { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockCC = [
  { id: "1", code: "ADM", description: "Administrativo", type: "DIRETO", manager: "Carlos Souza", isActive: true },
  { id: "2", code: "ENG", description: "Engenharia Civil", type: "DIRETO", manager: "Profa. Ana Lima", isActive: true },
  { id: "3", code: "MED", description: "Medicina", type: "DIRETO", manager: "Prof. João Silva", isActive: true },
  { id: "4", code: "DIR", description: "Direito", type: "DIRETO", manager: "Profa. Maria Costa", isActive: true },
  { id: "5", code: "TI", description: "Tecnologia da Informação", type: "INDIRETO", manager: "Pedro Oliveira", isActive: true },
  { id: "6", code: "MKT", description: "Marketing e Comunicação", type: "INDIRETO", manager: "Ana Ferreira", isActive: false },
];

type CC = typeof mockCC[0];
const emptyCC = (): Partial<CC> => ({ code: "", description: "", type: "DIRETO", manager: "", isActive: true });

export default function CentrosCustoPage() {
  const [ccs, setCcs] = useState(mockCC);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CC>>(emptyCC());
  const [isEdit, setIsEdit] = useState(false);

  const filtered = ccs.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(emptyCC()); setIsEdit(false); setOpen(true); };
  const openEdit = (c: CC) => { setEditing({ ...c }); setIsEdit(true); setOpen(true); };
  const handleSave = () => {
    if (!editing.code || !editing.description) return;
    if (isEdit) setCcs((p) => p.map((c) => c.id === editing.id ? { ...c, ...editing } as CC : c));
    else setCcs((p) => [...p, { ...editing, id: String(Date.now()) } as CC]);
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Centros de Custo</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Centro
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground w-24">Código</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Tipo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Responsável</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-primary">{c.code}</td>
                  <td className="py-3 px-4 font-medium">{c.description}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={c.type === "DIRETO" ? "default" : "outline"} className="text-xs">{c.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{c.manager}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.isActive ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setCcs((p) => p.filter((x) => x.id !== c.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum centro de custo encontrado.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isEdit ? "Editar Centro de Custo" : "Novo Centro de Custo"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Código *</Label>
                <Input value={editing.code ?? ""} onChange={(e) => setEditing((p) => ({ ...p, code: e.target.value }))} placeholder="Ex: ENG" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={editing.type ?? "DIRETO"} onValueChange={(v) => setEditing((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRETO">Direto</SelectItem>
                    <SelectItem value="INDIRETO">Indireto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={editing.description ?? ""} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} placeholder="Nome do centro de custo..." />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input value={editing.manager ?? ""} onChange={(e) => setEditing((p) => ({ ...p, manager: e.target.value }))} placeholder="Nome do responsável..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ativo-cc" className="h-4 w-4 rounded border-input" checked={editing.isActive ?? true} onChange={(e) => setEditing((p) => ({ ...p, isActive: e.target.checked }))} />
              <Label htmlFor="ativo-cc">Centro de Custo Ativo</Label>
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
