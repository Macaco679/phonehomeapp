"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Faixa discreta no topo quando o aparelho perde a internet. */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="safe-top fixed inset-x-0 top-0 z-50 bg-slate-900 px-4 py-2 text-center text-xs font-medium text-white"
    >
      Sem conexão com a internet. Algumas telas podem não atualizar.
    </div>
  );
}
