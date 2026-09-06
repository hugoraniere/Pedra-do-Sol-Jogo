/** Predicados prontos pra usar em `condicao` de dados/dialogos.ts. Fica em
 *  sistemas/ (nao dados/) porque tem logica de verdade — chama estado() e
 *  periodoAtual() — mesmo se a leitura em dialogos.ts continuar parecendo
 *  declarativa: `condicao: noPeriodo("noite")` em vez de reescrever
 *  `estado()` cru em cada fala.
 *
 *  Nome comprido de proposito: `sistemas/condicoes.ts` ja existe e e outra
 *  coisa, o motor de condicoes de combate (MOLHADO, CONGELADO...). As duas
 *  palavras "condicao" nao tem nada a ver uma com a outra, so coincidencia
 *  de nome. */
import { estado } from "./estado";
import { periodoAtual } from "./tempo";
import type { Periodo } from "../dados/tempo";
import { etapaConcluida } from "./missoes";

export const noPeriodo = (...periodos: Periodo[]) => () => periodos.includes(periodoAtual());

export const comItem = (item: string) => () => estado().mochila.some((s) => s?.item === item);

/** Revisao de 2026-09-05: roupa virou item, entao da pra tirar de verdade —
 *  isto e o gancho pra NPC reagir mal ao heroi andando sem roupa pela vila.
 *  Fedor/sujeira/sangue sao extensao futura (precisam de estado por
 *  instancia de item, nao de tipo); isto aqui e so "vestido ou nao". */
export const semRoupa = () => estado().heroi.estiloRoupa === null;

export const etapaFeita = (missaoId: string, etapaId: string) => () =>
  etapaConcluida(missaoId, etapaId);

export const etapaNaoFeita = (missaoId: string, etapaId: string) => () =>
  !etapaConcluida(missaoId, etapaId);

export const todas = (...condicoes: (() => boolean)[]) => () => condicoes.every((c) => c());
