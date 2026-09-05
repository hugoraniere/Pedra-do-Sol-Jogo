/** O dado do RPG de mesa: 1d6 + atributo, em tres faixas.
 *
 * Sistema puro: nenhuma linha de Phaser, nenhum som, nenhuma cena. A conta e
 * a do CLAUDE.md — 1 a 2 OPS (deu errado, acontece outra coisa), 3 a 4 QUASE
 * (deu certo com um probleminha), 5 ou mais OBA/INCRIVEL — e nada mais. O
 * sorteio entra de fora (nunca `Math.random()` chamado aqui dentro) para o
 * resultado poder ser conferido em teste sem depender de aleatorio de
 * verdade. So o heroi rola; a regra da mesa e essa.
 *
 * Revisao de 2026-09-05: renomeado de `dado.ts` pra `dadoAntigo.ts` - esse
 * nome passou a pertencer ao dado de DANO do jogo de verdade (1d6/1d8, ver
 * `dado.ts`). Este arquivo so sobrevive porque `Provador.ts` (a bancada
 * descartavel que testou se o modelo por turnos cabia no jogo) ainda usa o
 * d6/3-faixas antigo - o jogo de verdade usa 1d20 (`sistemas/teste.ts`) desde
 * a revisao de 2026-09-04.
 */

export type Faixa = "ops" | "quase" | "oba";

/** Qual faixa um total (dado + atributo) cai. Bate com o RPG de mesa. */
export function faixaDoDado(total: number): Faixa {
  if (total <= 2) return "ops";
  if (total <= 4) return "quase";
  return "oba";
}

/** 1d6 + atributo, igual a mesa. */
export function rolar(atributo: number, sorteio: () => number): { dado: number; total: number } {
  const dado = sorteio();
  return { dado, total: dado + atributo };
}
