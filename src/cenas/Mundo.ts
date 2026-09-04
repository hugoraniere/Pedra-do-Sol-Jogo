/** O mundo jogavel. Monta o chao, os objetos, as pessoas e o heroi,
 *  e cuida de andar, esbarrar e conversar. */
import Phaser from "phaser";
import { TILE, SOLIDOS, COR } from "../dados/config";
import { MAPAS, VILA, montarChao, plantarMata, Mapa, Saida } from "../dados/mapas";
import { acharCriatura } from "../dados/conteudo";
import { DIALOGOS } from "../dados/dialogos";
import { estado, salvar, marcarVisitado } from "../sistemas/estado";
import { Controles } from "../sistemas/controles";
import { camadasDoHeroi, criarAnimacoes, Heroi } from "../sistemas/heroi";
import { COLCHAO, PONTOS } from "../dados/sons";
import {
  calarAmbiente, montarAmbiente, musica, ouvirDe, passo, soltarPassaros, tocar,
  type FonteDeSom,
} from "../sistemas/som";
import {
  alisarCaminho, encontrarCaminho, estaBloqueado, marcarBloqueado, novaMalha,
  type Celula, type Malha,
} from "../sistemas/caminho";
import { definirEstado } from "../sistemas/cursor";

type FichaObjeto = { w: number; h: number; cw: number; ch: number };
type Interagivel = { x: number; y: number; chave: string; tipo: "pessoa" | "objeto" };
type Ponto = { x: number; y: number };

/** distancia, em px logicos, dentro da qual o ponteiro "acha" um interagivel
 *  para hover e clique. Maior que o pixel exato do marcador, porque o dedo
 *  e o mouse nunca acertam o pixel certo. */
const RAIO_PONTEIRO = 12;
/** distancia, em px logicos, dentro da qual o heroi consegue agir sobre um
 *  interagivel: falar, abrir o bau. A mesma regua serve para o botao A (que
 *  mede a partir da frente do heroi) e para o clique (que mede do heroi
 *  ate o alvo, chegando por qualquer lado). */
