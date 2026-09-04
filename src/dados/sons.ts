/** Catalogo de som do Reino de Aurora.
 *
 * Este arquivo e SO DADO. Nenhuma logica, nenhum Phaser, igual conteudo.ts.
 *
 * Quem PRODUZ os arquivos e som/gerar.py; quem CONSOME e este catalogo. E a
 * mesma relacao de arte/mundo.py com OBJETOS em config.ts, e tem a mesma
 * armadilha: os dois lados podem desencontrar em silencio. Por isso o
 * ferramentas/verificar.mjs confere se todo som daqui existe em disco.
 *
 * Hoje quase tudo e rascunho sintetizado. Som bom entra por som/prontos/, com o
 * mesmo nome, e ganha do rascunho sem mexer em nenhuma linha de codigo.
 *
 * O volume e sempre relativo a fala, que e o som mais importante do jogo e vale 1.
 *
 * O passo e o som que mais toca, entao o instinto e deixar ele bem baixo pra nao
 * cansar. Na pratica isso o apagou: ele nao competia com a fala, sumia junto com
 * o ambiente. Andar e a acao que o Lele mais faz no jogo, e acao que nao devolve
 * nada parece que nao aconteceu. Agora ele se ouve. Se cansar, e aqui que abaixa.
 */

import { T } from "./config";

export type FichaSom = {
  /** nome do arquivo em public/assets/som/, sem a extensao */
  arquivo: string;
  /** 0 a 1, relativo a fala */
  volume: number;
  /** quanto a altura varia a cada disparo, em centesimos de tom.
   *  Sem isso o mesmo som repetido soa como amostra colada. */
  variacao?: number;
  loop?: boolean;
  /** Som que o catalogo ja projetou e que ainda NAO existe em disco.
   *
   *  Nao e um esquecimento, e uma encomenda: diz o que falta comprar ou gravar.
   *  O jogo nem tenta pedir o arquivo, entao nao gera 404 nem erro de rede, e o
   *  npm run verificar lista o que esta pendente em vez de reprovar. Quando o
   *  arquivo chegar, apague esta linha: o verificador avisa se voce esquecer. */
  pendente?: boolean;
};

/** MP3 quando o gerador acha ffmpeg, WAV quando nao acha.
 *  som/manifesto.json diz qual saiu na ultima geracao. */
export const EXTENSAO = ".mp3";

/* --------------------------------------------------------------- as chaves */
/** Os nomes deste catalogo viram TIPO, e e isso que protege o jogo.
 *
 *  sistemas/som.ts so aceita chave que existe aqui. Entao um som pedido pelo
 *  jogo antes de entrar neste arquivo nao compila, e `npm run build` reprova
 *  com o nome errado apontado. Som novo comeca aqui, sempre, nunca no meio de
 *  uma cena.
 *
 *  E por isso que os grupos terminam em `satisfies` em vez de
 *  `: Record<string, FichaSom>`: a anotacao apagaria os nomes e deixaria
 *  qualquer string passar. */
export type ChaveEfeito = keyof typeof EFEITOS;
export type ChaveArma = keyof typeof ARMAS;
export type ChaveGolpeEspecial = keyof typeof GOLPES_ESPECIAIS;
export type ChaveImpacto = keyof typeof IMPACTOS;
export type ChaveDado = keyof typeof DADO;
export type ChaveDesfecho = keyof typeof DESFECHO;
export type ChaveMagia = keyof typeof MAGIAS_SOM;
export type FamiliaDeCriatura = keyof typeof CRIATURAS_SOM;
export type ChaveFraqueza = keyof typeof FRAQUEZA_SONORA;
export type ChaveMusica = keyof typeof MUSICAS;
export type ChaveColchao = keyof typeof COLCHAO;

/* ------------------------------------------------------------------ efeitos */

