"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function CentroResultadosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de Resultados</h1>
        <p className="text-muted-foreground text-sm">DRE — Demonstração do Resultado do Exercício</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demonstração de Resultados</CardTitle>
          <CardDescription>Dados consolidados por período</CardDescription>
        </CardHeader>
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Módulo contábil não configurado</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            O DRE será gerado automaticamente a partir da integração com o plano de contas e do lançamento dos títulos financeiros.
            Configure o plano de contas em <span className="font-medium">Cadastros → Plano de Contas</span> para habilitar este relatório.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
