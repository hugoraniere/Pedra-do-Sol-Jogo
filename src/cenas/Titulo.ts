/** Tela inicial. Primeira coisa que o jogador ve, entao precisa responder duas
 *  perguntas em um segundo: que jogo e este, e onde eu aperto para jogar.
 *
 * O cenario e o logotipo sao vetor de verdade, desenhados aqui dentro (Graphics
 * e Text), nao um PNG carregado. Um PNG de fundo so cobre o tamanho em que foi
 * desenhado -- e LARGURA/ALTURA nao sao um tamanho so, mudam com a janela e a
 * visao escolhida (ver docs/07-design-system.md). Desenhar na hora, a partir de
 * LARGURA/ALTURA de verdade, e o unico jeito de a tela ficar nitida e sem
 * sobra vazia em qualquer proporcao. `refazerAoRedimensionar` reconstroi tudo
 * quando o tamanho muda. */
import Phaser from "phaser";
import { musica } from "../sistemas/som";
import { LARGURA, ALTURA, COR } from "../dados/config";
import { texto } from "../sistemas/texto";
import { botao, Botao } from "../sistemas/botao";
import { abrirEspaco } from "../sistemas/estado";
import { refazerAoRedimensionar } from "../sistemas/visao";
import {
  espacoLivre,
  fichas,
  noAplicativo,
  sairDoJogo,
  ultimoEspaco,
} from "../sistemas/armazenamento";

const VERSAO = "v0.2";

/** cor 0xRRGGBB -> "#rrggbb", porque Graphics/COR falam em numero e Text/CSS
 *  falam em string. */
function css(cor: number, alfa?: number): string {
  const hex = `#${cor.toString(16).padStart(6, "0")}`;
  if (alfa === undefined) return hex;
  const r = (cor >> 16) & 0xff, g = (cor >> 8) & 0xff, b = cor & 0xff;
  return `rgba(${r},${g},${b},${alfa})`;
}

export class Titulo extends Phaser.Scene {
  private botoes: Botao[] = [];
  private foco = 0;
  private aviso?: Phaser.GameObjects.BitmapText;

  constructor() {
    super("Titulo");
  }

  create() {
    // menu, carregar e criacao sao o mesmo lugar para quem joga: a faixa
    // atravessa as tres sem recomecar. musica() ignora pedido repetido.
    musica(this, "menu");
    this.botoes = [];
    this.foco = 0;

    this.desenharCenario();
    this.desenharLogo();
    this.montarMenu();
    this.montarTeclado();

    texto(this, LARGURA - 4, ALTURA - 10, VERSAO, { ancora: 1, cor: 0xfff8ea }).setAlpha(0.7);

    // a janela muda de tamanho (redimensionar, girar o tablet, trocar a
    // visao no meio do jogo): tudo aqui e desenhado a partir de LARGURA e
    // ALTURA de agora, entao a unica forma segura de acompanhar e remontar.
    refazerAoRedimensionar(this, () => this.scene.restart());
  }

  /** O ceu, a Pedra do Sol brilhando no horizonte, as montanhas, a mata e o
   *  campo -- tudo formas vetoriais, nunca uma imagem. Cada numero aqui e uma
   *  fracao de LARGURA/ALTURA de proposito: e o que deixa a tela igualmente
   *  bonita em 256x160 (celular pequeno) e em 800x480 (monitor largo). */
  private desenharCenario() {
    const L = LARGURA, A = ALTURA;
    const horizonte = A * 0.6;
    // a Pedra do Sol mora no pico do monte mais alto, nao flutuando no ceu
    const picoX = L * 0.5, picoBase = horizonte + A * 0.03, picoAltura = A * 0.16;
    const apice = picoBase - picoAltura;
    const pedraX = picoX, pedraY = apice - A * 0.015;
    const g = this.add.graphics();

    // ceu: creme quente em cima, esquentando para o ouro perto do horizonte
    g.fillGradientStyle(COR.papel, COR.papel, COR.papel2, COR.papel2, 1);
    g.fillRect(0, 0, L, horizonte * 0.55);
    g.fillGradientStyle(COR.papel2, COR.papel2, COR.ouro, COR.ouro, 1, 1, 0.85, 0.85);
    g.fillRect(0, horizonte * 0.55, L, horizonte * 0.45);

    this.raiosDeSol(g, pedraX, pedraY, A);
    this.resplendorDaPedra(g, pedraX, pedraY, A, 1);
    this.montanhas(g, horizonte, COR.roxo, 0.35, A * 0.22, 0.021, 1.3);
    this.montanhas(g, horizonte + A * 0.02, COR.tintaSuave, 0.6, A * 0.13, 0.033, 4.1);
    this.resplendorDaPedra(g, pedraX, pedraY, A, 0.55);
    this.picoCentral(g, picoX, picoBase, apice, L * 0.36);
    this.resplendorDaPedra(g, pedraX, pedraY, A, 0.45);
    this.pedraDoSol(g, pedraX, pedraY, A);
    this.matas(g, horizonte, L);
    this.campo(g, horizonte, L, A);
    this.desenharDragao(picoX, apice, A);
    this.faiscas(pedraX, pedraY, A);
  }

