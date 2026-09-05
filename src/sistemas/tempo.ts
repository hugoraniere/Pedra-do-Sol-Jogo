/** Quem faz a conta do relogio de jogo. Puro, sem Phaser: le e escreve so em
 *  `estado().relogio`, no mesmo espirito de sistemas/som.ts falando com o
 *  catalogo de dados/sons.ts. Quem desenha o resultado (o ceu escurecendo,
 *  o NPC indo pra casa) e a cena Mundo. */
import { estado } from "./estado";
import { MINUTOS_POR_DIA, MINUTOS_REAIS_POR_DIA_DE_JOGO, PERIODOS, type Periodo } from "../dados/tempo";

const MINUTOS_JOGO_POR_MS = MINUTOS_POR_DIA / (MINUTOS_REAIS_POR_DIA_DE_JOGO * 60000);

/** Quantos minutos ja se passaram no dia simulado (0 a 1439). */
export function minutoDoDia(): number {
  return estado().relogio;
}

/** Avanca o relogio pelo tempo real decorrido. Nao salva sozinho: o relogio
 *  vai pro disco na proxima vez que qualquer outra acao chamar `salvar()`,
 *  igual `minutos` (o tempo total jogado) ja faz. */
export function avancarRelogio(deltaMs: number) {
  const e = estado();
  e.relogio = (e.relogio + deltaMs * MINUTOS_JOGO_POR_MS) % MINUTOS_POR_DIA;
}

/** O indice, em `PERIODOS`, de quem esta valendo agora: o ultimo cuja
 *  `inicio` ja passou. So funciona porque `PERIODOS` esta sempre ordenada por
 *  `inicio` crescente comecando em 0 — nao e mais uma divisao fixa, porque as
 *  faixas tem tamanhos diferentes (ver o comentario em dados/tempo.ts). */
function indiceDoPeriodo(minuto: number): number {
  for (let i = PERIODOS.length - 1; i >= 0; i--) {
    if (minuto >= PERIODOS[i].inicio) return i;
  }
  return 0;
}

/** Quantos minutos o periodo `idx` dura, medindo ate o inicio do proximo (com
 *  volta pro comeco do dia se for o ultimo da lista). */
function duracaoDoPeriodo(idx: number): number {
  const proximo = PERIODOS[(idx + 1) % PERIODOS.length].inicio;
  return ((proximo - PERIODOS[idx].inicio + MINUTOS_POR_DIA) % MINUTOS_POR_DIA) || MINUTOS_POR_DIA;
}

export function periodoAtual(): Periodo {
  return PERIODOS[indiceDoPeriodo(minutoDoDia())].id;
}

/** Quantos minutos de jogo faltam pro periodo atual acabar. */
const TRANSICAO_MIN = 90;

/** A cor e o alpha do ceu agora, interpolados nos ultimos minutos de cada
 *  periodo pra transicao nunca ser um corte seco. */
export function corDoCeu(): { cor: number; alpha: number } {
  const m = minutoDoDia();
  const idx = indiceDoPeriodo(m);
  const atual = PERIODOS[idx];
  const proximo = PERIODOS[(idx + 1) % PERIODOS.length];
  const decorridoNoPeriodo = m - atual.inicio;
  const faltam = duracaoDoPeriodo(idx) - decorridoNoPeriodo;
  if (faltam > TRANSICAO_MIN) return { cor: atual.corCeu, alpha: atual.alphaCeu };
  const t = 1 - faltam / TRANSICAO_MIN;
  return {
    cor: t < 0.5 ? atual.corCeu : proximo.corCeu,
    alpha: atual.alphaCeu + (proximo.alphaCeu - atual.alphaCeu) * t,
  };
}
