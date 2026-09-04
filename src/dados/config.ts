/** Numeros e cores que o jogo inteiro usa. Mexer aqui muda o jogo todo. */

export const TILE = 16;
/** Resolucao logica. O canvas e escalado por numero inteiro ate caber na tela.
 *
 *  Nao e constante de proposito: a preferencia de visao (perto, normal, longe)
 *  troca a resolucao em vez de mexer no zoom da camera. Zoom fracionario com
 *  pixel art faz a grade de pixels cair fora da grade da tela, e ai tudo pisca.
 *  Com zoom sempre 1 e resolucao multipla de 16, cada pixel do jogo vira um
 *  bloco inteiro de pixels da tela. Como sao exports com let, quem importa
 *  LARGURA e ALTURA enxerga o valor novo sem precisar reimportar. */
export let LARGURA = 320;
export let ALTURA = 192;

export function definirTamanhoLogico(largura: number, altura: number) {
  LARGURA = largura;
  ALTURA = altura;
}

export const VELOCIDADE = 62;

/** Fonte de pixel do jogo. Vem do pacote @fontsource/silkscreen, sem CDN. */
export const FONTE = "Silkscreen";
export const CORPO = "8px";

/** Paleta do Reino de Aurora, igual a do material impresso. */
export const COR = {
  papel: 0xfff8ea,
  papel2: 0xfdefd6,
  tinta: 0x2c2440,
  tintaSuave: 0x4a3e64,
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
/** Como cada raca do RPG de mesa vira sprite.
 *
 *  corpo:    qual largura de tronco ela usa. roupa e arma tem uma folha por
 *            largura, porque a manga e a mao mudam de lugar.
 *  desce:    quantos pixels as camadas de cima (roupa, cabelo, chapeu, arma)
 *            precisam descer. Elas sao desenhadas na altura do personagem mais
 *            ALTO, e quem e mais baixo tem a perna mais curta, entao o corpo
 *            inteiro fica mais perto do chao. Sem isto o cabelo do anao
 *            flutuaria acima da cabeca dele. Nunca e negativo de proposito:
 *            deslocar para cima jogaria a copa do chapeu para fora do quadro.
 *  tons:     o que os tres tons significam nesta raca. Na Cria de Dragao nao e
 *            pele, e escama, entao ate os nomes mudam.
 *
 *  Os numeros saem de arte/pessoa.py (esqueleto e desloque). Se mudarem la,
 *  mudam aqui: rode npm run arte e confira o indice que ele imprime. */
export const RACAS_SPRITE: Record<
  string,
  { corpo: "magro" | "normal" | "gordinho"; desce: number; tons: string[] }
> = {
  vale: { corpo: "normal", desce: 2, tons: ["Clara", "Morena", "Escura"] },
  anao: { corpo: "gordinho", desce: 4, tons: ["Clara", "Morena", "Escura"] },
  elfo: { corpo: "magro", desce: 0, tons: ["Clara", "Morena", "Escura"] },
  pequenino: { corpo: "normal", desce: 5, tons: ["Clara", "Morena", "Escura"] },
  dragao: { corpo: "normal", desce: 2, tons: ["Escama verde", "Escama vermelha", "Escama azul"] },
};

export const TIPOS_CORPO = ["magro", "normal", "gordinho"] as const;

/** Tamanho de um quadro da folha de roupa. Tem que bater com LARGURA_PECA e
 *  ALTURA_PECA em arte/roupa.py. */
export const PECA_ROUPA = { largura: 16, altura: 20 } as const;

/** os tres tons da raca escolhida, ja com o nome certo para a tela de criacao */
export function tonsDaRaca(raca: string) {
  const r = RACAS_SPRITE[raca] ?? RACAS_SPRITE.vale;
  return r.tons.map((nome, id) => ({ id, nome }));
}

export const CABELOS_ESTILO = [
  { id: "curto", nome: "Curto" },
  { id: "comprido", nome: "Comprido" },
  { id: "cacheado", nome: "Cacheado" },
  { id: "rabo", nome: "Rabo de cavalo" },
  { id: "chanel", nome: "Chanel" },
  { id: "coque", nome: "Coque" },
  { id: "moicano", nome: "Moicano" },
];

export const ROUPAS_ESTILO = [
  { id: "cavaleiro", nome: "Armadura" },
  { id: "mago", nome: "Tunica de mago" },
  { id: "cacador", nome: "Capa de caca" },
  { id: "amigo", nome: "Colete do mato" },
  { id: "ferreiro", nome: "Avental" },
  { id: "tunica", nome: "Tunica simples" },
  { id: "folhas", nome: "Folhas" },
];

/** A classe ja veste e ja arma o personagem. O jogador pode trocar depois, mas
 *  ninguem sai da criacao com um mago de avental por esquecimento. */
export const ROUPA_DA_CLASSE: Record<string, string> = {
  cavaleiro: "cavaleiro",
  mago: "mago",
  cacador: "cacador",
  amigo: "amigo",
  ferreiro: "ferreiro",
};

export const ARMA_DA_CLASSE: Record<string, string> = {
  cavaleiro: "espada",
  mago: "cajado",
  cacador: "arco",
  amigo: "funda",
  ferreiro: "martelo",
};

export const CHAPEUS = [
  { id: "nenhum", nome: "Sem chapeu" },
  { id: "pontudo", nome: "Pontudo" },
  { id: "palha", nome: "De palha" },
  { id: "capuz", nome: "Capuz" },
  { id: "coroa", nome: "Coroa" },
  { id: "boina", nome: "Boina" },
  { id: "elmo", nome: "Elmo" },
];

export const CHAPEU_DA_CLASSE: Record<string, string> = {
  cavaleiro: "elmo",
  mago: "pontudo",
  cacador: "capuz",
  amigo: "nenhum",
  ferreiro: "boina",
};

export const ARMAS_SPRITE = ["nenhuma", "cajado", "espada", "arco", "martelo", "funda"] as const;

export const NPCS_SPRITE = [
  "vovo", "ferreiro", "menina", "pescador", "mercador",
  "menino", "guarda", "padeira", "elfa", "bruxo",
] as const;

/** Os quatro goblins e as quatro aranhas da Teia Doce. Cada um tem anatomia
 *  propria, nao e o mesmo desenho em tamanhos diferentes. Ver arte/goblin.py. */
export const GOBLINS_SPRITE = ["magricela", "gorducho", "moleque", "chefe"] as const;
export const ARANHAS_SPRITE = ["filhote", "pequena", "media", "matriarca"] as const;

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
