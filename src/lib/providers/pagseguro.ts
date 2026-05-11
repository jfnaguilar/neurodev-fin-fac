// PagSeguro V4 API — boleto bancário
// Docs: https://dev.pagbank.uol.com.br/reference

function baseUrl(isSandbox: boolean) {
  return isSandbox
    ? "https://sandbox.api.pagseguro.com"
    : "https://api.pagseguro.com";
}

// ─── Auth (OAuth2 client_credentials) ────────────────────────────────────────

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  isSandbox: boolean
): Promise<string> {
  const res = await fetch(`${baseUrl(isSandbox)}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`PagSeguro auth error: ${err.error_description ?? JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

// PagSeguro stores credentials as "clientId:clientSecret" encoded in apiKeyEnc
export function parsePagSeguroKey(combined: string): { clientId: string; clientSecret: string } {
  const [clientId, ...rest] = combined.split(":");
  return { clientId, clientSecret: rest.join(":") };
}

async function pagBankFetch(
  combined: string,
  isSandbox: boolean,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const { clientId, clientSecret } = parsePagSeguroKey(combined);
  const token = await getAccessToken(clientId, clientSecret, isSandbox);

  return fetch(`${baseUrl(isSandbox)}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

// ─── Boleto ──────────────────────────────────────────────────────────────────

export interface PagSeguroBoletoParams {
  combined: string;   // "clientId:clientSecret"
  isSandbox: boolean;
  referenceId: string;
  description: string;
  amount: number;     // BRL
  dueDate: string;    // "YYYY-MM-DD"
  holder: {
    name: string;
    taxId: string;    // CPF or CNPJ (digits only)
    email?: string;
    address?: {
      street: string;
      number: string;
      city: string;
      state: string;     // UF (2 chars)
      postalCode: string; // CEP digits only
      country?: string;
    };
  };
  notificationUrl?: string;
}

export interface PagSeguroBoletoResult {
  externalId: string;
  barCode: string;
  digitableLine: string;
  pdfUrl: string;
  status: string;
}

export async function createPagSeguroBoleto(
  params: PagSeguroBoletoParams
): Promise<PagSeguroBoletoResult> {
  const body: Record<string, unknown> = {
    reference_id: params.referenceId,
    description: params.description,
    amount: { value: Math.round(params.amount * 100), currency: "BRL" },
    payment_method: {
      type: "BOLETO",
      boleto: {
        due_date: params.dueDate,
        instruction_lines: {
          line_1: `Pagamento referente a: ${params.description}`,
          line_2: "Não receber após o vencimento",
        },
        holder: {
          name: params.holder.name,
          tax_id: params.holder.taxId.replace(/\D/g, ""),
          email: params.holder.email,
          address: params.holder.address
            ? {
                street: params.holder.address.street,
                number: params.holder.address.number,
                locality: "Centro",
                city: params.holder.address.city,
                region_code: params.holder.address.state,
                postal_code: params.holder.address.postalCode.replace(/\D/g, ""),
                country: params.holder.address.country ?? "BRA",
              }
            : {
                // Minimal required address
                street: "Não informado",
                number: "S/N",
                locality: "Centro",
                city: "São Paulo",
                region_code: "SP",
                postal_code: "01310100",
                country: "BRA",
              },
        },
      },
    },
  };

  if (params.notificationUrl) {
    body.notification_urls = [params.notificationUrl];
  }

  const res = await pagBankFetch(params.combined, params.isSandbox, "/charges", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`PagSeguro boleto error: ${JSON.stringify(err.error_messages ?? err)}`);
  }

  const charge = await res.json();
  const boleto = charge.payment_method?.boleto ?? {};

  return {
    externalId: charge.id,
    barCode: boleto.barcode ?? "",
    digitableLine: boleto.formatted_barcode ?? boleto.barcode ?? "",
    pdfUrl: charge.links?.find((l: { rel: string; href: string }) => l.rel === "SELF")?.href ?? "",
    status: charge.status,
  };
}

export async function getPagSeguroChargeStatus(
  combined: string,
  isSandbox: boolean,
  chargeId: string
): Promise<{ status: string; paidAt?: Date }> {
  const res = await pagBankFetch(combined, isSandbox, `/charges/${chargeId}`);
  if (!res.ok) throw new Error("Failed to get PagSeguro charge");
  const charge = await res.json();
  return {
    status: charge.status,
    paidAt:
      charge.status === "PAID"
        ? new Date(charge.paid_at ?? charge.updated_at)
        : undefined,
  };
}

export async function cancelPagSeguroCharge(
  combined: string,
  isSandbox: boolean,
  chargeId: string
): Promise<void> {
  const res = await pagBankFetch(combined, isSandbox, `/charges/${chargeId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`PagSeguro cancel error: ${JSON.stringify(err)}`);
  }
}

export async function testPagSeguroConnection(
  combined: string,
  isSandbox: boolean
): Promise<boolean> {
  try {
    const { clientId, clientSecret } = parsePagSeguroKey(combined);
    await getAccessToken(clientId, clientSecret, isSandbox);
    return true;
  } catch {
    return false;
  }
}
