/** A conta do progresso de missao. Puro, sem Phaser — mesmo espirito de
 *  sistemas/tempo.ts. Nao existe um array novo pra isso em `estado()`: cada
 *  etapa vira uma chave estavel em `estado().visitados`, reusando o mesmo
 *  padrao "aconteceu uma vez" que ja serve pro bau. */
import { estado, marcarVisitado } from "./estado";
import { MISSOES, type EtapaDeMissao } from "../dados/missoes";

function chaveDaEtapa(missaoId: string, etapaId: string): string {
  return `missao:${missaoId}:${etapaId}`;
}

export function etapaConcluida(missaoId: string, etapaId: string): boolean {
  return estado().visitados.includes(chaveDaEtapa(missaoId, etapaId));
}

export function concluirEtapa(missaoId: string, etapaId: string) {
  marcarVisitado(chaveDaEtapa(missaoId, etapaId));
}

/** A proxima etapa nao concluida, ou undefined se a missao ja terminou. */
export function etapaAtual(missaoId: string): EtapaDeMissao | undefined {
  return MISSOES[missaoId].etapas.find((e) => !etapaConcluida(missaoId, e.id));
}

/** A primeira etapa concluida ja conta como "aceitou a missao". */
export function missaoAceita(missaoId: string): boolean {
  return etapaConcluida(missaoId, MISSOES[missaoId].etapas[0].id);
}

export function missaoConcluida(missaoId: string): boolean {
  return etapaAtual(missaoId) === undefined;
}
