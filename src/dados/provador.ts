/** O conteudo do provador de combate. E SO DADO, igual conteudo.ts.
 *
 * O provador existe para responder se o combate POR TURNOS, no molde do
 * Baldur's Gate 3, cabe neste jogo. Ver docs/plano-do-combate.md.
 *
 * Os icones tem folha propria, public/assets/icones.png, escrita em
 * arte/icones.py: retratos para a trilha de turnos, acoes para a barra, e as
 * seis faces do dado.
 *
 * ATENCAO a unidade: por turnos, **alcance e espera nao sao pixel nem
 * milissegundo**. Alcance conta CASAS e espera conta TURNOS. Era a coisa mais
 * facil de deixar passar na virada para turnos, e a que mais confundiria depois.
 */
import type { Comportamento } from "../sistemas/criatura";
import type { Marca } from "../sistemas/marcas";

/** Os quadros de public/assets/icones.png, na ordem de arte/icones.py.
 *  Folha propria do combate, separada de ui.png. */
export const ICONE = {
  retratoHeroi: 0,
  retrato: {
    magricela: 1, gorducho: 2, moleque: 3, chefe: 4,
    aranha: 27, "lobo-nevoa": 28,
  } as Record<string, number>,
  cajado: 5, punho: 6, fogo: 7, gelo: 8, trovao: 9, sopro: 10,
  /** dado1 fica em 11: a face N e `dadoBase + N - 1` */
  dadoBase: 11,
} as const;

/** Que pedaco do mundo a acao atinge. */
export type Forma = "casa" | "linha" | "aoRedor";

export type AcaoDeProva = {
  id: string;
  tipo: "golpe" | "magia" | "skill";
  nome: string;
  /** quadro da folha icones.png */
  icone: number;
  cor: number;
  forma: Forma;
  /** em CASAS, contando diagonal como 1 */
  alcance: number;
  /** de quantos turnos ela precisa para voltar. 0 = todo turno */
  espera: number;
  /** skill: 1 uso por combate inteiro */
  usosPorCombate?: number;
  /** que atributo entra no 1d6. Golpe usa FORCA, magia usa ESPERTEZA, igual a mesa */
  atributo: "forca" | "esperteza" | "coracao";
  /** uma frase curta, mostrada quando o dedo ou o mouse para em cima do slot */
  dica: string;
  som: "cajado" | "soco" | "fogo" | "gelo" | "voz";
  /** o verbo que ela imprime em quem acerta. So Bafo Gelado tem uma nesta
   *  fase (Fase 3 do plano); as outras marcas chegam na Fase 4, junto com as
   *  superficies de chao que a maioria delas muda. */
  marca?: Marca;
};

/** Os seis slots. Cada um prova uma coisa diferente do turno.
 *
 *  1 golpe de arma    alcance 1, todo turno
 *  2 golpe sem arma   alcance 1, todo turno, sempre disponivel
 *  3 magia de casa    alcance longo, espera 2 turnos
 *  4 magia de linha   pega todo mundo no caminho
 *  5 magia ao redor   nao pede alvo: dispara no toque do slot
 *  6 skill            um uso no combate inteiro, e o slot apaga */
export const ACOES_DE_PROVA: AcaoDeProva[] = [
  { id: "golpe-cajado", tipo: "golpe", nome: "CAJADO", dica: "Bate de perto. O cajado nao foi feito pra isso.", icone: ICONE.cajado, cor: 0xb08658, forma: "casa", alcance: 1, espera: 0, atributo: "forca", som: "cajado" },
  { id: "soco", tipo: "golpe", nome: "SEM ARMA", dica: "Sempre da pra usar. Nunca quebra nada.", icone: ICONE.punho, cor: 0x4a3e64, forma: "casa", alcance: 1, espera: 0, atributo: "forca", som: "soco" },
  { id: "bola-de-fogo", tipo: "magia", nome: "BOLA DE FOGO", dica: "Uma bola de fogo que voa longe.", icone: ICONE.fogo, cor: 0xf2802b, forma: "casa", alcance: 6, espera: 2, atributo: "esperteza", som: "fogo" },
  { id: "bafo-gelado", tipo: "magia", nome: "BAFO GELADO", dica: "Um sopro que pega todo mundo na linha.", icone: ICONE.gelo, cor: 0x7ec4f2, forma: "linha", alcance: 3, espera: 2, atributo: "esperteza", som: "gelo", marca: "gelo" },
  { id: "voz-de-trovao", tipo: "magia", nome: "VOZ DE TROVAO", dica: "Um grito que pega todo mundo em volta.", icone: ICONE.trovao, cor: 0x7b5ac4, forma: "aoRedor", alcance: 3, espera: 3, atributo: "esperteza", som: "voz" },
  { id: "sopro-quentinho", tipo: "skill", nome: "SOPRO QUENTINHO", dica: "So uma vez por luta. Vale a pena guardar.", icone: ICONE.sopro, cor: 0xf5b62b, forma: "casa", alcance: 2, espera: 0, usosPorCombate: 1, atributo: "coracao", som: "fogo" },
];

