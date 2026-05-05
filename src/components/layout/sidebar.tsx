"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Inbox,
  Building2,
  Split,
  BookOpen,
  Settings,
  ChevronRight,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  FileCheck,
  FilePlus,
  FileX,
  RotateCcw,
  Clock,
  ArrowLeftRight,
  CheckCircle,
  Users,
  UserCheck,
  Building,
  GraduationCap,
  FileText,
  Landmark,
  List,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  ScrollText,
  Lock,
  Wallet,
  Send,
  Download,
  Search,
  PieChart,
  BarChart3,
  BarChart2,
  RefreshCw,
  Receipt,
  Wifi,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { label: "Visão Geral", href: "/dashboard", icon: PieChart },
      { label: "Fluxo de Caixa", href: "/dashboard/fluxo-caixa", icon: BarChart3 },
      { label: "Centro de Resultados", href: "/dashboard/centro-resultados", icon: BarChart2 },
    ],
  },
  {
    label: "Contas a Pagar",
    icon: CreditCard,
    children: [
      {
        label: "Operações",
        children: [
          {
            label: "Títulos",
            children: [
              { label: "Inclusão de Títulos", href: "/pagar/titulos/inclusao", icon: FilePlus },
              { label: "Pagamento de Títulos", href: "/pagar/titulos/pagamento", icon: FileCheck },
              { label: "Estorno de Pagamento", href: "/pagar/titulos/estorno", icon: RotateCcw },
              { label: "Cancelamento de Títulos", href: "/pagar/titulos/cancelamento", icon: FileX },
            ],
          },
          {
            label: "Notas Fiscais",
            children: [
              { label: "Importar NF-e / DANFE", href: "/pagar/notas-fiscais", icon: Receipt },
            ],
          },
          {
            label: "Adiantamento a Fornecedor",
            children: [
              { label: "Inclusão ADF", href: "/pagar/adf/inclusao", icon: FilePlus },
              { label: "Acerto ADF", href: "/pagar/adf/acerto", icon: CheckCircle },
              { label: "Estorno Acerto ADF", href: "/pagar/adf/estorno", icon: RotateCcw },
            ],
          },
          {
            label: "Manutenção",
            children: [
              { label: "Altera Títulos", href: "/pagar/manutencao/altera-titulos", icon: FileText },
              { label: "Altera Vencimento em Massa", href: "/pagar/manutencao/altera-vencimento", icon: Clock },
              { label: "Altera Valor de Título", href: "/pagar/manutencao/altera-valor", icon: ArrowLeftRight },
              { label: "Altera Juros/Desconto", href: "/pagar/manutencao/altera-juros", icon: TrendingDown },
            ],
          },
        ],
      },
      {
        label: "Aprovações (Alçada)",
        children: [
          { label: "Pendentes", href: "/pagar/aprovacoes/pendentes", icon: Clock },
          { label: "Aprovadas/Rejeitadas", href: "/pagar/aprovacoes/historico", icon: CheckCircle },
          { label: "Delegar Aprovações", href: "/pagar/aprovacoes/delegar", icon: UserCheck },
        ],
      },
      {
        label: "Remessas",
        children: [
          { label: "Geração de Remessa", href: "/pagar/remessas/geracao", icon: Send },
          { label: "Retorno de Remessa", href: "/pagar/remessas/retorno", icon: Download },
          { label: "Consulta Remessas", href: "/pagar/remessas/consulta", icon: Search },
        ],
      },
      {
        label: "Consultas",
        children: [
          { label: "Títulos (por Credor)", href: "/pagar/consultas/titulos", icon: List },
          { label: "Contabilização", href: "/pagar/consultas/contabilizacao", icon: BookOpen },
          { label: "Relatórios", href: "/pagar/consultas/relatorios", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: "Contas a Receber",
    icon: Inbox,
    children: [
      {
        label: "Operações",
        children: [
          {
            label: "Títulos",
            children: [
              { label: "Inclusão de Títulos", href: "/receber/titulos/inclusao", icon: FilePlus },
              { label: "Recebimento de Títulos", href: "/receber/titulos/recebimento", icon: FileCheck },
              { label: "Estorno de Recebimento", href: "/receber/titulos/estorno", icon: RotateCcw },
              { label: "Cancelamento de Títulos", href: "/receber/titulos/cancelamento", icon: FileX },
            ],
          },
          {
            label: "Manutenção",
            children: [
              { label: "Altera Títulos", href: "/receber/manutencao/altera-titulos", icon: FileText },
              { label: "Altera Juros/Multa/Desconto", href: "/receber/manutencao/altera-juros", icon: TrendingUp },
            ],
          },
        ],
      },
      {
        label: "Remessas",
        children: [
          { label: "Geração de Remessa", href: "/receber/remessas/geracao", icon: Send },
          { label: "Retorno de Remessa", href: "/receber/remessas/retorno", icon: Download },
          { label: "Consulta Remessas", href: "/receber/remessas/consulta", icon: Search },
        ],
      },
      {
        label: "Consultas",
        children: [
          { label: "Títulos (por Cliente/Aluno)", href: "/receber/consultas/titulos", icon: List },
          { label: "Inadimplência", href: "/receber/consultas/inadimplencia", icon: AlertTriangle },
          { label: "Contabilização", href: "/receber/consultas/contabilizacao", icon: BookOpen },
          { label: "Relatórios", href: "/receber/consultas/relatorios", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: "Integrações Bancárias",
    icon: Landmark,
    children: [
      {
        label: "Layouts de Remessa",
        children: [
          { label: "CNAB 240 (Pagamento)", href: "/bancario/remessa/cnab240-pagamento", icon: Send },
          { label: "CNAB 400 (Cobrança)", href: "/bancario/remessa/cnab400-cobranca", icon: Send },
          { label: "CNAB 240 (Cobrança)", href: "/bancario/remessa/cnab240-cobranca", icon: Send },
        ],
      },
      {
        label: "Layouts de Retorno",
        children: [
          { label: "CNAB 240 (Pagamento)", href: "/bancario/retorno/cnab240-pagamento", icon: Download },
          { label: "CNAB 400 (Retorno Cobrança)", href: "/bancario/retorno/cnab400-cobranca", icon: Download },
          { label: "CNAB 240 (Retorno Cobrança)", href: "/bancario/retorno/cnab240-cobranca", icon: Download },
        ],
      },
      { label: "Open Finance (Pluggy)", href: "/bancario/open-finance", icon: Wifi },
      { label: "Configuração de Convênios", href: "/bancario/convenios", icon: Settings },
      { label: "Log de Integrações", href: "/bancario/log", icon: ScrollText },
    ],
  },
  {
    label: "Rateio",
    icon: Split,
    children: [
      {
        label: "Configuração de Critérios",
        children: [
          { label: "Por Aluno", href: "/rateio/criterios/aluno", icon: Users },
          { label: "Por Turma", href: "/rateio/criterios/turma", icon: GraduationCap },
          { label: "Por Professor", href: "/rateio/criterios/professor", icon: UserCheck },
          { label: "Avulso", href: "/rateio/criterios/avulso", icon: Building },
        ],
      },
      { label: "Rateio Manual", href: "/rateio/manual", icon: Split },
      { label: "Rateio Automático", href: "/rateio/automatico", icon: RefreshCw },
      { label: "Consulta Rateios", href: "/rateio/consulta", icon: Search },
    ],
  },
  {
    label: "Cadastros",
    icon: BookOpen,
    children: [
      { label: "Plano de Contas", href: "/cadastros/plano-contas", icon: List },
      { label: "Centros de Custo", href: "/cadastros/centros-custo", icon: Building2 },
      { label: "Fornecedores/Credores", href: "/cadastros/fornecedores", icon: Wallet },
      { label: "Clientes/Alunos", href: "/cadastros/clientes", icon: Users },
      { label: "Turmas/Professores", href: "/cadastros/turmas", icon: GraduationCap },
      { label: "Contratos", href: "/cadastros/contratos", icon: FileText },
      { label: "Convênios Bancários", href: "/cadastros/convenios-bancarios", icon: Landmark },
      { label: "Grupo Econômico", href: "/cadastros/grupo-economico", icon: Building2 },
      { label: "Empresas", href: "/cadastros/empresas", icon: Building },
    ],
  },
  {
    label: "Administração",
    icon: Settings,
    children: [
      { label: "Usuários e Permissões", href: "/admin/usuarios", icon: Users },
      { label: "Alçadas de Aprovação", href: "/admin/alcadas", icon: ShieldCheck },
      { label: "Integrações (Boleto/NF-e)", href: "/admin/integracoes", icon: Plug },
      { label: "Parâmetros do Sistema", href: "/admin/parametros", icon: Sliders },
      { label: "Log de Auditoria", href: "/admin/auditoria", icon: ScrollText },
      { label: "LGPD/Privacidade", href: "/admin/lgpd", icon: Lock },
      { label: "Configurações Gerais", href: "/admin/configuracoes", icon: Settings },
    ],
  },
];

interface NavItemComponentProps {
  item: NavItem;
  depth?: number;
  isCollapsed?: boolean;
}

function NavItemComponent({ item, depth = 0, isCollapsed = false }: NavItemComponentProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((child) => {
      if (child.href && pathname.startsWith(child.href)) return true;
      if (child.children) {
        return child.children.some(
          (grandchild) => grandchild.href && pathname.startsWith(grandchild.href)
        );
      }
      return false;
    });
  });

  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            depth === 0 && "font-semibold text-xs uppercase tracking-wider text-sidebar-foreground/50 mt-4 px-3 py-1",
            depth > 0 && "pl-" + (depth * 4 + 3)
          )}
          style={{ paddingLeft: depth > 0 ? `${depth * 16 + 12}px` : undefined }}
        >
          {item.icon && depth === 0 && (
            <item.icon className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
          )}
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
              )}
            </>
          )}
        </button>
        {isOpen && !isCollapsed && (
          <div className="mt-1">
            {item.children.map((child, index) => (
              <NavItemComponent key={index} item={child} depth={depth + 1} isCollapsed={isCollapsed} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? "#"}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
      )}
      style={{ paddingLeft: `${depth * 16 + 12}px` }}
    >
      {item.icon && (
        <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-sidebar-primary-foreground" : "opacity-60")} />
      )}
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-4 border-b border-sidebar-border", isCollapsed && "justify-center px-2")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
          <span className="text-sidebar-primary-foreground font-bold text-sm">N</span>
        </div>
        {!isCollapsed && (
          <div>
            <p className="text-sidebar-foreground font-bold text-sm leading-tight">NeuroDev</p>
            <p className="text-sidebar-foreground/50 text-xs">Financeiro SRV</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-0.5">
          {navigation.map((item, index) => (
            <NavItemComponent key={index} item={item} depth={0} isCollapsed={isCollapsed} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-sidebar-foreground/30 text-xs text-center">
            v1.0.0 · NeuroDev FIN
          </p>
        </div>
      )}
    </div>
  );
}
