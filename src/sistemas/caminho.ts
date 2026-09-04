/** A* sobre uma malha de tiles, e o alisamento que tira a escadinha do caminho.
 *
 *  Sistema puro: sem cena, sem sprite, testavel sozinho. Quem monta a malha e
 *  quem anda por cima do caminho e o Mundo; aqui so mora a conta.
 *
 *  A diagonal nunca corta quina: se os dois ortogonais ao redor de uma
 *  diagonal estao bloqueados, a diagonal tambem fica. Sem essa regra o heroi
 *  tenta atravessar o canto de uma casa e trava contra a fisica arcade, que
 *  nao sabe nada sobre caminho, so sobre retangulo.
 */

export type Malha = { cols: number; rows: number; bloqueado: Uint8Array };
export type Celula = { tx: number; ty: number };

export function novaMalha(cols: number, rows: number): Malha {
  return { cols, rows, bloqueado: new Uint8Array(Math.max(0, cols * rows)) };
}

export function marcarBloqueado(malha: Malha, tx: number, ty: number) {
  if (tx < 0 || ty < 0 || tx >= malha.cols || ty >= malha.rows) return;
  malha.bloqueado[ty * malha.cols + tx] = 1;
}

export function estaBloqueado(malha: Malha, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= malha.cols || ty >= malha.rows) return true;
  return malha.bloqueado[ty * malha.cols + tx] === 1;
}

/** custo 10 no ortogonal e 14 no diagonal (raiz de 2 vezes 10, arredondado):
 *  inteiro, para o A* nunca comparar ponto flutuante. */
const VIZINHOS: [number, number, number][] = [
  [1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10],
  [1, 1, 14], [1, -1, 14], [-1, 1, 14], [-1, -1, 14],
];

/** distancia octil: o mesmo A* que sempre acerta o caminho mais curto quando
 *  a heuristica nunca superestima o custo de verdade. */
function heuristica(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return 10 * (dx + dy) - 6 * Math.min(dx, dy);
}

/** Fila de prioridade minima, so o que o A* precisa: inserir e retirar o
 *  menor. Um array ordenado a cada passo custaria caro no mapa de 120x84 da
 *  Floresta; o heap fica em log(n). */
class FilaMinima {
  private f: number[] = [];
  private indice: number[] = [];

  get vazia() {
    return this.f.length === 0;
  }

  inserir(custo: number, indice: number) {
    this.f.push(custo);
    this.indice.push(indice);
    let i = this.f.length - 1;
    while (i > 0) {
      const pai = (i - 1) >> 1;
      if (this.f[pai] <= this.f[i]) break;
      this.trocar(pai, i);
      i = pai;
    }
  }

  retirar(): number | undefined {
    if (this.f.length === 0) return undefined;
    const topo = this.indice[0];
    const ultimoF = this.f.pop()!;
    const ultimoI = this.indice.pop()!;
    if (this.f.length > 0) {
      this.f[0] = ultimoF;
      this.indice[0] = ultimoI;
      let i = 0;
      for (;;) {
        const e = i * 2 + 1;
        const d = i * 2 + 2;
        let menor = i;
        if (e < this.f.length && this.f[e] < this.f[menor]) menor = e;
        if (d < this.f.length && this.f[d] < this.f[menor]) menor = d;
        if (menor === i) break;
        this.trocar(menor, i);
        i = menor;
      }
    }
    return topo;
  }

  private trocar(a: number, b: number) {
    [this.f[a], this.f[b]] = [this.f[b], this.f[a]];
    [this.indice[a], this.indice[b]] = [this.indice[b], this.indice[a]];
  }
}

/** Acha o caminho em celulas de tile, do jeito mais curto, ou null se nao
 *  existir nenhum. `limite` e um backstop contra mapa mal formado: sem ele,
 *  um destino cercado faria o A* varrer o mapa inteiro toda vez que alguem
 *  clica perto de uma parede. */
