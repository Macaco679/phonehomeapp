export type StatusTrabalho =
  | "fila"
  | "aceito"
  | "a_caminho"
  | "em_reparo"
  | "concluido"
  | "cancelado";

export interface Assistencia {
  id: string;
  nome: string;
  endereco: string | null;
  raio_atendimento_km: number;
  especialidades: string[];
  taxa_comissao_pct: number;
  status: "ativa" | "pausada";
  created_at: string;
}

export interface UsuarioAssistencia {
  id: string;
  auth_user_id: string;
  assistencia_id: string;
  papel: "dono" | "tecnico";
  nome: string | null;
  telefone: string | null;
}

export interface Cliente {
  id: string;
  auth_user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

export interface Trabalho {
  id: string;
  cliente_id: string;
  assistencia_id: string | null;
  tecnico_id: string | null;
  marca: string;
  modelo: string;
  tipo_reparo: string;
  preco_estimado: number | null;
  endereco: string;
  horario_preferido: string | null;
  status: StatusTrabalho;
  valor_final: number | null;
  forma_pagamento: "app" | "presencial" | null;
  pago_em_app: boolean;
  created_at: string;
  aceito_em: string | null;
  concluido_em: string | null;
}

export interface EstoqueItem {
  id: string;
  assistencia_id: string;
  peca: string;
  modelo_compativel: string | null;
  quantidade: number;
  quantidade_minima: number;
  preco_custo: number | null;
  preco_venda: number | null;
  updated_at: string;
}

export interface CaixaLancamento {
  id: string;
  assistencia_id: string;
  trabalho_id: string | null;
  tipo: "receita" | "comissao_plataforma" | "despesa";
  valor: number;
  descricao: string | null;
  created_at: string;
}

export const STATUS_LABEL: Record<StatusTrabalho, string> = {
  fila: "Buscando assistência",
  aceito: "Aceito",
  a_caminho: "Técnico a caminho",
  em_reparo: "Em reparo",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const TIPOS_REPARO = [
  "Display",
  "Bateria",
  "Conector de carga",
  "Câmera frontal",
  "Câmera traseira",
  "Alto-falante",
  "Carcaça",
];

export const MARCAS = ["Apple", "Samsung", "Outra"];

export function formatBRL(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Preço estimado simples por tipo de reparo — placeholder até puxarmos a
// tabela real do iphonehome.com.br (fica registrado como decisão em aberto).
export const PRECO_BASE: Record<string, number> = {
  Display: 350,
  Bateria: 220,
  "Conector de carga": 180,
  "Câmera frontal": 200,
  "Câmera traseira": 280,
  "Alto-falante": 150,
  Carcaça: 400,
};
