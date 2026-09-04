/** Camada de cima da tela: coracoes, moedas, direcional de toque e caixa de fala.
 *  Roda em paralelo com a cena Mundo e nunca se mexe com a camera. */
import Phaser from "phaser";
import { LARGURA, ALTURA, COR } from "../dados/config";
import { texto } from "../sistemas/texto";
import { estado } from "../sistemas/estado";
import { Controles } from "../sistemas/controles";

type PedidoFala = { quem: string; linhas: string[]; cena: Phaser.Scene };

/** indices da folha ui.png, na mesma ordem de arte/ui.py */
const UI = {
  coracaoCheio: 0, coracaoVazio: 1, moeda: 2, selo: 3,
  setaCima: 4, setaBaixo: 5, setaEsq: 6, setaDir: 7,
  botaoA: 8, mochila: 9, livro: 10, lupa: 11, dado: 12,
} as const;

export class Interface extends Phaser.Scene {
  private controles!: Controles;
  private caixa!: Phaser.GameObjects.Container;
  private zona!: Phaser.GameObjects.Rectangle;
  private textoFala!: Phaser.GameObjects.BitmapText;
  private textoQuem!: Phaser.GameObjects.BitmapText;
  private linhas: string[] = [];
  private indice = 0;
  private cenaDona?: Phaser.Scene;
  private coracoes: Phaser.GameObjects.Image[] = [];
  private textoMoedas!: Phaser.GameObjects.BitmapText;
  private textoSelos!: Phaser.GameObjects.BitmapText;

  constructor() {
    super("Interface");
  }

  create() {
    this.controles = new Controles(this);
    this.montarTopo();
    this.montarDirecional();
    this.montarCaixa();
    this.events.on("falar", (p: PedidoFala) => this.falar(p));
  }

  // ---------------------------------------------------------------- topo
  private montarTopo() {
    this.add.nineslice(2, 1, "painel-escuro", undefined, LARGURA - 4, 16, 8, 8, 8, 8).setOrigin(0);
    const st = estado();
    for (let i = 0; i < st.coracoesMax; i++) {
      this.coracoes.push(this.add.image(10 + i * 11, 9, "ui", UI.coracaoCheio));
    }
    const xMoeda = 14 + st.coracoesMax * 11;
    this.add.image(xMoeda, 9, "ui", UI.moeda);
    this.textoMoedas = texto(this, xMoeda + 9, 5, "0", { cor: 0xfff8ea });
    this.add.image(xMoeda + 32, 9, "ui", UI.selo);
    this.textoSelos = texto(this, xMoeda + 41, 5, "0", { cor: 0xfff8ea });
    texto(this, LARGURA - 22, 5, st.heroi.nome, { cor: 0xf5b62b, ancora: 1 });
    this.montarBotaoPausa();
    this.atualizarTopo();
  }