export const EFEITOS = {
  // --- passos, um por tipo de chao. ver PASSO_DO_TILE la embaixo
  "passo-grama": { arquivo: "passo-grama", volume: 0.45, variacao: 120 },
  "passo-terra": { arquivo: "passo-terra", volume: 0.45, variacao: 120 },
  "passo-areia": { arquivo: "passo-areia", volume: 0.42, variacao: 120 },
  "passo-madeira": { arquivo: "passo-madeira", volume: 0.5, variacao: 100 },
  "passo-pedra": { arquivo: "passo-pedra", volume: 0.5, variacao: 100 },

  // --- fala
  "fala-abre": { arquivo: "fala-abre", volume: 0.5 },
  "fala-letra": { arquivo: "fala-letra", volume: 0.35, variacao: 60 },
  "fala-fecha": { arquivo: "fala-fecha", volume: 0.4 },

  // --- interface
  "menu-foco": { arquivo: "menu-foco", volume: 0.3, variacao: 40 },
  "menu-confirma": { arquivo: "menu-confirma", volume: 0.5 },
  "menu-volta": { arquivo: "menu-volta", volume: 0.4 },
  "pausa-abre": { arquivo: "pausa-abre", volume: 0.45 },
  "pausa-fecha": { arquivo: "pausa-fecha", volume: 0.45 },
  salvou: { arquivo: "salvou", volume: 0.5 },

  // --- descoberta e premio. o roadmap pede "pista" na fase 1
  pista: { arquivo: "pista", volume: 0.8 },
  moeda: { arquivo: "moeda", volume: 0.6, variacao: 80 },
  selo: { arquivo: "selo", volume: 0.9 },
  "bau-abre": { arquivo: "bau-abre", volume: 0.7 },
  cristal: { arquivo: "cristal", volume: 0.9 },
  "coracao-novo": { arquivo: "coracao-novo", volume: 0.8 },

  // --- heroi. a pose de conjurar ja existe em heroi.ts e dura 700 ms
  magia: { arquivo: "magia", volume: 0.7 },
  /** a piscadela para o Trovao da Floresta, o personagem que o Lele criou na mesa */
  trovao: { arquivo: "trovao", volume: 0.65 },
  /** zero coracoes nao e derrota: no RPG de mesa o heroi fica tonto e levanta.
   *  Este som tem que ser engracado. Bipe de erro contradiz o jogo inteiro. */
  tonto: { arquivo: "tonto", volume: 0.6 },

  // --- travessia
  porta: { arquivo: "porta", volume: 0.5 },
  escada: { arquivo: "escada", volume: 0.35 },
  "troca-mapa": { arquivo: "troca-mapa", volume: 0.5 },

  // --- itens da loja
  "bebe-pocao": { arquivo: "bebe-pocao", volume: 0.6 },
  biscoito: { arquivo: "biscoito", volume: 0.5 },
  fechadura: { arquivo: "fechadura", volume: 0.55 },
  "pena-levanta": { arquivo: "pena-levanta", volume: 0.8 },
  lanterna: { arquivo: "lanterna", volume: 0.2, loop: true },
} satisfies Record<string, FichaSom>;

/* -------------------------------------------------------------------- armas */
/** Uma acao de arma nao e um som, e uma corrente: preparo, golpe, e so entao o
 *  desfecho. No RPG de mesa quem decide o desfecho e o dado, nunca a colisao:
 *  so o heroi rola, e o resultado cai em OPS, QUASE ou OBA. Por isso a arma tem
 *  poucos sons proprios e o impacto sai da tabela de material, ali embaixo. */

export type CadeiaDeArma = {
  preparo?: FichaSom;
  golpe: FichaSom;
  /** so para o que viaja: flecha e pedra */
  voo?: FichaSom;
  /** quando o proprio projetil chega, antes do impacto por material */
  chegada?: FichaSom;
};

export const ARMAS = {
  espada: {
    preparo: { arquivo: "espada-saca", volume: 0.5 },
    golpe: { arquivo: "espada-golpe", volume: 0.6, variacao: 80 },
  },
  escudo: {
    preparo: { arquivo: "escudo-ergue", volume: 0.45 },
    golpe: { arquivo: "escudo-bloqueia", volume: 0.7 },
  },
  arco: {
    preparo: { arquivo: "arco-arma", volume: 0.4 },
    golpe: { arquivo: "arco-solta", volume: 0.6, variacao: 60 },
    voo: { arquivo: "flecha-voa", volume: 0.35 },
    chegada: { arquivo: "flecha-crava", volume: 0.6 },
  },
  cajado: {
    preparo: { arquivo: "cajado-carrega", volume: 0.5 },
    golpe: { arquivo: "cajado-libera", volume: 0.65 },
  },
  martelo: {
    golpe: { arquivo: "martelo-golpe", volume: 0.65, variacao: 60 },
  },
  machado: {
    golpe: { arquivo: "machado-golpe", volume: 0.62, variacao: 60 },
  },
  adaga: {
    golpe: { arquivo: "adaga-estoca", volume: 0.5, variacao: 100 },
  },
  funda: {
    preparo: { arquivo: "funda-roda", volume: 0.4, loop: true },
    golpe: { arquivo: "funda-solta", volume: 0.55 },
    voo: { arquivo: "pedra-voa", volume: 0.35 },
    chegada: { arquivo: "pedra-bate", volume: 0.6 },
  },
} satisfies Record<string, CadeiaDeArma>;

