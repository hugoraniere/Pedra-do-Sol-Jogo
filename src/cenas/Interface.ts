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
import { ICONE } from "../sistemas/icones";
import { ESPACO } from "../sistemas/design";
import { botao } from "../sistemas/botao";

/** `quem` e o nome que aparece na chapinha; `chave` e a entrada de DIALOGOS,
 *  que e o que a tabela VOZ usa para achar a altura da voz. Sem chave a fala
 *  ainda funciona, so sai na voz neutra. */
type PedidoFala = { quem: string; linhas: string[]; cena: Phaser.Scene; chave?: string };

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
      this.coracoes.push(this.add.image(10 + i * 11, 9, "ui", ICONE.coracaoCheio));
    }
    const xMoeda = 14 + st.coracoesMax * 11;
    this.add.image(xMoeda, 9, "ui", ICONE.moeda);
    this.textoMoedas = texto(this, xMoeda + 9, 5, "0", { cor: 0xfff8ea });
    this.add.image(xMoeda + 32, 9, "ui", ICONE.selo);
    this.textoSelos = texto(this, xMoeda + 41, 5, "0", { cor: 0xfff8ea });
    this.montarBotaoFicha(xMoeda + 49);
    this.montarBotaoPausa();
    this.atualizarTopo();
  }

  /** O nome do heroi e o botao da ficha.
   *
   *  Nao existe icone de "personagem" na folha, e inventar um simbolo novo seria
   *  mais uma coisa para a crianca decorar. O nome dele ja estava escrito ali:
   *  agora ele e tocavel, e toca no proprio nome quem quer se ver. O espaco vai
   *  do fim dos selos ate a engrenagem, e o nome encolhe para caber, porque na
   *  visao PERTO a barra e bem mais estreita.
   */
  private montarBotaoFicha(xLivre: number) {
    const direita = LARGURA - 20;
    const espaco = direita - xLivre;
    const cabe = Math.max(1, Math.floor((espaco - ESPACO.md) / 8));
    const nome = (estado().heroi.nome || "Heroi").slice(0, cabe);
    const largura = Math.min(espaco, nome.length * 8 + ESPACO.md * 2);
    const b = botao(
      this,
      direita - largura / 2,
      8,
      largura,
      12,
      nome,
      () => {
        // no meio de uma fala a zona de dialogo ja come o toque, mas a checagem
        // fica explicita: abrir a ficha por cima de uma conversa deixaria a fala
        // pendurada esperando um toque que nunca vem
        if (this.caixa.visible) return;
        tocar("pausa-abre");
        this.scene.pause("Mundo");
        this.scene.launch("Ficha");
      },
      "painel-creme"
    );
    // o rotulo e o nome, que muda a cada jogo. O auditor e a auditoria automatica
    // precisam de um nome fixo para achar este botao, entao o dono e FICHA.
    b.setData("ui", { tipo: "botao", dono: "FICHA" });
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
      c.setFrame(i < st.coracoes ? ICONE.coracaoCheio : ICONE.coracaoVazio)
    );
    this.textoMoedas.setText(String(st.moedas));
    this.textoSelos.setText(String(st.selos));
  }

  // --------------------------------------------------------- direcional
  private montarDirecional() {
    const base = { x: 32, y: ALTURA - 34 };
    const setas: [number, number, number, number, number][] = [
      [0, -15, 0, -1, ICONE.setaCima],
      [0, 15, 0, 1, ICONE.setaBaixo],
      [-16, 0, -1, 0, ICONE.setaEsq],
      [16, 0, 1, 0, ICONE.setaDir],
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

    const acao = this.add.image(LARGURA - 28, ALTURA - 28, "ui", ICONE.botaoA).setScale(1.4);
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
      .image(LARGURA - 14, y + alturaCaixa - 10, "ui", ICONE.setaBaixo)
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
