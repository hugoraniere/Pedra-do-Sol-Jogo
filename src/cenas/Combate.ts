/** O combate por turnos, com o heroi de verdade.
 *
 * Nasceu do `Provador` (ver Provador.ts e docs/plano-do-combate.md), a bancada
 * que respondeu se o modelo por turnos cabia no jogo. Aqui o motor e o mesmo
 * (alcance, fileira, turno, dado), mas quem entra na arena e quem realmente
 * esta jogando: a ficha, os poderes, os coracoes e a mochila vem do estado
 * salvo, e quem sai vencido some do mapa de verdade, largando o que carrega.
 *
 * `Mundo.ts` decide QUANDO comecar (chegou perto de um goblin) e QUEM entra
 * (os goblins daquele encontro). Esta cena so sabe LUTAR contra quem chegou.
 */
import Phaser from "phaser";
import { ALTURA, LARGURA, SOLIDOS, TILE, escalaDoSprite } from "../dados/config";
import { acharCriatura, spriteDoGoblin } from "../dados/conteudo";
import { ICONE, MOVIMENTO } from "../dados/provador";
import { ARMAS, CRIATURAS_SOM, DADO, DESFECHO, IMPACTOS, MAGIAS_SOM, faixaDoDado } from "../dados/sons";
import { alcancaveis, caminho, chaveDaCasa, distanciaEmCasas, type Casa } from "../sistemas/alcance";
import { acoesDoHeroi, type AcaoDeHeroi } from "../sistemas/acao";
import { fileira } from "../sistemas/fileira";
import { criarAnimacoes, camadasDoHeroi, Heroi } from "../sistemas/heroi";
import { estado, guardar, marcarDerrotado, registrarUso, salvar, usosGastos } from "../sistemas/estado";
import { poderesDoHeroi } from "../sistemas/poderes";
import type { Atributo } from "../dados/conteudo";
import { tocar, tocarFicha } from "../sistemas/som";
import { texto } from "../sistemas/texto";
import { Ordem, rolar } from "../sistemas/turnos";
import type { Mundo } from "./Mundo";

const SLOT = 22;
const GAP = 2;

type Fase = "montando" | "meuTurno" | "mirando" | "andando" | "vezDaCriatura" | "resolvendo";

type Bicho = {
  /** id UNICO desta luta, para a ordem de turno ("goblin-0", "goblin-1") */
  id: string;
  /** id do bestiario, para saber o que ela larga */
  bicharioId: string;
  /** chave estavel no mapa real (`${cena}:${indice}`); so goblins de verdade
   *  tem, o arbusto de cenario nao */
  chave?: string;
  nome: string;
  retrato: number;
  bonus: number;
  sprite: Phaser.GameObjects.Sprite;
  corpo?: Phaser.Physics.Arcade.Body;
  tipo: "goblin" | "arbusto";
  coracoes: number;
  coracoesMax: number;
  pips?: Phaser.GameObjects.Container;
  mostrarAte: number;
  rota: Casa[];
};

type Slot = {
  acao: AcaoDeHeroi;
  fundo: Phaser.GameObjects.NineSlice;
  icone: Phaser.GameObjects.Image;
  borda: Phaser.GameObjects.Graphics;
  marca: Phaser.GameObjects.Graphics;
  numero: Phaser.GameObjects.BitmapText;
  x: number;
  y: number;
  livreNaRodada: number;
  gastou: boolean;
};

export type Encontro = { id: string; chave: string }[];

export class Combate extends Phaser.Scene {
  private encontro: Encontro = [];
  private heroi!: Heroi;
  private bichos: Bicho[] = [];
  private slots: Slot[] = [];
  private ordem = new Ordem();
  private fase: Fase = "montando";
  private escolhida?: AcaoDeHeroi;
  private rotaDoHeroi: Casa[] = [];
  private chaoLayer!: Phaser.Tilemaps.TilemapLayer;
  private pincel!: Phaser.GameObjects.Graphics;
  private pincelCasas!: Phaser.GameObjects.Graphics;
  private rotulo!: Phaser.GameObjects.BitmapText;
  private chapaRotulo!: Phaser.GameObjects.NineSlice;
  private pipsMovimento: Phaser.GameObjects.Graphics[] = [];
  private coracoesHUD: Phaser.GameObjects.Image[] = [];
  private trilhaIniciativa!: Phaser.GameObjects.Container;
  private botaoPassar!: Phaser.GameObjects.Container;
  private aviso!: Phaser.GameObjects.BitmapText;
  private chapaAviso!: Phaser.GameObjects.NineSlice;
  private dicaCaixa!: Phaser.GameObjects.Container;
  private dicaTexto!: Phaser.GameObjects.BitmapText;
  private dicaChapa!: Phaser.GameObjects.NineSlice;
  private coracoes = 3;
  private coracoesMax = 3;
  private atributos: Record<Atributo, number> = { forca: 0, esperteza: 0, coracao: 0 };
  private topoDaBarra = 0;
  private alcancadas = new Map<string, { tx: number; ty: number; custo: number; de?: string }>();
  /** A cena de onde o heroi e o chao de verdade vem emprestados. Nunca cria
   *  os proprios: ver docs/plano-do-combate.md, secao 3.6. */
  private mundo!: Mundo;
  private largura = 0;
  private altura = 0;

  constructor() {
    super("Combate");
  }

  init(dados: { encontro: Encontro }) {
    this.encontro = dados.encontro;
  }

