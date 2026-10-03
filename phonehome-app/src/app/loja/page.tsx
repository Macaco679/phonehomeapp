import { Catalogo } from "@/components/loja/catalogo";

// Loja do cliente: só acessórios. Peças são vendidas para assistências em /dashboard/pecas.
export default function LojaPage() {
  return <Catalogo modo="cliente" />;
}
