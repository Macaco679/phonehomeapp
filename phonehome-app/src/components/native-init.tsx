"use client";

import { useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Integração com o app nativo (Android/iOS, empacotado com Capacitor — ver /mobile).
 * No navegador comum não faz nada. Dentro do app: esconde a tela de abertura,
 * ajusta a barra de status, trata o botão "voltar" do Android e dá um toque
 * de vibração leve nas abas. Usa o `window.Capacitor` que o app injeta,
 * então o site não depende de nenhum pacote nativo.
 */
export function NativeInit() {
  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    const html = document.documentElement;
    html.classList.add("native-app");
    html.dataset.platform = cap.getPlatform?.();

    const P = cap.Plugins ?? {};

    P.StatusBar?.setStyle?.({ style: "LIGHT" })?.catch?.(() => {});
    if (cap.getPlatform?.() === "android") {
      P.StatusBar?.setBackgroundColor?.({ color: "#ffffff" })?.catch?.(() => {});
    }
    P.SplashScreen?.hide?.({ fadeOutDuration: 250 })?.catch?.(() => {});

    // Botão voltar do Android: volta no histórico; na primeira tela, fecha o app.
    let backHandle: { remove?: () => void } | undefined;
    Promise.resolve(
      P.App?.addListener?.("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
        if (canGoBack) window.history.back();
        else P.App?.exitApp?.();
      })
    )
      .then((h) => (backHandle = h))
      .catch(() => {});

    // Vibração leve ao tocar nas abas e em botões marcados com data-haptic.
    const onTap = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.(
        'nav[aria-label="Navegação principal"] a, [data-haptic]'
      );
      if (el) P.Haptics?.impact?.({ style: "LIGHT" })?.catch?.(() => {});
    };
    document.addEventListener("click", onTap, true);

    return () => {
      backHandle?.remove?.();
      document.removeEventListener("click", onTap, true);
    };
  }, []);

  return null;
}
