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

/** Na metade dos coracoes OU ABAIXO, todo `medroso` foge, sem excecao -
 *  conferido explicitamente pelo caso "exatamente na metade" em
 *  ferramentas/conferir-criatura.mjs, entao o `<=` e proposital, nao bug. */
const FRACAO_FRACA = 0.5;

export function decidirAcaoDaCriatura(
  comportamento: Comportamento,
  distancia: number,
  coracoes: number,
  coracoesMax: number,
  /** Ja atacou o heroi adjacente nesta aproximacao? So importa para
   *  `medroso`: ele topa um golpe de susto, nunca dois seguidos. O chamador
   *  guarda isto por criatura (nao existe estado aqui dentro). */
  jaAtacouDeSurpresa = false,
  /** Condicao de Cresce-Grama/Dedo Colante (docs/mundo-que-reage.md secao 3):
   *  "movimento 0, mas ainda age" - bloqueia qualquer decisao que exigisse
   *  andar, nunca a de atacar quem ja esta adjacente. */
  preso = false,
  /** Condicao de Voz de Trovao/Sino Espanta-Monstro (mesma secao): "anda
   *  para longe do heroi e nao ataca" - por cima de qualquer comportamento,
   *  inclusive curioso/medroso. */
  assustado = false
): Intencao {
  const fraco = coracoesMax > 0 && coracoes / coracoesMax <= FRACAO_FRACA;
  const adjacente = distancia <= ADJACENTE;

  let base: Intencao;
  if (assustado) {
    base = "fugir";
  } else if (comportamento === "medroso") {
    if (fraco) base = "fugir";
    else if (adjacente) base = jaAtacouDeSurpresa ? "fugir" : "atacar";
    else base = "avancar";
  } else if (comportamento === "curioso") {
    base = adjacente ? "atacar" : "avancar";
  } else {
    // passeia: so reage colado. Ficar "esperando" aqui e o que deixa o
    // passeio aleatorio (desenhado em Provador.ts) tomar conta do movimento.
    base = adjacente ? "atacar" : "esperar";
  }

  // so "atacar" nao exige andar - qualquer outra decisao vira esperar
  // quando presa, porque a criatura nao tem como executa-la parada.
  if (preso && base !== "atacar") return "esperar";
  return base;
}
