import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tenant } from "@/types";

interface TenantStore {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  setCurrentTenant: (tenant: Tenant) => void;
  setTenants: (tenants: Tenant[]) => void;
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set) => ({
      currentTenant: null,
      tenants: [],
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setTenants: (tenants) => set({ tenants }),
    }),
    {
      name: "neurodev-tenant",
      skipHydration: true,
    }
  )
);
