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

/** Milissegundos por letra na caixa de fala.
 *
 *  A fala aparece letra por letra porque o Lele le devagar: texto que surge
 *  inteiro de uma vez ele pula sem ler. Nunca e uma espera obrigatoria, porem:
 *  um toque completa a linha na hora, e o segundo toque avanca. */
export const VELOCIDADE_FALA = 45;

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
  /** o verde do chao, para as telas que precisam continuar o mundo */
  grama: 0x42804e,
  gramaClara: 0x68b06c,
  /** terra do caminho e verde de conifera, usados no cenario vetorial da Titulo */
  terra: 0xc6a06c,
  terraEscura: 0x9e764c,
  pinheiro: 0x4c8c68,
  pinheiroEscuro: 0x1e483c,
} as const;

/** Indices do tileset.png, na mesma ordem de arte/tiles.py */
export const T = {
  grama: 0, grama2: 1, grama3: 2, gramaAlta: 3, flores: 4,
  terra: 5, caminho: 6, areia: 7, agua: 8, agua2: 9,
  pedra: 10, madeiraChao: 11, chaoCaverna: 12, paredeCaverna: 13,
  // a Floresta dos Sussurros
  mata: 14, folhagem: 15, trilha: 16, aguaRasa: 17, barranco: 18,
  gramaMata: 19,
  // as beiras: onde a grama avanca sobre o vizinho. Nao sao chao de verdade,
  // ninguem pisa "num beiraN": elas vivem na segunda camada que bordasDeGrama()
  // desenha por cima do chao. Ver arte/tiles.py e src/dados/mapas.ts.
  beiraN: 20, beiraS: 21, beiraL: 22, beiraO: 23,
  beiraNO: 24, beiraNL: 25, beiraSO: 26, beiraSL: 27,
  // detalhe raro, plantado a mao pelo mapa -- nunca dentro do "." comum
  gramaPequena: 28, gramaFalha: 29, gramaOrvalho: 30,
  areiaPedra: 31, areiaMancha: 32, areiaPegada: 33,
  // tons de areia, mesma ideia de grama/grama2/grama3: variedade de tom
  // entre tiles vizinhos, nao textura dentro de um tile so
  areia2: 34, areia3: 35,
  // a mesma beira, com um bojo pequeno em vez de grande: para o chao estreito
  // (trilha, caminho de um tile de largura) onde o bojo grande vira bolha.
  // bordasDeGrama() escolhe entre esta e a de cima medindo a largura real.
  beiraNFina: 36, beiraSFina: 37, beiraLFina: 38, beiraOFina: 39,
  beiraNOFina: 40, beiraNLFina: 41, beiraSOFina: 42, beiraSLFina: 43,
  // a Casa de Cura, por dentro
  paredeInterior: 44,
} as const;

/** Tiles de chao que o heroi nao atravessa. Objeto tem colisao propria.
 *
 *  `mata` esta aqui e e por isso que a floresta nao precisa de uma caixa de
 *  colisao por arvore: a parede e o chao, e o pinheiro plantado em cima e so
 *  desenho. Umas oitocentas caixas de colisao a menos. */
export const SOLIDOS = [T.agua, T.agua2, T.pedra, T.paredeCaverna, T.mata, T.barranco, T.paredeInterior];

/** Altura do frame do personagem. Mudou de 24 para 32 na virada de arte. */
export const ALTURA_PERSONAGEM = 32;

/** Largura do frame do personagem. E a mesma do quadro da roupa: o corpo e a
 *  roupa sao desenhados na mesma grade, e heroi.ts encosta a roupa em -8, que e
 *  a metade dela. Quem monta palco e retrato precisa deste numero. */
export const LARGURA_PERSONAGEM = 16;

/** Grade da folha de personagem, igual a de arte/gente.py (COLUNAS em
 *  arte/base.py). 11 colunas por 8 linhas, quadro = linha * 11 + coluna.
 *  As tres ultimas (esquiva, fuga, derrota) sao novas: quem nao desenhar
 *  pose propria pra elas recebe a mesma arte de `parado` (heranca de
 *  `deslocamento()` em arte/base.py, que nao reconhece esses nomes). */
export const QUADRO = {
  parado: 0, passoA: 1, passoB: 2, respira: 3, conjura: 4, tonto: 5,
  ataque: 6, machucado: 7, esquiva: 8, fuga: 9, derrota: 10,
} as const;
/** Linha da folha de sprite para cada uma das oito direcoes.
 *
 *  As quatro primeiras ficaram nos indices de sempre de proposito: nada que ja
 *  apontava para elas precisou mudar. As diagonais vieram depois porque andar
 *  na diagonal e o que a crianca mais faz com o direcional, e sem elas o
 *  personagem andava de lado enquanto se movia na diagonal. */