  // ==================================================================== montar
  create() {
    this.bichos = [];
    this.slots = [];
    this.pipsMovimento = [];
    this.coracoesHUD = [];
    this.ordem = new Ordem();
    this.fase = "montando";
    this.escolhida = undefined;
    this.rotaDoHeroi = [];

    const st0 = estado();
    const ficha = st0.heroi;
    this.coracoesMax = st0.coracoesMax;
    this.coracoes = st0.coracoes;
    this.atributos = poderesDoHeroi(ficha);

    // goblin nao tem textura propria ("goblin" sozinho nunca foi carregado) -
    // os 3 corpos de verdade entram todos aqui, e cada instancia escolhe o
    // dela mais abaixo, por posicao (spriteDoGoblin)
    const spritesDosBichos = [...new Set(
      this.encontro.map((e) => (e.id === "goblin" ? undefined : acharCriatura(e.id)?.sprite)).filter(Boolean)
    )] as string[];
    if (this.encontro.some((e) => e.id === "goblin")) {
      spritesDosBichos.push("goblin-magricela", "goblin-gorducho", "goblin-moleque");
    }
    criarAnimacoes(this, [...camadasDoHeroi(ficha).map((c) => c.chave), ...spritesDosBichos]);

    // A luta acontece NESTE mundo, nunca no proprio: pega emprestado o heroi
    // de verdade e o chao de verdade de Mundo.ts, em vez de criar um mapa
    // (`ARENA`, de dados/provador.ts — aquilo era so a bancada de teste) e um
    // segundo Heroi. Ver docs/plano-do-combate.md, secao 3.6, a regra dura
    // escrita depois que este arquivo nasceu do jeito antigo.
    this.mundo = this.scene.get("Mundo") as Mundo;
    const ctx = this.mundo.contexto();
    this.heroi = ctx.heroi;
    this.chaoLayer = ctx.chao;
    this.largura = this.chaoLayer.tilemap.width;
    this.altura = this.chaoLayer.tilemap.height;

    this.pincelCasas = this.add.graphics().setDepth(-600);
    this.pincel = this.add.graphics().setDepth(-500);

    // conta repeticao do mesmo bicho, para o segundo goblin nao se chamar
    // igual ao primeiro na trilha de turno
    const vistos: Record<string, number> = {};
    this.encontro.forEach((e, i) => {
      const b = acharCriatura(e.id);
      const casa = this.mundo.casaDaCriatura(e.chave);
      if (!b || !casa) return;
      vistos[e.id] = (vistos[e.id] ?? 0) + 1;
      const nome = this.encontro.filter((o) => o.id === e.id).length > 1
        ? `${b.nome.toUpperCase()} ${ROMANO[vistos[e.id]] ?? vistos[e.id]}`
        : b.nome.toUpperCase();
      // ela entra exatamente onde ja estava parada no mapa — nunca num posto
      // fixo de arena. O Mundo ja escondeu a versao decorativa dela. O corpo
      // (spriteDoGoblin) sai da MESMA casa que o Mundo usou pra desenhar a
      // versao decorativa, entao os dois sempre concordam.
      const spriteChave = e.id === "goblin" ? spriteDoGoblin(casa.tx, casa.ty) : b.sprite;
      this.porGoblin(`${e.id}-${i}`, e.id, e.chave, spriteChave, nome, 0, casa.tx, casa.ty, b.coracoes);
    });

    // a camera de Combate so desenha o que ELE acrescenta (barra, mira, os
    // bichos de combate) por cima do mundo de verdade, que continua sendo
    // desenhado por baixo pela camera de Mundo. Por isso ela segue o MESMO
    // heroi, com o mesmo lerp, e nunca pinta fundo proprio (sem
    // setBackgroundColor: o padrao e transparente).
    const limites = this.mundo.limites();
    this.cameras.main.setBounds(0, 0, limites.largura, limites.altura);
    this.cameras.main.startFollow(this.heroi, true, 0.14, 0.14);
    this.cameras.main.setRoundPixels(true);
    // nem colisor nem limite de fisica pro heroi: o corpo dele pertence ao
    // MUNDO de fisica de Mundo.ts (a mesma cena que o criou), que continua
    // rodando por baixo. Registrar de novo aqui, no mundo de fisica desta
    // cena, nao teria efeito nenhum — colisor so funciona dentro do mundo
    // onde o corpo nasceu.

    this.montarInterface();
    this.ligarEntrada();
    this.time.delayedCall(200, () => this.comecarCombate());
  }

  /** o centro horizontal e o PE da casa: e onde o sprite encosta no chao */
  private centroDaCasa(tx: number, ty: number): [number, number] {
    return [tx * TILE + TILE / 2, ty * TILE + TILE];
  }

  private casaDe(x: number, y: number): Casa {
    return { tx: Math.floor(x / TILE), ty: Math.floor((y - 1) / TILE) };
  }

  private casaDoHeroi(): Casa {
    return this.casaDe(this.heroi.x, this.heroi.y);
  }

  private casaDoBicho(b: Bicho): Casa {
    return this.casaDe(b.sprite.x, b.sprite.y);
  }

  // porArbusto saiu daqui: a arena de mentira tinha arbustos pra quebrar, o
  // mundo de verdade ainda nao tem objeto destrutivel nenhum plantado. Volta
  // na Fase 5 (docs/plano-de-implementacao.md), quando objetos com estado
  // existirem em Mundo.ts de verdade.

  private porGoblin(
    id: string, bicharioId: string, chave: string, spriteChave: string, nome: string,
    bonus: number, tx: number, ty: number, coracoes: number
  ) {
    const [x, y] = this.centroDaCasa(tx, ty);
    // nasce no mundo do Mundo, nao no da Combate: sao cenas empilhadas, e cada
    // uma desenha a sua lista inteira por cima da de baixo. Se o goblin fosse
    // desta cena, ele cobriria o heroi sempre, nao importa o Y de cada um.
    const s = this.mundo.physics.add.sprite(x, y, spriteChave, 0).setOrigin(0.5, 1)
      .setScale(escalaDoSprite(spriteChave));
    s.setDepth(y);
    s.play(`${spriteChave}-parado-baixo`, true);
    s.body.setSize(10, 6).setOffset(3, 26);
    this.bichos.push({
      id, bicharioId, chave, nome, bonus,
      retrato: ICONE.retrato[spriteChave.replace("goblin-", "")] ?? 1,
      sprite: s, corpo: s.body as Phaser.Physics.Arcade.Body, tipo: "goblin",
      coracoes, coracoesMax: coracoes, mostrarAte: 0, rota: [],
    });
  }

