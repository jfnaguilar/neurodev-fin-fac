"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  AlertTriangle, Download, Search, TrendingDown, Users,
  FileX, ChevronDown, ChevronRight, RefreshCw, X, Mail, Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentTitle {
  id: string;
  documentNumber: string | null;
  documentType: string;
  dueDate: string;
  daysOverdue: number;
  currentBalance: number;
  originalValue: number;
}

interface StudentRow {
  customerId: string;
  customerName: string;
  enrollmentId: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  titlesCount: number;
  totalBalance: number;
  maxDaysOverdue: number;
  oldestDueDate: string;
  agingLabel: string;
  titles: StudentTitle[];
}

interface AgingBucket {
  range: string;
  value: number;
  count: number;
  students: number;
}

interface Summary {
  totalAmount: number;
  totalStudents: number;
  totalTitles: number;
  avgDaysOverdue: number;
  overdueRate: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGING_COLORS: Record<string, string> = {
  "1–15 dias":  "#fbbf24",
  "16–30 dias": "#f97316",
  "31–60 dias": "#ef4444",
  "61–90 dias": "#dc2626",
  "+90 dias":   "#7f1d1d",
};

const PIE_COLORS = ["#fbbf24", "#f97316", "#ef4444", "#dc2626", "#7f1d1d"];

function agingColor(days: number): string {
  if (days <= 15) return "text-yellow-400";
  if (days <= 30) return "text-orange-400";
  if (days <= 60) return "text-red-400";
  if (days <= 90) return "text-red-500";
  return "text-red-700";
}

function agingBadgeClass(label: string): string {
  const map: Record<string, string> = {
    "1–15 dias":  "bg-yellow-900/40 text-yellow-300 border-yellow-700",
    "16–30 dias": "bg-orange-900/40 text-orange-300 border-orange-700",
    "31–60 dias": "bg-red-900/40 text-red-300 border-red-700",
    "61–90 dias": "bg-red-900/60 text-red-200 border-red-600",
    "+90 dias":   "bg-red-950 text-red-100 border-red-500",
  };
  return map[label] ?? "bg-slate-800 text-slate-300 border-slate-600";
}

const docTypeLabel: Record<string, string> = {
  CONTRACT: "Contrato", ENROLLMENT: "Matrícula", REENROLLMENT: "Rematrícula",
  RECEIPT: "Recibo", OTHER: "Outro",
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function AgingTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as AgingBucket;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-slate-300">{d.students} aluno(s) · {d.count} título(s)</p>
      <p className="text-red-300 font-bold">{formatCurrency(d.value)}</p>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, accent = false }:
  { icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Card className={accent ? "border-red-800/50 bg-red-950/20" : ""}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-red-900/40" : "bg-slate-800"}`}>
            <Icon className={`h-5 w-5 ${accent ? "text-red-400" : "text-slate-400"}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold tabular-nums ${accent ? "text-red-300" : ""}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Expandable student row ────────────────────────────────────────────────────

function StudentRow({ student, onEmail }: { student: StudentRow; onEmail: (s: StudentRow) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b hover:bg-slate-800/30 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-3 px-3 w-8">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            : <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
        </td>
        <td className="py-3 px-3">
          <div className="font-medium text-sm leading-tight">{student.customerName}</div>
          {student.enrollmentId && (
            <div className="text-xs text-slate-500 font-mono">{student.enrollmentId}</div>
          )}
        </td>
        <td className="py-3 px-3 hidden md:table-cell">
          {student.email && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Mail className="h-3 w-3" />{student.email}
            </div>
          )}
          {student.phone && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Phone className="h-3 w-3" />{student.phone}
            </div>
          )}
        </td>
        <td className="py-3 px-3 text-center">
          <span className="text-xs text-slate-400">{student.titlesCount}</span>
        </td>
        <td className="py-3 px-3 text-center">
          <Badge className={`text-xs border ${agingBadgeClass(student.agingLabel)}`}>
            {student.maxDaysOverdue}d
          </Badge>
        </td>
        <td className="py-3 px-3 text-center hidden sm:table-cell">
          <span className="text-xs text-slate-500">{formatDate(new Date(student.oldestDueDate))}</span>
        </td>
        <td className="py-3 px-3 text-right">
          <span className="font-bold text-red-400 tabular-nums text-sm">
            {formatCurrency(student.totalBalance)}
          </span>
        </td>
        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={() => onEmail(student)}
          >
            <Mail className="h-3 w-3 mr-1" />Cobrar
          </Button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b bg-slate-900/50">
          <td colSpan={8} className="py-0">
            <div className="px-8 py-3">
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Títulos em aberto</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-1.5 text-left font-medium">Documento</th>
                    <th className="pb-1.5 text-left font-medium">Tipo</th>
                    <th className="pb-1.5 text-center font-medium">Vencimento</th>
                    <th className="pb-1.5 text-center font-medium">Atraso</th>
                    <th className="pb-1.5 text-right font-medium">Valor Original</th>
                    <th className="pb-1.5 text-right font-medium">Saldo Devedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {student.titles.map((t) => (
                    <tr key={t.id}>
                      <td className="py-1.5 font-mono text-slate-300">{t.documentNumber ?? "—"}</td>
                      <td className="py-1.5 text-slate-400">{docTypeLabel[t.documentType] ?? t.documentType}</td>
                      <td className="py-1.5 text-center text-slate-400">{formatDate(new Date(t.dueDate))}</td>
                      <td className={`py-1.5 text-center font-bold ${agingColor(t.daysOverdue)}`}>
                        {t.daysOverdue}d
                      </td>
                      <td className="py-1.5 text-right text-slate-400 tabular-nums">{formatCurrency(t.originalValue)}</td>
                      <td className="py-1.5 text-right font-bold text-red-400 tabular-nums">{formatCurrency(t.currentBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InadimplenciaPage() {
  const [search, setSearch]   = useState("");
  const [aging, setAging]     = useState("ALL");
  const [minDays, setMinDays] = useState("1");
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState<{
    summary: Summary;
    agingChartData: AgingBucket[];
    students: StudentRow[];
  } | null>(null);

  const fetchData = useCallback(async (params?: { search?: string; aging?: string; minDays?: string }) => {
    setLoading(true);
    try {
      const s  = params?.search  ?? search;
      const a  = params?.aging   ?? aging;
      const md = params?.minDays ?? minDays;
      const qs = new URLSearchParams({
        ...(s  ? { search: s } : {}),
        aging: a,
        minDays: md,
      });
      const res = await fetch(`/api/receber/inadimplencia?${qs}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, aging, minDays]);

