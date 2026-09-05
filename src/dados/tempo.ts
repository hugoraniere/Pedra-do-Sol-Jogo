/** O relogio do jogo: quantos periodos tem um dia, quando cada um comeca, e
 *  que ceu cada um pinta por cima do mundo. So dado, sem logica — quem le e
 *  faz a conta e sistemas/tempo.ts, no mesmo espirito de dados/sons.ts +
 *  sistemas/som.ts. */
import { COR } from "./config";

export type Periodo = "madrugada" | "manha" | "tarde" | "noite";

/** Um dia de jogo inteiro, em minutos simulados (nao minutos reais). */
export const MINUTOS_POR_DIA = 1440;

/** Quantos minutos REAIS um dia de jogo inteiro dura. Numero de balanceamento,
 *  facil de ajustar: mais baixo, o ceu muda mais rapido. */
export const MINUTOS_REAIS_POR_DIA_DE_JOGO = 20;

/** Cada periodo comeca aos X minutos do dia simulado, cobre 1440/4 = 360
 *  minutos, e pinta o ceu com esta cor e alpha (0 = ceu limpo, sem overlay).
 *  So `COR.tinta` e usada — a mesma cor ja de fundo da camera em Mundo.ts —
 *  entao nenhuma cor nova nasce aqui, so um reuso com alpha diferente. */
export const PERIODOS: { id: Periodo; nome: string; inicio: number; corCeu: number; alphaCeu: number }[] = [
  { id: "madrugada", nome: "Madrugada", inicio: 0, corCeu: COR.tinta, alphaCeu: 0.55 },
  { id: "manha", nome: "Manha", inicio: 360, corCeu: COR.tinta, alphaCeu: 0 },
  { id: "tarde", nome: "Tarde", inicio: 720, corCeu: COR.tinta, alphaCeu: 0 },
  { id: "noite", nome: "Noite", inicio: 1080, corCeu: COR.tinta, alphaCeu: 0.45 },
];
