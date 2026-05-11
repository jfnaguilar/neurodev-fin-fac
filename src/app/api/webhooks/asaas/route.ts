import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Asaas sends webhooks for payment and invoice events
export async function POST(req: Request) {
  const event = await req.json();
  const { event: eventType, payment, invoice } = event;

  if (payment?.id) {
    const isPix = payment.billingType === "PIX";

    if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
      const paidAt = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
      if (isPix) {
        await prisma.pixEmission.updateMany({
          where: { externalId: payment.id },
          data: { status: "PAID", paidAt, webhookData: event },
        });
      } else {
        await prisma.boletoEmission.updateMany({
          where: { externalId: payment.id },
          data: { status: "PAID", paidAt, webhookData: event },
        });
      }
    }

    if (eventType === "PAYMENT_DELETED" || eventType === "PAYMENT_REFUNDED") {
      if (isPix) {
        await prisma.pixEmission.updateMany({
          where: { externalId: payment.id },
          data: { status: "CANCELLED", canceledAt: new Date(), webhookData: event },
        });
      } else {
        await prisma.boletoEmission.updateMany({
          where: { externalId: payment.id },
          data: { status: "CANCELLED", canceledAt: new Date(), webhookData: event },
        });
      }
    }

    if (eventType === "PAYMENT_OVERDUE") {
      if (isPix) {
        await prisma.pixEmission.updateMany({
          where: { externalId: payment.id },
          data: { status: "EXPIRED", webhookData: event },
        });
      } else {
        await prisma.boletoEmission.updateMany({
          where: { externalId: payment.id },
          data: { status: "EXPIRED", webhookData: event },
        });
      }
    }
  }

  if (invoice?.id) {
    const statusMap: Record<string, string> = {
      INVOICE_AUTHORIZED: "ISSUED",
      INVOICE_CANCELED: "CANCELLED",
      INVOICE_ERROR: "ERROR",
    };
    const status = statusMap[eventType];
    if (status) {
      await prisma.invoiceEmission.updateMany({
        where: { externalId: invoice.id },
        data: {
          status: status as any,
          pdfUrl: invoice.pdfUrl ?? undefined,
          xmlUrl: invoice.xmlUrl ?? undefined,
          protocol: invoice.number ?? undefined,
          number: invoice.number ?? undefined,
          issuedAt: status === "ISSUED" ? new Date() : undefined,
          canceledAt: status === "CANCELLED" ? new Date() : undefined,
          errorMessage: invoice.observations ?? undefined,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
