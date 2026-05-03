"use client";
import React, { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockContas = [
  { id: "1", code: "1", description: "ATIVO", type: "SINTÉTICO", nature: "D", level: 1, isActive: true },
  { id: "2", code: "1.1", description: "ATIVO CIRCULANTE", type: "SINTÉTICO", nature: "D", level: 2, isActive: true },
  { id: "3", code: "1.1.01", description: "Caixa e Equivalentes de Caixa", type: "ANALÍTICO", nature: "D", level: 3, isActive: true },
  { id: "4", code: "1.1.02", description: "Contas a Receber", type: "ANALÍTICO", nature: "D", level: 3, isActive: true },
  { id: "5", code: "1.1.03", description: "Estoques", type: "ANALÍTICO", nature: "D", level: 3, isActive: true },
  { id: "6", code: "2", description: "PASSIVO", type: "SINTÉTICO", nature: "C", level: 1, isActive: true },
  { id: "7", code: "2.1", description: "PASSIVO CIRCULANTE", type: "SINTÉTICO", nature: "C", level: 2, isActive: true },
  { id: "8", code: "2.1.01", description: "Fornecedores", type: "ANALÍTICO", nature: "C", level: 3, isActive: true },
  { id: "9", code: "2.1.02", description: "Obrigações Trabalhistas", type: "ANALÍTICO", nature: "C", level: 3, isActive: true },
  { id: "10", code: "3", description: "RECEITAS", type: "SINTÉTICO", nature: "C", level: 1, isActive: true },
  { id: "11", code: "3.1", description: "Receitas Operacionais", type: "SINTÉTICO", nature: "C", level: 2, isActive: true },
  { id: "12", code: "3.1.01", description: "Mensalidades", type: "ANALÍTICO", nature: "C", level: 3, isActive: true },
  { id: "13", code: "3.1.02", description: "Matrículas", type: "ANALÍTICO", nature: "C", level: 3, isActive: true },
  { id: "14", code: "4", description: "DESPESAS", type: "SINTÉTICO", nature: "D", level: 1, isActive: true },
  { id: "15", code: "4.1", description: "Despesas Operacionais", type: "SINTÉTICO", nature: "D", level: 2, isActive: true },
  { id: "16", code: "4.1.01", description: "Salários e Encargos", type: "ANALÍTICO", nature: "D", level: 3, isActive: true },
  { id: "17", code: "4.1.02", description: "Serviços de Terceiros", type: "ANALÍTICO", nature: "D", level: 3, isActive: true },
  { id: "18", code: "4.1.03", description: "Material Didático", type: "ANALÍTICO", nature: "D", level: 3, isActive: true },
];

const empty = () => ({ id: "", code: "", description: "", type: "ANALÍTICO", nature: "D", level: 3, isActive: true });

type Conta = typeof mockContas[number];

function AccountTable({ contas, onEdit, onDelete }: { contas: Conta[]; onEdit: (c: Conta) => void; onDelete: (id: string) => void }) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b bg-muted/30">
        <tr>
          <th className="py-2.5 px-3 text-left font-medium text-muted-foreground w-24">Código</th>
          <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Descrição</th>
          <th className="py-2.5 px-3 text-center font-medium text-muted-foreground">Tipo</th>
          <th className="py-2.5 px-3 text-center font-medium text-muted-foreground w-16">Ações</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {contas.map((c) => (
          <tr key={c.id} className="hover:bg-muted/20 transition-colors">
            <td className="py-2 px-3 font-mono text-xs tabular-nums">{c.code}</td>
            <td className="py-2 px-3" style={{ paddingLeft: `${(c.level - 1) * 12 + 12}px` }}>
              <span className={c.level === 1 ? "font-bold uppercase text-xs tracking-wide" : c.level === 2 ? "font-semibold text-sm" : "text-sm"}>
                {c.description}
              </span>
            </td>
            <td className="py-2 px-3 text-center">
              <Badge variant={c.type === "ANALÍTICO" ? "default" : "outline"} className="text-xs">{c.type}</Badge>
            </td>
            <td className="py-2 px-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit({ ...c })}><Edit className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </td>
          </tr>
        ))}
        {contas.length === 0 && (
          <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-xs">Nenhuma conta cadastrada.</td></tr>
        )}
      </tbody>
    </table>
  );
}

export default function PlanoContasPage() {
  const [contas, setContas] = useState<Conta[]>(mockContas);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(empty());

  const filtered = contas.filter((c) =>
    c.code.includes(search) || c.description.toLowerCase().includes(search.toLowerCase())
  );

  const credoras = filtered.filter((c) => c.nature === "C");
  const devedoras = filtered.filter((c) => c.nature === "D");

  const handleSave = () => {
    if (!editing.code || !editing.description) return;
    setContas((prev) => {
      let next: Conta[];
      const idx = prev.findIndex((c) => c.id === editing.id);
      if (idx >= 0) {
        next = [...prev];
        next[idx] = editing;
      } else {
        next = [...prev, { ...editing, id: String(Date.now()) }];
      }
      return next.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    });
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Plano de Contas</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(empty()); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Conta
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

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm text-green-700">Credoras (Natureza C)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTable
              contas={credoras}
              onEdit={(c) => { setEditing({ ...c }); setOpen(true); }}
              onDelete={(id) => setContas((p) => p.filter((x) => x.id !== id))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm text-red-700">Devedoras (Natureza D)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTable
              contas={devedoras}
              onEdit={(c) => { setEditing({ ...c }); setOpen(true); }}
              onDelete={(id) => setContas((p) => p.filter((x) => x.id !== id))}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Conta Contábil</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Código *</Label>
                <Input value={editing.code} onChange={(e) => setEditing((p: any) => ({ ...p, code: e.target.value }))} placeholder="Ex: 4.1.04" />
              </div>
              <div className="space-y-1.5">
                <Label>Nível</Label>
                <Select value={String(editing.level)} onValueChange={(v) => setEditing((p: any) => ({ ...p, level: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Grupo</SelectItem>
                    <SelectItem value="2">2 - Subgrupo</SelectItem>
                    <SelectItem value="3">3 - Conta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={editing.description} onChange={(e) => setEditing((p: any) => ({ ...p, description: e.target.value }))} placeholder="Nome da conta contábil..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINTÉTICO">Sintético</SelectItem>
                    <SelectItem value="ANALÍTICO">Analítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Natureza</Label>
                <Select value={editing.nature} onValueChange={(v) => setEditing((p: any) => ({ ...p, nature: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D">Devedora</SelectItem>
                    <SelectItem value="C">Credora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!editing.code || !editing.description}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
