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

/** So a comparacao, sem rolar dado nenhum - separado de `testar()` pra quem
 *  precisa comparar o MESMO dado ja rolado contra ND's diferentes (uma acao
 *  em area, um alvo por vez: o dado fisico e um so por acao, mas o ND de
 *  cada alvo pode ser diferente, entao o desfecho de cada um tambem pode
 *  ser - ver Combate.ts, a acao em area). */
export function desfechoDoTeste(dado: number, total: number, nd: number): Desfecho {
  if (dado === 20) return "critico-sucesso";
  if (dado === 1) return "critico-fracasso";
  if (total >= nd) return "sucesso";
  if (nd - total <= MARGEM_DE_FALHA_PERTO) return "falha-perto";
  return "falha";
}

export function testar(modificador: number, nd: number, sorteio: () => number): ResultadoDeTeste {
  const dado = sorteio();
  const total = dado + modificador;
  return { dado, total, nd, desfecho: desfechoDoTeste(dado, total, nd) };
}
