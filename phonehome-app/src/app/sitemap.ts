import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://phonehome-app.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const rotas = ["", "/agendar", "/loja", "/login", "/cadastro", "/suporte", "/termos", "/privacidade"];
  return rotas.map((r) => ({ url: `${BASE}${r}`, changeFrequency: "weekly", priority: r === "" ? 1 : 0.6 }));
}
