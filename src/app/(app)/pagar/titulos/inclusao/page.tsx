"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Upload, Calculator, Save, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const titleSchema = z.object({
  documentType: z.string().min(1, "Tipo de documento obrigatório"),
  supplierId: z.string().min(1, "Credor obrigatório"),
  group: z.string().optional(),
  subgroup: z.string().optional(),
  emissionDate: z.string().min(1, "Data de emissão obrigatória"),
  observation: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentUnit: z.string().optional(),
  accountCode: z.string().optional(),
  installments: z.array(
    z.object({
      dueDate: z.string().min(1, "Data de vencimento obrigatória"),
      value: z.string().min(1, "Valor obrigatório"),
    })
  ).min(1, "Adicione ao menos uma parcela"),
  ratings: z.array(
    z.object({
      ratingType: z.string(),
      referenceId: z.string(),
      referenceName: z.string(),
      value: z.string(),
      percentage: z.string(),
    })
  ).optional(),
});

type TitleForm = z.infer<typeof titleSchema>;

const documentTypes = [
  { value: "CONTRACT", label: "Contrato" },
  { value: "ENROLLMENT", label: "Matrícula" },
  { value: "REENROLLMENT", label: "Re-matrícula" },
  { value: "INVOICE_IN", label: "NF Entrada" },
  { value: "RECEIPT", label: "Recibo" },
  { value: "OTHER", label: "Outros" },
];

const paymentMethods = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "DOC", label: "DOC" },
  { value: "CHECK", label: "Cheque" },
  { value: "CARD", label: "Cartão" },
  { value: "BANK_SLIP", label: "Boleto" },
];

const ratingTypes = [
  { value: "STUDENT", label: "Por Aluno" },
  { value: "CLASS", label: "Por Turma" },
  { value: "TEACHER", label: "Por Professor" },
  { value: "GENERAL", label: "Avulso" },
];

