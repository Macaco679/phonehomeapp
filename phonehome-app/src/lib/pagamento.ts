import { createClient } from "@/lib/supabase/client";

// Abre o checkout do Mercado Pago (Pix ou cartão) para um serviço ou pedido.
export async function iniciarPagamento(
  tipo: "trabalho" | "pedido",
  id: string
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Faça login para pagar." };
  try {
    const res = await fetch("/api/pagamentos/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tipo, id }),
    });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) return { error: json.error ?? "Não foi possível iniciar o pagamento." };
    return { url: json.url };
  } catch {
    return { error: "Sem conexão. Tente de novo." };
  }
}