  // Initial load
  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => fetchData();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") fetchData();
  };

  const clearFilters = () => {
    setSearch(""); setAging("ALL"); setMinDays("1");
    fetchData({ search: "", aging: "ALL", minDays: "1" });
  };

  const hasFilters = search !== "" || aging !== "ALL" || minDays !== "1";

  // Email placeholder (replace with EnviarCobrancaButton when integrating)
  const handleEmail = (student: StudentRow) => {
    alert(`Enviar cobrança para ${student.customerName} (${student.email ?? "sem e-mail"})`);
  };

  // Pie chart data (students per aging bucket)
  const pieData = data?.agingChartData
    .filter((d) => d.students > 0)
    .map((d) => ({ name: d.range, value: d.students })) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Inadimplência
          </h1>
          <p className="text-sm text-muted-foreground">Contas a Receber › Consultas › Inadimplência</p>
        </div>
        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white">
          <Download className="h-3.5 w-3.5 mr-1.5" />Exportar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, matrícula ou CPF/CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={aging} onValueChange={(v) => { setAging(v); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Faixa de atraso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os atrasos</SelectItem>
                  <SelectItem value="1-15">1 a 15 dias</SelectItem>
                  <SelectItem value="16-30">16 a 30 dias</SelectItem>
                  <SelectItem value="31-60">31 a 60 dias</SelectItem>
                  <SelectItem value="61-90">61 a 90 dias</SelectItem>
                  <SelectItem value="90+">Acima de 90 dias</SelectItem>
                </SelectContent>
              </Select>
              <Select value={minDays} onValueChange={(v) => setMinDays(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Mínimo de dias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">A partir de 1 dia</SelectItem>
                  <SelectItem value="15">A partir de 15 dias</SelectItem>
                  <SelectItem value="30">A partir de 30 dias</SelectItem>
                  <SelectItem value="60">A partir de 60 dias</SelectItem>
                  <SelectItem value="90">A partir de 90 dias</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-400 hover:text-white">
                  <X className="h-3.5 w-3.5 mr-1" />Limpar
                </Button>
              )}
              <Button size="sm" onClick={handleSearch} disabled={loading}>
                {loading
                  ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  : <Search className="h-3.5 w-3.5 mr-1.5" />}
                Pesquisar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={AlertTriangle}
              label="Total Inadimplente"
              value={formatCurrency(data.summary.totalAmount)}
              accent
            />
            <KpiCard
              icon={Users}
              label="Alunos Inadimplentes"
              value={String(data.summary.totalStudents)}
              sub={`${data.summary.overdueRate.toFixed(1)}% da carteira`}
            />
            <KpiCard
              icon={FileX}
              label="Títulos Vencidos"
              value={String(data.summary.totalTitles)}
            />
            <KpiCard
              icon={TrendingDown}
              label="Atraso Médio"
              value={`${data.summary.avgDaysOverdue} dias`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Aging bar chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Aging — Valor por Faixa de Atraso</CardTitle>
                <CardDescription>Saldo devedor agrupado por tempo de inadimplência</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.agingChartData} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false} tickLine={false} width={56}
                    />
                    <Tooltip content={<AgingTooltip />} />
                    <Bar dataKey="value" name="Valor" radius={[5, 5, 0, 0]}>
                      {data.agingChartData.map((entry, i) => (
                        <Cell key={i} fill={AGING_COLORS[entry.range] ?? "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie chart — students per bucket */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Alunos por Faixa</CardTitle>
                <CardDescription>Distribuição de alunos inadimplentes</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                    Nenhum dado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        outerRadius={75}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, value }) => value > 0 ? `${value}` : ""}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`${v} aluno(s)`, "Qtd"]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      />
                      <Legend
                        iconSize={9}
                        formatter={(value) => <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Students table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Relação de Inadimplentes</CardTitle>
                  <CardDescription>
                    {data.students.length === 0
                      ? "Nenhum aluno encontrado"
                      : `${data.students.length} aluno(s) · clique na linha para expandir os títulos`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.students.length === 0 ? (
                <div className="py-14 text-center text-muted-foreground text-sm">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                  Nenhuma inadimplência encontrada para os filtros selecionados.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/20">
                    <tr>
                      <th className="py-3 px-3 w-8" />
                      <th className="py-3 px-3 text-left font-medium text-muted-foreground">Aluno</th>
                      <th className="py-3 px-3 text-left font-medium text-muted-foreground hidden md:table-cell">Contato</th>
                      <th className="py-3 px-3 text-center font-medium text-muted-foreground">Títulos</th>
                      <th className="py-3 px-3 text-center font-medium text-muted-foreground">Atraso</th>
                      <th className="py-3 px-3 text-center font-medium text-muted-foreground hidden sm:table-cell">Venc. mais antigo</th>
                      <th className="py-3 px-3 text-right font-medium text-muted-foreground">Saldo Devedor</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((student) => (
                      <StudentRow key={student.customerId} student={student} onEmail={handleEmail} />
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/20">
                    <tr>
                      <td colSpan={6} className="py-3 px-3 text-sm text-muted-foreground">
                        {data.summary.totalStudents} aluno(s) · {data.summary.totalTitles} título(s)
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-red-400 tabular-nums">
                        {formatCurrency(data.summary.totalAmount)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state on first load */}
      {!data && !loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Search className="h-5 w-5 mr-2" />
          Use os filtros acima para pesquisar inadimplentes.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          Carregando dados...
        </div>
      )}
    </div>
  );
}
