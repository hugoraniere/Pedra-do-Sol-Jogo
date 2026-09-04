/** Le teclado, e num toque le o direcional na tela.
 *  Uma fonte so de entrada para todas as cenas. */
import Phaser from "phaser";

export type Direcao = { x: number; y: number };

export class Controles {
  private teclas!: Record<string, Phaser.Input.Keyboard.Key>;
  /** preenchido pela cena de HUD quando o jogador usa o direcional na tela */
  toque: Direcao = { x: 0, y: 0 };
  acaoTocada = false;

  constructor(cena: Phaser.Scene) {
    const kb = cena.input.keyboard;
    if (kb) {
      this.teclas = kb.addKeys(
        "W,A,S,D,UP,LEFT,DOWN,RIGHT,SPACE,ENTER,ESC,P"
      ) as Record<string, Phaser.Input.Keyboard.Key>;
    }
  }

  direcao(): Direcao {
    let x = this.toque.x;
    let y = this.toque.y;
    const t = this.teclas;
    if (t) {
      if (t.A.isDown || t.LEFT.isDown) x = -1;
      else if (t.D.isDown || t.RIGHT.isDown) x = 1;
      if (t.W.isDown || t.UP.isDown) y = -1;
      else if (t.S.isDown || t.DOWN.isDown) y = 1;
    }
    return { x, y };
  }

  /** true uma unica vez por aperto de ESC ou P */
  pausaApertada(): boolean {
    const t = this.teclas;
    if (!t) return false;
    return (
      Phaser.Input.Keyboard.JustDown(t.ESC) || Phaser.Input.Keyboard.JustDown(t.P)
    );
  }

  /** true uma unica vez por aperto */
  acaoApertada(): boolean {
    if (this.acaoTocada) {
      this.acaoTocada = false;
      return true;
    }
    const t = this.teclas;
    if (!t) return false;
    return (
      Phaser.Input.Keyboard.JustDown(t.SPACE) ||
      Phaser.Input.Keyboard.JustDown(t.ENTER)
    );
  }

  /** Espaco ou Enter fisicamente pressionados agora, sem consumir nada.
   *
   *  Existe so para quem precisa saber "o dedo ainda esta em cima do
   *  botao?" depois de um acaoApertada() — segurar Espaco/Enter dispara
   *  repeticao de tecla do sistema operacional, e cada repeticao E um
   *  "recem apertado" valido de verdade. Sem isto, fechar uma fala com o
   *  botao ainda segurado reabria a proxima na hora, porque o heroi
   *  continua parado do lado do mesmo interagivel: parecia um loop que
   *  nunca terminava, e so terminava quando o dedo finalmente soltava. */
  acaoSegurada(): boolean {
    const t = this.teclas;
    if (!t) return false;
    return t.SPACE.isDown || t.ENTER.isDown;
  }
}