/** Sons de arma que nao pertencem a uma arma. */
export const GOLPES_ESPECIAIS = {
  /** a habilidade do Cavaleiro: acerta sem precisar rolar o dado */
  "golpe-trovao": { arquivo: "golpe-trovao", volume: 0.85 },
  /** o bonus escondido da Adaga da Sorte. quase silencio de proposito */
  "adaga-furtiva": { arquivo: "adaga-furtiva", volume: 0.3 },
  /** a habilidade Conserta Tudo do Ferreiro Andarilho */
  "martelo-conserta": { arquivo: "martelo-conserta", volume: 0.6 },
  /** o bonus do Machado do Lenhador e cortar, nao lutar */
  "machado-lenha": { arquivo: "machado-lenha", volume: 0.65 },
} satisfies Record<string, FichaSom>;

/** O impacto muda pelo MATERIAL do alvo, nao pela arma. Cinco arquivos servem as
 *  onze armas, e e o material que faz o golpe parecer diferente. */
export const IMPACTOS = {
  bicho: { arquivo: "bate-bicho", volume: 0.6, variacao: 100 },
  madeira: { arquivo: "bate-madeira", volume: 0.6, variacao: 90 },
  pedra: { arquivo: "bate-pedra", volume: 0.6, variacao: 90 },
  metal: { arquivo: "bate-metal", volume: 0.65, variacao: 60 },
  /** errar nao e castigo: um assobio no ar, nunca um bipe de negado */
  errou: { arquivo: "errou", volume: 0.4, variacao: 120 },
} satisfies Record<string, FichaSom>;

/** De que e feito cada morador do bestiario, para escolher o impacto. */
export const MATERIAL_DA_CRIATURA: Record<string, ChaveImpacto> = {
  goblin: "bicho",
  "lobo-nevoa": "bicho",
  aranha: "bicho",
  serpente: "bicho",
  grulo: "pedra",
  espantalho: "madeira",
  "cavaleiro-cinzas": "metal",
  bruxa: "bicho",
  brasanegra: "bicho",
};

/* --------------------------------------------------------------------- dado */
/** O momento de maior tensao do jogo. Fase 2 do roadmap. */

export const DADO = {
  chacoalha: { arquivo: "dado-chacoalha", volume: 0.5, loop: true },
  rola: { arquivo: "dado-rola", volume: 0.6 },
  para: { arquivo: "dado-para", volume: 0.7 },
} satisfies Record<string, FichaSom>;

/** As tres faixas do d6, na cor do material impresso.
 *
 *  ATENCAO ao "ops": o reflexo e por um bipe grave de negado, porque e o que todo
 *  jogo faz. Aqui isso esta errado. O CLAUDE.md diz que o Lele nao pode perder e
 *  que errar gera consequencia divertida. O OPS tem que soar como tropecar num
 *  filme de comedia: o tipo de som que da vontade de rolar de novo. */
export const DESFECHO = {
  oba: { arquivo: "desfecho-oba", volume: 0.85 },
  quase: { arquivo: "desfecho-quase", volume: 0.7 },
  ops: { arquivo: "desfecho-ops", volume: 0.7 },
} satisfies Record<string, FichaSom>;

/** Qual faixa cada numero do dado cai. Bate com o RPG de mesa. */
export function faixaDoDado(valor: number): ChaveDesfecho {
  if (valor <= 2) return "ops";
  if (valor <= 4) return "quase";
  return "oba";
}

/* ------------------------------------------------------------------- magias */
/** As treze magias de conteudo.ts ja vem com cor, e a cor agrupa: magia da mesma
 *  familia soa igual com a altura mudada. Treze magias custam seis arquivos. */

