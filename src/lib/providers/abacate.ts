// Abacate Pay API — boleto e PIX
// Docs: https://abacatepay.readme.io/reference

const BASE_URL = "https://api.abacatepay.com/v1";

async function abacateFetch(
  apiKey: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(options.headers ?? {}),
    },
  });
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface AbacateCustomer {
  name: string;
  email: string;
  cellphone?: string;
  taxId: string; // CPF or CNPJ (only digits)
}

// ─── Billing (Boleto) ─────────────────────────────────────────────────────────

export interface AbacateBoletoParams {
  apiKey: string;
  externalId: string;
  description: string;
  amount: number;       // BRL (will be converted to centavos)
  dueDate: string;      // "YYYY-MM-DD"
  customer: AbacateCustomer;
  returnUrl?: string;
  completionUrl?: string;
}

export interface AbacateBoletoResult {
  externalId: string;
  billingUrl: string;   // hosted billing page (boleto + PIX)
  barCode?: string;
  digitableLine?: string;
  pdfUrl?: string;
  status: string;
}

export async function createAbacateBoleto(
  params: AbacateBoletoParams
): Promise<AbacateBoletoResult> {
  const body = {
    frequency: "ONE_TIME",
    methods: ["BOLETO"],
    products: [
      {
        externalId: params.externalId,
        name: params.description.slice(0, 100),
        quantity: 1,
        price: Math.round(params.amount * 100), // centavos
      },
    ],
    returnUrl: params.returnUrl ?? "https://neurodev.com",
    completionUrl: params.completionUrl ?? "https://neurodev.com/pagamento-confirmado",
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      cellphone: params.customer.cellphone?.replace(/\D/g, "") ?? "11999999999",
      taxId: params.customer.taxId.replace(/\D/g, ""),
    },
  };

  const res = await abacateFetch(params.apiKey, "/billing/create", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Abacate Pay boleto error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const billing = data.data ?? data;

  // Abacate returns a billing URL that hosts the boleto; individual barcode
  // is available after the customer opens the page or via status polling.
  return {
    externalId: billing.id ?? billing._id ?? params.externalId,
    billingUrl: billing.url ?? "",
    barCode: billing.charges?.[0]?.barcode ?? "",
    digitableLine: billing.charges?.[0]?.formattedBarcode ?? "",
    pdfUrl: billing.url ?? "",
    status: billing.status ?? "PENDING",
  };
}

export async function getAbacateBillingStatus(
  apiKey: string,
  billingId: string
): Promise<{ status: string; paidAt?: Date }> {
  const res = await abacateFetch(apiKey, `/billing/${billingId}`);
  if (!res.ok) throw new Error("Failed to get Abacate Pay billing");
  const data = await res.json();
  const billing = data.data ?? data;

  const isPaid = billing.status === "PAID" || billing.status === "COMPLETED";
  return {
    status: billing.status,
    paidAt: isPaid ? new Date(billing.updatedAt ?? billing.created_at) : undefined,
  };
}

export async function cancelAbacateBilling(
  apiKey: string,
  billingId: string
): Promise<void> {
  // Abacate may not support cancellation via API; mark locally if not available
  const res = await abacateFetch(apiKey, `/billing/${billingId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Abacate cancel error: ${JSON.stringify(err)}`);
  }
}

export async function testAbacateConnection(apiKey: string): Promise<boolean> {
  // List billings with limit 1 — if 200/empty the key is valid
  const res = await abacateFetch(apiKey, "/billing/list");
  return res.status < 400;
}
