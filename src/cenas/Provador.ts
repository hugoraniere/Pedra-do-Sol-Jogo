/** O provador de combate POR TURNOS, no molde do Baldur's Gate 3.
 *
 * Cena descartavel, para responder se o modelo cabe neste jogo antes de alguem
 * desenhar um pixel. Nao toca em Interface.ts, design.ts nem arte/, que sao de
 * outras frentes. Ver docs/plano-do-combate.md e AMBIENTE.md.
 *
 * Abre em http://localhost:5213/?provador
 *
 * O DESENHO, em uma frase:
 *   fora de combate o mundo anda sozinho; dentro dele, cada um tem sua vez, com
 *   um orcamento de MOVIMENTO em casas e uma ACAO, e **so o heroi rola o dado**.
 *
 * Por que por turnos resolveu o impasse deste projeto: o RPG de mesa ja e por
 * turnos e ja resolve tudo com 1d6 + atributo. Em tempo real, o dado era
 * enxerto e atrapalhava. Por turnos ele e a propria mecanica, e a regra da mesa
 * de que o monstro nunca rola vira economia de espera em vez de limitacao.
 */
import Phaser from "phaser";
import { ALTURA, COR, LARGURA, SOLIDOS, TILE } from "../dados/config";
import { acharClasse, acharRaca, type Atributo } from "../dados/conteudo";
import { montarChao } from "../dados/mapas";
import {
  ACOES_DE_PROVA, ARENA, DISTANCIA_QUE_NOTA, ICONE, MOVIMENTO, type AcaoDeProva,
} from "../dados/provador";
import { ARMAS, CRIATURAS_SOM, DADO, DESFECHO, IMPACTOS, MAGIAS_SOM } from "../dados/sons";
import { alcancaveis, caminho, chaveDaCasa, distanciaEmCasas, type Casa } from "../sistemas/alcance";
import { decidirAcaoDaCriatura, type Comportamento } from "../sistemas/criatura";
import { passarTurno, type Condicao } from "../sistemas/condicoes";
import { condicoesDados } from "../dados/condicoes-dados";
import { faixaDoDado, rolar } from "../sistemas/dado";
import { aplicarMarca } from "../sistemas/marcas";
import * as fx from "../sistemas/fx";
import { fileira } from "../sistemas/fileira";
import { criarAnimacoes, camadasDoHeroi, Heroi } from "../sistemas/heroi";
import { VAZIO } from "../sistemas/estado";
import { tocar, tocarFicha } from "../sistemas/som";
import { texto } from "../sistemas/texto";
import { Ordem } from "../sistemas/turnos";

const SLOT = 22;
const GAP = 2;

type Fase = "explorando" | "meuTurno" | "mirando" | "andando" | "vezDaCriatura" | "resolvendo";

type Bicho = {
  id: string;
  nome: string;
  /** quadro do retrato na folha icones.png, para a trilha de turnos */
  retrato: number;
  /** o que ela soma no 1d6 dela. Agora a criatura tambem rola. */
  bonus: number;
  /** o que ela QUER fazer, decidido por src/sistemas/criatura.ts */
  comportamento: Comportamento;
  /** so importa pro `medroso`: ja deu o golpe de surpresa nesta aproximacao?
   *  Reseta quando ela volta a ficar longe, para poder assustar de novo depois. */
  jaAtacouDeSurpresa: boolean;
  sprite: Phaser.GameObjects.Sprite;
  corpo?: Phaser.Physics.Arcade.Body;
  tipo: "goblin" | "arbusto";
  coracoes: number;
  coracoesMax: number;
  invisivel: boolean;
  /** pips de vida sobre a cabeca, e ate quando eles ficam visiveis */
  pips?: Phaser.GameObjects.Container;
  mostrarAte: number;
  rota: Casa[];
  /** buff e debuff sao a mesma lista, ver sistemas/condicoes.ts */
  condicoes: Condicao[];
  condicoesUI?: Phaser.GameObjects.Container;
};

type Slot = {
  acao: AcaoDeProva;
  fundo: Phaser.GameObjects.NineSlice;
  icone: Phaser.GameObjects.Image;
  borda: Phaser.GameObjects.Graphics;
  marca: Phaser.GameObjects.Graphics;
  numero: Phaser.GameObjects.BitmapText;
  x: number;
  y: number;
  /** a partir de que rodada ela volta a valer */
  livreNaRodada: number;
  gastou: boolean;
};

export class Provador extends Phaser.Scene {
  private heroi!: Heroi;
  private bichos: Bicho[] = [];
  private slots: Slot[] = [];
  private ordem = new Ordem();
  private fase: Fase = "explorando";
  private escolhida?: AcaoDeProva;
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
  /** this.time.now ate quando um novo golpe nao desconta coracao. Sem isto,
   *  dois golpes emendados no mesmo instante tiram dois coracoes de uma vez
   *  por acidente — nao existe essa punicao dupla nem na mesa. */
  private invencivelAte = 0;
  /** o que `comecarCombate` REALMENTE decidiu no ultimo ajuste de casa. Existe
   *  so para `conferirMesmoLugar()` ler o resultado de verdade em vez de
   *  recalcular a mesma formula por fora — testar a propria conta duas vezes
   *  nunca pega um erro na conta, so testa que ela concorda com ela mesma. */
  private ultimoAjuste?: { casa: Casa; alvoPx: { x: number; y: number } };
  /** o heroi nao guarda condicao dentro dele: `Heroi` e de sistemas/heroi.ts
   *  e nao deve saber o que e combate. A lista mora aqui, ao lado dos
   *  coracoes dele, que ja sao tratados do mesmo jeito. */
  private condicoesHeroi: Condicao[] = [];
  private condicoesHeroiUI!: Phaser.GameObjects.Container;
  private atributos: Record<Atributo, number> = { forca: 0, esperteza: 0, coracao: 0 };
  private topoDaBarra = 0;
  private alcancadas = new Map<string, { tx: number; ty: number; custo: number; de?: string }>();
  private largura = 0;
  private altura = 0;

  constructor() {
    super("Provador");
  }

