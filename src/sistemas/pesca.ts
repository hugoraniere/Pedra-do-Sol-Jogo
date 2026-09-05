/** Quem pergunta "o que da pra pescar agora". Puro, sem Phaser: so filtra o
 *  catalogo (dados/peixes.ts) pelo periodo atual (sistemas/tempo.ts), no
 *  mesmo espirito de sistemas/condicoes-de-fala.ts. */
import { PEIXES, type Peixe } from "../dados/peixes";
import { periodoAtual } from "./tempo";

export function peixesDisponiveisAgora(): Peixe[] {
  const agora = periodoAtual();
  return PEIXES.filter((p) => p.periodos.includes(agora));
}
