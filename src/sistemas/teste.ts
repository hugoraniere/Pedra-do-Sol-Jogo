/** O motor de teste novo (revisao de 2026-09-04, docs/modelo-de-combate.md secao 3):
 *  1d20 + modificador contra um numero de dificuldade (ND), cinco desfechos.
 *
 *  Substitui `rolar()`/`faixaDoDado()` (turnos.ts / dados/sons.ts) SO no jogo de
 *  verdade (`Combate.ts`). Aqueles continuam existindo porque `Provador.ts`, o
 *  banco de prova descartavel, ainda os usa - nao valia a pena atualizar uma
 *  cena que existe pra ser jogada fora.
 *
 *  Sistema puro, sem Phaser: `sorteio` entra de fora, igual `rolar()` ja fazia,
 *  pra dar pra testar sem depender de aleatorio de verdade. */

export type Desfecho = "critico-sucesso" | "sucesso" | "falha-perto" | "falha" | "critico-fracasso";

export type ResultadoDeTeste = {
  /** o d20 puro, 1 a 20, antes de somar qualquer coisa */
  dado: number;
  /** dado + modificador */
  total: number;
  /** o numero de dificuldade contra o qual `total` foi comparado */
  nd: number;
  desfecho: Desfecho;
};

/** Sucesso de verdade: so estes dois desfechos significam "a acao funcionou". */
export function foiSucesso(desfecho: Desfecho): boolean {
  return desfecho === "sucesso" || desfecho === "critico-sucesso";
}

/** A margem que separa "falha comum" de "falha perto" - ver docs/modelo-de-combate.md. */
const MARGEM_DE_FALHA_PERTO = 3;

export function testar(modificador: number, nd: number, sorteio: () => number): ResultadoDeTeste {
  const dado = sorteio();
  const total = dado + modificador;
  let desfecho: Desfecho;
  if (dado === 20) desfecho = "critico-sucesso";
  else if (dado === 1) desfecho = "critico-fracasso";
  else if (total >= nd) desfecho = "sucesso";
  else if (nd - total <= MARGEM_DE_FALHA_PERTO) desfecho = "falha-perto";
  else desfecho = "falha";
  return { dado, total, nd, desfecho };
}