const ALCANCE_ACAO = 18;

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
      // so as criaturas que este mapa realmente tem
      ...(mapaAtual.criaturas ?? []).map((b) => acharCriatura(b.id)?.sprite ?? b.id),
    ]);
    this.controles = new Controles(this);
    this.interagiveis = [];
    this.conversando = false;
    this.solidos = this.physics.add.staticGroup();

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
      if (DIALOGOS[peca.nome]) {
        this.interagiveis.push({ x, y: y - 8, chave: peca.nome, tipo: "objeto" });
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
    mapa.pessoas.forEach((pessoa) => {
      const x = pessoa.x * TILE + TILE / 2;
      const y = pessoa.y * TILE + TILE;
      const s = this.add.sprite(x, y, `npc-${pessoa.sprite}`, 0).setOrigin(0.5, 1);
      s.setDepth(y);
      s.play(`npc-${pessoa.sprite}-parado-baixo`, true);
      const corpo = this.add.rectangle(x, y - 4, 10, 8);
      this.solidos.add(corpo);
      (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      this.interagiveis.push({ x, y: y - 10, chave: pessoa.quem, tipo: "pessoa" });
      // a respiracao agora e quadro de animacao, nao tween de escala
    });

    // ------------------------------------------------------ criaturas
    // Presenca, e so. Elas ficam paradas respirando no lugar; andar, reagir e
    // brigar sao do sistema de combate, que ainda nao existe. Ate la o mundo ja
    // tem bicho dentro, que e o que permite ver se a arte e a escala funcionam.
    (mapa.criaturas ?? []).forEach((bicho) => {
      const ficha = acharCriatura(bicho.id);
      if (!ficha) return;
      const x = bicho.x * TILE + TILE / 2;
      const y = bicho.y * TILE + TILE;
      const s = this.add.sprite(x, y, ficha.sprite, 0).setOrigin(0.5, 1);
      s.setDepth(y);
      s.play(`${ficha.sprite}-parado-baixo`, true);
      const corpo = this.add.rectangle(x, y - 4, 10, 8);
      this.solidos.add(corpo);
      (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
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

    this.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.cameras.main.startFollow(this.heroi, true, 0.14, 0.14);
    this.cameras.main.setBackgroundColor(COR.tinta);
    // zoom sempre 1: quem muda a visao e a resolucao do canvas, ver sistemas/visao.ts.
    // com zoom fracionario a grade de pixels sai do lugar e o mapa pisca ao andar.
    this.cameras.main.setZoom(1);
    // quem chegou de outro mapa entrou com a tela apagada: acende de volta
    if (this.entradaForcada) this.cameras.main.fadeIn(220, 0, 0, 0);
    this.cameras.main.setRoundPixels(true);
    this.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.heroi.body.setCollideWorldBounds(true);

    this.scene.launch("Interface");
    this.scene.get("Interface").events.on("acao", () => this.tentarInteragir());
    this.scene.get("Interface").events.on("pausar", () => this.pausar());
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.aoClicarNoMundo(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.atualizarCursorDoMundo(p));
    this.events.on("dialogo-fim", () => {
      this.conversando = false;
    });
    // sair do mundo solta os loops. A musica sobrevive: menu e titulo sao o
    // mesmo lugar do ponto de vista de quem joga, e recomecar a faixa se ouve.
    this.events.once("shutdown", () => calarAmbiente());
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
    const fala = DIALOGOS[alvo.chave];
    if (!fala) return;
    if (alvo.chave === "bau" && marcarVisitado("bau-vila")) {
      estado().moedas += 1;
      salvar();
      tocar("bau-abre");
      // a moeda vem depois da tampa, nao junto: dois sons no mesmo instante
      // viram um so, e o premio e justamente o segundo
      this.time.delayedCall(220, () => tocar("moeda"));
    }
    this.abrirFala(fala.quem, fala.linhas, alvo.chave);
  }

  private abrirFala(quem: string, linhas: string[], chave?: string) {
    this.conversando = true;
    this.heroi.mover(0, 0);
    // a chave viaja junto porque e ela, e nao o nome na chapinha, que a
    // tabela VOZ usa para achar a altura da voz do personagem
    this.scene.get("Interface").events.emit("falar", { quem, linhas, cena: this, chave });
  }

  update() {
    if (this.conversando) {
      this.heroi.mover(0, 0);
      return;
    }
    if (this.controles.acaoApertada()) {
      this.cancelarCaminho();
      this.tentarInteragir();
    }
    if (this.controles.pausaApertada()) this.pausar();
    const d = this.controles.direcao();
    if (d.x !== 0 || d.y !== 0) {
      // teclado, disco ou botao A: cancelar e sagrado, o jogador manda na hora
      this.cancelarCaminho();
      this.heroi.mover(d.x, d.y);
    } else if (this.caminho) {
      this.avancarCaminho();
    } else {
      this.heroi.mover(0, 0);
    }
    this.heroi.atualizarProfundidade();
    ouvirDe(this.heroi.x, this.heroi.y);
    this.conferirSaida();
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

  private aoClicarNoMundo(p: Phaser.Input.Pointer) {
    if (this.conversando || this.ehDaInterface(p)) return;
    const { x: wx, y: wy } = this.mundoXY(p);
    const alvo = this.interagiveis.find(
      (i) => Phaser.Math.Distance.Between(wx, wy, i.x, i.y) < RAIO_PONTEIRO
    );
    if (alvo) {
      this.irEAgir(alvo);
      return;
    }
    this.irPara(wx, wy);
  }

  private atualizarCursorDoMundo(p: Phaser.Input.Pointer) {
    if (this.conversando || this.ehDaInterface(p)) return;
    const { x: wx, y: wy } = this.mundoXY(p);
    const alvo = this.interagiveis.find(
      (i) => Phaser.Math.Distance.Between(wx, wy, i.x, i.y) < RAIO_PONTEIRO
    );
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

  private tileLivreMaisPerto(tx: number, ty: number): Celula | null {
    if (!estaBloqueado(this.malha, tx, ty)) return { tx, ty };
    for (let raio = 1; raio <= 3; raio++) {
      for (let dy = -raio; dy <= raio; dy++) {
        for (let dx = -raio; dx <= raio; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue; // so o anel deste raio
          if (!estaBloqueado(this.malha, tx + dx, ty + dy)) return { tx: tx + dx, ty: ty + dy };
        }
      }
    }
    return null;
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
      this.caminho = undefined;
      this.heroi.mover(0, 0);
      return;
    }
    const proximo = this.caminho[0];
    const dx = proximo.x - this.heroi.x;
    const dy = proximo.y - this.heroi.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) {
      this.caminho.shift();
      if (this.caminho.length === 0) {
        this.caminho = undefined;
        this.heroi.mover(0, 0);
      }
      return;
    }
    // desiste sozinho se parar de progredir: nunca "andando contra a
    // parede para sempre". 0.4 px de folga contra o tremor do arredondamento.
    if (dist < this.distanciaDoAlvo - 0.4) {
      this.distanciaDoAlvo = dist;
      this.semAvancarDesde = this.time.now;
    } else if (this.time.now - this.semAvancarDesde > 400) {
      this.cancelarCaminho();
      this.heroi.mover(0, 0);
      return;
    }
    this.heroi.mover(dx, dy);
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
    st.cena = saida.para;
    st.lugar = destino.lugar;
    salvar();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.restart({ entrada: saida.entrada });
    });
  }
}
