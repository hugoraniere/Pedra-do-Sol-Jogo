/** Desenha o cursor do mouse dentro do jogo.
 *
 *  Roda em paralelo com todo o resto e e a ultima cena da lista em main.ts, que
 *  e o que a poe por cima de tudo: o Phaser desenha as cenas na ordem em que
 *  elas aparecem na configuracao.
 *
 *  Por que o cursor e desenhado aqui e nao e um cursor de CSS: o canvas e
 *  ampliado por numero inteiro, 3x a 5x (ver sistemas/visao.ts). Um cursor de
 *  CSS vive em pixels de tela, entao teria pixels quatro vezes menores que os do
 *  jogo e pareceria ser de outro programa boiando por cima.
 *
 *  A posicao e arredondada para o pixel logico, igual ao roundPixels do jogo. Em
 *  4x o cursor anda de 4 em 4 pixels de tela, e e isso que faz ele parecer parte
 *  do jogo em vez de coisa do sistema operacional. Se algum dia parecer ruim,
 *  tirar o Math.round e uma linha.
 */
import Phaser from "phaser";
import { SUBIDA_SOBRE } from "../dados/cursor";
import {
  anotarPonteiro, definirApertado, estadoDoCursor, mouseEmUso, quadroAtual,
} from "../sistemas/cursor";

export class Ponteiro extends Phaser.Scene {
  private imagem!: Phaser.GameObjects.Image;

  constructor() {
    super("Ponteiro");
  }

  create() {
    // some o cursor do sistema. O do jogo toma o lugar dele.
    this.input.setDefaultCursor("none");

    // fora da tela ate o primeiro movimento de mouse: nasce escondido para o
    // dedo do iPad nunca ver um cursor aparecer do nada
    this.imagem = this.add.image(-99, -99, "cursor", 0).setOrigin(0, 0).setVisible(false);

    this.input.on("pointermove", (p: Phaser.Input.Pointer) => anotarPonteiro(p));
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      anotarPonteiro(p);
      definirApertado(true);
    });
    // o soltar escuta o ponteiro em qualquer lugar: soltar o botao fora da tela
    // e ainda assim voltar deixaria o cursor afundado para sempre
    this.input.on("pointerup", () => definirApertado(false));
    this.input.on("pointerupoutside", () => definirApertado(false));
  }

  update() {
    const q = quadroAtual();
    if (!q || !mouseEmUso()) {
      this.imagem.setVisible(false);
      return;
    }
    const p = this.input.activePointer;
    // sobre algo clicavel o cursor sobe 1 px. A subida mora aqui e nao no
    // desenho: dentro do PNG ela faria o ponto da ponta mentir sobre onde o
    // clique cai.
    const sobe = estadoDoCursor() === "sobre" ? SUBIDA_SOBRE : 0;
    this.imagem
      .setVisible(true)
      .setFrame(q.quadro)
      .setPosition(Math.round(p.x) - q.pega.x, Math.round(p.y) - q.pega.y - sobe);
  }
}
