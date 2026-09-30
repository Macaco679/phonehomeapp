// Localização aproximada a partir de um endereço, usando o OpenStreetMap
// (Nominatim). Serve para filtrar a fila de trabalhos por raio de atendimento.
// Se não achar (ou estiver fora do ar), devolve null e o fluxo segue normalmente
// — o trabalho fica sem coordenadas e aparece para todas as assistências.

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export async function geocodificar(endereco: string): Promise<Coordenadas | null> {
  const texto = endereco.trim();
  if (texto.length < 5) return null;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", texto);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "pt-BR" },
    });
    if (!res.ok) return null;
    const dados = (await res.json()) as { lat: string; lon: string }[];
    if (!dados.length) return null;
    const latitude = Number(dados[0].lat);
    const longitude = Number(dados[0].lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const rad = (n: number) => (n * Math.PI) / 180;
  const cos =
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.cos(rad(b.longitude) - rad(a.longitude)) +
    Math.sin(rad(a.latitude)) * Math.sin(rad(b.latitude));
  return 6371 * Math.acos(Math.min(1, Math.max(-1, cos)));
}
