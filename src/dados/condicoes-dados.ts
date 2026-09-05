/** O que cada condicao MOSTRA: nome e cor. E SO DADO, igual conteudo.ts —
 *  nenhuma logica, nenhum Phaser. A logica de duracao mora em
 *  sistemas/condicoes.ts; a decisao de quando aplicar mora em
 *  sistemas/marcas.ts. Aqui e so "como e que isso se parece".
 *
 * Seis condicoes tem ficha (revisao de 2026-09-04, junto da reformulacao das
 * 11 magias restantes): as duas que ja existiam (molhado, congelado) mais as
 * quatro que `aplicarMarca()` passou a aplicar de verdade (preso, assustado,
 * atraido, iluminado). As outras sete do union de `IdCondicao` ainda nao tem
 * comportamento nenhum te aplicando - quem for exibir usa `condicoesDados(id)`
 * e recebe uma ficha cinza generica em vez de undefined, para nunca faltar
 * cor no meio de uma fileira de icones. */
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
  preso: { nome: "PRESO", cor: 0x3e9b62 },
  assustado: { nome: "ASSUSTADO", cor: 0x7b5ac4 },
  atraido: { nome: "ATRAIDO", cor: 0xf5b62b },
  iluminado: { nome: "ILUMINADO", cor: 0xfff8ea },
  escondido: { nome: "ESCONDIDO", cor: 0x4a3e64 },
  // "rapido" e o id generico de condicoes.ts, mas quem carrega hoje e so a
  // Aderencia (maos grudentas escalando qualquer superficie) - o nome exibido
  // conta a historia de verdade, o id por baixo pode servir a outra magia de
  // velocidade no futuro sem precisar renomear nada (ver sistemas/marcas.ts).
  rapido: { nome: "GRUDENTO", cor: 0xee7ba6 },
};

export function condicoesDados(id: IdCondicao): FichaCondicao {
  return CONDICOES_DADOS[id] ?? GENERICA;
}
