"use client";

import { useCallback, useEffect, useState } from "react";

export interface ItemCarrinho {
  produto_id: string;
  assistencia_id: string;
  nome: string;
  preco: number;
  quantidade: number;
  max: number;
}

const KEY = "phonehome_carrinho";

function ler(): ItemCarrinho[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ItemCarrinho[]) : [];
  } catch {
    return [];
  }
}

function gravar(itens: ItemCarrinho[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(itens));
  } catch {
    // navegador sem armazenamento: o carrinho vale só para esta visita
  }
}

export function useCarrinho() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setItens(ler());
    setPronto(true);
  }, []);

  const atualizar = useCallback((fn: (atual: ItemCarrinho[]) => ItemCarrinho[]) => {
    setItens((atual) => {
      const novo = fn(atual);
      gravar(novo);
      return novo;
    });
  }, []);

  const adicionar = useCallback(
    (item: Omit<ItemCarrinho, "quantidade">) =>
      atualizar((atual) => {
        const existente = atual.find((i) => i.produto_id === item.produto_id);
        if (existente) {
          return atual.map((i) =>
            i.produto_id === item.produto_id
              ? { ...i, quantidade: Math.min(i.quantidade + 1, item.max) }
              : i
          );
        }
        return [...atual, { ...item, quantidade: 1 }];
      }),
    [atualizar]
  );

  const alterarQuantidade = useCallback(
    (produtoId: string, quantidade: number) =>
      atualizar((atual) =>
        atual
          .map((i) => (i.produto_id === produtoId ? { ...i, quantidade: Math.min(quantidade, i.max) } : i))
          .filter((i) => i.quantidade > 0)
      ),
    [atualizar]
  );

  const limpar = useCallback(() => atualizar(() => []), [atualizar]);

  const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const quantidadeTotal = itens.reduce((s, i) => s + i.quantidade, 0);

  return { itens, pronto, adicionar, alterarQuantidade, limpar, total, quantidadeTotal };
}
