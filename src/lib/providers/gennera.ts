// GenneraClient — wraps the Gennera academic API (https://api2.gennera.com.br)
// Auth: POST /institutions/{id}/users/token → { token }
// Header: x-access-token: <token>

export interface GenneraConfig {
  idInstitution: number;
  username: string;
  password: string; // decrypted at call site
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface GeneraPerson {
  id: number;
  userId: number | null;
  name: string;
  document: string | null;      // CPF
  email: string | null;
  phone: string | null;
  ra: string | null;            // enrollment number
  birthDate: string | null;
  isActive: boolean;
}

export interface GenneraEnrollment {
  id: number;
  personId: number;
  curriculumOfferId: number | null;
  ra: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  isDelinquent: boolean;
}

export interface GenneraContract {
  id: number;
  enrollmentId: number;
  personId: number;
  value: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface GenneraInvoice {
  id: number;
  contractId: number;
  personId: number;
  value: number;
  dueDate: string;
  paymentDate: string | null;
  status: string;              // OPEN | PAID | OVERDUE | CANCELLED
  description: string | null;
  installmentNumber: number | null;
}

export interface GenneraPayment {
  id: number;
  invoiceId: number;
  personId: number;
  amount: number;
  paidAt: string;
  method: string | null;
}

export interface GenneraDebtor {
  personId: number;
  name: string;
  document: string | null;
  email: string | null;
  totalDebt: number;
  overdueInvoices: number;
}

export interface GenneraCurriculumOffer {
  id: number;
  code: string;
  name: string;
  course: string | null;
  period: string | null;
  isActive: boolean;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class GenneraClient {
  private baseUrl = "https://api2.gennera.com.br";
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private cfg: GenneraConfig) {}

  // ── Authentication ──────────────────────────────────────────────────────────

  async authenticate(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiresAt) return;

    const res = await fetch(
      `${this.baseUrl}/institutions/${this.cfg.idInstitution}/users/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: this.cfg.username, password: this.cfg.password }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gennera auth failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    if (!data.token) throw new Error("Gennera auth: token não retornado");

    this.token = data.token;
    // Tokens typically valid for 1 hour; we refresh after 55 min
    this.tokenExpiresAt = Date.now() + 55 * 60 * 1000;
  }

  // ── HTTP helper ─────────────────────────────────────────────────────────────

  private async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    await this.authenticate();

    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url.toString(), {
      headers: { "x-access-token": this.token! },
    });

    if (!res.ok) {
      throw new Error(`Gennera GET ${path} failed (${res.status})`);
    }

    return res.json() as Promise<T>;
  }

  private async patch(path: string, body: Record<string, unknown>): Promise<void> {
    await this.authenticate();

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": this.token!,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Gennera PATCH ${path} failed (${res.status})`);
    }
  }

  // ── API methods ─────────────────────────────────────────────────────────────

  async testConnection(): Promise<{ ok: boolean; institutionName?: string }> {
    try {
      await this.authenticate();
      // Quick sanity: list 1 person
      await this.get(`/institutions/${this.cfg.idInstitution}/persons`, { limit: 1, page: 1 });
      return { ok: true };
    } catch (err) {
      return { ok: false };
    }
  }

  async getPersons(page = 1, limit = 200): Promise<GeneraPerson[]> {
    const data = await this.get<{ data?: GeneraPerson[]; items?: GeneraPerson[] } | GeneraPerson[]>(
      `/institutions/${this.cfg.idInstitution}/persons`,
      { page, limit }
    );
    if (Array.isArray(data)) return data;
    return (data as any).data ?? (data as any).items ?? [];
  }

  async getAllPersons(): Promise<GeneraPerson[]> {
    const all: GeneraPerson[] = [];
    let page = 1;
    while (true) {
      const batch = await this.getPersons(page, 200);
      all.push(...batch);
      if (batch.length < 200) break;
      page++;
    }
    return all;
  }

  async getEnrollments(page = 1, limit = 200): Promise<GenneraEnrollment[]> {
    const data = await this.get<any>(
      `/institutions/${this.cfg.idInstitution}/enrollments`,
      { page, limit }
    );
    return Array.isArray(data) ? data : (data.data ?? data.items ?? []);
  }

