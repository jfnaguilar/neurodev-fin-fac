"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, XCircle, UserCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PendingTitle {
  id: string;
  documentNumber: string | null;
  dueDate: string;
  originalValue: number;
  currentBalance: number;
  situation: string;
  createdBy: string;
  createdAt: string;
  observation: string | null;
  approvalLevel: number;
  currentApprovalLevel: number;
  supplier: { name: string } | null;
}

type ActionType = "approve" | "reject";

export default function AprovacoesPendentesPage() {
  const { data: session } = useSession();
  const [pending, setPending] = useState<PendingTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<PendingTitle | null>(null);
  const [action, setAction] = useState<ActionType | null>(null);
  const [comment, setComment] = useState("");

  const tenantId = (session?.user as any)?.currentTenantId;

  const fetchPending = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/titulos/pagar?tenantId=${tenantId}&situation=PENDING_APPROVAL&limit=200`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPending(json.data ?? []);
    } catch {
      toast({ title: "Erro ao carregar aprovações", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = (title: PendingTitle, act: ActionType) => {
    setSelectedTitle(title);
    setAction(act);
    setComment("");
  };

  const handleConfirm = async () => {
    if (!selectedTitle || !action) return;
    if (action === "reject" && !comment.trim()) return;
    setSaving(true);
    try {
      const newSituation = action === "approve" ? "RELEASED" : "CANCELED";
      const res = await fetch(`/api/titulos/pagar/${selectedTitle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: newSituation, observation: comment || undefined }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<ActionType, string> = { approve: "aprovado", reject: "rejeitado" };
      toast({ title: `Título ${labels[action]}!`, description: `${selectedTitle.supplier?.name ?? ""} — ${formatCurrency(Number(selectedTitle.originalValue))}` });
      setSelectedTitle(null);
      setAction(null);
      setComment("");
      fetchPending();
    } catch {
      toast({ title: "Erro ao processar aprovação", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalValue = pending.reduce((s, t) => s + Number(t.originalValue), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Aprovações Pendentes</h1>
        <p className="text-sm text-muted-foreground">Contas a Pagar › Aprovações › Pendentes</p>
      </div>

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
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">Total Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.filter((t) => t.approvalLevel > 1).length}</p>
                <p className="text-xs text-muted-foreground">Alçada Alta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {pending.map((title) => (
            <Card key={title.id}>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{title.supplier?.name ?? "—"}</span>
                      <Badge variant="outline" className="text-xs font-mono">{title.documentNumber ?? title.id.slice(0, 8)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Criado por: <span className="text-foreground font-medium">{title.createdBy}</span></span>
                      <span>Em: <span className="text-foreground">{formatDate(title.createdAt)}</span></span>
                      <span>Vencimento: <span className="text-foreground">{formatDate(title.dueDate)}</span></span>
                    </div>
                    {title.observation && <p className="text-sm text-muted-foreground">{title.observation}</p>}
                    {title.approvalLevel > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Alçada nível {title.approvalLevel}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xl font-bold tabular-nums">{formatCurrency(Number(title.originalValue))}</span>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(title, "approve")}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />Aprovar
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleAction(title, "reject")}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pending.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma aprovação pendente.</CardContent></Card>
          )}
        </div>
      )}

      <Dialog open={!!selectedTitle} onOpenChange={() => setSelectedTitle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approve" ? "Aprovar Título" : "Rejeitar Título"}</DialogTitle>
          </DialogHeader>
          {selectedTitle && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><span className="text-muted-foreground">Credor:</span> <span className="font-medium">{selectedTitle.supplier?.name ?? "—"}</span></p>
                <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold">{formatCurrency(Number(selectedTitle.originalValue))}</span></p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Comentário {action === "reject" && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={action === "reject" ? "Informe o motivo da rejeição..." : "Observação (opcional)..."}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTitle(null)} disabled={saving}>Cancelar</Button>
            <Button
              onClick={handleConfirm}
              disabled={(action === "reject" && !comment.trim()) || saving}
              className={action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              {action === "approve" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
