import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createConnectToken, isConfigured } from "@/lib/pluggy";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Pluggy não configurado. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const connectToken = await createConnectToken(body.itemId);
    return NextResponse.json({ connectToken });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
