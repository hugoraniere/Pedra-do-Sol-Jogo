/** Os cinco poderes do heroi: FORCA, DESTREZA, AGILIDADE, INTELIGENCIA,
 * VITALIDADE (revisao de 2026-09-04 - eram tres na mesa, ver CLAUDE.md).
 *
 * A regra e a do manual impresso, pagina 2, passo 4: todo poder comeca em zero,
 * a raca da +1, a classe da +1, e o jogador coloca mais +1 onde quiser.
 *
 * Sistema puro: nenhuma linha de Phaser aqui. O dado, o teste e a progressao vao
 * chamar isto de dentro da cena, e isto nunca precisa saber que existe uma cena.
 *
 * O estado guarda so a ESCOLHA do jogador. O total e sempre calculado, nunca
 * gravado: um save do Lele feito hoje continua certo se amanha uma raca trocar
 * de bonus em conteudo.ts.
 */
import { Atributo, acharClasse, acharRaca } from "../dados/conteudo";
import type { Heroi } from "./estado";

export type Poderes = Record<Atributo, number>;

export const zerados = (): Poderes => ({ forca: 0, destreza: 0, agilidade: 0, inteligencia: 0, vitalidade: 0 });

/** O que a origem do heroi da sozinha: +1 e +1 da raca (revisao de
 *  2026-09-05, ver docs/15-lore-e-visual-das-racas.md — o bonus de raca virou
 *  um ciclo de dois atributos vizinhos) e +1 da classe. */
export function poderesDaOrigem(raca: string, classe: string): Poderes {
  const poderes = zerados();
  acharRaca(raca).bonus.forEach((atributo) => { poderes[atributo] += 1; });
  poderes[acharClasse(classe).bonus] += 1;
  return poderes;
}

/** O poder que o jogador escolheu reforcar.
 *
 *  Quando nao ha escolha gravada — save feito antes deste campo existir, ou
 *  rascunho que ainda nao passou pelo passo — vale o poder da raca. O heroi
 *  nunca anda por ai com um ponto a menos do que o papel lhe daria. */
export function poderEscolhidoDoHeroi(heroi: Heroi): Atributo {
  const escolhido = heroi.poderEscolhido as Atributo;
  if (
    escolhido === "forca" || escolhido === "destreza" || escolhido === "agilidade" ||
    escolhido === "inteligencia" || escolhido === "vitalidade"
  ) {
    return escolhido;
  }
  // primeiro atributo do ciclo da raca -- so um chute default, valido ate o
  // jogador escolher; qual dos dois pouco importa aqui.
  return acharRaca(heroi.raca).bonus[0];
}

/** O total dos tres poderes: origem, mais o +1 da criacao, mais qualquer
 *  Selo de Heroi ja trocado por poder (`estado().heroi.bonusDeSelo`). */
export function poderesDoHeroi(heroi: Heroi): Poderes {
  const poderes = poderesDaOrigem(heroi.raca, heroi.classe);
  poderes[poderEscolhidoDoHeroi(heroi)] += 1;
  (Object.keys(poderes) as Atributo[]).forEach((a) => {
    poderes[a] += heroi.bonusDeSelo?.[a] ?? 0;
  });
  return poderes;
}

/** Vida maxima: base da raca (o "coracoes" dela, 3 ou 4 no Anao - "Casco
 *  Duro" - vira multiplicador de tanque, nao mais contagem de icone) vezes
 *  5, mais 3 por ponto de Vitalidade. Revisao de 2026-09-05: vida virou
 *  numero de verdade (BG3/D&D: dado de vida + modificador de Constituicao),
 *  não mais uma fileira pequena de coracoes - dano de arma/magia (sistemas/
 *  dado.ts) finalmente tem numero suficiente pra variar de verdade. Antes
 *  disto `coracoesMax` era sempre 3, ignorando raca E atributo - o dom do
 *  Anao nunca funcionava, e Vitalidade nao mudava nada na vida do heroi, so
 *  no nome. Chamado uma vez em `novoJogo()` (sistemas/estado.ts) - nao
 *  recalculado toda hora feito `poderesDoHeroi`, porque nao existe ainda
 *  como Vitalidade mudar DEPOIS da criacao (isso e o Selo de Heroi, que
 *  ainda nao foi implementado). */
export function coracoesMaxDoHeroi(heroi: Heroi): number {
  return acharRaca(heroi.raca).coracoes * 5 + poderesDoHeroi(heroi).vitalidade * 3;
}

/** Quantos selos faltam para a proxima escolha.
 *
 *  No papel: a cada 3 selos pintados o jogador escolhe mais 1 coracao, mais 1
 *  num poder, ou uma habilidade nova. E o sistema de progressao do RPG dele, e
 *  por isso o jogo nao precisa inventar experiencia nenhuma. */
export const selosParaProximaEscolha = (selos: number) => 3 - (selos % 3);
