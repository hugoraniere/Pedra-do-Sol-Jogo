/** Mapas desenhados a mao em texto. Cada caractere e um tile.
 *
 *   .  grama       ,  flores      -  terra        p  caminho de pedra
 *   ~  agua        P  pedra       #  parede       ^  telhado
 *   T  arvore      a  arbusto     c  chao de caverna    C  parede de caverna
 *
 * Letras maiusculas soltas (S, F, V, B, M, X) sao MARCADORES: viram objeto ou
 * NPC e o tile embaixo vira grama. A lista esta em MARCADORES.
 */
import { T } from "./config";

export type Marcador = { ch: string; tipo: string; dado?: string };

export const MARCADORES: Marcador[] = [
  { ch: "S", tipo: "objeto", dado: "sino" },
  { ch: "F", tipo: "objeto", dado: "fogueira" },
  { ch: "B", tipo: "objeto", dado: "bau" },
  { ch: "L", tipo: "objeto", dado: "placa" },
  { ch: "1", tipo: "npc", dado: "vovo" },
  { ch: "2", tipo: "npc", dado: "ferreiro" },
  { ch: "3", tipo: "npc", dado: "menina" },
  { ch: "4", tipo: "npc", dado: "pescador" },
  { ch: "X", tipo: "saida", dado: "floresta" },
];

const LETRA_TILE: Record<string, number[]> = {
  ".": [T.grama, T.grama2, T.grama3],
  ",": [T.flores],
  "-": [T.terra],
  p: [T.caminho],
  "~": [T.agua, T.agua2],
  P: [T.pedra],
  "#": [T.madeira],
  "^": [T.telhado],
  T: [T.copa],
  t: [T.tronco],
  a: [T.arbusto],
  c: [T.chaoCaverna],
  C: [T.paredeCaverna],
};

/** Vila Semente. 30 colunas por 20 linhas. */
export const VILA = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "Tt..,.....TTTT.........,....tT",
  "T....a......tt......a........T",
  "T..^^^^.....pp.....^^^^......T",
  "T..#..#.....pp.....#..#....a.T",
  "T..#2.#.,...pp.....#.1#......T",
  "T..####ppppppppppppp####.....T",
  "T.......p...S....p..........,T",
  "T..,....p..pppp..p...a.......T",
  "T.......pppp..pppp...........T",
  "T...a...p...F....p....^^^^...T",
  "T.......p........p....#..#...T",
  "T..3....ppppppppppp...#..#...T",
  "T............p........####...T",
  "T....~~~~~...p........,......T",
  "T...~~~~~~~..p...L...........T",
  "T...~~~~4~~..ppppppppppppppppX",
  "T....~~~~~...................T",
  "Tt.....,......a.........,...tT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];

export type MapaPronto = {
  tiles: number[][];
  marcadores: { x: number; y: number; tipo: string; dado: string }[];
};

/** Converte o desenho em texto na matriz de tiles + a lista de marcadores. */
export function montar(desenho: string[]): MapaPronto {
  const tiles: number[][] = [];
  const marcadores: MapaPronto["marcadores"] = [];
  desenho.forEach((linha, y) => {
    const fila: number[] = [];
    [...linha].forEach((ch, x) => {
      const marca = MARCADORES.find((m) => m.ch === ch);
      if (marca) {
        marcadores.push({ x, y, tipo: marca.tipo, dado: marca.dado ?? "" });
        fila.push(T.grama);
        return;
      }
      const opcoes = LETRA_TILE[ch] ?? LETRA_TILE["."];
      // variacao estavel, sempre a mesma para a mesma posicao
      fila.push(opcoes[(x * 7 + y * 13) % opcoes.length]);
    });
    tiles.push(fila);
  });
  return { tiles, marcadores };
}