export const MAGIAS_SOM = {
  fogo: { arquivo: "magia-fogo", volume: 0.7 },
  gelo: { arquivo: "magia-gelo", volume: 0.7 },
  planta: { arquivo: "magia-planta", volume: 0.65 },
  vento: { arquivo: "magia-vento", volume: 0.6 },
  voz: { arquivo: "magia-voz", volume: 0.75 },
  conserta: { arquivo: "magia-conserta", volume: 0.6 },
} satisfies Record<string, FichaSom>;

/** Cada magia de conteudo.ts na familia de som dela. */
export const FAMILIA_DA_MAGIA: Record<string, ChaveMagia> = {
  "bola-de-fogo": "fogo",
  luzinha: "fogo",
  "bafo-gelado": "gelo",
  "escudo-de-bolha": "gelo",
  "cresce-grama": "planta",
  "pulo-de-sapo": "planta",
  "fala-bicho": "planta",
  "chama-vento": "vento",
  "voz-de-trovao": "voz",
  "sumir-sumindo": "voz",
  remendo: "conserta",
  "dedo-colante": "conserta",
  "cheiro-de-bolo": "conserta",
};

/* ---------------------------------------------------------------- criaturas */
/** Tres momentos por familia: perceber o heroi, levar o golpe, e desistir.
 *  NUNCA morrer: no RPG de mesa ninguem morre, nem o monstro. */

export const CRIATURAS_SOM = {
  pequeno: {
    nota: { arquivo: "bicho-pequeno-nota", volume: 0.5, variacao: 150 },
    reage: { arquivo: "bicho-pequeno-reage", volume: 0.6, variacao: 150 },
    desiste: { arquivo: "bicho-pequeno-foge", volume: 0.6 },
  },
  grande: {
    nota: { arquivo: "bicho-grande-nota", volume: 0.6, variacao: 80 },
    reage: { arquivo: "bicho-grande-reage", volume: 0.7, variacao: 80 },
    desiste: { arquivo: "bicho-grande-senta", volume: 0.7 },
  },
} satisfies Record<string, Record<string, FichaSom>>;

export const FAMILIA_DA_CRIATURA: Record<string, FamiliaDeCriatura> = {
  goblin: "pequeno",
  aranha: "pequeno",
  "lobo-nevoa": "pequeno",
  serpente: "pequeno",
  espantalho: "pequeno",
  grulo: "grande",
  "cavaleiro-cinzas": "grande",
  bruxa: "grande",
  brasanegra: "grande",
};

/** As tres fraquezas que o bestiario ja escreveu COMO SOM. Isto nao e enfeite,
 *  e mecanica: e o som que resolve a criatura.
 *
 *  E repare no "metal-alto": ele e ao mesmo tempo o sino da vila tocando e a arma
 *  contra o goblin que roubou o sino. Um arquivo, duas funcoes. */
export const FRAQUEZA_SONORA = {
  /** goblin: "barulho alto de metal". tambem e o Sino Espanta-Monstro da loja */
  "metal-alto": { arquivo: "metal-alto", volume: 0.9 },
  /** Grulo, o Troll: "uma boa gargalhada" */
  gargalhada: { arquivo: "gargalhada", volume: 0.8 },
  /** Brasanegra: "o nome verdadeiro, Aurel" */
  "nome-verdadeiro": { arquivo: "nome-verdadeiro", volume: 0.85 },
} satisfies Record<string, FichaSom>;

/* ------------------------------------------------------------------ musica */
/** Pesada. NAO entra no Boot: travaria a barra de carregamento no wifi do iPad.
 *  Carrega depois, com o jogo ja rodando.
 *
 *  As duas sao rascunho como todo o resto, mas rascunho ESCRITO: a melodia esta
 *  nota por nota em som/gerar.py, secao "musica", e da pra mexer nela sem saber
 *  nada de sintese. Trilha gravada por gente entra por som/prontos/ e ganha.
 *
 *  O volume e mais baixo que o de qualquer efeito de proposito: trilha que
 *  disputa com a fala atrapalha justamente quem le devagar. */
export const MUSICAS = {
  /** vale para o Titulo, o Carregar e a Criacao: do ponto de vista do jogador
   *  sao o mesmo lugar, fora do mundo. Nao recomece a faixa entre eles. */
  menu: { arquivo: "musica-menu", volume: 0.4, loop: true },
  vila: { arquivo: "musica-vila", volume: 0.32, loop: true },
} satisfies Record<string, FichaSom>;

/* ---------------------------------------------------------------- ambiente */

