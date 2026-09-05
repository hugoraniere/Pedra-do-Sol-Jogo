/** O catalogo de efeitos do combate: flash, tremor, squash, particula, hitstop.
 *
 * Nasceu porque `Provador.ts` tinha o mesmo tween de "pisca branco e volta" ou
 * "encolhe e volta" escrito quatro ou cinco vezes, cada vez com um numero
 * ligeiramente diferente. Aqui cada efeito existe UMA vez, com o numero que
 * `docs/interface-de-combate.md` (secao 4.2) e `docs/plano-de-implementacao.md`
 * (Fase 0) ja fixaram.
 *
 * Regra do arquivo: nenhuma funcao aqui sabe o que e um Bicho, uma Acao ou um
 * Slot. Elas recebem a cena e o alvo, e nada mais. E o que deixa este modulo
 * servir a criacao de personagem e o mundo normal, nao so o combate.
 *
 * Toda funcao devolve a Tween (ou null se nao criou nenhuma, caso de duracao 0),
 * para quem chamou poder ouvir `onComplete` quando precisar encadear.
 */
import Phaser from "phaser";

/** Os tipos de alvo que as funcoes aqui aceitam: qualquer GameObject com
 *  posicao, escala e alpha, que e o que Sprite, Image e Container tem em
 *  comum e o que todo efeito daqui mexe. */
type Alvo =
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.NineSlice;

/** Config extra que a chamada pode misturar por cima do padrao: `angle`,
 *  `onComplete`, um segundo alvo, o que for. Sem isto cada efeito bespoke (o
 *  goblin que gira ao desistir, por exemplo) precisaria da propria copia. */
type Extra = Partial<Phaser.Types.Tweens.TweenBuilderConfig>;

// -------------------------------------------------------------- impacto

/** Pisca branco e volta a cor normal. O flash do golpe acertando. */
export function flashBranco(
  cena: Phaser.Scene,
  alvo: Phaser.GameObjects.Sprite,
  ms = 70
) {
  alvo.setTintFill(0xfff8ea);
  cena.time.delayedCall(ms, () => alvo.clearTint());
}

/** Achata ou estica e volta. `sx`/`sy` sao a escala do PICO, nao a diferenca:
 *  achatar(cena, alvo, 1, 0.8) deixa o alvo 20% mais baixo no meio do tween. */
export function achatar(
  cena: Phaser.Scene,
  alvo: Alvo,
  sx: number,
  sy: number,
  ms = 80,
  extra: Extra = {}
) {
  return cena.tweens.add({
    targets: alvo, scaleX: sx, scaleY: sy, duration: ms, yoyo: true, ...extra,
  });
}

/** O agachar antes de agir: 1 px a menos de altura, 1 a mais de largura, e
 *  ninguem percebe conscientemente, mas sem ele o golpe sai "do nada". Numeros
 *  de docs/interface-de-combate.md secao 4.2. */
export function agachar(cena: Phaser.Scene, alvo: Alvo, ms = 90) {
  return achatar(cena, alvo, 1.08, 0.92, ms, { ease: "Quad.easeOut" });
}

/** O congelamento de impacto: o MUNDO para por `ms`, sem travar a interface.
 *
 *  So `tweens`, `anims` e a fisica ficam parados; `time` continua correndo em
 *  tempo real, entao o proprio delayedCall que religa tudo dispara na hora
 *  certa. Se um dia isto tambem mexer em `cena.time.timeScale`, o delayedCall
 *  de religar precisa nascer ANTES dessa mudanca, senao ele nunca chega. */
export function hitstop(cena: Phaser.Scene, ms: number) {
  if (ms <= 0) return;
  cena.tweens.timeScale = 0;
  cena.anims.pauseAll();
  cena.physics.world.pause();
  cena.time.delayedCall(ms, () => {
    cena.tweens.timeScale = 1;
    cena.anims.resumeAll();
    cena.physics.world.resume();
  });
}

/** Empurra um corpo de fisica para longe de um ponto. `forca` e a velocidade
 *  de saida em px/s; o corpo para sozinho depois de `ms`. Numeros do
 *  documento: 90px/s por 160ms. */
export function empurrar(
  cena: Phaser.Scene,
  corpo: Phaser.Physics.Arcade.Body,
  deX: number,
  deY: number,
  paraX: number,
  paraY: number,
  forca = 90,
  ms = 160
) {
  const v = new Phaser.Math.Vector2(paraX - deX, paraY - deY).normalize().scale(forca);
  corpo.setVelocity(v.x, v.y);
  cena.time.delayedCall(ms, () => corpo.setVelocity(0, 0));
}

// -------------------------------------------------------------- atencao

/** Treme de leve, para dizer "isto nao pode agora" sem bipe de negado. */
export function tremerLeve(cena: Phaser.Scene, alvo: Alvo | Alvo[], px = 1, vezes = 2, ms = 45) {
  return cena.tweens.add({ targets: alvo, x: `+=${px}`, duration: ms, yoyo: true, repeat: vezes });
}

/** Pisca alpha, para invencibilidade temporaria ou qualquer "cuidado, mas
 *  ainda da para jogar" temporario. */
export function piscar(cena: Phaser.Scene, alvo: Alvo, ms = 90, vezes = 3, alphaBaixo = 0.3) {
  return cena.tweens.add({ targets: alvo, alpha: alphaBaixo, duration: ms, yoyo: true, repeat: vezes });
}

/** Nasce pequeno, estica um pouco alem do tamanho final e assenta. O `popIn`
 *  padrao de icone novo: pips de vida, icone de condicao, selo acendendo. */
export function popIn(cena: Phaser.Scene, alvo: Alvo, ms = 140, deOnde = 0.6) {
  alvo.setScale(deOnde);
  return cena.tweens.add({ targets: alvo, scale: 1, duration: ms, ease: "Back.easeOut" });
}

