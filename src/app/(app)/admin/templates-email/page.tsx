"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Mail, FileText, Zap, RotateCcw, Save, Eye, Code2, Info,
  ChevronDown, ChevronUp, Loader2, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  COMMON_VARS,
  TYPE_VARS,
  SAMPLE_VARS,
  DEFAULT_TEMPLATES,
  renderTemplate,
} from "@/lib/email-render";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "BOLETO" | "PIX" | "NF";

interface TemplateState {
  subject: string;
  body: string;
  isCustom: boolean;
  isDirty: boolean;
}

const TABS: { key: TabType; label: string; icon: React.ElementType; color: string }[] = [
  { key: "BOLETO", label: "Boleto Bancário", icon: FileText, color: "text-blue-400" },
  { key: "PIX",    label: "PIX",             icon: Zap,       color: "text-emerald-400" },
  { key: "NF",     label: "Nota Fiscal",     icon: FileText,  color: "text-violet-400" },
];

// ─── Variable badge ───────────────────────────────────────────────────────────

function VarBadge({ varKey, onClick }: { varKey: string; onClick: (k: string) => void }) {
  return (
    <button
      onClick={() => onClick(varKey)}
      title="Clique para copiar"
      className="inline-flex items-center px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-emerald-300
                 font-mono text-xs transition-colors cursor-pointer border border-slate-600"
    >
      {varKey}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesEmailPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabType>("BOLETO");
  const [templates, setTemplates] = useState<Record<TabType, TemplateState>>({
    BOLETO: { ...DEFAULT_TEMPLATES.BOLETO, isCustom: false, isDirty: false },
    PIX:    { ...DEFAULT_TEMPLATES.PIX,    isCustom: false, isDirty: false },
    NF:     { ...DEFAULT_TEMPLATES.NF,     isCustom: false, isDirty: false },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVars, setShowVars] = useState(true);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Load from API ─────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/email-templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates((prev) => ({
            BOLETO: { ...prev.BOLETO, ...data.BOLETO, isDirty: false },
            PIX:    { ...prev.PIX,    ...data.PIX,    isDirty: false },
            NF:     { ...prev.NF,     ...data.NF,     isDirty: false },
          }));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Current template helpers ──────────────────────────────────────────────

  const current = templates[tab];

  const update = useCallback((field: "subject" | "body", value: string) => {
    setTemplates((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [field]: value, isDirty: true },
    }));
  }, [tab]);

  // ─── Insert variable at cursor ─────────────────────────────────────────────

  const insertVar = (varKey: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const body = current.body;
      const newBody = body.slice(0, start) + varKey + body.slice(end);
      update("body", newBody);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + varKey.length, start + varKey.length);
      });
    } else {
      navigator.clipboard.writeText(varKey).catch(() => {});
      toast({ title: `${varKey} copiado!`, description: "Cole no editor com Ctrl+V." });
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${tab}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: current.subject, body: current.body }),
      });
      if (!res.ok) throw new Error();
      setTemplates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], isCustom: true, isDirty: false },
      }));
      toast({ title: "Template salvo!", description: `O template de ${tab} foi atualizado com sucesso.` });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Reset to default ─────────────────────────────────────────────────────

  const resetDefault = async () => {
    if (!confirm(`Restaurar o template de ${tab} para o padrão do sistema?`)) return;
    try {
      const res = await fetch(`/api/admin/email-templates/${tab}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTemplates((prev) => ({
        ...prev,
        [tab]: { ...data, isDirty: false },
      }));
      toast({ title: "Template restaurado!", description: "Usando o template padrão do sistema." });
    } catch {
      toast({ title: "Erro ao restaurar", variant: "destructive" });
    }
  };

  // ─── Preview HTML ──────────────────────────────────────────────────────────

  const previewHtml = renderTemplate(current.body, SAMPLE_VARS);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const typeVars = TYPE_VARS[tab] ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Templates de E-mail de Cobrança
          </h1>
          <p className="text-sm text-muted-foreground">Admin › Templates de E-mail</p>
        </div>
        <div className="flex items-center gap-2">
          {current.isCustom && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-1 rounded">
              <CheckCircle className="h-3 w-3" />Template personalizado
            </span>
          )}
          {current.isDirty && (
            <span className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800 px-2 py-1 rounded">
              Alterações não salvas
            </span>
          )}
          <Button variant="outline" size="sm" onClick={resetDefault} disabled={saving}
            className="border-slate-700 text-slate-400 hover:text-white text-xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />Restaurar padrão
          </Button>
          <Button size="sm" onClick={save} disabled={saving || !current.isDirty}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Salvar Template
          </Button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {TABS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? "bg-slate-800 text-white border border-slate-600"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${tab === key ? color : ""}`} />
            {label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1 border border-slate-700 rounded-lg p-0.5">
          {(["split", "editor", "preview"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                viewMode === mode ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {mode === "editor" && <Code2 className="h-3.5 w-3.5" />}
              {mode === "preview" && <Eye className="h-3.5 w-3.5" />}
              {mode === "split" && <><Code2 className="h-3 w-3" /><Eye className="h-3 w-3" /></>}
              {mode === "split" ? "Dividido" : mode === "editor" ? "Editor" : "Preview"}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Label className="text-slate-400 text-xs w-20 shrink-0">Assunto</Label>
        <Input
          value={current.subject}
          onChange={(e) => update("subject", e.target.value)}
          placeholder="Assunto do e-mail (suporta $variáveis)"
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 font-mono text-sm"
        />
      </div>

      {/* Main editor area */}
      <div className={`flex gap-4 flex-1 min-h-0 ${viewMode === "split" ? "" : ""}`}>
        {/* Editor */}
        {(viewMode === "editor" || viewMode === "split") && (
          <div className={`flex flex-col min-h-0 ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <Code2 className="h-3 w-3" />HTML
              </span>
              <span className="text-xs text-slate-600">{current.body.length} caracteres</span>
            </div>
            <textarea
              ref={textareaRef}
              value={current.body}
              onChange={(e) => update("body", e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4
                         font-mono text-xs text-slate-300 resize-none focus:outline-none
                         focus:ring-1 focus:ring-slate-500 leading-relaxed"
              spellCheck={false}
              placeholder="Cole ou escreva o HTML do template aqui..."
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={`flex flex-col min-h-0 ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Eye className="h-3 w-3" />Preview com dados de exemplo
              </span>
              <span className="text-xs text-slate-600 italic">valores fictícios para visualização</span>
            </div>
            <div className="flex-1 bg-slate-200 rounded-lg overflow-auto border border-slate-700">
              <iframe
                srcDoc={previewHtml}
                title="Preview do e-mail"
                className="w-full h-full rounded-lg"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {/* Variables panel */}
      <div className="flex-shrink-0 border border-slate-800 rounded-lg bg-slate-900/50">
        <button
          onClick={() => setShowVars((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <strong>Variáveis disponíveis</strong>
            <span className="text-slate-600">— clique para inserir no editor</span>
          </span>
          {showVars ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showVars && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
            {/* Common */}
            <div>
              <p className="text-xs text-slate-500 mt-3 mb-2 font-medium uppercase tracking-wide">Comuns a todos os tipos</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_VARS.map((v) => (
                  <div key={v.key} className="flex items-center gap-1.5" title={v.description}>
                    <VarBadge varKey={v.key} onClick={insertVar} />
                    <span className="text-xs text-slate-500">{v.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Type-specific */}
            {typeVars.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
                  Específicos — {tab}
                </p>
                <div className="flex flex-wrap gap-2">
                  {typeVars.map((v) => (
                    <div key={v.key} className="flex items-center gap-1.5" title={v.description}>
                      <VarBadge varKey={v.key} onClick={insertVar} />
                      <span className="text-xs text-slate-500">{v.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
