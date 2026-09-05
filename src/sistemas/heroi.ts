/** O heroi na tela, montado em camadas.
 *
 * Camadas, na ordem em que sao desenhadas (a mesma do Stardew):
 *   corpo -> roupa -> cabelo -> chapeu -> bracos -> arma
 *
 * O braco fica ACIMA da roupa de proposito. E isso que deixa o personagem segurar
 * arma e levantar a mao sem quebrar o desenho da tunica.
 *
 * DOIS TIPOS DE CAMADA, e a diferenca importa.
 *
 * As camadas ANIMADAS (corpo, bracos, cabelo, chapeu) sao folhas de 24 quadros
 * e tocam animacao normalmente.
 *
 * As camadas ENCAIXADAS (roupa e arma) nao. Elas sao pecas desenhadas fora do
 * corpo, e o que as move e o PONTO DE ENCAIXE: a arte diz, quadro a quadro,
 * onde esta o tronco e onde esta a mao, e a peca vai para la. Assim a espada
 * acompanha o balanco do braco sem ninguem copiar coordenada na mao, e a mesma
 * espada serve para o anao e para o elfo, que tem o braco em alturas
 * diferentes. Ver arte/equipamento.py e sistemas/encaixes.ts.
 *
 * Roupa, cabelo e chapeu vem em branco no PNG e recebem a cor escolhida por tint,
 * entao qualquer combinacao funciona sem gerar arte nova.
 *
 * Cada folha de corpo tem 6 colunas por 4 linhas. A ordem esta em dados/config.ts.
 */
import Phaser from "phaser";
import {
  ALTURA_PERSONAGEM,
  DIRECOES,
  RACAS_SPRITE,
  direcaoDe,
  type NomeDirecao,
  VELOCIDADE,
  QUADRO,
  LINHA_DIRECAO,
  COLUNAS_FOLHA,
  CICLO_CAMINHADA,
  FPS_CAMINHADA,
} from "../dados/config";
import type { Heroi as FichaHeroi } from "./estado";
import { encaixes, quadroDaRoupa, FichaArma } from "./encaixes";

export type { NomeDirecao };

/** Uma camada animada: a textura, a cor com que ela e pintada, e quantos pixels
 *  ela desce. O deslocamento existe porque raca baixa tem perna curta: o corpo
 *  inteiro fica mais perto do chao, e o cabelo desenhado na altura normal
 *  ficaria flutuando acima da cabeca. Ver RACAS_SPRITE.desce. */
type Camada = { chave: string; tint?: number; desce?: number };

function racaValida(ficha: FichaHeroi) {
  return RACAS_SPRITE[ficha.raca] ? ficha.raca : "vale";
}

/** As camadas que tocam animacao. Sao estas que precisam de anims criadas. */
export function camadasDoHeroi(ficha: FichaHeroi): Camada[] {
  const raca = racaValida(ficha);
  const r = RACAS_SPRITE[raca];
  const tom = Math.min(Math.max(ficha.tomPele ?? 0, 0), r.tons.length - 1);
  const desce = r.desce;

  const lista: Camada[] = [{ chave: `heroi-corpo-${raca}-${tom}` }];
  lista.push({ chave: `heroi-cabelo-${ficha.estiloCabelo ?? "curto"}`, tint: ficha.corCabelo, desce });
  if (ficha.chapeu && ficha.chapeu !== "nenhum") {
    lista.push({ chave: `heroi-chapeu-${ficha.chapeu}`, tint: ficha.corChapeu ?? 0xffffff, desce });
  }
  lista.push({ chave: `heroi-bracos-${raca}-${tom}` });
  return lista;
}

/** As pecas que vao por ponto de encaixe, nao por animacao. */
export function pecasDoHeroi(ficha: FichaHeroi) {
  const raca = racaValida(ficha);
  const r = RACAS_SPRITE[raca];
  const estilo = ficha.estiloRoupa ?? "tunica";
  const arma = ficha.armaSprite && ficha.armaSprite !== "nenhuma" ? ficha.armaSprite : undefined;
  return {
    raca,
    roupa: { chave: `roupa-${r.corpo}-${estilo}`, tint: ficha.corRoupa },
    arma: arma ? { chave: `arma-${arma}`, nome: arma } : undefined,
  };
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
      cena.anims.create({
        key: `${chave}-ataque-${dir}`,
        frames: [{ key: chave, frame: quadro(dir, QUADRO.ataque) }],
        frameRate: 1,
      });
      cena.anims.create({
        key: `${chave}-machucado-${dir}`,
        frames: [{ key: chave, frame: quadro(dir, QUADRO.machucado) }],
        frameRate: 1,
      });
      // esquiva, fuga e derrota: novas, hoje so o goblin desenha pose propria
      // (quem nao desenhar recebe a mesma arte de `parado`, ver QUADRO em
      // dados/config.ts). Um quadro so, como conjura/tonto/ataque acima.
      cena.anims.create({
        key: `${chave}-esquiva-${dir}`,
        frames: [{ key: chave, frame: quadro(dir, QUADRO.esquiva) }],
        frameRate: 1,
      });
      cena.anims.create({
        key: `${chave}-fuga-${dir}`,
        frames: [{ key: chave, frame: quadro(dir, QUADRO.fuga) }],
        frameRate: 1,
      });
      cena.anims.create({
        key: `${chave}-derrota-${dir}`,
        frames: [{ key: chave, frame: quadro(dir, QUADRO.derrota) }],
        frameRate: 1,
      });
    });
  });
}

