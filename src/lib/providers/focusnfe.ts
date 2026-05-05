// FocusNFe — NF-e (produto) e NFSe (serviço)

const BASE_URL = "https://api.focusnfe.com.br/v2";

async function focusFetch(
  apiKey: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...(options.headers ?? {}),
    },
  });
}

// ─── NFSe (Nota Fiscal de Serviços Eletrônica) ───────────────────────────────

export interface FocusNFSeParams {
  ref: string;                     // unique reference per request
  cnpjPrestador: string;           // issuer CNPJ
  naturezaOperacao?: number;       // default 1 (tributação no município)
  optanteSimplesNacional?: boolean;
  incentivoFiscal?: boolean;
  codigoServico: string;           // municipal service code
  aliquota: number;                // percentage 0-100
  itemListaServico: string;        // LC116 service code (e.g. "01.01")
  discriminacao: string;           // service description
  municipioPrestacao: string;      // IBGE city code
  valorServicos: number;
  tomador: {
    cnpjCpf?: string;
    razaoSocial: string;
    email?: string;
    endereco?: {
      logradouro: string;
      numero: string;
      municipio: string;
      uf: string;
      cep: string;
    };
  };
}

export interface FocusNFSeResult {
  ref: string;
  status: string;
  protocol?: string;
  numero?: string;
  serie?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  erros?: { codigo: string; mensagem: string }[];
}

export async function emitirFocusNFSe(
  apiKey: string,
  params: FocusNFSeParams
): Promise<FocusNFSeResult> {
  const body = {
    natureza_operacao: params.naturezaOperacao ?? 1,
    optante_simples_nacional: params.optanteSimplesNacional ?? true,
    incentivo_fiscal: params.incentivoFiscal ?? false,
    prestador: { cnpj: params.cnpjPrestador.replace(/\D/g, "") },
    tomador: {
      cnpj: params.tomador.cnpjCpf && params.tomador.cnpjCpf.replace(/\D/g, "").length > 11
        ? params.tomador.cnpjCpf.replace(/\D/g, "")
        : undefined,
      cpf: params.tomador.cnpjCpf && params.tomador.cnpjCpf.replace(/\D/g, "").length <= 11
        ? params.tomador.cnpjCpf.replace(/\D/g, "")
        : undefined,
      razao_social: params.tomador.razaoSocial,
      email: params.tomador.email,
      endereco: params.tomador.endereco ? {
        logradouro: params.tomador.endereco.logradouro,
        numero: params.tomador.endereco.numero,
        codigo_municipio: params.municipioPrestacao,
        uf: params.tomador.endereco.uf,
        cep: params.tomador.endereco.cep,
      } : undefined,
    },
    servico: {
      valor_servicos: params.valorServicos,
      item_lista_servico: params.itemListaServico,
      codigo_servico: params.codigoServico,
      aliquota: params.aliquota / 100,
      discriminacao: params.discriminacao,
      municipio_prestacao_servico: params.municipioPrestacao,
    },
  };

  const res = await focusFetch(apiKey, `/nfse?ref=${encodeURIComponent(params.ref)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok && res.status !== 422) {
    throw new Error(`FocusNFe error ${res.status}: ${JSON.stringify(data)}`);
  }

  return mapFocusNFSeResult(params.ref, data);
}

export async function consultarFocusNFSe(
  apiKey: string,
  ref: string
): Promise<FocusNFSeResult> {
  const res = await focusFetch(apiKey, `/nfse/${encodeURIComponent(ref)}`);
  if (!res.ok) throw new Error(`FocusNFe consulta error ${res.status}`);
  const data = await res.json();
  return mapFocusNFSeResult(ref, data);
}

export async function cancelarFocusNFSe(apiKey: string, ref: string): Promise<void> {
  const res = await focusFetch(apiKey, `/nfse/${encodeURIComponent(ref)}/cancelar`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(`FocusNFe cancelar error: ${JSON.stringify(data)}`);
  }
}

function mapFocusNFSeResult(ref: string, data: Record<string, unknown>): FocusNFSeResult {
  return {
    ref,
    status: (data.status as string) ?? "unknown",
    protocol: data.protocolo as string | undefined,
    numero: data.numero_rps as string | undefined,
    serie: data.serie_rps as string | undefined,
    pdfUrl: data.danfe_nfse_url as string | undefined,
    xmlUrl: data.xml_url as string | undefined,
    erros: data.erros as FocusNFSeResult["erros"],
  };
}

// ─── Test connection ──────────────────────────────────────────────────────────

export async function testFocusNFeConnection(apiKey: string): Promise<boolean> {
  const res = await focusFetch(apiKey, "/nfse");
  // 200 or 404 (no records) are both valid
  return res.status < 500;
}
