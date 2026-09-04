/** Que casas dao para alcancar com o movimento deste turno, e por qual caminho.
 *
 * Logica pura, em coordenada de CASA, nunca de pixel: nenhum Phaser aqui dentro.
 *
 * E uma busca em largura, e ela e a peca que faz o combate por turnos se ler.
 * Um anel de alcance desenhado por raio mente: ele acende o outro lado do rio,
 * onde o heroi nao chega. Contando casa a casa, o que acende e exatamente onde
 * da para pisar, e o jogador conta com o olho em vez de descobrir tentando.
 */

export type Casa = { tx: number; ty: number };

export type Alcancada = Casa & {
  /** quantas casas de movimento custou chegar aqui */
  custo: number;
  /** a casa anterior no caminho, para reconstruir a rota de tras para frente */
  de?: string;
};

export const chaveDaCasa = (tx: number, ty: number) => `${tx},${ty}`;

/** As oito direcoes. Diagonal custa o mesmo que reta, de proposito: contar
 *  "uma e meia casa" e conta demais, e o jogo ja anda em oito direcoes. */
const VIZINHAS: Casa[] = [
  { tx: 0, ty: -1 }, { tx: 0, ty: 1 }, { tx: -1, ty: 0 }, { tx: 1, ty: 0 },
  { tx: -1, ty: -1 }, { tx: 1, ty: -1 }, { tx: -1, ty: 1 }, { tx: 1, ty: 1 },
];

/**
 * Todas as casas que dao para alcancar a partir da origem com `passos` de
 * movimento. A origem entra com custo 0.
 *
 * `passavel(tx, ty)` responde se da para PARAR naquela casa: fora do mapa,
 * agua, pedra e casa ocupada respondem false.
 */
export function alcancaveis(
  origem: Casa,
  passos: number,
  passavel: (tx: number, ty: number) => boolean
): Map<string, Alcancada> {
  const achadas = new Map<string, Alcancada>();
  const inicio: Alcancada = { ...origem, custo: 0 };
  achadas.set(chaveDaCasa(origem.tx, origem.ty), inicio);
  let borda: Alcancada[] = [inicio];

  for (let passo = 1; passo <= passos; passo++) {
    const proxima: Alcancada[] = [];
    for (const atual of borda) {
      for (const v of VIZINHAS) {
        const tx = atual.tx + v.tx;
        const ty = atual.ty + v.ty;
        const chave = chaveDaCasa(tx, ty);
        if (achadas.has(chave)) continue;
        if (!passavel(tx, ty)) continue;
        // diagonal so passa se as duas retas ao lado tambem passarem, senao o
        // heroi corta a quina de uma parede e atravessa o que era solido
        if (v.tx !== 0 && v.ty !== 0) {
          if (!passavel(atual.tx + v.tx, atual.ty) && !passavel(atual.tx, atual.ty + v.ty)) continue;
        }
        const casa: Alcancada = { tx, ty, custo: passo, de: chaveDaCasa(atual.tx, atual.ty) };
        achadas.set(chave, casa);
        proxima.push(casa);
      }
    }
    borda = proxima;
    if (borda.length === 0) break;
  }
  return achadas;
}

/** O caminho da origem ate o destino, sem incluir a origem. Vazio se nao chega. */
export function caminho(achadas: Map<string, Alcancada>, destino: Casa): Casa[] {
  let atual = achadas.get(chaveDaCasa(destino.tx, destino.ty));
  if (!atual) return [];
  const rota: Casa[] = [];
  while (atual && atual.de) {
    rota.unshift({ tx: atual.tx, ty: atual.ty });
    atual = achadas.get(atual.de);
  }
  return rota;
}

/** Distancia em casas, com diagonal valendo 1. E a mesma conta que a busca usa,
 *  entao "esta ao alcance" e "da para andar ate la" nunca se contradizem. */
export function distanciaEmCasas(a: Casa, b: Casa): number {
  return Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));
}
