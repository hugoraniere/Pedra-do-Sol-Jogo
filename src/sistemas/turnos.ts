/** A maquina de turnos. Logica pura: nenhum Phaser, nenhum desenho.
 *
 * Combate por turnos, no molde do Baldur's Gate 3, com uma diferenca que vem do
 * RPG de mesa e vale ouro: **so o heroi rola o dado. O monstro nunca rola.**
 * Isso corta metade da espera e concentra toda a tensao no unico momento em que
 * ela importa, que e a vez dele.
 *
 * Cada combatente tem, no turno dele:
 *   . um orcamento de MOVIMENTO, contado em casas
 *   . uma ACAO
 *
 * Fora de combate ninguem tem turno: o mundo anda em tempo real e o jogador
 * caminha a vontade. O combate comeca quando uma criatura percebe o heroi, e
 * acaba quando nenhuma sobrou de pe.
 */

export type FichaDeTurno = {
  id: string;
  /** 1d6 + atributo, igual a mesa. Maior joga primeiro. */
  iniciativa: number;
  /** quantas casas ele anda por turno */
  movimentoMax: number;
};

export type Vez = {
  id: string;
  /** casas que ainda restam neste turno */
  movimento: number;
  movimentoMax: number;
  acaoUsada: boolean;
};

export class Ordem {
  private fila: Vez[] = [];
  private indice = 0;
  private rodadaAtual = 1;

  /** Monta a ordem. Empate desempata por quem entrou primeiro na lista, para o
   *  resultado nunca depender da ordem interna de um objeto. */
  comecar(fichas: FichaDeTurno[]) {
    this.fila = [...fichas]
      .map((f, entrada) => ({ f, entrada }))
      .sort((a, b) => b.f.iniciativa - a.f.iniciativa || a.entrada - b.entrada)
      .map(({ f }) => ({
        id: f.id,
        movimento: f.movimentoMax,
        movimentoMax: f.movimentoMax,
        acaoUsada: false,
      }));
    this.indice = 0;
    this.rodadaAtual = 1;
  }

  emCombate(): boolean {
    return this.fila.length > 0;
  }

  agora(): Vez | undefined {
    return this.fila[this.indice];
  }

  /** A fila inteira, para desenhar a barra de iniciativa. */
  todos(): readonly Vez[] {
    return this.fila;
  }

  indiceAtual(): number {
    return this.indice;
  }

  rodada(): number {
    return this.rodadaAtual;
  }

  /** Gastou tudo o que tinha? Serve para acabar o turno sozinho. */
  acabou(): boolean {
    const v = this.agora();
    return !v || (v.acaoUsada && v.movimento <= 0);
  }

  gastarMovimento(casas: number) {
    const v = this.agora();
    if (v) v.movimento = Math.max(0, v.movimento - casas);
  }

  gastarAcao() {
    const v = this.agora();
    if (v) v.acaoUsada = true;
  }

  /** Passa a vez. Devolve quem entrou. */
  passar(): Vez | undefined {
    if (this.fila.length === 0) return undefined;
    this.indice += 1;
    if (this.indice >= this.fila.length) {
      this.indice = 0;
      this.rodadaAtual += 1;
    }
    const v = this.agora();
    if (v) {
      v.movimento = v.movimentoMax;
      v.acaoUsada = false;
    }
    return v;
  }

  /** Tira quem desistiu, sem embaralhar a vez de quem ficou.
   *
   *  O cuidado aqui nao e enfeite: se quem sai esta ANTES do atual na fila, o
   *  indice tem que recuar junto, senao um combatente perde a vez sem motivo. E
   *  se sai o proprio atual, o indice fica onde esta, porque quem estava atras
   *  dele passa a ocupar aquela posicao. */
  remover(id: string) {
    const i = this.fila.findIndex((v) => v.id === id);
    if (i < 0) return;
    this.fila.splice(i, 1);
    if (this.fila.length === 0) {
      this.indice = 0;
      return;
    }
    if (i < this.indice) this.indice -= 1;
    if (this.indice >= this.fila.length) this.indice = 0;
  }

  /** Acaba o combate e volta todo mundo para o tempo real. */
  encerrar() {
    this.fila = [];
    this.indice = 0;
    this.rodadaAtual = 1;
  }
}

/** 1d6 + atributo, e a faixa da mesa. O sorteio entra de fora para o resultado
 *  poder ser conferido em teste sem depender de aleatorio. */
export function rolar(atributo: number, sorteio: () => number): { dado: number; total: number } {
  const dado = sorteio();
  return { dado, total: dado + atributo };
}
