"use client";
import React, { useState } from "react";
import { Plus, Edit, Trash2, Search, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

type Empresa = {
  id: string; razao: string; fantasia: string; cnpj: string; ie: string;
  email: string; telefone: string; grupoEconomico: string; isActive: boolean;
};

const mockEmpresas: Empresa[] = [
  { id: "1", razao: "NeuroDev Faculdade Ltda", fantasia: "NeuroDev Faculdade", cnpj: "12.345.678/0001-90", ie: "123.456.789.000", email: "financeiro@neurodev.edu.br", telefone: "(11) 3456-7890", grupoEconomico: "Grupo NeuroDev", isActive: true },
  { id: "2", razao: "NeuroDev Instituto de Pesquisa Ltda", fantasia: "NeuroDev Instituto", cnpj: "98.765.432/0001-10", ie: "987.654.321.000", email: "instituto@neurodev.edu.br", telefone: "(11) 3456-7891", grupoEconomico: "Grupo NeuroDev", isActive: true },
];

const emptyForm = (): Omit<Empresa, "id"> => ({ razao: "", fantasia: "", cnpj: "", ie: "", email: "", telefone: "", grupoEconomico: "Grupo NeuroDev", isActive: true });

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>(mockEmpresas);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = empresas.filter((e) =>
    e.razao.toLowerCase().includes(search.toLowerCase()) ||
    e.cnpj.includes(search) ||
    e.fantasia.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (e: Empresa) => { setEditing(e); setForm({ ...e }); setOpen(true); };

  const handleSave = () => {
    if (!form.razao || !form.cnpj) return;
    if (editing) {
      setEmpresas((p) => p.map((e) => e.id === editing.id ? { ...form, id: editing.id } : e));
      toast({ title: "Empresa atualizada!" });
    } else {
      setEmpresas((p) => [...p, { ...form, id: String(Date.now()) }]);
      toast({ title: "Empresa cadastrada!" });
    }
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Empresas</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1.5" />Nova Empresa</Button>
      </div>
      <Card><CardContent className="pt-4 pb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por razão social ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Razão Social</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome Fantasia</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">CNPJ</th>
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grupo Econômico</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
              <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{e.razao}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{e.fantasia}</td>
                <td className="py-3 px-4 font-mono text-xs">{e.cnpj}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{e.grupoEconomico}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${e.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {e.isActive ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setEmpresas((p) => p.filter((x) => x.id !== e.id)); toast({ title: "Empresa removida." }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma empresa encontrada.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Empresa" : "Nova Empresa"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Razão Social *</Label><Input value={form.razao} onChange={(e) => setForm((p) => ({ ...p, razao: e.target.value }))} placeholder="Razão Social..." /></div>
            <div className="space-y-1.5"><Label>Nome Fantasia</Label><Input value={form.fantasia} onChange={(e) => setForm((p) => ({ ...p, fantasia: e.target.value }))} placeholder="Nome Fantasia..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>CNPJ *</Label><Input value={form.cnpj} onChange={(e) => setForm((p) => ({ ...p, cnpj: formatCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" /></div>
              <div className="space-y-1.5"><Label>Inscrição Estadual</Label><Input value={form.ie} onChange={(e) => setForm((p) => ({ ...p, ie: e.target.value }))} placeholder="000.000.000.000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Grupo Econômico</Label>
              <Select value={form.grupoEconomico} onValueChange={(v) => setForm((p) => ({ ...p, grupoEconomico: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grupo NeuroDev">Grupo NeuroDev</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-input" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
              Empresa Ativa
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.razao || !form.cnpj}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
