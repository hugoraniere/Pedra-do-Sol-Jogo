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

/** Indices do tileset.png, na mesma ordem de arte/gerar.py */
export const T = {
  grama: 0, grama2: 1, grama3: 2, flores: 3,
  terra: 4, caminho: 5, agua: 6, agua2: 7,
  pedra: 8, madeira: 9, telhado: 10, copa: 11,
  tronco: 12, arbusto: 13, chaoCaverna: 14, paredeCaverna: 15,
} as const;

/** Tiles que o heroi nao atravessa. */
export const SOLIDOS = [
  T.agua, T.agua2, T.pedra, T.madeira, T.telhado,
  T.copa, T.tronco, T.arbusto, T.paredeCaverna,
];

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

export const RACAS = [
  { id: "elfo", nome: "Elfo da Folha", dom: "Olhos de Coruja" },
  { id: "vale", nome: "Gente do Vale", dom: "Coracao Grande" },
  { id: "pedra", nome: "Povo da Pedra", dom: "Pele Dura" },
];

export const CLASSES = [
  { id: "mago", nome: "Mago", magias: ["Bola de Fogo", "Bafo Gelado", "Cheiro de Bolo"] },
  { id: "cacador", nome: "Cacador", magias: ["Flecha Certeira", "Passo Silencioso", "Chamar Bicho"] },
  { id: "guardiao", nome: "Guardiao", magias: ["Escudo de Folha", "Grito de Guerra", "Bracos Fortes"] },
];
