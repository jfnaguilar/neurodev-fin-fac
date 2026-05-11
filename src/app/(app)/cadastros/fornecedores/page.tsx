"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Loader2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCNPJ } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ExportImportBar } from "@/components/ui/ExportImportBar";
import { useSession } from "next-auth/react";

interface Supplier {
  id: string;
  name: string;
  tradeName: string | null;
  document: string;
  documentType: string;
  group: string | null;
  subgroup: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
}

function applyCNPJMask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const emptyForm = () => ({
  id: "", name: "", tradeName: "", document: "", group: "", subgroup: "", email: "", phone: "",
});

export default function FornecedoresPage() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.currentTenantId as string | undefined;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fornecedores?tenantId=${tenantId}`);
      if (res.ok) {
        const { data } = await res.json();
        setSuppliers(data);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return !search
      || s.name.toLowerCase().includes(q)
      || s.document.includes(search.replace(/\D/g, ""));
  });

  const openNew = () => { setFormData(emptyForm()); setShowForm(true); };
  const openEdit = (s: Supplier) => {
    setFormData({ id: s.id, name: s.name, tradeName: s.tradeName ?? "", document: formatCNPJ(s.document), group: s.group ?? "", subgroup: s.subgroup ?? "", email: s.email ?? "", phone: s.phone ?? "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.document || !tenantId) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        tenantId,
        document: formData.document.replace(/\D/g, ""),
      };
      let res: Response;
      if (formData.id) {
        res = await fetch(`/api/fornecedores/${formData.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        res = await fetch("/api/fornecedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      if (res.ok) {
        toast({ title: formData.id ? "Fornecedor atualizado!" : "Fornecedor criado!" });
        setShowForm(false);
        fetchSuppliers();
      } else {
        const { error } = await res.json();
        toast({ title: "Erro", description: error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Desativar "${s.name}"?`)) return;
    const res = await fetch(`/api/fornecedores/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Fornecedor desativado." });
      fetchSuppliers();
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p: any) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Fornecedores / Credores</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Fornecedores</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportBar entity="fornecedores" onImportSuccess={fetchSuppliers} />
          <Button size="sm" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Fornecedor
          </Button>
        </div>
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
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Razão Social</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">CNPJ/CPF</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grupo/Subgrupo</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground">Contato</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4 text-muted-foreground tabular-nums font-mono text-xs">{formatCNPJ(s.document)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{s.group ?? "—"}</span>
                      {s.subgroup && <span className="text-muted-foreground"> / {s.subgroup}</span>}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {s.email && <div>{s.email}</div>}
                      {s.phone && <div>{s.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={s.isActive ? "outline" : "secondary"} className="text-xs">
                        {s.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Nenhum fornecedor encontrado.</p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Fornecedor
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{formData.id ? "Editar Fornecedor" : "Novo Fornecedor / Credor"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5 col-span-2">
                <Label>Razão Social <span className="text-red-500">*</span></Label>
                <Input placeholder="Nome da empresa..." value={formData.name} onChange={set("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Nome Fantasia</Label>
                <Input placeholder="Nome fantasia..." value={formData.tradeName} onChange={set("tradeName")} />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ/CPF <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={formData.document}
                  onChange={(e) => setFormData((p: any) => ({ ...p, document: applyCNPJMask(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Grupo</Label>
                <Input placeholder="Grupo de fornecedores..." value={formData.group} onChange={set("group")} />
              </div>
              <div className="space-y-1.5">
                <Label>Subgrupo</Label>
                <Input placeholder="Subgrupo..." value={formData.subgroup} onChange={set("subgroup")} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" placeholder="email@empresa.com" value={formData.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input placeholder="(00) 00000-0000" value={formData.phone} onChange={set("phone")} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.document || saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Salvar Fornecedor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
