/** O que uma criatura QUER fazer no proprio turno. Logica pura: sem Phaser,
 *  sem saber o que e uma cena ou um sprite. So numeros entrando, uma palavra
 *  saindo. E o que deixa isto testavel com `node`, sem abrir navegador.
 *
 * Tres comportamentos, e so, porque tres ja contam a historia toda do
 * bestiario (ver docs/11-combate-e-magias.md, secao 13):
 *
 *   passeia  ignora o heroi ate ele chegar bem perto
 *   curioso  persegue ate ficar colado, depois ataca
 *   medroso  ataca uma vez se pego de surpresa, depois foge — "o goblin foge
 *            mais do que briga", como o material de mesa ja descrevia
 *
 * Quem MOVE a criatura e quem MUTA o `comportamento` dela com o tempo (a
 * transicao "passeia vira curioso por reflexo") e o chamador, em
 * `src/cenas/Provador.ts`. Esta funcao so responde "com esses numeros agora,
 * o que ela faz este turno", nunca muda estado.
 */

export type Comportamento = "passeia" | "curioso" | "medroso";
export type Intencao = "avancar" | "atacar" | "fugir" | "esperar";

/** Adjacente = a 1 casa, contando diagonal. Mesma definicao que
 *  `distanciaEmCasas` de `sistemas/alcance.ts` ja usa em todo o resto do jogo. */
const ADJACENTE = 1;

/** Abaixo de METADE dos coracoes, todo `medroso` foge, sem excecao. */
const FRACAO_FRACA = 0.5;

export function decidirAcaoDaCriatura(
  comportamento: Comportamento,
  distancia: number,
  coracoes: number,
  coracoesMax: number,
  /** Ja atacou o heroi adjacente nesta aproximacao? So importa para
   *  `medroso`: ele topa um golpe de susto, nunca dois seguidos. O chamador
   *  guarda isto por criatura (nao existe estado aqui dentro). */
  jaAtacouDeSurpresa = false
): Intencao {
  const fraco = coracoesMax > 0 && coracoes / coracoesMax < FRACAO_FRACA;
  const adjacente = distancia <= ADJACENTE;

  if (comportamento === "medroso") {
    if (fraco) return "fugir";
    if (adjacente) return jaAtacouDeSurpresa ? "fugir" : "atacar";
    return "avancar";
  }

  if (comportamento === "curioso") {
    return adjacente ? "atacar" : "avancar";
  }

  // passeia: so reage colado. Ficar "esperando" aqui e o que deixa o
  // passeio aleatorio (desenhado em Provador.ts) tomar conta do movimento.
  return adjacente ? "atacar" : "esperar";
}
