import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.currentTenantId = (user as any).currentTenantId;
        token.tenants = (user as any).tenants;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).currentTenantId = token.currentTenantId;
        (session.user as any).tenants = token.tenants;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(4) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // DEV fallback: allow admin@neurodev.com / admin123
        if (
          email === "admin@neurodev.com" &&
          password === "admin123"
        ) {
          return {
            id: "dev-admin",
            name: "Administrador",
            email: "admin@neurodev.com",
            currentTenantId: "dev-tenant",
            tenants: [
              {
                id: "dev-tenant",
                cnpj: "12345678000190",
                companyName: "NeuroDev Faculdade Ltda",
                tradeName: "NeuroDev Faculdade",
                economicGroupId: "dev-group",
              },
            ],
          } as any;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              tenantRoles: {
                where: { isActive: true },
                include: {
                  tenant: true,
                },
              },
            },
          });

          if (!user || !user.passwordHash || !user.isActive) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          const tenants = user.tenantRoles.map((r: typeof user.tenantRoles[0]) => ({
            id: r.tenant.id,
            cnpj: r.tenant.cnpj,
            companyName: r.tenant.companyName,
            tradeName: r.tenant.tradeName,
            economicGroupId: r.tenant.economicGroupId,
          }));

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            currentTenantId: tenants[0]?.id ?? null,
            tenants,
          } as any;
        } catch {
          // DB not available — deny
          return null;
        }
      },
    }),
  ],
});
