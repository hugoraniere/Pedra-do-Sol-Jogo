/** Camada de cima da tela: coracoes, moedas, direcional de toque e caixa de fala.
 *  Roda em paralelo com a cena Mundo e nunca se mexe com a camera. */
import Phaser from "phaser";
import { LARGURA, ALTURA, COR, VELOCIDADE_FALA } from "../dados/config";
import { AJUSTES } from "../dados/sons";
import { letraDaFala, tocar } from "../sistemas/som";
import { texto } from "../sistemas/texto";
import { estado } from "../sistemas/estado";
import { Controles } from "../sistemas/controles";
import { refazerAoRedimensionar } from "../sistemas/visao";

/** `quem` e o nome que aparece na chapinha; `chave` e a entrada de DIALOGOS,
 *  que e o que a tabela VOZ usa para achar a altura da voz. Sem chave a fala
 *  ainda funciona, so sai na voz neutra. */
type PedidoFala = { quem: string; linhas: string[]; cena: Phaser.Scene; chave?: string };

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
  private escrevendo = false;
  private linhaCheia = "";
  private vozAtual = "";
  private maquina?: Phaser.Time.TimerEvent;
  private coracoes: Phaser.GameObjects.Image[] = [];
  private textoMoedas!: Phaser.GameObjects.BitmapText;
  private textoSelos!: Phaser.GameObjects.BitmapText;

  constructor() {
    super("Interface");
  }

  create() {
    // create roda de novo em cada restart, e a instancia da cena e a mesma:
    // sem zerar, os coracoes velhos ficariam na lista apontando para o nada
    this.coracoes = [];
    this.linhas = [];
    this.indice = 0;
    this.cenaDona = undefined;
    this.escrevendo = false;
    this.maquina = undefined;
    this.controles = new Controles(this);
    this.montarTopo();
    this.montarDirecional();
    this.montarCaixa();
    this.events.on("falar", (p: PedidoFala) => this.falar(p));
    // a resolucao muda quando o jogador troca a visao no menu de pausa
    refazerAoRedimensionar(this, () => this.scene.restart());
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
    // Um disco so, nao quatro botoes.
    //
    // Com quatro botoes separados nao existe diagonal no toque: para andar na
    // diagonal a crianca teria que encostar dois dedos em dois quadradinhos de
    // 26 px ao mesmo tempo, o que nao acontece. Com um disco, o dedo pousa em
    // qualquer lugar e o angulo ate o centro escolhe uma das oito direcoes.
    // De quebra da para arrastar o dedo e mudar de direcao sem levantar.
    const centro = { x: 34, y: ALTURA - 34 };
    const RAIO = 30;

    this.add
      .nineslice(centro.x, centro.y, "painel-escuro", undefined, 52, 52, 8, 8, 8, 8)
      .setOrigin(0.5)
      .setAlpha(0.5);

    const setas = [
      { dx: 0, dy: -16, quadro: UI.setaCima, x: 0, y: -1 },
      { dx: 0, dy: 16, quadro: UI.setaBaixo, x: 0, y: 1 },
      { dx: -16, dy: 0, quadro: UI.setaEsq, x: -1, y: 0 },
      { dx: 16, dy: 0, quadro: UI.setaDir, x: 1, y: 0 },
    ].map((seta) => ({
      ...seta,
      imagem: this.add.image(centro.x + seta.dx, centro.y + seta.dy, "ui", seta.quadro).setAlpha(0.8),
    }));

    /** acende as setas que compoem a direcao atual, inclusive as duas de uma diagonal */
    const acender = (x: number, y: number) => {
      setas.forEach((s) => {
        const aceso = (s.x !== 0 && s.x === x) || (s.y !== 0 && s.y === y);
        s.imagem.setAlpha(aceso ? 1 : 0.8).setScale(aceso ? 1.15 : 1);
      });
    };

    const disco = this.add
      .circle(centro.x, centro.y, RAIO, 0x000000, 0)
      .setInteractive(new Phaser.Geom.Circle(RAIO, RAIO, RAIO), Phaser.Geom.Circle.Contains);

    const apontar = (ponteiro: Phaser.Input.Pointer) => {
      const dx = ponteiro.worldX - centro.x;
      const dy = ponteiro.worldY - centro.y;
      // uma zona morta no meio, senao o menor tremor do dedo faz o personagem
      // sair andando sozinho
      if (dx * dx + dy * dy < 36) return soltar();
      const fatia = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
      const passos: Record<string, [number, number]> = {
        "0": [1, 0], "1": [1, 1], "2": [0, 1], "3": [-1, 1],
        "4": [-1, 0], "-4": [-1, 0], "-3": [-1, -1], "-2": [0, -1], "-1": [1, -1],
      };
      const [x, y] = passos[String(fatia)] ?? [0, 0];
      this.controles.toque.x = x;
      this.controles.toque.y = y;
      acender(x, y);
      this.repassar();
    };

    const soltar = () => {
      this.controles.toque.x = 0;
      this.controles.toque.y = 0;
      acender(0, 0);
      this.repassar();
    };

    disco.on("pointerdown", apontar);
    disco.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) apontar(p);
    });
    disco.on("pointerup", soltar);
    disco.on("pointerout", soltar);
    // dedo levantado fora do disco tambem tem que parar o personagem
    this.input.on("pointerup", soltar);

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
    this.vozAtual = p.chave ?? "";
    this.textoQuem.setText(p.quem);
    this.caixa.setVisible(true);
    this.zona.setVisible(true);
    tocar("fala-abre");
    this.escrever(this.linhas[0] ?? "");
  }

  /** A linha aparece letra por letra, com um bip na voz de quem fala.
   *
   *  A altura do bip vem de VOZ em dados/sons.ts e nao muda dentro da conversa:
   *  e ela que deixa o Lele saber quem esta falando antes de terminar de ler o
   *  nome na chapinha. Um arquivo de som so, oito personagens. */
  private escrever(linha: string) {
    this.maquina?.remove();
    this.linhaCheia = linha;
    this.escrevendo = true;
    this.textoFala.setText("");
    let i = 0;
    this.maquina = this.time.addEvent({
      delay: VELOCIDADE_FALA,
      repeat: Math.max(linha.length - 1, 0),
      callback: () => {
        i += 1;
        this.textoFala.setText(linha.slice(0, i));
        if (linha[i - 1] !== " " && i % AJUSTES.letrasPorBip === 0) {
          letraDaFala(this.vozAtual);
        }
        if (i >= linha.length) this.escrevendo = false;
      },
    });
  }

  private proximaLinha() {
    // primeiro toque completa a linha, segundo avanca. Quem le devagar nunca
    // fica esperando a maquina de escrever, e quem le rapido nao perde texto.
    if (this.escrevendo) {
      this.maquina?.remove();
      this.maquina = undefined;
      this.escrevendo = false;
      this.textoFala.setText(this.linhaCheia);
      return;
    }
    this.indice += 1;
    if (this.indice >= this.linhas.length) {
      this.maquina?.remove();
      this.maquina = undefined;
      this.caixa.setVisible(false);
      this.zona.setVisible(false);
      this.atualizarTopo();
      tocar("fala-fecha");
      this.cenaDona?.events.emit("dialogo-fim");
      return;
    }
    this.escrever(this.linhas[this.indice]);
  }

  update() {
    if (this.caixa.visible && this.controles.acaoApertada()) this.proximaLinha();
  }
}
