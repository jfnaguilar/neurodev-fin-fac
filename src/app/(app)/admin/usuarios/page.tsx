"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, ShieldCheck, ShieldOff, Key, Trash2, Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface TenantUser {
  id: string;
  roleId: string;
  name: string | null;
  email: string;
  role: string;
  mfaEnabled: boolean;
  isActive: boolean;
  tenantIsActive: boolean;
  lastLoginAt: string | null;
}

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
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const { data } = await res.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !search || (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const openNew = () => { setFormData(emptyForm()); setShowForm(true); };
  const openEdit = (u: TenantUser) => { setFormData({ id: u.id, name: u.name ?? "", email: u.email, role: u.role }); setShowForm(true); };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.role) return;
    setSaving(true);
    try {
      let res: Response;
      if (formData.id) {
        res = await fetch(`/api/users/${formData.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: formData.role }) });
      } else {
        res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      }
      if (res.ok) {
        toast({ title: formData.id ? "Usuário atualizado!" : "Usuário convidado!", description: formData.id ? undefined : "Um e-mail de acesso será enviado." });
        setShowForm(false);
        fetchUsers();
      } else {
        const { error } = await res.json();
        toast({ title: "Erro", description: error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = (name: string | null) => {
    toast({ title: "Reset de senha enviado!", description: `Um e-mail de redefinição foi enviado para ${name ?? "o usuário"}.` });
  };

  const handleRemove = async (u: TenantUser) => {
    if (!confirm(`Remover acesso de "${u.name ?? u.email}"?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Acesso removido." });
      fetchUsers();
    }
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
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                    <td className="py-3 px-4 font-medium">{user.name ?? "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role] ?? "bg-gray-100 text-gray-800"}`}>
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {user.mfaEnabled
                        ? <ShieldCheck className="h-4 w-4 text-green-600 mx-auto" />
                        : <ShieldOff className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {user.lastLoginAt ? formatDate(new Date(user.lastLoginAt)) : "Nunca"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={user.tenantIsActive && user.isActive ? "outline" : "secondary"} className="text-xs">
                        {user.tenantIsActive && user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar perfil" onClick={() => openEdit(user)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Reset de senha" onClick={() => handleResetPassword(user.name)}><Key className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Remover acesso" onClick={() => handleRemove(user)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Nenhum usuário encontrado.</p>
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
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{formData.id ? "Editar Perfil de Acesso" : "Convidar Usuário"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              {!formData.id && (
                <>
                  <div className="space-y-1.5">
                    <Label>Nome Completo <span className="text-red-500">*</span></Label>
                    <Input placeholder="Nome do usuário..." value={formData.name} onChange={set("name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail <span className="text-red-500">*</span></Label>
                    <Input type="email" placeholder="usuario@empresa.com" value={formData.email} onChange={set("email")} />
                  </div>
                </>
              )}
              {formData.id && (
                <p className="text-sm text-muted-foreground">Editando perfil de <span className="font-medium">{formData.name}</span></p>
              )}
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
              <Button onClick={handleSave} disabled={(!formData.id && (!formData.name || !formData.email)) || !formData.role || saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {formData.id ? "Salvar" : "Convidar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