/** O colchao: toca sempre, no mundo todo, tao baixo que so se nota quando some. */
export const COLCHAO = {
  vila: { arquivo: "vento-campo", volume: 0.18, loop: true },
} satisfies Record<string, FichaSom>;

/** Sons de um lugar do mapa. O volume cai com a distancia ate o heroi, e e isso
 *  que faz a vila ter lugares em vez de ser uma imagem com musica em cima. */
export type PontoDeSom = {
  som: FichaSom;
  /** nome do objeto em mapas.ts, ou uma coordenada de tile */
  objeto?: string;
  tile?: { x: number; y: number };
  /** em tiles: fora disso nao se ouve nada */
  alcance: number;
};

export const PONTOS: PontoDeSom[] = [
  { objeto: "fogueira", som: { arquivo: "fogueira", volume: 0.5, loop: true }, alcance: 5 },
  { objeto: "poco", som: { arquivo: "poco-pingo", volume: 0.35, loop: true }, alcance: 4 },
  { objeto: "barraca", som: { arquivo: "feira", volume: 0.3, loop: true }, alcance: 4 },
  // o rio fica no canto de baixo a esquerda do mapa da vila, nos tiles de agua
  { tile: { x: 5, y: 18 }, som: { arquivo: "rio", volume: 0.4, loop: true }, alcance: 7 },
];

/** Cantos avulsos. NUNCA em loop: repeticao regular e o que faz ambiente soar
 *  barato. Sai um a cada intervalo sorteado, em posicao sorteada. */
export const PASSAROS = {
  arquivos: ["passaro-1", "passaro-2", "passaro-3", "passaro-4"],
  volume: 0.3,
  /** segundos entre um canto e outro, sorteado nessa faixa */
  intervalo: { min: 8, max: 20 },
  variacao: 200,
};

/* --------------------------------------------------------------------- voz */

/** A altura da voz de cada personagem, em centesimos de tom.
 *
 * O Lele le pouco e devagar. Um tom fixo por personagem faz ele reconhecer quem
 * esta falando antes de terminar de ler o nome na chapinha dourada. E o mesmo
 * arquivo de som para todo mundo, so muda a altura.
 *
 * A chave e a mesma de DIALOGOS em dados/dialogos.ts.
 */
export const VOZ: Record<string, number> = {
  vovo: -300,
  ferreiro: -500,
  pescador: -400,
  guarda: -200,
  mercador: 100,
  padeira: 200,
  menino: 400,
  menina: 500,
  // objetos que "falam" ficam neutros: nao sao gente
  varal: 0,
  poco: 0,
  barraca: 0,
  "poste-sino": 0,
  fogueira: 0,
  bau: 0,
  placa: 0,
};

export const VOZ_PADRAO = 0;

/* ------------------------------------------------------------------- passo */

/** De que e feito o chao de cada tile, para o passo mudar de som.
 *
 * O dado ja existia: mapas.ts desenha o chao em letras e cada letra vira um tile.
 * Nada de novo precisa ser criado para o passo na areia soar diferente do passo
 * na madeira.
 */
export const PASSO_DO_TILE: Record<number, ChaveEfeito> = {
  [T.grama]: "passo-grama",
  [T.grama2]: "passo-grama",
  [T.grama3]: "passo-grama",
  [T.gramaAlta]: "passo-grama",
  [T.flores]: "passo-grama",
  [T.terra]: "passo-terra",
  [T.caminho]: "passo-terra",
  [T.areia]: "passo-areia",
  [T.madeiraChao]: "passo-madeira",
  [T.pedra]: "passo-pedra",
  [T.chaoCaverna]: "passo-pedra",
};

export const PASSO_PADRAO = "passo-grama";

/* ------------------------------------------------------------------ ajustes */

export const AJUSTES = {
  /** quanto a trilha abaixa quando a Pausa sobe. Abaixa, nao para: parar faz a
   *  faixa recomecar do zero na volta, e isso se ouve. */
  abafarNaPausa: 0.25,
  /** segundos de fade ao trocar de faixa. Corte seco denuncia o jogo. */
  fade: 1.2,
  /** teto de sons curtos ao mesmo tempo. Acima disso vira papa. */
  maxEfeitos: 8,
  /** um bip a cada N letras da fala. Um por letra vira metralhadora, e a
   *  fala do Reino de Aurora e para ser ouvida por uma crianca de 7 anos. */
  letrasPorBip: 3,
};
