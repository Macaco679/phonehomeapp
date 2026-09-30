import { ImageResponse } from "next/og";

// Ícones do app instalável (PWA), gerados no servidor: casa + celular da marca.
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  const maskable = size === "maskable";
  const px = maskable ? 512 : size === "192" ? 192 : 512;
  const glyph = maskable ? px * 0.52 : px * 0.66;
  const cor = maskable ? "#ffffff" : "#2563eb";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: maskable ? "#2563eb" : "#ffffff",
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 11 12 3.8 20.5 11v8.2a1.3 1.3 0 0 1-1.3 1.3H4.8a1.3 1.3 0 0 1-1.3-1.3V11z" />
          <rect x="9" y="8.6" width="6" height="9.4" rx="1.4" />
          <path d="M11.2 16.4h1.6" />
        </svg>
      </div>
    ),
    { width: px, height: px }
  );
}
