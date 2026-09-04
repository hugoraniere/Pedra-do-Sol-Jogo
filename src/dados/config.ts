/** Numeros e cores que o jogo inteiro usa. Mexer aqui muda o jogo todo. */

export const TILE = 16;
/** Resolucao logica. O canvas e escalado por numero inteiro ate caber na tela. */
export const LARGURA = 320;
export const ALTURA = 192;

export const VELOCIDADE = 62;

/** Fonte de pixel do jogo. Vem do pacote @fontsource/silkscreen, sem CDN. */
export const FONTE = "Silkscreen";
export const CORPO = "8px";

/** Paleta do Reino de Aurora, igual a do material impresso. */
export const COR = {
  papel: 0xfff8ea,
  papel2: 0xfdefd6,
  tinta: 0x2c2440,
  tintaSuave: 0x5a4e74,
  ouro: 0xf5b62b,
  vermelho: 0xe2483d,
  azul: 0x2f6fb5,
  verde: 0x3e9b62,
  roxo: 0x7b5ac4,
  brasa: 0xf2802b,
  rosa: 0xee7ba6,
} as const;

/** Indices do tileset.png, na mesma ordem de arte/tiles.py */
export const T = {
  grama: 0, grama2: 1, grama3: 2, gramaAlta: 3, flores: 4,
  terra: 5, caminho: 6, areia: 7, agua: 8, agua2: 9,
  pedra: 10, madeiraChao: 11, chaoCaverna: 12, paredeCaverna: 13,
} as const;

/** Tiles de chao que o heroi nao atravessa. Objeto tem colisao propria. */
export const SOLIDOS = [T.agua, T.agua2, T.pedra, T.paredeCaverna];

/** Altura do frame do personagem. Mudou de 24 para 32 na virada de arte. */
export const ALTURA_PERSONAGEM = 32;

/** Grade da folha de personagem, igual a de arte/gente.py.
 *  6 colunas por 4 linhas, quadro = linha * 6 + coluna. */
export const QUADRO = { parado: 0, passoA: 1, passoB: 2, respira: 3, conjura: 4, tonto: 5 } as const;
export const LINHA_DIRECAO = { baixo: 0, esquerda: 1, direita: 2, cima: 3 } as const;
export const COLUNAS_FOLHA = 6;

/** Ciclo de caminhada no padrao do Stardew: contato, passo, contato, outro passo,
 *  a 5 quadros por segundo. Com 4 quadros diferentes a perna pisca. */
export const CICLO_CAMINHADA = [QUADRO.passoA, QUADRO.parado, QUADRO.passoB, QUADRO.parado];
export const FPS_CAMINHADA = 5;

/** Opcoes de aparencia do heroi. Precisam bater com arte/gente.py. */
export const TONS_PELE = [
  { id: 0, nome: "Clara" },
  { id: 1, nome: "Morena" },
  { id: 2, nome: "Escura" },
];

export const CABELOS_ESTILO = [
  { id: "curto", nome: "Curto" },
  { id: "comprido", nome: "Comprido" },
  { id: "cacheado", nome: "Cacheado" },
  { id: "rabo", nome: "Rabo de cavalo" },
  { id: "moicano", nome: "Moicano" },
];

export const ROUPAS_ESTILO = [
  { id: "tunica", nome: "Tunica" },
  { id: "folhas", nome: "Folhas" },
  { id: "capa", nome: "Capa" },
];

export const CHAPEUS = [
  { id: "nenhum", nome: "Sem chapeu" },
  { id: "pontudo", nome: "Pontudo" },
  { id: "palha", nome: "De palha" },
  { id: "capuz", nome: "Capuz" },
  { id: "coroa", nome: "Coroa" },
];

export const ARMAS_SPRITE = ["nenhuma", "cajado", "espada", "arco", "martelo", "funda"] as const;

export const NPCS_SPRITE = [
  "vovo", "ferreiro", "menina", "pescador", "mercador",
  "menino", "guarda", "padeira", "elfa", "bruxo",
] as const;

/** Objetos do mundo, um PNG cada em public/assets/objetos/.
 *  A lista tem que bater com OBJETOS em arte/mundo.py. */
export const OBJETOS = [
  "casa-pequena", "casa-grande", "ferraria", "casa-vovo",
  "arvore", "arvore-escura", "arbusto",
  "poste-sino", "poste-com-sino", "poco", "barraca", "cerca",
  "fogueira", "bau", "placa", "varal",
] as const;

export const CABELOS = [
  { nome: "Verde folha", cor: 0x3e9b62 },
  { nome: "Castanho", cor: 0x8a5a34 },
  { nome: "Preto", cor: 0x3b3550 },
  { nome: "Ruivo", cor: 0xd2622f },
  { nome: "Loiro", cor: 0xebc35c },
  { nome: "Azul ceu", cor: 0x4f96d6 },
];

export const ROUPAS = [
  { nome: "Verde mata", cor: 0x3e9b62 },
  { nome: "Azul rio", cor: 0x2f6fb5 },
  { nome: "Vermelho", cor: 0xe2483d },
  { nome: "Roxo magia", cor: 0x7b5ac4 },
  { nome: "Ouro", cor: 0xf5b62b },
  { nome: "Rosa", cor: 0xee7ba6 },
];

/** Racas, classes, magias, armas, loja e bestiario vivem em conteudo.ts.
 *  Reexportados aqui so para nao quebrar quem ja importava de config. */
export { RACAS, CLASSES, MAGIAS, ARMAS, LOJA, BESTIARIO } from "./conteudo";
