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
 * A fonte e desenhada pixel por pixel em arte/fonte.py, e nao rasterizada de um
 * .ttf. Ela e proporcional (o "i" avanca 2 px e o "m" avanca 6) e ja traz 1 px
 * de ar dentro do proprio avanco, entao aqui nao se mexe mais no espacamento:
 * a Silkscreen antiga precisava de tracking negativo porque avancava 6 px para
 * uma letra desenhada em 4.
 *
 * O CENTRO OPTICO deixou de ser correcao daqui e virou desenho: a fonte ocupa a
 * linha de 10 px inteira, com a maiuscula de 2 a 7 e a perna do "g" ate 9, e ai
 * o meio da caixa ja e o meio do texto. Corrigir por fora era pior do que
 * parecia: mover o objeto move a CAIXA junto, e a caixa deslocada invadia a
 * linha de baixo. Foi assim que o nome do heroi passou a esbarrar na raca dele
 * dentro da ficha, sem nada estar visivelmente errado na tela.
 */
import Phaser from "phaser";

export const FONTE_BITMAP = "aurora";

/** Quanto encolher o avanco de cada letra. A fonte ja vem com o ar certo. */
export const TRACKING = 0;

/** O maior avanco da fonte, ja com o tracking. Serve para medir por cima quando
 *  nao da para perguntar a fonte de verdade: nenhuma letra passa disto. */
export const AVANCO_MAX = 6 + TRACKING;

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
  const tamanho = op.tamanho ?? 8;
  const t = cena.add.bitmapText(x, y, FONTE_BITMAP, conteudo, tamanho);
  // o Phaser ja multiplica o espacamento pela escala da fonte, entao o valor
  // aqui e sempre o mesmo: multiplicar de novo colava as letras no corpo 16
  t.setLetterSpacing(TRACKING);
  if (op.cor !== undefined) t.setTint(op.cor);
  if (op.larguraMax) t.setMaxWidth(op.larguraMax);
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
