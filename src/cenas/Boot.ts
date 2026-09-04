/** Carrega a arte e manda pra criacao de personagem ou direto pro mundo. */
import Phaser from "phaser";
import {
  LARGURA, ALTURA, COR, ALTURA_PERSONAGEM, OBJETOS,
  TONS_PELE, CABELOS_ESTILO, ROUPAS_ESTILO, CHAPEUS, ARMAS_SPRITE, NPCS_SPRITE,
} from "../dados/config";
import { prepararArmazenamento } from "../sistemas/armazenamento";

export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    const g = this.add.graphics();
    g.fillStyle(COR.papel2, 1).fillRect(60, ALTURA / 2 - 4, LARGURA - 120, 8);
    const barra = this.add.graphics();
    this.load.on("progress", (p: number) => {
      barra.clear().fillStyle(COR.ouro, 1).fillRect(60, ALTURA / 2 - 4, (LARGURA - 120) * p, 8);
    });

    this.load.image("tileset", "assets/tileset.png");
    const P = { frameWidth: 16, frameHeight: ALTURA_PERSONAGEM };
    // o heroi e montado em camadas, uma folha por peca
    TONS_PELE.forEach((t) => {
      this.load.spritesheet(`heroi-corpo-${t.id}`, `assets/heroi-corpo-${t.id}.png`, P);
      this.load.spritesheet(`heroi-bracos-${t.id}`, `assets/heroi-bracos-${t.id}.png`, P);
    });
    CABELOS_ESTILO.forEach((c) =>
      this.load.spritesheet(`heroi-cabelo-${c.id}`, `assets/heroi-cabelo-${c.id}.png`, P)
    );
    ROUPAS_ESTILO.forEach((r) =>
      this.load.spritesheet(`heroi-roupa-${r.id}`, `assets/heroi-roupa-${r.id}.png`, P)
    );
    CHAPEUS.filter((c) => c.id !== "nenhum").forEach((c) =>
      this.load.spritesheet(`heroi-chapeu-${c.id}`, `assets/heroi-chapeu-${c.id}.png`, P)
    );
    ARMAS_SPRITE.filter((a) => a !== "nenhuma").forEach((a) =>
      this.load.spritesheet(`heroi-arma-${a}`, `assets/heroi-arma-${a}.png`, P)
    );
    NPCS_SPRITE.forEach((n) => this.load.spritesheet(`npc-${n}`, `assets/npc-${n}.png`, P));
    this.load.spritesheet("goblin", "assets/goblin.png", P);
    this.load.image("titulo", "assets/titulo.png");
    this.load.image("logo", "assets/logo.png");
    this.load.bitmapFont("aurora", "assets/fonte.png", "assets/fonte.xml");
    this.load.json("objetos", "assets/objetos.json");
    OBJETOS.forEach((n) => this.load.image(`obj-${n}`, `assets/objetos/${n}.png`));
    this.load.spritesheet("ui", "assets/ui.png", { frameWidth: 16, frameHeight: 16 });
    ["painel", "painel-creme", "painel-ouro", "painel-escuro"].forEach((n) =>
      this.load.image(n, `assets/${n}.png`)
    );
  }

  async create() {
    // no aplicativo os saves vem do disco, entao esperamos a leitura antes do menu
    await prepararArmazenamento();
    this.scene.start("Titulo");
  }
}
