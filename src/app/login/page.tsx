"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, Building2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha inválidos.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 mb-4">
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">NeuroDev Financeiro</h1>
        <p className="text-slate-400 text-sm mt-1">Sistema de Gestão Financeira Educacional</p>
      </div>

      {/* Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-6">Entrar na sua conta</h2>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-800 rounded-lg mb-4 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Dev hint */}
        <div className="mt-6 p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
          <p className="text-xs text-slate-400 font-medium mb-1">Credenciais de desenvolvimento:</p>
          <p className="text-xs text-slate-300">
            <span className="text-slate-400">E-mail:</span> admin@neurodev.com
          </p>
          <p className="text-xs text-slate-300">
            <span className="text-slate-400">Senha:</span> admin123
          </p>
        </div>
      </div>

      <p className="text-center text-slate-500 text-xs mt-6">
        © 2026 NeuroDev Financeiro SRV. Todos os direitos reservados.
      </p>
    </div>
  );
}
