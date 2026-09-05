/** Fome e sono: indicadores de status fora de combate, estilo Project
 *  Zomboid. Sobem sozinhos com o relogio de jogo (nao com minutos reais de
 *  sessao — ver dados/tempo.ts), e resetam quando o heroi come ou dorme.
 *
 *  Sistema puro: nenhuma linha de Phaser aqui, no mesmo espirito de
 *  sistemas/tempo.ts. Quem chama `avancarMoodles` e Mundo.ts, no mesmo
 *  lugar e com o mesmo delta que ja chama `avancarRelogio` — por isso
 *  fome/sono nunca sobem durante uma fala ou um combate, so andando pelo
 *  mundo, de graca.
 *
 *  Decisao de 2026-09-05: isto reverte a exclusao de fome/sede que
 *  docs/plano-de-itens-e-equipamento.md (secao 3) tinha decidido de
 *  proposito ("nenhum esta na mesa, pesam contra Legibilidade/Densidade").
 *  A reversao e motivada pela virada de tom do jogo pra "RPG de
 *  sobrevivencia... no tom seco de jogos como Project Zomboid" (CLAUDE.md),
 *  decidida depois daquele plano. Frio/molhado fica de fora desta rodada —
 *  ver docs/plano-de-moodles.md. */
import { estado } from "./estado";
import { MINUTOS_POR_DIA, MINUTOS_REAIS_POR_DIA_DE_JOGO } from "../dados/tempo";

const MINUTOS_JOGO_POR_MS = MINUTOS_POR_DIA / (MINUTOS_REAIS_POR_DIA_DE_JOGO * 60000);

/** Fome leva ~2 dias de jogo (2880 min simulados) pra ficar critica; sono
 *  leva ~1 dia (1440 min) — dormir uma vez por ciclo dia/noite e o ritmo
 *  que a cama ja pede emprestado do relogio existente. */
const TAXA_FOME = 100 / 2880;
const TAXA_SONO = 100 / 1440;

export const LIMIAR_ALERTA = 60;
export const LIMIAR_CRITICO = 90;

/** Chamado a cada frame que o heroi anda pelo mundo, com o mesmo `delta`
 *  (ms reais) que `avancarRelogio` ja recebe. Nao salva sozinho, igual o
 *  relogio. */
export function avancarMoodles(deltaMs: number) {
  const e = estado();
  const deltaMin = deltaMs * MINUTOS_JOGO_POR_MS;
  e.fome = Math.min(100, e.fome + deltaMin * TAXA_FOME);
  e.sono = Math.min(100, e.sono + deltaMin * TAXA_SONO);
}

export type Moodle = "fome" | "sono";
export type NivelDeMoodle = "normal" | "alerta" | "critico";

export function nivelDoMoodle(m: Moodle): NivelDeMoodle {
  const v = estado()[m];
  return v >= LIMIAR_CRITICO ? "critico" : v >= LIMIAR_ALERTA ? "alerta" : "normal";
}

/** Fome e sono nunca empilham penalidade — os dois criticos ao mesmo tempo
 *  pesam o mesmo que so um, igual toda condicao de sistemas/condicoes.ts ja
 *  nunca empilha. */
export function algumMoodleCritico(): boolean {
  return nivelDoMoodle("fome") === "critico" || nivelDoMoodle("sono") === "critico";
}