  /** REGRA DURA (docs/plano-do-combate.md, secao 3.6): o combate nunca troca
   *  de cena, de mapa, nem de camera. So ajusta o heroi para o CENTRO da casa
   *  onde ele ja esta, no maximo meia casa em CADA EIXO (nunca a diagonal
   *  inteira: um canto de casa pode estar a mais de meia casa em linha reta
   *  do centro dela, mas nunca mais de meia casa na horizontal OU na vertical
   *  separadamente, porque o ajuste move x e y de forma independente).
   *
   *  Confere na hora, sem esperar nenhum tween: a garantia e GEOMETRICA (o
   *  alvo do ajuste e sempre o centro da propria casa onde o heroi ja estava,
   *  entao o limite vale em qualquer instante da animacao, nao so no final).
   *  De proposito nao depende do relogio do jogo — esperar tempo real por um
   *  tween e exatamente o tipo de teste que fica fragil quando a aba esta em
   *  segundo plano e o Phaser desacelera.
   *
   *  Roda no console: `jogo.scene.getScene("Provador").conferirMesmoLugar()`.
   *  So funciona fora de combate (senao nao ha combate novo pra comecar). */
  conferirMesmoLugar(): string {
    if (this.ordem.emCombate()) {
      return "FALHA  precisa comecar FORA de combate para conferir";
    }
    const camera = this.cameras.main as unknown as { _follow: unknown };
    const cenaAntes = this.scene.key;
    const tilemapAntes = this.chaoLayer.tilemap;
    const alvoAntes = camera._follow;
    const casaAntes = this.casaDoHeroi();
    const pxAntes = { x: this.heroi.x, y: this.heroi.y };

    this.comecarCombate();

    const r: string[] = [];
    const ok = (n: string, v: boolean) => r.push((v ? "OK   " : "FALHA") + "  " + n);
    ok("mesma cena", this.scene.key === cenaAntes);
    ok("mesmo objeto de tilemap (identidade, nao copia)", this.chaoLayer.tilemap === tilemapAntes);
    ok("camera continua seguindo o heroi", camera._follow === alvoAntes);

    // Le o que `comecarCombate` REALMENTE decidiu (this.ultimoAjuste), nunca
    // recalcula a mesma formula aqui do lado de fora. Duas contas iguais so
    // provam que elas concordam entre si, nao que o codigo de verdade fez a
    // coisa certa. E o mesmo motivo de nao esperar o tween rodar: ler
    // `this.heroi.x/y` logo depois de criar o tween sempre devolve o valor de
    // ANTES (Phaser so move a propriedade no proximo quadro), entao um teste
    // que comparasse isso taria sempre "igual" e nunca pegaria erro nenhum.
    const feito = this.ultimoAjuste;
    ok("comecarCombate registrou um ajuste", !!feito);
    if (feito) {
      ok("o ajuste mirou a MESMA casa em que o heroi ja estava",
        feito.casa.tx === casaAntes.tx && feito.casa.ty === casaAntes.ty);
      // TILE/2 no eixo X (o sprite e ancorado pelo CENTRO horizontal), mas
      // TILE inteiro no eixo Y (ancorado pelo PE, na base da casa — a mesma
      // convencao de centroDaCasa()/casaDe() usada no jogo inteiro). Um
      // limite unico de TILE/2 nos dois eixos pareceria mais limpo, mas
      // estaria errado: no eixo Y ele reprovaria ajustes legitimos.
      const dx = Math.abs(feito.alvoPx.x - pxAntes.x);
      const dy = Math.abs(feito.alvoPx.y - pxAntes.y);
      ok(`ajuste dentro da propria casa em X (dx=${dx.toFixed(1)}, limite=${TILE / 2})`, dx <= TILE / 2 + 0.5);
      ok(`ajuste dentro da propria casa em Y (dy=${dy.toFixed(1)}, limite=${TILE})`, dy <= TILE + 0.5);
    }
    return r.join("\n");
  }