/** Cresce ate `escala` e volta ao tamanho atual. Diferente do `popIn`: aqui o
 *  alvo ja esta na tela e so da um pulo, nao nasce do zero. E o "opa, tinha
 *  algo aqui" de revelar um invisivel, ou qualquer reacao de susto rapida. */
export function pulso(cena: Phaser.Scene, alvo: Alvo, escala = 1.25, ms = 90) {
  return cena.tweens.add({ targets: alvo, scale: escala, duration: ms, yoyo: true });
}

// ------------------------------------------------------------- desaparecer

/** Sobe um pouco enquanto desaparece, e se destroi sozinho no fim. E o "poof"
 *  de quem desiste e o cartao de dado que ja foi lido. */
export function sumirParaCima(
  cena: Phaser.Scene,
  alvo: Alvo | Alvo[],
  distanciaY = 10,
  ms = 380,
  atraso = 0,
  extra: Extra = {}
) {
  const lista = Array.isArray(alvo) ? alvo : [alvo];
  return cena.tweens.add({
    targets: lista, alpha: 0, y: `-=${distanciaY}`, delay: atraso, duration: ms,
    ...extra,
    onComplete: (tw, targets) => {
      lista.forEach((a) => a.destroy());
      extra.onComplete?.(tw, targets, []);
    },
  });
}

/** Um texto que sobe e some, para numero ou palavra que precisa aparecer no
 *  mundo por um instante e depois sumir sozinho, sem ninguem destruir na mao. */
export function textoFlutuante(
  cena: Phaser.Scene,
  texto: Phaser.GameObjects.BitmapText,
  distanciaY = 14,
  ms = 420
) {
  return cena.tweens.add({
    targets: texto, y: texto.y - distanciaY, alpha: 0, duration: ms, ease: "Quad.easeOut",
    onComplete: () => texto.destroy(),
  });
}

// -------------------------------------------------------------- particula

/** Uma nuvem de pontinhos espalhando, sem direcao preferida. A poeira do golpe
 *  no vazio, ou de um objeto quebrando. */
export function estourinho(
  cena: Phaser.Scene,
  x: number,
  y: number,
  cor: number,
  quantidade = 5,
  raio = 9,
  alphaInicial = 0.9
) {
  for (let i = 0; i < quantidade; i++) {
    const p = cena.add.circle(x, y, 1.5, cor, alphaInicial).setDepth(y + 1);
    cena.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-raio, raio),
      y: y + Phaser.Math.Between(-raio, Math.round(raio * 0.3)),
      alpha: 0, duration: 300,
      onComplete: () => p.destroy(),
    });
  }
}

/** Pontinhos saltando pra cima e pros lados, com um respiro no meio do voo. O
 *  confete de quando uma criatura desiste ou de quando algo bom acontece. */
export function confete(cena: Phaser.Scene, x: number, y: number, cor: number, quantidade = 3) {
  for (let i = 0; i < quantidade; i++) {
    const p = cena.add.circle(x, y, 1.5, cor).setDepth(2000);
    cena.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-12, 12), y: y - Phaser.Math.Between(20, 30),
      alpha: 0, duration: 420, ease: "Back.easeOut",
      onComplete: () => p.destroy(),
    });
  }
}

// --------------------------------------------------------------- projetil

/** Uma bolinha que viaja do PE de quem atira ate o alvo, e desaparece la —
 *  o que faltava pra golpe de longe (arco, Bola de Fogo) nao parecer que o
 *  efeito nasceu do nada em cima do alvo. `onChegar` roda quando ela chega,
 *  pra quem chamou saber a hora certa de tocar o impacto. */
export function projetil(
  cena: Phaser.Scene,
  x1: number, y1: number,
  x2: number, y2: number,
  cor: number,
  ms = 220,
  onChegar?: () => void
) {
  const bola = cena.add.circle(x1, y1, 2, cor).setDepth(9999);
  const rastro: Phaser.GameObjects.Arc[] = [];
  const evento = cena.time.addEvent({
    delay: 30,
    loop: true,
    callback: () => {
      const p = cena.add.circle(bola.x, bola.y, 1.3, cor, 0.35).setDepth(9998);
      rastro.push(p);
      cena.tweens.add({ targets: p, alpha: 0, duration: 180, onComplete: () => p.destroy() });
    },
  });
  cena.tweens.add({
    targets: bola, x: x2, y: y2, duration: ms, ease: "Quad.easeIn",
    onComplete: () => {
      evento.remove();
      bola.destroy();
      onChegar?.();
    },
  });
}

// ------------------------------------------------------------------ magia

/** A onda de conjuracao: uma elipse achatada (2:1, a mesma proporcao do anel
 *  de alcance, porque as duas vivem no chao) que nasce no PE de quem conjura,
 *  cresce ate `raioFinal` e desaparece. Sem ela, lancar uma magia e visualmente
 *  identico a nao fazer nada — este e o efeito de maior retorno da lista. */
export function ondaDeConjuracao(
  cena: Phaser.Scene,
  x: number,
  y: number,
  cor: number,
  raioFinal = 14,
  ms = 320
) {
  const onda = { raio: 2 };
  const desenho = cena.add.graphics().setDepth(y - 1);
  cena.tweens.add({
    targets: onda,
    raio: raioFinal,
    duration: ms,
    ease: "Cubic.easeOut",
    onUpdate: () => {
      const fracao = (onda.raio - 2) / (raioFinal - 2);
      desenho.clear();
      desenho.lineStyle(1, cor, 0.9 * (1 - fracao)).strokeEllipse(x, y, onda.raio * 2, onda.raio);
    },
    onComplete: () => desenho.destroy(),
  });
}
