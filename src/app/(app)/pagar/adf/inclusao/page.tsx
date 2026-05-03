"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function InclusaoADFPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: "ADF incluído com sucesso!", description: "Acesse Pagamento de Títulos para efetivar o pagamento." });
    setIsLoading(false);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pagar/adf"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inclusão de ADF</h1>
          <p className="text-sm text-muted-foreground">Contas a Pagar › Adiantamento a Fornecedor › Inclusão</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        Após incluir o ADF, acesse <strong>Pagamento de Títulos</strong> para efetivar o pagamento. Ao pagar, o sistema gerará automaticamente o ADF de entrada para compensação futura.
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Dados do Adiantamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de Adiantamento</Label>
                <Select defaultValue="SUPPLIER">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPLIER">Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fornecedor <span className="text-red-500">*</span></Label>
                <Input placeholder="Buscar fornecedor..." />
              </div>
              <div className="space-y-1.5">
                <Label>Documento de Origem <span className="text-red-500">*</span></Label>
                <Input placeholder="Nº do contrato ou documento..." />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Emissão <span className="text-red-500">*</span></Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1.5">
                <Label>Grupo</Label>
                <Input placeholder="Grupo do fornecedor..." />
              </div>
              <div className="space-y-1.5">
                <Label>Subgrupo</Label>
                <Input placeholder="Subgrupo..." />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Valor (R$) <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.01" placeholder="0,00" className="text-lg" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Observação</Label>
                <textarea className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Observações..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/pagar/adf">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-1.5" />
            {isLoading ? "Salvando..." : "Incluir ADF"}
          </Button>
        </div>
      </form>
    </div>
  );
}
