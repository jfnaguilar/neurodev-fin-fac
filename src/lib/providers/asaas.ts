// Asaas — boleto, PIX e NFSe (Brazilian payment gateway)

function baseUrl(isSandbox: boolean) {
  return isSandbox
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/api/v3";
}

async function asaasFetch(
  apiKey: string,
  isSandbox: boolean,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${baseUrl(isSandbox)}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...(options.headers ?? {}),
    },
  });
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function findOrCreateAsaasCustomer(
  apiKey: string,
  isSandbox: boolean,
  customer: { name: string; email?: string; cpfCnpj: string; phone?: string }
): Promise<string> {
  // Try to find existing customer by CPF/CNPJ
  const searchRes = await asaasFetch(
    apiKey, isSandbox,
    `/customers?cpfCnpj=${customer.cpfCnpj.replace(/\D/g, "")}`
  );
  if (searchRes.ok) {
    const { data } = await searchRes.json();
    if (data?.length > 0) return data[0].id as string;
  }

  // Create new customer
  const createRes = await asaasFetch(apiKey, isSandbox, "/customers", {
    method: "POST",
    body: JSON.stringify({
      name: customer.name,
      email: customer.email,
      cpfCnpj: customer.cpfCnpj.replace(/\D/g, ""),
      mobilePhone: customer.phone?.replace(/\D/g, ""),
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(`Asaas customer error: ${JSON.stringify(err.errors)}`);
  }
  const created = await createRes.json();
  return created.id as string;
}

// ─── Boleto ──────────────────────────────────────────────────────────────────

export interface AsaasBoletoParams {
  apiKey: string;
  isSandbox: boolean;
  customerId: string;
  amount: number;
  dueDate: string; // "YYYY-MM-DD"
  description: string;
  externalRef?: string;
}

export interface AsaasBoletoResult {
  externalId: string;
  barCode: string;
  digitableLine: string;
  pdfUrl: string;
  status: string;
  invoiceUrl: string;
}

export async function createAsaasBoleto(params: AsaasBoletoParams): Promise<AsaasBoletoResult> {
  const res = await asaasFetch(params.apiKey, params.isSandbox, "/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "BOLETO",
      value: params.amount,
      dueDate: params.dueDate,
      description: params.description,
      externalReference: params.externalRef,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Asaas boleto error: ${JSON.stringify(err.errors)}`);
  }
  const payment = await res.json();

  // Get boleto identification field
  const boletoRes = await asaasFetch(
    params.apiKey, params.isSandbox,
    `/payments/${payment.id}/identificationField`
  );
  const boletoData = boletoRes.ok ? await boletoRes.json() : {};

  return {
    externalId: payment.id,
    barCode: boletoData.identificationField ?? "",
    digitableLine: boletoData.identificationField ?? "",
    pdfUrl: payment.bankSlipUrl ?? "",
    status: payment.status,
    invoiceUrl: payment.invoiceUrl ?? "",
  };
}

export async function getAsaasPaymentStatus(
  apiKey: string,
  isSandbox: boolean,
  paymentId: string
): Promise<{ status: string; paidAt?: Date }> {
  const res = await asaasFetch(apiKey, isSandbox, `/payments/${paymentId}`);
  if (!res.ok) throw new Error("Failed to get Asaas payment");
  const p = await res.json();
  return {
    status: p.status,
    paidAt: p.paymentDate ? new Date(p.paymentDate) : undefined,
  };
}

export async function cancelAsaasPayment(
  apiKey: string,
  isSandbox: boolean,
  paymentId: string
): Promise<void> {
  const res = await asaasFetch(apiKey, isSandbox, `/payments/${paymentId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Asaas cancel error: ${JSON.stringify(err.errors)}`);
  }
}

// ─── NFSe (Nota Fiscal de Serviços) ──────────────────────────────────────────

export interface AsaasNFSeParams {
  apiKey: string;
  isSandbox: boolean;
  paymentId: string;           // Asaas payment ID to link the invoice
  serviceDescription: string;
  municipalServiceCode?: string;
  deductions?: number;
}

export interface AsaasNFSeResult {
  externalId: string;
  status: string;
  pdfUrl?: string;
  xmlUrl?: string;
  protocol?: string;
  number?: string;
}

export async function createAsaasNFSe(params: AsaasNFSeParams): Promise<AsaasNFSeResult> {
  const res = await asaasFetch(params.apiKey, params.isSandbox, "/invoices", {
    method: "POST",
    body: JSON.stringify({
      payment: params.paymentId,
      serviceDescription: params.serviceDescription,
      observations: params.serviceDescription,
      municipalServiceCode: params.municipalServiceCode ?? "0101",
      deductions: params.deductions ?? 0,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Asaas NFSe error: ${JSON.stringify(err.errors)}`);
  }
  const inv = await res.json();

  return {
    externalId: inv.id,
    status: inv.status,
    pdfUrl: inv.pdfUrl,
    xmlUrl: inv.xmlUrl,
    protocol: inv.number,
    number: inv.number,
  };
}

export async function getAsaasInvoiceStatus(
  apiKey: string,
  isSandbox: boolean,
  invoiceId: string
): Promise<AsaasNFSeResult> {
  const res = await asaasFetch(apiKey, isSandbox, `/invoices/${invoiceId}`);
  if (!res.ok) throw new Error("Failed to get Asaas invoice");
  const inv = await res.json();
  return {
    externalId: inv.id,
    status: inv.status,
    pdfUrl: inv.pdfUrl,
    xmlUrl: inv.xmlUrl,
    protocol: inv.number,
    number: inv.number,
  };
}

export async function cancelAsaasInvoice(
  apiKey: string,
  isSandbox: boolean,
  invoiceId: string
): Promise<void> {
  const res = await asaasFetch(apiKey, isSandbox, `/invoices/${invoiceId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Asaas invoice cancel error: ${JSON.stringify(err.errors)}`);
  }
}

// ─── Test connection ──────────────────────────────────────────────────────────

export async function testAsaasConnection(apiKey: string, isSandbox: boolean): Promise<boolean> {
  const res = await asaasFetch(apiKey, isSandbox, "/myAccount");
  return res.ok;
}
