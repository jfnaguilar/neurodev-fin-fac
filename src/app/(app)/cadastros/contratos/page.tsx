"use client";
import React, { useState, useMemo } from "react";
import { Plus, Search, Edit, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const initialContratos = [
  { id: "1", number: "CTR-2025-001", counterpart: "Fornecedor ABC Ltda", type: "FORNECEDOR", object: "Serviços de Manutenção Predial", value: 150000, startDate: "2025-01-01", endDate: "2025-12-31", status: "VIGENTE", parcelas: 12 },
  { id: "2", number: "CTR-2025-002", counterpart: "Editora Saraiva S.A.", type: "FORNECEDOR", object: "Fornecimento de Material Didático", value: 85000, startDate: "2025-03-01", endDate: "2025-08-31", status: "VIGENTE", parcelas: 6 },
  { id: "3", number: "CTR-2024-015", counterpart: "João Silva — MAT-2024-001", type: "ALUNO", object: "Contrato de Prestação de Serviços Educacionais", value: 24000, startDate: "2024-02-01", endDate: "2024-12-15", status: "ENCERRADO", parcelas: 11 },
  { id: "4", number: "CTR-2025-008", counterpart: "Maria Oliveira — MAT-2024-002", type: "ALUNO", object: "Contrato de Prestação de Serviços Educacionais", value: 36000, startDate: "2025-02-01", endDate: "2027-12-31", status: "VIGENTE", parcelas: 36 },
  { id: "5", number: "CTR-2025-003", counterpart: "Tech Solutions S.A.", type: "FORNECEDOR", object: "Licença de Software de Gestão Acadêmica", value: 48000, startDate: "2025-01-15", endDate: "2026-01-14", status: "VIGENTE", parcelas: 12 },
];

const statusColors: Record<string, string> = {
  VIGENTE: "bg-green-50 text-green-700",
  ENCERRADO: "bg-gray-100 text-gray-500",
  SUSPENSO: "bg-yellow-50 text-yellow-700",
  CANCELADO: "bg-red-50 text-red-600",
};

const emptyForm = () => ({
  number: "", type: "FORNECEDOR", counterpart: "", object: "",
  value: "", startDate: "", endDate: "", parcelas: "12", diaVencimento: "10",
});

export default function ContratosPage() {
  const [contratos, setContratos] = useState(initialContratos);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());

  const filtered = useMemo(() => contratos.filter((c) => {
    const matchSearch = c.number.toLowerCase().includes(search.toLowerCase()) || c.counterpart.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || c.type === typeFilter;
    return matchSearch && matchType;
  }), [contratos, search, typeFilter]);

  const handleSave = () => {
    if (!formData.number || !formData.counterpart) return;

    const totalValue = parseFloat(String(formData.value).replace(",", ".")) || 0;
    const numParcelas = Math.max(1, parseInt(formData.parcelas) || 1);
    const valorParcela = totalValue / numParcelas;

    const newContrato = {
      id: String(Date.now()),
      number: formData.number,
      counterpart: formData.counterpart,
      type: formData.type,
      object: formData.object,
      value: totalValue,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: "VIGENTE",
      parcelas: numParcelas,
    };

    setContratos((prev) => [newContrato, ...prev]);

    const titlesType = formData.type === "ALUNO" ? "receber" : "pagar";
    toast({
      title: "Contrato cadastrado!",
      description: `${numParcelas} parcela(s) de ${formatCurrency(valorParcela)} geradas em contas a ${titlesType}.`,
    });

    setOpenForm(false);
    setFormData(emptyForm());
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p: any) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground">Cadastros › Contratos</p>
        </div>
        <Button size="sm" onClick={() => { setFormData(emptyForm()); setOpenForm(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Contrato
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar por número ou parte..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                <SelectItem value="ALUNO">Aluno</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Número</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Contraparte</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Objeto</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor Total</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Parcelas</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vigência</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono font-medium">{c.number}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{c.counterpart}</div>
                    <Badge variant="outline" className="text-xs mt-0.5">{c.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{c.object}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatCurrency(c.value)}</td>
                  <td className="py-3 px-4 text-center tabular-nums text-muted-foreground">{c.parcelas}x</td>
                  <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                    {formatDate(c.startDate)} – {formatDate(c.endDate)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[c.status] ?? "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Nenhum contrato encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {openForm && (
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Número do Contrato *</Label>
                  <Input placeholder="CTR-2025-000" value={formData.number} onChange={set("number")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData((p: any) => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                      <SelectItem value="ALUNO">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Contraparte *</Label>
                <Input placeholder="Nome do fornecedor ou aluno..." value={formData.counterpart} onChange={set("counterpart")} />
              </div>
              <div className="space-y-1.5">
                <Label>Objeto do Contrato</Label>
                <Input placeholder="Descrição dos serviços/produtos..." value={formData.object} onChange={set("object")} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor Total</Label>
                  <Input placeholder="0,00" value={formData.value} onChange={set("value")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data Início</Label>
                  <Input type="date" value={formData.startDate} onChange={set("startDate")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data Fim</Label>
                  <Input type="date" value={formData.endDate} onChange={set("endDate")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Qtd. Parcelas</Label>
                  <Input type="number" min="1" max="360" placeholder="12" value={formData.parcelas} onChange={set("parcelas")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dia de Vencimento</Label>
                  <Input type="number" min="1" max="31" placeholder="10" value={formData.diaVencimento} onChange={set("diaVencimento")} />
                </div>
              </div>
              {formData.value && formData.parcelas && (
                <p className="text-xs text-muted-foreground">
                  {formData.parcelas}x de {formatCurrency((parseFloat(String(formData.value).replace(",", ".")) || 0) / Math.max(1, parseInt(formData.parcelas) || 1))} com vencimento todo dia {formData.diaVencimento}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formData.number || !formData.counterpart}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
