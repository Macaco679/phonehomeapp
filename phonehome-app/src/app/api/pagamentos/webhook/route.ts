import { createAdminClient } from "@/lib/supabase/admin";

// Aviso do Mercado Pago ("pagamento mudou de status"). Não confiamos no que
// vem no aviso: consultamos o pagamento direto na API do Mercado Pago e só
// então atualizamos o banco (valor e referência precisam bater).

async function processar(paymentId: string) {
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const admin = createAdminClient();
  if (!mpToken || !admin) return { ok: false, status: 503 };

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  });
  if (!res.ok) return { ok: false, status: 502 };
  const mp = (await res.json()) as {
    id: number;
    status: string;
    external_reference: string | null;
    transaction_amount: number;
  };
  if (!mp.external_reference) return { ok: true, status: 200 };

  const { data: pag } = await admin
    .from("marketplace_pagamentos")
    .select("*")
    .eq("id", mp.external_reference)
    .maybeSingle();
  if (!pag) return { ok: true, status: 200 };

  const novoStatus =
    mp.status === "approved"
      ? "aprovado"
      : mp.status === "rejected"
      ? "recusado"
      : mp.status === "cancelled"
      ? "cancelado"
      : mp.status === "refunded" || mp.status === "charged_back"
      ? "reembolsado"
      : "pendente";

  if (novoStatus === "aprovado" && Math.abs(Number(mp.transaction_amount) - Number(pag.valor)) > 0.01) {
    // valor diferente do cobrado: não libera nada
    return { ok: true, status: 200 };
  }

  await admin
    .from("marketplace_pagamentos")
    .update({ status: novoStatus, mp_payment_id: String(mp.id), updated_at: new Date().toISOString() })
    .eq("id", pag.id);

  if (novoStatus === "aprovado") {
    if (pag.tipo === "trabalho" && pag.trabalho_id) {
      await admin.from("marketplace_trabalhos").update({ pago_em_app: true }).eq("id", pag.trabalho_id);
    } else if (pag.tipo === "pedido" && pag.pedido_id) {
      await admin
        .from("marketplace_pedidos")
        .update({ status: "pago", pago_em: new Date().toISOString() })
        .eq("id", pag.pedido_id)
        .eq("status", "aguardando_pagamento");
    }
  }
  return { ok: true, status: 200 };
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let tipo = url.searchParams.get("type") ?? url.searchParams.get("topic");
  try {
    const body = (await request.json()) as { data?: { id?: string | number }; type?: string };
    if (body?.data?.id) paymentId = String(body.data.id);
    if (body?.type) tipo = body.type;
  } catch {
    // aviso sem corpo JSON: usa os parâmetros da URL
  }
  if (!paymentId || (tipo && tipo !== "payment")) {
    return new Response("ok", { status: 200 });
  }
  const r = await processar(paymentId);
  return new Response(r.ok ? "ok" : "erro", { status: r.status });
}

export async function GET(request: Request) {
  return POST(request);
}
