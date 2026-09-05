/** O que cada condicao MOSTRA: nome e cor. E SO DADO, igual conteudo.ts —
 *  nenhuma logica, nenhum Phaser. A logica de duracao mora em
 *  sistemas/condicoes.ts; a decisao de quando aplicar mora em
 *  sistemas/marcas.ts. Aqui e so "como e que isso se parece".
 *
 * So MOLHADO e CONGELADO tem ficha por enquanto, de proposito (ver
 * docs/plano-de-implementacao.md, Fase 3.3). As outras dez do union de
 * `IdCondicao` ainda nao tem comportamento, entao nao ganham desenho — quem
 * for exibir usa `condicoesDados(id)` e recebe uma ficha cinza generica em
 * vez de undefined, para nunca faltar cor no meio de uma fileira de icones.
 */
import type { IdCondicao } from "../sistemas/condicoes";

export type FichaCondicao = {
  nome: string;
  /** a mesma cor da acao que mais costuma aplicar essa condicao, quando faz
   *  sentido: molhado usa o azul do Bafo Gelado, por exemplo. */
  cor: number;
};

const GENERICA: FichaCondicao = { nome: "?", cor: 0x4a3e64 };

export const CONDICOES_DADOS: Partial<Record<IdCondicao, FichaCondicao>> = {
  molhado: { nome: "MOLHADO", cor: 0x2f6fb5 },
  congelado: { nome: "CONGELADO", cor: 0xcde9f8 },
};

export function condicoesDados(id: IdCondicao): FichaCondicao {
  return CONDICOES_DADOS[id] ?? GENERICA;
}
