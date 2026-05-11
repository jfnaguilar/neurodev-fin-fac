"use client";
import React, { useState } from "react";
import { Plus, Trash2, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockDelegacoes: { id: string; delegante: string; delegado: string; startDate: string; endDate: string; reason: string; isActive: boolean }[] = [];

const users: string[] = [];

export default function DelegarAprovacoesPage() {
  const [delegacoes, setDelegacoes] = useState(mockDelegacoes);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ delegante: "", delegado: "", startDate: "", endDate: "", reason: "" });

  const handleSave = () => {
    if (!form.delegante || !form.delegado || !form.startDate || !form.endDate) return;
    setDelegacoes((p) => [...p, { ...form, id: String(Date.now()), isActive: true }]);
    setOpen(false);
    toast({ title: "Delegação criada!", description: `${form.delegante} delegou para ${form.delegado}.` });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Delegar Aprovações</h1>
          <p className="text-sm text-muted-foreground">Contas a Pagar › Aprovações › Delegação</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Delegação
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/20 px-4 py-3 flex items-start gap-3">
        <UserCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">A delegação permite que um usuário aprove temporariamente em nome de outro, dentro dos limites da alçada original. Útil em períodos de ausência.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Delegante</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Delegado para</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Período</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Motivo</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {delegacoes.map((d) => (
                <tr key={d.id} className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium">{d.delegante}</td>
                  <td className="py-3 px-4 text-primary font-medium">{d.delegado}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground text-xs">{formatDate(d.startDate)} – {formatDate(d.endDate)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.reason}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={d.isActive ? "default" : "secondary"} className="text-xs">{d.isActive ? "Ativa" : "Encerrada"}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDelegacoes((p) => p.filter((x) => x.id !== d.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {delegacoes.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma delegação cadastrada.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Delegação de Aprovação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Quem delega *</Label>
              <Select onValueChange={(v) => setForm((p) => ({ ...p, delegante: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o usuário..." /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Delega para *</Label>
              <Select onValueChange={(v) => setForm((p) => ({ ...p, delegado: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o usuário..." /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Data Início *</Label><Input type="date" onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Data Fim *</Label><Input type="date" onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Férias, viagem, etc..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Criar Delegação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
