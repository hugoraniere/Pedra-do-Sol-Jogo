/** Mapas do jogo.
 *
 * O CHAO e desenhado em texto, um caractere por tile:
 *   .  grama       ,  flores       "  grama alta    -  terra
 *   p  caminho     ~  agua         P  pedra         a  areia
 *   c  chao de caverna              C  parede de caverna
 *   m  chao de madeira
 *
 * Tudo que fica EM CIMA do chao (casa, arvore, poco, cerca, npc) nao entra no
 * desenho: vai nas listas objetos e pessoas, em coordenada de tile. Isso permite
 * pecas maiores que um tile e deixa o desenho do chao limpo de ler.
 *
 * Objeto e ancorado pelo PE: a base encosta na linha de baixo do tile indicado.
 */
import { T } from "./config";

const LETRA_TILE: Record<string, number[]> = {
  ".": [T.grama, T.grama2, T.grama3],
  ",": [T.flores],
  '"': [T.gramaAlta],
  "-": [T.terra],
  p: [T.caminho],
  "~": [T.agua, T.agua2],
  P: [T.pedra],
  a: [T.areia],
  c: [T.chaoCaverna],
  C: [T.paredeCaverna],
  m: [T.madeiraChao],
};

export type Peca = { nome: string; x: number; y: number; solido?: boolean };
export type Pessoa = { quem: string; sprite: string; x: number; y: number };

export type Mapa = {
  chao: string[];
  objetos: Peca[];
  pessoas: Pessoa[];
  entrada: { x: number; y: number };
};

/** Vila Semente, 36 x 24 tiles. */
export const VILA: Mapa = {
  chao: [
    "\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"",
    "\"..................................\"",
    "\"..................................\"",
    "\"..pp......pp......pp......pp......\"",
    "\"..pp......pp......pp......pp......\"",
    "pppppppppppppppppppppppppppppppppppp",
    "pppppppppppppppppppppppppppppppppppp",
    "\"..........p......p................\"",
    "\".,........pppppppp................\"",
    "\"..........p......p......,.........\"",
    "\"..........p......p................\"",
    "pppppppppppppppppppppppppppppppppppp",
    "pppppppppppppppppppppppppppppppppppp",
    "\".........................pp.......\"",
    "\"..,......................pp.......\"",
    "\".........................pp.......\"",
    "\".~~~~~~~..........................\"",
    "\"~~~~~~~~~....,....................\"",
    "\"~~~~~~~~~.........................\"",
    "\".~~~~~~~..........................\"",
    "\"..aaaaa...........................\"",
    "\"..................................\"",
    "\".,........................,.......\"",
    "\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"",
  ],
  objetos: [
    { nome: "casa-vovo", x: 2, y: 4 },
    { nome: "casa-pequena", x: 9, y: 4 },
    { nome: "casa-grande", x: 14, y: 4 },
    { nome: "ferraria", x: 21, y: 4 },
    { nome: "casa-pequena", x: 27, y: 4 },
    { nome: "poste-sino", x: 13, y: 9 },
    { nome: "fogueira", x: 16, y: 10 },
    { nome: "poco", x: 11, y: 10 },
    { nome: "barraca", x: 19, y: 8 },
    { nome: "placa", x: 30, y: 12 },
    { nome: "casa-pequena", x: 23, y: 16 },
    { nome: "varal", x: 4, y: 13 },
    { nome: "bau", x: 26, y: 20 },
    { nome: "cerca", x: 19, y: 15 },
    { nome: "cerca", x: 20, y: 15 },
    { nome: "cerca", x: 21, y: 15 },
    { nome: "arvore", x: 1, y: 8 },
    { nome: "arvore", x: 2, y: 15 },
    { nome: "arvore-escura", x: 33, y: 3 },
    { nome: "arvore", x: 33, y: 9 },
    { nome: "arvore-escura", x: 32, y: 17 },
    { nome: "arvore", x: 8, y: 21 },
    { nome: "arvore-escura", x: 16, y: 21 },
    { nome: "arbusto", x: 6, y: 9 },
    { nome: "arbusto", x: 25, y: 9 },
    { nome: "arbusto", x: 18, y: 18 },
    { nome: "arbusto", x: 11, y: 20 },
    { nome: "arbusto", x: 29, y: 13 },
  ],
  pessoas: [
    { quem: "vovo", sprite: "vovo", x: 4, y: 8 },
    { quem: "ferreiro", sprite: "ferreiro", x: 22, y: 8 },
    { quem: "menina", sprite: "menina", x: 9, y: 14 },
    { quem: "pescador", sprite: "pescador", x: 6, y: 19 },
    { quem: "mercador", sprite: "mercador", x: 19, y: 10 },
    { quem: "menino", sprite: "menino", x: 25, y: 13 },
    { quem: "padeira", sprite: "padeira", x: 11, y: 8 },
    { quem: "guarda", sprite: "guarda", x: 29, y: 11 },
  ],
  entrada: { x: 15, y: 13 },
};

export type ChaoPronto = number[][];

/** Converte o desenho em texto na matriz de indices de tile. */
export function montarChao(desenho: string[]): ChaoPronto {
  return desenho.map((linha, y) =>
    [...linha].map((ch, x) => {
      const opcoes = LETRA_TILE[ch] ?? LETRA_TILE["."];
      // variacao estavel: a mesma posicao sempre recebe o mesmo tile
      return opcoes[(x * 7 + y * 13) % opcoes.length];
    })
  );
}
