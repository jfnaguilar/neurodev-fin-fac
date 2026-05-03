"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, ChevronDown, Menu, Moon, Sun, Search, Building2,
  User, Settings, LogOut, X, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTenantStore } from "@/store/tenant";
import { formatCNPJ, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const ALL_PAGES = [
  { label: "Visão Geral", href: "/dashboard", group: "Dashboard" },
  { label: "Fluxo de Caixa", href: "/dashboard/fluxo-caixa", group: "Dashboard" },
  { label: "Centro de Resultados", href: "/dashboard/centro-resultados", group: "Dashboard" },
  { label: "Inclusão de Títulos", href: "/pagar/titulos/inclusao", group: "Contas a Pagar" },
  { label: "Pagamento de Títulos", href: "/pagar/titulos/pagamento", group: "Contas a Pagar" },
  { label: "Estorno de Pagamento", href: "/pagar/titulos/estorno", group: "Contas a Pagar" },
  { label: "Cancelamento de Títulos (Pagar)", href: "/pagar/titulos/cancelamento", group: "Contas a Pagar" },
  { label: "Importar NF-e / DANFE", href: "/pagar/notas-fiscais", group: "Contas a Pagar" },
  { label: "Aprovações Pendentes", href: "/pagar/aprovacoes/pendentes", group: "Contas a Pagar" },
  { label: "Geração de Remessa (Pagar)", href: "/pagar/remessas/geracao", group: "Contas a Pagar" },
  { label: "Títulos por Credor", href: "/pagar/consultas/titulos", group: "Contas a Pagar" },
  { label: "Relatórios a Pagar", href: "/pagar/consultas/relatorios", group: "Contas a Pagar" },
  { label: "Inclusão de Títulos", href: "/receber/titulos/inclusao", group: "Contas a Receber" },
  { label: "Recebimento de Títulos", href: "/receber/titulos/recebimento", group: "Contas a Receber" },
  { label: "Estorno de Recebimento", href: "/receber/titulos/estorno", group: "Contas a Receber" },
  { label: "Cancelamento de Títulos (Receber)", href: "/receber/titulos/cancelamento", group: "Contas a Receber" },
  { label: "Inadimplência", href: "/receber/consultas/inadimplencia", group: "Contas a Receber" },
  { label: "Títulos por Cliente", href: "/receber/consultas/titulos", group: "Contas a Receber" },
  { label: "Relatórios a Receber", href: "/receber/consultas/relatorios", group: "Contas a Receber" },
  { label: "CNAB 240 Pagamento", href: "/bancario/remessa/cnab240-pagamento", group: "Bancário" },
  { label: "CNAB 400 Cobrança", href: "/bancario/remessa/cnab400-cobranca", group: "Bancário" },
  { label: "CNAB 240 Cobrança", href: "/bancario/remessa/cnab240-cobranca", group: "Bancário" },
  { label: "Log de Integrações", href: "/bancario/log", group: "Bancário" },
  { label: "Convênios Bancários (Config.)", href: "/bancario/convenios", group: "Bancário" },
  { label: "Plano de Contas", href: "/cadastros/plano-contas", group: "Cadastros" },
  { label: "Centros de Custo", href: "/cadastros/centros-custo", group: "Cadastros" },
  { label: "Fornecedores/Credores", href: "/cadastros/fornecedores", group: "Cadastros" },
  { label: "Clientes/Alunos", href: "/cadastros/clientes", group: "Cadastros" },
  { label: "Turmas/Professores", href: "/cadastros/turmas", group: "Cadastros" },
  { label: "Contratos", href: "/cadastros/contratos", group: "Cadastros" },
  { label: "Convênios Bancários", href: "/cadastros/convenios-bancarios", group: "Cadastros" },
  { label: "Grupo Econômico", href: "/cadastros/grupo-economico", group: "Cadastros" },
  { label: "Empresas", href: "/cadastros/empresas", group: "Cadastros" },
  { label: "Rateio Automático", href: "/rateio/automatico", group: "Rateio" },
  { label: "Consulta Rateios", href: "/rateio/consulta", group: "Rateio" },
  { label: "Usuários e Permissões", href: "/admin/usuarios", group: "Administração" },
  { label: "Alçadas de Aprovação", href: "/admin/alcadas", group: "Administração" },
  { label: "Parâmetros do Sistema", href: "/admin/parametros", group: "Administração" },
  { label: "Configurações Gerais", href: "/admin/configuracoes", group: "Administração" },
  { label: "Log de Auditoria", href: "/admin/auditoria", group: "Administração" },
  { label: "LGPD/Privacidade", href: "/admin/lgpd", group: "Administração" },
];

interface HeaderProps {
  onToggleSidebar: () => void;
  pendingApprovals?: number;
}

export function Header({ onToggleSidebar, pendingApprovals = 0 }: HeaderProps) {
  const { currentTenant, tenants, setCurrentTenant } = useTenantStore();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("Administrador");
  const [profileEmail, setProfileEmail] = useState("admin@neurodev.com");

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const filteredPages = searchQuery.length >= 1
    ? ALL_PAGES.filter((p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.group.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_PAGES.slice(0, 10);

  const handleNavigate = (href: string) => {
    router.push(href);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSaveProfile = () => {
    toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas." });
    setProfileOpen(false);
  };

  const userInitial = profileName.charAt(0).toUpperCase();
  const economicGroupName = currentTenant?.economicGroupName ?? "—";

  return (
    <header className="h-14 border-b bg-background flex items-center gap-3 px-4 shrink-0">
      {/* Hamburger */}
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="shrink-0">
        <Menu className="h-4 w-4" />
      </Button>

      {/* Tenant Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 max-w-[280px]">
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs font-semibold truncate leading-tight">
                {currentTenant?.companyName ?? "Selecionar Empresa"}
              </span>
              {currentTenant && (
                <span className="text-xs text-muted-foreground leading-tight">
                  {formatCNPJ(currentTenant.cnpj)}
                </span>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel>Selecionar Empresa</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => setCurrentTenant(tenant)}
              className={cn(
                "flex flex-col items-start gap-0.5 cursor-pointer py-2",
                currentTenant?.id === tenant.id && "bg-accent"
              )}
            >
              <span className="font-medium text-sm">{tenant.companyName}</span>
              <span className="text-xs text-muted-foreground">{formatCNPJ(tenant.cnpj)}</span>
              <span className="text-xs text-muted-foreground">{tenant.economicGroupName}</span>
            </DropdownMenuItem>
          ))}
          {tenants.length === 0 && (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground text-sm">Nenhuma empresa cadastrada</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSearchOpen(true)}>
        <Search className="h-4 w-4" />
      </Button>

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {pendingApprovals > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                {pendingApprovals > 9 ? "9+" : pendingApprovals}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Notificações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {pendingApprovals > 0 ? (
            <DropdownMenuItem onClick={() => router.push("/pagar/aprovacoes/pendentes")}>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">Aprovações Pendentes</span>
                <span className="text-xs text-muted-foreground">
                  {pendingApprovals} título(s) aguardando aprovação
                </span>
              </div>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground text-sm">Nenhuma notificação</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 pl-2">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-semibold">{userInitial}</span>
            </div>
            <span className="hidden md:block text-sm">{profileName}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="pb-2">
            <p className="font-semibold text-sm">{profileName}</p>
            <p className="text-xs text-muted-foreground font-normal">{profileEmail}</p>
            <div className="mt-2 pt-2 border-t space-y-0.5">
              <p className="text-xs font-normal">
                <span className="font-medium text-foreground">Grupo: </span>
                <span className="text-muted-foreground">{economicGroupName}</span>
              </p>
              <p className="text-xs font-normal">
                <span className="font-medium text-foreground">Empresa: </span>
                <span className="text-muted-foreground">{currentTenant?.companyName ?? "—"}</span>
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <User className="h-3.5 w-3.5 mr-2" />Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/admin/configuracoes")}>
            <Settings className="h-3.5 w-3.5 mr-2" />Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <LogOut className="h-3.5 w-3.5 mr-2" />Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Search Dialog ── */}
      {searchOpen && (
        <Dialog
          open={searchOpen}
          onOpenChange={(open) => {
            setSearchOpen(open);
            if (!open) setSearchQuery("");
          }}
        >
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                autoFocus
                placeholder="Buscar página ou funcionalidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                  if (e.key === "Enter" && filteredPages.length > 0) handleNavigate(filteredPages[0].href);
                }}
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSearchOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {filteredPages.map((page) => (
                <button
                  key={page.href}
                  onClick={() => handleNavigate(page.href)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/60 text-left transition-colors"
                >
                  <span className="font-medium">{page.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{page.group}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
              {filteredPages.length === 0 && (
                <p className="px-4 py-8 text-sm text-center text-muted-foreground">
                  Nenhum resultado para &ldquo;{searchQuery}&rdquo;
                </p>
              )}
            </div>
            <div className="border-t px-4 py-2 text-xs text-muted-foreground flex justify-between">
              <span>{searchQuery ? `${filteredPages.length} resultado(s)` : "Digite para buscar"}</span>
              <span className="opacity-60">↵ para navegar</span>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Profile Dialog ── */}
      {profileOpen && (
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Meu Perfil</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
                  {userInitial}
                </div>
                <div>
                  <p className="font-semibold">{profileName}</p>
                  <p className="text-sm text-muted-foreground">Administrador</p>
                  <p className="text-xs text-muted-foreground">{economicGroupName} · {currentTenant?.companyName}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nome Completo <span className="text-red-500">*</span></Label>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nova Senha</Label>
                <Input type="password" placeholder="Deixe em branco para não alterar" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar Nova Senha</Label>
                <Input type="password" placeholder="Confirme a nova senha" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveProfile} disabled={!profileName || !profileEmail}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}
