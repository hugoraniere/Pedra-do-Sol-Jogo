/** Carrega a arte e manda pra criacao de personagem ou direto pro mundo. */
import Phaser from "phaser";
import {
  LARGURA, ALTURA, COR, ALTURA_PERSONAGEM, OBJETOS,
  RACAS_SPRITE, TIPOS_CORPO, CABELOS_ESTILO, ROUPAS_ESTILO, CHAPEUS, ARMAS_SPRITE,
  NPCS_SPRITE, GOBLINS_SPRITE, ARANHAS_SPRITE, PECA_ROUPA,
} from "../dados/config";
import { BESTIARIO, PORTES } from "../dados/conteudo";
import { prepararArmazenamento } from "../sistemas/armazenamento";
import { guardarEncaixes, Encaixes } from "../sistemas/encaixes";
import { guardarFichaDoCursor, FichaDoCursor } from "../sistemas/cursor";
import { vigiarCarregamento } from "../sistemas/doutor";

export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // no iPad nao existe console: se um PNG faltar, o doutor e quem conta
    vigiarCarregamento(this);
    const g = this.add.graphics();
    g.fillStyle(COR.papel2, 1).fillRect(60, ALTURA / 2 - 4, LARGURA - 120, 8);
    const barra = this.add.graphics();
    this.load.on("progress", (p: number) => {
      barra.clear().fillStyle(COR.ouro, 1).fillRect(60, ALTURA / 2 - 4, (LARGURA - 120) * p, 8);
    });

    this.load.image("tileset", "assets/tileset.png");
    const P = { frameWidth: 16, frameHeight: ALTURA_PERSONAGEM };
    // O heroi e montado em camadas, uma folha por peca. Corpo e bracos tem uma
    // folha por raca e por tom, porque a anatomia e a cor estao no mesmo
    // desenho. Roupa e arma tem uma por largura de tronco. Cabelo e chapeu tem
    // uma so, porque a cabeca e igual em todas as racas de proposito.
    Object.entries(RACAS_SPRITE).forEach(([raca, r]) => {
      r.tons.forEach((_, i) => {
        this.load.spritesheet(`heroi-corpo-${raca}-${i}`, `assets/heroi-corpo-${raca}-${i}.png`, P);
        this.load.spritesheet(`heroi-bracos-${raca}-${i}`, `assets/heroi-bracos-${raca}-${i}.png`, P);
      });
    });
    // A roupa nao e uma folha de corpo: e a peca de roupa, em 4 vistas por 3
    // posicoes de barra. O jogo a pendura no ponto do tronco. Uma folha por
    // largura de tronco, porque tecido nao estica.
    const R = { frameWidth: PECA_ROUPA.largura, frameHeight: PECA_ROUPA.altura };
    TIPOS_CORPO.forEach((t) =>
      ROUPAS_ESTILO.forEach((r) =>
        this.load.spritesheet(`roupa-${t}-${r.id}`, `assets/roupa-${t}-${r.id}.png`, R)
      )
    );
    // A arma e um desenho unico, do tamanho dela, encostado na mao pelo ponto
    // de pega. Nao tem quadro nem animacao propria: quem anima e o braco.
    ARMAS_SPRITE.filter((a) => a !== "nenhuma").forEach((a) =>
      this.load.image(`arma-${a}`, `assets/arma-${a}.png`)
    );
    this.load.json("encaixes", "assets/encaixes.json");
    CABELOS_ESTILO.forEach((c) =>
      this.load.spritesheet(`heroi-cabelo-${c.id}`, `assets/heroi-cabelo-${c.id}.png`, P)
    );
    CHAPEUS.filter((c) => c.id !== "nenhum").forEach((c) =>
      this.load.spritesheet(`heroi-chapeu-${c.id}`, `assets/heroi-chapeu-${c.id}.png`, P)
    );
    NPCS_SPRITE.forEach((n) => this.load.spritesheet(`npc-${n}`, `assets/npc-${n}.png`, P));
    GOBLINS_SPRITE.forEach((g) => this.load.spritesheet(`goblin-${g}`, `assets/goblin-${g}.png`, P));
    ARANHAS_SPRITE.forEach((a) => this.load.spritesheet(`aranha-${a}`, `assets/aranha-${a}.png`, P));
    // O bestiario carrega a si mesmo. Cada criatura diz na ficha qual e o
    // sprite dela e qual o porte, e o porte diz o tamanho do quadro: assim
    // criatura nova entra no jogo mexendo so em conteudo.ts, sem tocar aqui.
    BESTIARIO.forEach((c) => {
      const q = PORTES[c.porte];
      this.load.spritesheet(c.sprite, `assets/${c.sprite}.png`,
        { frameWidth: q.largura, frameHeight: q.altura });
    });
    this.load.image("titulo", "assets/titulo.png");
    this.load.image("logo", "assets/logo.png");
    this.load.bitmapFont("aurora", "assets/fonte.png", "assets/fonte.xml");
    this.load.json("objetos", "assets/objetos.json");
    OBJETOS.forEach((n) => this.load.image(`obj-${n}`, `assets/objetos/${n}.png`));
    this.load.spritesheet("ui", "assets/ui.png", { frameWidth: 16, frameHeight: 16 });
    // o cursor do mouse. A ficha diz onde fica a ponta de cada quadro, e e por
    // ela que nenhuma coordenada da seta e escrita dentro de um .ts
    this.load.spritesheet("cursor", "assets/cursor.png", { frameWidth: 16, frameHeight: 16 });
    this.load.json("cursor-ficha", "assets/cursor.json");
    ["painel", "painel-creme", "painel-ouro", "painel-escuro"].forEach((n) =>
      this.load.image(n, `assets/${n}.png`)
    );
  }

  async create() {
    guardarEncaixes(this.cache.json.get("encaixes") as Encaixes);
    guardarFichaDoCursor(this.cache.json.get("cursor-ficha") as FichaDoCursor);
    // o cursor sobe junto com o jogo e nunca mais sai. Ele nasce escondido:
    // so aparece quando um mouse de verdade se mexe.
    this.scene.launch("Ponteiro");
    // no aplicativo os saves vem do disco, entao esperamos a leitura antes do menu
    await prepararArmazenamento();
    this.scene.start("Titulo");
  }
}
