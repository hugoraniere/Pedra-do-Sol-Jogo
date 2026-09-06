/** O dado de DANO - diferente do d20 de sistemas/teste.ts, que decide SE a
 *  acao funciona. Este decide QUANTO ela pesa quando funciona: cada arma e
 *  cada magia carrega o proprio (`AcaoDeCombate.dado`, dados/conteudo.ts),
 *  igual cada criatura carrega o dela (`Criatura.dano`).
 *
 * Revisao de 2026-09-05: substitui o dano fixo de 1 ou 2 coracoes que valia
 * pra qualquer golpe, de qualquer arma, contra qualquer bicho - a diferenca
 * entre uma adaga e um martelo, ou entre um goblin e o Brasanegra, comeca
 * aqui. Sistema puro, sorteio de fora, mesmo molde de sistemas/teste.ts.
 */

export type Dado = { quantidade: number; lados: number };

export function rolarDado(dado: Dado, sorteio: () => number): number {
  let total = 0;
  for (let i = 0; i < dado.quantidade; i++) total += Math.floor(sorteio() * dado.lados) + 1;
  return total;
}

/** Critico de sucesso "sempre funciona + efeito extra" (docs/modelo-de-
 *  combate.md secao 3) - o efeito extra e dano dobrado, a mesma regra do
 *  D&D: dobra os DADOS, nao o resultado (rola tudo de novo, nao multiplica
 *  por 2 - preserva a variancia em vez de so inflar o numero). */
export function dobrar(dado: Dado): Dado {
  return { quantidade: dado.quantidade * 2, lados: dado.lados };
}
