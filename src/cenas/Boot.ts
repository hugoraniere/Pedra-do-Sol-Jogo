/** Carrega a arte e manda pra criacao de personagem ou direto pro mundo. */
import Phaser from "phaser";
import { LARGURA, ALTURA, COR, ALTURA_PERSONAGEM, OBJETOS } from "../dados/config";
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
    const P = { frameWidth: 16, frameHeight: ALTURA_PERSONAGEM };
    this.load.spritesheet("heroi-base", "assets/heroi-base.png", P);
    this.load.spritesheet("heroi-roupa", "assets/heroi-roupa.png", P);
    this.load.spritesheet("heroi-cabelo", "assets/heroi-cabelo.png", P);
    this.load.spritesheet("goblin", "assets/goblin.png", P);
    this.load.spritesheet("npcs", "assets/npcs.png", P);
    this.load.json("objetos", "assets/objetos.json");
    OBJETOS.forEach((n) => this.load.image(`obj-${n}`, `assets/objetos/${n}.png`));
    this.load.spritesheet("ui", "assets/ui.png", { frameWidth: 16, frameHeight: 16 });
    ["painel", "painel-creme", "painel-ouro", "painel-escuro"].forEach((n) =>
      this.load.image(n, `assets/${n}.png`)
    );
  }

  create() {
    this.scene.start(carregar() ? "Mundo" : "Criacao");
  }
}
