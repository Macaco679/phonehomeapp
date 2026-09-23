"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Cliente, UsuarioAssistencia } from "@/lib/types";

export function useAuth() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [assistenciaUsuario, setAssistenciaUsuario] =
    useState<UsuarioAssistencia | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setCliente(null);
        setAssistenciaUsuario(null);
        return;
      }
      const [{ data: clienteRow }, { data: usuarioRow }] = await Promise.all([
        supabase
          .from("marketplace_clientes")
          .select("*")
          .eq("auth_user_id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("marketplace_usuarios")
          .select("*")
          .eq("auth_user_id", currentUser.id)
          .maybeSingle(),
      ]);
      setCliente(clienteRow as Cliente | null);
      setAssistenciaUsuario(usuarioRow as UsuarioAssistencia | null);
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        loadProfile(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    cliente,
    assistenciaUsuario,
    loading,
    refresh: () => loadProfile(user),
    signOut: () => supabase.auth.signOut(),
  };
}