  /** engrenagem no canto do topo, o unico jeito de pausar no toque */
  private montarBotaoPausa() {
    const b = this.add.nineslice(LARGURA - 18, 2, "painel-creme", undefined, 16, 12, 8, 8, 8, 8).setOrigin(0);
    texto(this, LARGURA - 13, 3, "=", { cor: 0x2c2440 });
    const alvo = this.add
      .rectangle(LARGURA - 10, 8, 26, 20, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    alvo.on("pointerdown", () => {
      b.setTexture("painel-ouro");
      this.events.emit("pausar");
    });
    alvo.on("pointerup", () => b.setTexture("painel-creme"));
  }

  atualizarTopo() {
    const st = estado();
    this.coracoes.forEach((c, i) =>
      c.setFrame(i < st.coracoes ? UI.coracaoCheio : UI.coracaoVazio)
    );
    this.textoMoedas.setText(String(st.moedas));
    this.textoSelos.setText(String(st.selos));
  }

  // --------------------------------------------------------- direcional
  private montarDirecional() {
    const base = { x: 32, y: ALTURA - 34 };
    const setas: [number, number, number, number, number][] = [
      [0, -15, 0, -1, UI.setaCima],
      [0, 15, 0, 1, UI.setaBaixo],
      [-16, 0, -1, 0, UI.setaEsq],
      [16, 0, 1, 0, UI.setaDir],
    ];
    setas.forEach(([dx, dy, vx, vy, quadro]) => {
      // chapinha escura atras, senao a seta some em cima da grama
      this.add
        .nineslice(base.x + dx, base.y + dy, "painel-escuro", undefined, 17, 17, 8, 8, 8, 8)
        .setOrigin(0.5)
        .setAlpha(0.55);
      const s = this.add.image(base.x + dx, base.y + dy, "ui", quadro).setAlpha(0.95);
      // area de toque bem maior que o desenho, dedo de crianca nao acerta 16 px
      const alvo = this.add
        .rectangle(base.x + dx, base.y + dy, 26, 26, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      const liga = () => {
        if (vx) this.controles.toque.x = vx;
        if (vy) this.controles.toque.y = vy;
        s.setAlpha(1).setScale(1.15);
        this.repassar();
      };
      const desliga = () => {
        if (vx) this.controles.toque.x = 0;
        if (vy) this.controles.toque.y = 0;
        s.setAlpha(0.85).setScale(1);
        this.repassar();
      };
      alvo.on("pointerdown", liga);
      alvo.on("pointerup", desliga);
      alvo.on("pointerout", desliga);
    });

    const acao = this.add.image(LARGURA - 28, ALTURA - 28, "ui", UI.botaoA).setScale(1.4);
    const alvoAcao = this.add
      .rectangle(LARGURA - 28, ALTURA - 28, 34, 34, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    alvoAcao.on("pointerdown", () => {
      acao.setScale(1.25);
      if (this.caixa.visible) this.proximaLinha();
      else this.events.emit("acao");
    });
    alvoAcao.on("pointerup", () => acao.setScale(1.4));
    alvoAcao.on("pointerout", () => acao.setScale(1.4));
  }

  /** o direcional vive aqui mas quem anda e o Mundo, entao repassamos o valor */
  private repassar() {
    const mundo = this.scene.get("Mundo") as unknown as { controles?: Controles };
    if (mundo?.controles) mundo.controles.toque = { ...this.controles.toque };
  }

  // -------------------------------------------------------- caixa de fala
  private montarCaixa() {
    const alturaCaixa = 60;
    const y = ALTURA - alturaCaixa - 4;
    const sombra = this.add
      .nineslice(4, y + 3, "painel-escuro", undefined, LARGURA - 8, alturaCaixa, 8, 8, 8, 8)
      .setOrigin(0);
    const fundo = this.add
      .nineslice(4, y, "painel", undefined, LARGURA - 8, alturaCaixa, 8, 8, 8, 8)
      .setOrigin(0);
    const chapa = this.add
      .nineslice(10, y - 6, "painel-ouro", undefined, 96, 14, 8, 8, 8, 8)
      .setOrigin(0);
    this.textoQuem = texto(this, 16, y - 3, "", { cor: 0x2c2440 });
    this.textoFala = texto(this, 12, y + 14, "", {
      cor: 0x2c2440,
      larguraMax: LARGURA - 32,
      entrelinha: 4,
    });
    const dica = this.add
      .image(LARGURA - 14, y + alturaCaixa - 10, "ui", UI.setaBaixo)
      .setScale(0.6);
    this.tweens.add({ targets: dica, y: dica.y + 2, duration: 420, yoyo: true, repeat: -1 });

    this.zona = this.add
      .rectangle(0, 0, LARGURA, ALTURA, 0x000000, 0)
      .setOrigin(0)
      .setInteractive()
      .setVisible(false)
      .setDepth(99);
    this.zona.on("pointerdown", () => {
      if (this.caixa.visible) this.proximaLinha();
    });

    this.caixa = this.add
      .container(0, 0, [sombra, fundo, chapa, this.textoQuem, this.textoFala, dica])
      .setVisible(false)
      .setDepth(100);
    void COR;
  }

  private falar(p: PedidoFala) {
    this.cenaDona = p.cena;
    this.linhas = p.linhas;
    this.indice = 0;
    this.textoQuem.setText(p.quem);
    this.textoFala.setText(this.linhas[0] ?? "");
    this.caixa.setVisible(true);
    this.zona.setVisible(true);
  }

  private proximaLinha() {
    this.indice += 1;
    if (this.indice >= this.linhas.length) {
      this.caixa.setVisible(false);
      this.zona.setVisible(false);
      this.atualizarTopo();
      this.cenaDona?.events.emit("dialogo-fim");
      return;
    }
    this.textoFala.setText(this.linhas[this.indice]);
  }

  update() {
    if (this.caixa.visible && this.controles.acaoApertada()) this.proximaLinha();
  }
}
