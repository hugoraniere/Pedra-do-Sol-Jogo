/** O mundo jogavel. Monta o chao, os objetos, as pessoas e o heroi,
 *  e cuida de andar, esbarrar e conversar. */
import Phaser from "phaser";
import { TILE, SOLIDOS, COR, ALTURA_PERSONAGEM, escalaDoSprite, direcaoDe, type NomeDirecao } from "../dados/config";
import { MAPAS, VILA, montarChao, bordasDeGrama, plantarMata, Mapa, Saida, type Pessoa } from "../dados/mapas";
import { acharCriatura, spriteDoGoblin } from "../dados/conteudo";
import { DIALOGOS, type Escolha } from "../dados/dialogos";
import { concluirEtapa } from "../sistemas/missoes";
import {
  estado, salvar, marcarVisitado, foiDerrotado,
  foiAcesa, acenderFogueira, ultimaFogueiraAcesa,
} from "../sistemas/estado";
import type { Encontro } from "./Combate";
import { Controles } from "../sistemas/controles";
import { camadasDoHeroi, criarAnimacoes, Heroi } from "../sistemas/heroi";
import { COLCHAO, PONTOS } from "../dados/sons";
import { refazerAoRedimensionar } from "../sistemas/visao";
import {
  calarAmbiente, montarAmbiente, musica, ouvirDe, passo, soltarPassaros, tocar,
  type FonteDeSom,
} from "../sistemas/som";
import {
  alisarCaminho, avancarPonto, encontrarCaminho, estaBloqueado, marcarBloqueado, novaMalha,
  type Celula, type Malha,
} from "../sistemas/caminho";
import { definirEstado } from "../sistemas/cursor";
import { avancarRelogio, corDoCeu, periodoAtual } from "../sistemas/tempo";
import type { Periodo } from "../dados/tempo";

type FichaObjeto = { w: number; h: number; cw: number; ch: number };
/** x,y e o CENTRO da caixa de verdade do alvo (nao um ponto arbitrario perto
 *  dele), largura/altura vem da ficha de verdade do objeto ou do tamanho do
 *  personagem. A mesma caixa serve para o acerto do clique, para o cursor
 *  de hover e para o destaque laranja: os tres sempre concordam sobre o
 *  que e "isto aqui". Antes disso, um objeto largo como o varal (48 px) so
 *  acertava clicando bem no meio de um circulo de 12 px de raio — quase
 *  toda a area visivel dele errava, e caia na caixa solida por baixo,
 *  travando o clique-no-chao tambem. */
type Interagivel = {
  x: number; y: number; chave: string; tipo: "pessoa" | "objeto";
  largura: number; altura: number;
  /** o sprite de verdade, para o destaque copiar textura, quadro e origem
   *  dele — nunca desenhar um retangulo generico por cima. */
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  /** posicao em TILE (nao pixel), so preenchida pra objetos do mapa. Existe
   *  pra distinguir instancias do mesmo `nome` (varias fogueiras no mesmo
   *  mapa sao indistinguiveis so pelo `chave`) sem precisar de indice de
   *  array, que nao e estavel entre `mapa.objetos` e o array plantado. */
  tileX?: number; tileY?: number;
};
type Ponto = { x: number; y: number };

/** Um bicho plantado no mapa, com a chave estavel que o marca como derrotado
 *  em `estado()` e o corpo que precisa sumir junto quando ele perde a luta. */
type CriaturaViva = {
  sprite: Phaser.GameObjects.Sprite;
  corpo: Phaser.GameObjects.Rectangle;
  id: string;
  chave: string;
  /** copiado da ficha (dados/conteudo.ts) na hora de nascer, pra nao
   *  procurar no BESTIARIO de novo a cada frame. undefined = sempre presente. */
  presencaPeriodos?: Periodo[];
};

/** Um NPC com rotina (ver `Pessoa.rotina` em dados/mapas.ts): quem ja anda
 *  sozinho de um ponto a outro quando o periodo do dia muda, reusando o
 *  mesmo A* que o clique do heroi usa (sistemas/caminho.ts). NPC sem rotina
 *  nunca vira um destes — continua puro `Interagivel` parado, como sempre foi. */
type NpcComRotina = {
  pessoa: Pessoa;
  sprite: Phaser.GameObjects.Sprite;
  corpo: Phaser.GameObjects.Rectangle;
  /** o mesmo objeto que esta (ou nao) em `this.interagiveis` — atualizado a
   *  cada passo, senao clique e destaque mirariam onde o NPC estava antes de
   *  comecar a andar. */
  interagivel: Interagivel;
  direcaoAtual: NomeDirecao;
  caminho?: Ponto[];
  escondido: boolean;
};

/** A quantas casas um goblin nota o heroi e o combate comeca. Mesma ideia do
 *  Provador (`docs/plano-do-combate.md`), numero proprio porque aqui e o
 *  mundo aberto quem decide, nao a arena. */
const DISTANCIA_DE_ENCONTRO = 3;

/** folga em volta da caixa DE VERDADE do alvo, so para o acerto do
 *  ponteiro. Sem isto, tocar 1 px fora da borda visivel de um bau ou de um
 *  personagem magro conta como "errou", e ninguem acerta isso de proposito
 *  com o dedo. Nao mexe no TAMANHO guardado em cada interagivel — so no
 *  quanto o teste de acerto perdoa para alem dele. */
const FOLGA_PONTEIRO = 6;
/** distancia, em px logicos, dentro da qual o heroi consegue agir sobre um
 *  interagivel: falar, abrir o bau. A mesma regua serve para o botao A (que
 *  mede a partir da frente do heroi) e para o clique (que mede do heroi
 *  ate o alvo, chegando por qualquer lado). */
const ALCANCE_ACAO = 18;
/** um toque/clique fica "indeciso" ate um dos dois limiares estourar: rapido
 *  e sem sair do lugar e toque (anda ate ali por caminho); qualquer um dos
 *  dois passando do limiar vira segurar (anda direto, sem caminho, na
 *  direcao de onde o dedo esta agora). Sem essa espera, um segurar-parado
 *  e um toque comecam exatamente iguais e nao tem como saber qual e qual
 *  antes do dedo se mexer ou do tempo passar. */
const LIMIAR_SEGURAR_MS = 150;
const LIMIAR_ARRASTO_PX = 6;
/** perto demais do heroi, a direcao de segurar treme: o tremor do dedo vira
 *  uma direcao normalizada valida, e o heroi vibra parado no lugar. */
const ZONA_MORTA_SEGURAR = 6;
/** as oito direcoes de 1 px que fazem o contorno do destaque: a mesma
 *  ideia de contorno_alfa em arte/desenho.py, so que em tempo real, com
 *  copias do sprite em vez de pixel a pixel. */
const DESLOQUES_CONTORNO: [number, number][] = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