export function encontrarCaminho(
  malha: Malha,
  origem: Celula,
  destino: Celula,
  limite = 20000
): Celula[] | null {
  if (estaBloqueado(malha, destino.tx, destino.ty)) return null;
  const { cols, rows } = malha;
  const n = cols * rows;
  const idx = (tx: number, ty: number) => ty * cols + tx;
  const gCusto = new Float64Array(n).fill(Infinity);
  const veioDe = new Int32Array(n).fill(-1);
  const fechado = new Uint8Array(n);
  const origemI = idx(origem.tx, origem.ty);
  const destinoI = idx(destino.tx, destino.ty);
  gCusto[origemI] = 0;

  const fila = new FilaMinima();
  fila.inserir(heuristica(origem.tx, origem.ty, destino.tx, destino.ty), origemI);

  let passos = 0;
  while (!fila.vazia) {
    if (++passos > limite) return null;
    const atualI = fila.retirar()!;
    if (fechado[atualI]) continue;
    fechado[atualI] = 1;
    if (atualI === destinoI) break;

    const atx = atualI % cols;
    const aty = (atualI / cols) | 0;
    for (const [dx, dy, custo] of VIZINHOS) {
      const vx = atx + dx;
      const vy = aty + dy;
      if (estaBloqueado(malha, vx, vy)) continue;
      if (dx !== 0 && dy !== 0) {
        // as duas quinas ortogonais tem que estar livres, senao a diagonal
        // corta canto de parede
        if (estaBloqueado(malha, atx + dx, aty) || estaBloqueado(malha, atx, aty + dy)) continue;
      }
      const vI = idx(vx, vy);
      if (fechado[vI]) continue;
      const novoG = gCusto[atualI] + custo;
      if (novoG < gCusto[vI]) {
        gCusto[vI] = novoG;
        veioDe[vI] = atualI;
        fila.inserir(novoG + heuristica(vx, vy, destino.tx, destino.ty), vI);
      }
    }
  }

  if (destinoI !== origemI && veioDe[destinoI] === -1) return null;
  const caminho: Celula[] = [];
  let cursor = destinoI;
  for (;;) {
    caminho.push({ tx: cursor % cols, ty: (cursor / cols) | 0 });
    if (cursor === origemI) break;
    cursor = veioDe[cursor];
  }
  caminho.reverse();
  return caminho;
}

/** Ha linha reta livre entre duas celulas? Bresenham, com a mesma regra de
 *  nao cortar quina do A*. Usado so pelo alisamento. */
function linhaLivre(malha: Malha, a: Celula, b: Celula): boolean {
  let x = a.tx;
  let y = a.ty;
  const dx = Math.abs(b.tx - x);
  const dy = -Math.abs(b.ty - y);
  const sx = x < b.tx ? 1 : -1;
  const sy = y < b.ty ? 1 : -1;
  let erro = dx + dy;
  for (;;) {
    if (estaBloqueado(malha, x, y)) return false;
    if (x === b.tx && y === b.ty) return true;
    const e2 = 2 * erro;
    const antesX = x;
    const antesY = y;
    if (e2 >= dy) {
      erro += dy;
      x += sx;
    }
    if (e2 <= dx) {
      erro += dx;
      y += sy;
    }
    if (x !== antesX && y !== antesY && (estaBloqueado(malha, x, antesY) || estaBloqueado(malha, antesX, y))) {
      return false;
    }
  }
}

/** Puxa a corda: descarta o ponto do meio quando o proximo ja esta em linha
 *  livre. Sem isto o heroi anda em escadinha, porque o A* devolve casa por
 *  casa e cada uma vira uma parada. */
export function alisarCaminho(malha: Malha, pontos: Celula[]): Celula[] {
  if (pontos.length <= 2) return pontos;
  const saida: Celula[] = [pontos[0]];
  let ancora = 0;
  for (let i = 1; i < pontos.length - 1; i++) {
    if (!linhaLivre(malha, pontos[ancora], pontos[i + 1])) {
      saida.push(pontos[i]);
      ancora = i;
    }
  }
  saida.push(pontos[pontos.length - 1]);
  return saida;
}
