/** O mundo jogavel. Monta o mapa, o heroi, os NPCs e os objetos,
 *  e cuida de andar, esbarrar e conversar. */
import Phaser from "phaser";
import { TILE, SOLIDOS, COR } from "../dados/config";
import { VILA, montar } from "../dados/mapas";
import { DIALOGOS } from "../dados/dialogos";
import { estado, salvar, marcarVisitado } from "../sistemas/estado";
import { Controles } from "../sistemas/controles";
import { criarAnimacoes, Heroi } from "../sistemas/heroi";

const NPC_FRAME: Record<string, number> = { vovo: 0, ferreiro: 1, menina: 2, pescador: 3 };
const OBJ_FRAME: Record<string, number> = { sino: 0, fogueira: 1, bau: 2, placa: 3, cristal: 4 };

type Interagivel = { objeto: Phaser.GameObjects.Sprite; chave: string };

export class Mundo extends Phaser.Scene {
  private heroi!: Heroi;
  private controles!: Controles;
  private interagiveis: Interagivel[] = [];
  private conversando = false;

  constructor() {
    super("Mundo");
  }

  create() {
    criarAnimacoes(this);
    this.controles = new Controles(this);
    this.interagiveis = [];
    this.conversando = false;

    const mapa = montar(VILA);
    const tilemap = this.make.tilemap({ data: mapa.tiles, tileWidth: TILE, tileHeight: TILE });
    const tiles = tilemap.addTilesetImage("tileset")!;
    const camada = tilemap.createLayer(0, tiles, 0, 0)!;
    camada.setCollision(SOLIDOS);

    // objetos e npcs
    mapa.marcadores.forEach((m) => {
      const x = m.x * TILE + TILE / 2;
      const y = m.y * TILE + TILE / 2;
      if (m.tipo === "npc") {
        const s = this.add.sprite(x, y + 4, "npcs", NPC_FRAME[m.dado] ?? 0).setOrigin(0.5, 1);
        s.setDepth(s.y);
        this.interagiveis.push({ objeto: s, chave: m.dado });
      } else if (m.tipo === "objeto") {
        const s = this.add.sprite(x, y + 8, "objetos", OBJ_FRAME[m.dado] ?? 0).setOrigin(0.5, 1);
        s.setDepth(s.y);
        this.interagiveis.push({ objeto: s, chave: m.dado });
      } else if (m.tipo === "saida") {
        const s = this.add.sprite(x, y + 8, "objetos", OBJ_FRAME.placa).setOrigin(0.5, 1);
        s.setDepth(s.y);
        this.interagiveis.push({ objeto: s, chave: "saida-floresta" });
      }
    });

    const st = estado();
    this.heroi = new Heroi(this, 15 * TILE, 9 * TILE, st.heroi.corRoupa, st.heroi.corCabelo);
    this.physics.add.collider(this.heroi, camada);

    this.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.cameras.main.startFollow(this.heroi, true, 0.15, 0.15);
    this.cameras.main.setBackgroundColor(COR.tinta);
    this.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.heroi.body.setCollideWorldBounds(true);

    this.scene.launch("Interface");
    this.scene.get("Interface").events.on("acao", () => this.tentarInteragir());
    this.events.on("dialogo-fim", () => {
      this.conversando = false;
    });
  }

  private tentarInteragir() {
    if (this.conversando) return;
    const frente = this.heroi.frente();
    const alvo = this.interagiveis.find(
      (i) => Phaser.Math.Distance.Between(frente.x, frente.y, i.objeto.x, i.objeto.y - 6) < 14
    );
    if (!alvo) return;

    if (alvo.chave === "saida-floresta") {
      this.abrirFala("Trilha da floresta", ["A Floresta dos Sussurros comeca aqui.", "(em construcao, volte logo)"]);
      return;
    }
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
    const d = this.controles.direcao();
    this.heroi.mover(d.x, d.y);
  }
}
