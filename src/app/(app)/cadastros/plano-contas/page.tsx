"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Loader2, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ExportImportBar } from "@/components/ui/ExportImportBar";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  level: number;
  isAnalytical: boolean;
  isActive: boolean;
  parent?: { id: string; code: string; name: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  ASSET: "Ativo",
  LIABILITY: "Passivo",
  EQUITY: "Patrimônio Líquido",
  REVENUE: "Receita",
  EXPENSE: "Despesa",
};

const emptyAccount = () => ({ id: "", code: "", name: "", type: "EXPENSE", nature: "DEBIT", level: 3, isAnalytical: true, isActive: true });

function AccountTable({ accounts, onEdit, onDelete }: {
  accounts: Account[];
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b bg-muted/30">
        <tr>
          <th className="py-2.5 px-3 text-left font-medium text-muted-foreground w-24">Código</th>
          <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">Descrição</th>
          <th className="py-2.5 px-3 text-center font-medium text-muted-foreground">Tipo</th>
          <th className="py-2.5 px-3 text-center font-medium text-muted-foreground w-20">Ações</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {accounts.map((a) => (
          <tr key={a.id} className="hover:bg-muted/20 transition-colors">
            <td className="py-2 px-3 font-mono text-xs tabular-nums">{a.code}</td>
            <td className="py-2 px-3" style={{ paddingLeft: `${(a.level - 1) * 12 + 12}px` }}>
              <span className={a.level === 1 ? "font-bold uppercase text-xs tracking-wide" : a.level === 2 ? "font-semibold text-sm" : "text-sm"}>
                {a.name}
              </span>
            </td>
            <td className="py-2 px-3 text-center">
              <Badge variant={a.isAnalytical ? "default" : "outline"} className="text-xs">
                {a.isAnalytical ? "Analítico" : "Sintético"}
              </Badge>
            </td>
            <td className="py-2 px-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(a)}><Edit className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(a.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </td>
          </tr>
        ))}
        {accounts.length === 0 && (
          <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-xs">Nenhuma conta cadastrada.</td></tr>
        )}
      </tbody>
    </table>
  );
}

export default function PlanoContasPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(emptyAccount());
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chart-of-accounts");
      if (res.ok) {
        const { data } = await res.json();
        setAccounts(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const filtered = accounts.filter((a) =>
    !search || a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const credoras = filtered.filter((a) => a.nature === "CREDIT");
  const devedoras = filtered.filter((a) => a.nature === "DEBIT");

  const handleSave = async () => {
    if (!editing.code || !editing.name) return;
    setSaving(true);
    try {
      let res: Response;
      if (editing.id) {
        res = await fetch(`/api/chart-of-accounts/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
      } else {
        res = await fetch("/api/chart-of-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
      }
      if (res.ok) {
        toast({ title: editing.id ? "Conta atualizada!" : "Conta criada!" });
        setOpen(false);
        fetchAccounts();
      } else {
        const { error } = await res.json();
        toast({ title: "Erro", description: error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Desativar esta conta contábil?")) return;
    const res = await fetch(`/api/chart-of-accounts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Conta desativada." });
      fetchAccounts();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Plano de Contas</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportBar entity="plano-contas" onImportSuccess={fetchAccounts} />
          <Button size="sm" onClick={() => { setEditing(emptyAccount()); setOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Conta
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Nenhuma conta cadastrada ainda.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => { setEditing(emptyAccount()); setOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm text-green-700">Credoras (Natureza C)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AccountTable
                accounts={credoras}
                onEdit={(a) => { setEditing({ ...a }); setOpen(true); }}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm text-red-700">Devedoras (Natureza D)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AccountTable
                accounts={devedoras}
                onEdit={(a) => { setEditing({ ...a }); setOpen(true); }}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing.id ? "Editar Conta" : "Nova Conta Contábil"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Código <span className="text-red-500">*</span></Label>
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
              <Label>Descrição <span className="text-red-500">*</span></Label>
              <Input value={editing.name} onChange={(e) => setEditing((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome da conta contábil..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Natureza</Label>
                <Select value={editing.nature} onValueChange={(v) => setEditing((p: any) => ({ ...p, nature: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBIT">Devedora</SelectItem>
                    <SelectItem value="CREDIT">Credora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isAnalytical" className="h-4 w-4 rounded border-input" checked={editing.isAnalytical} onChange={(e) => setEditing((p: any) => ({ ...p, isAnalytical: e.target.checked }))} />
              <Label htmlFor="isAnalytical">Conta Analítica (lançamentos diretos)</Label>
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
