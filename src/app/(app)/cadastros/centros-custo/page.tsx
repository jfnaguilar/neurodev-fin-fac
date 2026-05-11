"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Loader2, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ExportImportBar } from "@/components/ui/ExportImportBar";

interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  parent?: { id: string; code: string; name: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  STUDENT: "Aluno",
  CLASS: "Turma",
  TEACHER: "Professor",
  GENERAL: "Geral",
};

const emptyCC = () => ({ id: "", code: "", name: "", type: "GENERAL", isActive: true });

export default function CentrosCustoPage() {
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(emptyCC());
  const [saving, setSaving] = useState(false);

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cost-centers");
      if (res.ok) {
        const { data } = await res.json();
        setCenters(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);

  const filtered = centers.filter((c) => {
    const q = search.toLowerCase();
    return !search || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  const openCreate = () => { setEditing(emptyCC()); setOpen(true); };
  const openEdit = (c: CostCenter) => { setEditing({ id: c.id, code: c.code, name: c.name, type: c.type, isActive: c.isActive }); setOpen(true); };

  const handleSave = async () => {
    if (!editing.code || !editing.name) return;
    setSaving(true);
    try {
      let res: Response;
      if (editing.id) {
        res = await fetch(`/api/cost-centers/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
      } else {
        res = await fetch("/api/cost-centers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
      }
      if (res.ok) {
        toast({ title: editing.id ? "Centro de custo atualizado!" : "Centro de custo criado!" });
        setOpen(false);
        fetchCenters();
      } else {
        const { error } = await res.json();
        toast({ title: "Erro", description: error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: CostCenter) => {
    if (!confirm(`Desativar "${c.name}"?`)) return;
    const res = await fetch(`/api/cost-centers/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Centro de custo desativado." });
      fetchCenters();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Centros de Custo</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportBar entity="centros-custo" onImportSuccess={fetchCenters} />
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Centro
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por código ou nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

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
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground w-28">Código</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Tipo</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Vinculado a</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-primary">{c.code}</td>
                    <td className="py-3 px-4 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[c.type] ?? c.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{c.parent ? `${c.parent.code} — ${c.parent.name}` : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Nenhum centro de custo cadastrado.</p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Centro
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing.id ? "Editar Centro de Custo" : "Novo Centro de Custo"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Código <span className="text-red-500">*</span></Label>
                <Input value={editing.code} onChange={(e) => setEditing((p: any) => ({ ...p, code: e.target.value }))} placeholder="Ex: ADM" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">Geral</SelectItem>
                    <SelectItem value="CLASS">Turma</SelectItem>
                    <SelectItem value="STUDENT">Aluno</SelectItem>
                    <SelectItem value="TEACHER">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nome <span className="text-red-500">*</span></Label>
              <Input value={editing.name} onChange={(e) => setEditing((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome do centro de custo..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ativo-cc" className="h-4 w-4 rounded border-input" checked={editing.isActive} onChange={(e) => setEditing((p: any) => ({ ...p, isActive: e.target.checked }))} />
              <Label htmlFor="ativo-cc">Centro de Custo Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!editing.code || !editing.name || saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
