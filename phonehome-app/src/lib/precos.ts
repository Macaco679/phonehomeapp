import type { Preco } from "@/lib/types";

function norm(valor: string) {
  return valor.trim().toLowerCase();
}

// Preço mais específico primeiro: marca + modelo → marca → padrão geral.
export function resolverPreco(
  precos: Preco[],
  marca: string,
  modelo: string,
  tipoReparo: string,
  apenasModelo = false
): number | null {
  const doTipo = precos.filter((p) => p.ativo && p.tipo_reparo === tipoReparo);
  const m = norm(marca);
  const mod = norm(modelo);
  // Só o preço cadastrado para aquele modelo (sem cair no preço genérico).
  if (apenasModelo) {
    const exato = doTipo.find((p) => norm(p.marca) === m && mod !== "" && norm(p.modelo) === mod);
    return exato ? Number(exato.preco) : null;
  }
  const candidatos = [
    doTipo.find((p) => norm(p.marca) === m && mod !== "" && norm(p.modelo) === mod),
    doTipo.find((p) => norm(p.marca) === m && p.modelo === "*"),
    doTipo.find((p) => p.marca === "*" && mod !== "" && norm(p.modelo) === mod),
    doTipo.find((p) => p.marca === "*" && p.modelo === "*"),
  ];
  const achado = candidatos.find(Boolean);
  return achado ? Number(achado.preco) : null;
}
