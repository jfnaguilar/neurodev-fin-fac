import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { verifyStripeWebhook } from "@/lib/providers/stripe";

export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  // Find the matching config by verifying signature against each tenant's webhook secret
  const configs = await prisma.integrationConfig.findMany({
    where: { provider: "STRIPE", isActive: true },
  });

  let verified = false;
  for (const cfg of configs) {
    const settings = cfg.settings as Record<string, string>;
    const webhookSecret = settings.webhookSecret ? decrypt(settings.webhookSecret) : null;
    if (webhookSecret && verifyStripeWebhook(payload, signature, webhookSecret)) {
      verified = true;
      break;
    }
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    await prisma.boletoEmission.updateMany({
      where: { externalId: pi.id },
      data: { status: "PAID", paidAt: new Date(pi.created * 1000), webhookData: event },
    });
  }

  if (event.type === "payment_intent.canceled") {
    const pi = event.data.object;
    await prisma.boletoEmission.updateMany({
      where: { externalId: pi.id },
      data: { status: "CANCELLED", canceledAt: new Date(), webhookData: event },
    });
  }

  return NextResponse.json({ received: true });
}
