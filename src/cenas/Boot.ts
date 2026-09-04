/** Carrega a arte e manda pra criacao de personagem ou direto pro mundo. */
import Phaser from "phaser";
import { TILE, LARGURA, ALTURA, COR } from "../dados/config";
import { carregar } from "../sistemas/estado";

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
    this.load.spritesheet("heroi-base", "assets/heroi-base.png", { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet("heroi-roupa", "assets/heroi-roupa.png", { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet("heroi-cabelo", "assets/heroi-cabelo.png", { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet("goblin", "assets/goblin.png", { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet("npcs", "assets/npcs.png", { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet("objetos", "assets/objetos.png", { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("ui", "assets/ui.png", { frameWidth: TILE, frameHeight: TILE });
    ["painel", "painel-creme", "painel-ouro", "painel-escuro"].forEach((n) =>
      this.load.image(n, `assets/${n}.png`)
    );
  }

  create() {
    this.scene.start(carregar() ? "Mundo" : "Criacao");
  }
}
