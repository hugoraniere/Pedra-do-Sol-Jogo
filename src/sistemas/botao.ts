/** Botao grande, com painel de 9 fatias e sombra solida, igual ao material impresso.
 *  Alvo de toque generoso, porque quem joga tem 7 anos. */
import Phaser from "phaser";
import { COR, FONTE, CORPO } from "../dados/config";

export type Botao = Phaser.GameObjects.Container & { marcar(ligado: boolean): void };

export function botao(
  cena: Phaser.Scene,
  x: number,
  y: number,
  largura: number,
  altura: number,
  texto: string,
  aoTocar: () => void,
  painel: "painel" | "painel-creme" | "painel-ouro" = "painel"
): Botao {
  const c = cena.add.container(x, y) as Botao;
  const sombra = cena.add
    .nineslice(0, 3, "painel-escuro", undefined, largura, altura, 8, 8, 8, 8)
    .setOrigin(0.5);
  const fundo = cena.add
    .nineslice(0, 0, painel, undefined, largura, altura, 8, 8, 8, 8)
    .setOrigin(0.5);
  const rotulo = cena.add
    .text(0, 0, texto, { fontFamily: FONTE, fontSize: CORPO, color: "#2C2440" })
    .setOrigin(0.5)
    .setResolution(1);
  c.add([sombra, fundo, rotulo]);
  c.setSize(largura, altura + 3);
  c.setInteractive({ useHandCursor: true });

  const apertar = (v: number) => {
    fundo.y = v;
    rotulo.y = v;
  };
  c.on("pointerdown", () => apertar(2));
  c.on("pointerup", () => {
    apertar(0);
    aoTocar();
  });
  c.on("pointerout", () => apertar(0));

  c.marcar = (ligado: boolean) => {
    fundo.setTexture(ligado ? "painel-ouro" : painel);
    rotulo.setColor(ligado ? "#2C2440" : "#5A4E74");
  };
  c.marcar(false);
  void COR;
  return c;
}
