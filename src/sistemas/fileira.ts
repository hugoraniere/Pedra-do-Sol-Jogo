/** As duas primitivas de layout que faltam no design system.
 *
 * `design.ts` tem `pilha()`, que empilha para baixo. Nao tem nada que arrume
 * para o lado. A barra de atalhos e uma FILEIRA e o catalogo do ARSENAL e uma
 * GRADE, e sem primitiva as duas viram soma de X na mao, que e exatamente o que
 * o design system existe para impedir.
 *
 * Estas duas nasceram aqui, no ambiente `combate`, porque `design.ts` pertence
 * ao ambiente `ficha`. Quando as duas frentes se encontrarem, o lugar delas e
 * la dentro, ao lado de `pilha()`, com a mesma cara. Ver
 * docs/11-combate-e-magias.md, secao 14.
 */
import type { Retangulo } from "./design";

/**
 * Arruma elementos da esquerda para a direita dentro de uma area.
 *
 *   const f = fileira(area, 20, 2);
 *   const primeiro = f.reservar();
 *   const segundo = f.reservar();
 */
export function fileira(area: Retangulo, larguraPadrao: number, gapPadrao = 2) {
  let cursor = area.x;
  let primeiro = true;
  return {
    reservar(largura: number = larguraPadrao, gap: number = gapPadrao): Retangulo {
      if (!primeiro) cursor += gap;
      primeiro = false;
      const r = { x: cursor, y: area.y, largura, altura: area.altura };
      cursor += largura;
      return r;
    },
    /** Quantos elementos do tamanho padrao ainda cabem daqui ate o fim. */
    cabem(): number {
      const sobra = area.x + area.largura - cursor + gapPadrao;
      return Math.max(0, Math.floor(sobra / (larguraPadrao + gapPadrao)));
    },
    larguraUsada(): number {
      return cursor - area.x;
    },
  };
}

/** Quantos elementos de `lado` cabem numa largura, com `gap` entre eles. */
export function cabemNaLargura(largura: number, lado: number, gap = 2): number {
  return Math.max(0, Math.floor((largura + gap) / (lado + gap)));
}

/**
 * Grade de lado a lado e de cima para baixo. Devolve o retangulo do enesimo
 * elemento, contando do zero, sem ninguem somar linha nem coluna na mao.
 */
export function grade(area: Retangulo, lado: number, gap = 2) {
  const colunas = Math.max(1, cabemNaLargura(area.largura, lado, gap));
  return {
    colunas,
    linhas(total: number) {
      return Math.ceil(total / colunas);
    },
    alturaDe(total: number) {
      const l = Math.ceil(total / colunas);
      return l * lado + (l - 1) * gap;
    },
    casa(indice: number): Retangulo {
      const coluna = indice % colunas;
      const linha = Math.floor(indice / colunas);
      return {
        x: area.x + coluna * (lado + gap),
        y: area.y + linha * (lado + gap),
        largura: lado,
        altura: lado,
      };
    },
  };
}