  // ================================================================ interface
  private montarInterface() {
    const fixo = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      (o as unknown as { setScrollFactor: (n: number) => void }).setScrollFactor(0);
      (o as unknown as { setDepth: (n: number) => void }).setDepth(1000);
      return o;
    };

    fixo(this.add.nineslice(2, 1, "painel-escuro", undefined, LARGURA - 4, 22, 8, 8, 8, 8).setOrigin(0));
    for (let i = 0; i < this.coracoesMax; i++) {
      this.coracoesHUD.push(fixo(this.add.image(11 + i * 11, 12, "ui", 0)));
    }
    this.trilhaIniciativa = fixo(this.add.container(14 + this.coracoesMax * 11, 2));

    const acoes = acoesDoHeroi(estado().heroi);
    const area = { x: 6, y: ALTURA - SLOT - 2, largura: LARGURA - 56, altura: SLOT };
    const linha = fileira(area, SLOT, GAP);
    const cabem = Math.min(linha.cabem(), acoes.length);
    this.topoDaBarra = area.y - 14;

    fixo(this.add.nineslice(area.x - 2, area.y - 2, "painel-escuro", undefined,
      cabem * (SLOT + GAP) - GAP + 4, SLOT + 4, 8, 8, 8, 8).setOrigin(0).setAlpha(0.85));

    for (let i = 0; i < cabem; i++) {
      const acao = acoes[i];
      const r = linha.reservar();
      const fundo = fixo(this.add.nineslice(r.x, r.y, "painel-creme", undefined, SLOT, SLOT, 8, 8, 8, 8).setOrigin(0));
      const icone = fixo(this.add.image(r.x + SLOT / 2, r.y + SLOT / 2 + 1, "icones", acao.icone));
      const borda = fixo(this.add.graphics());
      borda.lineStyle(2, acao.cor, 1).strokeRect(r.x + 1, r.y + 1, SLOT - 2, SLOT - 2);
      const marca = fixo(this.add.graphics());
      const numero = fixo(texto(this, r.x + 2, r.y + 1, String(i + 1), { cor: 0x2c2440 }));

      const alvo = fixo(this.add.rectangle(r.x + SLOT / 2, r.y + SLOT / 2, SLOT + 2, SLOT + 6, 0x000000, 0)
        .setInteractive({ useHandCursor: true }));
      alvo.on("pointerdown", () => this.escolher(acao));
      alvo.on("pointerover", () => this.mostrarDica(acao, r.x + SLOT / 2));
      alvo.on("pointerout", () => this.esconderDica());
      // "porAventura" pode ja ter sido gasta numa luta anterior desta mesma
      // aventura — o slot nasce riscado se for o caso.
      const jaGastou = acao.escopo === "porAventura" && usosGastos(acao.id) > 0;
      this.slots.push({ acao, fundo, icone, borda, marca, numero, x: r.x, y: r.y, livreNaRodada: 0, gastou: jaGastou });
    }

    for (let i = 0; i < MOVIMENTO.heroi; i++) {
      this.pipsMovimento.push(fixo(this.add.graphics()));
    }

    const px = LARGURA - 26;
    const py = ALTURA - 16;
    const fundoP = this.add.nineslice(0, 0, "painel-ouro", undefined, 44, 16, 8, 8, 8, 8).setOrigin(0.5);
    const txtP = texto(this, 0, 0, "PASSAR", { cor: 0x2c2440, ancora: 0.5, ancoraY: 0.5 });
    this.botaoPassar = fixo(this.add.container(px, py, [fundoP, txtP]));
    this.botaoPassar.setSize(44, 16).setInteractive({ useHandCursor: true });
    this.botaoPassar.on("pointerdown", () => this.passarAVez());
    this.botaoPassar.setVisible(false);

    this.chapaRotulo = fixo(this.add.nineslice(LARGURA / 2, this.topoDaBarra, "painel-escuro", undefined, 8, 12, 8, 8, 8, 8).setOrigin(0.5, 0));
    this.chapaRotulo.setVisible(false);
    this.rotulo = fixo(texto(this, LARGURA / 2, this.topoDaBarra + 2, "", { cor: 0xf5b62b, ancora: 0.5 }));

    this.dicaChapa = this.add.nineslice(0, 0, "painel-creme", undefined, 8, 24, 8, 8, 8, 8).setOrigin(0.5, 1);
    this.dicaTexto = texto(this, 0, -20, "", { cor: 0x2c2440, ancora: 0.5 });
    this.dicaCaixa = fixo(this.add.container(LARGURA / 2, this.topoDaBarra - 4, [this.dicaChapa, this.dicaTexto]));
    this.dicaCaixa.setVisible(false).setDepth(1100);

