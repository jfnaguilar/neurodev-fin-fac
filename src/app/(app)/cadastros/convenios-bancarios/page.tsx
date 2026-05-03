"use client";
import React, { useState } from "react";
import { Plus, Search, Edit, Landmark, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockConvenios = [
  { id: "1", bank: "341 - Itaú Unibanco", agency: "1234-5", account: "56789-0", covenant: "12345", type: "COBRANÇA", modality: "CNAB 400", isActive: true },
  { id: "2", bank: "001 - Banco do Brasil", agency: "5678-9", account: "11223-4", covenant: "67890", type: "PAGAMENTO", modality: "CNAB 240", isActive: true },
  { id: "3", bank: "033 - Santander", agency: "9012-3", account: "44556-7", covenant: "24680", type: "COBRANÇA", modality: "CNAB 240", isActive: true },
  { id: "4", bank: "237 - Bradesco", agency: "3456-7", account: "88990-1", covenant: "13579", type: "PAGAMENTO", modality: "CNAB 240", isActive: false },
];

const empty = () => ({ bank: "", agency: "", account: "", covenant: "", type: "COBRANÇA", modality: "CNAB 400", isActive: true });
type Conv = typeof mockConvenios[0];

export default function ConveniosBancariosPage() {
  const [convs, setConvs] = useState(mockConvenios);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(empty());
  const [isEdit, setIsEdit] = useState(false);

  const filtered = convs.filter((c) =>
    c.bank.toLowerCase().includes(search.toLowerCase()) ||
    c.covenant.includes(search)
  );

  const openCreate = () => { setEditing(empty()); setIsEdit(false); setOpen(true); };
  const openEdit = (c: Conv) => { setEditing({ ...c }); setIsEdit(true); setOpen(true); };
  const handleSave = () => {
    if (!editing.bank || !editing.covenant) return;
    if (isEdit) setConvs((p) => p.map((c) => c.id === editing.id ? { ...c, ...editing } : c));
    else setConvs((p) => [...p, { ...editing, id: String(Date.now()) }]);
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Convênios Bancários</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Convênios Bancários</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Convênio
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por banco ou nº convênio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Banco</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Agência / Conta</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nº Convênio</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Tipo</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Modalidade</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Situação</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{c.bank}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground tabular-nums">{c.agency} / {c.account}</td>
                  <td className="py-3 px-4 font-mono font-semibold">{c.covenant}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={c.type === "COBRANÇA" ? "default" : "outline"} className="text-xs">{c.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground text-xs">{c.modality}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.isActive ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setConvs((p) => p.filter((x) => x.id !== c.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum convênio encontrado.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isEdit ? "Editar Convênio" : "Novo Convênio Bancário"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Banco *</Label>
              <Select value={editing.bank} onValueChange={(v) => setEditing((p: any) => ({ ...p, bank: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o banco..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="001 - Banco do Brasil">001 - Banco do Brasil</SelectItem>
                  <SelectItem value="033 - Santander">033 - Santander</SelectItem>
                  <SelectItem value="237 - Bradesco">237 - Bradesco</SelectItem>
                  <SelectItem value="341 - Itaú Unibanco">341 - Itaú Unibanco</SelectItem>
                  <SelectItem value="104 - Caixa Econômica">104 - Caixa Econômica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Agência</Label><Input value={editing.agency} onChange={(e) => setEditing((p: any) => ({ ...p, agency: e.target.value }))} placeholder="0000-0" /></div>
              <div className="space-y-1.5"><Label>Conta Corrente</Label><Input value={editing.account} onChange={(e) => setEditing((p: any) => ({ ...p, account: e.target.value }))} placeholder="00000-0" /></div>
            </div>
            <div className="space-y-1.5"><Label>Nº Convênio *</Label><Input value={editing.covenant} onChange={(e) => setEditing((p: any) => ({ ...p, covenant: e.target.value }))} placeholder="Número do convênio..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COBRANÇA">Cobrança</SelectItem>
                    <SelectItem value="PAGAMENTO">Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Modalidade</Label>
                <Select value={editing.modality} onValueChange={(v) => setEditing((p: any) => ({ ...p, modality: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNAB 240">CNAB 240</SelectItem>
                    <SelectItem value="CNAB 400">CNAB 400</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