export default function InclusaoTitulosPagarPage() {
  const router = useRouter();
  const [ctbNominalDone, setCtbNominalDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TitleForm>({
    resolver: zodResolver(titleSchema),
    defaultValues: {
      documentType: "",
      supplierId: "",
      emissionDate: new Date().toISOString().split("T")[0],
      installments: [{ dueDate: "", value: "" }],
      ratings: [],
    },
  });

  const { fields: installmentFields, append: appendInstallment, remove: removeInstallment } =
    useFieldArray({ control: form.control, name: "installments" });

  const { fields: ratingFields, append: appendRating, remove: removeRating } =
    useFieldArray({ control: form.control, name: "ratings" });

  const totalValue = installmentFields.reduce((sum, _, i) => {
    const val = parseFloat(form.watch(`installments.${i}.value`) || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalRating = ratingFields.reduce((sum, _, i) => {
    const val = parseFloat(form.watch(`ratings.${i}.value`) || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleCtbNominal = () => {
    if (totalValue <= 0) {
      toast({ title: "Erro", description: "Informe o valor do título antes de contabilizar.", variant: "destructive" });
      return;
    }
    setCtbNominalDone(true);
    toast({ title: "CTB Nominal realizada", description: `Valor de ${formatCurrency(totalValue)} contabilizado com sucesso.`, variant: "default" });
  };

  const onSubmit = async (data: TitleForm) => {
    if (!ctbNominalDone) {
      toast({
        title: "CTB Nominal pendente",
        description: "Execute a CTB Nominal antes de salvar o título.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // TODO: API call
      await new Promise((r) => setTimeout(r, 1000));
      toast({ title: "Título incluído com sucesso!", description: "O título foi salvo com situação Liberado.", variant: "default" });
      router.push("/pagar/titulos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pagar/titulos"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inclusão de Títulos a Pagar</h1>
          <p className="text-sm text-muted-foreground">Contas a Pagar › Títulos › Inclusão</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="dados" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dados">Dados do Título</TabsTrigger>
            <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
            <TabsTrigger value="rateio">Rateio</TabsTrigger>
            <TabsTrigger value="danfe">DANFE/XML</TabsTrigger>
          </TabsList>

          {/* ABA: DADOS */}
          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Documento */}
                  <div className="space-y-1.5">
                    <Label>Tipo de Documento Origem <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(v) => form.setValue("documentType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.documentType && (
                      <p className="text-xs text-red-500">{form.formState.errors.documentType.message}</p>
                    )}
                  </div>

                  {/* Credor */}
                  <div className="space-y-1.5">
                    <Label>Credor <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input placeholder="Buscar credor..." className="flex-1" />
                      <Button type="button" variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Grupo */}
                  <div className="space-y-1.5">
                    <Label>Grupo</Label>
                    <Input placeholder="Grupo" {...form.register("group")} />
                  </div>

                  {/* Subgrupo */}
                  <div className="space-y-1.5">
                    <Label>Subgrupo</Label>
                    <Input placeholder="Subgrupo" {...form.register("subgroup")} />
                  </div>

                  {/* Data de Emissão */}
                  <div className="space-y-1.5">
                    <Label>Data de Emissão <span className="text-red-500">*</span></Label>
                    <Input type="date" {...form.register("emissionDate")} />
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="space-y-1.5">
                    <Label>Forma de Pagamento</Label>
                    <Select onValueChange={(v) => form.setValue("paymentMethod", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plano de Contas */}
                  <div className="space-y-1.5">
                    <Label>Conta Contábil</Label>
                    <Input placeholder="Código da conta..." {...form.register("accountCode")} />
                  </div>

                  {/* Unidade de Pagamento */}
                  <div className="space-y-1.5">
                    <Label>Unidade de Pagamento</Label>
                    <Input placeholder="Unidade..." {...form.register("paymentUnit")} />
                  </div>
                </div>

                {/* Observação */}
                <div className="space-y-1.5">
                  <Label>Histórico/Observação</Label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Observações sobre o título..."
                    {...form.register("observation")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: PARCELAS */}
          <TabsContent value="parcelas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Parcelas / Vencimentos</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendInstallment({ dueDate: "", value: "" })}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar Parcela
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-1">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Vencimento</span>
                    <span className="col-span-5">Valor (R$)</span>
                    <span className="col-span-1" />
                  </div>
                  {installmentFields.map((field, i) => (
                    <div key={field.id} className="grid grid-cols-12 gap-3 items-center">
                      <span className="col-span-1 text-sm text-muted-foreground text-center">{i + 1}</span>
                      <div className="col-span-5">
                        <Input type="date" {...form.register(`installments.${i}.dueDate`)} />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...form.register(`installments.${i}.value`)}
                        />
                      </div>
                      <div className="col-span-1">
                        {installmentFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => removeInstallment(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Separator />
                  <div className="flex justify-end">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="text-lg font-bold tabular-nums">{formatCurrency(totalValue)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: RATEIO */}
          <TabsContent value="rateio">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Rateio</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total do título: {formatCurrency(totalValue)} | Rateado: {formatCurrency(totalRating)}
                      {totalRating > 0 && totalRating !== totalValue && (
                        <Badge variant="secondary" className="ml-2 text-xs text-yellow-600">Divergência</Badge>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendRating({
                        ratingType: "GENERAL",
                        referenceId: "",
                        referenceName: "",
                        value: "",
                        percentage: "",
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar Rateio
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ratingFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum rateio adicionado. O rateio é opcional.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ratingFields.map((field, i) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg">
                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs">Critério</Label>
                          <Select
                            onValueChange={(v) => form.setValue(`ratings.${i}.ratingType`, v)}
                            defaultValue="GENERAL"
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ratingTypes.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4 space-y-1">
                          <Label className="text-xs">Referência</Label>
                          <Input
                            className="h-8 text-xs"
                            placeholder="Nome/Código..."
                            {...form.register(`ratings.${i}.referenceName`)}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input
                            className="h-8 text-xs"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...form.register(`ratings.${i}.value`)}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">%</Label>
                          <Input
                            className="h-8 text-xs"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...form.register(`ratings.${i}.percentage`)}
                          />
                        </div>
                        <div className="col-span-1 pt-6">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => removeRating(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: DANFE */}
          <TabsContent value="danfe">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Importar DANFE / XML NF-e</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted rounded-lg p-10 text-center space-y-3">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Arraste o arquivo ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos aceitos: PDF (DANFE) ou XML (NF-e)
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm">
                    Selecionar Arquivo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Os dados extraídos serão exibidos para confirmação antes de preencher o formulário
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(totalValue)}</p>
            </div>
            {ctbNominalDone && (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                CTB Nominal Realizada
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCtbNominal}
              disabled={ctbNominalDone || totalValue <= 0}
            >
              <Calculator className="h-4 w-4 mr-1.5" />
              CTB Nominal
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/pagar/titulos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-1.5" />
              {isLoading ? "Salvando..." : "Salvar Título"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
