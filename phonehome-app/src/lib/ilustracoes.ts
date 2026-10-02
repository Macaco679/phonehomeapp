// Ilustrações (SVG) usadas quando o produto não tem foto própria — uma por tipo.
// Desenhadas para a Phone Home; sem marcas de terceiros.
import type { TipoProduto } from "@/lib/types";

const INK = "#1e293b";
const AZUL = "#2563eb";
// traço escuro (S) e traço azul (A)
const S = `fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
const A = `fill="none" stroke="${AZUL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
const celular = `<rect x="150" y="40" width="100" height="220" rx="16" ${S}/>`;

// [cor de fundo 1, cor de fundo 2, desenho]
const ARTE: Record<TipoProduto, [string, string, string]> = {
  tela: ["#eff6ff", "#dbeafe", `${celular}<rect x="162" y="62" width="76" height="176" rx="6" fill="${AZUL}" opacity=".18"/><rect x="185" y="50" width="30" height="7" rx="3.5" fill="${INK}"/><path d="M178 110 l30 -30 M178 150 l60 -60" ${A} opacity=".7"/>`],
  bateria: ["#f0fdf4", "#dcfce7", `<rect x="130" y="70" width="140" height="180" rx="16" ${S}/><rect x="175" y="52" width="50" height="18" rx="5" fill="${INK}"/><path d="M210 105 l-30 55 h40 l-30 55" ${A}/>`],
  conector: ["#fefce8", "#fef3c7", `<path d="M120 150 h70" ${S}/><rect x="190" y="125" width="70" height="50" rx="12" ${S}/><rect x="260" y="138" width="34" height="24" rx="6" fill="${AZUL}"/><path d="M120 150 c-40 0 -40 60 -80 60" ${S}/>`],
  camera: ["#f5f3ff", "#ede9fe", `<rect x="120" y="70" width="160" height="160" rx="36" ${S}/>` + [[170, 120], [170, 182], [235, 151]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" ${S}/><circle cx="${x}" cy="${y}" r="10" fill="${AZUL}"/>`).join("")],
  tampa: ["#f8fafc", "#e2e8f0", `${celular}<rect x="162" y="54" width="46" height="46" rx="12" ${S}/><circle cx="185" cy="77" r="9" fill="${AZUL}"/>`],
  alto_falante: ["#fff7ed", "#ffedd5", `<path d="M130 125 h35 l45 -40 v130 l-45 -40 h-35 z" ${S}/><path d="M235 115 c15 20 15 50 0 70" ${A}/><path d="M258 95 c28 35 28 75 0 110" ${A} opacity=".6"/>`],
  pelicula: ["#ecfeff", "#cffafe", `${celular}<rect x="135" y="60" width="100" height="220" rx="16" fill="${AZUL}" opacity=".12" stroke="${AZUL}" stroke-width="5"/><path d="M215 80 l15 15" ${A}/>`],
  capa: ["#fdf2f8", "#fce7f3", `<rect x="140" y="35" width="120" height="230" rx="28" fill="${AZUL}" opacity=".15"/><rect x="140" y="35" width="120" height="230" rx="28" ${S}/><rect x="158" y="55" width="44" height="44" rx="12" ${S}/><circle cx="200" cy="175" r="30" ${A}/>`],
  cabo: ["#eff6ff", "#e0e7ff", `<rect x="80" y="125" width="60" height="44" rx="10" ${S}/><rect x="56" y="137" width="24" height="20" rx="4" fill="${AZUL}"/><path d="M140 147 c60 0 50 -70 110 -70 s60 140 10 140 h-10" ${S}/><rect x="250" y="195" width="50" height="40" rx="10" ${S}/><rect x="300" y="207" width="22" height="16" rx="4" fill="${AZUL}"/>`],
  carregador: ["#f0fdf4", "#d1fae5", `<rect x="135" y="85" width="130" height="130" rx="24" ${S}/><path d="M175 85 v-35 M225 85 v-35" ${S}/><rect x="185" y="185" width="30" height="12" rx="4" fill="${AZUL}"/><path d="M208 115 l-20 35 h26 l-20 35" ${A}/>`],
  fone: ["#faf5ff", "#f3e8ff", `<path d="M120 190 v-40 a80 80 0 0 1 160 0 v40" ${S}/>` + [105, 255].map((x) => `<rect x="${x}" y="170" width="40" height="70" rx="16" fill="${AZUL}" fill-opacity=".25" stroke="${INK}" stroke-width="6"/>`).join("")],
  outros: ["#f8fafc", "#e2e8f0", `<circle cx="200" cy="150" r="70" ${S}/><circle cx="200" cy="150" r="34" ${A}/><path d="M200 60 v-20 M200 260 v-20 M110 150 h-20 M310 150 h-20" ${S}/>`],
};

const cache: Partial<Record<TipoProduto, string>> = {};
const tipoValido = (tipo: TipoProduto | null | undefined): TipoProduto => (tipo && ARTE[tipo] ? tipo : "outros");

/** Desenho do tipo (fundo transparente) — use com `object-contain` sobre `fundoIlustracao`. */
export function ilustracaoProduto(tipo: TipoProduto | null | undefined): string {
  const t = tipoValido(tipo);
  if (!cache[t]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 25 340 260">${ARTE[t][2]}</svg>`;
    cache[t] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  return cache[t]!;
}

/** Fundo em degradê da cor do tipo, para o espaço da foto. */
export function fundoIlustracao(tipo: TipoProduto | null | undefined): string {
  const [c1, c2] = ARTE[tipoValido(tipo)];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}