export class Mundo extends Phaser.Scene {
  private heroi!: Heroi;
  private controles!: Controles;
  private interagiveis: Interagivel[] = [];
  private conversando = false;
  private solidos!: Phaser.Physics.Arcade.StaticGroup;
  private chao!: Phaser.Tilemaps.TilemapLayer;
  private saidas: Saida[] = [];
  private trocandoDeMapa = false;
  private malha!: Malha;
  /** o caminho que o clique tracou, em pontos de mundo, do proximo ao ultimo.
   *  Sem isto, undefined: o heroi anda so pelo teclado/toque/disco. */
  private caminho?: Ponto[];
  /** o interagivel esperando o heroi chegar perto, se o clique foi nele. */
  private acaoPendente?: Interagivel;
  private distanciaDoAlvo = Infinity;
  private semAvancarDesde = 0;
  /** true do pointerdown ao pointerup, so quando a pressao comecou no mundo
   *  (nao na UI, nao durante uma fala). */
  private pressionando = false;
  /** true depois que a pressao vira "segurar": anda direto, e o toque no
   *  soltar nao conta mais como clique. */
  private segurando = false;
  private pressionadoDesde = 0;
  private pressionadoEmX = 0;
  private pressionadoEmY = 0;
  /** true logo depois que uma fala fecha com o botao de acao ainda
   *  segurado: bloqueia abrir outra fala ate o botao ser solto uma vez. */
  private esperandoSoltarAcao = false;
  /** O contorno laranja em volta de quem esta ao alcance de acao AGORA: oito
   *  copias do PROPRIO sprite do alvo, tingidas de laranja e deslocadas 1 px
   *  em cada direcao, desenhadas atras do sprite de verdade. E a mesma
   *  tecnica de silhueta que o resto do jogo usa (arte/desenho.py,
   *  contorno_alfa) — nunca um retangulo generico, porque um retangulo nao
   *  hospeda a forma de um poco ou de um personagem, so a caixa dele. */
  private destaqueCopias: Phaser.GameObjects.Image[] = [];
  private criaturas: CriaturaViva[] = [];
  /** Trava so o ANDAR LIVRE e a deteccao de encontro/saida — nao pausa a
   *  cena. Se a cena pausasse (scene.pause), o mundo dela de fisica tambem
   *  parava de avancar, e o heroi que o Combate move deixaria de andar de
   *  verdade na tela, mesmo com a velocidade sendo escrita no corpo dele.
   *  Ver docs/plano-do-combate.md, secao 3.6: o combate acontece NESTE
   *  mundo, nunca troca de cena nem de mapa. */
  private emCombate = false;

  /** O ceu de dia/noite: um retangulo preso a camera, por cima do mapa
   *  inteiro. Ver Parte B do plano — a cor/alpha vem de sistemas/tempo.ts. */
  private overlayCeu!: Phaser.GameObjects.Rectangle;
  /** So os NPCs que tem `rotina` em mapas.ts entram aqui; o resto continua
   *  100% parado, sem custo nenhum a mais. */
  private npcs: NpcComRotina[] = [];
  private ultimoPeriodo?: Periodo;
  /** px por ms. Mais devagar que o heroi (VELOCIDADE em config.ts e px/s) —
   *  ninguem precisa correr pra trocar de lugar entre um periodo e outro. */
  private readonly VELOCIDADE_NPC = 0.03;

  /** De onde o heroi entra. Vazio quer dizer "a entrada de sempre do mapa";
   *  quem chega de outro lugar manda o tile pelo qual apareceu. */
  private entradaForcada?: { x: number; y: number };

  constructor() {
    super("Mundo");
  }

  init(dados?: { entrada?: { x: number; y: number } }) {
    this.entradaForcada = dados?.entrada;
  }