    this.chapaAviso = fixo(this.add.nineslice(LARGURA / 2, 28, "painel-ouro", undefined, 8, 16, 8, 8, 8, 8).setOrigin(0.5, 0));
    this.chapaAviso.setVisible(false).setDepth(1200);
    this.aviso = fixo(texto(this, LARGURA / 2, 32, "", { cor: 0x2c2440, ancora: 0.5 }));
    this.aviso.setDepth(1201);
  }

  private mostrarDica(a: AcaoDeHeroi, xSlot: number) {
    const linha2 =
      a.forma === "aoRedor" ? `PEGA ${a.alcance} CASAS EM VOLTA`
      : a.forma === "linha" ? `LINHA DE ${a.alcance} CASAS`
      : `ALCANCE ${a.alcance} ${a.alcance === 1 ? "CASA" : "CASAS"}`;
    const linha3 = a.escopo === "porLuta" ? "UMA VEZ POR LUTA"
      : a.escopo === "porAventura" ? "UMA VEZ POR AVENTURA"
      : "TODO TURNO";
    const linhas = [a.nome, linha2, linha3];
    const ENTRE = 2;
    const alturaTexto = linhas.length * (10 + ENTRE) - ENTRE;
    const altura = alturaTexto + 10;
    const largura = Math.max(...linhas.map((l) => l.length)) * 8 + 12;
    this.dicaTexto.setText(linhas.join("\n"));
    this.dicaTexto.setLineSpacing(ENTRE);
    this.dicaTexto.setY(-altura + 5);
    this.dicaChapa.setSize(largura, altura);
    const x = Phaser.Math.Clamp(xSlot, largura / 2 + 2, LARGURA - largura / 2 - 2);
    this.dicaCaixa.setPosition(x, this.topoDaBarra - 2).setVisible(true);
  }

  private esconderDica() {
    this.dicaCaixa.setVisible(false);
  }

  private dizer(nome: string) {
    this.rotulo.setText(nome);
    this.chapaRotulo.setVisible(nome.length > 0).setSize(nome.length * 8 + 10, 12);
  }

  private anunciar(frase: string, ms = 900) {
    this.aviso.setText(frase);
    this.chapaAviso.setVisible(true).setSize(frase.length * 8 + 16, 16);
    this.chapaAviso.setAlpha(1);
    this.aviso.setAlpha(1);
    this.tweens.add({ targets: [this.aviso, this.chapaAviso], alpha: 0, delay: ms, duration: 260 });
  }

  private ligarEntrada() {
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.y >= this.topoDaBarra) return;
      this.tocarNoMundo(p.worldX, p.worldY);
    });
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") return this.cancelar();
      if (e.key === " " || e.key === "Enter") return this.passarAVez();
      const n = Number(e.key);
      if (n >= 1 && n <= this.slots.length) this.escolher(this.slots[n - 1].acao);
    });
  }

  // ================================================================== combate
  private goblins(): Bicho[] {
    return this.bichos.filter((b) => b.tipo === "goblin");
  }

  private d6 = () => Phaser.Math.Between(1, 6);

  private comecarCombate() {
    const lutadores = this.goblins();
    if (lutadores.length === 0) return this.acabarCombate();
    this.fase = "vezDaCriatura";
    this.ordem.comecar([
      { id: "heroi", iniciativa: this.d6() + this.atributos.esperteza, movimentoMax: MOVIMENTO.heroi },
      ...lutadores.map((g) => ({ id: g.id, iniciativa: this.d6(), movimentoMax: MOVIMENTO.goblin })),
    ]);
    const minha = this.casaDoHeroi();
    const [ax, ay] = this.centroDaCasa(minha.tx, minha.ty);
    this.tweens.add({ targets: this.heroi, x: ax, y: ay, duration: 160, ease: "Quad.easeOut" });
    this.anunciar("COMBATE!");
    tocarFicha(CRIATURAS_SOM.pequeno.nota);
    this.desenharIniciativa();
    this.time.delayedCall(700, () => this.entrarNoTurno());
  }

  private entrarNoTurno() {
    const vez = this.ordem.agora();
    if (!vez) return this.acabarCombate();
    this.desenharIniciativa();
    if (vez.id === "heroi") {
      this.fase = "meuTurno";
      this.botaoPassar.setVisible(true);
      this.anunciar("SUA VEZ", 600);
      this.calcularAlcance();
      return;
    }
    const dele = this.bichos.find((b) => b.id === vez.id);
    this.anunciar(`VEZ DO ${dele?.nome ?? "INIMIGO"}`, 500);
    this.fase = "vezDaCriatura";
    this.botaoPassar.setVisible(false);
    this.pincelCasas.clear();
    this.time.delayedCall(320, () => this.jogarCriatura(vez.id));
  }

  private passarAVez() {
    if (this.fase !== "meuTurno" && this.fase !== "mirando") return;
    this.cancelar();
    tocar("menu-volta");
    this.ordem.passar();
    this.entrarNoTurno();
  }

  private acabarCombate() {
    this.ordem.encerrar();
    this.fase = "resolvendo";
    this.botaoPassar.setVisible(false);
    this.pincelCasas.clear();
    this.pincel.clear();
    this.dizer("");
    this.desenharIniciativa();
    this.anunciar("VITORIA!");
    this.slots.forEach((s) => { s.gastou = false; s.livreNaRodada = 0; });
    estado().coracoes = this.coracoes;
    salvar();
    // sem fade: o mundo nunca saiu de cena, entao nao ha nada pra "voltar".
    // Combate so solta a barra e devolve o controle no mesmo lugar.
    this.time.delayedCall(700, () => {
      this.scene.stop();
      this.mundo.sairDeCombate();
    });
  }

  /** A vez da criatura: anda ate perto e bate. Ela NUNCA rola dado, igual a mesa. */
  private jogarCriatura(id: string) {
    const b = this.bichos.find((x) => x.id === id);
    if (!b) { this.ordem.remover(id); return this.entrarNoTurno(); }
    const alvo = this.casaDoHeroi();
    const passos = MOVIMENTO.goblin;
    const achadas = alcancaveis(this.casaDoBicho(b), passos, (tx, ty) => this.passavel(tx, ty, b));
    let melhor: Casa | undefined;
    let melhorDist = Infinity;
    achadas.forEach((c) => {
      const d = distanciaEmCasas(c, alvo);
      if (d < melhorDist) { melhorDist = d; melhor = { tx: c.tx, ty: c.ty }; }
    });
    b.rota = melhor ? caminho(achadas, melhor) : [];
    this.mostrarPips(b);

    const depoisDeAndar = () => {
      if (distanciaEmCasas(this.casaDoBicho(b), this.casaDoHeroi()) <= 1) {
        const grito = texto(this, b.sprite.x, b.sprite.y - 40, "!", { cor: 0xf5b62b, ancora: 0.5 });
        grito.setDepth(2000);
        this.tweens.add({ targets: b.sprite, scaleY: 0.85, scaleX: 1.15, duration: 160, yoyo: true });
        tocarFicha(CRIATURAS_SOM.pequeno.reage);
        this.time.delayedCall(500, () => {
          grito.destroy();
          const { dado, total } = rolar(b.bonus, this.d6);
          const faixa = faixaDoDado(total);
          tocarFicha(DADO.rola);
          this.mostrarDado(dado, b.bonus, faixa, b.sprite.x, b.sprite.y - 40);
          this.time.delayedCall(520, () => {
            tocarFicha(DESFECHO[faixa]);
            if (faixa === "ops") {
              this.poeira(this.heroi.x, this.heroi.y - 8);
              tocarFicha(IMPACTOS.errou);
            } else {
              this.heroiApanha(faixa === "oba");
            }
            this.time.delayedCall(420, () => { this.ordem.passar(); this.entrarNoTurno(); });
          });
        });
        return;
      }
      this.time.delayedCall(220, () => { this.ordem.passar(); this.entrarNoTurno(); });
    };

    if (b.rota.length === 0) return depoisDeAndar();
    b.sprite.setData("aoChegar", depoisDeAndar);
  }

  private heroiApanha(cheio = true) {
    tocarFicha(IMPACTOS.bicho);
    this.cameras.main.shake(cheio ? 140 : 90, cheio ? 0.005 : 0.003);
    this.coracoes = Math.max(0, this.coracoes - 1);
    this.atualizarCoracoes();
    estado().coracoes = this.coracoes;
    salvar();
    this.tweens.add({ targets: this.heroi, alpha: 0.3, duration: 90, yoyo: true, repeat: 3 });
    if (this.coracoes > 0) {
      // a pose de levar golpe tambem ja existia e ninguem chamava: o heroi
      // apanhava piscando, sem mudar de desenho
      this.heroi.machucar(300);
      return;
    }
    // com zero coracoes quem manda e a tonteira: nada de machucar() aqui, senao
    // uma pose comeria a outra no mesmo quadro e nenhuma das duas apareceria.
    // Nunca existe derrota: fica tonto, e volta com um coracao. A fogueira de
    // verdade (CLAUDE.md) ainda nao existe; ate la este e o mesmo desfecho que
    // o Provador ja validou.
    this.heroi.ficarTonto(1200);
    this.anunciar("QUE TONTEIRA!", 900);
    this.time.delayedCall(1200, () => {
      this.coracoes = 1;
      this.atualizarCoracoes();
      estado().coracoes = 1;
      salvar();
    });
  }

  private atualizarCoracoes() {
    this.coracoesHUD.forEach((c, i) => c.setFrame(i < this.coracoes ? 0 : 1));
  }

  // ==================================================================== a vez
  private passavel(tx: number, ty: number, quem?: Bicho): boolean {
    if (tx < 0 || ty < 0 || tx >= this.largura || ty >= this.altura) return false;
    const tile = this.chaoLayer.getTileAt(tx, ty);
    if (!tile || (SOLIDOS as readonly number[]).includes(tile.index)) return false;
    const ocupada = this.bichos.some(
      (b) => b !== quem && b.tipo !== "arbusto" && this.mesmaCasa(this.casaDoBicho(b), tx, ty)
    );
    if (ocupada) return false;
    const arbusto = this.bichos.some((b) => b.tipo === "arbusto" && this.mesmaCasa(this.casaDoBicho(b), tx, ty));
    if (arbusto) return false;
    if (quem !== undefined && this.mesmaCasa(this.casaDoHeroi(), tx, ty)) return false;
    return true;
  }

  private mesmaCasa(c: Casa, tx: number, ty: number) {
    return c.tx === tx && c.ty === ty;
  }

  private calcularAlcance() {
    const vez = this.ordem.agora();
    if (!vez) return;
    this.alcancadas = alcancaveis(this.casaDoHeroi(), vez.movimento, (tx, ty) => this.passavel(tx, ty));
    this.desenharCasas();
  }

  private desenharCasas() {
    this.pincelCasas.clear();
    if (this.fase !== "meuTurno") return;
    this.alcancadas.forEach((c) => {
      if (c.custo === 0) return;
      this.pincelCasas.fillStyle(0x7ec4f2, 0.18).fillRect(c.tx * TILE + 1, c.ty * TILE + 1, TILE - 2, TILE - 2);
      this.pincelCasas.lineStyle(1, 0x7ec4f2, 0.32).strokeRect(c.tx * TILE + 1.5, c.ty * TILE + 1.5, TILE - 3, TILE - 3);
    });
  }

  private escolher(acao: AcaoDeHeroi) {
    if (this.fase !== "meuTurno" && this.fase !== "mirando") return;
    const vez = this.ordem.agora();
    const slot = this.slots.find((s) => s.acao.id === acao.id)!;
    const emEspera = this.ordem.rodada() < slot.livreNaRodada;
    if (slot.gastou || emEspera || vez?.acaoUsada) {
      tocar("menu-volta", { volume: 0.4 });
      this.tweens.add({ targets: [slot.fundo, slot.icone], x: "+=1", duration: 45, yoyo: true, repeat: 2 });
      return;
    }
    if (this.escolhida?.id === acao.id) return this.cancelar();
    tocar("menu-foco");
    this.escolhida = acao;
    this.dizer(acao.nome);
    if (acao.forma === "aoRedor") return this.executar(acao, this.casaDoHeroi());
    this.fase = "mirando";
  }

  private cancelar() {
    if (this.fase === "mirando") {
      tocar("menu-volta");
      this.fase = "meuTurno";
    }
    this.escolhida = undefined;
    this.dizer("");
    this.pincel.clear();
  }

  private tocarNoMundo(x: number, y: number) {
    if (this.fase === "mirando" && this.escolhida) {
      const casa = this.casaDe(x, y);
      if (distanciaEmCasas(this.casaDoHeroi(), casa) > this.escolhida.alcance) {
        tocar("menu-volta", { volume: 0.4 });
        this.anunciar("LONGE DEMAIS", 600);
        return;
      }
      return this.executar(this.escolhida, casa);
    }
    if (this.fase === "meuTurno") {
      const casa = this.casaDe(x, y);
      const achada = this.alcancadas.get(chaveDaCasa(casa.tx, casa.ty));
      if (!achada || achada.custo === 0) return;
      this.rotaDoHeroi = caminho(this.alcancadas, casa);
      this.ordem.gastarMovimento(achada.custo);
      this.fase = "andando";
      this.pincelCasas.clear();
    }
  }

  // ================================================================= executar
  private executar(acao: AcaoDeHeroi, casa: Casa) {
    this.fase = "resolvendo";
    this.escolhida = undefined;
    this.pincel.clear();
    this.heroi.parar();
    // Vira para o alvo antes de agir. Em combate o heroi ataca parado, e a
    // direcao dele so mudava andando: sem isto, o braco estica para o lado em
    // que ele andou pela ultima vez, que quase nunca e o lado do goblin.
    const minha = this.casaDoHeroi();
    this.heroi.encarar(casa.tx - minha.tx, casa.ty - minha.ty);
    // Golpe e magia sao poses diferentes, e os dois quadros existem desde que a
    // folha de sprite ganhou 8 colunas. Ate aqui toda acao usava a de conjurar,
    // entao dar uma espadada tinha o mesmo desenho que lancar uma bola de fogo.
    if (acao.tipo === "magia") this.heroi.conjurar(300);
    else this.heroi.atacar(300);

    const slot = this.slots.find((s) => s.acao.id === acao.id)!;
    if (acao.escopo === "porLuta") slot.gastou = true;
    if (acao.escopo === "porAventura") {
      slot.gastou = true;
      registrarUso(acao.id);
    }
    this.ordem.gastarAcao();

    if (acao.som === "cajado") tocarFicha(ARMAS.cajado.golpe);
    else if (acao.som === "fogo") tocarFicha(MAGIAS_SOM.fogo);
    else if (acao.som === "gelo") tocarFicha(MAGIAS_SOM.gelo);
    else if (acao.som === "voz") tocarFicha(MAGIAS_SOM.voz);

    const bonus = this.atributos[acao.atributo];
    const { dado, total } = rolar(bonus, this.d6);
    const faixa = faixaDoDado(total);
    tocarFicha(DADO.rola);
    const [cx, cy] = this.centroDaCasa(casa.tx, casa.ty);
    this.mostrarDado(dado, bonus, faixa, cx, cy - 40);

    this.time.delayedCall(420, () => {
      tocarFicha(DESFECHO[faixa]);
      const pegos = this.pegos(acao, casa);
      if (faixa === "ops" || pegos.length === 0) {
        this.poeira(cx, cy - 8);
        tocarFicha(IMPACTOS.errou);
      } else {
        pegos.forEach((b) => this.atingir(b, cx, cy, faixa === "oba"));
        this.cameras.main.shake(90, 0.0022);
      }
      this.time.delayedCall(500, () => this.fimDaAcao());
    });
  }

  private fimDaAcao() {
    this.dizer("");
    if (this.goblins().length === 0) return this.acabarCombate();
    if (this.ordem.acabou()) {
      this.ordem.passar();
      return this.entrarNoTurno();
    }
    this.fase = "meuTurno";
    this.calcularAlcance();
  }

  private mostrarDado(dado: number, bonus: number, faixa: "ops" | "quase" | "oba", x: number, y: number) {
    const cores = { ops: 0xe2483d, quase: 0xf5b62b, oba: 0x3e9b62 };
    const palavras = { ops: "OPS", quase: "QUASE", oba: "OBA" };
    const palavra = palavras[faixa];
    const largura = 26 + (bonus > 0 ? 18 : 0) + palavra.length * 8 + 8;
    const cx = Phaser.Math.Clamp(x, largura / 2 + 4, this.largura * TILE - largura / 2 - 4);
    const caixa = this.add.container(cx, y).setDepth(2000);
    const chapa = this.add.nineslice(0, 0, "painel-creme", undefined, largura, 20, 8, 8, 8, 8).setOrigin(0.5);
    const esquerda = -largura / 2 + 4;
    const face = this.add.image(esquerda + 8, 0, "icones", ICONE.dadoBase + dado - 1);
    const pecas: Phaser.GameObjects.GameObject[] = [chapa, face];
    let cursor = esquerda + 18;
    if (bonus > 0) {
      pecas.push(texto(this, cursor, -4, `+${bonus}`, { cor: 0x4a3e64 }));
      cursor += 18;
    }
    pecas.push(texto(this, cursor + 2, -4, palavra, { cor: cores[faixa] }));
    caixa.add(pecas);
    this.tweens.add({
      targets: caixa, y: y - 10, alpha: 0, delay: 640, duration: 320,
      onComplete: () => caixa.destroy(),
    });
  }

  private pegos(acao: AcaoDeHeroi, casa: Casa): Bicho[] {
    const eu = this.casaDoHeroi();
    if (acao.forma === "aoRedor") {
      return this.bichos.filter((b) => distanciaEmCasas(this.casaDoBicho(b), eu) <= acao.alcance);
    }
    if (acao.forma === "linha") {
      const dx = Math.sign(casa.tx - eu.tx);
      const dy = Math.sign(casa.ty - eu.ty);
      const naLinha: Bicho[] = [];
      for (let i = 1; i <= acao.alcance; i++) {
        const c = { tx: eu.tx + dx * i, ty: eu.ty + dy * i };
        this.bichos.forEach((b) => { if (this.mesmaCasa(this.casaDoBicho(b), c.tx, c.ty)) naLinha.push(b); });
      }
      return naLinha;
    }
    return this.bichos.filter((b) => this.mesmaCasa(this.casaDoBicho(b), casa.tx, casa.ty));
  }

  private atingir(b: Bicho, dex: number, dey: number, cheio: boolean) {
    tocarFicha(b.tipo === "arbusto" ? IMPACTOS.madeira : IMPACTOS.bicho);
    b.sprite.setTintFill(0xfff8ea);
    this.time.delayedCall(70, () => b.sprite.clearTint());
    this.tweens.add({ targets: b.sprite, scaleY: 0.8, duration: 80, yoyo: true });
    if (cheio && b.corpo) {
      const fuga = new Phaser.Math.Vector2(b.sprite.x - dex, b.sprite.y - dey).normalize().scale(70);
      b.corpo.setVelocity(fuga.x, fuga.y);
      this.time.delayedCall(140, () => b.corpo?.setVelocity(0, 0));
    }
    b.coracoes -= 1;
    this.mostrarPips(b);
    if (b.coracoes <= 0) this.desistir(b);
  }

  /** Some do combate E do mapa de verdade. `chave` e a mesma que `Mundo.ts`
   *  guarda em `estado().derrotados`: quando o jogador voltar para a floresta,
   *  este goblin ja nao esta la. */
  private desistir(b: Bicho) {
    this.bichos = this.bichos.filter((o) => o !== b);
    b.corpo?.setVelocity(0, 0);
    b.pips?.destroy();
    if (b.tipo === "goblin") {
      tocarFicha(CRIATURAS_SOM.pequeno.desiste);
      if (b.chave) {
        marcarDerrotado(b.chave);
        // tira a versao decorativa do mundo de verdade agora mesmo — nao
        // precisa esperar Mundo recarregar o mapa pra ela sumir de vez.
        this.mundo.removerCriatura(b.chave);
        const ficha = acharCriatura(b.bicharioId);
        ficha?.larga.forEach((item) => {
          if (item === "moeda") estado().moedas += 1;
          else guardar(item);
        });
        salvar();
      }
    }
    this.ordem.remover(b.id);
    for (let i = 0; i < 3; i++) {
      const e = this.add.circle(b.sprite.x, b.sprite.y - 16, 1.5, 0xf5b62b).setDepth(2000);
      this.tweens.add({
        targets: e, x: b.sprite.x + Phaser.Math.Between(-12, 12), y: b.sprite.y - 30,
        alpha: 0, duration: 420, ease: "Back.easeOut", onComplete: () => e.destroy(),
      });
    }
    // o corpo desaba (pose `derrota`, desenhada em arte/goblin.py) em vez de
    // girar 220 graus: o giro era um efeito de codigo no lugar de um quadro
    // proprio. A direcao vem da animacao que ja estava tocando.
    if (b.tipo === "goblin") {
      const dir = b.sprite.anims.currentAnim?.key.split("-").pop() ?? "baixo";
      b.sprite.play(`${b.sprite.texture.key}-derrota-${dir}`);
    }
    this.tweens.add({
      targets: b.sprite, alpha: 0, y: b.sprite.y - 10, duration: 380,
      onComplete: () => b.sprite.destroy(),
    });
  }

  private poeira(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const p = this.add.circle(x, y, 1.5, 0xfdefd6, 0.9).setDepth(y + 1);
      this.tweens.add({
        targets: p, x: x + Phaser.Math.Between(-9, 9), y: y + Phaser.Math.Between(-9, 3),
        alpha: 0, duration: 300, onComplete: () => p.destroy(),
      });
    }
  }

  // ===================================================== vida sobre a cabeca
  private mostrarPips(b: Bicho) {
    if (b.tipo === "arbusto") return;
    b.mostrarAte = this.time.now + 3000;
    b.pips?.destroy();
    const g = this.add.graphics();
    const largura = b.coracoesMax * 6 - 2;
    g.fillStyle(0x2c2440, 0.8).fillRect(-largura / 2 - 2, -2, largura + 4, 9);
    for (let i = 0; i < b.coracoesMax; i++) {
      const x = -largura / 2 + i * 6;
      if (i < b.coracoes) g.fillStyle(0xe2483d, 1).fillRect(x, 0, 5, 5);
      else g.lineStyle(1, 0xfff8ea, 0.55).strokeRect(x + 0.5, 0.5, 4, 4);
    }
    b.pips = this.add.container(b.sprite.x, b.sprite.y - 36, [g]).setDepth(2000);
    b.pips.setScale(0.6);
    this.tweens.add({ targets: b.pips, scale: 1, duration: 140, ease: "Back.easeOut" });
  }

  // =================================================================== update
  update(_t: number, _dt: number) {
    this.andarRota();
    this.andarCriaturas();
    this.desenharMira();
    this.atualizarSlots();
    this.atualizarPipsMovimento();
    this.cuidarDosPips();
    this.heroi.atualizarProfundidade();
  }

  private andarRota() {
    if (this.rotaDoHeroi.length === 0) {
      if (this.fase === "andando") {
        this.heroi.mover(0, 0);
        this.fase = "meuTurno";
        this.calcularAlcance();
      }
      return;
    }
    const passo = this.rotaDoHeroi[0];
    const [ax, ay] = this.centroDaCasa(passo.tx, passo.ty);
    if (Phaser.Math.Distance.Between(this.heroi.x, this.heroi.y, ax, ay) < 3) {
      this.heroi.setPosition(ax, ay);
      this.rotaDoHeroi.shift();
      return;
    }
    this.heroi.mover(ax - this.heroi.x, ay - this.heroi.y);
  }

  private andarCriaturas() {
    this.bichos.forEach((b) => {
      if (!b.corpo || b.rota.length === 0) return;
      const passo = b.rota[0];
      const [ax, ay] = this.centroDaCasa(passo.tx, passo.ty);
      if (Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, ax, ay) < 3) {
        b.sprite.setPosition(ax, ay);
        b.corpo.setVelocity(0, 0);
        b.rota.shift();
        if (b.rota.length === 0) {
          const aoChegar = b.sprite.getData("aoChegar") as (() => void) | undefined;
          b.sprite.setData("aoChegar", undefined);
          aoChegar?.();
        }
        return;
      }
      const v = new Phaser.Math.Vector2(ax - b.sprite.x, ay - b.sprite.y).normalize().scale(52);
      b.corpo.setVelocity(v.x, v.y);
      b.sprite.setDepth(b.sprite.y);
    });
  }

  private desenharMira() {
    this.pincel.clear();
    if (this.fase !== "mirando" || !this.escolhida) return;
    const a = this.escolhida;
    const raio = a.alcance * TILE;
    const respiro = 1 + Math.sin(this.time.now / 400) * 0.015;
    this.pincel.lineStyle(1, a.cor, 0.75);
    for (let i = 0; i < 32; i += 2) {
      const de = (i / 32) * Math.PI * 2;
      const ate = ((i + 1) / 32) * Math.PI * 2;
      this.pincel.beginPath();
      for (let k = 0; k <= 4; k++) {
        const ang = de + ((ate - de) * k) / 4;
        const px = this.heroi.x + Math.cos(ang) * raio * respiro;
        const py = this.heroi.y + (Math.sin(ang) * raio * respiro) / 2;
        if (k === 0) this.pincel.moveTo(px, py);
        else this.pincel.lineTo(px, py);
      }
      this.pincel.strokePath();
    }
    const eu = this.casaDoHeroi();
    this.bichos.forEach((b) => {
      const dentro = distanciaEmCasas(this.casaDoBicho(b), eu) <= a.alcance;
      if (!dentro) return;
      const pisca = 0.55 + 0.45 * Math.sin(this.time.now / 140);
      this.pincel.lineStyle(1, a.cor, pisca).strokeEllipse(b.sprite.x, b.sprite.y - 1, 16, 8);
    });
  }

  private atualizarSlots() {
    const vez = this.ordem.agora();
    const minhaVez = vez?.id === "heroi";
    this.slots.forEach((s) => {
      s.marca.clear();
      const espera = Math.max(0, s.livreNaRodada - this.ordem.rodada());
      const indisponivel = s.gastou || espera > 0 || (this.ordem.emCombate() && (!minhaVez || vez!.acaoUsada));
      s.fundo.setTexture(this.escolhida?.id === s.acao.id ? "painel-ouro" : "painel-creme");
      s.fundo.setAlpha(indisponivel ? 0.4 : 1);
      s.icone.setAlpha(indisponivel ? 0.3 : 1);
      s.borda.setAlpha(indisponivel ? 0.3 : 1);
      s.numero.setAlpha(indisponivel ? 0.4 : 1);
      for (let i = 0; i < espera; i++) {
        s.marca.fillStyle(0x7ec4f2, 1).fillRect(s.x + 3 + i * 5, s.y + SLOT - 5, 3, 3);
      }
      if (s.gastou) {
        s.marca.lineStyle(1, 0x2c2440, 0.8)
          .lineBetween(s.x + 5, s.y + 5, s.x + SLOT - 5, s.y + SLOT - 5)
          .lineBetween(s.x + SLOT - 5, s.y + 5, s.x + 5, s.y + SLOT - 5);
      }
    });
  }

  private atualizarPipsMovimento() {
    const vez = this.ordem.agora();
    const base = { x: LARGURA - 8 - MOVIMENTO.heroi * 6, y: 6 };
    this.pipsMovimento.forEach((g, i) => {
      g.clear();
      if (!vez || vez.id !== "heroi") return;
      if (i < vez.movimento) g.fillStyle(0x7ec4f2, 1).fillRect(base.x + i * 6, base.y, 4, 4);
      else g.lineStyle(1, 0x7ec4f2, 0.45).strokeRect(base.x + i * 6 + 0.5, base.y + 0.5, 3, 3);
    });
  }

  private cuidarDosPips() {
    const agora = this.time.now;
    this.bichos.forEach((b) => {
      if (!b.pips) return;
      b.pips.setPosition(b.sprite.x, b.sprite.y - 36);
      if (agora > b.mostrarAte && b.pips.alpha > 0) {
        b.pips.setAlpha(Math.max(0, b.pips.alpha - 0.04));
      }
    });
  }

  private desenharIniciativa() {
    this.trilhaIniciativa.removeAll(true);
    if (!this.ordem.emCombate()) return;
    this.ordem.todos().forEach((v, i) => {
      const atual = i === this.ordem.indiceAtual();
      const x = i * 19;
      const quadro = v.id === "heroi"
        ? ICONE.retratoHeroi
        : this.bichos.find((b) => b.id === v.id)?.retrato ?? 1;
      this.trilhaIniciativa.add(
        this.add.nineslice(x, atual ? 0 : 2, atual ? "painel-ouro" : "painel-escuro",
          undefined, 18, atual ? 18 : 16, 8, 8, 8, 8).setOrigin(0)
      );
      const r = this.add.image(x + 9, (atual ? 0 : 2) + (atual ? 9 : 8), "icones", quadro);
      r.setAlpha(atual ? 1 : 0.6);
      this.trilhaIniciativa.add(r);
    });
  }
}

const ROMANO: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