export const LINHA_DIRECAO = {
  baixo: 0,
  esquerda: 1,
  direita: 2,
  cima: 3,
  "baixo-esquerda": 4,
  "baixo-direita": 5,
  "cima-esquerda": 6,
  "cima-direita": 7,
} as const;

export const DIRECOES = [
  "baixo", "esquerda", "direita", "cima",
  "baixo-esquerda", "baixo-direita", "cima-esquerda", "cima-direita",
] as const;

export type NomeDirecao = (typeof DIRECOES)[number];

/** A direcao que corresponde a um empurrao do direcional.
 *
 *  Oito fatias de 45 graus. A conta com atan2 e mais curta que uma cadeia de
 *  ifs e nao tem canto morto: qualquer combinacao de x e y cai numa fatia. */
export function direcaoDe(x: number, y: number): NomeDirecao | undefined {
  if (x === 0 && y === 0) return undefined;
  const fatia = Math.round(Math.atan2(y, x) / (Math.PI / 4));
  return (
    {
      0: "direita",
      1: "baixo-direita",
      2: "baixo",
      3: "baixo-esquerda",
      4: "esquerda",
      "-1": "cima-direita",
      "-2": "cima",
      "-3": "cima-esquerda",
      "-4": "esquerda",
    } as Record<string, NomeDirecao>
  )[String(fatia)];
}
export const COLUNAS_FOLHA = 11;

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

/** So estas 5 `Arma.id` (de `dados/conteudo.ts`) tem sprite de verdade
 *  (`arte/equipamento.py`, DESENHOS) — as outras 6 armas "encontradas" e o
 *  escudo/machado/adaga/lendarias ainda nao tem desenho. Chave e o id da
 *  arma, valor e a chave do sprite: so "espada-curta" diverge (o desenho
 *  chama "espada", nome de classe, nao de arma). Equipar uma arma sem
 *  entrada aqui quebraria a camada visual do heroi — ver Ficha.ts,
 *  `grupoDoItem()`, e docs/plano-de-itens-e-equipamento.md, Fase C. */
export const SPRITE_DA_ARMA: Record<string, string> = {
  "espada-curta": "espada",
  cajado: "cajado",
  arco: "arco",
  funda: "funda",
  martelo: "martelo",
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
  "menino", "guarda", "padeira", "marinheiro", "elfa", "bruxo",
] as const;

/** Os quatro goblins e as quatro aranhas da Teia Doce. Cada um tem anatomia
 *  propria, nao e o mesmo desenho em tamanhos diferentes. Ver arte/goblin.py. */
export const GOBLINS_SPRITE = ["magricela", "gorducho", "moleque", "chefe"] as const;
export const ARANHAS_SPRITE = ["filhote", "pequena", "media", "matriarca"] as const;

/** O goblin desenha em 48 x 96 (3x o resto do jogo, decisao do Hugo em
 *  2026-09-05, so para ele). Sem compensar, ele ficaria do tamanho do
 *  dragao no mundo. Primeira vez que o jogo separa "pixels da arte" de
 *  "tamanho no mundo" — os dois pontos que criam o sprite do goblin
 *  (`Mundo.ts`, `Combate.ts`) chamam isto ao montar o sprite. */
export function escalaDoSprite(chaveDoSprite: string): number {
  return chaveDoSprite.startsWith("goblin-") ? LARGURA_PERSONAGEM / 48 : 1;
}

/** Objetos do mundo, um PNG cada em public/assets/objetos/.
 *  A lista tem que bater com OBJETOS em arte/mundo.py. */
export const OBJETOS = [
  "casa-pequena", "casa-grande", "ferraria", "casa-vovo", "hospital",
  "arvore", "arvore-escura", "arbusto",
  "poste-sino", "poste-com-sino", "poco", "pedra-solta", "barraca", "cerca",
  "fogueira", "bau", "placa", "varal", "navio",
  "pinheiro", "pinheiro-baixo", "grande-ouvinte", "arvore-raio", "tronco-caido",
  "toco", "samambaia", "cogumelo", "cogumelo-azul", "pedra-musgo", "teia", "raizes",
  "cama", "prateleira-pocoes", "caldeirao",
  "mesa", "tapete", "armario", "banco", "forja", "bigorna", "suporte-armas",
  "estante-livros", "forno-padaria", "prateleira-pao",
  // os outros 3 quadros da chama da fogueira tremeluzindo (ver Mundo.ts,
  // garantirAnimacaoDeFogo) -- nunca plantados sozinhos num mapa
  "fogueira-2", "fogueira-3", "fogueira-4",
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
