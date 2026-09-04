/** O mundo jogavel. Monta o chao, os objetos, as pessoas e o heroi,
 *  e cuida de andar, esbarrar e conversar. */
import Phaser from "phaser";
import { TILE, SOLIDOS, COR } from "../dados/config";
import { VILA, montarChao, Mapa } from "../dados/mapas";
import { DIALOGOS } from "../dados/dialogos";
import { estado, salvar, marcarVisitado } from "../sistemas/estado";
import { Controles } from "../sistemas/controles";
import { camadasDoHeroi, criarAnimacoes, Heroi } from "../sistemas/heroi";
import { COLCHAO, PONTOS } from "../dados/sons";
import {
  calarAmbiente, montarAmbiente, musica, ouvirDe, passo, soltarPassaros, tocar,
  type FonteDeSom,
} from "../sistemas/som";

type FichaObjeto = { w: number; h: number; cw: number; ch: number };
type Interagivel = { x: number; y: number; chave: string };

export class Mundo extends Phaser.Scene {
  private heroi!: Heroi;
  private controles!: Controles;
  private interagiveis: Interagivel[] = [];
  private conversando = false;
  private solidos!: Phaser.Physics.Arcade.StaticGroup;
  private chao!: Phaser.Tilemaps.TilemapLayer;

  constructor() {
    super("Mundo");
  }

  create() {
    const mapaAtual: Mapa = VILA;
    const st0 = estado();
    criarAnimacoes(this, [
      ...camadasDoHeroi(st0.heroi).map((c) => c.chave),
      ...mapaAtual.pessoas.map((p) => `npc-${p.sprite}`),
      "goblin",
    ]);
    this.controles = new Controles(this);
    this.interagiveis = [];
    this.conversando = false;
    this.solidos = this.physics.add.staticGroup();

    const mapa: Mapa = mapaAtual;
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
    mapa.objetos.forEach((peca) => {
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
      if (DIALOGOS[peca.nome]) this.interagiveis.push({ x, y: y - 8, chave: peca.nome });
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
      this.interagiveis.push({ x, y: y - 10, chave: pessoa.quem });
      // a respiracao agora e quadro de animacao, nao tween de escala
    });

    // --------------------------------------------------------- heroi
    this.heroi = new Heroi(
      this,
      mapa.entrada.x * TILE + TILE / 2,
      mapa.entrada.y * TILE + TILE,
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
    this.cameras.main.setRoundPixels(true);
    this.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.heroi.body.setCollideWorldBounds(true);

    this.scene.launch("Interface");
    this.scene.get("Interface").events.on("acao", () => this.tentarInteragir());
    this.scene.get("Interface").events.on("pausar", () => this.pausar());
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

  private tentarInteragir() {
    if (this.conversando) return;
    const frente = this.heroi.frente();
    const alvo = this.interagiveis.find(
      (i) => Phaser.Math.Distance.Between(frente.x, frente.y, i.x, i.y) < 18
    );
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
    if (this.controles.acaoApertada()) this.tentarInteragir();
    if (this.controles.pausaApertada()) this.pausar();
    const d = this.controles.direcao();
    this.heroi.mover(d.x, d.y);
    this.heroi.atualizarProfundidade();
    ouvirDe(this.heroi.x, this.heroi.y);
  }
}
