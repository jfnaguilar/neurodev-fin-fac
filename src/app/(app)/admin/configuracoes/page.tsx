"use client";
import React, { useState } from "react";
import { Save, Mail, Globe, Palette, Lock, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

export default function ConfiguracoesPage() {
  const [email, setEmail] = useState({ host: "smtp.gmail.com", port: "587", user: "financeiro@neurodev.edu.br", from: "Financeiro NeuroDev <financeiro@neurodev.edu.br>", ssl: true });
  const [sistema, setSistema] = useState({ idioma: "pt-BR", fuso: "America/Sao_Paulo", formatoData: "DD/MM/YYYY", formatoMoeda: "pt-BR", paginacao: "20" });
  const [aparencia, setAparencia] = useState({ tema: "system", corPrimaria: "#3b82f6", logo: "" });
  const [seguranca, setSeguranca] = useState({ sessaoMinutos: "480", tentativasLogin: "5", mfaObrigatorio: false, complexidadeSenha: "MEDIA" });
  const [backup, setBackup] = useState({ frequencia: "DIARIO", retencao: "30", horario: "02:00" });

  const handleSave = (secao: string) => toast({ title: `${secao} salvas com sucesso!` });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Configurações Gerais</h1>
        <p className="text-sm text-muted-foreground">Administração › Configurações</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" />Configurações de E-mail (SMTP)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5"><Label>Servidor SMTP</Label><Input value={email.host} onChange={(e) => setEmail((p) => ({ ...p, host: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Porta</Label><Input value={email.port} onChange={(e) => setEmail((p) => ({ ...p, port: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Usuário</Label><Input value={email.user} onChange={(e) => setEmail((p) => ({ ...p, user: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Senha</Label><Input type="password" placeholder="••••••••" /></div>
          </div>
          <div className="space-y-1.5"><Label>Nome/E-mail de Envio</Label><Input value={email.from} onChange={(e) => setEmail((p) => ({ ...p, from: e.target.value }))} /></div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-input" checked={email.ssl} onChange={(e) => setEmail((p) => ({ ...p, ssl: e.target.checked }))} />
            Usar SSL/TLS
          </label>
          <Button variant="outline" size="sm" onClick={() => toast({ title: "E-mail de teste enviado!" })}>Testar Conexão</Button>
          <div className="flex justify-end"><Button onClick={() => handleSave("Configurações de e-mail")}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" />Regional e Formato</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Idioma</Label>
              <Select value={sistema.idioma} onValueChange={(v) => setSistema((p) => ({ ...p, idioma: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (BR)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuso Horário</Label>
              <Select value={sistema.fuso} onValueChange={(v) => setSistema((p) => ({ ...p, fuso: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">América/São Paulo (BRT)</SelectItem>
                  <SelectItem value="America/Manaus">América/Manaus (AMT)</SelectItem>
                  <SelectItem value="America/Belem">América/Belém (BRT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Formato de Data</Label>
              <Select value={sistema.formatoData} onValueChange={(v) => setSistema((p) => ({ ...p, formatoData: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                  <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Itens por página</Label>
              <Select value={sistema.paginacao} onValueChange={(v) => setSistema((p) => ({ ...p, paginacao: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end"><Button onClick={() => handleSave("Configurações regionais")}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" />Segurança</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5"><Label>Sessão (minutos)</Label><Input type="number" value={seguranca.sessaoMinutos} onChange={(e) => setSeguranca((p) => ({ ...p, sessaoMinutos: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Tentativas de login</Label><Input type="number" value={seguranca.tentativasLogin} onChange={(e) => setSeguranca((p) => ({ ...p, tentativasLogin: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Complexidade de Senha</Label>
              <Select value={seguranca.complexidadeSenha} onValueChange={(v) => setSeguranca((p) => ({ ...p, complexidadeSenha: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa (mín. 6 chars)</SelectItem>
                  <SelectItem value="MEDIA">Média (mín. 8 + número)</SelectItem>
                  <SelectItem value="ALTA">Alta (mín. 10 + especial)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-input" checked={seguranca.mfaObrigatorio} onChange={(e) => setSeguranca((p) => ({ ...p, mfaObrigatorio: e.target.checked }))} />
                MFA Obrigatório
              </label>
            </div>
          </div>
          <div className="flex justify-end"><Button onClick={() => handleSave("Configurações de segurança")}><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" />Backup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Frequência</Label>
              <Select value={backup.frequencia} onValueChange={(v) => setBackup((p) => ({ ...p, frequencia: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIARIO">Diário</SelectItem>
                  <SelectItem value="SEMANAL">Semanal</SelectItem>
                  <SelectItem value="MENSAL">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Retenção (dias)</Label><Input type="number" value={backup.retencao} onChange={(e) => setBackup((p) => ({ ...p, retencao: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Horário</Label><Input type="time" value={backup.horario} onChange={(e) => setBackup((p) => ({ ...p, horario: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Backup iniciado!", description: "Processo em andamento..." })}>Backup Agora</Button>
            <Button onClick={() => handleSave("Configurações de backup")} size="sm"><Save className="h-3.5 w-3.5 mr-1.5" />Salvar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
