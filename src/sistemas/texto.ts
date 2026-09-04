/** Todo texto do jogo passa por aqui.
 *
 * Usa fonte de bitmap (public/assets/fonte.png + fonte.xml) em vez da fonte do
 * sistema. Fonte de sistema, mesmo sendo de pixel, sai do rasterizador do navegador
 * com meio tom na borda, e o meio tom vira borrao quando o canvas e ampliado.
 * Bitmap nao tem meio tom nenhum.
 *
 * Tamanhos: use sempre multiplo de 8. A fonte foi desenhada em 8 px, entao 8, 16,
 * 24 e 32 ficam perfeitos e qualquer valor no meio volta a borrar.
 *
 * Duas correcoes de metrica moram aqui, e valem para TODO texto do jogo:
 *
 * 1. O ESPACO ENTRE LETRAS. A Silkscreen em 8 px avanca 6 px para uma letra
 *    desenhada em 4: metade da largura de cada letra vira vao. A frase "Voce
 *    enxerga no escuro e de bem longe" ocupava 208 px e passa a ocupar 170, e
 *    numa linha de 256 px cabem 64 letras em vez de 51. Nao e so densidade: com
 *    o vao antigo a palavra se desmancha e a crianca le letra por letra.
 *
 * 2. O CENTRO OPTICO. A linha tem 10 px de altura e a letra ocupa de 4 a 9,
 *    entao 4 px de cada linha sao ar acima da letra. Centrar pela caixa joga o
 *    texto 1,5 px abaixo do centro de verdade, e era isso que desalinhava todo
 *    rotulo dentro de botao e de chapinha.
 */
import Phaser from "phaser";

export const FONTE_BITMAP = "aurora";

/** Quanto encolher o avanco de cada letra. Ver a nota 1 no topo do arquivo. */
export const TRACKING = -1;

/** O maior avanco da fonte, ja com o tracking. Serve para medir por cima quando
 *  nao da para perguntar a fonte de verdade: nenhuma letra passa disto. */
export const AVANCO_MAX = 7 + TRACKING;

/** Quanto o texto sobe para ficar no centro optico. Ver a nota 2 no topo. */
const DESVIO_OPTICO = 2;

/** Marca o objeto para o auditor de UI saber o que ele e.
 *  Mora aqui, e nao em design.ts, so para nao criar import circular. */
export function marcar(
  obj: Phaser.GameObjects.GameObject,
  tipo: "texto" | "botao" | "painel" | "icone" | "fundo",
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
  const tamanho = op.tamanho ?? 8;
  const t = cena.add.bitmapText(x, y, FONTE_BITMAP, conteudo, tamanho);
  // o Phaser ja multiplica o espacamento pela escala da fonte, entao o valor
  // aqui e sempre o mesmo: multiplicar de novo colava as letras no corpo 16
  t.setLetterSpacing(TRACKING);
  if (op.cor !== undefined) t.setTint(op.cor);
  if (op.larguraMax) t.setMaxWidth(op.larguraMax);
  if (op.alinhamento !== undefined) t.setCenterAlign?.();
  if (op.alinhamento === 1) t.setCenterAlign();
  if (op.alinhamento === 2) t.setRightAlign();
  if (op.entrelinha !== undefined) t.setLineSpacing(op.entrelinha);
  t.setOrigin(op.ancora ?? 0, op.ancoraY ?? 0);
  // so quem pede para centrar verticalmente precisa da correcao: quem ancora no
  // topo ja esta onde mandou
  if (op.ancoraY === 0.5) t.y -= (DESVIO_OPTICO * (tamanho / 8)) / 2;
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

/** Largura exata de um texto, perguntando as metricas da fonte carregada.
 *
 *  Existe porque medir "8 px por letra" errava por ate 60%: a fonte avanca de 3
 *  a 7 px conforme a letra. Quem monta chip e chapinha precisa da largura de
 *  verdade, senao sobra ou falta borda. */
export function medirTexto(cena: Phaser.Scene, conteudo: string, tamanho: 8 | 16 | 24 | 32 = 8) {
  const fonte = cena.cache.bitmapFont.get(FONTE_BITMAP) as
    | { data: { chars: Record<number, { xAdvance: number }>; size: number } }
    | undefined;
  if (!fonte) return conteudo.length * (AVANCO_MAX * (tamanho / 8));
  const escala = tamanho / fonte.data.size;
  let largura = 0;
  for (const ch of conteudo) {
    const c = fonte.data.chars[ch.charCodeAt(0)];
    largura += ((c?.xAdvance ?? AVANCO_MAX) + TRACKING) * escala;
  }
  return Math.ceil(largura);
}
