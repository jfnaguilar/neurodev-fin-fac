"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCNPJ } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const initialSuppliers = [
  { id: "1", name: "Fornecedor ABC Ltda", fantasia: "", document: "12345678000190", group: "Serviços", subgroup: "Manutenção", email: "contato@abc.com", phone: "(11) 99999-0000", isActive: true },
  { id: "2", name: "Editora Saraiva S.A.", fantasia: "Saraiva", document: "98765432000117", group: "Material", subgroup: "Didático", email: "comercial@saraiva.com", phone: "(11) 3333-4444", isActive: true },
  { id: "3", name: "Tech Solutions S.A.", fantasia: "TechSol", document: "11122233000155", group: "Tecnologia", subgroup: "Software", email: "vendas@tech.com", phone: "(11) 5555-6666", isActive: true },
  { id: "4", name: "Gráfica Impressos ME", fantasia: "", document: "44455566000177", group: "Serviços", subgroup: "Gráfica", email: "orcamento@grafica.com", phone: "(11) 7777-8888", isActive: false },
];

function applyCNPJMask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const emptyForm = () => ({ id: "", name: "", fantasia: "", document: "", group: "", subgroup: "", email: "", phone: "", isActive: true });

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());

  const filtered = useMemo(() => suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.document.includes(search.replace(/\D/g, ""))
  ), [suppliers, search]);

  const openNew = () => { setFormData(emptyForm()); setShowForm(true); };
  const openEdit = (s: typeof initialSuppliers[0]) => { setFormData({ ...s, document: formatCNPJ(s.document) }); setShowForm(true); };

  const handleSave = () => {
    if (!formData.name || !formData.document) return;
    const raw = { ...formData, document: formData.document.replace(/\D/g, "") };
    setSuppliers((prev) => {
      const idx = prev.findIndex((s) => s.id === raw.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = raw; return arr; }
      return [...prev, { ...raw, id: String(Date.now()) }];
    });
    toast({ title: "Fornecedor salvo!", description: `${formData.name} cadastrado com sucesso.` });
    setShowForm(false);
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
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Fornecedor
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
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Razão Social</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">CNPJ/CPF</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grupo/Subgrupo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Contato</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((supplier) => (
                <tr key={supplier.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{supplier.name}</td>
                  <td className="py-3 px-4 text-muted-foreground tabular-nums font-mono text-xs">{formatCNPJ(supplier.document)}</td>
                  <td className="py-3 px-4">
                    <span className="text-sm">{supplier.group}</span>
                    {supplier.subgroup && <span className="text-muted-foreground"> / {supplier.subgroup}</span>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    <div>{supplier.email}</div>
                    <div>{supplier.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={supplier.isActive ? "outline" : "secondary"} className="text-xs">
                      {supplier.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(supplier)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setSuppliers((p) => p.filter((x) => x.id !== supplier.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum fornecedor encontrado.</td></tr>
              )}
            </tbody>
          </table>
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
                <Input placeholder="Nome fantasia..." value={formData.fantasia} onChange={set("fantasia")} />
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
              <Button onClick={handleSave} disabled={!formData.name || !formData.document}>Salvar Fornecedor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
