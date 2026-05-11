"use client";

import React, { useState } from "react";
import { Mail, Loader2, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export type CobrancaType = "BOLETO" | "PIX" | "NF";

const TYPE_LABEL: Record<CobrancaType, string> = {
  BOLETO: "Boleto",
  PIX: "PIX",
  NF: "Nota Fiscal",
};

const TYPE_COLOR: Record<CobrancaType, string> = {
  BOLETO: "bg-blue-950 text-blue-300 border-blue-800",
  PIX: "bg-green-950 text-green-300 border-green-800",
  NF: "bg-purple-950 text-purple-300 border-purple-800",
};

interface Props {
  type: CobrancaType;
  documentId: string;
  defaultEmail?: string;
  customerName?: string;
  amount?: number;
  label?: string;
  variant?: "button" | "icon";
}

export function EnviarCobrancaButton({
  type,
  documentId,
  defaultEmail = "",
  customerName,
  amount,
  label,
  variant = "button",
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const BRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSend = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/email/cobranca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, documentId, to: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        toast({
          title: "E-mail enviado",
          description: `${TYPE_LABEL[type]} enviado para ${data.sentTo}`,
        });
        setTimeout(() => {
          setOpen(false);
          setSent(false);
        }, 1800);
      } else {
        toast({ title: "Erro ao enviar", description: data.error, variant: "destructive" });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => { setEmail(defaultEmail); setOpen(true); }}
          title={`Enviar ${TYPE_LABEL[type]} por e-mail`}
          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setEmail(defaultEmail); setOpen(true); }}
          className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 gap-1.5"
        >
          <Mail className="h-3.5 w-3.5" />
          {label ?? "Enviar por E-mail"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Mail className="h-4 w-4 text-blue-400" />
              Enviar {TYPE_LABEL[type]} por E-mail
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {customerName && <span>Para: <strong className="text-slate-300">{customerName}</strong><br /></span>}
              {amount !== undefined && (
                <span>Valor: <strong className="text-slate-300">{BRL(amount)}</strong><br /></span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Type badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[type]}`}>
                {TYPE_LABEL[type]}
              </span>
              <span className="text-xs text-slate-500">
                {type === "BOLETO" && "Linha digitável + link para PDF"}
                {type === "PIX" && "QR Code (imagem) + Copia-e-Cola"}
                {type === "NF" && "Links para PDF e XML da nota"}
              </span>
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                E-mail do destinatário
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="cliente@email.com"
                disabled={sending || sent}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white
                           placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                           disabled:opacity-50"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {sent ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Enviado com sucesso!
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleSend}
                    disabled={sending || !email.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    size="sm"
                  >
                    {sending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                      : <><Send className="h-3.5 w-3.5" /> Enviar</>
                    }
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={sending}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