  // ==================================================================== montar
  create() {
    this.bichos = [];
    this.slots = [];
    this.pipsMovimento = [];
    this.coracoesHUD = [];
    this.ordem = new Ordem();
    this.fase = "explorando";
    this.escolhida = undefined;
    this.rotaDoHeroi = [];
    this.coracoes = 3;
    this.condicoesHeroi = [];

    const ficha = { ...VAZIO.heroi, nome: "TROVAO" };
    // Os atributos saem da mesa: raca da +1, classe da +1. O elfo mago fica com
    // ESPERTEZA 2 e FORCA 0, e isso aparece na hora de rolar: ele e otimo de
    // magia e ruim de porrada, sem ninguem ter escrito essa regra em lugar nenhum.
    this.atributos = { forca: 0, esperteza: 0, coracao: 0 };
    this.atributos[acharRaca(ficha.raca).bonus] += 1;
    this.atributos[acharClasse(ficha.classe).bonus] += 1;

    criarAnimacoes(this, [
      ...camadasDoHeroi(ficha).map((c) => c.chave),
      ...ARENA.goblins.map((g) => g.sprite),
      ARENA.invisivel.sprite,
    ]);

    const dados = montarChao(ARENA.chao);
    const mapa = this.make.tilemap({ data: dados, tileWidth: TILE, tileHeight: TILE });
    const tiles = mapa.addTilesetImage("tileset")!;
    this.chaoLayer = mapa.createLayer(0, tiles, 0, 0)!;
    this.chaoLayer.setCollision(SOLIDOS);
    this.chaoLayer.setDepth(-1000);
    this.largura = ARENA.chao[0].length;
    this.altura = ARENA.chao.length;

    // duas camadas de desenho no chao: as casas alcancaveis por baixo, e o
    // alcance e a mira por cima delas. As duas abaixo dos personagens.
    this.pincelCasas = this.add.graphics().setDepth(-600);
    this.pincel = this.add.graphics().setDepth(-500);

    ARENA.arbustos.forEach((a, i) => this.porArbusto(`arbusto-${i}`, a.x, a.y));
    ARENA.goblins.forEach((g, i) =>
      this.porGoblin(`goblin-${i}`, g.sprite, g.nome, g.bonus, g.x, g.y, g.coracoes, false, g.comportamento));
    const inv = ARENA.invisivel;
    this.porGoblin("oculto", inv.sprite, inv.nome, inv.bonus, inv.x, inv.y, inv.coracoes, true, inv.comportamento);
    this.heroi = new Heroi(this, ...this.centroDaCasa(ARENA.entrada.x, ARENA.entrada.y), ficha);
    this.physics.add.collider(this.heroi, this.chaoLayer);

    this.cameras.main.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.cameras.main.startFollow(this.heroi, true, 0.14, 0.14);
    this.cameras.main.setBackgroundColor(COR.tinta);
    this.cameras.main.setRoundPixels(true);
    this.physics.world.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.heroi.body.setCollideWorldBounds(true);

    this.montarInterface();
    this.ligarEntrada();
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

  private porArbusto(id: string, tx: number, ty: number) {
    const [x, y] = this.centroDaCasa(tx, ty);
    const s = this.add.sprite(x, y, "obj-arbusto").setOrigin(0.5, 1).setDepth(y);
    this.bichos.push({
      id, nome: "ARBUSTO", retrato: -1, bonus: 0, comportamento: "passeia", jaAtacouDeSurpresa: false,
      sprite: s, tipo: "arbusto", coracoes: 1, coracoesMax: 1, invisivel: false, mostrarAte: 0, rota: [],
      condicoes: [],
    });
  }

  private porGoblin(
    id: string, chave: string, nome: string, bonus: number,
    tx: number, ty: number, coracoes: number, invisivel: boolean,
    comportamento: Comportamento
  ) {
    const [x, y] = this.centroDaCasa(tx, ty);
    const s = this.physics.add.sprite(x, y, chave, 0).setOrigin(0.5, 1);
    s.setDepth(y);
    s.play(`${chave}-parado-baixo`, true);
    s.body.setSize(10, 6).setOffset(3, 26);
    if (invisivel) s.setAlpha(0);
    this.bichos.push({
      id, nome, bonus, retrato: ICONE.retrato[chave.replace("goblin-", "")] ?? 1,
      comportamento, jaAtacouDeSurpresa: false,
      sprite: s, corpo: s.body as Phaser.Physics.Arcade.Body, tipo: "goblin",
      coracoes, coracoesMax: coracoes, invisivel, mostrarAte: 0, rota: [],
      condicoes: [],
    });
  }

  // ================================================================ interface
  private montarInterface() {
    const fixo = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      (o as unknown as { setScrollFactor: (n: number) => void }).setScrollFactor(0);
      (o as unknown as { setDepth: (n: number) => void }).setDepth(1000);
      return o;
    };

    // O topo cresceu de 16 para 22px porque agora ele carrega os RETRATOS da
    // ordem de turno, e retrato de 12px nao se reconhece. Espaco de tela e o
    // preco de saber de quem e a vez sem ter que ler nada.
    fixo(this.add.nineslice(2, 1, "painel-escuro", undefined, LARGURA - 4, 22, 8, 8, 8, 8).setOrigin(0));
    for (let i = 0; i < 3; i++) {
      this.coracoesHUD.push(fixo(this.add.image(11 + i * 11, 12, "ui", 0)));
    }
    this.trilhaIniciativa = fixo(this.add.container(48, 2));

    // A fileira de condicoes do heroi vive ABAIXO da barra de topo, nao
    // dentro dela: os coracoes (16px de imagem) ja quase preenchem os 22px
    // de altura da barra sozinhos, e a trilha de retratos ocupa o resto.
    // Nao ha 8px sobrando ali para mais uma fileira de icones sem empilhar
    // em cima de alguma coisa — e e exatamente isso que o auditor de UI
    // existe para pegar. Uma faixa propria, so visivel quando ha condicao
    // ativa, resolve sem disputar espaco com nada que ja existe.
    this.condicoesHeroiUI = fixo(this.add.container(6, 26)).setVisible(false);

    // ------------------------------------------------------- a barra
    // Sem disco: por turnos ninguem anda com direcional, anda tocando a casa.
    // Isso devolve o canto esquerdo inteiro para a barra, e e um ganho real da
    // virada para turnos, nao um atalho do provador.
    const area = { x: 6, y: ALTURA - SLOT - 2, largura: LARGURA - 56, altura: SLOT };
    const linha = fileira(area, SLOT, GAP);
    const cabem = Math.min(linha.cabem(), ACOES_DE_PROVA.length);
    this.topoDaBarra = area.y - 14;

    // a bandeja, que faz os slots virarem UM objeto em vez de seis
    fixo(this.add.nineslice(area.x - 2, area.y - 2, "painel-escuro", undefined,
      cabem * (SLOT + GAP) - GAP + 4, SLOT + 4, 8, 8, 8, 8).setOrigin(0).setAlpha(0.85));

    for (let i = 0; i < cabem; i++) {
      const acao = ACOES_DE_PROVA[i];
      const r = linha.reservar();
      const fundo = fixo(this.add.nineslice(r.x, r.y, "painel-creme", undefined, SLOT, SLOT, 8, 8, 8, 8).setOrigin(0));
      const icone = fixo(this.add.image(r.x + SLOT / 2, r.y + SLOT / 2 + 1, "icones", acao.icone));
      // borda de 2px: em 1px a cor do tipo some na tela do iPad
      const borda = fixo(this.add.graphics());
      borda.lineStyle(2, acao.cor, 1).strokeRect(r.x + 1, r.y + 1, SLOT - 2, SLOT - 2);
      const marca = fixo(this.add.graphics());
      // o numero de atalho: a unica coisa que ensina o teclado sem tutorial
      const numero = fixo(texto(this, r.x + 2, r.y + 1, String(i + 1), { cor: 0x2c2440 }));

      const alvo = fixo(this.add.rectangle(r.x + SLOT / 2, r.y + SLOT / 2, SLOT + 2, SLOT + 6, 0x000000, 0)
        .setInteractive({ useHandCursor: true }));
      alvo.on("pointerdown", () => this.escolher(acao));
      // hover: no mouse aparece ao passar, no toque aparece ao encostar. As duas
      // entradas usam o mesmo caminho, entao a dica nunca existe so no desktop.
      alvo.on("pointerover", () => this.mostrarDica(acao, r.x + SLOT / 2));
      alvo.on("pointerout", () => this.esconderDica());
      this.slots.push({ acao, fundo, icone, borda, marca, numero, x: r.x, y: r.y, livreNaRodada: 0, gastou: false });
    }

    // pips de movimento, logo acima da barra
    for (let i = 0; i < MOVIMENTO.heroi; i++) {
      this.pipsMovimento.push(fixo(this.add.graphics()));
    }

    // ------------------------------------------------- passar a vez
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

    // a dica de hover, acima do nome da acao escolhida
    this.dicaChapa = this.add.nineslice(0, 0, "painel-creme", undefined, 8, 24, 8, 8, 8, 8).setOrigin(0.5, 1);
    this.dicaTexto = texto(this, 0, -20, "", { cor: 0x2c2440, ancora: 0.5 });
    this.dicaCaixa = fixo(this.add.container(LARGURA / 2, this.topoDaBarra - 4, [this.dicaChapa, this.dicaTexto]));
    this.dicaCaixa.setVisible(false).setDepth(1100);

    this.chapaAviso = fixo(this.add.nineslice(LARGURA / 2, 28, "painel-ouro", undefined, 8, 16, 8, 8, 8, 8).setOrigin(0.5, 0));
    this.chapaAviso.setVisible(false).setDepth(1200);
    this.aviso = fixo(texto(this, LARGURA / 2, 32, "", { cor: 0x2c2440, ancora: 0.5 }));
    this.aviso.setDepth(1201);
  }

