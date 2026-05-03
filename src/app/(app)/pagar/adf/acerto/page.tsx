"use client";
import React, { useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockADFs = [
  { id: "1", number: "ADF-2025-001", supplier: "Fornecedor ABC Ltda", date: "2026-04-01", totalValue: 20000, usedValue: 0, balance: 20000 },
  { id: "2", number: "ADF-2025-002", supplier: "Tech Solutions S.A.", date: "2026-03-15", totalValue: 8000, usedValue: 3000, balance: 5000 },
];

const mockInvoices = [
  { id: "i1", number: "PAG-2025-030", supplier: "Fornecedor ABC Ltda", dueDate: "2026-05-05", value: 12000 },
  { id: "i2", number: "PAG-2025-031", supplier: "Fornecedor ABC Ltda", dueDate: "2026-05-15", value: 8000 },
];

type ADF = typeof mockADFs[0];

export default function AcertoADFPage() {
  const [selectedADF, setSelectedADF] = useState<ADF | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const filteredInvoices = mockInvoices.filter((i) => i.supplier === selectedADF?.supplier);
  const totalInvoices = filteredInvoices.filter((i) => selectedInvoices.includes(i.id)).reduce((s, i) => s + i.value, 0);

  const handleAcerto = () => {
    toast({ title: "Acerto realizado!", description: `ADF ${selectedADF?.number} acertado com ${selectedInvoices.length} título(s).` });
    setSelectedADF(null);
    setSelectedInvoices([]);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Acerto de ADF</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Adiantamento a Fornecedor › Acerto</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <p className="text-sm font-medium">1. Selecione o ADF</p>
          {mockADFs.map((adf) => (
            <Card key={adf.id} className={`cursor-pointer transition-all ${selectedADF?.id === adf.id ? "border-primary shadow-sm" : ""}`} onClick={() => setSelectedADF(adf)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold">{adf.number}</p>
                    <p className="text-sm text-muted-foreground">{adf.supplier}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(adf.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Saldo disponível</p>
                    <p className="font-bold text-green-600">{formatCurrency(adf.balance)}</p>
                    <p className="text-xs text-muted-foreground">de {formatCurrency(adf.totalValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium">2. Selecione os títulos para acertar</p>
          {selectedADF ? (
            <>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="py-3 px-4 w-10"></th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Título</th>
                        <th className="py-3 px-4 text-center font-medium text-muted-foreground">Vencimento</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/20">
                          <td className="py-3 px-4">
                            <input type="checkbox" className="h-4 w-4 rounded border-input" checked={selectedInvoices.includes(inv.id)}
                              onChange={() => setSelectedInvoices((p) => p.includes(inv.id) ? p.filter((x) => x !== inv.id) : [...p, inv.id])} />
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">{inv.number}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(inv.dueDate)}</td>
                          <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(inv.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              {selectedInvoices.length > 0 && (
                <Card className="border-primary/40 bg-primary/5">
                  <CardContent className="py-3 px-4">
                    <div className="flex justify-between text-sm mb-1"><span>Total selecionado:</span><span className="font-bold">{formatCurrency(totalInvoices)}</span></div>
                    <div className="flex justify-between text-sm"><span>Saldo ADF:</span><span className="font-bold text-green-600">{formatCurrency(selectedADF.balance)}</span></div>
                    {totalInvoices > selectedADF.balance && <p className="text-xs text-red-600 mt-1">Valor excede saldo disponível do ADF</p>}
                  </CardContent>
                </Card>
              )}
              <Button className="w-full" onClick={handleAcerto} disabled={selectedInvoices.length === 0 || totalInvoices > selectedADF.balance}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Realizar Acerto
              </Button>
            </>
          ) : (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">Selecione um ADF na lista ao lado.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
