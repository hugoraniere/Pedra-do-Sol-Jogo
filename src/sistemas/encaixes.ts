/** Os pontos de encaixe: onde fica a mao e o tronco em cada quadro.
 *
 * O arquivo public/assets/encaixes.json e gerado por arte/gerar.py a partir da
 * MESMA conta que desenha o braco. E por isso que a arma nunca sai do lugar
 * quando alguem mexe na anatomia: nao existe uma segunda copia da conta aqui.
 *
 * Indice do quadro = linha da direcao vezes COLUNAS_FOLHA, mais a coluna,
 * igual ao numero do quadro na folha de sprite. */

import { COLUNAS_FOLHA } from "../dados/config";

export type Ponto = [number, number];

export type FichaArma = {
  largura: number;
  altura: number;
  pega: Ponto;
  /** vira ao contrario quando o personagem olha para a esquerda */
  espelha: boolean;
  /** fica atras do corpo quando o personagem anda de costas */
  atras: boolean;
};

/** A grade de uma peca encaixada (roupa ou armadura): 4 vistas x 3 balancos
 *  de passo. As duas secoes do JSON tem exatamente esta forma de proposito
 *  — armadura.py importa os numeros de roupa.py, nao inventa os proprios. */
export type FichaPecaEncaixada = {
  largura: number;
  altura: number;
  vistas: string[];
  vistaDaDirecao: Record<string, number>;
  /** coluna do quadro do corpo -> linha da folha da peca */
  linhaDoQuadro: number[];
};

export type Encaixes = {
  colunas: string[];
  linhas: string[];
  pontos: Record<string, { mao: Ponto[]; maoFraca: (Ponto | null)[]; tronco: Ponto[]; cabeca: Ponto[] }>;
  armas: Record<string, FichaArma>;
  roupa: FichaPecaEncaixada;
  /** mesma grade de `roupa` — irma da secao acima, nao uma segunda forma.
   *  `quadroDaRoupa` serve pras duas: os dois lados da conta sao identicos. */
  armadura: FichaPecaEncaixada;
};

let tabela: Encaixes | undefined;

export function guardarEncaixes(dados: Encaixes) {
  tabela = dados;
}

export function encaixes(): Encaixes | undefined {
  return tabela;
}

/** O quadro da folha de roupa que corresponde a um quadro do corpo. */
export function quadroDaRoupa(quadroDoCorpo: number, colunas = COLUNAS_FOLHA): number {
  const e = tabela;
  if (!e) return 0;
  const linhaDirecao = Math.floor(quadroDoCorpo / colunas);
  const coluna = quadroDoCorpo % colunas;
  const vista = e.roupa.vistaDaDirecao[e.linhas[linhaDirecao] ?? "baixo"] ?? 0;
  const linha = e.roupa.linhaDoQuadro[coluna] ?? 0;
  return linha * e.roupa.vistas.length + vista;
}
