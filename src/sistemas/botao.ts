/** Botao grande, com painel de 9 fatias e sombra solida, igual ao material impresso.
 *  Alvo de toque generoso, porque quem joga tem 7 anos. */
import Phaser from "phaser";
import { COR } from "../dados/config";
import { texto, marcar } from "./texto";
import { tocar, type ChaveEfeito } from "./som";


export type Botao = Phaser.GameObjects.Container & { marcar(ligado: boolean): void };

export function botao(
  cena: Phaser.Scene,
  x: number,
  y: number,
  largura: number,
  altura: number,
  rotuloTexto: string,
  aoTocar: () => void,
  painel: "painel" | "painel-creme" | "painel-ouro" = "painel",
  /** o som do toque. Todo botao confirma; quem volta passa "menu-volta",
   *  porque voltar e desfazer e nao deve soar como escolher. */
  somDoToque: ChaveEfeito = "menu-confirma"
): Botao {
  const c = cena.add.container(x, y) as Botao;
  const sombra = cena.add
    .nineslice(0, 3, "painel-escuro", undefined, largura, altura, 8, 8, 8, 8)
    .setOrigin(0.5);
  const fundo = cena.add
    .nineslice(0, 0, painel, undefined, largura, altura, 8, 8, 8, 8)
    .setOrigin(0.5);
  const rotulo = texto(cena, 0, 0, rotuloTexto, { ancora: 0.5, ancoraY: 0.5, cor: 0x2c2440 });
  c.add([sombra, fundo, rotulo]);
  c.setSize(largura, altura + 3);
  c.setInteractive({ useHandCursor: true });

  const apertar = (v: number) => {
    fundo.y = v;
    rotulo.y = v;
  };
  // o som sai no pointerdown, junto com o afundar: som de botao atrasado ate
  // o dedo levantar nao parece resposta ao toque, parece coincidencia
  c.on("pointerdown", () => {
    apertar(2);
    tocar(somDoToque);
  });
  c.on("pointerup", () => {
    apertar(0);
    aoTocar();
  });
  // no computador o mouse passa por cima antes de clicar, e o foco tem som
  // proprio. No toque isso nunca dispara, e esta certo: dedo nao paira.
  c.on("pointerover", () => tocar("menu-foco"));
  c.on("pointerout", () => apertar(0));

  c.marcar = (ligado: boolean) => {
    fundo.setTexture(ligado ? "painel-ouro" : painel);
    rotulo.setTint(ligado ? 0x2c2440 : 0x4a3e64);
  };
  c.marcar(false);
  marcar(c, "botao", rotuloTexto);
  void COR;
  return c;
}
