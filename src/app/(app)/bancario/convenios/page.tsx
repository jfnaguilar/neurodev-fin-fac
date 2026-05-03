"use client";

import React, { useState } from "react";
import { Plus, Edit, Trash2, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const mockCovenants = [
  { id: "1", bankCode: "341", bankName: "Itaú Unibanco", agency: "1234", account: "56789-0", covenantCode: "12345", wallet: "109", layout: "CNAB240", type: "PAYMENT", isActive: true },
  { id: "2", bankCode: "237", bankName: "Bradesco", agency: "5678", account: "98765-4", covenantCode: "67890", wallet: "09", layout: "CNAB400", type: "COLLECTION", isActive: true },
  { id: "3", bankCode: "033", bankName: "Santander", agency: "9012", account: "12345-6", covenantCode: "11111", wallet: "101", layout: "CNAB240", type: "COLLECTION", isActive: false },
];

const banks = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú Unibanco" },
];

export default function ConveniosBancariosPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Configuração de Convênios</h1>
          <p className="text-sm text-muted-foreground">Integrações Bancárias › Configuração de Convênios</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Novo Convênio
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockCovenants.map((covenant) => (
          <Card key={covenant.id} className={!covenant.isActive ? "opacity-60" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{covenant.bankName}</span>
                      <span className="text-xs text-muted-foreground">Cód. {covenant.bankCode}</span>
                      <Badge variant={covenant.isActive ? "outline" : "secondary"} className="text-xs">
                        {covenant.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge className={`text-xs ${covenant.type === "PAYMENT" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                        {covenant.type === "PAYMENT" ? "Pagamento" : "Cobrança"}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Agência: <span className="text-foreground">{covenant.agency}</span></span>
                      <span>Conta: <span className="text-foreground">{covenant.account}</span></span>
                      <span>Convênio: <span className="text-foreground">{covenant.covenantCode}</span></span>
                      <span>Carteira: <span className="text-foreground">{covenant.wallet}</span></span>
                      <span>Layout: <span className="text-foreground font-medium">{covenant.layout}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Convênio Bancário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Banco <span className="text-red-500">*</span></Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => <SelectItem key={b.code} value={b.code}>{b.code} - {b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Agência <span className="text-red-500">*</span></Label>
                <Input placeholder="0000" />
              </div>
              <div className="space-y-1.5">
                <Label>Conta <span className="text-red-500">*</span></Label>
                <Input placeholder="00000-0" />
              </div>
              <div className="space-y-1.5">
                <Label>Código Convênio <span className="text-red-500">*</span></Label>
                <Input placeholder="000000" />
              </div>
              <div className="space-y-1.5">
                <Label>Carteira</Label>
                <Input placeholder="000" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo <span className="text-red-500">*</span></Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAYMENT">Pagamento</SelectItem>
                    <SelectItem value="COLLECTION">Cobrança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Layout <span className="text-red-500">*</span></Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNAB240">CNAB 240</SelectItem>
                    <SelectItem value="CNAB400">CNAB 400</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button>Salvar Convênio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