  /** O monte onde a pedra fica em pe: um pico so, mais escuro e mais perto que
   *  as duas cordilheiras atras dele, assimetrico de proposito (uma cordilheira
   *  perfeitamente triangular parece papel dobrado, nao pedra de verdade). */
  private picoCentral(
    g: Phaser.GameObjects.Graphics, cx: number, base: number, apiceY: number, largura: number
  ) {
    const altura = base - apiceY;
    const pontos: [number, number][] = [
      [-0.5, 0], [-0.32, -0.35], [-0.18, -0.55], [-0.04, -0.85],
      [0, -1], [0.1, -0.7], [0.28, -0.4], [0.5, 0],
    ];
    g.fillStyle(COR.tinta, 1);
    g.beginPath();
    pontos.forEach(([px, py], i) => {
      const x = cx + px * largura, y = base + py * altura;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.closePath();
    g.fillPath();
    // faceta que pega a luz da propria pedra, do lado esquerdo (onde o brilho bate)
    g.fillStyle(COR.tintaSuave, 0.8);
    g.beginPath();
    g.moveTo(cx, apiceY);
    g.lineTo(cx - 0.18 * largura, base - 0.55 * altura);
    g.lineTo(cx - 0.08 * largura, base - 0.3 * altura);
    g.closePath();
    g.fillPath();
  }

  /** Um dragao sobrevoando o pico, ida e volta lenta -- o unico habitante vivo
   *  do cenario, e o motivo de a pedra estar tao bem guardada. Uma silhueta so
   *  (nunca sprite), porque de longe e pequeno demais para precisar de mais. */
  private desenharDragao(picoX: number, apiceY: number, a: number) {
    const escala = Math.max(3, a * 0.07);
    const corpo = this.add.graphics();
    const pontos: [number, number][] = [
      [-2.0, 0.15], [-1.2, -0.05], [-0.6, -0.15],
      [-1.3, -1.0], [-0.5, -0.55], [0.1, -1.25], [0.35, -0.5],
      [0.55, -0.35], [0.95, -0.25], [1.3, -0.05], [1.0, 0.12],
      [0.55, 0.28], [-0.2, 0.35], [-0.9, 0.3],
    ];
    corpo.fillStyle(COR.tinta, 0.9);
    corpo.beginPath();
    pontos.forEach(([px, py], i) => {
      const x = px * escala, y = py * escala;
      i ? corpo.lineTo(x, y) : corpo.moveTo(x, y);
    });
    corpo.closePath();
    corpo.fillPath();

    const xLonge = picoX + LARGURA * 0.34, xPerto = picoX + LARGURA * 0.14;
    const yVoo = apiceY - a * 0.1;
    corpo.setPosition(xLonge, yVoo);
    this.tweens.add({
      targets: corpo, x: xPerto, duration: 8000, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      onUpdate: () => corpo.setScale(corpo.x < (xLonge + xPerto) / 2 ? -1 : 1, 1),
    });
    this.tweens.add({
      targets: corpo, y: yVoo + a * 0.04, duration: 2100, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  }

  /** Dois feixes finos subindo da pedra, como um farol -- reforca que a luz
   *  vem dali, nao so do ceu quente. */
  private raiosDeSol(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    const comprimento = a * 0.8;
    [-1, 1].forEach((lado) => {
      g.fillStyle(COR.papel, 0.1);
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + lado * a * 0.05, cy);
      g.lineTo(cx + lado * a * 0.32, cy - comprimento);
      g.lineTo(cx + lado * a * 0.24, cy - comprimento);
      g.closePath();
      g.fillPath();
    });
  }

  /** Circulos concentricos com alfa caindo: o jeito barato de simular um
   *  brilho radial, que Graphics nao desenha de fabrica. `forca` deixa
   *  desenhar o halo de novo, mais fraco, por cima das montanhas. */
  private resplendorDaPedra(
    g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number, forca: number
  ) {
    [
      [0.5, COR.ouro, 0.12],
      [0.36, COR.ouro, 0.18],
      [0.24, COR.brasa, 0.28],
    ].forEach(([r, cor, alfa]) => {
      g.fillStyle(cor as number, (alfa as number) * forca);
      g.fillCircle(cx, cy, a * (r as number));
    });
  }

  /** Uma cordilheira em silhueta, atravessando a tela inteira. Dois senos de
   *  frequencia diferente somados dao um perfil irregular sem precisar de
   *  aleatorio -- entao o desenho e sempre igual para o mesmo LARGURA/ALTURA,
   *  em vez de reembaralhar a cada resize. */
  private montanhas(
    g: Phaser.GameObjects.Graphics, base: number,
    cor: number, alfa: number, amplitude: number, freq: number, fase: number
  ) {
    const L = LARGURA;
    const passos = Math.max(8, Math.round(L / 24));
    g.fillStyle(cor, alfa);
    g.beginPath();
    g.moveTo(0, base + amplitude);
    for (let i = 0; i <= passos; i++) {
      const x = (L * i) / passos;
      const y =
        base -
        amplitude * (0.5 + 0.5 * Math.sin(x * freq + fase)) -
        amplitude * 0.35 * Math.sin(x * freq * 2.3 - fase);
      g.lineTo(x, y);
    }
    g.lineTo(L, base + amplitude);
    g.closePath();
    g.fillPath();
  }

  /** A propria pedra: um facetado simples (losango + duas faces), clara do
   *  lado que pega luz e escura do outro, com contorno de 1px -- a mesma
   *  regra de silhueta que todo objeto do jogo segue. */
  private pedraDoSol(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    const r = Math.max(4, a * 0.052);
    const pontos = [
      [cx, cy - r], [cx + r * 0.75, cy - r * 0.15],
      [cx + r * 0.42, cy + r * 0.85], [cx - r * 0.42, cy + r * 0.85],
      [cx - r * 0.75, cy - r * 0.15],
    ];
    g.fillStyle(COR.brasa, 1);
    g.beginPath();
    pontos.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillPath();
    // faceta clara: metade de cima, virada para o "sol" que ela mesma e
    g.fillStyle(COR.ouro, 1);
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r * 0.75, cy - r * 0.15);
    g.lineTo(cx, cy + r * 0.15);
    g.lineTo(cx - r * 0.75, cy - r * 0.15);
    g.closePath();
    g.fillPath();
    g.fillStyle(COR.papel, 0.85);
    g.fillTriangle(cx, cy - r, cx + r * 0.28, cy - r * 0.5, cx - r * 0.1, cy - r * 0.35);
    g.lineStyle(Math.max(1, Math.round(a / 160)), COR.tinta, 1);
    g.beginPath();
    pontos.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.strokePath();
  }

  /** Faixa de pinheiros entre a montanha e o campo -- mesmo desenho
   *  triangular de `arte/titulo.py`, so que como poligono em vez de pixel. */
  private matas(g: Phaser.GameObjects.Graphics, horizonte: number, l: number) {
    const baseY = horizonte + 2;
    const espaco = Math.max(10, l / 26);
    for (let x = -espaco; x < l + espaco; x += espaco) {
      const h = espaco * (1.1 + 0.3 * Math.sin(x * 0.09));
      const largura = espaco * 0.55;
      const escuro = Math.round(x / espaco) % 2 === 0;
      g.fillStyle(escuro ? COR.pinheiroEscuro : COR.pinheiro, 1);
      g.fillTriangle(x, baseY, x - largura, baseY + h, x + largura, baseY + h);
    }
  }

  /** O campo onde o menu fica em pe: gradiente de grama, uma trilha subindo
   *  ate a mata (o mesmo convite visual do banner antigo) e alguns tufos
   *  espalhados por uma grade esparsa, nunca pixel a pixel. */
  private campo(g: Phaser.GameObjects.Graphics, horizonte: number, l: number, a: number) {
    const topoCampo = horizonte + a * 0.05;
    g.fillGradientStyle(COR.gramaClara, COR.gramaClara, COR.grama, COR.grama, 1);
    g.fillRect(0, topoCampo, l, a - topoCampo);

    const largoBase = l * 0.1, largoTopo = l * 0.018;
    g.fillStyle(COR.terraEscura, 0.9);
    g.beginPath();
    g.moveTo(l / 2 - largoBase / 2, a);
    g.lineTo(l / 2 - largoTopo / 2, topoCampo);
    g.lineTo(l / 2 + largoTopo / 2, topoCampo);
    g.lineTo(l / 2 + largoBase / 2, a);
    g.closePath();
    g.fillPath();
    g.fillStyle(COR.terra, 0.9);
    g.beginPath();
    g.moveTo(l / 2 - largoBase / 2 + 2, a);
    g.lineTo(l / 2 - largoTopo / 2 + 1, topoCampo);
    g.lineTo(l / 2 + largoTopo / 2 - 1, topoCampo);
    g.lineTo(l / 2 + largoBase / 2 - 2, a);
    g.closePath();
    g.fillPath();

    const passo = Math.max(10, Math.round(a / 22));
    for (let y = topoCampo + passo * 0.5; y < a; y += passo) {
      for (let x = passo * 0.5; x < l; x += passo) {
        const h = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        const k = h < 0 ? h + 1 : h;
        if (k < 0.12) g.fillStyle(COR.gramaClara, 0.5).fillRect(x, y, 2, 2);
        else if (k > 0.94) g.fillStyle(COR.grama, 0.6).fillRect(x, y, 2, 2);
      }
    }
  }

  /** Poeira de luz subindo perto da pedra: o unico movimento do cenario, pouco
   *  mas o bastante para a tela nao parecer uma pintura parada. */
  private faiscas(cx: number, cy: number, a: number) {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const x = cx + (Math.random() - 0.5) * a * 0.7;
      const y = cy + (Math.random() - 0.5) * a * 0.3;
      const r = 1 + Math.random();
      const p = this.add.circle(x, y, r, COR.papel, 0.8);
      this.tweens.add({
        targets: p,
        y: y - a * (0.12 + Math.random() * 0.1),
        alpha: 0,
        duration: 2600 + Math.random() * 2200,
        delay: Math.random() * 2400,
        repeat: -1,
        ease: "Sine.easeOut",
      });
    }
  }

  /** O nome do jogo, escrito de verdade (nao mais uma imagem): a Baloo 2 e
   *  fonte vetorial, entao o navegador desenha cada letra no tamanho exato
   *  que este LARGURA pede -- sem a pixelacao de um PNG esticado. */
  private desenharLogo() {
    const L = LARGURA, A = ALTURA;
    const topo = A * 0.05;

    const tamanhoChapeu = Math.max(10, Math.min(L * 0.075, A * 0.15));
    const chapeu = this.add
      .text(L / 2, topo, "A PEDRA", {
        fontFamily: '"Baloo 2"',
        fontSize: `${Math.round(tamanhoChapeu)}px`,
        fontStyle: "800",
        color: css(COR.papel),
        stroke: css(COR.tinta),
        strokeThickness: Math.max(2, tamanhoChapeu * 0.16),
        letterSpacing: 3,
      })
      .setOrigin(0.5, 0)
      .setShadow(0, Math.max(1, tamanhoChapeu * 0.08), css(COR.tinta, 0.4), 0, false, true);
    if (chapeu.width > L - 24) chapeu.setScale((L - 24) / chapeu.width);

    const tamanhoHeroi = Math.max(14, Math.min(L * 0.135, A * 0.26));
    const heroi = this.add
      .text(L / 2, chapeu.y + chapeu.displayHeight * 0.75, "DO SOL", {
        fontFamily: '"Baloo 2"',
        fontSize: `${Math.round(tamanhoHeroi)}px`,
        fontStyle: "800",
        color: css(COR.ouro),
        stroke: css(COR.tinta),
        strokeThickness: Math.max(3, tamanhoHeroi * 0.16),
      })
      .setOrigin(0.5, 0)
      .setShadow(0, Math.max(1, tamanhoHeroi * 0.09), css(COR.tinta, 0.5), 0, false, true);
    if (heroi.width > L - 16) heroi.setScale((L - 16) / heroi.width);
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
  }
}
