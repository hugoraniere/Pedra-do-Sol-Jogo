/** Todo texto do jogo passa por aqui.
 *
 * Usa fonte de bitmap (public/assets/fonte.png + fonte.xml) em vez da fonte do
 * sistema. Fonte de sistema, mesmo sendo de pixel, sai do rasterizador do navegador
 * com meio tom na borda, e o meio tom vira borrao quando o canvas e ampliado.
 * Bitmap nao tem meio tom nenhum.
 *
 * Tamanhos: use sempre multiplo de 8. A fonte foi desenhada em 8 px, entao 8, 16,
 * 24 e 32 ficam perfeitos e qualquer valor no meio volta a borrar.
 */
import Phaser from "phaser";

export const FONTE_BITMAP = "aurora";

/** Marca o objeto para o auditor de UI saber o que ele e.
 *  Mora aqui, e nao em design.ts, so para nao criar import circular. */
export function marcar(
  obj: Phaser.GameObjects.GameObject,
  tipo: "texto" | "botao" | "painel" | "icone" | "fundo" | "palco",
  dono?: string
) {
  obj.setData("ui", { tipo, dono });
  return obj;
}

export type OpcoesTexto = {
  tamanho?: 8 | 16 | 24 | 32;
  cor?: number;
  /** 0 esquerda, 0.5 centro, 1 direita */
  ancora?: number;
  /** 0 topo, 0.5 meio, 1 base */
  ancoraY?: number;
  larguraMax?: number;
  alinhamento?: 0 | 1 | 2;
  entrelinha?: number;
};

export function texto(
  cena: Phaser.Scene,
  x: number,
  y: number,
  conteudo: string,
  op: OpcoesTexto = {}
): Phaser.GameObjects.BitmapText {
  const t = cena.add.bitmapText(x, y, FONTE_BITMAP, conteudo, op.tamanho ?? 8);
  if (op.cor !== undefined) t.setTint(op.cor);
  if (op.larguraMax) t.setMaxWidth(op.larguraMax);
  if (op.alinhamento !== undefined) t.setCenterAlign?.();
  if (op.alinhamento === 1) t.setCenterAlign();
  if (op.alinhamento === 2) t.setRightAlign();
  if (op.entrelinha !== undefined) t.setLineSpacing(op.entrelinha);
  t.setOrigin(op.ancora ?? 0, op.ancoraY ?? 0);
  marcar(t, "texto", conteudo.slice(0, 24));
  return t;
}

/** Texto com sombra dura embaixo. Usado em titulo e em coisa que fica sobre a arte. */
export function textoComSombra(
  cena: Phaser.Scene,
  x: number,
  y: number,
  conteudo: string,
  op: OpcoesTexto = {},
  corSombra = 0x2c2440
): Phaser.GameObjects.BitmapText {
  // a sombra cresce junto com a letra, senao some no titulo grande
  const desvio = Math.max(1, Math.round((op.tamanho ?? 8) / 8));
  marcar(texto(cena, x + desvio, y + desvio, conteudo, { ...op, cor: corSombra }), "fundo");
  return texto(cena, x, y, conteudo, op);
}

/** Quanto um texto vai ocupar de largura, perguntado a fonte em vez de estimado.
 *
 *  A fonte de bitmap e proporcional: o M e o l tem a mesma altura e larguras bem
 *  diferentes. Contar caractere vezes 8 erra para os dois lados, e foi assim que
 *  "Tunica de mago" saiu por cima das setas na tela de aparencia em 256 px. Aqui
 *  quem responde e o proprio Phaser, com o mesmo calculo que ele usa ao desenhar.
 */
export function larguraDoTexto(
  cena: Phaser.Scene,
  conteudo: string,
  tamanho: 8 | 16 | 24 | 32 = 8
): number {
  const medida = cena.add.bitmapText(0, 0, FONTE_BITMAP, conteudo, tamanho).setVisible(false);
  const largura = medida.width;
  medida.destroy();
  return largura;
}
