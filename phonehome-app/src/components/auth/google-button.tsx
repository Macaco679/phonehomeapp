"use client";

import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.3 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.2 36.6 44 30.9 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function GoogleButton({
  redirectTo,
  onError,
}: {
  redirectTo: string;
  onError?: (message: string) => void;
}) {
  const supabase = createClient();

  async function handleClick() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) onError?.(error.message);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hide-in-app flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
    >
      <GoogleIcon />
      Continuar com Google
    </button>
  );
}
