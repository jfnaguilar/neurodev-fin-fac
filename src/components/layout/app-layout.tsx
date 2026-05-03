"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useTenantStore } from "@/store/tenant";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    useTenantStore.persist.rehydrate();
    setTimeout(() => {
      const { tenants, currentTenant, setTenants, setCurrentTenant } = useTenantStore.getState();
      if (tenants.length === 0) {
        const mockTenants = [
          { id: "1", cnpj: "12345678000195", companyName: "NeuroDev Faculdade Ltda", tradeName: "NeuroDev", economicGroupId: "GRP-001", economicGroupName: "Grupo NeuroDev Educacional" },
          { id: "2", cnpj: "98765432000117", companyName: "NeuroDev Instituto de Pesquisa Ltda", tradeName: "NeuroDev Pesquisa", economicGroupId: "GRP-001", economicGroupName: "Grupo NeuroDev Educacional" },
        ];
        setTenants(mockTenants);
        if (!currentTenant) setCurrentTenant(mockTenants[0]);
      }
    }, 0);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          pendingApprovals={3}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
