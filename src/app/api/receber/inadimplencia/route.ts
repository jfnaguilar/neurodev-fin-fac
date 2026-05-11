import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

// ─── Aging bucket helpers ─────────────────────────────────────────────────────

function agingLabel(days: number): string {
  if (days <= 15) return "1–15 dias";
  if (days <= 30) return "16–30 dias";
  if (days <= 60) return "31–60 dias";
  if (days <= 90) return "61–90 dias";
  return "+90 dias";
}

const AGING_ORDER = ["1–15 dias", "16–30 dias", "31–60 dias", "61–90 dias", "+90 dias"];

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const url = new URL(req.url);
  const search    = url.searchParams.get("search")?.trim() ?? "";
  const aging     = url.searchParams.get("aging") ?? "ALL";   // ALL | 1-15 | 16-30 | 31-60 | 61-90 | 90+
  const minDays   = parseInt(url.searchParams.get("minDays") ?? "1", 10);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Fetch overdue titles ──────────────────────────────────────────────────
  const titles = await prisma.receivableTitle.findMany({
    where: {
      tenantId,
      currentBalance: { gt: 0 },
      dueDate: { lt: today },
      situation: { in: ["OVERDUE", "RELEASED"] },
      customer: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { enrollmentId: { contains: search, mode: "insensitive" } },
              { document: { contains: search } },
            ],
          }
        : undefined,
    },
    include: { customer: true },
    orderBy: { dueDate: "asc" },
  });

  // ── Compute days overdue per title ────────────────────────────────────────
  const titlesWithDays = titles.map((t) => ({
    ...t,
    daysOverdue: differenceInDays(today, t.dueDate),
  }));

  // ── Apply aging + minDays filter ──────────────────────────────────────────
  const filtered = titlesWithDays.filter((t) => {
    if (t.daysOverdue < minDays) return false;
    if (aging === "ALL") return true;
    const label = agingLabel(t.daysOverdue);
    const map: Record<string, string> = {
      "1-15": "1–15 dias",
      "16-30": "16–30 dias",
      "31-60": "31–60 dias",
      "61-90": "61–90 dias",
      "90+": "+90 dias",
    };
    return label === map[aging];
  });

  // ── Group by customer ─────────────────────────────────────────────────────
  const byCustomer = new Map<
    string,
    {
      customerId: string;
      customerName: string;
      enrollmentId: string | null;
      email: string | null;
      phone: string | null;
      document: string | null;
      titles: typeof filtered;
    }
  >();

  for (const t of filtered) {
    const cid = t.customerId;
    if (!byCustomer.has(cid)) {
      byCustomer.set(cid, {
        customerId: cid,
        customerName: t.customer.name,
        enrollmentId: t.customer.enrollmentId ?? null,
        email: t.customer.email ?? null,
        phone: t.customer.phone ?? null,
        document: t.customer.document ?? null,
        titles: [],
      });
    }
    byCustomer.get(cid)!.titles.push(t);
  }

  const students = Array.from(byCustomer.values())
    .map((s) => {
      const totalBalance   = s.titles.reduce((acc, t) => acc + Number(t.currentBalance), 0);
      const maxDaysOverdue = Math.max(...s.titles.map((t) => t.daysOverdue));
      const oldestDueDate  = s.titles[0].dueDate; // already sorted asc
      return {
        customerId:    s.customerId,
        customerName:  s.customerName,
        enrollmentId:  s.enrollmentId,
        email:         s.email,
        phone:         s.phone,
        document:      s.document,
        titlesCount:   s.titles.length,
        totalBalance,
        maxDaysOverdue,
        oldestDueDate,
        agingLabel:    agingLabel(maxDaysOverdue),
        titles: s.titles.map((t) => ({
          id:             t.id,
          documentNumber: t.documentNumber,
          documentType:   t.documentType,
          dueDate:        t.dueDate,
          daysOverdue:    t.daysOverdue,
          currentBalance: Number(t.currentBalance),
          originalValue:  Number(t.originalValue),
        })),
      };
    })
    .sort((a, b) => b.maxDaysOverdue - a.maxDaysOverdue);

  // ── Aging buckets (for chart) ─────────────────────────────────────────────
  const agingMap: Record<string, { value: number; count: number; students: number }> = {};
  for (const label of AGING_ORDER) {
    agingMap[label] = { value: 0, count: 0, students: 0 };
  }
  for (const s of students) {
    const label = agingLabel(s.maxDaysOverdue);
    agingMap[label].value    += s.totalBalance;
    agingMap[label].count    += s.titlesCount;
    agingMap[label].students += 1;
  }
  const agingChartData = AGING_ORDER.map((label) => ({
    range:    label,
    value:    agingMap[label].value,
    count:    agingMap[label].count,
    students: agingMap[label].students,
  }));

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalAmount    = students.reduce((s, c) => s + c.totalBalance, 0);
  const totalStudents  = students.length;
  const totalTitles    = filtered.length;
  const avgDaysOverdue = totalStudents > 0
    ? Math.round(students.reduce((s, c) => s + c.maxDaysOverdue, 0) / totalStudents)
    : 0;

  // Estimate default portfolio to compute rate (all students with balance > 0)
  const allActive = await prisma.receivableTitle.count({
    where: { tenantId, currentBalance: { gt: 0 }, situation: { in: ["RELEASED", "OVERDUE"] } },
  });
  const overdueRate = allActive > 0 ? (totalStudents / allActive) * 100 : 0;

  return NextResponse.json({
    summary: { totalAmount, totalStudents, totalTitles, avgDaysOverdue, overdueRate },
    agingChartData,
    students,
  });
}