/** Quanto o heroi anda por turno, em casas. `goblin` fica so para o Provador
 *  (a bancada de teste, que so simula goblins) -- o combate de verdade usa
 *  `movimentoDaCriatura()` para qualquer criatura, incluindo o goblin. */
export const MOVIMENTO = { heroi: 5, goblin: 3 };

/** Quanto uma criatura anda por turno, a partir da `velocidade` (px/s) da
 *  ficha dela em `BESTIARIO` -- antes so o goblin tinha numero proprio
 *  (`MOVIMENTO.goblin`), o resto teria usado o mesmo por acidente em
 *  `Combate.ts`. A conta reproduz o 3 do goblin (velocidade 70) sem ele
 *  precisar continuar caso especial: `Math.round(velocidade / 24)`, nunca
 *  menos que 2 casas. */
export function movimentoDaCriatura(velocidade: number): number {
  return Math.max(2, Math.round(velocidade / 24));
}

/** A quantas casas uma criatura percebe o heroi e o combate comeca. */
export const DISTANCIA_QUE_NOTA = 5;

/** A arena, 24 por 16 casas. O rio existe para provar o que o anel de raio
 *  mentiria: ele acenderia o outro lado da agua, e a busca casa a casa nao. */
export const ARENA = {
  chao: [
    '""""""""""""""""""""""""',
    '".....,................"',
    '"......................"',
    '"...,..........,......."',
    '"......................"',
    '"..........pppppp......"',
    '"..........p....p......"',
    '"..........p....p......"',
    '"..........pppppp......"',
    '"......................"',
    '"..~~~~~~~~............"',
    '"..~~~~~~~~.......,...."',
    '"......................"',
    '"....,................."',
    '"......................"',
    '""""""""""""""""""""""""',
  ],
  entrada: { x: 6, y: 6 },
  /** `bonus` e o que a criatura soma no 1d6 dela. Agora ela ROLA tambem: os dois
   *  lados usam o mesmo dado e a mesma tabela de tres faixas, e o jogador ve as
   *  duas rolagens no mesmo cartao. Ver docs/plano-do-combate.md.
   *
   *  `comportamento` e o que decide o que ela FAZ no proprio turno, ver
   *  src/sistemas/criatura.ts. Os quatro tipos cobrem os tres, de proposito:
   *  magricela (medroso) prova a fuga, gorducho e chefe (curioso) provam a
   *  perseguicao, moleque (passeia) prova o "ignora ate encostar". */
  goblins: [
    { sprite: "goblin-magricela", nome: "MAGRICELA", x: 14, y: 3, coracoes: 1, bonus: 0, comportamento: "medroso" as Comportamento },
    { sprite: "goblin-gorducho", nome: "GORDUCHO", x: 18, y: 7, coracoes: 2, bonus: 1, comportamento: "curioso" as Comportamento },
    { sprite: "goblin-moleque", nome: "MOLEQUE", x: 12, y: 12, coracoes: 1, bonus: 0, comportamento: "passeia" as Comportamento },
    { sprite: "goblin-chefe", nome: "CHEFE", x: 20, y: 11, coracoes: 3, bonus: 2, comportamento: "curioso" as Comportamento },
  ],
  arbustos: [
    { x: 9, y: 3 },
    { x: 13, y: 9 },
    { x: 17, y: 13 },
  ],
  /** o goblin invisivel. So aparece se levar golpe, e so entra na ordem de
   *  turno depois de aparecer: nao da para o jogador esperar a vez de alguem
   *  que ele nao sabe que existe. */
  invisivel: { sprite: "goblin-magricela", nome: "ESCONDIDO", x: 8, y: 8, coracoes: 2, bonus: 0, comportamento: "medroso" as Comportamento },
};
