import { createClient } from "@supabase/supabase-js";

// Cliente com chave de serviço — SÓ roda no servidor (rotas /api). Ignora RLS,
// por isso só é usado depois de validar quem está pedindo.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
