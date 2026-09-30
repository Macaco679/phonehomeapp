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
  latitude: number | null;
  longitude: number | null;
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
  created_at?: string;
}

export interface Convite {
  id: string;
  assistencia_id: string;
  email: string;
  papel: "tecnico";
  status: "pendente" | "aceito" | "cancelado";
  created_at: string;
}

export interface Cliente {
  id: string;
  auth_user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

export type ConfirmacaoCliente = "pendente" | "confirmado" | "contestado";

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
  latitude: number | null;
  longitude: number | null;
  horario_preferido: string | null;
  status: StatusTrabalho;
  valor_final: number | null;
  forma_pagamento: "app" | "presencial" | null;
  pago_em_app: boolean;
  comissao_pct: number | null;
  comissao_valor: number | null;
  acerto_status: "nao_aplicavel" | "pendente" | "quitado";
  cliente_confirmacao: ConfirmacaoCliente;
  cliente_motivo: string | null;
  cliente_confirmacao_em: string | null;
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

export interface TrabalhoPeca {
  id: string;
  trabalho_id: string;
  estoque_id: string;
  quantidade: number;
  baixado: boolean;
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

export interface Preco {
  id: string;
  marca: string;
  modelo: string;
  tipo_reparo: string;
  preco: number;
  ativo: boolean;
}

export interface Produto {
  id: string;
  assistencia_id: string;
  nome: string;
  descricao: string | null;
  categoria: "peca" | "acessorio";
  modelo_compativel: string | null;
  preco: number;
  quantidade: number;
  imagem_url: string | null;
  ativo: boolean;
  created_at: string;
}

export type StatusPedido =
  | "aguardando_pagamento"
  | "pago"
  | "enviado"
  | "entregue"
  | "cancelado";

export interface Pedido {
  id: string;
  cliente_id: string;
  assistencia_id: string;
  status: StatusPedido;
  total: number;
  endereco_entrega: string;
  observacao: string | null;
  pago_em: string | null;
  created_at: string;
  itens?: PedidoItem[];
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string | null;
  nome: string;
  preco_unit: number;
  quantidade: number;
}

export interface Config {
  comissao_padrao_pct: number;
  limite_comissao_pendente: number;
  dias_tolerancia_comissao: number;
  instrucoes_comissao: string;
}

export const STATUS_LABEL: Record<StatusTrabalho, string> = {
  fila: "Buscando assistência",
  aceito: "Aceito",
  a_caminho: "Técnico a caminho",
  em_reparo: "Em reparo",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_PEDIDO_LABEL: Record<StatusPedido, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

// Mesmos reparos do site iphonehome.com.br.
export const TIPOS_REPARO = [
  "Display 1ª linha",
  "Display original",
  "Bateria",
  "Conector de carga",
  "Câmera frontal",
  "Câmera traseira",
  "Alto-falante",
  "Carcaça",
  "Vidro frontal",
  "Vidro traseiro",
];

export const MARCAS = ["Apple", "Samsung", "Outra"];

export function formatBRL(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatData(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
