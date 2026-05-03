import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function formatCNPJ(cnpj: string): string {
  return cnpj
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

export function formatCPF(cpf: string): string {
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

export function getTitleSituationLabel(situation: string): string {
  const labels: Record<string, string> = {
    PENDING_APPROVAL: "Pendente Aprovação",
    RELEASED: "Liberado",
    PAID: "Pago",
    RECEIVED: "Recebido",
    CANCELED: "Cancelado",
    AGREED: "Acordado",
    BANK: "Banco",
    OVERDUE: "Vencido",
  };
  return labels[situation] ?? situation;
}

export function getTitleSituationColor(situation: string): string {
  const colors: Record<string, string> = {
    PENDING_APPROVAL: "text-yellow-600 bg-yellow-50",
    RELEASED: "text-blue-600 bg-blue-50",
    PAID: "text-green-600 bg-green-50",
    RECEIVED: "text-green-600 bg-green-50",
    CANCELED: "text-gray-600 bg-gray-50",
    AGREED: "text-purple-600 bg-purple-50",
    BANK: "text-indigo-600 bg-indigo-50",
    OVERDUE: "text-red-600 bg-red-50",
  };
  return colors[situation] ?? "text-gray-600 bg-gray-50";
}

export function isOverdue(dueDate: Date | string): boolean {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return due < new Date();
}

export function daysDiff(date1: Date | string, date2: Date | string = new Date()): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
