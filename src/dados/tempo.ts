/** O relogio do jogo: quantos periodos tem um dia, quando cada um comeca, e
 *  que ceu cada um pinta por cima do mundo. So dado, sem logica — quem le e
 *  faz a conta e sistemas/tempo.ts, no mesmo espirito de dados/sons.ts +
 *  sistemas/som.ts. */
import { COR } from "./config";

export type Periodo = "madrugada" | "aurora" | "manha" | "tarde" | "por-do-sol" | "noite";

/** Um dia de jogo inteiro, em minutos simulados (nao minutos reais). */
export const MINUTOS_POR_DIA = 1440;

/** Quantos minutos REAIS um dia de jogo inteiro dura. Numero de balanceamento,
 *  facil de ajustar: mais baixo, o ceu muda mais rapido. */
export const MINUTOS_REAIS_POR_DIA_DE_JOGO = 20;

/** Cada periodo comeca aos `inicio` minutos do dia simulado (lista SEMPRE
 *  ordenada por `inicio` crescente, comecando em 0 — `sistemas/tempo.ts` acha
 *  o periodo atual pelo ultimo `inicio` que ja passou) e pinta o ceu com esta
 *  cor e alpha (0 = ceu limpo, sem overlay).
 *
 *  As faixas NAO sao iguais de proposito: aurora e por-do-sol sao janelas
 *  curtas de transicao (180 min cada, exatamente 2x `TRANSICAO_MIN` de
 *  sistemas/tempo.ts, pra transicao de entrada e de saida nunca se
 *  sobrepor), os outros quatro periodos sao mais longos.
 *
 *  Cores: `COR.tinta` pra noite/madrugada (a mesma cor ja de fundo da camera
 *  em Mundo.ts, so com alpha), `COR.rosa` pra aurora e `COR.brasa` pra
 *  por-do-sol — as duas ja existem na paleta e nunca foram usadas pra ceu,
 *  entao nenhuma cor nova nasce aqui. O alpha maximo (madrugada, 0.50) fica
 *  bem abaixo de opaco de proposito: a referencia de mesa diz que em Aurora
 *  "a noite nunca ficava totalmente escura, por causa da Pedra do Sol". */
export const PERIODOS: { id: Periodo; nome: string; inicio: number; corCeu: number; alphaCeu: number }[] = [
  { id: "madrugada", nome: "Madrugada", inicio: 0, corCeu: COR.tinta, alphaCeu: 0.5 },
  { id: "aurora", nome: "Aurora", inicio: 180, corCeu: COR.rosa, alphaCeu: 0.22 },
  { id: "manha", nome: "Manha", inicio: 360, corCeu: COR.tinta, alphaCeu: 0 },
  { id: "tarde", nome: "Tarde", inicio: 660, corCeu: COR.tinta, alphaCeu: 0 },
  { id: "por-do-sol", nome: "Por do sol", inicio: 900, corCeu: COR.brasa, alphaCeu: 0.28 },
  { id: "noite", nome: "Noite", inicio: 1080, corCeu: COR.tinta, alphaCeu: 0.42 },
];
