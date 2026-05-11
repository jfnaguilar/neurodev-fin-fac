import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Unified list of all billing emissions for a tenant
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as any).currentTenantId as string;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "ALL";   // ALL | BOLETO | PIX | NF
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  const results: unknown[] = [];

  if (type === "ALL" || type === "BOLETO") {
    const boletos = await prisma.boletoEmission.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        receivableTitle: {
          include: { customer: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
    boletos.forEach((b) =>
      results.push({
        id: b.id,
        type: "BOLETO",
        provider: b.provider,
        customerName: b.receivableTitle?.customer?.name ?? "—",
        customerEmail: b.receivableTitle?.customer?.email ?? null,
        amount: Number(b.amount),
        dueDate: b.dueDate,
        status: b.status,
        emailSentAt: b.emailSentAt,
        emailSentTo: b.emailSentTo,
        pdfUrl: b.pdfUrl,
        digitableLine: b.digitableLine,
        createdAt: b.createdAt,
      })
    );
  }

  if (type === "ALL" || type === "PIX") {
    const pixList = await prisma.pixEmission.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        receivableTitle: {
          include: { customer: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
    pixList.forEach((p) =>
      results.push({
        id: p.id,
        type: "PIX",
        provider: p.provider,
        customerName: p.receivableTitle?.customer?.name ?? "—",
        customerEmail: p.receivableTitle?.customer?.email ?? null,
        amount: Number(p.amount),
        dueDate: p.expiresAt,
        status: p.status,
        emailSentAt: p.emailSentAt,
        emailSentTo: p.emailSentTo,
        qrCode: p.qrCode,
        qrCodeImage: p.qrCodeImage,
        createdAt: p.createdAt,
      })
    );
  }

  if (type === "ALL" || type === "NF") {
    const nfList = await prisma.invoiceEmission.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        receivableTitle: {
          include: { customer: { select: { name: true, email: true } } },
        },
        paymentTitle: {
          include: { supplier: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
    nfList.forEach((n) =>
      results.push({
        id: n.id,
        type: "NF",
        provider: n.provider,
        customerName:
          n.receivableTitle?.customer?.name ??
          n.paymentTitle?.supplier?.name ??
          "—",
        customerEmail:
          n.receivableTitle?.customer?.email ??
          n.paymentTitle?.supplier?.email ??
          null,
        amount: null,
        dueDate: n.issuedAt,
        status: n.status,
        emailSentAt: n.emailSentAt,
        emailSentTo: n.emailSentTo,
        number: n.number,
        pdfUrl: n.pdfUrl,
        xmlUrl: n.xmlUrl,
        createdAt: n.createdAt,
      })
    );
  }

  // Sort unified list by createdAt desc
  results.sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ data: results.slice(0, limit), page, limit });
}
