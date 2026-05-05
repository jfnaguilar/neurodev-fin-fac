// Stripe Boleto — Brazil only, via Payment Intents API (no npm package required)

const STRIPE_API = "https://api.stripe.com/v1";

async function stripePost(apiKey: string, path: string, body: Record<string, string>): Promise<Response> {
  const encoded = new URLSearchParams(body).toString();
  return fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encoded,
  });
}

async function stripeGet(apiKey: string, path: string): Promise<Response> {
  return fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

export interface StripeCustomerParams {
  name: string;
  email: string;
  taxId: string; // CPF or CNPJ (digits only)
}

export interface StripeBoletoParams {
  amount: number; // in BRL (will be converted to centavos)
  dueDate: Date;
  customer: StripeCustomerParams;
  description: string;
  isSandbox: boolean;
}

export interface StripeBoletoResult {
  externalId: string;   // PaymentIntent ID
  barCode: string;
  digitableLine: string;
  pdfUrl: string;
  status: string;
}

export async function createStripeBoleto(
  apiKey: string,
  params: StripeBoletoParams
): Promise<StripeBoletoResult> {
  // 1. Create or retrieve customer
  const custRes = await stripePost(apiKey, "/customers", {
    name: params.customer.name,
    email: params.customer.email,
    "tax_id_data[0][type]": params.customer.taxId.length <= 11 ? "br_cpf" : "br_cnpj",
    "tax_id_data[0][value]": params.customer.taxId.replace(/\D/g, ""),
  });

  if (!custRes.ok) {
    const err = await custRes.json();
    throw new Error(`Stripe customer error: ${err.error?.message}`);
  }
  const customer = await custRes.json();

  // 2. Create PaymentIntent with boleto
  const dueDateTs = Math.floor(params.dueDate.getTime() / 1000);
  const piRes = await stripePost(apiKey, "/payment_intents", {
    amount: String(Math.round(params.amount * 100)),
    currency: "brl",
    "payment_method_types[]": "boleto",
    customer: customer.id,
    description: params.description,
    "payment_method_options[boleto][expires_after_days]": String(
      Math.max(1, Math.ceil((dueDateTs - Date.now() / 1000) / 86400))
    ),
  });

  if (!piRes.ok) {
    const err = await piRes.json();
    throw new Error(`Stripe PaymentIntent error: ${err.error?.message}`);
  }
  const pi = await piRes.json();

  // 3. Create PaymentMethod (boleto) and confirm
  const pmRes = await stripePost(apiKey, "/payment_methods", {
    type: "boleto",
    "billing_details[name]": params.customer.name,
    "billing_details[email]": params.customer.email,
    "boleto[tax_id]": params.customer.taxId.replace(/\D/g, ""),
  });

  if (!pmRes.ok) {
    const err = await pmRes.json();
    throw new Error(`Stripe PaymentMethod error: ${err.error?.message}`);
  }
  const pm = await pmRes.json();

  // 4. Confirm PaymentIntent
  const confirmRes = await stripePost(apiKey, `/payment_intents/${pi.id}/confirm`, {
    payment_method: pm.id,
    return_url: "https://neurodev.com/boleto-confirmado",
  });

  if (!confirmRes.ok) {
    const err = await confirmRes.json();
    throw new Error(`Stripe confirm error: ${err.error?.message}`);
  }
  const confirmed = await confirmRes.json();
  const boleto = confirmed.next_action?.boleto_display_details ?? confirmed.payment_method_details?.boleto ?? {};

  return {
    externalId: confirmed.id,
    barCode: boleto.number ?? "",
    digitableLine: boleto.number ?? "",
    pdfUrl: boleto.pdf ?? "",
    status: confirmed.status,
  };
}

export async function getStripePaymentIntentStatus(
  apiKey: string,
  paymentIntentId: string
): Promise<{ status: string; paidAt?: Date }> {
  const res = await stripeGet(apiKey, `/payment_intents/${paymentIntentId}`);
  if (!res.ok) throw new Error("Failed to get Stripe PaymentIntent");
  const pi = await res.json();
  return {
    status: pi.status,
    paidAt: pi.status === "succeeded" && pi.charges?.data?.[0]?.created
      ? new Date(pi.charges.data[0].created * 1000)
      : undefined,
  };
}

export async function cancelStripeBoleto(
  apiKey: string,
  paymentIntentId: string
): Promise<void> {
  const res = await stripePost(apiKey, `/payment_intents/${paymentIntentId}/cancel`, {});
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Stripe cancel error: ${err.error?.message}`);
  }
}

// Webhook signature verification (HMAC-SHA256)
import crypto from "crypto";

export function verifyStripeWebhook(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    }, {});
    const timestamp = parts.t;
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 ?? ""));
  } catch {
    return false;
  }
}
