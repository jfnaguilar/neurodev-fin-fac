"use client";

import React, { useState } from "react";
import { Clock, CheckCircle, XCircle, UserCheck, MessageSquare, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const mockPending = [
  {
    id: "1",
    titleId: "T-2026-001",
    supplierName: "Fornecedor Premium Ltda",
    value: 85000,
    dueDate: "2026-05-15",
    requestedBy: "Maria Santos",
    requestedAt: "2026-05-01T10:30:00",
    level: 2,
    totalLevels: 3,
    hoursWaiting: 12,
    observation: "Pagamento referente ao contrato anual de manutenção predial",
  },
  {
    id: "2",
    titleId: "T-2026-002",
    supplierName: "Tech Solutions S.A.",
    value: 42000,
    dueDate: "2026-05-10",
    requestedBy: "João Lima",
    requestedAt: "2026-05-01T14:00:00",
    level: 1,
    totalLevels: 2,
    hoursWaiting: 8,
    observation: "Licenças anuais de software",
  },
  {
    id: "3",
    titleId: "T-2026-003",
    supplierName: "Editora Nacional",
    value: 120000,
    dueDate: "2026-05-20",
    requestedBy: "Ana Costa",
    requestedAt: "2026-04-30T09:00:00",
    level: 3,
    totalLevels: 3,
    hoursWaiting: 36,
    observation: "Aquisição de material didático para o semestre",
  },
];

export default function AprovacoesPendentesPage() {
  const [pending, setPending] = useState(mockPending);
  const [selectedTitle, setSelectedTitle] = useState<(typeof mockPending)[0] | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | "delegate" | null>(null);
  const [comment, setComment] = useState("");
  const [delegateTo, setDelegateTo] = useState("");

  const handleAction = (title: (typeof mockPending)[0], act: "approve" | "reject" | "delegate") => {
    setSelectedTitle(title);
    setAction(act);
    setComment("");
  };

  const handleConfirm = () => {
    if (!selectedTitle) return;
    if ((action === "reject" || action === "delegate") && !comment.trim()) return;
    const labels: Record<string, string> = { approve: "aprovado", reject: "rejeitado", delegate: "delegado" };
    toast({ title: `Título ${labels[action!]}!`, description: `${selectedTitle.supplierName} — ${formatCurrency(selectedTitle.value)}` });
    setPending((prev) => prev.filter((t) => t.id !== selectedTitle.id));
    setSelectedTitle(null);
    setAction(null);
    setComment("");
    setDelegateTo("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Aprovações Pendentes</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Aprovações › Pendentes</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.filter((t) => t.hoursWaiting > 24).length}</p>
                <p className="text-xs text-muted-foreground">Acima de 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(pending.reduce((s, t) => s + t.value, 0))}</p>
                <p className="text-xs text-muted-foreground">Total Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval cards */}
      <div className="space-y-3">
        {pending.map((title) => (
          <Card key={title.id} className={title.hoursWaiting > 24 ? "border-yellow-300" : ""}>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{title.supplierName}</span>
                    <Badge variant="outline" className="text-xs">{title.titleId}</Badge>
                    {title.hoursWaiting > 24 && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                        {title.hoursWaiting}h aguardando
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Solicitado por: <span className="text-foreground font-medium">{title.requestedBy}</span></span>
                    <span>Data: <span className="text-foreground">{formatDate(new Date(title.requestedAt))}</span></span>
                    <span>Vencimento: <span className="text-foreground">{formatDate(title.dueDate)}</span></span>
                  </div>
                  <p className="text-sm text-muted-foreground">{title.observation}</p>
                  {/* Level indicator */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Nível:</span>
                    {Array.from({ length: title.totalLevels }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 w-6 rounded-full ${i < title.level ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground">{title.level}/{title.totalLevels}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xl font-bold tabular-nums">{formatCurrency(title.value)}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleAction(title, "approve")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleAction(title, "reject")}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(title, "delegate")}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      Delegar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Modal */}
      <Dialog open={!!selectedTitle} onOpenChange={() => setSelectedTitle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" && "Aprovar Título"}
              {action === "reject" && "Rejeitar Título"}
              {action === "delegate" && "Delegar Aprovação"}
            </DialogTitle>
          </DialogHeader>
          {selectedTitle && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><span className="text-muted-foreground">Credor:</span> <span className="font-medium">{selectedTitle.supplierName}</span></p>
                <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold">{formatCurrency(selectedTitle.value)}</span></p>
              </div>
              {action === "delegate" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Delegar para (e-mail)</label>
                  <Input
                    placeholder="usuario@empresa.com"
                    value={delegateTo}
                    onChange={(e) => setDelegateTo(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Comentário {action !== "approve" && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Justificativa..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTitle(null)}>Cancelar</Button>
            <Button
              onClick={handleConfirm}
              className={action === "approve" ? "bg-green-600 hover:bg-green-700" : action === "reject" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
