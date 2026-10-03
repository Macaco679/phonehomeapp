import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// Cria uma cobrança (Pix ou cartão) no Mercado Pago para um serviço concluído
// ou para um pedido da loja. Quem chama precisa estar logado como o cliente
// dono daquele serviço/pedido — ou como a assistência que comprou peças — e
// isso é conferido pelo próprio banco (RLS), usando o token de quem está pedindo.

export async function POST(request: Request) {
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const admin = createAdminClient();
  if (!mpToken || !admin) {
    return Response.json(
      { error: "Pagamento online ainda não está configurado." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!accessToken) {
    return Response.json({ error: "Faça login para pagar." }, { status: 401 });
  }

  let body: { tipo?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const { tipo, id } = body;
  if ((tipo !== "trabalho" && tipo !== "pedido") || !id) {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  // Cliente com o token de quem chamou: as regras de acesso do banco valem aqui.
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  );
  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return Response.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
  }
  const [{ data: clienteRow }, { data: usuarioRow }] = await Promise.all([
    userClient.from("marketplace_clientes").select("id").eq("auth_user_id", userData.user.id).maybeSingle(),
    userClient.from("marketplace_usuarios").select("assistencia_id").eq("auth_user_id", userData.user.id).maybeSingle(),
  ]);
  if (!clienteRow && !usuarioRow) {
    return Response.json({ error: "Entre como cliente ou assistência para pagar." }, { status: 403 });
  }
  // quem paga: cliente (reparo ou acessórios) ou assistência (compra de peças)
  let pagadorCliente: string | null = null;
  let pagadorAssistencia: string | null = null;

  let valor = 0;
  let titulo = "";
  let trabalhoId: string | null = null;
  let pedidoId: string | null = null;

  if (tipo === "trabalho") {
    const { data: t } = await userClient
      .from("marketplace_trabalhos")
      .select("id, cliente_id, status, valor_final, forma_pagamento, pago_em_app, marca, modelo, tipo_reparo")
      .eq("id", id)
      .maybeSingle();
    if (!clienteRow || !t || t.cliente_id !== clienteRow.id) {
      return Response.json({ error: "Serviço não encontrado." }, { status: 404 });
    }
    if (t.status !== "concluido" || !t.valor_final || t.forma_pagamento !== "app" || t.pago_em_app) {
      return Response.json({ error: "Este serviço não está disponível para pagamento." }, { status: 409 });
    }
    valor = Number(t.valor_final);
    titulo = `Reparo ${t.marca} ${t.modelo} — ${t.tipo_reparo}`;
    trabalhoId = t.id;
    pagadorCliente = clienteRow.id;
  } else {
    const { data: p } = await userClient
      .from("marketplace_pedidos")
      .select("id, cliente_id, comprador_assistencia_id, status, total")
      .eq("id", id)
      .maybeSingle();
    if (p && clienteRow && p.cliente_id === clienteRow.id) pagadorCliente = clienteRow.id;
    else if (p && usuarioRow && p.comprador_assistencia_id === usuarioRow.assistencia_id) pagadorAssistencia = usuarioRow.assistencia_id;
    if (!p || (!pagadorCliente && !pagadorAssistencia)) {
      return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    }
    if (p.status !== "aguardando_pagamento") {
      return Response.json({ error: "Este pedido não está aguardando pagamento." }, { status: 409 });
    }
    valor = Number(p.total);
    titulo = `Pedido da loja Phone Home #${String(p.id).slice(0, 8)}`;
    pedidoId = p.id;
  }

  if (!(valor > 0)) {
    return Response.json({ error: "Valor inválido." }, { status: 409 });
  }

  // Registro da cobrança (só o servidor escreve nesta tabela).
  const { data: pagamento, error: pagError } = await admin
    .from("marketplace_pagamentos")
    .insert({
      tipo,
      trabalho_id: trabalhoId,
      pedido_id: pedidoId,
      cliente_id: pagadorCliente,
      comprador_assistencia_id: pagadorAssistencia,
      valor,
    })
    .select("id")
    .single();
  if (pagError || !pagamento) {
    return Response.json({ error: "Não foi possível iniciar o pagamento." }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const retorno = tipo === "trabalho" ? "/meus-reparos" : pagadorAssistencia ? "/dashboard/compras" : "/meus-pedidos";

  const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ title: titulo, quantity: 1, unit_price: valor, currency_id: "BRL" }],
      external_reference: pagamento.id,
      notification_url: `${origin}/api/pagamentos/webhook`,
      back_urls: {
        success: `${origin}${retorno}?pagamento=ok`,
        pending: `${origin}${retorno}?pagamento=pendente`,
        failure: `${origin}${retorno}?pagamento=falhou`,
      },
      auto_return: "approved",
      payer: { email: userData.user.email },
    }),
  });
  if (!mpRes.ok) {
    await admin.from("marketplace_pagamentos").update({ status: "cancelado" }).eq("id", pagamento.id);
    return Response.json({ error: "O Mercado Pago não respondeu. Tente de novo." }, { status: 502 });
  }
  const pref = (await mpRes.json()) as { id: string; init_point: string };

  await admin
    .from("marketplace_pagamentos")
    .update({ mp_preference_id: pref.id, init_point: pref.init_point })
    .eq("id", pagamento.id);

  return Response.json({ url: pref.init_point });
}
