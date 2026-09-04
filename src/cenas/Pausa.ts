/** Menu de pausa. Roda por cima do Mundo, que fica congelado atras.
 *
 * Tem dois estados: o menu e as configuracoes. Sao a mesma cena porque o jogador
 * volta de um para o outro o tempo todo, e trocar de cena piscaria a tela. */
import Phaser from "phaser";
import { LARGURA, ALTURA } from "../dados/config";
import { botao, Botao } from "../sistemas/botao";
import { texto } from "../sistemas/texto";
import { salvar } from "../sistemas/estado";
import { noAplicativo, sairDoJogo } from "../sistemas/armazenamento";
import { ORDEM_ZOOM, ZOOM, definirPreferencia, preferencias } from "../sistemas/preferencias";

export class Pausa extends Phaser.Scene {
  private painel!: Phaser.GameObjects.Container;
  private aba: "menu" | "config" = "menu";
  private recado?: Phaser.GameObjects.BitmapText;

  constructor() {
    super("Pausa");
  }

  create() {
    this.aba = "menu";

    // escurece o jogo atras, deixando claro que ele parou
    this.add
      .rectangle(0, 0, LARGURA, ALTURA, 0x2c2440, 0.66)
      .setOrigin(0)
      .setInteractive();

    this.painel = this.add.container(0, 0);
    this.desenhar();

    this.input.keyboard?.removeAllListeners("keydown");
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p") {
        if (this.aba === "config") {
          this.aba = "menu";
          this.desenhar();
        } else {
          this.voltarAoJogo();
        }
      }
    });
  }

  private voltarAoJogo() {
    this.scene.resume("Mundo");
    this.scene.stop();
  }

  private caixa(titulo: string, altura: number) {
    const largura = 200;
    const x = (LARGURA - largura) / 2;
    const y = (ALTURA - altura) / 2;
    this.painel.add(
      this.add.nineslice(x, y + 3, "painel-escuro", undefined, largura, altura, 8, 8, 8, 8).setOrigin(0)
    );
    this.painel.add(
      this.add.nineslice(x, y, "painel", undefined, largura, altura, 8, 8, 8, 8).setOrigin(0)
    );
    this.painel.add(
      this.add.nineslice(x + 10, y - 7, "painel-ouro", undefined, largura - 20, 16, 8, 8, 8, 8).setOrigin(0)
    );
    this.painel.add(texto(this, LARGURA / 2, y + 1, titulo, { cor: 0x2c2440, ancora: 0.5, ancoraY: 0.5 }));
    return { x, y, largura };
  }

  private desenhar() {
    this.painel.removeAll(true);
    this.recado = undefined;
    if (this.aba === "menu") this.desenharMenu();
    else this.desenharConfig();
  }

  // ------------------------------------------------------------- menu
  private desenharMenu() {
    const itens: { texto: string; acao: () => void; painel?: "painel" | "painel-ouro" }[] = [
      { texto: "VOLTAR AO JOGO", acao: () => this.voltarAoJogo(), painel: "painel-ouro" },
      {
        texto: "SALVAR AGORA",
        acao: () => {
          salvar();
          this.mostrarRecado("Jogo salvo!");
        },
      },
      { texto: "CONFIGURACOES", acao: () => { this.aba = "config"; this.desenhar(); } },
      {
        texto: "SAIR PARA O MENU",
        acao: () => {
          salvar();
          this.scene.stop("Interface");
          this.scene.stop("Mundo");
          this.scene.stop();
          this.scene.start("Titulo");
        },
      },
    ];
    if (noAplicativo()) {
      itens.push({
        texto: "SAIR DO JOGO",
        acao: () => {
          salvar();
          sairDoJogo();
        },
      });
    }

    const alturaBotao = 18;
    const passo = 22;
    const altura = itens.length * passo + 22;
    const { y } = this.caixa("PAUSA", altura);

    itens.forEach((item, i) => {
      const b: Botao = botao(
        this,
        LARGURA / 2,
        y + 18 + i * passo,
        168,
        alturaBotao,
        item.texto,
        item.acao,
        item.painel ?? "painel-creme"
      );
      this.painel.add(b);
    });
  }

  // ----------------------------------------------------- configuracoes
  private desenharConfig() {
    const { y } = this.caixa("CONFIGURACOES", 104);

    this.painel.add(
      texto(this, LARGURA / 2, y + 14, "DE ONDE VOCE VE O JOGO", { cor: 0x5a4e74, ancora: 0.5 })
    );

    const atual = preferencias().zoom;
    const larguraBotao = 56;
    ORDEM_ZOOM.forEach((nivel, i) => {
      const x = LARGURA / 2 + (i - 1) * (larguraBotao + 4);
      const b = botao(
        this,
        x,
        y + 38,
        larguraBotao,
        18,
        ZOOM[nivel].nome,
        () => {
          definirPreferencia("zoom", nivel);
          this.aplicarZoom();
          this.desenhar();
        },
        "painel-creme"
      );
      b.marcar(nivel === atual);
      this.painel.add(b);
    });

    this.painel.add(
      texto(
        this,
        LARGURA / 2,
        y + 58,
        "LONGE mostra mais do mapa. PERTO deixa\ntudo maior e mais facil de ver.",
        { cor: 0x5a4e74, ancora: 0.5, alinhamento: 1, entrelinha: 3, larguraMax: 180 }
      )
    );

    this.painel.add(
      botao(this, LARGURA / 2, y + 88, 120, 18, "< VOLTAR", () => {
        this.aba = "menu";
        this.desenhar();
      }, "painel-ouro")
    );
  }

  private aplicarZoom() {
    const mundo = this.scene.get("Mundo");
    mundo?.events.emit("zoom-mudou");
  }

  private mostrarRecado(msg: string) {
    this.recado?.destroy();
    this.recado = texto(this, LARGURA / 2, ALTURA - 22, msg, { cor: 0xf5b62b, ancora: 0.5 });
    this.painel.add(this.recado);
    this.time.delayedCall(1600, () => this.recado?.destroy());
  }
}