  create() {
    const st0 = estado();
    // Qual mapa carregar sai do estado, nao de um import fixo: e o que permite
    // o jogo ter mais de um lugar e voltar para onde o jogador parou.
    const mapaAtual: Mapa = MAPAS[st0.cena] ?? VILA;
    criarAnimacoes(this, [
      ...camadasDoHeroi(st0.heroi).map((c) => c.chave),
      ...mapaAtual.pessoas.map((p) => `npc-${p.sprite}`),
      // so as criaturas que este mapa realmente tem; goblin varia o corpo
      // por posicao (ver spriteDoGoblin em dados/conteudo.ts)
      ...(mapaAtual.criaturas ?? []).map((b) => b.id === "goblin" ? spriteDoGoblin(b.x, b.y) : acharCriatura(b.id)?.sprite ?? b.id),
    ]);
    this.controles = new Controles(this);
    this.interagiveis = [];
    this.conversando = false;
    this.solidos = this.physics.add.staticGroup();
    // oito copias escondidas, prontas para copiar textura/quadro/origem de
    // quem estiver em destaque a cada quadro. A textura aqui e so um
    // marcador de partida (precisa de uma que ja exista): atualizarDestaque
    // troca por assets/ui.png antes de qualquer uma ficar visivel.
    // setTintFill, nunca setTint: setTint MULTIPLICA a cor pela textura, e
    // todo sprite do jogo ja tem contorno preto de 1 px desenhado (a
    // convencao do projeto inteiro) — preto vezes laranja continua preto.
    // setTintFill ignora a cor original e pinta a silhueta inteira (tudo
    // que nao e transparente) de uma cor solida so.
    this.destaqueCopias = Array.from({ length: 8 }, () =>
      this.add.image(0, 0, "ui", 0).setVisible(false).setTintFill(COR.brasa)
    );

    const mapa: Mapa = mapaAtual;
    this.saidas = mapa.saidas ?? [];
    this.trocandoDeMapa = false;
    const fichas = this.cache.json.get("objetos") as Record<string, FichaObjeto>;

    // ---------------------------------------------------------- chao
    const chao = montarChao(mapa.chao);
    const tilemap = this.make.tilemap({ data: chao, tileWidth: TILE, tileHeight: TILE });
    const tiles = tilemap.addTilesetImage("tileset")!;
    const camada = tilemap.createLayer(0, tiles, 0, 0)!;
    camada.setCollision(SOLIDOS);
    camada.setDepth(-1000);
    this.chao = camada;

    // As beiras: onde a grama avanca sobre o vizinho, para o encontro dos dois
    // parar de ser um corte reto de 16 px. E uma segunda camada, quase toda
    // vazia (-1 nao desenha nada), no MESMO tileset. Fica acima do chao e
    // abaixo de tudo que anda por cima dele, entao a profundidade e so um
    // tico maior que a do chao, nunca positiva: pessoa e objeto usam
    // `setDepth(y)`, e uma beira nao pode competir com quem esta em pe nela.
    const bordas = bordasDeGrama(chao);
    const tilemapBordas = this.make.tilemap({ data: bordas, tileWidth: TILE, tileHeight: TILE });
    const tilesBordas = tilemapBordas.addTilesetImage("tileset")!;
    tilemapBordas.createLayer(0, tilesBordas, 0, 0)!.setDepth(-999);

    // ------------------------------------------------------- objetos
    // Os objetos escritos a mao sao os marcos. A mata e o enfeite de chao vem
    // de plantarMata(), que le a letra T do desenho: sem isso a floresta teria
    // umas oitocentas arvores escritas na unha em mapas.ts.
    const pecas = [...mapa.objetos, ...plantarMata(mapa.chao, mapa.objetos)];
    pecas.forEach((peca) => {
      const ficha = fichas?.[peca.nome];
      if (!ficha) return;
      // ancorado pelo pe: a base do objeto encosta no tile indicado
      const x = peca.x * TILE + TILE / 2;
      const y = peca.y * TILE + TILE;
      const s = this.add.image(x, y, `obj-${peca.nome}`).setOrigin(0.5, 1);
      s.setDepth(y);
      if (peca.solido !== false && ficha.cw > 0) {
        const corpo = this.add.rectangle(x, y - ficha.ch / 2, ficha.cw, ficha.ch);
        this.solidos.add(corpo);
        (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      }
      // fogueira nao tem entrada em DIALOGOS: a fala dela depende de QUAL
      // instancia e se ja foi acesa, decidido em tentarInteragir() antes do
      // lookup generico — ver o caso especial la
      if (DIALOGOS[peca.nome] || peca.nome === "fogueira") {
        // a caixa de verdade: centro (x, y - h/2) porque a origem do sprite
        // e (0.5, 1), o pe dele, e o desenho sobe `ficha.h` px a partir dali
        this.interagiveis.push({
          x, y: y - ficha.h / 2, chave: peca.nome, tipo: "objeto",
          largura: ficha.w, altura: ficha.h, obj: s,
          tileX: peca.x, tileY: peca.y,
        });
      }
    });

    // --------------------------------------------------- som do lugar
    // Uma fonte de som e um objeto do mapa que ja existe, nao um marcador novo:
    // a fogueira que se ve e a fogueira que se ouve. Por isso a lista sai de
    // PONTOS cruzada com mapa.objetos, e nao de coordenada escrita a mao.
    const fontes: FonteDeSom[] = [];
    PONTOS.forEach((ponto) => {
      if (ponto.tile) {
        fontes.push({
          som: ponto.som,
          x: ponto.tile.x * TILE + TILE / 2,
          y: ponto.tile.y * TILE + TILE / 2,
          alcance: ponto.alcance * TILE,
        });
        return;
      }
      mapa.objetos
        .filter((peca) => peca.nome === ponto.objeto)
        .forEach((peca) =>
          fontes.push({
            som: ponto.som,
            x: peca.x * TILE + TILE / 2,
            y: peca.y * TILE + TILE,
            alcance: ponto.alcance * TILE,
          })
        );
    });
    montarAmbiente(COLCHAO.vila, fontes);
    soltarPassaros(this);
    musica(this, "vila");

    // ------------------------------------------------------- pessoas
    // Quem tem `rotina` nasce ja no ponto certo pro periodo atual do save
    // (nunca no x,y do mapa por padrao) — senao o jogador que carrega o jogo
    // de noite veria todo mundo de dia por um instante, ate o primeiro
    // quadro trocar de lugar.
    this.ultimoPeriodo = periodoAtual();
    this.npcs = [];
    mapa.pessoas.forEach((pessoa) => {
      const alvoInicial = pessoa.rotina?.[this.ultimoPeriodo!];
      const escondidoInicial = alvoInicial === "escondido";
      const pos = alvoInicial && alvoInicial !== "escondido" ? alvoInicial : { x: pessoa.x, y: pessoa.y };
      const x = pos.x * TILE + TILE / 2;
      const y = pos.y * TILE + TILE;
      const s = this.add.sprite(x, y, `npc-${pessoa.sprite}`, 0).setOrigin(0.5, 1);
      s.setDepth(y);
      s.setVisible(!escondidoInicial);
      s.play(`npc-${pessoa.sprite}-parado-baixo`, true);
      const corpo = this.add.rectangle(x, y - 4, 10, 8);
      this.solidos.add(corpo);
      (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      if (escondidoInicial) (corpo.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      const interagivel: Interagivel = {
        x, y: y - ALTURA_PERSONAGEM / 2, chave: pessoa.quem, tipo: "pessoa",
        largura: TILE, altura: ALTURA_PERSONAGEM, obj: s,
      };
      if (!escondidoInicial) this.interagiveis.push(interagivel);
      if (pessoa.rotina) {
        this.npcs.push({ pessoa, sprite: s, corpo, interagivel, direcaoAtual: "baixo", escondido: escondidoInicial });
      }
      // a respiracao agora e quadro de animacao, nao tween de escala
    });

    // ------------------------------------------------------ criaturas
    // Presenca, e so. Elas ficam paradas respirando no lugar; quem faz o
    // goblin brigar de verdade e `conferirEncontro()`, mais abaixo. As outras
    // (aranha, lobo de nevoa) ainda so decoram: o combate ainda so sabe lutar
    // contra goblin, ver `Combate.ts`.
    this.criaturas = [];
    (mapa.criaturas ?? []).forEach((bicho, i) => {
      const chave = `${st0.cena}:${i}`;
      if (foiDerrotado(chave)) return;
      const ficha = acharCriatura(bicho.id);
      if (!ficha) return;
      const spriteChave = bicho.id === "goblin" ? spriteDoGoblin(bicho.x, bicho.y) : ficha.sprite;
      const x = bicho.x * TILE + TILE / 2;
      const y = bicho.y * TILE + TILE;
      const s = this.add.sprite(x, y, spriteChave, 0).setOrigin(0.5, 1).setScale(escalaDoSprite(spriteChave));
      s.setDepth(y);
      s.play(`${spriteChave}-parado-baixo`, true);
      const corpo = this.add.rectangle(x, y - 4, 10, 8);
      this.solidos.add(corpo);
      (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      if (ficha.presencaPeriodos && !ficha.presencaPeriodos.includes(periodoAtual())) {
        s.setVisible(false);
        (corpo.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      }
      this.criaturas.push({ sprite: s, corpo, id: bicho.id, chave, presencaPeriodos: ficha.presencaPeriodos });
    });

    // ------------------------------------------------------- a malha
    // O que faz o heroi esbarrar tambem faz o clique desviar: a malha nasce
    // do MESMO chao e das MESMAS caixas de colisao que a fisica ja usa,
    // nunca de uma lista escrita a mao que poderia divergir na primeira
    // parede nova.
    this.malha = novaMalha(tilemap.width, tilemap.height);
    for (let ty = 0; ty < tilemap.height; ty++) {
      for (let tx = 0; tx < tilemap.width; tx++) {
        if (camada.getTileAt(tx, ty)?.collides) marcarBloqueado(this.malha, tx, ty);
      }
    }
    this.solidos.getChildren().forEach((corpo) => {
      const b = (corpo as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody;
      const x0 = Math.floor(b.x / TILE);
      const y0 = Math.floor(b.y / TILE);
      const x1 = Math.floor((b.x + b.width - 1) / TILE);
      const y1 = Math.floor((b.y + b.height - 1) / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) marcarBloqueado(this.malha, tx, ty);
      }
    });

    // --------------------------------------------------------- heroi
    const entrada = this.entradaForcada ?? mapa.entrada;
    this.heroi = new Heroi(
      this,
      entrada.x * TILE + TILE / 2,
      entrada.y * TILE + TILE,
      st0.heroi
    );
    this.physics.add.collider(this.heroi, camada);
    this.physics.add.collider(this.heroi, this.solidos);
    // o passo vem do chao, e quem sabe que chao e esse e o tilemap
    this.heroi.aoPassar(() => {
      const tile = this.chao.getTileAtWorldXY(this.heroi.x, this.heroi.y);
      passo(tile?.index ?? -1);
    });

    this.limitarCamera(tilemap.widthInPixels, tilemap.heightInPixels);
    this.cameras.main.startFollow(this.heroi, true, 0.14, 0.14);
    // a janela pode mudar de tamanho a qualquer momento, e com ela o quanto de
    // mundo cabe na tela. Os limites da camera dependem disso.
    refazerAoRedimensionar(this, () =>
      this.limitarCamera(tilemap.widthInPixels, tilemap.heightInPixels)
    );
    this.cameras.main.setBackgroundColor(COR.tinta);
    // zoom sempre 1: quem muda a visao e a resolucao do canvas, ver sistemas/visao.ts.
    // com zoom fracionario a grade de pixels sai do lugar e o mapa pisca ao andar.
    this.cameras.main.setZoom(1);
    // quem chegou de outro mapa entrou com a tela apagada: acende de volta
    if (this.entradaForcada) this.cameras.main.fadeIn(220, 0, 0, 0);
    this.cameras.main.setRoundPixels(true);
    this.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.heroi.body.setCollideWorldBounds(true);

    // ---------------------------------------------------- ceu de dia/noite
    // Preso a camera (setScrollFactor(0)), por cima do mapa inteiro e por
    // baixo da Interface: como Interface e outra Scene, lancada depois na
    // lista de main.ts, a ordem de cena ja resolve a sobreposicao sozinha,
    // sem precisar de depth cruzando cena. Cor/alpha vem de corDoCeu().
    this.overlayCeu = this.add
      .rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, COR.tinta, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(Number.MAX_SAFE_INTEGER);
    refazerAoRedimensionar(this, () =>
      this.overlayCeu.setSize(this.cameras.main.width, this.cameras.main.height)
    );
    this.atualizarCeu();

    this.scene.launch("Interface");
    this.scene.get("Interface").events.on("acao", () => this.tentarInteragir());
    this.scene.get("Interface").events.on("pausar", () => this.pausar());
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.aoPressionarNoMundo(p));
    this.input.on("pointerup", () => this.aoSoltarNoMundo());
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.atualizarCursorDoMundo(p));
    this.events.on("dialogo-fim", () => {
      this.conversando = false;
      // se o botao de acao ainda estiver segurado neste exato instante (o
      // mesmo aperto que fechou a fala, repetido pelo sistema operacional),
      // nao deixa reabrir na hora: exige soltar uma vez primeiro
      this.esperandoSoltarAcao = this.controles.acaoSegurada();
    });
    // sair do mundo solta os loops. A musica sobrevive: menu e titulo sao o
    // mesmo lugar do ponto de vista de quem joga, e recomecar a faixa se ouve.
    this.events.once("shutdown", () => calarAmbiente());
  }

  /**
   * Os limites da camera, cuidando do caso do mapa MENOR que a tela.
   *
   * A vila tem 576x384. Numa tela grande na visao LONGE o mundo visivel passa
   * disso, e ai o Phaser encosta o mapa no canto de cima a esquerda e deixa
   * fundo sobrando dos outros dois lados — justamente quando a vila inteira
   * caberia bonitinha no meio da tela.
   *
   * A correcao e nao deixar o limite ser menor que a camera: ele cresce ate o
   * tamanho da tela, centrado no mapa. Os limites da FISICA continuam sendo o
   * mapa de verdade, entao o heroi nao ganha permissao de andar no vazio.
   */
  private limitarCamera(mapaLargura: number, mapaAltura: number) {
    const cam = this.cameras.main;
    const largura = Math.max(mapaLargura, cam.width);
    const altura = Math.max(mapaAltura, cam.height);
    cam.setBounds(
      Math.round(-(largura - mapaLargura) / 2),
      Math.round(-(altura - mapaAltura) / 2),
      largura,
      altura
    );
  }

  pausar() {
    if (this.conversando) return;
    tocar("pausa-abre");
    this.heroi.mover(0, 0);
    this.scene.pause();
    this.scene.launch("Pausa");
  }

  /** Sem `alvoForcado`: o botao A e o espaco, que agem no que estiver na
   *  frente do heroi. Com `alvoForcado`: o clique, que ja escolheu QUEM,
   *  e so confere se o heroi chegou perto o bastante para valer. */
  private tentarInteragir(alvoForcado?: Interagivel) {
    if (this.conversando) return;
    let alvo = alvoForcado;
    if (alvo) {
      if (Phaser.Math.Distance.Between(this.heroi.x, this.heroi.y, alvo.x, alvo.y) >= ALCANCE_ACAO) {
        return;
      }
    } else {
      const frente = this.heroi.frente();
      alvo = this.interagiveis.find(
        (i) => Phaser.Math.Distance.Between(frente.x, frente.y, i.x, i.y) < ALCANCE_ACAO
      );
    }
    if (!alvo) return;
    // a fogueira e caso especial, antes do lookup generico: a fala dela
    // depende de QUAL instancia e se ja foi acesa, e o sistema de
    // variantes/condicao de dialogos.ts nao da conta disso (condicao e uma
    // closure sem argumento, fixada quando o modulo carrega — nao sabe em
    // tempo de carregamento qual fogueira vai ser tocada em tempo de jogo).
    if (alvo.chave === "fogueira" && alvo.tileX !== undefined && alvo.tileY !== undefined) {
      const chave = `${estado().cena}:${alvo.tileX},${alvo.tileY}`;
      const primeiraVez = !foiAcesa(chave);
      if (primeiraVez) tocar("salvou");
      // sempre, nao so na primeira vez: descansar aqui agora e o que faz
      // desta a fogueira de retorno, mesmo se outra ja tinha sido acesa antes
      acenderFogueira(chave);
      estado().coracoes = estado().coracoesMax;
      salvar();
      this.abrirFala(
        "A fogueira",
        primeiraVez
          ? ["Voce acende a fogueira.", "Se cair, e aqui que vai acordar agora."]
          : ["Ainda esta quentinha.", "O calor enche seus coracoes de novo."],
        "fogueira"
      );
      return;
    }
    const fala = DIALOGOS[alvo.chave];
    if (!fala) return;
    // a primeira variante cuja condicao falta ou bate e a que toca — ver o
    // comentario no topo de dados/dialogos.ts. O `??` de baixo e so uma rede
    // de seguranca: se ninguem escreveu uma variante sem condicao por
    // ultimo, ainda assim alguma fala abre, nunca um interagivel mudo.
    const variante =
      fala.variantes.find((v) => !v.condicao || v.condicao()) ??
      fala.variantes[fala.variantes.length - 1];
    variante.efeito?.();
    if (alvo.chave === "bau" && marcarVisitado("bau-vila")) {
      estado().moedas += 1;
      salvar();
      tocar("bau-abre");
      // a moeda vem depois da tampa, nao junto: dois sons no mesmo instante
      // viram um so, e o premio e justamente o segundo
      this.time.delayedCall(220, () => tocar("moeda"));
    }
    this.abrirFala(fala.quem, variante.linhas, alvo.chave, variante.escolhas);
  }

  private abrirFala(quem: string, linhas: string[], chave?: string, escolhas?: Escolha[]) {
    this.conversando = true;
    this.heroi.mover(0, 0);
    // a chave viaja junto porque e ela, e nao o nome na chapinha, que a
    // tabela VOZ usa para achar a altura da voz do personagem
    this.scene.get("Interface").events.emit("falar", { quem, linhas, cena: this, chave, escolhas });
  }

  update(_tempo: number, delta: number) {
    // consumida SEMPRE, mesmo em conversa: Interface tem a PROPRIA tecla de
    // acao, uma instancia independente da mesma tecla fisica, e Phaser so
    // zera "recem apertado" de uma tecla quando ALGUEM chama JustDown nela.
    // Se este `if (conversando) return` de baixo saisse na frente sem nunca
    // consumir a tecla, ela ficaria pendurada em "recem apertado" por toda a
    // conversa, e no frame em que a fala fechasse essa tecla velha reabriria
    // a MESMA fala na hora — o loop de Enter que nunca termina.
    const agiu = this.controles.acaoApertada();
    if (this.esperandoSoltarAcao && !this.controles.acaoSegurada()) {
      this.esperandoSoltarAcao = false;
    }
    if (this.emCombate) return; // quem manda no heroi agora e o Combate
    if (this.conversando) {
      this.heroi.mover(0, 0);
      return;
    }
    // ver o comentario em "dialogo-fim": segurar o botao de acao gera
    // repeticao de tecla do sistema, e cada repeticao conta como um aperto
    // novo. Sem este bloqueio, fechar uma fala com o dedo ainda em cima do
    // botao reabria a proxima na hora — o heroi continua parado bem do
    // lado do mesmo interagivel.
    if (agiu && !this.esperandoSoltarAcao) {
      this.cancelarCaminho();
      this.tentarInteragir();
    }
    if (this.controles.pausaApertada()) this.pausar();
    this.decidirSegurar();
    const d = this.controles.direcao();
    if (d.x !== 0 || d.y !== 0) {
      // teclado, disco ou botao A: cancelar e sagrado, o jogador manda na hora
      this.cancelarCaminho();
      this.heroi.mover(d.x, d.y);
    } else if (this.segurando) {
      this.moverSegurando();
    } else if (this.caminho) {
      this.avancarCaminho();
    } else {
      this.heroi.mover(0, 0);
    }
    this.heroi.atualizarProfundidade();
    this.atualizarDestaque();
    ouvirDe(this.heroi.x, this.heroi.y);
    this.conferirSaida();
    this.conferirEncontro();
    // o relogio e a rotina dos NPCs so andam quando o heroi tambem anda: os
    // dois `return` de cima (conversando, emCombate) ja cobrem essa pausa,
    // entao ninguem troca de lugar no meio de uma fala ou de uma luta.
    avancarRelogio(delta);
    this.atualizarRotinasDeNpc(delta);
    this.atualizarCeu();
  }

  /** A cor do ceu agora, por cima do mapa inteiro. Publico so porque a
   *  auditoria de UI (`ferramentas/auditar-ui.mjs`) precisa fixar o relogio
   *  antes do screenshot e forcar esta cor a acompanhar na hora, senao a
   *  troca so apareceria no quadro seguinte. */
  private atualizarCeu() {
    const { cor, alpha } = corDoCeu();
    this.overlayCeu.setFillStyle(cor, 1);
    this.overlayCeu.setAlpha(alpha);
  }

  /** So para `ferramentas/auditar-ui.mjs`: prende o relogio num horario fixo
   *  antes do screenshot. Sem isto, `ferramentas/telas/10-mundo.png` muda de
   *  tom a cada rodada de auditoria por causa da hora, nao da UI. */
  travarRelogioParaAuditoria(minuto: number) {
    // a cena existe registrada no scene manager mesmo fora do ar (titulo,
    // criacao...); so mexe no ceu se `create()` ja rodou de verdade.
    if (!this.overlayCeu) return;
    estado().relogio = minuto;
    this.atualizarCeu();
  }

  /** Move cada NPC com rotina para o ponto do periodo atual, reusando o
   *  A* do clique do heroi (sistemas/caminho.ts) — nao uma IA nova, so o
   *  mesmo caminho, andado por outro sprite. Ver Parte C do plano. */
  private atualizarRotinasDeNpc(delta: number) {
    const periodo = periodoAtual();
    const mudouPeriodo = periodo !== this.ultimoPeriodo;
    this.ultimoPeriodo = periodo;
    if (mudouPeriodo) {
      this.scene.get("Interface").events.emit("periodo-mudou", periodo);
      this.atualizarPresencaDeCriaturas(periodo);
    }
    this.npcs.forEach((npc) => {
      if (mudouPeriodo) this.tracarRotaDoNpc(npc, npc.pessoa.rotina![periodo]);
      if (!npc.caminho || npc.caminho.length === 0) return;
      const proximo = npc.caminho[0];
      const passo = avancarPonto({ x: npc.sprite.x, y: npc.sprite.y }, proximo, this.VELOCIDADE_NPC, delta);
      const dir = direcaoDe(proximo.x - npc.sprite.x, proximo.y - npc.sprite.y);
      if (dir) npc.direcaoAtual = dir;
      npc.sprite.setPosition(passo.x, passo.y);
      npc.sprite.setDepth(passo.y);
      npc.sprite.play(`npc-${npc.pessoa.sprite}-anda-${npc.direcaoAtual}`, true);
      npc.interagivel.x = passo.x;
      npc.interagivel.y = passo.y - ALTURA_PERSONAGEM / 2;
      if (passo.chegou) {
        npc.caminho.shift();
        if (npc.caminho.length === 0) this.finalizarRotaDoNpc(npc);
      }
    });
  }

  /** So chamada quando o periodo muda de verdade (ver atualizarRotinasDeNpc).
   *  Esconde/reexibe cada criatura com `presencaPeriodos` (dados/conteudo.ts)
   *  de acordo com o novo periodo — quem nao tem o campo nunca muda, sempre
   *  presente, igual o jogo sempre funcionou. Quem ja morreu de vez
   *  (`removerCriatura`) nem esta mais em `this.criaturas`, entao nunca
   *  ressuscita por engano aqui. */
  private atualizarPresencaDeCriaturas(periodo: Periodo) {
    this.criaturas.forEach((c) => {
      if (!c.presencaPeriodos) return;
      this.esconderCriatura(c.chave, c.presencaPeriodos.includes(periodo));
    });
  }

  /** Decide o que fazer quando o periodo muda: sumir, reaparecer, ou tracar
   *  caminho ate o novo ponto sobre `this.malha` (a mesma malha do heroi —
   *  ver o aviso sobre ela ficar parada no lugar de descanso de cada um, no
   *  plano). Sem caminho possivel, teleporta: melhor um pulo raro do que um
   *  NPC preso pro resto do jogo. */
  private tracarRotaDoNpc(npc: NpcComRotina, alvo: { x: number; y: number } | "escondido") {
    if (alvo === "escondido") {
      npc.caminho = undefined;
      this.esconderNpc(npc);
      return;
    }
    const destino = { x: alvo.x * TILE + TILE / 2, y: alvo.y * TILE + TILE };
    if (npc.escondido) {
      this.reaparecerNpc(npc, destino);
      return;
    }
    if (Math.round(npc.sprite.x) === Math.round(destino.x) && Math.round(npc.sprite.y) === Math.round(destino.y)) {
      return; // ja estava la — nada para andar
    }
    const origem: Celula = { tx: Math.floor(npc.sprite.x / TILE), ty: Math.floor(npc.sprite.y / TILE) };
    const bruto = encontrarCaminho(this.malha, origem, { tx: alvo.x, ty: alvo.y });
    if (!bruto) {
      this.moverNpcDireto(npc, destino);
      return;
    }
    const leve = alisarCaminho(this.malha, bruto);
    const pontos = leve.slice(1).map((c) => ({ x: c.tx * TILE + TILE / 2, y: c.ty * TILE + TILE }));
    if (pontos.length === 0) return;
    pontos[pontos.length - 1] = destino;
    npc.caminho = pontos;
    // ninguem trava atras de um vizinho andando: a colisao volta ao chegar
    (npc.corpo.body as Phaser.Physics.Arcade.StaticBody).enable = false;
  }

  private finalizarRotaDoNpc(npc: NpcComRotina) {
    npc.caminho = undefined;
    npc.sprite.play(`npc-${npc.pessoa.sprite}-parado-${npc.direcaoAtual}`, true);
    npc.corpo.setPosition(npc.sprite.x, npc.sprite.y - 4);
    const corpo = npc.corpo.body as Phaser.Physics.Arcade.StaticBody;
    corpo.enable = true;
    corpo.updateFromGameObject();
  }

  /** Sem caminho possivel ate o alvo: pula direto pra la em vez de ficar
   *  preso no lugar de descanso antigo pro resto do jogo. */
  private moverNpcDireto(npc: NpcComRotina, destino: Ponto) {
    npc.sprite.setPosition(destino.x, destino.y);
    npc.sprite.setDepth(destino.y);
    npc.sprite.play(`npc-${npc.pessoa.sprite}-parado-${npc.direcaoAtual}`, true);
    npc.corpo.setPosition(destino.x, destino.y - 4);
    (npc.corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    npc.interagivel.x = destino.x;
    npc.interagivel.y = destino.y - ALTURA_PERSONAGEM / 2;
  }

  private esconderNpc(npc: NpcComRotina) {
    if (npc.escondido) return;
    npc.escondido = true;
    npc.sprite.setVisible(false);
    (npc.corpo.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    const idx = this.interagiveis.indexOf(npc.interagivel);
    if (idx !== -1) this.interagiveis.splice(idx, 1);
  }

  private reaparecerNpc(npc: NpcComRotina, destino: Ponto) {
    npc.escondido = false;
    npc.sprite.setVisible(true);
    npc.sprite.setPosition(destino.x, destino.y);
    npc.sprite.setDepth(destino.y);
    npc.sprite.play(`npc-${npc.pessoa.sprite}-parado-${npc.direcaoAtual}`, true);
    npc.corpo.setPosition(destino.x, destino.y - 4);
    const corpo = npc.corpo.body as Phaser.Physics.Arcade.StaticBody;
    corpo.enable = true;
    corpo.updateFromGameObject();
    npc.interagivel.x = destino.x;
    npc.interagivel.y = destino.y - ALTURA_PERSONAGEM / 2;
    if (!this.interagiveis.includes(npc.interagivel)) this.interagiveis.push(npc.interagivel);
  }

  /** Chegou perto demais de uma criatura? O mundo para e a luta comeca.
   *
   *  Generico para o bestiario inteiro (`Combate.ts` monta a arena a partir
   *  da ficha de qualquer `bicharioId`) -- na pratica so goblin, aranha e
   *  lobo-de-nevoa tem instancia de verdade num mapa hoje (`dados/mapas.ts`),
   *  entao so eles brigam. */
  private conferirEncontro() {
    if (this.conversando || this.trocandoDeMapa) return;
    const hx = Math.floor(this.heroi.x / TILE);
    const hy = Math.floor((this.heroi.y - 1) / TILE);
    const perto = this.criaturas.filter((c) => {
      // escondida por horario (presencaPeriodos) nunca embosca ninguem
      if (!c.sprite.visible) return false;
      const cx = Math.floor(c.sprite.x / TILE);
      const cy = Math.floor((c.sprite.y - 1) / TILE);
      return Math.hypot(cx - hx, cy - hy) <= DISTANCIA_DE_ENCONTRO;
    });
    if (perto.length === 0) return;
    this.iniciarCombate(perto);
  }

  private iniciarCombate(alvos: CriaturaViva[]) {
    this.heroi.mover(0, 0);
    const encontro: Encontro = alvos.map((a) => ({ id: a.id, chave: a.chave }));
    this.emCombate = true;
    // some com quem entrou na luta: o Combate poe uma versao propria dele,
    // no MESMO lugar, com corpo de fisica pra golpe e recuo. O original
    // decorativo so volta a aparecer se sair derrotado (nunca: e destruido
    // de vez) ou se o jogador fugir (hoje nao existe fuga, so vitoria).
    alvos.forEach((a) => this.esconderCriatura(a.chave, false));
    this.scene.pause("Interface");
    this.scene.setVisible(false, "Interface");
    this.scene.launch("Combate", { encontro });
  }

  /** O que `Combate.ts` pede emprestado para lutar NESTE mundo, nunca no
   *  proprio: o heroi de verdade e a camada de chao de verdade. Ver
   *  docs/plano-do-combate.md, secao 3.6. */
  contexto() {
    return { heroi: this.heroi, chao: this.chao };
  }

  /** Onde essa criatura esta parada agora, em casas — pra a luta comecar
   *  exatamente ali, nunca num posto fixo de arena. */
  casaDaCriatura(chave: string): { tx: number; ty: number } | undefined {
    const c = this.criaturas.find((x) => x.chave === chave);
    if (!c) return undefined;
    return { tx: Math.floor(c.sprite.x / TILE), ty: Math.floor((c.sprite.y - 1) / TILE) };
  }

  /** Esconde (ou reexibe) a criatura decorativa — enquanto a versao de
   *  combate dela briga por cima, ou porque o horario mudou
   *  (`presencaPeriodos`, ver atualizarPresencaDeCriaturas). O corpo de
   *  colisao anda junto: escondida sem desligar o corpo virava parede
   *  invisivel. */
  esconderCriatura(chave: string, visivel: boolean) {
    const c = this.criaturas.find((x) => x.chave === chave);
    if (!c) return;
    c.sprite.setVisible(visivel);
    (c.corpo.body as Phaser.Physics.Arcade.StaticBody).enable = visivel;
  }

  /** Ela perdeu a luta de vez: tira do mapa e da lista, pra nao sobrar
   *  fantasma quando o Combate devolver o controle. */
  removerCriatura(chave: string) {
    const c = this.criaturas.find((x) => x.chave === chave);
    if (!c) return;
    c.sprite.destroy();
    c.corpo.destroy();
    this.criaturas = this.criaturas.filter((x) => x !== c);
  }

  /** O tamanho do mundo em pixel, pra Combate.ts limitar a propria camera
   *  ao mesmo mapa (nunca aos limites de uma arena separada). */
  limites() {
    return { largura: this.chao.tilemap.widthInPixels, altura: this.chao.tilemap.heightInPixels };
  }

  /** Chamado pelo Combate quando a luta acaba. Devolve o controle sem
   *  nenhum scene.resume: o Mundo nunca chegou a pausar de verdade. */
  sairDeCombate() {
    this.emCombate = false;
    this.scene.setVisible(true, "Interface");
    this.scene.resume("Interface");
  }

  /** Chamado pelo Combate quando os coracoes chegam a zero. Fecha a luta e
   *  acorda o heroi na ultima fogueira acesa — que pode estar num mapa
   *  diferente de onde ele caiu, entao troca `estado().cena` como qualquer
   *  saida de mapa (`conferirSaida()`) e reusa o mesmo `entradaForcada`. So
   *  as moedas se perdem; missao, pista, afinidade e selo sao conhecimento e
   *  nunca somem. */
  acordarNaFogueira() {
    this.sairDeCombate();
    const chave = ultimaFogueiraAcesa();
    const [cenaAlvo, coords] = chave.split(":");
    const [tx, ty] = coords.split(",").map(Number);
    const st = estado();
    st.moedas = 0;
    st.coracoes = st.coracoesMax;
    st.cena = cenaAlvo;
    st.lugar = MAPAS[cenaAlvo]?.lugar ?? st.lugar;
    salvar();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.restart({ entrada: { x: tx, y: ty } });
    });
  }

  // ----------------------------------------------------------- o clique
  /** Um clique/toque no mundo pertence a UI, nunca ao mundo, se algum
   *  objeto interativo da cena Interface esta sob o ponteiro agora. Sem
   *  isto, clicar na engrenagem tambem mandaria o heroi andar ate ela. */
  private ehDaInterface(p: Phaser.Input.Pointer): boolean {
    const interface_ = this.scene.get("Interface");
    return !!interface_?.input && interface_.input.hitTestPointer(p).length > 0;
  }

  /** O mundo tem varias cenas por cima (Interface, Ponteiro), cada uma com a
   *  propria camera, e o Pointer do Phaser e UM objeto so, compartilhado.
   *  `pointer.worldX/worldY` guarda a ultima camera que o transformou — se
   *  Interface ou Ponteiro mexerem nele depois do Mundo (e mexem: vem
   *  depois na lista de cenas), o numero vira coordenada da camera delas,
   *  sem scroll nenhum, e o clique acerta um lugar errado do mapa. Por isso
   *  aqui SEMPRE se pede o ponto pela camera do proprio Mundo. */
  private mundoXY(p: Phaser.Input.Pointer): { x: number; y: number } {
    const ponto = this.cameras.main.getWorldPoint(p.x, p.y);
    return { x: ponto.x, y: ponto.y };
  }

  /** Redesenha o contorno laranja em volta de quem esta ao alcance de acao
   *  AGORA — o mesmo ALCANCE_ACAO que decide se o botao A ou o clique agem,
   *  entao o contorno nunca promete uma acao que o jogo depois recusa. Se
   *  mais de um interagivel estiver perto, destaca so o mais perto; andando
   *  para longe de todos, o contorno some. */
  private atualizarDestaque() {
    let melhor: Interagivel | undefined;
    let melhorDist = ALCANCE_ACAO;
    if (!this.conversando) {
      for (const i of this.interagiveis) {
        const d = Phaser.Math.Distance.Between(this.heroi.x, this.heroi.y, i.x, i.y);
        if (d < melhorDist) {
          melhorDist = d;
          melhor = i;
        }
      }
    }
    if (!melhor) {
      this.destaqueCopias.forEach((c) => c.setVisible(false));
      return;
    }
    const alvo = melhor.obj;
    this.destaqueCopias.forEach((copia, i) => {
      const [dx, dy] = DESLOQUES_CONTORNO[i];
      copia
        .setTexture(alvo.texture.key, alvo.frame.name)
        .setOrigin(alvo.originX, alvo.originY)
        .setPosition(Math.round(alvo.x) + dx, Math.round(alvo.y) + dy)
        .setFlipX(alvo.flipX)
        .setDepth(alvo.depth - 0.5)
        .setVisible(true);
    });
  }

  /** O dedo/mouse desceu no mundo. Ainda nao decide nada: so guarda onde e
   *  quando, para `decidirSegurar()` comparar a cada quadro. */
  private aoPressionarNoMundo(p: Phaser.Input.Pointer) {
    if (this.conversando || this.ehDaInterface(p)) return;
    const ponto = this.mundoXY(p);
    this.pressionando = true;
    this.segurando = false;
    this.pressionadoDesde = this.time.now;
    this.pressionadoEmX = ponto.x;
    this.pressionadoEmY = ponto.y;
  }

  /** O dedo/mouse subiu. Se a pressao nunca virou "segurar", foi um toque de
   *  verdade: o mesmo clique de sempre, andar ate o chao ou ate perto de
   *  quem/o que foi tocado. Se ja tinha virado segurar, so termina de andar
   *  direto — nao clica em nada, porque a pessoa estava arrastando. */
  private aoSoltarNoMundo() {
    if (!this.pressionando) return; // a pressao nao comecou no mundo
    const eraSegurar = this.segurando;
    this.pressionando = false;
    this.segurando = false;
    if (eraSegurar || this.conversando) return;
    const alvo = this.interagiveis.find((i) =>
      this.dentroDoAlvo(this.pressionadoEmX, this.pressionadoEmY, i)
    );
    if (alvo) {
      this.irEAgir(alvo);
      return;
    }
    this.irPara(this.pressionadoEmX, this.pressionadoEmY);
  }

  /** A cada quadro com o dedo/mouse ainda baixo: passou de um dos dois
   *  limiares (tempo ou arrasto), a pressao vira "segurar" — cancela
   *  qualquer caminho tracado e, dai em diante, quem anda e
   *  `moverSegurando()`, nao mais o clique do soltar. */
  private decidirSegurar() {
    if (!this.pressionando || this.segurando) return;
    const p = this.input.activePointer;
    if (!p.isDown) {
      // rede de seguranca: se o pointerup nao chegou (perdeu o foco da
      // janela com o botao apertado, por exemplo), nao fica preso pressionando
      this.pressionando = false;
      return;
    }
    const agora = this.mundoXY(p);
    const arrastou =
      Phaser.Math.Distance.Between(agora.x, agora.y, this.pressionadoEmX, this.pressionadoEmY) >
      LIMIAR_ARRASTO_PX;
    const segurou = this.time.now - this.pressionadoDesde > LIMIAR_SEGURAR_MS;
    if (arrastou || segurou) {
      this.segurando = true;
      this.cancelarCaminho();
    }
  }

  /** Segurar nunca usa caminho: o heroi anda direto na direcao de onde o
   *  dedo esta AGORA, recalculada a cada quadro. E o gesto que nao pode
   *  falhar — nao ha A* para desviar de nada, entao nao ha o que travar —
   *  e por isso ele e o direcional de sempre sem desenho na tela: o dedo e
   *  o direcional, e o centro dele e o proprio heroi. */
  private moverSegurando() {
    const ponto = this.mundoXY(this.input.activePointer);
    const dx = ponto.x - this.heroi.x;
    const dy = ponto.y - this.heroi.y;
    if (dx * dx + dy * dy < ZONA_MORTA_SEGURAR * ZONA_MORTA_SEGURAR) {
      this.heroi.mover(0, 0);
      return;
    }
    this.heroi.mover(dx, dy);
  }

  /** O ponto (px,py) caiu dentro da caixa de verdade do alvo, com uma folga
   *  a mais para o dedo/mouse nunca precisar acertar o pixel exato? Usada
   *  pelo clique e pelo hover do cursor — os dois sempre concordam, porque
   *  os dois perguntam a MESMA caixa. */
  private dentroDoAlvo(px: number, py: number, alvo: Interagivel): boolean {
    return (
      px > alvo.x - alvo.largura / 2 - FOLGA_PONTEIRO &&
      px < alvo.x + alvo.largura / 2 + FOLGA_PONTEIRO &&
      py > alvo.y - alvo.altura / 2 - FOLGA_PONTEIRO &&
      py < alvo.y + alvo.altura / 2 + FOLGA_PONTEIRO
    );
  }

  private atualizarCursorDoMundo(p: Phaser.Input.Pointer) {
    if (this.conversando || this.ehDaInterface(p)) return;
    const { x: wx, y: wy } = this.mundoXY(p);
    const alvo = this.interagiveis.find((i) => this.dentroDoAlvo(wx, wy, i));
    if (alvo) {
      definirEstado(alvo.tipo === "pessoa" ? "falar" : "olhar");
      return;
    }
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    definirEstado(estaBloqueado(this.malha, tx, ty) ? "bloqueado" : "andar");
  }

  /** clicou no chao: anda ate ali, sem agir em nada ao chegar */
  private irPara(wx: number, wy: number) {
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    if (estaBloqueado(this.malha, tx, ty)) return;
    this.tracarCaminho(tx, ty, wx, wy);
  }

  /** clicou num interagivel: anda ate perto e age ao chegar. O interagivel
   *  em si costuma estar bloqueado (bau, NPC: os dois tem caixa de colisao
   *  propria), entao o destino do CAMINHO e o tile livre mais perto dele,
   *  mas quem decide "chegou" e a distancia ate o interagivel de verdade,
   *  conferida a cada quadro em avancarCaminho — nao o fim do caminho. */
  private irEAgir(alvo: Interagivel) {
    const tx = Math.floor(alvo.x / TILE);
    const ty = Math.floor(alvo.y / TILE);
    const perto = this.tileLivreMaisPerto(tx, ty);
    if (!perto) return; // cercado por todo lado, ninguem chega
    this.tracarCaminho(perto.tx, perto.ty, perto.tx * TILE + TILE / 2, perto.ty * TILE + TILE / 2, alvo);
  }

  /** O tile livre mais perto de verdade de (tx,ty), nao so o primeiro achado
   *  varrendo anel por anel: varrer por anel e parar no primeiro pode
   *  devolver um tile mais longe do que outro no MESMO anel, so por causa da
   *  ordem do loop, e foi exatamente isso que deixava o destino do caminho
   *  mais longe do alvo do que ALCANCE_ACAO permite — o heroi chegava,
   *  parava, e a acao nunca disparava. */
  private tileLivreMaisPerto(tx: number, ty: number): Celula | null {
    if (!estaBloqueado(this.malha, tx, ty)) return { tx, ty };
    const RAIO_MAX = 4;
    let melhor: Celula | null = null;
    let melhorDist = Infinity;
    for (let dy = -RAIO_MAX; dy <= RAIO_MAX; dy++) {
      for (let dx = -RAIO_MAX; dx <= RAIO_MAX; dx++) {
        if (estaBloqueado(this.malha, tx + dx, ty + dy)) continue;
        const dist = dx * dx + dy * dy;
        if (dist < melhorDist) {
          melhorDist = dist;
          melhor = { tx: tx + dx, ty: ty + dy };
        }
      }
    }
    return melhor;
  }

  private tracarCaminho(destTx: number, destTy: number, ultimoX: number, ultimoY: number, acao?: Interagivel) {
    const origem: Celula = {
      tx: Math.floor(this.heroi.x / TILE),
      ty: Math.floor(this.heroi.y / TILE),
    };
    const bruto = encontrarCaminho(this.malha, origem, { tx: destTx, ty: destTy });
    if (!bruto) return;
    const leve = alisarCaminho(this.malha, bruto);
    // pula o primeiro ponto: e a propria casa onde o heroi ja esta parado
    const pontos = leve.slice(1).map((c) => ({ x: c.tx * TILE + TILE / 2, y: c.ty * TILE + TILE / 2 }));
    if (pontos.length > 0) pontos[pontos.length - 1] = { x: ultimoX, y: ultimoY };
    if (pontos.length === 0) {
      // ja estava no tile de destino: nada para andar, so a acao
      this.heroi.mover(0, 0);
      if (acao) this.tentarInteragir(acao);
      return;
    }
    this.caminho = pontos;
    this.acaoPendente = acao;
    this.distanciaDoAlvo = Infinity;
    this.semAvancarDesde = this.time.now;
  }

  private cancelarCaminho() {
    this.caminho = undefined;
    this.acaoPendente = undefined;
  }

  private avancarCaminho() {
    // a acao vale a cada quadro, nao so no fim do caminho: o destino tracado
    // e o tile livre mais perto do alvo, que pode ficar mais longe do alvo
    // do que o alcance de acao exige, ou mais perto, dependendo do desenho
    // do lugar. E a distancia ATE O ALVO que decide, nunca o fim do caminho.
    if (this.acaoPendente) {
      const a = this.acaoPendente;
      if (Phaser.Math.Distance.Between(this.heroi.x, this.heroi.y, a.x, a.y) < ALCANCE_ACAO) {
        this.caminho = undefined;
        this.acaoPendente = undefined;
        this.heroi.mover(0, 0);
        this.tentarInteragir(a);
        return;
      }
    }
    if (!this.caminho || this.caminho.length === 0) {
      this.finalizarCaminho();
      return;
    }
    const proximo = this.caminho[0];
    const dx = proximo.x - this.heroi.x;
    const dy = proximo.y - this.heroi.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) {
      this.caminho.shift();
      if (this.caminho.length === 0) this.finalizarCaminho();
      return;
    }
    // desiste sozinho se parar de progredir: nunca "andando contra a
    // parede para sempre". 0.4 px de folga contra o tremor do arredondamento.
    if (dist < this.distanciaDoAlvo - 0.4) {
      this.distanciaDoAlvo = dist;
      this.semAvancarDesde = this.time.now;
    } else if (this.time.now - this.semAvancarDesde > 400) {
      this.finalizarCaminho();
      return;
    }
    this.heroi.mover(dx, dy);
  }

  /** O caminho acabou, seja porque chegou ao fim ou porque desistiu por nao
   *  progredir. Se havia uma acao esperando, tenta mesmo assim:
   *  `tentarInteragir` ja confere a distancia sozinha e nao faz nada se
   *  ainda estiver longe demais. O importante e NUNCA deixar a acao
   *  pendurada esperando um quadro que nao vem mais — era esse esquecimento
   *  que fazia o heroi andar ate perto de alguem, parar, e a fala nunca
   *  abrir. */
  private finalizarCaminho() {
    this.caminho = undefined;
    this.heroi.mover(0, 0);
    if (this.acaoPendente) {
      const a = this.acaoPendente;
      this.acaoPendente = undefined;
      this.tentarInteragir(a);
    }
  }

  /** Encostou numa borda que leva a outro lugar? Entao troca de mapa.
   *
   *  A troca acontece com a tela esmaecendo, e nao de um quadro para o outro:
   *  corte seco em cima de uma tela cheia de arvore faz o jogador perder de
   *  vista o proprio heroi. */
  private conferirSaida() {
    if (this.trocandoDeMapa) return;
    const tx = Math.floor(this.heroi.x / TILE);
    const ty = Math.floor(this.heroi.y / TILE);
    const saida = this.saidas.find(
      (s) => tx >= s.x && tx < s.x + s.w && ty >= s.y && ty < s.y + s.h
    );
    if (!saida) return;
    const destino = MAPAS[saida.para];
    if (!destino) return;   // lugar ainda nao construido: a borda simplesmente nao leva a nada

    this.trocandoDeMapa = true;
    this.heroi.mover(0, 0);
    const st = estado();
    // a terceira etapa do sino se resolve sozinha andando ate la, sem fala
    // nem escolha — a mesma trilha que o guarda ja indica no dialogo dele
    if (st.cena === "vila" && saida.para === "floresta") {
      concluirEtapa("sino-da-vila", "seguir-para-floresta");
    }
    st.cena = saida.para;
    st.lugar = destino.lugar;
    salvar();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.restart({ entrada: saida.entrada });
    });
  }
}
