/** O heroi na tela.
 *  Sao tres sprites empilhados: base (pele, cajado, botas), roupa e cabelo.
 *  Roupa e cabelo vem em branco no PNG e recebem a cor escolhida na criacao,
 *  entao qualquer combinacao de cores funciona sem gerar arte nova. */
import Phaser from "phaser";
import { VELOCIDADE } from "../dados/config";

const CAMADAS = ["heroi-base", "heroi-roupa", "heroi-cabelo"] as const;
const DIRECOES = ["baixo", "esquerda", "direita", "cima"] as const;
export type NomeDirecao = (typeof DIRECOES)[number];

export function criarAnimacoes(cena: Phaser.Scene) {
  CAMADAS.forEach((chave) => {
    DIRECOES.forEach((dir, linha) => {
      const base = linha * 4;
      const chaveAnda = `${chave}-anda-${dir}`;
      if (cena.anims.exists(chaveAnda)) return;
      cena.anims.create({
        key: chaveAnda,
        frames: cena.anims.generateFrameNumbers(chave, {
          frames: [base, base + 1, base + 2, base + 3],
        }),
        frameRate: 7,
        repeat: -1,
      });
      cena.anims.create({
        key: `${chave}-parado-${dir}`,
        frames: [{ key: chave, frame: base }],
        frameRate: 1,
      });
    });
  });
}

export class Heroi extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private camadas: Phaser.GameObjects.Sprite[] = [];
  private olhando: NomeDirecao = "baixo";
  private andando = false;

  constructor(cena: Phaser.Scene, x: number, y: number, corRoupa: number, corCabelo: number) {
    super(cena, x, y);
    CAMADAS.forEach((chave, i) => {
      const s = cena.add.sprite(0, 0, chave, 0).setOrigin(0.5, 1);
      if (i === 1) s.setTint(corRoupa);
      if (i === 2) s.setTint(corCabelo);
      this.camadas.push(s);
      this.add(s);
    });
    cena.add.existing(this);
    cena.physics.add.existing(this);
    // corpo colide so com os pes, o resto do sprite passa por cima do cenario
    this.body.setSize(10, 7);
    this.body.setOffset(-5, -7);
    this.parar();
  }

  /** move e escolhe a animacao. dx e dy vem de Controles.direcao() */
  mover(dx: number, dy: number) {
    const v = new Phaser.Math.Vector2(dx, dy);
    if (v.lengthSq() > 0) v.normalize().scale(VELOCIDADE);
    this.body.setVelocity(v.x, v.y);

    if (v.lengthSq() === 0) {
      if (this.andando) this.parar();
      return;
    }
    const dir: NomeDirecao =
      Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "esquerda" : "direita") : dy < 0 ? "cima" : "baixo";
    if (!this.andando || dir !== this.olhando) {
      this.olhando = dir;
      this.andando = true;
      this.camadas.forEach((s, i) => s.play(`${CAMADAS[i]}-anda-${dir}`));
    }
    this.setDepth(this.y);
  }

  parar() {
    this.andando = false;
    this.body?.setVelocity(0, 0);
    this.camadas.forEach((s, i) => s.play(`${CAMADAS[i]}-parado-${this.olhando}`));
  }

  /** ponto logo a frente do heroi, usado para saber com o que ele quer falar */
  frente(): Phaser.Math.Vector2 {
    const d = { baixo: [0, 12], cima: [0, -14], esquerda: [-12, -2], direita: [12, -2] }[
      this.olhando
    ];
    return new Phaser.Math.Vector2(this.x + d[0], this.y + d[1]);
  }

  trocarCores(corRoupa: number, corCabelo: number) {
    this.camadas[1].setTint(corRoupa);
    this.camadas[2].setTint(corCabelo);
  }
}
