"use client";
import React, { useState } from "react";
import { Save, Building2, Banknote, FileText, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

export default function ParametrosPage() {
  const [empresa, setEmpresa] = useState({ razao: "Faculdade NeuroDev Ltda", fantasia: "NeuroDev", cnpj: "12.345.678/0001-90", ie: "123.456.789.000", email: "financeiro@neurodev.edu.br", telefone: "(11) 3456-7890" });
  const [fiscal, setFiscal] = useState({ regimeTributario: "LUCRO_REAL", codigoCnae: "8531-7/00", municipio: "São Paulo", uf: "SP" });
  const [financeiro, setFinanceiro] = useState({ jurosMes: "2", multaAtraso: "2", diasTolerancia: "3", moeda: "BRL", carencia: "5" });
  const [notif, setNotif] = useState({ diasAntesVenc: "5", notifEmail: true, notifSms: false });

  const handleSave = () => toast({ title: "Parâmetros salvos com sucesso!" });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Parâmetros do Sistema</h1>
        <p className="text-sm text-muted-foreground">Administração › Parâmetros</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />Dados da Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Razão Social</Label><Input value={empresa.razao} onChange={(e) => setEmpresa((p) => ({ ...p, razao: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Nome Fantasia</Label><Input value={empresa.fantasia} onChange={(e) => setEmpresa((p) => ({ ...p, fantasia: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>CNPJ</Label><Input value={empresa.cnpj} onChange={(e) => setEmpresa((p) => ({ ...p, cnpj: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Inscrição Estadual</Label><Input value={empresa.ie} onChange={(e) => setEmpresa((p) => ({ ...p, ie: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Telefone</Label><Input value={empresa.telefone} onChange={(e) => setEmpresa((p) => ({ ...p, telefone: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label>E-mail Financeiro</Label><Input type="email" value={empresa.email} onChange={(e) => setEmpresa((p) => ({ ...p, email: e.target.value }))} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Dados Fiscais</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Regime Tributário</Label>
            <Select value={fiscal.regimeTributario} onValueChange={(v) => setFiscal((p) => ({ ...p, regimeTributario: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
                <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
                <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                <SelectItem value="IMUNE">Imune/Isenta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>CNAE</Label><Input value={fiscal.codigoCnae} onChange={(e) => setFiscal((p) => ({ ...p, codigoCnae: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Município</Label><Input value={fiscal.municipio} onChange={(e) => setFiscal((p) => ({ ...p, municipio: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>UF</Label><Input value={fiscal.uf} onChange={(e) => setFiscal((p) => ({ ...p, uf: e.target.value }))} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4" />Parâmetros Financeiros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5"><Label>Juros ao Mês (%)</Label><Input type="number" step="0.01" value={financeiro.jurosMes} onChange={(e) => setFinanceiro((p) => ({ ...p, jurosMes: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Multa por Atraso (%)</Label><Input type="number" step="0.01" value={financeiro.multaAtraso} onChange={(e) => setFinanceiro((p) => ({ ...p, multaAtraso: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Dias de Tolerância</Label><Input type="number" value={financeiro.diasTolerancia} onChange={(e) => setFinanceiro((p) => ({ ...p, diasTolerancia: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Carência (dias)</Label><Input type="number" value={financeiro.carencia} onChange={(e) => setFinanceiro((p) => ({ ...p, carencia: e.target.value }))} /></div>
          <div className="space-y-1.5">
            <Label>Moeda</Label>
            <Select value={financeiro.moeda} onValueChange={(v) => setFinanceiro((p) => ({ ...p, moeda: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL — Real</SelectItem>
                <SelectItem value="USD">USD — Dólar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" />Notificações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5 max-w-xs"><Label>Notificar alunos (dias antes do vencimento)</Label><Input type="number" value={notif.diasAntesVenc} onChange={(e) => setNotif((p) => ({ ...p, diasAntesVenc: e.target.value }))} /></div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-input" checked={notif.notifEmail} onChange={(e) => setNotif((p) => ({ ...p, notifEmail: e.target.checked }))} />
              Notificação por E-mail
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-input" checked={notif.notifSms} onChange={(e) => setNotif((p) => ({ ...p, notifSms: e.target.checked }))} />
              Notificação por SMS
            </label>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar Parâmetros</Button>
      </div>
    </div>
  );
}