  /** O que a acao faz, em duas linhas, ao encostar no slot.
   *
   *  Seis icones sem texto ensinam a forma, nunca a regra: nada no desenho conta
   *  que a Voz de Trovao pega todo mundo em volta e volta so daqui a tres
   *  turnos. A dica e onde a regra cabe sem poluir a barra. */
  private mostrarDica(a: AcaoDeProva, xSlot: number) {
    const linha2 =
      a.forma === "aoRedor" ? `PEGA ${a.alcance} CASAS EM VOLTA`
      : a.forma === "linha" ? `LINHA DE ${a.alcance} CASAS`
      : `ALCANCE ${a.alcance} ${a.alcance === 1 ? "CASA" : "CASAS"}`;
    const linha3 = a.usosPorCombate ? "UMA VEZ POR LUTA"
      : a.espera > 0 ? `VOLTA EM ${a.espera} TURNOS`
      : "TODO TURNO";
    const linhas = [a.nome, linha2, linha3];
    // a chapa e medida a partir do texto, nao chutada: com altura fixa a
    // ultima linha ficava cortada pela borda de baixo
    const ENTRE = 2;
    const alturaTexto = linhas.length * (10 + ENTRE) - ENTRE;
    const altura = alturaTexto + 10;
    const largura = Math.max(...linhas.map((l) => l.length)) * 8 + 12;
    this.dicaTexto.setText(linhas.join("\n"));
    this.dicaTexto.setLineSpacing(ENTRE);
    this.dicaTexto.setY(-altura + 5);
    this.dicaChapa.setSize(largura, altura);
    // presa dentro da tela: a dica do primeiro slot nao pode vazar pela esquerda
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

  /** Aviso grande e curto no alto: COMBATE, SUA VEZ, ACABOU. */
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
      if (e.key === "r" || e.key === "R") return this.scene.restart();
      if (e.key === " " || e.key === "Enter") return this.passarAVez();
      const n = Number(e.key);
      if (n >= 1 && n <= this.slots.length) this.escolher(this.slots[n - 1].acao);
    });
  }

  // ================================================================== combate
  private goblins(): Bicho[] {
    return this.bichos.filter((b) => b.tipo === "goblin" && !b.invisivel);
  }

  private d6 = () => Phaser.Math.Between(1, 6);

  private comecarCombate() {
    const lutadores = this.goblins();
    if (lutadores.length === 0) return;
    // Sai de "explorando" NA HORA. Sem isto, o update continua chamando este
    // metodo a cada quadro ate o primeiro turno entrar, e a iniciativa e
    // re-rolada dezenas de vezes: a ordem muda sozinha na frente do jogador.
    this.fase = "vezDaCriatura";
    this.ordem.comecar([
      { id: "heroi", iniciativa: this.d6() + this.atributos.esperteza, movimentoMax: MOVIMENTO.heroi },
      ...lutadores.map((g) => ({ id: g.id, iniciativa: this.d6(), movimentoMax: MOVIMENTO.goblin })),
    ]);
    // O heroi anda solto fora de combate, entao quando a luta comeca ele quase
    // sempre esta no meio de uma casa. Sem isto, o primeiro passo do turno o
    // jogava para o centro da casa de uma vez, e parecia teleporte. Agora ele
    // se ajeita na casa, a vista, antes de a ordem comecar.
    const minha = this.casaDoHeroi();
    const [ax, ay] = this.centroDaCasa(minha.tx, minha.ty);
    this.ultimoAjuste = { casa: minha, alvoPx: { x: ax, y: ay } };
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
      // as condicoes do heroi tambem contam para baixo no INICIO do turno
      // dele, igual a qualquer criatura — a mesma funcao dos dois lados.
      const { restantes, efeitos } = passarTurno(this.condicoesHeroi);
      this.condicoesHeroi = restantes;
      this.sincronizarCondicoesUI(this.condicoesHeroi, this.condicoesHeroiUI, false);
      if (efeitos.some((e) => e.tipo === "pulaTurno")) {
        this.anunciar("CONGELADO!", 700);
        this.fase = "vezDaCriatura"; // reusa o mesmo "ninguem pode agir agora"
        this.time.delayedCall(500, () => { this.ordem.passar(); this.entrarNoTurno(); });
        return;
      }
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
    this.fase = "explorando";
    this.botaoPassar.setVisible(false);
    this.pincelCasas.clear();
    this.pincel.clear();
    this.dizer("");
    this.desenharIniciativa();
    this.anunciar("ACABOU!");
    this.slots.forEach((s) => { s.gastou = false; s.livreNaRodada = 0; });
  }

  /** A vez da criatura: cada uma decide o que QUER fazer (sistemas/criatura.ts)
   *  antes de se mexer. So o goblin ATACANDO rola dado — passear ou fugir nao
   *  precisa de sorte nenhuma. Ela nunca rola contra o heroi na mesa, mas aqui
   *  a rolagem e sempre DELA MESMA: ver a nota grande abaixo, em atacarAgora. */
  private jogarCriatura(id: string) {
    const b = this.bichos.find((x) => x.id === id);
    if (!b) { this.ordem.remover(id); return this.entrarNoTurno(); }

    // as condicoes dela contam para baixo no INICIO do turno dela, mesma
    // funcao que o heroi usa. Se ainda estiver CONGELADA, o turno acaba aqui,
    // sem ela decidir nada.
    const { restantes, efeitos } = passarTurno(b.condicoes);
    b.condicoes = restantes;
    this.atualizarCondicoesDoBicho(b);
    if (efeitos.some((e) => e.tipo === "pulaTurno")) {
      this.time.delayedCall(400, () => { this.ordem.passar(); this.entrarNoTurno(); });
      return;
    }

    const distanciaAgora = distanciaEmCasas(this.casaDoBicho(b), this.casaDoHeroi());
    // "passeia vira curioso por reflexo": uma vez que notou o heroi de perto,
    // NUNCA mais volta a ignorar, mesmo se o heroi se afastar de novo depois.
    if (b.comportamento === "passeia" && distanciaAgora <= 1) b.comportamento = "curioso";
    // o susto de "medroso" so vale enquanto colado. Longe, ele esquece e
    // pode assustar de novo da proxima vez que for pego de surpresa.
    if (distanciaAgora > 1) b.jaAtacouDeSurpresa = false;

    const intencao = decidirAcaoDaCriatura(
      b.comportamento, distanciaAgora, b.coracoes, b.coracoesMax, b.jaAtacouDeSurpresa
    );

    if (intencao === "atacar") return this.atacarAgora(b);
    if (intencao === "esperar") {
      // passeia, longe do heroi: nao vale a pena gastar o turno se mexendo
      // para um combate que nem comecou pra ela.
      this.time.delayedCall(220, () => { this.ordem.passar(); this.entrarNoTurno(); });
      return;
    }

    // avancar ou fugir usam a MESMA busca de casas, so invertendo o criterio
    // de qual e a "melhor": chegar perto, ou ficar o mais longe possivel.
    const fugindo = intencao === "fugir";
    const alvo = this.casaDoHeroi();
    const achadas = alcancaveis(this.casaDoBicho(b), MOVIMENTO.goblin, (tx, ty) => this.passavel(tx, ty, b));
    let melhor: Casa | undefined;
    let melhorDist = fugindo ? -Infinity : Infinity;
    achadas.forEach((c) => {
      const d = distanciaEmCasas(c, alvo);
      const vence = fugindo ? d > melhorDist : d < melhorDist;
      if (vence) { melhorDist = d; melhor = { tx: c.tx, ty: c.ty }; }
    });
    b.rota = melhor ? caminho(achadas, melhor) : [];
    this.mostrarPips(b);

    const depoisDeAndar = () => {
      // so quem estava avancando pode terminar colado e brigar no mesmo
      // turno; quem estava fugindo so quer distancia, nunca vira ataque.
      if (!fugindo && distanciaEmCasas(this.casaDoBicho(b), this.casaDoHeroi()) <= 1) {
        return this.atacarAgora(b);
      }
      this.time.delayedCall(220, () => { this.ordem.passar(); this.entrarNoTurno(); });
    };

    if (b.rota.length === 0) return depoisDeAndar();
    b.sprite.setData("aoChegar", depoisDeAndar);
  }

  /** O `!` de aviso: nasce pequeno, estica um pouco alem do tamanho (0.2 a
   *  mais), segura, e sai com fade. 500ms no total, o mesmo numero que
   *  docs/interface-de-combate.md ja fixou para o telegrafo inteiro.
   *
   *  Se outra criatura ja esta telegrafando perto (cabecas a menos de 20px na
   *  tela), o segundo `!` sobe mais um pouco: dois avisos empilhados na mesma
   *  altura viram um borrao so, e o jogador precisa saber que sao DOIS
   *  golpes vindo, nao um. */
  private telegrafar(b: Bicho) {
    const perto = this.bichos.some(
      (o) => o !== b && o.sprite.getData("telegrafando") &&
        Phaser.Math.Distance.Between(o.sprite.x, o.sprite.y, b.sprite.x, b.sprite.y) < 20
    );
    b.sprite.setData("telegrafando", true);
    const y = b.sprite.y - (perto ? 52 : 40);
    const grito = texto(this, b.sprite.x, y, "!", { cor: 0xf5b62b, ancora: 0.5 });
    grito.setDepth(2000).setScale(0);
    this.tweens.add({
      targets: grito, scale: 1.2, duration: 140, ease: "Back.easeOut",
      onComplete: () => this.tweens.add({
        targets: grito, scale: 1, duration: 60,
      }),
    });
    this.time.delayedCall(400, () =>
      this.tweens.add({ targets: grito, alpha: 0, duration: 100, onComplete: () => grito.destroy() })
    );
    this.tweens.add({ targets: b.sprite, scaleY: 0.85, scaleX: 1.15, duration: 160, yoyo: true });
    tocarFicha(CRIATURAS_SOM.pequeno.reage);
    this.time.delayedCall(500, () => b.sprite.setData("telegrafando", false));
  }

  /** O telegrafo, a rolagem, e o golpe. Meio segundo de aviso antes de todo
   *  golpe: sem isso, apanhar vira "o jogo me sacaneou" em vez de "eu errei". */
  private atacarAgora(b: Bicho) {
    b.jaAtacouDeSurpresa = true;
    this.telegrafar(b);
    this.time.delayedCall(500, () => {
      // A CRIATURA TAMBEM ROLA. O material de mesa dizia que so o heroi
      // rola, porque na mesa quem narra o monstro e uma pessoa. No
      // videogame o computador rola de qualquer jeito, e escondendo isso o
      // golpe do goblin vira arbitrario: apanhar sem ver por que e o que
      // faz o jogador achar que o jogo trapaceia. Mesmo dado, mesma tabela
      // de tres faixas, mesmo cartao na tela, os dois lados.
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
  }

  private heroiApanha(cheio = true) {
    tocarFicha(IMPACTOS.bicho);
    // o pisca-pisca roda sempre, mesmo durante a invencibilidade: e o "quase
    // levei" que avisa o jogador que o golpe chegou perto, sem custar coracao.
    // 4 repeticoes de 90ms de ida e volta = 900ms, o numero que
    // docs/interface-de-combate.md ja fixou para a invencibilidade inteira.
    fx.piscar(this, this.heroi, 90, 4);
    if (this.time.now < this.invencivelAte) return;
    this.invencivelAte = this.time.now + 900;

    this.cameras.main.shake(cheio ? 140 : 90, cheio ? 0.005 : 0.003);
    // o quadro `machucado` nao existe na folha ainda (so `conjura` serve pra
    // tudo). Ate a Fase 6 desenhar o de verdade, um squash vende 70% do
    // "levei um soco" so com escala, sem sprite novo.
    fx.achatar(this, this.heroi, 1.15, 0.8, 90);
    this.coracoes = Math.max(0, this.coracoes - 1);
    this.atualizarCoracoes();
    if (this.coracoes > 0) return;
    // Nunca existe derrota: fica tonto, e volta com um coracao.
    this.heroi.ficarTonto(1200);
    this.anunciar("QUE TONTEIRA!", 900);
    this.time.delayedCall(1200, () => { this.coracoes = 1; this.atualizarCoracoes(); });
  }

  private atualizarCoracoes() {
    this.coracoesHUD.forEach((c, i) => c.setFrame(i < this.coracoes ? 0 : 1));
  }

  /** Redesenha uma fileira de condicoes num container ja existente: ate 3
   *  quadradinhos de 8x8 na cor de cada uma (docs/mundo-que-reage.md, secao 8:
   *  "cor tem que querer dizer alguma coisa" — aqui a cor e emprestada da
   *  acao que mais aplica aquela condicao, o azul do Bafo Gelado por
   *  exemplo), e um "+N" se sobrar mais do que isso.
   *
   *  Simplificacao desta fase: a fileira INTEIRA entra com popIn e sai com
   *  fade, nao icone por icone. Diferenciar "este e novo, aquele so mudou de
   *  posicao" exigiria comparar a lista antiga com a nova a cada chamada, e
   *  nesta fase (no maximo 1 ou 2 condicoes por vez) o ganho nao paga a
   *  complicacao. Fica registrado para quando isso deixar de ser verdade. */
  private sincronizarCondicoesUI(
    lista: Condicao[],
    container: Phaser.GameObjects.Container,
    /** heroi (na HUD) alinha a esquerda; criatura (sobre a cabeca) centraliza
     *  na propria casa, senao a fileira empurra pra um lado toda vez que o
     *  numero de condicoes muda. */
    centralizar: boolean
  ) {
    container.removeAll(true);
    if (lista.length === 0) {
      container.setVisible(false);
      return;
    }
    const MAX = 3;
    const visiveis = lista.slice(0, MAX);
    const temMais = lista.length > MAX;
    const larguraTotal = visiveis.length * 10 - 2 + (temMais ? 14 : 0);
    const inicioX = centralizar ? -larguraTotal / 2 : 0;
    visiveis.forEach((cond, i) => {
      const ficha = condicoesDados(cond.id);
      const x = inicioX + i * 10;
      const fundo = this.add.rectangle(x, 0, 8, 8, ficha.cor, 1).setOrigin(0);
      const borda = this.add.rectangle(x, 0, 8, 8).setOrigin(0).setStrokeStyle(1, 0x2c2440, 0.8);
      container.add([fundo, borda]);
    });
    if (temMais) {
      container.add(texto(this, inicioX + visiveis.length * 10 + 1, 0, `+${lista.length - MAX}`, { cor: 0xfff8ea }));
    }
    container.setVisible(true);
    fx.popIn(this, container, 140, 0.6);
  }

  // ==================================================================== a vez
  /** Da para PARAR nesta casa? Fora do mapa, agua, pedra e casa ocupada, nao. */
  private passavel(tx: number, ty: number, quem?: Bicho): boolean {
    if (tx < 0 || ty < 0 || tx >= this.largura || ty >= this.altura) return false;
    const tile = this.chaoLayer.getTileAt(tx, ty);
    if (!tile || (SOLIDOS as readonly number[]).includes(tile.index)) return false;
    const ocupada = this.bichos.some(
      (b) => b !== quem && !b.invisivel && b.tipo !== "arbusto" && this.mesmaCasa(this.casaDoBicho(b), tx, ty)
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

  /** As casas alcancaveis, pintadas uma a uma.
   *
   *  Um anel de raio mentiria: ele acenderia o outro lado do rio, onde o heroi
   *  nao chega. Pintando casa a casa, o que acende e exatamente onde da para
   *  pisar, e da para CONTAR com o olho antes de gastar o turno. */
  private desenharCasas() {
    this.pincelCasas.clear();
    if (this.fase !== "meuTurno") return;
    this.alcancadas.forEach((c) => {
      if (c.custo === 0) return;
      this.pincelCasas.fillStyle(0x7ec4f2, 0.18).fillRect(c.tx * TILE + 1, c.ty * TILE + 1, TILE - 2, TILE - 2);
      this.pincelCasas.lineStyle(1, 0x7ec4f2, 0.32).strokeRect(c.tx * TILE + 1.5, c.ty * TILE + 1.5, TILE - 3, TILE - 3);
    });
  }

  private escolher(acao: AcaoDeProva) {
    if (this.fase !== "meuTurno" && this.fase !== "mirando") return;
    const vez = this.ordem.agora();
    const slot = this.slots.find((s) => s.acao.id === acao.id)!;
    const emEspera = this.ordem.rodada() < slot.livreNaRodada;
    if (slot.gastou || emEspera || vez?.acaoUsada) {
      tocar("menu-volta", { volume: 0.4 });
      fx.tremerLeve(this, [slot.fundo, slot.icone]);
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
    if (this.fase === "explorando") {
      const casa = this.casaDe(x, y);
      if (this.passavel(casa.tx, casa.ty)) {
        const achadas = alcancaveis(this.casaDoHeroi(), 40, (tx, ty) => this.passavel(tx, ty));
        this.rotaDoHeroi = caminho(achadas, casa);
      }
      return;
    }
    if (this.fase === "mirando" && this.escolhida) {
      const casa = this.casaDe(x, y);
      if (distanciaEmCasas(this.casaDoHeroi(), casa) > this.escolhida.alcance) {
        // fora de alcance nao recusa em silencio: avisa e continua mirando
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
  private executar(acao: AcaoDeProva, casa: Casa) {
    this.fase = "resolvendo";
    this.escolhida = undefined;
    this.pincel.clear();
    this.heroi.parar();
    this.heroi.conjurar(300);
    // o agachar antes de agir: 90ms, quase imperceptivel sozinho, mas sem ele
    // o efeito sai "do nada". Numeros de docs/interface-de-combate.md 4.2.
    fx.agachar(this, this.heroi);
    if (acao.tipo === "magia") {
      fx.ondaDeConjuracao(this, this.heroi.x, this.heroi.y, acao.cor);
    }
    // golpe ou magia de longe (forma "casa", alcance > 1 casa): uma bolinha
    // viaja ate o alvo antes do impacto, senao o efeito nasce do nada em cima
    // dele. Alcance 1 e corpo a corpo, nao precisa de projetil nenhum.
    if (acao.forma === "casa" && acao.alcance > 1) {
      const [px, py] = this.centroDaCasa(casa.tx, casa.ty);
      fx.projetil(this, this.heroi.x, this.heroi.y - 8, px, py - 8, acao.cor);
    }

    const slot = this.slots.find((s) => s.acao.id === acao.id)!;
    if (acao.usosPorCombate) slot.gastou = true;
    if (acao.espera > 0) slot.livreNaRodada = this.ordem.rodada() + acao.espera;
    this.ordem.gastarAcao();

    if (acao.som === "cajado") tocarFicha(ARMAS.cajado.golpe);
    else if (acao.som === "fogo") tocarFicha(MAGIAS_SOM.fogo);
    else if (acao.som === "gelo") tocarFicha(MAGIAS_SOM.gelo);
    else if (acao.som === "voz") tocarFicha(MAGIAS_SOM.voz);

    // A rolagem, e ela e o coracao do modelo: **so o heroi rola**.
    const bonus = this.atributos[acao.atributo];
    const { dado, total } = rolar(bonus, this.d6);
    const faixa = faixaDoDado(total);
    tocarFicha(DADO.rola);
    const [cx, cy] = this.centroDaCasa(casa.tx, casa.ty);
    this.mostrarDado(dado, bonus, faixa, cx, cy - 24);

    this.time.delayedCall(420, () => {
      tocarFicha(DESFECHO[faixa]);
      const pegos = this.pegos(acao, casa);
      if (faixa === "ops" || pegos.length === 0) {
        this.poeira(cx, cy - 8);
        tocarFicha(IMPACTOS.errou);
      } else {
        // QUASE acerta mas sem o extra; OBA acerta com recuo e estrelinha
        pegos.forEach((b) => this.atingir(b, cx, cy, faixa === "oba"));
        // a marca da acao, se ela tiver uma: gelo em quem esta molhado
        // congela na hora. Ver src/sistemas/marcas.ts para a tabela inteira.
        if (acao.marca) {
          pegos.forEach((b) => {
            const r = aplicarMarca(acao.marca!, b.condicoes);
            b.condicoes = r.condicoesNovas;
            this.atualizarCondicoesDoBicho(b);
            if (r.efeitoEspecial === "congelou") {
              fx.flashBranco(this, b.sprite, 120);
              this.anunciar("CONGELOU!", 600);
            }
          });
        }
        this.cameras.main.shake(90, 0.0022);
        fx.hitstop(this, faixa === "oba" ? 90 : 70);
      }
      this.time.delayedCall(500, () => this.fimDaAcao());
    });
  }

  private fimDaAcao() {
    this.dizer("");
    if (this.ordem.acabou()) {
      this.ordem.passar();
      return this.entrarNoTurno();
    }
    this.fase = "meuTurno";
    this.calcularAlcance();
  }

  /** O cartao da rolagem. E O MESMO para o heroi e para a criatura, de proposito:
   *  um cartao so e uma regra so para aprender, e o jogador ve que os dois lados
   *  correm o mesmo risco. Mostra a FACE do dado desenhada, o que foi somado, e a
   *  palavra da faixa. Nenhuma conta para o jogador fazer. */
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
    // sobe e some: cartao que fica parado vira lixo na tela em duas rodadas
    fx.sumirParaCima(this, caixa, 10, 320, 640);
  }

  private pegos(acao: AcaoDeProva, casa: Casa): Bicho[] {
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
    // O primeiro golpe num invisivel SO REVELA. Com revelar e machucar no mesmo
    // golpe, um bicho de poucos coracoes aparece e desiste no mesmo quadro, e a
    // descoberta, que era o premio de ter batido no vazio, passa despercebida.
    if (b.invisivel) {
      b.invisivel = false;
      b.sprite.setAlpha(1);
      tocarFicha(CRIATURAS_SOM.pequeno.nota);
      fx.pulso(this, b.sprite, 1.25, 90);
      this.anunciar("TINHA ALGUEM AI!", 800);
      return;
    }
    tocarFicha(b.tipo === "arbusto" ? IMPACTOS.madeira : IMPACTOS.bicho);
    fx.flashBranco(this, b.sprite);
    fx.achatar(this, b.sprite, 1, 0.8);
    if (cheio && b.corpo) {
      fx.empurrar(this, b.corpo, dex, dey, b.sprite.x, b.sprite.y);
    }
    b.coracoes -= 1;
    this.mostrarPips(b);
    if (b.coracoes <= 0) this.desistir(b);
  }

  private desistir(b: Bicho) {
    this.bichos = this.bichos.filter((o) => o !== b);
    b.corpo?.setVelocity(0, 0);
    b.pips?.destroy();
    b.condicoesUI?.destroy();
    if (b.tipo === "goblin") tocarFicha(CRIATURAS_SOM.pequeno.desiste);
    this.ordem.remover(b.id);
    fx.confete(this, b.sprite.x, b.sprite.y - 16, 0xf5b62b);
    // o goblin gira ao desistir, o arbusto so desmancha reto
    fx.sumirParaCima(this, b.sprite, 10, 380, 0, {
      angle: b.tipo === "goblin" ? 220 : 0,
    });
    if (this.ordem.emCombate() && this.goblins().length === 0) this.time.delayedCall(420, () => this.acabarCombate());
  }

  private poeira(x: number, y: number) {
    fx.estourinho(this, x, y, 0xfdefd6);
  }

  // ===================================================== vida sobre a cabeca
  /** Coracao, nao barra: a lingua e a mesma do material impresso. E eles somem
   *  sozinhos, porque medidor sempre aceso rouba a atencao da propria luta. */
  /** Cria o container de condicoes do bicho na primeira vez que ele precisa,
   *  e redesenha. Chamar sempre que `b.condicoes` mudar (aplicou uma nova,
   *  ou uma expirou no inicio do turno dela). */
  private atualizarCondicoesDoBicho(b: Bicho) {
    if (!b.condicoesUI) {
      b.condicoesUI = this.add.container(b.sprite.x, b.sprite.y - 28).setDepth(2000);
    }
    this.sincronizarCondicoesUI(b.condicoes, b.condicoesUI, true);
  }

  private mostrarPips(b: Bicho) {
    if (b.tipo === "arbusto") return;
    b.mostrarAte = this.time.now + 3000;
    b.pips?.destroy();
    const g = this.add.graphics();
    const largura = b.coracoesMax * 6 - 2;
    // Fundo escuro atras dos coracoes. Vermelho sobre goblin verde nao se ve, e
    // o fundo por tras de um pip muda a cada passo que a criatura da. Mesma
    // licao dos pips de movimento: elemento de estado precisa de fundo proprio.
    g.fillStyle(0x2c2440, 0.8).fillRect(-largura / 2 - 2, -2, largura + 4, 9);
    for (let i = 0; i < b.coracoesMax; i++) {
      const x = -largura / 2 + i * 6;
      if (i < b.coracoes) g.fillStyle(0xe2483d, 1).fillRect(x, 0, 5, 5);
      else g.lineStyle(1, 0xfff8ea, 0.55).strokeRect(x + 0.5, 0.5, 4, 4);
    }
    b.pips = this.add.container(b.sprite.x, b.sprite.y - 36, [g]).setDepth(2000);
    fx.popIn(this, b.pips);
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
    if (this.fase === "explorando") this.talvezComecarCombate();
  }

  private talvezComecarCombate() {
    if (this.ordem.emCombate()) return;
    const eu = this.casaDoHeroi();
    const perto = this.goblins().some((g) => distanciaEmCasas(this.casaDoBicho(g), eu) <= DISTANCIA_QUE_NOTA);
    if (perto) {
      this.rotaDoHeroi = [];
      this.heroi.mover(0, 0);
      this.comecarCombate();
    }
  }

  private andarRota() {
    if (this.rotaDoHeroi.length === 0) {
      if (this.fase === "andando") {
        this.heroi.mover(0, 0);
        this.fase = "meuTurno";
        this.calcularAlcance();
      } else if (this.fase === "explorando") {
        this.heroi.mover(0, 0);
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

  /** O alcance da acao, como ELIPSE no PE do heroi.
   *
   *  Circulo perfeito no meio do corpo le como bolha flutuando. O jogo e visto
   *  de tres quartos: marca no chao e elipse, e nasce onde o pe encosta. */
  private desenharMira() {
    this.pincel.clear();
    if (this.fase !== "mirando" || !this.escolhida) return;
    const a = this.escolhida;
    const raio = a.alcance * TILE;
    const respiro = 1 + Math.sin(this.time.now / 400) * 0.015;
    this.pincel.lineStyle(1, a.cor, 0.75);
    // pontilhada: anel continuo le como parede, e o alcance nao e parede
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
      if (b.invisivel) return;
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
      // espera em TURNOS, contada em pontinhos. Nada de numero, nada de relogio.
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

  /** Os pips de movimento moram no TOPO, sobre o painel escuro, e sao AZUIS.
   *
   *  Nasceram verdes logo acima da barra, e ali nao se viam: verde sobre grama
   *  verde, com o mundo passando por tras e mudando de cor o tempo todo. Duas
   *  licoes que valem para a barra inteira depois: elemento de estado precisa de
   *  fundo proprio, e a cor precisa querer dizer alguma coisa. Aqui **azul e
   *  movimento**, e e o mesmo azul das casas alcancaveis pintadas no chao. */
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
      if (b.pips) {
        b.pips.setPosition(b.sprite.x, b.sprite.y - 36);
        if (agora > b.mostrarAte && b.pips.alpha > 0) {
          b.pips.setAlpha(Math.max(0, b.pips.alpha - 0.04));
        }
      }
      // a fileira de condicoes fica logo ABAIXO dos coracoes (mais perto da
      // cabeca), e ao contrario dos coracoes nao desbota sozinha: ela some
      // quando a condicao expira de verdade, nunca por tempo de tela.
      if (b.condicoesUI) b.condicoesUI.setPosition(b.sprite.x, b.sprite.y - 28);
    });
  }

  /** A trilha de iniciativa: o RETRATO de quem joga agora e de quem vem depois.
   *
   *  Nasceu como cinco retangulos coloridos e nao dizia nada: cinco verdes
   *  iguais nao contam qual goblin e o proximo, nem se o proximo e voce. Retrato
   *  e a menor coisa que responde as duas perguntas de uma vez. */
  private desenharIniciativa() {
    this.trilhaIniciativa.removeAll(true);
    if (!this.ordem.emCombate()) return;
    this.ordem.todos().forEach((v, i) => {
      const atual = i === this.ordem.indiceAtual();
      const x = i * 19;
      const quadro = v.id === "heroi"
        ? ICONE.retratoHeroi
        : this.bichos.find((b) => b.id === v.id)?.retrato ?? 1;
      // moldura: ouro em quem esta jogando, escura em quem espera
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
