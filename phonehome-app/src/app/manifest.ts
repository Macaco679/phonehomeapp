import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Phone Home",
    short_name: "Phone Home",
    description: "Conserto de celular onde você estiver.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6fb",
    theme_color: "#2563eb",
    lang: "pt-BR",
    icons: [
      { src: "/pwa/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
