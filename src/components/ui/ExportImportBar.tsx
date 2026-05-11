"use client";

import React, { useRef, useState } from "react";
import {
  Download, Upload, FileSpreadsheet, Loader2,
  CheckCircle, XCircle, AlertTriangle, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export interface ImportResult {
  total: number;
  created: number;
  errors: { row: number; message: string }[];
}

interface Props {
  entity: string;                      // e.g. "clientes", "fornecedores"
  label?: string;
  onImportSuccess?: () => void;        // callback to refresh list
  exportLabel?: string;
  importLabel?: string;
  templateLabel?: string;
}

export function ExportImportBar({
  entity,
  label,
  onImportSuccess,
  exportLabel = "Exportar",
  importLabel = "Importar",
  templateLabel = "Modelo",
}: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // ─── Template download ───────────────────────────────────────────────────

  const downloadTemplate = async () => {
    const res = await fetch(`/api/export/${entity}?template=true`);
    if (!res.ok) {
      toast({ title: "Erro ao baixar modelo", variant: "destructive" });
      return;
    }
    const blob = await res.blob();
    triggerDownload(blob, `modelo_${entity}.xlsx`);
  };

  // ─── Data export ─────────────────────────────────────────────────────────

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export/${entity}`);
      if (!res.ok) {
        toast({ title: "Erro ao exportar dados", variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const name = cd.match(/filename="(.+)"/)?.[1] ?? `${entity}_export.xlsx`;
      triggerDownload(blob, name);
    } finally {
      setExporting(false);
    }
  };

  // ─── File import ──────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({ title: "Arquivo inválido", description: "Use um arquivo .xlsx", variant: "destructive" });
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/import/${entity}`, { method: "POST", body: form });
      const data: ImportResult = await res.json();

      setResult(data);
      if (res.ok && data.created > 0) {
        toast({
          title: `${data.created} registro(s) importado(s)`,
          description: data.errors.length > 0
            ? `${data.errors.length} linha(s) com erro — verifique o painel abaixo.`
            : "Importação concluída com sucesso.",
        });
        onImportSuccess?.();
      } else if (!res.ok) {
        toast({ title: "Falha na importação", description: data.errors[0]?.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao importar arquivo", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {label && <span className="text-xs text-slate-500 mr-1">{label}</span>}

        <button
          onClick={downloadTemplate}
          title="Baixar planilha modelo para preenchimento"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50
                     text-slate-400 hover:text-white text-xs font-medium transition-colors hover:bg-slate-700"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
          {templateLabel}
        </button>

        <Button
          size="sm"
          variant="outline"
          onClick={exportData}
          disabled={exporting}
          className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 gap-1.5 h-8 text-xs"
        >
          {exporting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5" />}
          {exportLabel}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 gap-1.5 h-8 text-xs"
        >
          {importing
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Upload className="h-3.5 w-3.5" />}
          {importing ? "Importando..." : importLabel}
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Import result panel */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400">Total: <strong className="text-white">{result.total}</strong></span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" />
                {result.created} importado(s)
              </span>
              {result.errors.length > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  {result.errors.length} erro(s)
                </span>
              )}
            </div>
            <button onClick={() => setResult(null)} className="text-slate-600 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-300 bg-red-950/30 rounded px-2 py-1">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-red-400" />
                  <span><strong>Linha {e.row}:</strong> {e.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Util ────────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
