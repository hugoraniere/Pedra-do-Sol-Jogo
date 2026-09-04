/** O heroi na tela, montado em camadas.
 *
 * Camadas, na ordem em que sao desenhadas (a mesma do Stardew):
 *   corpo -> roupa -> cabelo -> chapeu -> bracos -> arma
 *
 * O braco fica ACIMA da roupa de proposito. E isso que deixa o personagem segurar
 * arma e levantar a mao sem quebrar o desenho da tunica.
 *
 * Roupa, cabelo e chapeu vem em branco no PNG e recebem a cor escolhida por tint,
 * entao qualquer combinacao funciona sem gerar arte nova.
 *
 * Cada folha tem 6 colunas por 4 linhas. A ordem esta em dados/config.ts.
 */
import Phaser from "phaser";
import {
  VELOCIDADE,
  QUADRO,
  LINHA_DIRECAO,
  COLUNAS_FOLHA,
  CICLO_CAMINHADA,
  FPS_CAMINHADA,
} from "../dados/config";
import type { Heroi as FichaHeroi } from "./estado";

const DIRECOES = ["baixo", "esquerda", "direita", "cima"] as const;
export type NomeDirecao = (typeof DIRECOES)[number];

/** Uma camada e uma textura mais a cor com que ela e pintada. */
type Camada = { chave: string; tint?: number };

export function camadasDoHeroi(ficha: FichaHeroi): Camada[] {
  const lista: Camada[] = [
    { chave: `heroi-corpo-${ficha.tomPele ?? 0}` },
    { chave: `heroi-roupa-${ficha.estiloRoupa ?? "tunica"}`, tint: ficha.corRoupa },
    { chave: `heroi-cabelo-${ficha.estiloCabelo ?? "curto"}`, tint: ficha.corCabelo },
  ];
  if (ficha.chapeu && ficha.chapeu !== "nenhum") {
    lista.push({ chave: `heroi-chapeu-${ficha.chapeu}`, tint: ficha.corChapeu ?? 0xffffff });
  }
  lista.push({ chave: `heroi-bracos-${ficha.tomPele ?? 0}` });
  if (ficha.armaSprite && ficha.armaSprite !== "nenhuma") {
    lista.push({ chave: `heroi-arma-${ficha.armaSprite}` });
  }
  return lista;
}

const quadro = (dir: NomeDirecao, coluna: number) => LINHA_DIRECAO[dir] * COLUNAS_FOLHA + coluna;

/** Cria, uma vez por cena, as animacoes de toda folha de personagem usada. */
export function criarAnimacoes(cena: Phaser.Scene, chaves: string[]) {
  chaves.forEach((chave) => {
    if (!cena.textures.exists(chave)) return;
    DIRECOES.forEach((dir) => {
      const andar = `${chave}-anda-${dir}`;
      if (cena.anims.exists(andar)) return;
      cena.anims.create({
        key: andar,
        frames: CICLO_CAMINHADA.map((c) => ({ key: chave, frame: quadro(dir, c) })),
        frameRate: FPS_CAMINHADA,
        repeat: -1,
      });
      // parado nao e um quadro so: respira devagar, senao vira estatua
      cena.anims.create({
        key: `${chave}-parado-${dir}`,
        frames: [
          { key: chave, frame: quadro(dir, QUADRO.parado), duration: 2200 },
          { key: chave, frame: quadro(dir, QUADRO.respira), duration: 700 },
        ],
        repeat: -1,
      });
      cena.anims.create({
        key: `${chave}-conjura-${dir}`,
        frames: [{ key: chave, frame: quadro(dir, QUADRO.conjura) }],
        frameRate: 1,
      });
      cena.anims.create({
        key: `${chave}-tonto-${dir}`,
        frames: [{ key: chave, frame: quadro(dir, QUADRO.tonto) }],
        frameRate: 1,
      });
    });
  });
}

export class Heroi extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private camadas: { sprite: Phaser.GameObjects.Sprite; chave: string }[] = [];
  private olhando: NomeDirecao = "baixo";
  private estado: "parado" | "anda" | "conjura" | "tonto" = "parado";

  constructor(cena: Phaser.Scene, x: number, y: number, ficha: FichaHeroi) {
    super(cena, x, y);
    camadasDoHeroi(ficha).forEach((c) => {
      const s = cena.add.sprite(0, 0, c.chave, 0).setOrigin(0.5, 1);
      if (c.tint !== undefined) s.setTint(c.tint);
      this.camadas.push({ sprite: s, chave: c.chave });
      this.add(s);
    });
    cena.add.existing(this);
    cena.physics.add.existing(this);
    // o corpo de fisica cobre so os pes: o resto passa por tras de telhado e copa
    this.body.setSize(10, 6);
    this.body.setOffset(-5, -6);
    this.tocar("parado");
  }

  private tocar(novo: typeof this.estado) {
    this.estado = novo;
    const sufixo = novo === "anda" ? "anda" : novo;
    this.camadas.forEach((c) => c.sprite.play(`${c.chave}-${sufixo}-${this.olhando}`, true));
  }

  mover(dx: number, dy: number) {
    if (this.estado === "conjura" || this.estado === "tonto") {
      this.body.setVelocity(0, 0);
      return;
    }
    const v = new Phaser.Math.Vector2(dx, dy);
    if (v.lengthSq() > 0) v.normalize().scale(VELOCIDADE);
    this.body.setVelocity(v.x, v.y);

    if (v.lengthSq() === 0) {
      if (this.estado !== "parado") this.tocar("parado");
      return;
    }
    const dir: NomeDirecao =
      Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "esquerda" : "direita") : dy < 0 ? "cima" : "baixo";
    if (this.estado !== "anda" || dir !== this.olhando) {
      this.olhando = dir;
      this.tocar("anda");
    }
  }

  parar() {
    this.body?.setVelocity(0, 0);
    this.tocar("parado");
  }

  /** Pose de conjurar magia, volta sozinha ao normal. */
  conjurar(duracao = 700) {
    this.tocar("conjura");
    this.scene.time.delayedCall(duracao, () => {
      if (this.estado === "conjura") this.tocar("parado");
    });
  }

  /** Levou um susto. Nao existe morte no jogo, so ficar tonto por um instante. */
  ficarTonto(duracao = 900) {
    this.tocar("tonto");
    this.scene.time.delayedCall(duracao, () => {
      if (this.estado === "tonto") this.tocar("parado");
    });
  }

  atualizarProfundidade() {
    this.setDepth(this.y);
  }

  /** ponto logo a frente do heroi, usado para saber com o que ele quer falar */
  frente(): Phaser.Math.Vector2 {
    const d = { baixo: [0, 12], cima: [0, -18], esquerda: [-13, -6], direita: [13, -6] }[
      this.olhando
    ];
    return new Phaser.Math.Vector2(this.x + d[0], this.y + d[1]);
  }

  /** Troca a aparencia inteira sem recriar o objeto. Usado na tela de criacao. */
  trocarAparencia(ficha: FichaHeroi) {
    const novas = camadasDoHeroi(ficha);
    this.camadas.forEach((c) => c.sprite.destroy());
    this.camadas = [];
    this.removeAll();
    novas.forEach((c) => {
      const s = this.scene.add.sprite(0, 0, c.chave, 0).setOrigin(0.5, 1);
      if (c.tint !== undefined) s.setTint(c.tint);
      this.camadas.push({ sprite: s, chave: c.chave });
      this.add(s);
    });
    this.tocar(this.estado);
  }

  chavesDeTextura(): string[] {
    return this.camadas.map((c) => c.chave);
  }
}
