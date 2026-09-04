/** Tela inicial. Primeira coisa que o jogador ve, entao precisa responder duas
 *  perguntas em um segundo: que jogo e este, e onde eu aperto para jogar. */
import Phaser from "phaser";
import { LARGURA, ALTURA, COR } from "../dados/config";
import { texto } from "../sistemas/texto";
import { botao, Botao } from "../sistemas/botao";
import { abrirEspaco } from "../sistemas/estado";
import {
  espacoLivre,
  fichas,
  noAplicativo,
  sairDoJogo,
  ultimoEspaco,
} from "../sistemas/armazenamento";

const VERSAO = "v0.2";

export class Titulo extends Phaser.Scene {
  private botoes: Botao[] = [];
  private foco = 0;
  private aviso?: Phaser.GameObjects.BitmapText;

  constructor() {
    super("Titulo");
  }

  create() {
    this.botoes = [];
    this.foco = 0;

    // fundo: o banner ocupa o topo, o resto e o mesmo verde do campo
    this.add.rectangle(0, 0, LARGURA, ALTURA, COR.grama).setOrigin(0);
    this.add.image(0, 0, "titulo").setOrigin(0);

    this.escreverTitulo();
    this.montarMenu();
    this.montarTeclado();

    texto(this, LARGURA - 4, ALTURA - 10, VERSAO, { ancora: 1, cor: 0xfff8ea }).setAlpha(0.7);
  }

  /** A logo e uma imagem, nao texto: foi desenhada de proposito com volume e
   *  decoracao, coisa que fonte de bitmap nao faz. */
  private escreverTitulo() {
    const logo = this.add.image(LARGURA / 2, 8, "logo").setOrigin(0.5, 0);
    // encolhe por numero inteiro se um dia a logo vier maior que a tela
    if (logo.width > LARGURA - 16) logo.setScale((LARGURA - 16) / logo.width);
  }

  private montarMenu() {
    const ultimo = ultimoEspaco();
    const temAlgumSave = fichas().some((f) => f !== null);

    type Item = { texto: string; acao: () => void; destaque?: boolean };
    const itens: Item[] = [];

    if (ultimo !== null) {
      const f = fichas()[ultimo]!;
      itens.push({
        texto: `CONTINUAR . ${f.nome.toUpperCase().slice(0, 14)}`,
        destaque: true,
        acao: () => {
          if (abrirEspaco(ultimo)) this.scene.start("Mundo");
        },
      });
    }

    itens.push({
      texto: "NOVO JOGO",
      destaque: ultimo === null,
      acao: () => {
        const livre = espacoLivre();
        if (livre === null) {
          this.mostrarAviso("Os tres espacos estao cheios. Apague um em CARREGAR.");
          return;
        }
        this.scene.start("Criacao", { espaco: livre });
      },
    });

    if (temAlgumSave) {
      itens.push({ texto: "CARREGAR JOGO", acao: () => this.scene.start("Carregar") });
    }

    // Sair so existe no aplicativo. No navegador nao ha para onde sair.
    if (noAplicativo()) {
      itens.push({ texto: "SAIR", acao: () => sairDoJogo() });
    }

    const alturaBotao = 18;
    const espaco = 6;
    const total = itens.length * alturaBotao + (itens.length - 1) * espaco;
    const topo = ALTURA - 12 - total;

    itens.forEach((item, i) => {
      const y = topo + i * (alturaBotao + espaco) + alturaBotao / 2;
      const b = botao(
        this,
        LARGURA / 2,
        y,
        item.destaque ? 168 : 148,
        alturaBotao,
        item.texto,
        item.acao,
        item.destaque ? "painel-ouro" : "painel"
      );
      b.on("pointerover", () => this.focar(i));
      this.botoes.push(b);
    });
    this.focar(0);
  }

  private focar(i: number) {
    this.foco = Phaser.Math.Clamp(i, 0, this.botoes.length - 1);
    this.botoes.forEach((b, k) => b.marcar(k === this.foco));
  }

  private montarTeclado() {
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.removeAllListeners("keydown");
    kb.on("keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s") this.focar(this.foco + 1);
      else if (e.key === "ArrowUp" || e.key === "w") this.focar(this.foco - 1);
      else if (e.key === "Enter" || e.key === " ") this.botoes[this.foco]?.emit("pointerup");
    });
  }

  private mostrarAviso(aviso: string) {
    this.aviso?.destroy();
    const caixa = this.add
      .nineslice(LARGURA / 2, 76, "painel", undefined, 236, 24, 8, 8, 8, 8)
      .setOrigin(0.5);
    const t = texto(this, LARGURA / 2, 68, aviso, {
      ancora: 0.5,
      cor: 0x2c2440,
      larguraMax: 220,
      alinhamento: 1,
    });
    this.aviso = t;
    this.time.delayedCall(3200, () => {
      t.destroy();
      caixa.destroy();
    });
    void COR;
  }
}
