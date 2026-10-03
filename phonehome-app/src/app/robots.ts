import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://phonehome-app.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api/", "/conta", "/meus-reparos", "/meus-pedidos", "/completar-cadastro"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