  async getAllEnrollments(): Promise<GenneraEnrollment[]> {
    const all: GenneraEnrollment[] = [];
    let page = 1;
    while (true) {
      const batch = await this.getEnrollments(page, 200);
      all.push(...batch);
      if (batch.length < 200) break;
      page++;
    }
    return all;
  }

  async getContracts(page = 1, limit = 200): Promise<GenneraContract[]> {
    const data = await this.get<any>(
      `/institutions/${this.cfg.idInstitution}/contracts`,
      { page, limit }
    );
    return Array.isArray(data) ? data : (data.data ?? data.items ?? []);
  }

  async getAllContracts(): Promise<GenneraContract[]> {
    const all: GenneraContract[] = [];
    let page = 1;
    while (true) {
      const batch = await this.getContracts(page, 200);
      all.push(...batch);
      if (batch.length < 200) break;
      page++;
    }
    return all;
  }

  async getContractInvoices(contractId: number): Promise<GenneraInvoice[]> {
    const data = await this.get<any>(
      `/institutions/${this.cfg.idInstitution}/contracts/${contractId}/invoices`
    );
    return Array.isArray(data) ? data : (data.data ?? data.items ?? []);
  }

  async getInvoices(page = 1, limit = 200): Promise<GenneraInvoice[]> {
    const data = await this.get<any>(
      `/institutions/${this.cfg.idInstitution}/invoices`,
      { page, limit }
    );
    return Array.isArray(data) ? data : (data.data ?? data.items ?? []);
  }

  async getAllInvoices(): Promise<GenneraInvoice[]> {
    const all: GenneraInvoice[] = [];
    let page = 1;
    while (true) {
      const batch = await this.getInvoices(page, 200);
      all.push(...batch);
      if (batch.length < 200) break;
      page++;
    }
    return all;
  }

  async getPayments(page = 1, limit = 200): Promise<GenneraPayment[]> {
    const data = await this.get<any>(
      `/institutions/${this.cfg.idInstitution}/payments`,
      { page, limit }
    );
    return Array.isArray(data) ? data : (data.data ?? data.items ?? []);
  }

  async getAllPayments(): Promise<GenneraPayment[]> {
    const all: GenneraPayment[] = [];
    let page = 1;
    while (true) {
      const batch = await this.getPayments(page, 200);
      all.push(...batch);
      if (batch.length < 200) break;
      page++;
    }
    return all;
  }

  async getDebtors(): Promise<GenneraDebtor[]> {
    const data = await this.get<any>(
      `/institutions/${this.cfg.idInstitution}/debtors`
    );
    return Array.isArray(data) ? data : (data.data ?? data.items ?? []);
  }

  async getCurriculumOffers(page = 1, limit = 200): Promise<GenneraCurriculumOffer[]> {
    const data = await this.get<any>(
      `/institutions/${this.cfg.idInstitution}/curriculum-offers`,
      { page, limit }
    );
    return Array.isArray(data) ? data : (data.data ?? data.items ?? []);
  }

  async getAllCurriculumOffers(): Promise<GenneraCurriculumOffer[]> {
    const all: GenneraCurriculumOffer[] = [];
    let page = 1;
    while (true) {
      const batch = await this.getCurriculumOffers(page, 200);
      all.push(...batch);
      if (batch.length < 200) break;
      page++;
    }
    return all;
  }

  async updateEnrollmentDelinquency(enrollmentId: number, isDelinquent: boolean): Promise<void> {
    await this.patch(
      `/institutions/${this.cfg.idInstitution}/enrollments/${enrollmentId}`,
      { isDelinquent }
    );
  }
}

// ─── Factory from IntegrationConfig settings ──────────────────────────────────

export function buildGenneraClient(settings: Record<string, string>, password: string): GenneraClient {
  const idInstitution = parseInt(settings.idInstitution ?? "0", 10);
  if (!idInstitution) throw new Error("idInstitution não configurado");
  const username = settings.username;
  if (!username) throw new Error("username Gennera não configurado");
  return new GenneraClient({ idInstitution, username, password });
}

export async function testGenneraConnection(settings: Record<string, string>, password: string): Promise<boolean> {
  try {
    const client = buildGenneraClient(settings, password);
    const result = await client.testConnection();
    return result.ok;
  } catch {
    return false;
  }
}
