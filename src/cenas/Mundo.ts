/** O mundo jogavel. Monta o chao, os objetos, as pessoas e o heroi,
 *  e cuida de andar, esbarrar e conversar. */
import Phaser from "phaser";
import { TILE, SOLIDOS, COR } from "../dados/config";
import { VILA, montarChao, Mapa } from "../dados/mapas";
import { DIALOGOS } from "../dados/dialogos";
import { estado, salvar, marcarVisitado } from "../sistemas/estado";
import { Controles } from "../sistemas/controles";
import { criarAnimacoes, Heroi } from "../sistemas/heroi";
import { valorDoZoom } from "../sistemas/preferencias";

const NPC_FRAME: Record<string, number> = {
  vovo: 0, ferreiro: 1, menina: 2, pescador: 3,
  mercador: 4, menino: 5, guarda: 6, padeira: 7,
};

type FichaObjeto = { w: number; h: number; cw: number; ch: number };
type Interagivel = { x: number; y: number; chave: string };

export class Mundo extends Phaser.Scene {
  private heroi!: Heroi;
  private controles!: Controles;
  private interagiveis: Interagivel[] = [];
  private conversando = false;
  private solidos!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super("Mundo");
  }

  create() {
    criarAnimacoes(this);
    this.controles = new Controles(this);
    this.interagiveis = [];
    this.conversando = false;
    this.solidos = this.physics.add.staticGroup();

    const mapa: Mapa = VILA;
    const fichas = this.cache.json.get("objetos") as Record<string, FichaObjeto>;

    // ---------------------------------------------------------- chao
    const chao = montarChao(mapa.chao);
    const tilemap = this.make.tilemap({ data: chao, tileWidth: TILE, tileHeight: TILE });
    const tiles = tilemap.addTilesetImage("tileset")!;
    const camada = tilemap.createLayer(0, tiles, 0, 0)!;
    camada.setCollision(SOLIDOS);
    camada.setDepth(-1000);

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

    // ------------------------------------------------------- pessoas
    mapa.pessoas.forEach((pessoa) => {
      const x = pessoa.x * TILE + TILE / 2;
      const y = pessoa.y * TILE + TILE;
      const s = this.add.sprite(x, y, "npcs", NPC_FRAME[pessoa.sprite] ?? 0).setOrigin(0.5, 1);
      s.setDepth(y);
      const corpo = this.add.rectangle(x, y - 4, 10, 8);
      this.solidos.add(corpo);
      (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      this.interagiveis.push({ x, y: y - 10, chave: pessoa.quem });
      // respiracao, so pra ninguem parecer estatua
      this.tweens.add({
        targets: s,
        scaleY: 1.03,
        duration: 1400 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
      });
    });

    // --------------------------------------------------------- heroi
    const st = estado();
    this.heroi = new Heroi(
      this,
      mapa.entrada.x * TILE + TILE / 2,
      mapa.entrada.y * TILE + TILE,
      st.heroi.corRoupa,
      st.heroi.corCabelo
    );
    this.physics.add.collider(this.heroi, camada);
    this.physics.add.collider(this.heroi, this.solidos);

    this.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.cameras.main.startFollow(this.heroi, true, 0.14, 0.14);
    this.cameras.main.setBackgroundColor(COR.tinta);
    this.cameras.main.setZoom(valorDoZoom());
    this.events.on("zoom-mudou", () => this.cameras.main.setZoom(valorDoZoom()));
    this.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.heroi.body.setCollideWorldBounds(true);

    this.scene.launch("Interface");
    this.scene.get("Interface").events.on("acao", () => this.tentarInteragir());
    this.scene.get("Interface").events.on("pausar", () => this.pausar());
    this.events.on("dialogo-fim", () => {
      this.conversando = false;
    });
  }

  pausar() {
    if (this.conversando) return;
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
    }
    this.abrirFala(fala.quem, fala.linhas);
  }

  private abrirFala(quem: string, linhas: string[]) {
    this.conversando = true;
    this.heroi.mover(0, 0);
    this.scene.get("Interface").events.emit("falar", { quem, linhas, cena: this });
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
  }
}
