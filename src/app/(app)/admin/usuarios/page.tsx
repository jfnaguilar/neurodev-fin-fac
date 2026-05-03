"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, ShieldCheck, ShieldOff, Key, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const initialUsers = [
  { id: "1", name: "Administrador", email: "admin@neurodev.com", role: "ADMIN", isActive: true, mfaEnabled: true, lastLogin: "2026-05-02T09:30:00" },
  { id: "2", name: "Maria Financeiro", email: "maria@neurodev.com", role: "FINANCIAL", isActive: true, mfaEnabled: false, lastLogin: "2026-05-01T14:00:00" },
  { id: "3", name: "João Aprovador", email: "joao@neurodev.com", role: "APPROVER", isActive: true, mfaEnabled: true, lastLogin: "2026-04-30T16:45:00" },
  { id: "4", name: "Ana Consulta", email: "ana@neurodev.com", role: "VIEWER", isActive: false, mfaEnabled: false, lastLogin: "2026-04-15T11:00:00" },
];

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  FINANCIAL: "Financeiro",
  APPROVER: "Aprovador",
  VIEWER: "Visualizador",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  FINANCIAL: "bg-blue-100 text-blue-800",
  APPROVER: "bg-green-100 text-green-800",
  VIEWER: "bg-gray-100 text-gray-800",
};

const emptyForm = () => ({ id: "", name: "", email: "", role: "FINANCIAL" });

export default function UsuariosPage() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());

  const filtered = useMemo(() => users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const openNew = () => { setFormData(emptyForm()); setShowForm(true); };
  const openEdit = (u: typeof initialUsers[0]) => { setFormData({ id: u.id, name: u.name, email: u.email, role: u.role }); setShowForm(true); };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.role) return;
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === formData.id);
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], name: formData.name, email: formData.email, role: formData.role };
        return arr;
      }
      return [...prev, { ...formData, id: String(Date.now()), isActive: true, mfaEnabled: false, lastLogin: new Date().toISOString() }];
    });
    toast({ title: "Usuário salvo!", description: `${formData.name} ${formData.id ? "atualizado" : "criado"} com sucesso.` });
    setShowForm(false);
  };

  const handleResetPassword = (name: string) => {
    toast({ title: "Reset de senha enviado!", description: `Um e-mail de redefinição foi enviado para ${name}.` });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p: any) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Usuários e Permissões</h1>
          <p className="text-sm text-muted-foreground">Administração › Usuários e Permissões</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Usuário
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar usuários..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">E-mail</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Perfil</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">MFA</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Último Login</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.mfaEnabled
                      ? <ShieldCheck className="h-4 w-4 text-green-600 mx-auto" />
                      : <ShieldOff className="h-4 w-4 text-muted-foreground mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {formatDate(new Date(user.lastLogin))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={user.isActive ? "outline" : "secondary"} className="text-xs">
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(user)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Reset de Senha" onClick={() => handleResetPassword(user.name)}><Key className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Excluir" onClick={() => setUsers((p) => p.filter((x) => x.id !== user.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{formData.id ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nome Completo <span className="text-red-500">*</span></Label>
                <Input placeholder="Nome do usuário..." value={formData.name} onChange={set("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail <span className="text-red-500">*</span></Label>
                <Input type="email" placeholder="usuario@empresa.com" value={formData.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil de Acesso <span className="text-red-500">*</span></Label>
                <Select value={formData.role} onValueChange={(v) => setFormData((p: any) => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.email || !formData.role}>
                {formData.id ? "Salvar" : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
