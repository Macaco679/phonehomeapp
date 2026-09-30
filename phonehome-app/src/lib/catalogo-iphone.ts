// Catálogo de iPhones (11 em diante) — mesma lista que o banco carrega no estoque
// de cada assistência (marketplace_seed_estoque_iphone). Usado para ordenar e
// agrupar as peças na tela de estoque.

export const MODELOS_IPHONE = [
  "iPhone 11",
  "iPhone 11 Pro",
  "iPhone 11 Pro Max",
  "iPhone 12 mini",
  "iPhone 12",
  "iPhone 12 Pro",
  "iPhone 12 Pro Max",
  "iPhone 13 mini",
  "iPhone 13",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 14",
  "iPhone 14 Plus",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Plus",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16e",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
  "iPhone 17",
  "iPhone Air",
  "iPhone 17 Pro",
  "iPhone 17 Pro Max",
] as const;

export const PECAS_IPHONE = [
  "Tela",
  "Bateria",
  "Conector de carga",
  "Câmera traseira",
  "Câmera frontal",
  "Alto-falante auricular",
  "Alto-falante inferior",
  "Taptic Engine",
  "Vidro traseiro",
  "Flex Face ID",
] as const;

export const SERIES = ["11", "12", "13", "14", "15", "16", "17"] as const;
export type Serie = (typeof SERIES)[number];

// iPhone 16e pertence à família 16; iPhone Air, à família 17.
export function serieDoModelo(modelo: string | null | undefined): Serie | null {
  if (!modelo) return null;
  if (modelo === "iPhone Air") return "17";
  const m = modelo.match(/iPhone (\d+)/);
  if (!m) return null;
  return (SERIES as readonly string[]).includes(m[1]) ? (m[1] as Serie) : null;
}

export function ordemDoModelo(modelo: string | null | undefined): number {
  if (!modelo) return 9999;
  const i = (MODELOS_IPHONE as readonly string[]).indexOf(modelo);
  return i === -1 ? 9000 : i;
}

export function ordemDaPeca(peca: string): number {
  const i = (PECAS_IPHONE as readonly string[]).indexOf(peca);
  return i === -1 ? 999 : i;
}

// Modelos para o cliente escolher ao agendar (inclui os mais antigos), do mais novo ao mais antigo.
export const FAMILIAS_AGENDAMENTO: { titulo: string; modelos: string[] }[] = [
  { titulo: "iPhone 17", modelos: ["iPhone 17", "iPhone Air", "iPhone 17 Pro", "iPhone 17 Pro Max"] },
  { titulo: "iPhone 16", modelos: ["iPhone 16e", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max"] },
  { titulo: "iPhone 15", modelos: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"] },
  { titulo: "iPhone 14", modelos: ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"] },
  { titulo: "iPhone 13", modelos: ["iPhone 13 mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max"] },
  { titulo: "iPhone 12", modelos: ["iPhone 12 mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max"] },
  { titulo: "iPhone 11", modelos: ["iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max"] },
  {
    titulo: "Mais antigos",
    modelos: [
      "iPhone SE (3ª geração)", "iPhone SE (2ª geração)", "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
      "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7", "iPhone 6s Plus", "iPhone 6s", "iPhone 6 Plus", "iPhone 6",
    ],
  },
];