export class Heroi extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private camadas: { sprite: Phaser.GameObjects.Sprite; chave: string }[] = [];
  private roupa?: Phaser.GameObjects.Sprite;
  private arma?: Phaser.GameObjects.Image;
  private fichaArma?: FichaArma;
  private raca = "vale";
  private olhando: NomeDirecao = "baixo";
  private estado: "parado" | "anda" | "conjura" | "tonto" | "ataque" | "machucado" = "parado";
  private avisarPasso?: () => void;

  constructor(cena: Phaser.Scene, x: number, y: number, ficha: FichaHeroi) {
    super(cena, x, y);
    this.montar(ficha);
    cena.add.existing(this);
    cena.physics.add.existing(this);
    // o corpo de fisica cobre so os pes: o resto passa por tras de telhado e copa
    this.body.setSize(10, 6);
    this.body.setOffset(-5, -6);
    this.tocar("parado");
  }

  /** Monta as camadas na ordem de desenho. Usado no inicio e a cada troca de
   *  aparencia na tela de criacao. */
  private montar(ficha: FichaHeroi) {
    const cena = this.scene ?? (this as unknown as { scene: Phaser.Scene }).scene;
    this.camadas.forEach((c) => c.sprite.destroy());
    this.roupa?.destroy();
    this.arma?.destroy();
    this.camadas = [];
    this.roupa = undefined;
    this.arma = undefined;
    this.removeAll();

    const pecas = pecasDoHeroi(ficha);
    this.raca = pecas.raca;
    const animadas = camadasDoHeroi(ficha);

    // corpo primeiro, depois a roupa por cima dele
    const corpo = animadas[0];
    const spriteCorpo = cena.add.sprite(0, 0, corpo.chave, 0).setOrigin(0.5, 1);
    this.camadas.push({ sprite: spriteCorpo, chave: corpo.chave });
    this.add(spriteCorpo);

    if (cena.textures.exists(pecas.roupa.chave)) {
      this.roupa = cena.add.sprite(0, 0, pecas.roupa.chave, 0).setOrigin(0, 0);
      if (pecas.roupa.tint !== undefined) this.roupa.setTint(pecas.roupa.tint);
      this.add(this.roupa);
    }

    // cabelo, chapeu e bracos por cima da roupa
    animadas.slice(1).forEach((c) => {
      const sp = cena.add.sprite(0, c.desce ?? 0, c.chave, 0).setOrigin(0.5, 1);
      if (c.tint !== undefined) sp.setTint(c.tint);
      this.camadas.push({ sprite: sp, chave: c.chave });
      this.add(sp);
    });

    if (pecas.arma && cena.textures.exists(pecas.arma.chave)) {
      this.arma = cena.add.image(0, 0, pecas.arma.chave).setOrigin(0, 0);
      this.fichaArma = encaixes()?.armas[pecas.arma.nome];
      this.add(this.arma);
    }

    // o quadro so muda de verdade quando a animacao vira, entao encaixamos ali.
    // o passo do pe sai do mesmo lugar, e nao de um cronometro: CICLO_CAMINHADA
    // e [passoA, parado, passoB, parado], entao o pe encosta nos quadros 1 e 3.
    // Assim mexer em FPS_CAMINHADA nao desencontra o som do desenho.
    spriteCorpo.off(Phaser.Animations.Events.ANIMATION_UPDATE);
    spriteCorpo.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      (_anim: Phaser.Animations.Animation, quadro: Phaser.Animations.AnimationFrame) => {
        this.encaixar();
        if (this.estado !== "anda") return;
        if (quadro.index === 1 || quadro.index === 3) this.avisarPasso?.();
      }
    );
    this.encaixar();
  }

  /** Poe roupa e arma no lugar para o quadro que o corpo esta mostrando agora.
   *
   *  Roda a cada troca de quadro da caminhada. E barato: dois setPosition e um
   *  setFrame, nenhuma conta de anatomia, porque a conta ja veio pronta da arte. */
  private encaixar() {
    const tabela = encaixes();
    const corpo = this.camadas[0]?.sprite;
    if (!tabela || !corpo) return;
    const pontos = tabela.pontos[this.raca] ?? tabela.pontos.vale;
    if (!pontos) return;
    const q = Number(corpo.frame.name);
    if (!Number.isFinite(q)) return;

    if (this.roupa) {
      const tronco = pontos.tronco[q];
      if (tronco) {
        this.roupa.setFrame(quadroDaRoupa(q));
        // a peca e desenhada centrada em 16 px de largura, e a linha 0 dela e a
        // linha de cima do tronco. o sprite do corpo tem origem no pe, entao o
        // canto de cima e a esquerda do quadro fica em (-8, -32)
        this.roupa.setPosition(-8, tronco[1] - ALTURA_PERSONAGEM);
      }
    }

    if (this.arma && this.fichaArma) {
      const mao = pontos.mao[q];
      if (mao) {
        const f = this.fichaArma;
        const espelhado = f.espelha && this.olhando === "esquerda";
        // espelhar vira a textura dentro do proprio retangulo, entao a pega
        // muda de lado junto: e por isso que a conta nao e so trocar o sinal
        const pegaX = espelhado ? f.largura - 1 - f.pega[0] : f.pega[0];
        this.arma.setFlipX(espelhado);
        this.arma.setPosition(mao[0] - pegaX - 8, mao[1] - f.pega[1] - ALTURA_PERSONAGEM);
      }
    }
  }

  /** A arma fica atras do corpo quando o personagem anda de costas: de costas a
   *  mao esta do outro lado do tronco, e a arma na frente da barriga denuncia
   *  que e um adesivo colado por cima. */
  private ordenarArma() {
    if (!this.arma || !this.fichaArma) return;
    const atras = this.fichaArma.atras && this.olhando === "cima";
    this.moveTo(this.arma, atras ? 0 : this.length - 1);
  }

  private tocar(novo: typeof this.estado) {
    this.estado = novo;
    const sufixo = novo === "anda" ? "anda" : novo;
    this.camadas.forEach((c) => c.sprite.play(`${c.chave}-${sufixo}-${this.olhando}`, true));
    this.ordenarArma();
    this.encaixar();
  }

  mover(dx: number, dy: number) {
    if (this.estado === "conjura" || this.estado === "tonto" || this.estado === "ataque" || this.estado === "machucado") {
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
    const dir = direcaoDe(dx, dy) ?? this.olhando;
    if (this.estado !== "anda" || dir !== this.olhando) {
      this.olhando = dir;
      this.tocar("anda");
    }
  }

  parar() {
    this.body?.setVelocity(0, 0);
    this.tocar("parado");
  }

  /** Vira para um lado sem sair do lugar.
   *
   *  A direcao so mudava dentro de mover(), e por isso quem andava para o norte
   *  e atacava um goblin a leste sem se mexer atacava com o braco esticado para
   *  o norte. Andando isso nunca aparece, porque quem anda ja esta olhando para
   *  onde vai. Em combate e o contrario: o heroi fica parado na casa dele e
   *  escolhe o alvo com o dedo, entao atacar sem andar e a regra, nao a excecao.
   *
   *  Repete a animacao do estado atual na direcao nova em vez de forcar
   *  "parado": chamar isto no meio de um golpe nao pode cancelar o golpe. */
  encarar(dx: number, dy: number) {
    const dir = direcaoDe(dx, dy);
    if (!dir || dir === this.olhando) return;
    this.olhando = dir;
    this.tocar(this.estado);
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

  /** O golpe de arma ou sem arma. Volta sozinho ao normal. */
  atacar(duracao = 400) {
    this.tocar("ataque");
    this.scene.time.delayedCall(duracao, () => {
      if (this.estado === "ataque") this.tocar("parado");
    });
  }

  /** Levou um golpe. So a reacao visual: coracao e derrota sao do sistema de
   *  combate, aqui e so o quadro. */
  machucar(duracao = 400) {
    this.tocar("machucado");
    this.scene.time.delayedCall(duracao, () => {
      if (this.estado === "machucado") this.tocar("parado");
    });
  }

  /** Avisa a cada pe que encosta no chao. Quem escolhe o som e a cena, porque
   *  so ela sabe de que e feito o chao naquele ponto. */
  aoPassar(callback: () => void) {
    this.avisarPasso = callback;
  }

  atualizarProfundidade() {
    this.setDepth(this.y);
  }

  /** ponto logo a frente do heroi, usado para saber com o que ele quer falar */
  frente(): Phaser.Math.Vector2 {
    // ponto logo a frente, na direcao em que ele olha. as diagonais usam a
    // media das duas retas que as compoem
    const d: Record<NomeDirecao, [number, number]> = {
      baixo: [0, 12],
      cima: [0, -18],
      esquerda: [-13, -6],
      direita: [13, -6],
      "baixo-esquerda": [-10, 6],
      "baixo-direita": [10, 6],
      "cima-esquerda": [-10, -14],
      "cima-direita": [10, -14],
    };
    const p = d[this.olhando];
    return new Phaser.Math.Vector2(this.x + p[0], this.y + p[1]);
  }

  /** Troca a aparencia inteira sem recriar o objeto. Usado na tela de criacao. */
  trocarAparencia(ficha: FichaHeroi) {
    this.montar(ficha);
    this.tocar(this.estado);
  }

  chavesDeTextura(): string[] {
    return this.camadas.map((c) => c.chave);
  }
}
