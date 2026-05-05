const PLUGGY_API_URL = "https://api.pluggy.ai";
const CLIENT_ID = process.env.PLUGGY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET ?? "";

let cachedApiKey: string | null = null;
let apiKeyExpiresAt = 0;

async function getApiKey(): Promise<string> {
  if (cachedApiKey && Date.now() < apiKeyExpiresAt) return cachedApiKey;

  const res = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pluggy auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedApiKey = data.apiKey as string;
  // API keys are valid for 2h; refresh at 100 min to be safe
  apiKeyExpiresAt = Date.now() + 100 * 60 * 1000;
  return cachedApiKey!;
}

async function pluggyFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = await getApiKey();
  return fetch(`${PLUGGY_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      ...(options.headers ?? {}),
    },
  });
}

export async function createConnectToken(
  itemId?: string,
  webhookUrl?: string
): Promise<string> {
  const body: Record<string, unknown> = {};
  if (itemId) body.itemId = itemId;
  if (webhookUrl) body.webhookUrl = webhookUrl;

  const res = await pluggyFetch("/connect_token", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create connect token: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.accessToken as string;
}

export interface PluggyItem {
  id: string;
  connector: { id: number; name: string; institutionUrl?: string };
  status: string;
  error?: { code: string; message: string };
  lastUpdatedAt?: string;
}

export async function getItem(itemId: string): Promise<PluggyItem> {
  const res = await pluggyFetch(`/items/${itemId}`);
  if (!res.ok) throw new Error(`Failed to get item: ${res.status}`);
  return res.json();
}

export interface PluggyAccountData {
  id: string;
  itemId: string;
  name: string;
  number?: string;
  bankData?: { transferNumber?: string; closingBalance?: number };
  type: string;
  subtype?: string;
  currencyCode: string;
  balance: number;
}

export async function getAccounts(itemId: string): Promise<PluggyAccountData[]> {
  const res = await pluggyFetch(`/accounts?itemId=${itemId}`);
  if (!res.ok) throw new Error(`Failed to get accounts: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

export interface PluggyTransactionData {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  balance?: number;
}

export async function getTransactions(
  accountId: string,
  from: string,
  to: string
): Promise<PluggyTransactionData[]> {
  const params = new URLSearchParams({ accountId, from, to, pageSize: "500" });
  const res = await pluggyFetch(`/transactions?${params}`);
  if (!res.ok) throw new Error(`Failed to get transactions: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}
