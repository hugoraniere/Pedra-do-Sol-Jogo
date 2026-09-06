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
import { ALTURA, COR, LARGURA, SOLIDOS, TILE, escalaDoSprite, direcaoDe } from "../dados/config";
import { acharCriatura, spriteDoGoblin, type Comportamento as ComportamentoNarrativo } from "../dados/conteudo";
import { ICONE, MOVIMENTO, movimentoDaCriatura } from "../dados/provador";
import { ARMAS, CRIATURAS_SOM, DADO, DESFECHO, FAMILIA_DA_CRIATURA, IMPACTOS, MAGIAS_SOM } from "../dados/sons";
import { testar, foiSucesso, type Desfecho, type ResultadoDeTeste } from "../sistemas/teste";
import { alcancaveis, caminho, chaveDaCasa, distanciaEmCasas, type Alcancada, type Casa } from "../sistemas/alcance";
import { decidirAcaoDaCriatura, type Comportamento } from "../sistemas/criatura";
import { acoesDoHeroi, type AcaoDeHeroi } from "../sistemas/acao";
import { criarAnimacoes, camadasDoHeroi, Heroi } from "../sistemas/heroi";
import { montarHudDeAcao, type HudDeAcao } from "../sistemas/hudDeAcao";
import { itemRapidoAtual } from "../sistemas/consumiveis";
import { agachar, estourinho, hitstop, ondaDeConjuracao, piscar, popIn, projetil, projetilOrientado, textoFlutuante } from "../sistemas/fx";
import {
  aplicarDerrota, estado, guardar, marcarDerrotado, registrarUso, salvar, usosGastos, ganharSelo,
} from "../sistemas/estado";
import { HOSPITAL_ENTRADA, VILA } from "../dados/mapas";
import { poderesDoHeroi } from "../sistemas/poderes";
import { algumMoodleCritico, nivelDoMoodle } from "../sistemas/moodles";
import type { Atributo } from "../dados/conteudo";
import { tocar, tocarFicha } from "../sistemas/som";
import { texto } from "../sistemas/texto";
import { periodoAtual } from "../sistemas/tempo";
import type { Periodo } from "../dados/tempo";
import { Ordem } from "../sistemas/turnos";
import { aplicarMarca, type Condicao, type Marca } from "../sistemas/marcas";
import { rolarDado, dobrar } from "../sistemas/dado";
import { tem } from "../sistemas/condicoes";
import { condicoesDados } from "../dados/condicoes-dados";
import { definirPreferencia, preferencias } from "../sistemas/preferencias";
import { refazerAoRedimensionar } from "../sistemas/visao";
import type { Mundo } from "./Mundo";


/** Traduz o `comportamento` narrativo do bestiario (7 palavras, `conteudo.ts`)
 *  para o modelo mecanico de 3 que `decidirAcaoDaCriatura` sabe jogar
 *  (`sistemas/criatura.ts`, testado em `npm run criatura`). So goblin
 *  (`"foge"`), aranha (`"ronda"`) e lobo-nevoa (`"espreita"`) tem instancia
 *  de verdade num mapa hoje -- as outras 4 palavras ficam aproximadas ate a
 *  criatura dona ganhar mapa de verdade, e o ajuste fino e so trocar a linha
 *  certa aqui, sem mexer no motor de IA. */
function comportamentoDeCombate(c: ComportamentoNarrativo): Comportamento {
  switch (c) {
    case "foge": return "medroso";
    // "sumir e reaparecer" (espreita) e a HABILIDADE dela (ver
    // atacarComoCriatura), nao um quarto estado de IA: pra decidir SE avanca
    // ou ataca, ela se comporta como "curioso" (nunca foge por conta baixa).
    case "espreita": return "curioso";
    case "encara": return "curioso"; // "vem reto, nao desiste" bate com curioso
    case "chefe": return "curioso";  // rotina propria fica pra quando tiver mapa
    case "ronda": return "passeia";
    case "vigia": return "passeia";
    case "guarda": return "passeia"; // nao sai do lugar, so bate quem chega perto
  }
}

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
  /** "criatura" para qualquer bicho de verdade (goblin, aranha, o que for),
   *  "arbusto" para cenario destrutivel -- generico desde 2026-09-05, antes
   *  todo bicho nascia carimbado "goblin" mesmo nao sendo. */
  tipo: "criatura" | "arbusto";
  coracoes: number;
  coracoesMax: number;
  pips?: Phaser.GameObjects.Container;
  mostrarAte: number;
  rota: Casa[];
  /** revisao de 2026-09-04: antes disto, `acao.marca` nunca era lido - toda
   *  magia so causava dano generico, por baixo do efeito visual bonito. */
  condicoes: Condicao[];
  condicoesUI?: Phaser.GameObjects.Container;
  /** "medroso" (ver sistemas/criatura.ts): topa um golpe de surpresa, nunca
   *  dois seguidos -- da segunda vez pra frente, foge em vez de atacar. */
  jaAtacouDeSurpresa: boolean;
  /** onde o Atrair foi lancado (a casa do heroi no momento do "doce") - so
   *  existe enquanto a criatura estiver ATRAIDO. Ela anda ate aqui e ignora o
   *  heroi, mesmo que ele se mexa depois - ver docs/mundo-que-reage.md:76. */
  pontoAtracao?: Casa;
};

/** So o ESTADO de cada acao - quem desenha o slot e sistemas/hudDeAcao.ts,
 *  que so recebe este estado como dado (nunca sabe o que e um turno). */
type Slot = {
  acao: AcaoDeHeroi;
  livreNaRodada: number;
  gastou: boolean;
};

export type Encontro = { id: string; chave: string }[];

/** So tres arquivos de som existem (oba/quase/ops) pros cinco desfechos novos -
 *  gravar dois desfechos novos (critico de sucesso, critico de fracasso) fica
 *  pra quando fizer sentido investir em som/gerar.py. Ate la, os dois criticos
 *  emprestam o tom do desfecho mais proximo. */
