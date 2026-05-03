"use client";
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Save, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const documentTypes = [
  { value: "ENROLLMENT", label: "Matrícula" },
  { value: "REENROLLMENT", label: "Re-matrícula" },
  { value: "TUITION", label: "Mensalidade" },
  { value: "AGREEMENT", label: "Parcelamento/Acordo" },
  { value: "OTHER", label: "Outros" },
];

export default function InclusaoTitulosReceberPage() {
  const [installments, setInstallments] = useState([{ dueDate: "", value: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const totalValue = installments.reduce((s, i) => s + Number(i.value || 0), 0);

  const addInstallment = () => setInstallments((p) => [...p, { dueDate: "", value: "" }]);
  const removeInstallment = (idx: number) => setInstallments((p) => p.filter((_, i) => i !== idx));
  const updateInstallment = (idx: number, field: string, value: string) =>
    setInstallments((p) => p.map((inst, i) => i === idx ? { ...inst, [field]: value } : inst));

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: "Título a receber incluído!", description: `Total: ${formatCurrency(totalValue)}` });
    setIsLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/receber/consultas/titulos">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inclusão de Títulos a Receber</h1>
          <p className="text-sm text-muted-foreground">Contas a Receber › Títulos › Inclusão</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Dados do Título</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de Documento *</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{documentTypes.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data de Emissão *</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Cliente / Aluno *</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente/aluno..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">João Silva — MAT-2024-001 (Engenharia Civil)</SelectItem>
                    <SelectItem value="2">Maria Oliveira — MAT-2024-002 (Medicina)</SelectItem>
                    <SelectItem value="3">Pedro Santos — MAT-2025-045 (Direito)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Turma / Contrato</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng-2025">ENG-2025-A — Engenharia Civil 2025</SelectItem>
                    <SelectItem value="med-2024">MED-2024-A — Medicina 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de Pagamento</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_SLIP">Boleto Bancário</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="CARD">Cartão</SelectItem>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Observação</Label>
                <Input placeholder="Observações adicionais..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Parcelas</CardTitle>
              <Button size="sm" variant="outline" onClick={addInstallment}><Plus className="h-3.5 w-3.5 mr-1.5" />Adicionar Parcela</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {installments.map((inst, idx) => (
                  <div key={idx} className="flex items-end gap-3">
                    <div className="flex items-center justify-center h-8 w-6 shrink-0 text-sm font-medium text-muted-foreground">{idx + 1}</div>
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-xs">Vencimento</Label>
                      <Input type="date" value={inst.dueDate} onChange={(e) => updateInstallment(idx, "dueDate", e.target.value)} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-xs">Valor (R$)</Label>
                      <Input value={inst.value} onChange={(e) => updateInstallment(idx, "value", e.target.value)} placeholder="0,00" className="tabular-nums" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeInstallment(idx)} disabled={installments.length <= 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Parcelas:</span><span>{installments.length}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-sm font-medium">Total a Receber:</span><span className="font-bold text-green-600">{formatCurrency(totalValue)}</span></div>
            </CardContent>
          </Card>
          <Button className="w-full" onClick={handleSave} disabled={isLoading}>
            <Save className="h-3.5 w-3.5 mr-1.5" />{isLoading ? "Salvando..." : "Salvar Título"}
          </Button>
        </div>
      </div>
    </div>
  );
}