function somDoDesfecho(desfecho: Desfecho): keyof typeof DESFECHO {
  if (desfecho === "critico-sucesso" || desfecho === "sucesso") return "oba";
  if (desfecho === "falha-perto") return "quase";
  return "ops";
}

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
  /** retrato+vida+item rapido+acoes, sempre no mesmo rodape que
   *  `Interface.ts` usa fora de combate - ver sistemas/hudDeAcao.ts. */
  private hud!: HudDeAcao;
  private trilhaIniciativa!: Phaser.GameObjects.Container;
  private botaoPassar!: Phaser.GameObjects.Container;
  private fundoAutoPassar!: Phaser.GameObjects.NineSlice;
  private marcaAutoPassar!: Phaser.GameObjects.Graphics;
  private alvoAutoPassar!: Phaser.GameObjects.Rectangle;
  private aviso!: Phaser.GameObjects.BitmapText;
  private chapaAviso!: Phaser.GameObjects.NineSlice;
  private dicaCaixa!: Phaser.GameObjects.Container;
  private dicaTexto!: Phaser.GameObjects.BitmapText;
  private dicaChapa!: Phaser.GameObjects.NineSlice;
  private coracoes = 3;
  private coracoesMax = 3;
  private atributos: Record<Atributo, number> = { forca: 0, destreza: 0, agilidade: 0, inteligencia: 0, vitalidade: 0 };
  /** condicoes no proprio heroi - Escudo de Bolha, Veu de Sombra e Aderencia
   *  sao autolancadas, ninguem mais tem essa lista (ver sistemas/alvo.ts). */
  private heroiCondicoes: Condicao[] = [];
  private heroiCondicoesUI?: Phaser.GameObjects.Container;
  private topoDaBarra = 0;
  private alcancadas = new Map<string, Alcancada>();
  /** busca mais generosa, so pra desenhar a linha de movimento dobrando em
   *  paredes quando o cursor aponta alem do alcance real do turno (que
   *  continua so em `alcancadas`, acima) - ver `desenharLinhaDeMovimento`. */
  private alcancadasEstendidas = new Map<string, Alcancada>();
  /** posicao de mundo do ponteiro, atualizada por `pointermove` em
   *  `ligarEntrada()` - `desenharLinhaDeMovimento` le isto todo frame. */
  private cursorMundo = { x: 0, y: 0 };
  /** A cena de onde o heroi e o chao de verdade vem emprestados. Nunca cria
   *  os proprios: ver docs/plano-do-combate.md, secao 3.6. */
  private mundo!: Mundo;
  private largura = 0;
  private altura = 0;
  /** selos no INICIO desta luta, pra saber ao final se algum selo ganho aqui
   *  completou uma leva de 3 (e por isso deve abrir a tela de escolha). */
  private selosNoInicio = 0;
  /** o periodo do dia QUANDO A LUTA COMECOU, capturado uma vez — pra uma luta
   *  comprida nao mudar de bonus no meio se o relogio virar de periodo
   *  (dados/conteudo.ts, Criatura.bonusPorPeriodo). */
  private periodoDoEncontro: Periodo = "manha";

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
    this.ordem = new Ordem();
    this.fase = "montando";
    this.escolhida = undefined;
    this.rotaDoHeroi = [];
    // sem isto, Escudo de Bolha ou Veu de Sombra lancado numa luta continuava
    // valendo na luta seguinte - a cena e reaproveitada, os campos nao se
    // limpam sozinhos.
    this.heroiCondicoes = [];
    this.heroiCondicoesUI = undefined;

    const st0 = estado();
    const ficha = st0.heroi;
    this.coracoesMax = st0.coracoesMax;
    this.coracoes = st0.coracoes;
    this.atributos = poderesDoHeroi(ficha);
    if (algumMoodleCritico()) {
      (Object.keys(this.atributos) as Atributo[]).forEach((a) => (this.atributos[a] -= 1));
    }
    this.selosNoInicio = st0.selos;
    this.periodoDoEncontro = periodoAtual();

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
      // base fixa da criatura (conteudo.ts, revisao 2026-09-05) mais o
      // extra de periodo (aranha fica mais perigosa de noite, por exemplo) -
      // as duas escalas de dificuldade somam, nao competem.
      const bonus = b.bonus + (b.bonusPorPeriodo?.[this.periodoDoEncontro] ?? 0);
      this.porCriatura(`${e.id}-${i}`, e.id, e.chave, spriteChave, nome, bonus, casa.tx, casa.ty, b.coracoes);
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
    // reposiciona em vez de remontar: remontar perderia estado de luta em
    // andamento (slot "gastou" de porLuta, visibilidade do PASSAR, o rotulo
    // de quem esta na vez) que so vive nestes objetos, sem copia em
    // sistemas/estado.ts.
    refazerAoRedimensionar(this, () => this.reposicionarInterface());
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

  private porCriatura(
    id: string, bicharioId: string, chave: string, spriteChave: string, nome: string,
    bonus: number, tx: number, ty: number, coracoes: number
  ) {
    const [x, y] = this.centroDaCasa(tx, ty);
    // nasce no mundo do Mundo, nao no da Combate: sao cenas empilhadas, e cada
    // uma desenha a sua lista inteira por cima da de baixo. Se a criatura
    // fosse desta cena, ela cobriria o heroi sempre, nao importa o Y de cada.
    const s = this.mundo.physics.add.sprite(x, y, spriteChave, 0).setOrigin(0.5, 1)
      .setScale(escalaDoSprite(spriteChave));
    s.setDepth(y);
    s.play(`${spriteChave}-parado-baixo`, true);
    // caixa de colisao proporcional ao quadro de VERDADE da textura (nao ao
    // porte da ficha): o goblin sozinho desenha em 48x96 (3x, escalaDoSprite
    // compensa so a EXIBICAO), entao ler o porte daria uma caixa errada so
    // pra ele. As razoes vem do 10x6/offset 3,26 que ja valia pro goblin
    // antigo (16x32).
    const larguraQuadro = s.frame.width, alturaQuadro = s.frame.height;
    s.body.setSize(Math.round(larguraQuadro * 0.625), Math.round(alturaQuadro * 0.1875))
      .setOffset(Math.round(larguraQuadro * 0.1875), Math.round(alturaQuadro * 0.8125));
    this.bichos.push({
      id, bicharioId, chave, nome, bonus,
      retrato: ICONE.retrato[spriteChave.replace("goblin-", "")] ?? 1,
      sprite: s, corpo: s.body as Phaser.Physics.Arcade.Body, tipo: "criatura",
      coracoes, coracoesMax: coracoes, mostrarAte: 0, rota: [],
      jaAtacouDeSurpresa: false, condicoes: [],
    });
  }

  // ================================================================ interface
  private montarInterface() {
    const fixo = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      (o as unknown as { setScrollFactor: (n: number) => void }).setScrollFactor(0);
      (o as unknown as { setDepth: (n: number) => void }).setDepth(1000);
      return o;
    };

    const acoes = acoesDoHeroi(estado().heroi);
    // -76 sobra os 26px que PASSAR + o toggle de passar automaticamente
    // precisam no canto, sem disputar espaco com o ultimo slot de acao.
    const area = { x: 6, y: ALTURA - 24, largura: LARGURA - 6 - 76, altura: 22 };
    const item = itemRapidoAtual();
    this.hud = montarHudDeAcao(this, {
      area, acoes,
      // usar item so fora de combate por enquanto (ver hudDeAcao.ts) - em
      // combate o slot aparece igual, so sempre apagado.
      itemRapido: item ? { ...item, disponivel: false } : null,
      vida: { atual: this.coracoes, max: this.coracoesMax },
      fixarNaTela: true,
      aoEscolherAcao: (acao) => this.escolher(acao),
      aoApontarAcao: (acao, xSlot) => this.mostrarDica(acao, xSlot),
      aoTirarApontamento: () => this.esconderDica(),
      aoUsarItemRapido: () => this.mostrarDicaLinhas(["ITEM RAPIDO", "SO FORA DE COMBATE"], this.hud.area.x + 60),
    });
    this.topoDaBarra = this.hud.area.y - 14;
    // canto superior-esquerdo, livre desde que a vida saiu do topo.
    this.trilhaIniciativa = fixo(this.add.container(8, 2));

    this.slots = acoes.map((acao) => ({
      acao,
      livreNaRodada: 0,
      // "porAventura" pode ja ter sido gasta numa luta anterior desta mesma
      // aventura — o slot nasce riscado se for o caso.
      gastou: acao.escopo === "porAventura" && usosGastos(acao.id) > 0,
    }));

    for (let i = 0; i < MOVIMENTO.heroi; i++) {
      this.pipsMovimento.push(fixo(this.add.graphics()));
    }

    const px = this.hud.area.x + this.hud.area.largura + 26;
    const py = ALTURA - 16;
    const fundoP = this.add.nineslice(0, 0, "painel-ouro", undefined, 44, 16, 8, 8, 8, 8).setOrigin(0.5);
    const txtP = texto(this, 0, 0, "PASSAR", { cor: 0x2c2440, ancora: 0.5, ancoraY: 0.5 });
    this.botaoPassar = fixo(this.add.container(px, py, [fundoP, txtP]));
    this.botaoPassar.setSize(44, 16).setInteractive({ useHandCursor: true });
    this.botaoPassar.on("pointerdown", () => this.passarAVez());

    // --------------------------------------- passar automaticamente (toggle)
    // Nao cabe rotulo de texto do lado do PASSAR (44x16 ja ocupa o canto
    // inteiro) — e so um quadradinho com visto, que muda de cor conforme a
    // preferencia. O PASSAR continua existindo do jeito de sempre; isto so
    // decide se `fimDaAcao()` chama `passarAVez()` sozinho depois que a acao
    // do turno for usada (ver fimDaAcao()), sem exigir o clique manual.
    const paX = px - 32;
    const paY = py;
    this.fundoAutoPassar = fixo(
      this.add.nineslice(paX, paY, "painel-escuro", undefined, 18, 16, 6, 6, 6, 6).setOrigin(0.5)
    );
    this.marcaAutoPassar = fixo(this.add.graphics());
    this.desenharAutoPassar(paX, paY);
    this.alvoAutoPassar = fixo(
      this.add.rectangle(paX, paY, 22, 22, 0x000000, 0).setInteractive({ useHandCursor: true })
    );
    this.alvoAutoPassar.on("pointerdown", () => {
      definirPreferencia("passarAutomaticamente", !preferencias().passarAutomaticamente);
      this.desenharAutoPassar(paX, paY);
    });
    this.alvoAutoPassar.on("pointerover", () =>
      this.mostrarDicaLinhas(
        ["PASSAR SOZINHO", preferencias().passarAutomaticamente ? "LIGADO" : "DESLIGADO"],
        paX
      )
    );
    this.alvoAutoPassar.on("pointerout", () => this.esconderDica());
    this.mostrarBotaoPassar(false);

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

  /** Chamado quando a resolucao muda (girar o tablet, redimensionar a
   *  janela). So MOVE o HUD pro lugar novo, nunca remonta: remontar perderia
   *  o "gastou" de acao porLuta ja usada nesta luta, o rotulo de quem esta
   *  na vez e a visibilidade do PASSAR, que so existem como estado destes
   *  proprios objetos - nao ha copia deles em sistemas/estado.ts pra
   *  restaurar depois. */
  private reposicionarInterface() {
    const area = { x: 6, y: ALTURA - 24, largura: LARGURA - 6 - 76, altura: 22 };
    this.hud.mover(area.x - this.hud.area.x, area.y - this.hud.area.y);
    this.hud.area.largura = area.largura;
    this.hud.area.altura = area.altura;
    this.topoDaBarra = this.hud.area.y - 14;

    const px = this.hud.area.x + this.hud.area.largura + 26;
    const py = ALTURA - 16;
    this.botaoPassar.setPosition(px, py);
    const paX = px - 32, paY = py;
    this.fundoAutoPassar.setPosition(paX, paY);
    this.alvoAutoPassar.setPosition(paX, paY);
    this.desenharAutoPassar(paX, paY);

    this.chapaRotulo.setPosition(LARGURA / 2, this.topoDaBarra);
    this.rotulo.setPosition(LARGURA / 2, this.topoDaBarra + 2);
    this.chapaAviso.setPosition(LARGURA / 2, 28);
    this.aviso.setPosition(LARGURA / 2, 32);
    // dicaCaixa nao precisa: mostrarDicaLinhas() ja recalcula a posicao com
    // LARGURA/topoDaBarra atuais toda vez que a dica reaparece.
  }

  private mostrarDica(a: AcaoDeHeroi, xSlot: number) {
    const linha2 =
      a.forma === "aoRedor" ? `PEGA ${a.alcance} CASAS EM VOLTA`
      : a.forma === "linha" ? `LINHA DE ${a.alcance} CASAS`
      : `ALCANCE ${a.alcance} ${a.alcance === 1 ? "CASA" : "CASAS"}`;
    const linha3 = a.escopo === "porLuta" ? "UMA VEZ POR LUTA"
      : a.escopo === "porAventura" ? "UMA VEZ POR AVENTURA"
      : "TODO TURNO";
    this.mostrarDicaLinhas([a.nome, linha2, linha3], xSlot);
  }

  /** O nucleo de `mostrarDica`, sem depender de uma `AcaoDeHeroi` — serve
   *  qualquer dica de texto simples na mesma caixa, como o toggle de passar
   *  automaticamente (que nao e uma acao do heroi, so uma preferencia). */
  private mostrarDicaLinhas(linhas: string[], xAlvo: number) {
    const ENTRE = 2;
    const alturaTexto = linhas.length * (10 + ENTRE) - ENTRE;
    const altura = alturaTexto + 10;
    const largura = Math.max(...linhas.map((l) => l.length)) * 8 + 12;
    this.dicaTexto.setText(linhas.join("\n"));
    this.dicaTexto.setLineSpacing(ENTRE);
    this.dicaTexto.setY(-altura + 5);
    this.dicaChapa.setSize(largura, altura);
    const x = Phaser.Math.Clamp(xAlvo, largura / 2 + 2, LARGURA - largura / 2 - 2);
    this.dicaCaixa.setPosition(x, this.topoDaBarra - 2).setVisible(true);
  }

  private esconderDica() {
    this.dicaCaixa.setVisible(false);
  }

  /** Visto dourado (ligado) ou quadrado apagado (desligado) — o mesmo
   *  vocabulario visual da borda que ja marca a acao selecionada nos slots,
   *  so que aqui e um interruptor, nao uma selecao temporaria. */
  private desenharAutoPassar(x: number, y: number) {
    const ligado = preferencias().passarAutomaticamente;
    const cor = ligado ? 0xf5b62b : 0x6b6484;
    this.marcaAutoPassar.clear();
    this.marcaAutoPassar.lineStyle(2, cor, 1).strokeRect(x - 6, y - 6, 12, 12);
    if (!ligado) return;
    this.marcaAutoPassar.lineStyle(2, cor, 1);
    this.marcaAutoPassar.beginPath();
    this.marcaAutoPassar.moveTo(x - 3, y);
    this.marcaAutoPassar.lineTo(x - 1, y + 3);
    this.marcaAutoPassar.lineTo(x + 4, y - 4);
    this.marcaAutoPassar.strokePath();
  }

  /** PASSAR e o toggle de passar-automaticamente sempre aparecem e somem
   *  juntos: os dois so fazem sentido durante o turno do heroi. */
  private mostrarBotaoPassar(visivel: boolean) {
    this.botaoPassar.setVisible(visivel);
    this.fundoAutoPassar.setVisible(visivel);
    this.marcaAutoPassar.setVisible(visivel);
    this.alvoAutoPassar.setVisible(visivel);
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
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.y >= this.topoDaBarra) return;
      this.cursorMundo.x = p.worldX;
      this.cursorMundo.y = p.worldY;
    });
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
  private criaturasVivas(): Bicho[] {
    return this.bichos.filter((b) => b.tipo === "criatura");
  }

  /** Revisao de 2026-09-04 (docs/modelo-de-combate.md secao 3): 1d20, nao 1d6. */
  private d20 = () => Phaser.Math.Between(1, 20);
  /** o dado de DANO (sistemas/dado.ts) pede um sorteio de 0 a 1, diferente
   *  do d20 acima (que ja devolve o numero inteiro final) - por isso um
   *  segundo gerador, nao reuso do mesmo. */
  private sorteioDeDano = () => Math.random();

  /** Quanto uma acao pesa quando acerta: o dado dela (arma ou magia) mais o
   *  atributo que ela testa, dobrando os dados no critico de sucesso - a
   *  mesma regra do D&D (docs/modelo-de-combate.md secao 3, "dano dobrado").
   *  Sem dado (as autolancadas, que nunca causam dano), devolve 0. */
  private danoDaAcao(acao: AcaoDeHeroi, bonus: number, critico: boolean): number {
    if (!acao.dado) return 0;
    const dado = critico ? dobrar(acao.dado) : acao.dado;
    return Math.max(1, rolarDado(dado, this.sorteioDeDano) + bonus);
  }

  private comecarCombate() {
    const lutadores = this.criaturasVivas();
    if (lutadores.length === 0) return this.acabarCombate();
    this.fase = "vezDaCriatura";
    this.ordem.comecar([
      { id: "heroi", iniciativa: this.d20() + this.atributos.agilidade, movimentoMax: MOVIMENTO.heroi },
      ...lutadores.map((g) => ({
        id: g.id, iniciativa: this.d20(),
        movimentoMax: movimentoDaCriatura(acharCriatura(g.bicharioId)?.velocidade ?? 0),
      })),
    ]);
    const minha = this.casaDoHeroi();
    const [ax, ay] = this.centroDaCasa(minha.tx, minha.ty);
    this.tweens.add({ targets: this.heroi, x: ax, y: ay, duration: 160, ease: "Quad.easeOut" });
    this.anunciar("COMBATE!");
    if (algumMoodleCritico()) {
      const frase = nivelDoMoodle("fome") === "critico"
        ? "Voce entra faminto. Os golpes saem mais fracos."
        : "Voce entra exausto. Os golpes saem mais fracos.";
      this.time.delayedCall(900, () => this.anunciar(frase, 1200));
    }
    // com mais de um tipo na mesma luta (ainda nao acontece hoje), a familia
    // do primeiro decide o som -- aproximado de proposito, nao vale a pena
    // tocar dois sons de entrada por cima um do outro.
    tocarFicha(CRIATURAS_SOM[FAMILIA_DA_CRIATURA[lutadores[0]?.bicharioId] ?? "pequeno"].nota);
    this.desenharIniciativa();
    this.time.delayedCall(700, () => this.entrarNoTurno());
  }

  private entrarNoTurno() {
    const vez = this.ordem.agora();
    if (!vez) return this.acabarCombate();
    this.desenharIniciativa();
    if (vez.id === "heroi") {
      this.fase = "meuTurno";
      this.mostrarBotaoPassar(true);
      this.anunciar("SUA VEZ", 600);
      this.calcularAlcance();
      return;
    }
    const dele = this.bichos.find((b) => b.id === vez.id);
    this.anunciar(`VEZ DO ${dele?.nome ?? "INIMIGO"}`, 500);
    this.fase = "vezDaCriatura";
    this.mostrarBotaoPassar(false);
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
    this.mostrarBotaoPassar(false);
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
      // cruzou uma leva de 3 selos nesta luta? a tela de escolha abre por
      // cima do Mundo, que sairDeCombate() acabou de liberar — congela os
      // dois de novo, mesmo padrao que Mundo.pausar() usa pra Pausa
      const antes = Math.floor(this.selosNoInicio / 3);
      const agora = Math.floor(estado().selos / 3);
      if (agora > antes) {
        this.scene.pause("Mundo");
        this.scene.pause("Interface");
        this.scene.launch("EscolhaDeSelo");
      }
    });
  }

  /** A vez da criatura: decide com `decidirAcaoDaCriatura` (sistemas/criatura.ts,
   *  comportamento "medroso" -- bate uma vez de surpresa, depois foge; fraca,
   *  foge sempre) o que faz ESTE turno, e so faz uma coisa por vez: anda OU
   *  ataca OU foge, nunca as duas no mesmo turno. Ela NUNCA rola dado - isso
   *  nao mudou, so ficou mais estrito (docs/modelo-de-combate.md secao 3,
   *  revisao de 2026-09-04): antes ela rolava o proprio ataque contra uma
   *  faixa fixa; agora e sempre o HEROI que rola, tambem pra se defender. A
   *  criatura so tem um ND fixo (10 + bonus) que representa a forca do golpe
   *  dela. */
  private jogarCriatura(id: string) {
    const b = this.bichos.find((x) => x.id === id);
    if (!b) { this.ordem.remover(id); return this.entrarNoTurno(); }
    const ficha = acharCriatura(b.bicharioId);
    const aqui = this.casaDoBicho(b);
    const atraida = tem(b.condicoes, "atraido") && !!b.pontoAtracao;
    // ATRAIDO ignora o heroi por completo (docs/mundo-que-reage.md:76): nunca
    // ataca, nunca foge, so anda ate o cheiro. Chegando la, so espera - o
    // proprio comportamento normal (foge/curioso/etc.) fica suspenso.
    const alvo = atraida ? b.pontoAtracao! : this.casaDoHeroi();
    const distancia = distanciaEmCasas(aqui, alvo);
    const comportamento = comportamentoDeCombate(ficha?.comportamento ?? "foge");
    const intencao = atraida
      ? (distancia <= 1 ? "esperar" : "avancar")
      : decidirAcaoDaCriatura(comportamento, distancia, b.coracoes, b.coracoesMax, b.jaAtacouDeSurpresa);

    if (intencao === "atacar") {
      b.rota = [];
      this.mostrarPips(b);
      return this.atacarComoCriatura(b);
    }
    if (intencao === "esperar") {
      // "passeia": nao sai do lugar enquanto o heroi nao chega perto.
      this.time.delayedCall(220, () => { this.ordem.passar(); this.entrarNoTurno(); });
      return;
    }
    if (intencao === "avancar" && b.bicharioId === "lobo-nevoa") {
      // habilidade propria: em vez de andar, ele SOME e reaparece perto do
      // heroi -- "a nevoa se junta num ponto antes de ele sair dela"
      // (telegrafo do bestiario), e bate com ser o mais rapido dos tres.
      return this.avancarComoNevoa(b, alvo);
    }

    const passos = movimentoDaCriatura(ficha?.velocidade ?? 0);
    const achadas = alcancaveis(aqui, passos, (tx, ty) => this.passavel(tx, ty, b));
    let melhor: Casa | undefined;
    // "avancar" quer a casa alcancavel MAIS PERTO do heroi; "fugir" quer a
    // MAIS LONGE -- mesma busca, comparador trocado.
    let melhorDist = intencao === "fugir" ? -Infinity : Infinity;
    achadas.forEach((c) => {
      const d = distanciaEmCasas(c, alvo);
      if (intencao === "fugir" ? d > melhorDist : d < melhorDist) {
        melhorDist = d; melhor = { tx: c.tx, ty: c.ty };
      }
    });
    b.rota = melhor ? caminho(achadas, melhor) : [];
    this.mostrarPips(b);

    if (intencao === "fugir") {
      // de costas para o heroi: a mesma direcao que "avancar ate ele" teria,
      // invertida -- foge olhando para onde vai, nao para tras.
      const dir = direcaoDe(aqui.tx - alvo.tx, aqui.ty - alvo.ty) ?? "baixo";
      b.sprite.play(`${b.sprite.texture.key}-fuga-${dir}`, true);
    }

    const aoTerminar = () => {
      if (intencao === "fugir") {
        const dir = direcaoDe(this.casaDoBicho(b).tx - alvo.tx, this.casaDoBicho(b).ty - alvo.ty) ?? "baixo";
        b.sprite.play(`${b.sprite.texture.key}-parado-${dir}`, true);
      }
      this.time.delayedCall(220, () => { this.ordem.passar(); this.entrarNoTurno(); });
    };
    if (b.rota.length === 0) return aoTerminar();
    b.sprite.setData("aoChegar", aoTerminar);
  }

  /** Habilidade do lobo-de-nevoa: some (fade out), reaparece numa casa
   *  livre ao lado do heroi, e volta (fade in) -- em vez de andar ate la
   *  feito as outras. Conta como UM turno (so "avancar"): o ataque de
   *  verdade fica pro proximo turno, ja adjacente, igual a qualquer outra
   *  criatura. Sem vaga do lado do heroi, so passa a vez. */
  private avancarComoNevoa(b: Bicho, alvo: Casa) {
    const vizinhas: Casa[] = [
      { tx: alvo.tx - 1, ty: alvo.ty }, { tx: alvo.tx + 1, ty: alvo.ty },
      { tx: alvo.tx, ty: alvo.ty - 1 }, { tx: alvo.tx, ty: alvo.ty + 1 },
      { tx: alvo.tx - 1, ty: alvo.ty - 1 }, { tx: alvo.tx + 1, ty: alvo.ty - 1 },
      { tx: alvo.tx - 1, ty: alvo.ty + 1 }, { tx: alvo.tx + 1, ty: alvo.ty + 1 },
    ].filter((c) => this.passavel(c.tx, c.ty, b));
    const destino = vizinhas[0];
    if (!destino) {
      this.time.delayedCall(220, () => { this.ordem.passar(); this.entrarNoTurno(); });
      return;
    }
    const [dx, dy] = this.centroDaCasa(destino.tx, destino.ty);
    this.tweens.add({
      targets: b.sprite, alpha: 0, duration: 260,
      onComplete: () => {
        b.corpo?.reset(dx, dy);
        b.sprite.setDepth(dy);
        this.tweens.add({ targets: b.sprite, alpha: 1, duration: 260 });
        this.time.delayedCall(300, () => { this.ordem.passar(); this.entrarNoTurno(); });
      },
    });
  }

  /** O golpe da criatura: telegrafo parado, avanco, golpe, volta exata a
   *  origem. Chamado so quando ela ja esta adjacente -- nunca no mesmo turno
   *  em que andou (ver jogarCriatura). */
  private atacarComoCriatura(b: Bicho) {
    const chave = b.sprite.texture.key;
    const baseEsc = escalaDoSprite(chave);
    const ox = b.sprite.x, oy = b.sprite.y;
    const dir = direcaoDe(this.heroi.x - ox, this.heroi.y - oy) ?? "baixo";
    // o corpo e fisico (Arcade): mover so o sprite.x/y seria pisado no
    // proximo passo de fisica. O avanco e a volta usam velocidade, igual
    // ao empurrao de `atingir()` -- e so uma FRACAO do caminho ate o
    // heroi, ele entra no alcance do golpe, nunca em cima do heroi.
    // A distancia do avanco escala com o `alcance` da ficha (12 = o goblin,
    // que fica exatamente como estava): a aranha bota mais longe, batendo
    // com o proprio bestiario.
    const alcanceMult = (acharCriatura(b.bicharioId)?.alcance ?? 12) / 12;
    const velocidadeAvanco = 90 * alcanceMult;
    const rumo = new Phaser.Math.Vector2(this.heroi.x - ox, this.heroi.y - oy).normalize();
    const grito = texto(this, ox, oy - 40, "!", { cor: 0xf5b62b, ancora: 0.5 });
    grito.setDepth(2000);
    tocarFicha(CRIATURAS_SOM[FAMILIA_DA_CRIATURA[b.bicharioId] ?? "pequeno"].reage);
    // telegrafo: levanta o porrete e para, parado no lugar -- "levanta o
    // pau acima da cabeca e fecha os olhos" (bestiario). So depois disso
    // ele avanca; sem a pausa o golpe vira reflexo, nao leitura.
    b.sprite.play(`${chave}-ataque-${dir}`);
    this.time.delayedCall(380, () => {
      grito.destroy();
      b.corpo?.setVelocity(rumo.x * velocidadeAvanco, rumo.y * velocidadeAvanco);
      this.time.delayedCall(130, () => {
        b.corpo?.setVelocity(0, 0);
        this.tweens.add({ targets: b.sprite, scaleX: baseEsc * 1.15, scaleY: baseEsc * 0.85, duration: 90, yoyo: true });
        // o heroi rola DEFESA contra o ND do golpe da criatura - nunca mais a
        // criatura rolando o proprio ataque. Escondido (Veu de Sombra) torna
        // o golpe mais dificil de acertar: -4 no ND que o heroi precisa
        // bater, nunca abaixo de 4 (sempre sobra alguma chance de apanhar,
        // nunca um "impossivel errar").
        const escondido = tem(this.heroiCondicoes, "escondido");
        const nd = Math.max(4, 10 + b.bonus - (escondido ? 4 : 0));
        const resultado = testar(this.atributos.agilidade, nd, this.d20);
        tocarFicha(DADO.rola);
        this.mostrarDado(resultado, this.atributos.agilidade, b.sprite.x, b.sprite.y - 40);
        this.time.delayedCall(520, () => {
          tocarFicha(DESFECHO[somDoDesfecho(resultado.desfecho)]);
          if (foiSucesso(resultado.desfecho)) {
            this.poeira(this.heroi.x, this.heroi.y - 8);
            tocarFicha(IMPACTOS.errou);
          } else {
            {
              const ficha = acharCriatura(b.bicharioId);
              const critico = resultado.desfecho === "critico-fracasso";
              const dado = ficha?.dano ?? { quantidade: 1, lados: 3 };
              const dano = rolarDado(critico ? dobrar(dado) : dado, this.sorteioDeDano);
              this.heroiApanha(dano, critico);
            }
          }
          b.jaAtacouDeSurpresa = true;
          // volta para a posicao de origem -- "avanca, ataca, volta"
          b.sprite.play(`${chave}-parado-${dir}`, true);
          b.corpo?.setVelocity(-rumo.x * velocidadeAvanco, -rumo.y * velocidadeAvanco);
          this.time.delayedCall(130, () => {
            b.corpo?.setVelocity(0, 0);
            b.corpo?.reset(ox, oy);   // sem deriva: volta exata, nao aproximada
          });
          this.time.delayedCall(420, () => { this.ordem.passar(); this.entrarNoTurno(); });
        });
      });
    });
  }

  /** `dano` vem do bestiario (`Criatura.dano`, 1 na maioria, 2 nos guardioes
   *  de historia) - antes disto todo golpe custava 1 coracao sempre, o
   *  Grulo batendo igual a um goblin. */
  private heroiApanha(dano: number, cheio = true) {
    // Escudo de Bolha "absorve o proximo golpe" (conteudo.ts) - literal: o
    // golpe que ia acontecer some inteiro, mesmo um critico-fracasso de
    // defesa, e a protecao se gasta na hora (nunca mais que um golpe).
    if (tem(this.heroiCondicoes, "protegido")) {
      this.heroiCondicoes = this.heroiCondicoes.filter((c) => c.id !== "protegido");
      this.mostrarCondicoesHeroi();
      piscar(this, this.heroi, 90, 2, 0.5);
      tocarFicha(IMPACTOS.errou);
      return;
    }
    tocarFicha(IMPACTOS.bicho);
    this.cameras.main.shake(cheio ? 140 : 90, cheio ? 0.005 : 0.003);
    this.coracoes = Math.max(0, this.coracoes - dano);
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
    this.heroi.ficarTonto(1200);
    this.anunciar("QUE TONTEIRA!", 900);
    this.time.delayedCall(1200, () => this.derrota());
  }

  /** Fase 13 (docs/plano-de-implementacao.md, CLAUDE.md "Divergencia
   *  deliberada"): zero coracoes nunca apaga o heroi nem o save - so custa
   *  dinheiro e parte da mochila, e acorda no Hospital da Vila Semente, NUNCA
   *  mais na ultima fogueira acesa (isso e o que a mesa fazia, e o jogo
   *  diverge dela de proposito aqui - ver CLAUDE.md). A fogueira continua
   *  sendo checkpoint pra DESCANSAR, so deixou de ser tambem o ponto de
   *  resgate. O Hospital cura os coracoes pro maximo: punir a mesma derrota
   *  duas vezes (ferido E sem dinheiro) seria demais. O resumo do prejuizo
   *  (13.4) viaja junto pro Mundo mostrar assim que a tela acender de novo la. */
  private derrota() {
    const derrota = aplicarDerrota();
    this.coracoes = this.coracoesMax;
    this.atualizarCoracoes();
    estado().coracoes = this.coracoes;
    estado().cena = "vila";
    estado().lugar = VILA.lugar;
    salvar();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop();
      this.mundo.scene.restart({ entrada: HOSPITAL_ENTRADA, derrota });
    });
  }

  /** verde acima de metade, laranja entre metade e um quarto, vermelho
   *  abaixo disso - a mesma leitura de "cor avisa gravidade" que motivou a
   *  pesquisa (Project Zomboid), so com a paleta do jogo. */
  private atualizarCoracoes() {
    this.hud.atualizarVida(this.coracoes, this.coracoesMax);
  }

  // ==================================================================== a vez
  /** `ignorarSolido` e a Aderencia: maos grudentas escalam o que normalmente
   *  bloqueia passagem (parede, pedra) - so o heroi usa isto, e so enquanto a
   *  condicao "rapido" durar (ver aplicarMarcaNoHeroi, marca "cola"). Um bicho
   *  ocupando a casa continua bloqueando: escalar parede nao e atravessar
   *  gente. */
  private passavel(tx: number, ty: number, quem?: Bicho, ignorarSolido = false): boolean {
    if (tx < 0 || ty < 0 || tx >= this.largura || ty >= this.altura) return false;
    if (!ignorarSolido) {
      const tile = this.chaoLayer.getTileAt(tx, ty);
      if (!tile || (SOLIDOS as readonly number[]).includes(tile.index)) return false;
    }
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
    const grudento = tem(this.heroiCondicoes, "rapido");
    const passavel = (tx: number, ty: number) => this.passavel(tx, ty, undefined, grudento);
    const origem = this.casaDoHeroi();
    this.alcancadas = alcancaveis(origem, vez.movimento, passavel);
    // teto generoso so pra saber por onde a linha de movimento dobra alem do
    // alcance real - o BFS para sozinho quando a fronteira esvazia
    // (alcance.ts), entao cobrir o mapa inteiro aqui e barato.
    this.alcancadasEstendidas = alcancaveis(origem, this.largura + this.altura, passavel);
  }

  /** Linha estilo Baldur's Gate 3 do heroi ate o cursor: branca enquanto o
   *  destino cabe no movimento do turno, vermelha no trecho que excede.
   *  Dobra em paredes porque segue a rota de verdade (`caminho()`), nunca
   *  uma reta que atravessaria obstaculo. Substitui a grade de quadrados
   *  que existia aqui antes - por pedido do Hugo, "mais clean". */
  private desenharLinhaDeMovimento() {
    this.pincelCasas.clear();
    if (this.fase !== "meuTurno") return;
    const casaCursor = this.casaDe(this.cursorMundo.x, this.cursorMundo.y);
    const rota = caminho(this.alcancadasEstendidas, casaCursor);
    if (rota.length === 0) return;

    const pontos = rota.map((c) => this.centroDaCasa(c.tx, c.ty));
    const indiceExtrapolou = rota.findIndex((c) => !this.alcancadas.has(chaveDaCasa(c.tx, c.ty)));
    const fimBranco = indiceExtrapolou === -1 ? pontos.length : indiceExtrapolou;

    const tracar = (de: [number, number], ate: [number, number][], cor: number) => {
      if (ate.length === 0) return;
      this.pincelCasas.lineStyle(2, cor, 0.85).beginPath().moveTo(de[0], de[1]);
      ate.forEach(([x, y]) => this.pincelCasas.lineTo(x, y));
      this.pincelCasas.strokePath();
    };
    tracar([this.heroi.x, this.heroi.y], pontos.slice(0, fimBranco), COR.papel);
    tracar(pontos[fimBranco - 1] ?? [this.heroi.x, this.heroi.y], pontos.slice(fimBranco), COR.vermelho);

    const [fx, fy] = pontos[pontos.length - 1];
    const corFinal = indiceExtrapolou === -1 ? COR.papel : COR.vermelho;
    this.pincelCasas.fillStyle(corFinal, 0.9).fillCircle(fx, fy, 2);
  }

  private escolher(acao: AcaoDeHeroi) {
    if (this.fase !== "meuTurno" && this.fase !== "mirando") return;
    const vez = this.ordem.agora();
    const slot = this.slots.find((s) => s.acao.id === acao.id)!;
    const emEspera = this.ordem.rodada() < slot.livreNaRodada;
    if (slot.gastou || emEspera || vez?.acaoUsada) {
      tocar("menu-volta", { volume: 0.4 });
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
      this.quebrarEsconderijo();
    }
  }

  // ================================================================= executar
  private executar(acao: AcaoDeHeroi, casa: Casa) {
    this.fase = "resolvendo";
    this.escolhida = undefined;
    this.pincel.clear();
    this.heroi.parar();
    // agir quebra o esconderijo igual andar quebra - a unica excecao e o
    // proprio lance de Veu de Sombra, que acabou de criar a condicao.
    if (acao.id !== "sumir-sumindo") this.quebrarEsconderijo();
    // Vira para o alvo antes de agir. Em combate o heroi ataca parado, e a
    // direcao dele so mudava andando: sem isto, o braco estica para o lado em
    // que ele andou pela ultima vez, que quase nunca e o lado do goblin.
    const minha = this.casaDoHeroi();
    this.heroi.encarar(casa.tx - minha.tx, casa.ty - minha.ty);
    // Golpe e magia sao poses diferentes, e os dois quadros existem desde que a
    // folha de sprite ganhou 8 colunas. Ate aqui toda acao usava a de conjurar,
    // entao dar uma espadada tinha o mesmo desenho que lancar uma bola de fogo.
    if (acao.tipo === "magia") this.heroi.conjurar(300);
    else {
      // o corpo a corpo ganha um agachar de anticipacao, junto da pose de
      // ataque - Fase 12 (Atualizacao 3), passo 3. A distancia so entra pra
      // nao dar o mesmo "impulso" pra quem ataca de longe (arco, funda),
      // que ainda usa so a pose crua ate o passo 5 do plano chegar.
      if (acao.alcance === 1) agachar(this, this.heroi, 90);
      this.heroi.atacar(300);
    }

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
    // o ND vem de quem esta na casa mirada - hoje todo bicho tem bonus 0, entao
    // isto da ND 10 sempre, mas ja fica pronto pro dia que o bestiario
    // diferenciar bicho fraco de chefe (docs/modelo-de-combate.md secao 3).
    const pegos = this.pegos(acao, casa);
    const nd = 10 + (pegos[0]?.bonus ?? 0);
    const resultado = testar(bonus, nd, this.d20);
    tocarFicha(DADO.rola);
    const [cx, cy] = this.centroDaCasa(casa.tx, casa.ty);
    this.mostrarDado(resultado, bonus, cx, cy - 40);

    this.time.delayedCall(420, () => {
      tocarFicha(DESFECHO[somDoDesfecho(resultado.desfecho)]);
      if (acao.id === "fala-bicho") {
        // tabela de desfecho propria (docs/11-combate-e-magias.md secao 9):
        // convencer nunca foi um golpe, entao nao cabe no galho generico de
        // acerto/erro logo abaixo - ver convencerBicho().
        this.convencerBicho(pegos, resultado.desfecho, cx, cy);
        this.time.delayedCall(500, () => this.fimDaAcao());
        return;
      }
      // "livre" (sistemas/alvo.ts): a acao age no proprio heroi ou numa casa
      // vazia, entao pegos() vazio e o resultado ESPERADO, nunca um erro.
      const semAlvoNecessario = acao.alvo === "livre";
      const sucesso = foiSucesso(resultado.desfecho);
      const critico = resultado.desfecho === "critico-sucesso";
      const dano = this.danoDaAcao(acao, bonus, critico);
      // mesmo com sucesso no dado, uma criatura agil pode esquivar por conta
      // propria -- `esquivaChance` (conteudo.ts), o atributo novo pedido pelo
      // Hugo em 2026-09-05. O DADO continua sendo de quem decide o resultado;
      // isto so filtra por cima dele. Sem sucesso no dado ninguem tem chance
      // de novo: ja errou por causa do dado, nao por sorte dupla.
      const esquivaram = !sucesso
        ? pegos
        : pegos.filter((b) => Math.random() < (acharCriatura(b.bicharioId)?.esquivaChance ?? 0));
      if (esquivaram.length > 0) {
        // falha com bicho na mira, ou esquiva de verdade: nao "nada
        // aconteceu", ele ESQUIVOU do golpe -- e por isso que o heroi errou.
        esquivaram.forEach((b) => {
          const chave = b.sprite.texture.key;
          const dir = direcaoDe(this.heroi.x - b.sprite.x, this.heroi.y - b.sprite.y) ?? "baixo";
          b.sprite.play(`${chave}-esquiva-${dir}`);
          this.time.delayedCall(360, () => b.sprite.play(`${chave}-parado-${dir}`, true));
        });
      }
      const atingidos = pegos.filter((b) => !esquivaram.includes(b));
      // errou se: o dado falhou, ou precisava de alvo e nao tinha nenhum, ou
      // tinha alvo e todos esquivaram -- as tres causas de "nada foi atingido"
      // sao diferentes e so a ultima depende da esquiva calculada acima.
      const semAlvoQuandoPrecisava = pegos.length === 0 && !semAlvoNecessario;
      const todosEsquivaram = pegos.length > 0 && atingidos.length === 0;
      if (!sucesso || semAlvoQuandoPrecisava || todosEsquivaram) {
        this.poeira(cx, cy - 8);
        tocarFicha(IMPACTOS.errou);
      } else if (acao.id === "golpe-arco" || acao.id === "golpe-funda") {
        // arco e funda atiram de verdade: quem acerta e a flecha/pedra
        // CHEGANDO no alvo, nao o clique - passo 5 do plano (Atualizacao 3).
        // O tempo de voo escala com a distancia real ate a casa, nao com o
        // alcance maximo da arma: um tiro de perto chega mais rapido que um
        // no limite do alcance.
        const distancia = distanciaEmCasas(minha, casa);
        const ms = 90 + distancia * 45;
        const [corProjetil, largura, comprimento] = acao.id === "golpe-funda"
          ? [0x96a2b8, 4, 4]
          : [0xa87a4e, 2, 8];
        projetilOrientado(this, this.heroi.x, this.heroi.y - 8, cx, cy, corProjetil, largura, comprimento, ms, () => {
          atingidos.forEach((b) => this.atingir(b, cx, cy, dano, critico));
          this.cameras.main.shake(90, 0.0022);
          this.time.delayedCall(500, () => this.fimDaAcao());
        });
        return;
      } else if (acao.id === "bafo-gelado") {
        // sopro em leque: um projetil por casa da linha, saindo quase junto
        // mas escalonado (40ms), pra ler como cone e nao parede - passo 6 do
        // plano. Gelo pisca fosco no impacto (piscar), nunca o flash branco
        // generico de fogo/golpe - a diferenca sozinha ja separa os dois.
        ondaDeConjuracao(this, this.heroi.x, this.heroi.y, 0x7ec4f2, 14);
        this.casasNaLinha(casa, acao.alcance).forEach((c, i) => {
          this.time.delayedCall(i * 40, () => {
            const [px, py] = this.centroDaCasa(c.tx, c.ty);
            projetilOrientado(this, this.heroi.x, this.heroi.y - 8, px, py, 0x7ec4f2, 5, 6, 160, () => {
              atingidos
                .filter((b) => this.mesmaCasa(this.casaDoBicho(b), c.tx, c.ty))
                .forEach((b) => {
                  this.atingir(b, px, py, dano, critico, "gelo");
                  if (acao.marca) this.aplicarMarcaNoBicho(b, acao.marca);
                });
            });
          });
        });
        this.cameras.main.shake(70, 0.0015);
        this.time.delayedCall(600, () => this.fimDaAcao());
        return;
      } else if (acao.id === "bola-de-fogo") {
        // a magia mais forte do Mago merece pesar mais que as outras treze -
        // passo 7 do plano (o ultimo). Onda maior (16 em vez do padrao),
        // bola mais gorda (raio 3 em vez de 2) e o unico impacto com
        // hitstop de magia de proposito: Bafo Gelado nao trava a tela,
        // Bola de Fogo trava.
        ondaDeConjuracao(this, this.heroi.x, this.heroi.y, 0xf2802b, 16);
        projetil(this, this.heroi.x, this.heroi.y - 8, cx, cy, 0xf2802b, 3, 220, () => {
          atingidos.forEach((b) => {
            this.atingir(b, cx, cy, dano, critico);
            if (acao.marca) this.aplicarMarcaNoBicho(b, acao.marca);
          });
          estourinho(this, cx, cy, 0xf2802b, 8, 12);
          hitstop(this, 60);
          this.cameras.main.shake(100, 0.003);
          this.time.delayedCall(500, () => this.fimDaAcao());
        });
        return;
      } else if (acao.id === "pulo-de-sapo") {
        this.saltar(casa);
      } else if (acao.id === "remendo") {
        this.curarComRemendo(resultado.desfecho === "critico-sucesso");
      } else if (acao.id === "chama-vento") {
        // Rajada "empurra tudo pela frente" (conteudo.ts) - alem do dano
        // generico, quem for atingido anda 2 casas na mesma direcao do
        // vento, parando na primeira parede/bicho/borda do mapa. A outra
        // metade do texto ("alimenta o fogo que ja estava queimando") espera
        // "queimando" existir de verdade - isso e Fase 4 (superficie de
        // fogo, ver o cabecalho de sistemas/marcas.ts), nao esta feio de
        // proposito, so ainda nao tem com o que interagir.
        const minhaCasa = this.casaDoHeroi();
        const ventoDx = Math.sign(casa.tx - minhaCasa.tx);
        const ventoDy = Math.sign(casa.ty - minhaCasa.ty);
        atingidos.forEach((b) => {
          this.atingir(b, cx, cy, dano, critico);
          this.empurrarBicho(b, ventoDx, ventoDy, 2);
        });
        this.cameras.main.shake(90, 0.0022);
      } else if (semAlvoNecessario) {
        // Escudo de Bolha, Veu de Sombra, Aderencia: a marca vira condicao no
        // proprio heroi, nunca em quem calhou de estar perto - "aoRedor
        // alcance 0" nunca pega um bicho de verdade (ver sistemas/alvo.ts).
        if (acao.marca) this.aplicarMarcaNoHeroi(acao.marca);
        ondaDeConjuracao(this, this.heroi.x, this.heroi.y, acao.cor, 10);
      } else {
        atingidos.forEach((b) => {
          this.atingir(b, cx, cy, dano, critico);
          // e aqui que as magias sem animacao propria (Cresce-Grama, Voz de
          // Trovao, Cheiro de Fogueira...) ganham reacao de verdade, mesmo
          // sem projetil dedicado - o dano generico continua, a marca por
          // cima e o que muda de verdade.
          if (acao.marca) this.aplicarMarcaNoBicho(b, acao.marca);
        });
        // o martelo pesa mais que espada, cajado ou soco: o mesmo golpe corpo
        // a corpo (passo 3 do plano), so essa arma ganha o micro-engasgo.
        if (acao.id === "golpe-martelo") hitstop(this, 50);
        this.cameras.main.shake(90, 0.0022);
      }
      this.time.delayedCall(500, () => this.fimDaAcao());
    });
  }

  private fimDaAcao() {
    this.dizer("");
    if (this.criaturasVivas().length === 0) return this.acabarCombate();
    // ordem.acabou() so fecha o turno quando NEM movimento nem acao sobraram
    // — sem a preferencia, ainda da pra andar depois de atacar. Com ela
    // ligada (padrao), a acao sozinha ja basta: o jogador nao precisa clicar
    // PASSAR so porque tinha movimento de sobra que nao pretendia usar.
    // "acao" aqui e a unica que existe hoje (Ordem.acaoUsada); quando o
    // combate ganhar mais de uma acao por turno, esta checagem passa a olhar
    // todas, nao so a primeira.
    const semAcaoDeSobra = preferencias().passarAutomaticamente && this.ordem.agora()?.acaoUsada;
    if (this.ordem.acabou() || semAcaoDeSobra) {
      this.ordem.passar();
      return this.entrarNoTurno();
    }
    this.fase = "meuTurno";
    this.calcularAlcance();
  }

  /** O cartao do dado, revisado pra 1d20/5 desfechos (docs/modelo-de-combate.md
   *  secao 3). Nao ha mais icone de face - 20 faces de dado nao cabem em pixel
   *  art razoavel, entao o numero sai como texto, igual o modificador ja saia. */
  private mostrarDado(resultado: ResultadoDeTeste, bonus: number, x: number, y: number) {
    const cores: Record<Desfecho, number> = {
      "critico-sucesso": 0xf5b62b,
      sucesso: 0x3e9b62,
      "falha-perto": 0xf2802b,
      falha: 0xe2483d,
      "critico-fracasso": 0x7b5ac4,
    };
    const palavras: Record<Desfecho, string> = {
      "critico-sucesso": "CRITICO!",
      sucesso: "SUCESSO",
      "falha-perto": "PERTO",
      falha: "FALHOU",
      "critico-fracasso": "DESASTRE",
    };
    const palavra = palavras[resultado.desfecho];
    const largura = 30 + (bonus > 0 ? 18 : 0) + palavra.length * 8 + 8;
    const cx = Phaser.Math.Clamp(x, largura / 2 + 4, this.largura * TILE - largura / 2 - 4);
    const caixa = this.add.container(cx, y).setDepth(2000);
    const chapa = this.add.nineslice(0, 0, "painel-creme", undefined, largura, 20, 8, 8, 8, 8).setOrigin(0.5);
    const esquerda = -largura / 2 + 4;
    const numero = texto(this, esquerda + 4, -4, String(resultado.dado), { cor: 0x2c2440 });
    const pecas: Phaser.GameObjects.GameObject[] = [chapa, numero];
    let cursor = esquerda + 22;
    if (bonus > 0) {
      pecas.push(texto(this, cursor, -4, `+${bonus}`, { cor: 0x4a3e64 }));
      cursor += 18;
    }
    pecas.push(texto(this, cursor + 2, -4, palavra, { cor: cores[resultado.desfecho] }));
    caixa.add(pecas);
    // os dois criticos ganham um pulo de entrada - a mesma familia de efeito que
    // ja marca "isto e diferente do normal" em pips e selos, so emprestada aqui.
    if (resultado.desfecho === "critico-sucesso" || resultado.desfecho === "critico-fracasso") {
      popIn(this, caixa, 160);
    }
    this.tweens.add({
      targets: caixa, y: y - 10, alpha: 0, delay: 640, duration: 320,
      onComplete: () => caixa.destroy(),
    });
  }

  /** As casas em linha reta do heroi ate `casa`, uma por passo do alcance -
   *  a mesma conta que `pegos()` ja fazia pra "linha", so devolvendo a CASA
   *  em vez do bicho que estiver nela. `executar()` usa isto pra desenhar um
   *  projetil por casa (Bafo Gelado, passo 6), mesmo nas casas vazias do meio
   *  do cone - sem isso o sopro pularia direto pro alvo, sem ler como cone. */
  private casasNaLinha(casa: Casa, alcance: number): Casa[] {
    const eu = this.casaDoHeroi();
    const dx = Math.sign(casa.tx - eu.tx);
    const dy = Math.sign(casa.ty - eu.ty);
    const casas: Casa[] = [];
    for (let i = 1; i <= alcance; i++) casas.push({ tx: eu.tx + dx * i, ty: eu.ty + dy * i });
    return casas;
  }

  private pegos(acao: AcaoDeHeroi, casa: Casa): Bicho[] {
    const eu = this.casaDoHeroi();
    if (acao.forma === "aoRedor") {
      return this.bichos.filter((b) => distanciaEmCasas(this.casaDoBicho(b), eu) <= acao.alcance);
    }
    if (acao.forma === "linha") {
      const naLinha: Bicho[] = [];
      this.casasNaLinha(casa, acao.alcance).forEach((c) => {
        this.bichos.forEach((b) => { if (this.mesmaCasa(this.casaDoBicho(b), c.tx, c.ty)) naLinha.push(b); });
      });
      return naLinha;
    }
    return this.bichos.filter((b) => this.mesmaCasa(this.casaDoBicho(b), casa.tx, casa.ty));
  }

  /** `estilo` muda so o sinal visual do impacto: "flash" (branco, quente -
   *  golpe e fogo) ou "gelo" (pisca fosco, `piscar()` de fx.ts) - a mesma
   *  distincao que faz o jogador ler "isso foi frio" sem precisar de texto. */
  private atingir(b: Bicho, dex: number, dey: number, dano: number, cheio: boolean, estilo: "flash" | "gelo" = "flash") {
    tocarFicha(b.tipo === "arbusto" ? IMPACTOS.madeira : IMPACTOS.bicho);
    if (estilo === "gelo") {
      piscar(this, b.sprite, 90, 2, 0.5);
    } else {
      b.sprite.setTintFill(0xfff8ea);
      this.time.delayedCall(70, () => b.sprite.clearTint());
    }
    // relativo a escala BASE do sprite (escalaDoSprite): o goblin exibe a 1/3
    // (arte em 48x96, mundo continua no tamanho de sempre) -- um scaleY
    // absoluto aqui pularia de volta para quase o tamanho cheio por 80ms,
    // um "inflar" visivel em vez de um encolher.
    const baseEsc = escalaDoSprite(b.sprite.texture.key);
    this.tweens.add({ targets: b.sprite, scaleY: baseEsc * 0.8, duration: 80, yoyo: true });
    if (cheio && b.corpo) {
      const fuga = new Phaser.Math.Vector2(b.sprite.x - dex, b.sprite.y - dey).normalize().scale(70);
      b.corpo.setVelocity(fuga.x, fuga.y);
      this.time.delayedCall(140, () => b.corpo?.setVelocity(0, 0));
    }
    b.coracoes -= dano;
    this.mostrarPips(b);
    if (b.coracoes <= 0) this.desistir(b);
  }

  /** O empurrao de Rajada: anda uma casa de cada vez na direcao do vento ate
   *  travar (parede, outro bicho, borda do mapa) - fisico, nao magico, entao
   *  nunca atravessa nada (diferente de Salto Longo, que e o heroi pulando
   *  de proposito). Se a primeira casa ja estiver bloqueada, o bicho so nao
   *  anda - nunca um erro, so um empurrao que nao pegou espaco. */
  private empurrarBicho(b: Bicho, dx: number, dy: number, casas: number) {
    if (dx === 0 && dy === 0) return;
    let atual = this.casaDoBicho(b);
    for (let i = 0; i < casas; i++) {
      const prox = { tx: atual.tx + dx, ty: atual.ty + dy };
      if (!this.passavel(prox.tx, prox.ty, b)) break;
      atual = prox;
    }
    const [px, py] = this.centroDaCasa(atual.tx, atual.ty);
    if (px === b.sprite.x && py === b.sprite.y) return;
    b.corpo?.setVelocity(0, 0);
    this.tweens.add({ targets: b.sprite, x: px, y: py, duration: 160, ease: "Sine.easeOut" });
  }

  /** Some do combate E do mapa de verdade. `chave` e a mesma que `Mundo.ts`
   *  guarda em `estado().derrotados`: quando o jogador voltar para a floresta,
   *  este goblin ja nao esta la. */
  private desistir(b: Bicho) {
    this.bichos = this.bichos.filter((o) => o !== b);
    b.corpo?.setVelocity(0, 0);
    b.pips?.destroy();
    b.condicoesUI?.destroy();
    if (b.tipo === "criatura") {
      tocarFicha(CRIATURAS_SOM[FAMILIA_DA_CRIATURA[b.bicharioId] ?? "pequeno"].desiste);
      if (b.chave) {
        marcarDerrotado(b.chave);
        // tira a versao decorativa do mundo de verdade agora mesmo — nao
        // precisa esperar Mundo recarregar o mapa pra ela sumir de vez.
        this.mundo.removerCriatura(b.chave);
        const ficha = acharCriatura(b.bicharioId);
        // guardiao unico (serpente, grulo, bruxa, brasanegra) larga sempre —
        // chance so vale pra bicho comum, que pode ser encontrado de novo.
        // Ver docs/plano-de-itens-e-equipamento.md, secao 8.
        ficha?.larga.forEach(({ id, chance }) => {
          if (!ficha.unico && Math.random() > chance) return;
          // mochila cheia: guardar() falha sem gastar nada - cai no chao aos
          // pes do heroi em vez de sumir sem aviso nenhum (a criatura ja foi
          // removida, entao esse loot nao tem mais outro lugar pra existir).
          if (id === "moeda") estado().moedas += 1;
          else if (!guardar(id)) this.mundo.largarItemNoChao(id, 1);
        });
        salvar();
        // um Selo de Heroi por criatura vencida — o sistema de progressao do
        // proprio RPG de mesa (CLAUDE.md), sem inventar experiencia nenhuma
        ganharSelo();
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
    if (b.tipo === "criatura") {
      const dir = b.sprite.anims.currentAnim?.key.split("-").pop() ?? "baixo";
      b.sprite.play(`${b.sprite.texture.key}-derrota-${dir}`);
    }
    this.tweens.add({
      targets: b.sprite, alpha: 0, y: b.sprite.y - 10, duration: 380,
      onComplete: () => b.sprite.destroy(),
    });
  }

  /** A mesma saida de `desistir()` (some do combate E do mapa, larga o de
   *  sempre) - so que sem a queda giratoria de quem perde a luta. Foi
   *  CONVENCIDO, nao vencido (Lingua Selvagem, ver convencerBicho()). Some
   *  trotando pro lado de fora do heroi, e `comLoot` so vem true no critico:
   *  a magia funcionou tao bem que o bicho deixa cair o de sempre mesmo assim. */
  private convencido(b: Bicho, comLoot: boolean) {
    this.bichos = this.bichos.filter((o) => o !== b);
    b.corpo?.setVelocity(0, 0);
    b.pips?.destroy();
    b.condicoesUI?.destroy();
    if (b.tipo === "criatura") {
      tocarFicha(CRIATURAS_SOM[FAMILIA_DA_CRIATURA[b.bicharioId] ?? "pequeno"].desiste);
      if (b.chave) {
        marcarDerrotado(b.chave);
        this.mundo.removerCriatura(b.chave);
        if (comLoot) {
          const ficha = acharCriatura(b.bicharioId);
          ficha?.larga.forEach(({ id, chance }) => {
            if (!ficha.unico && Math.random() > chance) return;
            if (id === "moeda") estado().moedas += 1;
            else guardar(id);
          });
        }
        salvar();
      }
    }
    this.ordem.remover(b.id);
    const ladoDoHeroi = b.sprite.x < this.heroi.x ? -1 : 1;
    this.tweens.add({
      targets: b.sprite, alpha: 0, x: b.sprite.x + ladoDoHeroi * 24,
      duration: 420, ease: "Sine.easeIn", onComplete: () => b.sprite.destroy(),
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

  /** Salto Longo: acerta o dado e o heroi pula direto pra casa mirada, sem se
   *  importar com parede, rio ou bicho no meio do caminho - "atravessa rio,
   *  muro ou inimigo de um salto so" (conteudo.ts). Sem pegos(): o efeito e
   *  mover o proprio heroi, nunca causar dano (marca "pulo" e efeito DIRETO,
   *  ver o cabecalho de sistemas/marcas.ts). */
  private saltar(casa: Casa) {
    const [dx, dy] = this.centroDaCasa(casa.tx, casa.ty);
    agachar(this, this.heroi, 90);
    this.time.delayedCall(90, () => {
      this.tweens.add({
        targets: this.heroi, x: dx, y: dy, duration: 200, ease: "Sine.easeOut",
        onComplete: () => {
          this.tweens.add({ targets: this.heroi, scaleY: 0.82, duration: 70, yoyo: true });
          this.poeira(dx, dy);
        },
      });
    });
  }

  /** Remendo: conserta o proprio heroi, nao um objeto - a mochila ainda nao
   *  tem nada quebravel pra consertar de verdade (marca "conserto", mesmo
   *  cabecalho de sistemas/marcas.ts). Cura 1 coracao, 2 no critico - a unica
   *  cura de combate que o heroi tem hoje. */
  private curarComRemendo(critico: boolean) {
    const antes = this.coracoes;
    this.coracoes = Math.min(this.coracoesMax, this.coracoes + (critico ? 2 : 1));
    this.atualizarCoracoes();
    estado().coracoes = this.coracoes;
    salvar();
    ondaDeConjuracao(this, this.heroi.x, this.heroi.y, 0xb08658, 10);
    if (this.coracoes > antes) {
      const t = texto(this, this.heroi.x, this.heroi.y - 30, `+${this.coracoes - antes}`, { cor: 0x3e9b62, ancora: 0.5 });
      textoFlutuante(this, t, 20, 500);
    }
  }

  /** Lingua Selvagem nunca causa dano, so tenta convencer - tabela propria
   *  pros 5 desfechos (docs/11-combate-e-magias.md secao 9), porque nao cabe
   *  no galho generico de acerto/erro de golpe e magia:
   *    critico-sucesso: vai embora E larga o de sempre (efeito extra do critico)
   *    sucesso:         vai embora, sem loot (foi convencido, nao vencido)
   *    falha / falha-perto: nao convenceu, a luta continua igual
   *    critico-fracasso: assustou o bicho errado - ele fica bravo (+2 no ND) */
  private convencerBicho(pegos: Bicho[], desfecho: Desfecho, cx: number, cy: number) {
    const b = pegos[0];
    if (!b) { this.poeira(cx, cy - 8); tocarFicha(IMPACTOS.errou); return; }
    if (desfecho === "critico-sucesso") return this.convencido(b, true);
    if (desfecho === "sucesso") return this.convencido(b, false);
    if (desfecho === "critico-fracasso") {
      b.bonus += 2;
      const grito = texto(this, b.sprite.x, b.sprite.y - 40, "!", { cor: 0xe2483d, ancora: 0.5 });
      textoFlutuante(this, grito, 16, 500);
      tocarFicha(CRIATURAS_SOM.pequeno.reage);
      return;
    }
    this.poeira(cx, cy - 8);
    tocarFicha(IMPACTOS.errou);
  }

  // ===================================================== vida sobre a cabeca
  /** Barra, nao mais fileira de pip por coracao - com vida virando numero de
   *  verdade (sistemas/dado.ts, ate 30+ no Brasanegra) uma fileira de
   *  quadradinhos nao cabia mais acima da cabeca de ninguem. */
  private mostrarPips(b: Bicho) {
    if (b.tipo === "arbusto") return;
    b.mostrarAte = this.time.now + 3000;
    b.pips?.destroy();
    const largura = 30;
    const fracao = Phaser.Math.Clamp(b.coracoes / b.coracoesMax, 0, 1);
    const cor = fracao > 0.5 ? 0x3e9b62 : fracao > 0.25 ? 0xf5b62b : 0xe2483d;
    const g = this.add.graphics();
    g.fillStyle(0x2c2440, 0.8).fillRect(-largura / 2 - 2, -2, largura + 4, 9);
    g.fillStyle(cor, 1).fillRect(-largura / 2, 0, Math.max(1, largura * fracao), 5);
    b.pips = this.add.container(b.sprite.x, b.sprite.y - 36, [g]).setDepth(2000);
    b.pips.setScale(0.6);
    this.tweens.add({ targets: b.pips, scale: 1, duration: 140, ease: "Back.easeOut" });
  }

  /** As condicoes de verdade acima da cabeca (acima dos coracoes) - MOLHADO,
   *  PRESO, ASSUSTADO etc, no mesmo molde que Provador.ts ja usava. Max 3
   *  visiveis: as 11 magias novas raramente empilham mais que isso numa
   *  criatura so, e "+N" pode esperar o dia que empilhar. */
  private mostrarCondicoes(b: Bicho) {
    b.condicoesUI?.destroy();
    if (b.condicoes.length === 0) return;
    const visiveis = b.condicoes.slice(0, 3);
    const largura = visiveis.length * 10 - 2;
    const g = this.add.graphics();
    visiveis.forEach((cond, i) => {
      const ficha = condicoesDados(cond.id);
      const x = -largura / 2 + i * 10;
      g.fillStyle(ficha.cor, 1).fillRect(x, 0, 8, 8);
      g.lineStyle(1, 0x2c2440, 0.8).strokeRect(x + 0.5, 0.5, 7, 7);
    });
    b.condicoesUI = this.add.container(b.sprite.x, b.sprite.y - 46, [g]).setDepth(2000);
    popIn(this, b.condicoesUI, 140, 0.6);
  }

  /** O elo que faltava entre `acao.marca` (que so alimentava a cor do efeito
   *  visual) e o motor de condicoes de verdade - antes desta revisao (2026-
   *  09-04) NENHUMA magia do jogo real chamava `aplicarMarca()`, nem Bafo
   *  Gelado ou Bola de Fogo. As condicoes aplicadas aqui ainda nao contam os
   *  proprios turnos (isso pede passarTurno() rodando em entrarNoTurno(),
   *  fica pro proximo passo) - mas a marca agora MUDA o bicho de verdade, em
   *  vez de so colorir um flash. */
  private aplicarMarcaNoBicho(b: Bicho, marca: Marca) {
    const resultado = aplicarMarca(marca, b.condicoes);
    b.condicoes = resultado.condicoesNovas;
    // "doce" e a unica marca que aplica ATRAIDO (sistemas/marcas.ts) - o
    // ponto de atracao e a casa do heroi AGORA, no instante do lancamento,
    // nao um alvo que persegue: se o heroi andar depois, a criatura continua
    // indo para onde o cheiro ficou (docs/mundo-que-reage.md:76).
    if (marca === "doce") b.pontoAtracao = this.casaDoHeroi();
    this.mostrarCondicoes(b);
  }

  /** O mesmo desenho de `mostrarCondicoes`, so que acima do proprio heroi -
   *  Escudo de Bolha, Veu de Sombra e Aderencia sao autolancadas (alvo
   *  "livre" em sistemas/alvo.ts), entao o efeito e nele, nunca num bicho. */
  private mostrarCondicoesHeroi() {
    this.heroiCondicoesUI?.destroy();
    if (this.heroiCondicoes.length === 0) return;
    const visiveis = this.heroiCondicoes.slice(0, 3);
    const largura = visiveis.length * 10 - 2;
    const g = this.add.graphics();
    visiveis.forEach((cond, i) => {
      const ficha = condicoesDados(cond.id);
      const x = -largura / 2 + i * 10;
      g.fillStyle(ficha.cor, 1).fillRect(x, 0, 8, 8);
      g.lineStyle(1, 0x2c2440, 0.8).strokeRect(x + 0.5, 0.5, 7, 7);
    });
    this.heroiCondicoesUI = this.add.container(this.heroi.x, this.heroi.y - 46, [g]).setDepth(2000);
    popIn(this, this.heroiCondicoesUI, 140, 0.6);
  }

  private aplicarMarcaNoHeroi(marca: Marca) {
    const resultado = aplicarMarca(marca, this.heroiCondicoes);
    this.heroiCondicoes = resultado.condicoesNovas;
    this.mostrarCondicoesHeroi();
  }

  /** Veu de Sombra some "enquanto o heroi ficar parado" (conteudo.ts) - andar
   *  ou agir quebra o esconderijo na hora. Passar a vez, nao: e exatamente o
   *  "ficar parado" que mantem a magia valendo. */
  private quebrarEsconderijo() {
    if (!tem(this.heroiCondicoes, "escondido")) return;
    this.heroiCondicoes = this.heroiCondicoes.filter((c) => c.id !== "escondido");
    this.mostrarCondicoesHeroi();
  }

  // =================================================================== update
  update(_t: number, _dt: number) {
    this.andarRota();
    this.andarCriaturas();
    this.desenharMira();
    this.desenharLinhaDeMovimento();
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
    const porAcao = new Map(this.slots.map((s) => {
      const espera = Math.max(0, s.livreNaRodada - this.ordem.rodada());
      const indisponivel = espera > 0 || (this.ordem.emCombate() && (!minhaVez || vez!.acaoUsada));
      return [s.acao.id, {
        selecionada: this.escolhida?.id === s.acao.id,
        indisponivel, gastou: s.gastou, esperaTurnos: espera,
      }] as const;
    }));
    this.hud.atualizarSlots(porAcao);
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
      if (b.pips) {
        b.pips.setPosition(b.sprite.x, b.sprite.y - 36);
        if (agora > b.mostrarAte && b.pips.alpha > 0) {
          b.pips.setAlpha(Math.max(0, b.pips.alpha - 0.04));
        }
      }
      // condicoes nunca desbotam sozinhas (diferente dos pips de dano) -
      // elas representam um estado que continua valendo, so seguem o bicho.
      b.condicoesUI?.setPosition(b.sprite.x, b.sprite.y - 46);
    });
    this.heroiCondicoesUI?.setPosition(this.heroi.x, this.heroi.y - 46);
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
