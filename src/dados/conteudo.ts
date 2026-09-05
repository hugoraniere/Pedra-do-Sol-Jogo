/** Todo o conteudo do RPG de mesa, portado para o jogo.
 *
 * Fonte da verdade: docs/referencia/sistema-do-rpg-de-mesa.md
 * Se algo aqui divergir do documento, o documento ganha, porque foi ele que a
 * crianca ja jogou na mesa.
 *
 * Este arquivo e SO DADO. Nenhuma logica, nenhum Phaser. Assim da para
 * adicionar uma raca ou uma magia sem abrir nenhuma cena.
 */
import type { Marca } from "../sistemas/marcas";
import type { IdCondicao } from "../sistemas/condicoes";

export type Atributo = "forca" | "esperteza" | "coracao";

/** Escala unica pra preco e chance de drop de item (nao de magia/habilidade).
 *  Quanto mais raro, mais caro E mais dificil de cair no chao — ver
 *  docs/plano-de-itens-e-equipamento.md, secao 5. */
export type Raridade = "comum" | "incomum" | "raro" | "epico" | "lendario";

/** Como o bonus de um equipamento se pluga no jogo — pensado depois de achar
 *  o motor real de condicoes (`sistemas/condicoes.ts`, MOLHADO/QUEIMANDO/
 *  PRESO/ASSUSTADO/ESCONDIDO/ILUMINADO etc.) e ver que a primeira leva deste
 *  arquivo tinha inventado categorias soltas (ex.: "veneno") sem base
 *  nenhuma no jogo. Duas formas, nenhuma terceira:
 *  - `"teste"`: modificador contextual de dado, a mesma ideia que a arma ja
 *    usa ("+1 de perto"). `contexto` e livre, mas so vale a pena inventar um
 *    novo quando nao existe uma `IdCondicao` real que já diga a mesma coisa.
 *  - `"condicao"`: interage com uma condicao que JA EXISTE em
 *    `sistemas/condicoes.ts` — concede ela, encurta a duracao, ou da
 *    resistencia. Nunca inventa uma condicao nova aqui; se o efeito
 *    desejado nao tem `IdCondicao` correspondente, o item usa `"teste"` com
 *    um `contexto` nomeando a criatura/situacao real, nao uma categoria
 *    generica (ver secao 6 e correcao da rodada 3 em
 *    docs/plano-de-itens-e-equipamento.md). */
export type BonusDeEquipamento =
  | { tipo: "teste"; contexto: string }
  | { tipo: "condicao"; id: IdCondicao; efeito: "concede" | "resiste" | "encurta" };

/** Que pedaco do mundo uma acao de combate atinge. */
export type FormaDeAcao = "casa" | "linha" | "aoRedor";

/** Uma acao de combate pronta pra virar slot na barra: o golpe de trovao do
 *  Cavaleiro, o sopro quentinho da Cria de Dragao. So existe aqui quando a
 *  habilidade/dom E uma acao de LUTA — as "fora de luta" (Fala com Bichos,
 *  Conserta Tudo) ficam so em `habilidadeTexto`/`domTexto`, sem isto.
 *  Ver `docs/plano-de-implementacao.md`, "Fase 9 revista". */
export type AcaoDeCombate = {
  id: string;
  tipo: "golpe" | "magia" | "habilidade";
  nome: string;
  /** quadro de public/assets/icones.png */
  icone: number;
  cor: number;
  forma: FormaDeAcao;
  /** em casas, contando diagonal como 1 */
  alcance: number;
  atributo: Atributo;
  dica: string;
  /** chave de som; nem toda acao tem uma ligada ainda (ver Combate.ts) */
  som: string;
  marca?: Marca;
};

export const ATRIBUTOS: Record<Atributo, { nome: string; icone: string; oQueFaz: string }> = {
  forca: { nome: "FORCA", icone: "forca", oQueFaz: "empurrar, subir, lutar, carregar" },
  esperteza: { nome: "ESPERTEZA", icone: "esperteza", oQueFaz: "procurar, lembrar, consertar, magia" },
  coracao: { nome: "CORACAO", icone: "coracao_cheio", oQueFaz: "coragem, fazer amigo, sorte, animais" },
};

/** A ordem em que os tres poderes aparecem na ficha de papel, de cima para baixo. */
export const ORDEM_PODERES: Atributo[] = ["forca", "esperteza", "coracao"];

// ------------------------------------------------------------------ racas
export type Raca = {
  id: string;
  nome: string;
  /** o nome numa palavra so, para caber embaixo do avatar na criacao */
  curto: string;
  bonus: Atributo;
  dom: string;
  domTexto: string;
  /** quadro de icones.png. Nunca Desisto reusa `dado-5` (rolar de novo e o
   *  dado) e Sopro Quentinho reusa `acao-sopro-quentinho`, que o combate ja
   *  desenhou -- os outros tres ganharam icone proprio. Ver arte/icones.py. */
  icone: string;
  coracoes: number;
  cor: number;
  /** so quando o dom da raca e uma acao de LUTA (so a Cria de Dragao tem hoje).
   *  As outras racas (dom de dado, ou passivo puro) deixam isto `undefined`. */
  acaoDeCombate?: AcaoDeCombate;
};

export const RACAS: Raca[] = [
  {
    id: "vale",
    nome: "Gente do Vale",
    curto: "Vale",
    bonus: "coracao",
    dom: "Nunca Desisto",
    domTexto: "Uma vez por aventura voce pode rolar o dado de novo.",
    icone: "dado-5",
    coracoes: 3,
    cor: 0x3e9b62,
  },
  {
    id: "anao",
    nome: "Anao da Fornalha",
    curto: "Anao",
    bonus: "forca",
    dom: "Casco Duro",
    domTexto: "Voce comeca com 4 coracoes em vez de 3.",
    icone: "dom-casco-duro",
    coracoes: 4,
    cor: 0xf2802b,
  },
  {
    id: "elfo",
    nome: "Elfo da Folha",
    curto: "Elfo",
    bonus: "esperteza",
    dom: "Olhos de Coruja",
    domTexto: "Voce enxerga no escuro e de bem longe.",
    icone: "dom-olhos-de-coruja",
    coracoes: 3,
    cor: 0x3e9b62,
  },
  {
    id: "pequenino",
    nome: "Pequenino do Trigo",
    curto: "Pequenino",
    bonus: "coracao",
    dom: "Pe de Coelho",
    domTexto: "Uma vez por aventura voce troca um OPS por um QUASE.",
    icone: "dom-pata-de-coelho",
    coracoes: 3,
    cor: 0xf5b62b,
  },
  {
    id: "dragao",
    nome: "Cria de Dragao",
    curto: "Dragao",
    bonus: "forca",
    dom: "Sopro Quentinho",
    domTexto: "Uma vez por aventura voce solta fogo pela boca.",
    icone: "acao-sopro-quentinho",
    coracoes: 3,
    cor: 0xe2483d,
    acaoDeCombate: {
      id: "sopro-quentinho", tipo: "habilidade", nome: "SOPRO QUENTINHO",
      dica: "Solta fogo pela boca. So uma vez por aventura.",
      icone: 10, cor: 0xf5b62b, forma: "casa", alcance: 2, atributo: "coracao", som: "fogo",
    },
  },
];

// ---------------------------------------------------------------- classes
export type Classe = {
  id: string;
  nome: string;
  /** o nome numa palavra so, para caber embaixo do avatar na criacao */
  curto: string;
  bonus: Atributo;
  arma: string;
  habilidade: string;
  habilidadeTexto: string;
  magias: string[];
  /** so quando a habilidade da classe e uma acao de LUTA (so o Cavaleiro tem
   *  hoje). Amigo dos Bichos e Ferreiro tem habilidade fora de luta — fica so
   *  em `habilidadeTexto`, nunca vira slot de combate. */
  habilidadeDeLuta?: AcaoDeCombate;
};

export const CLASSES: Classe[] = [
  {
    id: "cavaleiro",
    nome: "Cavaleiro",
    curto: "Cavaleiro",
    bonus: "forca",
    arma: "espada-curta",
    habilidade: "Golpe Trovao",
    habilidadeTexto: "Uma vez por luta voce acerta sem precisar rolar o dado.",
    magias: [],
    habilidadeDeLuta: {
      id: "golpe-trovao", tipo: "habilidade", nome: "GOLPE TROVAO",
      dica: "Acerta sem precisar rolar o dado. So uma vez por luta.",
      icone: 9, cor: 0x7b5ac4, forma: "casa", alcance: 1, atributo: "forca", som: "golpe-trovao",
    },
  },
  {
    id: "mago",
    nome: "Mago da Torre",
    curto: "Mago",
    bonus: "esperteza",
    arma: "cajado",
    habilidade: "Tres Magias",
    habilidadeTexto: "Voce escolhe tres magias, cada uma com um uso por aventura.",
    magias: ["bola-de-fogo", "bafo-gelado", "cheiro-de-bolo"],
  },
  {
    id: "cacador",
    nome: "Cacador de Dragao",
    curto: "Cacador",
    bonus: "esperteza",
    arma: "arco",
    habilidade: "Olho de Alvo",
    habilidadeTexto: "Voce ganha +1 no dado quando mira em alguma coisa longe.",
    magias: [],
  },
  {
    id: "amigo",
    nome: "Amigo dos Bichos",
    curto: "Amigo",
    bonus: "coracao",
    arma: "funda",
    habilidade: "Fala com Bichos",
    habilidadeTexto: "Voce conversa com qualquer bicho, e eles ajudam se gostarem de voce.",
    magias: ["fala-bicho"],
  },
  {
    id: "ferreiro",
    nome: "Ferreiro Andarilho",
    curto: "Ferreiro",
    bonus: "forca",
    arma: "martelo",
    habilidade: "Conserta Tudo",
    habilidadeTexto: "Uma vez por cena voce conserta qualquer coisa quebrada.",
    magias: ["remendo"],
  },
];

// ---------------------------------------------------------------- magias
export type Magia = { id: string; nome: string; texto: string; cor: number };

export const MAGIAS: Magia[] = [
  { id: "luzinha", nome: "Luzinha", texto: "Uma bolinha de luz flutua e ilumina o caminho.", cor: 0xf5b62b },
  { id: "bafo-gelado", nome: "Bafo Gelado", texto: "Um sopro que congela agua, fogo e ate goblin.", cor: 0x7ec4f2 },
  { id: "cresce-grama", nome: "Cresce-Grama", texto: "A grama cresce alta e vira escada, corda ou esconderijo.", cor: 0x3e9b62 },
  { id: "voz-de-trovao", nome: "Voz de Trovao", texto: "Sua voz fica tao alta que todo mundo para pra ouvir.", cor: 0x4a3e64 },
  { id: "pulo-de-sapo", nome: "Pulo de Sapo", texto: "Um pulo enorme, por cima de rio, muro ou monstro.", cor: 0x3e9b62 },
  { id: "dedo-colante", nome: "Dedo Colante", texto: "Suas maos grudam em qualquer parede.", cor: 0xee7ba6 },
  { id: "remendo", nome: "Remendo", texto: "Junta de volta uma coisa quebrada.", cor: 0xb08658 },
  { id: "escudo-de-bolha", nome: "Escudo de Bolha", texto: "Uma bolha te protege de um golpe.", cor: 0x7ec4f2 },
  { id: "cheiro-de-bolo", nome: "Cheiro de Bolo", texto: "Um cheirinho irresistivel atrai todo mundo pro mesmo lugar.", cor: 0xf5b62b },
  { id: "fala-bicho", nome: "Fala Bicho", texto: "Voce entende e fala com qualquer bicho.", cor: 0x3e9b62 },
  { id: "sumir-sumindo", nome: "Sumir-Sumindo", texto: "Voce fica invisivel enquanto ficar quietinho.", cor: 0x4a3e64 },
  { id: "chama-vento", nome: "Chama-Vento", texto: "Um vento forte empurra tudo que estiver na frente.", cor: 0xcde9f8 },
  { id: "bola-de-fogo", nome: "Bola de Fogo", texto: "Uma bola de fogo que voa numa direcao. Goblin aguenta, gelo nao.", cor: 0xf2802b },
];

// ----------------------------------------------------------------- armas
export type Arma = {
  id: string;
  nome: string;
  preco: number;
  bonus: string;
  lendaria?: boolean;
  /** so nas armas "encontradas" (ver abaixo) — as 11 originais nao tem, e
   *  contam como "comum" (ou "lendario" via `lendaria` acima). */
  raridade?: Raridade;
  /** como o bonus se pluga no jogo (Fase D, ainda por escrever) — ver
   *  `BonusDeEquipamento` acima. So nas armas encontradas. */
  mecanica?: BonusDeEquipamento;
  /** de onde ela vem, pra ficha/hover explicar (lugar ou vitoria) */
  origem?: string;
};

export const ARMAS: Arma[] = [
  { id: "espada-curta", nome: "Espada Curta", preco: 5, bonus: "+1 de perto" },
  { id: "escudo", nome: "Escudo Redondo", preco: 4, bonus: "segura 1 coracao, uma vez por luta" },
  { id: "arco", nome: "Arco de Galho", preco: 5, bonus: "+1 de longe" },
  { id: "cajado", nome: "Cajado de Carvalho", preco: 5, bonus: "+1 em magia" },
  { id: "martelo", nome: "Martelo de Fornalha", preco: 6, bonus: "+1 para quebrar e consertar" },
  { id: "machado", nome: "Machado do Lenhador", preco: 6, bonus: "+1 para cortar" },
  { id: "adaga", nome: "Adaga da Sorte", preco: 3, bonus: "+1 escondido" },
  { id: "funda", nome: "Funda de Couro", preco: 2, bonus: "+1 de longe, nunca passa de QUASE" },
  { id: "lamina-aurora", nome: "Lamina Aurora", preco: 0, bonus: "so na historia", lendaria: true },
  { id: "escudo-espelho", nome: "Escudo Espelho", preco: 0, bonus: "so na historia", lendaria: true },
  { id: "arco-lua", nome: "Arco da Lua Cheia", preco: 0, bonus: "so na historia", lendaria: true },

  // ------- encontradas: progressao por cima das armas base, presas a um
  // lugar ou a uma vitoria de verdade, nao um nome bonito solto — ver
  // docs/plano-de-itens-e-equipamento.md, secao 9. Nao substituem a base,
  // sao um achado alternativo.
  {
    id: "lamina-guarda-vila", nome: "Lamina do Guarda-Vila", preco: 0,
    bonus: "+1 de perto, +1 pra impressionar guarda",
    raridade: "incomum", mecanica: { tipo: "teste", contexto: "perto" },
    origem: "recompensa de missao secundaria na Vila Semente",
  },
  {
    id: "arco-trancado-teia", nome: "Arco Trancado de Teia", preco: 10,
    bonus: "+1 de longe, nunca erra contra bicho pequeno (porte pequeno)",
    raridade: "incomum", mecanica: { tipo: "teste", contexto: "longe" },
    origem: "comprado depois de trazer 3x Fio de Teia Doce",
  },
  {
    // era "+1 contra criatura de nevoa" — categoria que nao existe em
    // nenhum lugar do jogo. Nomeia o bicho de verdade em vez de inventar
    // uma familia elemental.
    id: "funda-de-presa", nome: "Funda de Presa", preco: 13,
    bonus: "+1 de longe, nunca passa de QUASE, +1 contra o Lobo de Nevoa",
    raridade: "incomum", mecanica: { tipo: "teste", contexto: "longe" },
    origem: "comprada depois de trazer 2x Presa de Nevoa",
  },
  {
    // era "+1 contra armadura" (generico) — o cavaleiro-cinzas E a armadura
    // ("Armadura vazia por dentro, cheia de cinza", BESTIARIO), entao nomear
    // ele e mais honesto que inventar uma categoria "criatura com armadura".
    id: "martelo-de-cinza", nome: "Martelo de Cinza", preco: 16,
    bonus: "+1 para quebrar e consertar, +1 contra o Cavaleiro de Cinzas",
    raridade: "raro", mecanica: { tipo: "teste", contexto: "consertar" },
    origem: "comprado depois de trazer 4x Cinza de Armadura",
  },
  {
    // era "+1 contra veneno" — veneno nao existe como condicao nem como
    // dano no jogo (bestiario nao tem nenhum bicho venenoso). Nomeia a
    // serpente de verdade.
    id: "adaga-da-serpente", nome: "Adaga da Serpente", preco: 0,
    bonus: "+1 escondido, +1 contra a Serpente do Pantano",
    raridade: "epico", mecanica: { tipo: "teste", contexto: "escondido" },
    origem: "vencer a Serpente no Pantano",
  },
  {
    // era "+1 contra criatura de espinho" (inventado) — o proprio telegrafo
    // dela em BESTIARIO ("o espinho racha o chao antes de subir") e uma
    // prisao pelo chao, que e exatamente o que PRESO ja significa em
    // sistemas/condicoes.ts. Usa a condicao real em vez de uma nova.
    id: "cajado-bruxa-espinho", nome: "Cajado da Bruxa Espinho", preco: 0,
    bonus: "+1 em magia, resiste a ficar PRESO pelo espinho dela",
    raridade: "epico", mecanica: { tipo: "condicao", id: "preso", efeito: "resiste" },
    origem: "vencer a Bruxa Espinho na Torre",
  },
];

// ------------------------------------------------------------- mochilas
// Tamanho de mochila, igual Stardew Valley (Saco -> Bolsa -> Mochila) e
// Project Zomboid (mochila pequena vira grande com o jogo). O heroi comeca
// com a pequena; as outras sao encontradas ou compradas depois — mesma
// dependencia de loja que o resto do plano (ver secao 7 do documento):
// `comprarMochila()` em estado.ts ja funciona, so nao ha cena de loja pra
// chamar ainda.
export type Mochila = { id: string; nome: string; preco: number; slots: number; texto: string };

export const MOCHILAS: Mochila[] = [
  { id: "mochila-pequena", nome: "Mochila Pequena", preco: 0, slots: 8, texto: "A que sai da Vila Semente com voce." },
  { id: "mochila-media", nome: "Mochila de Couro", preco: 15, slots: 16, texto: "Encomendada com Seu Cominho. Cabe o dobro." },
  { id: "mochila-grande", nome: "Mochila de Viagem", preco: 30, slots: 24, texto: "Pra quem ja nao volta pra casa todo dia." },
];

export const acharMochila = (id: string): Mochila => MOCHILAS.find((m) => m.id === id) ?? MOCHILAS[0];

// ------------------------------------------------------------------ loja
export type Item = { id: string; nome: string; preco: number; texto: string };

export const LOJA: Item[] = [
  { id: "pocao-morango", nome: "Pocao de Morango", preco: 3, texto: "Enche 1 coracao. Tem gosto de morango." },
  { id: "pocao-grandona", nome: "Pocao Grandona", preco: 6, texto: "Enche todos os coracoes de uma vez." },
  { id: "corda", nome: "Corda Saltitante", preco: 2, texto: "Se joga sozinha e se amarra onde voce apontar." },
  { id: "lanterna", nome: "Lanterna Vaga-lume", preco: 3, texto: "Um vaga-lume mora dentro e ilumina tudo." },
  { id: "biscoito", nome: "Biscoito Magico", preco: 2, texto: "+1 no proximo dado. So funciona uma vez." },
  { id: "bota-vento", nome: "Bota do Vento", preco: 5, texto: "Voce corre o dobro por uma cena." },
  { id: "capa-camaleao", nome: "Capa Camaleao", preco: 6, texto: "Voce fica da cor do que estiver atras." },
  { id: "pena-fenix", nome: "Pena da Fenix", preco: 8, texto: "Se voce ficar tonto, ela te levanta na hora." },
  { id: "sino-espanta", nome: "Sino Espanta-Monstro", preco: 4, texto: "Toca e o monstro fica sem coragem por uma rodada." },
  { id: "mapa-que-fala", nome: "Mapa Que Fala", preco: 4, texto: "Ele diz em voz alta pra onde voce deve ir." },
  { id: "saco-sem-fundo", nome: "Saco Sem Fundo", preco: 7, texto: "Cabe tudo. Achar de novo e outra historia." },
  { id: "chave-mestra", nome: "Chave Mestra", preco: 5, texto: "Abre qualquer fechadura comum. Uma vez." },
];

// --------------------------------------------------------- materiais
//
// Trofeu/insumo que cai de bicho comum: nao equipavel, so guardado, vendido
// ou trocado com Seu Cominho por uma Armadura/Acessorio/Arma que usa ele
// como insumo (nao e crafting — e um degrau a mais na loja, ver
// docs/plano-de-itens-e-equipamento.md, secao 7). `origem` e o id da
// criatura em BESTIARIO que larga este material.
//
// Preco segue a mesma escala de Raridade das demais categorias, mas pela
// metade: material nao tem clausula de bonus pra justificar o preco cheio
// (comum 2, incomum 4, raro 6 — a formula inteira esta na secao 5 do plano).
export type Material = { id: string; nome: string; preco: number; raridade: Raridade; origem: string; texto: string };

export const MATERIAIS: Material[] = [
  { id: "teia-doce", nome: "Fio de Teia Doce", preco: 2, raridade: "comum", origem: "aranha", texto: "O mesmo fio que a aranha usa pra fugir. Comestivel, gosto doce." },
  { id: "palha", nome: "Palha de Espantalho", preco: 2, raridade: "comum", origem: "espantalho", texto: "Recheio seco do proprio espantalho. So serve pra vender." },
  { id: "presa-de-nevoa", nome: "Presa de Nevoa", preco: 4, raridade: "incomum", origem: "lobo-nevoa", texto: "Ainda fria ao toque, mesmo longe da neblina." },
  { id: "cinza", nome: "Cinza de Armadura", preco: 6, raridade: "raro", origem: "cavaleiro-cinzas", texto: "Cinza que nunca esfria de verdade." },
];

// --------------------------------------------------------- armaduras
export type Armadura = {
  id: string;
  nome: string;
  preco: number;
  raridade: Raridade;
  bonus: string;
  /** como o bonus se pluga no jogo — ver `BonusDeEquipamento`. Sempre
   *  presente aqui (diferente da arma): armadura so existe nesta segunda
   *  leva, entao nasce ja com a mecanica pensada, nunca solta. */
  mecanica: BonusDeEquipamento;
  origem?: string;
};

export const ARMADURAS: Armadura[] = [
  {
    id: "colete-vila", nome: "Colete de Couro da Vila", preco: 3, raridade: "comum",
    bonus: "resiste a ficar ASSUSTADO perto da Vila Semente",
    mecanica: { tipo: "condicao", id: "assustado", efeito: "resiste" },
  },
  {
    // era "+1 pra resistir veneno e picada" — veneno nao existe no jogo. A
    // teia de verdade PRENDE, entao a condicao real e PRESO, nao um
    // elemento inventado. Versao comum: encurta, nao imuniza (isso fica
    // pro Manto do Pantano, epico, abaixo).
    id: "manto-teia", nome: "Manto de Teia", preco: 3, raridade: "comum",
    bonus: "some de PRESO um turno mais cedo",
    mecanica: { tipo: "condicao", id: "preso", efeito: "encurta" },
    origem: "comprado depois de trazer 2x Fio de Teia Doce",
  },
  {
    id: "capuz-nevoa", nome: "Capuz de Nevoa", preco: 7, raridade: "incomum",
    bonus: "fica ESCONDIDO com mais facilidade de noite ou na neblina",
    mecanica: { tipo: "condicao", id: "escondido", efeito: "concede" },
    origem: "comprado depois de trazer 2x Presa de Nevoa",
  },
  {
    // era "+1 pra aguentar golpe de fogo" — vago. QUEIMANDO ja existe como
    // condicao real (2 turnos, 1 coracao por turno) — a couraca encurta
    // pra 1, nao inventa uma resistencia a "fogo" generico.
    id: "couraca-cinza", nome: "Couraca de Cinza", preco: 13, raridade: "raro",
    bonus: "QUEIMANDO dura 1 turno em vez de 2",
    mecanica: { tipo: "condicao", id: "queimando", efeito: "encurta" },
    origem: "comprada depois de trazer 4x Cinza de Armadura",
  },
  {
    // era "+1 contra veneno de pantano" — mesma correcao do Manto de Teia,
    // so que a versao epica IMUNIZA (resiste) em vez de so encurtar.
    id: "manto-pantano", nome: "Manto do Pantano", preco: 0, raridade: "epico",
    bonus: "nunca fica PRESO na lama do Pantano",
    mecanica: { tipo: "condicao", id: "preso", efeito: "resiste" },
    origem: "vencer a Serpente no Pantano",
  },
];

// --------------------------------------------------------- acessorios
export type Acessorio = {
  id: string;
  nome: string;
  preco: number;
  raridade: Raridade;
  bonus: string;
  mecanica: BonusDeEquipamento;
  origem?: string;
};

export const ACESSORIOS: Acessorio[] = [
  {
    id: "bracelete-palha", nome: "Bracelete de Palha Trancada", preco: 3, raridade: "comum",
    bonus: "fica ESCONDIDO com mais facilidade no campo aberto",
    mecanica: { tipo: "condicao", id: "escondido", efeito: "concede" },
    origem: "comprado depois de trazer 3x Palha de Espantalho",
  },
  {
    // era "+1 pra escapar de emboscada" — vago. "Escapar" de uma armadilha
    // e exatamente o que PRESO ja modela; o anel e feito da propria teia
    // que prende a aranha, entao "encurtar PRESO" e o eco tematico certo.
    id: "anel-teia", nome: "Anel da Teia", preco: 12, raridade: "raro",
    bonus: "sai de PRESO em 1 turno, nao importa a causa",
    mecanica: { tipo: "condicao", id: "preso", efeito: "encurta" },
    origem: "drop raro da aranha, ou comprado",
  },
  {
    // era "+1 contra criatura de nevoa ou neblina" — nomeia o bicho de
    // verdade em vez de uma familia elemental inventada.
    id: "presa-lapidada", nome: "Presa de Nevoa Lapidada", preco: 14, raridade: "raro",
    bonus: "+1 contra o Lobo de Nevoa",
    mecanica: { tipo: "teste", contexto: "longe" },
    origem: "drop raro do lobo-de-nevoa, ou comprado",
  },
  {
    // era "+1 de coragem" solto — CORACAO e o atributo de verdade, e o
    // bonus so vale num lugar (a Vila), entao continua contextual, nao um
    // "+1 em CORACAO" liso que a segunda rodada do plano ja rejeitou.
    id: "pingente-sino", nome: "Pingente do Sino da Vila", preco: 0, raridade: "incomum",
    bonus: "+1 em teste de CORACAO, so na Vila Semente",
    mecanica: { tipo: "teste", contexto: "coracao-vila" },
    origem: "recompensa de 'A missao do sino'",
  },
  {
    id: "broche-troll", nome: "Broche do Troll", preco: 0, raridade: "epico",
    bonus: "+1 pra fazer rir e evitar briga",
    mecanica: { tipo: "teste", contexto: "riso" },
    origem: "resolver o Grulo fazendo ele rir",
  },
];

// ------------------------------------------------------------- bestiario
//
// A ficha de cada criatura, inteira. O que estava aqui antes eram cinco campos
// de enciclopedia (nome, coracoes, fraqueza, texto): dava para escrever o
// bestiario na tela e mais nada. Agora ela tem o que o jogo precisa para POR a
// criatura no mapa e para ela reagir.
//
// A coluna que manda e `fraquezaId`. Nenhuma das nove fraquezas do RPG de mesa
// e um tipo de dano: sao todas CONHECIMENTO. Saber e a arma, e por isso a
// fraqueza precisa ser uma chave que o codigo compara, e nao so a frase bonita
// que aparece no livro.

/** O que a criatura faz quando ninguem mexe com ela, e o que faz quando mexem. */
export type Comportamento =
  /** corre do heroi. So bate se ficar sem saida. */
  | "foge"
  /** anda a propria rota e ignora o heroi ate ser tocada. */
  | "ronda"
  /** parada, olhando. Quando ve, chama as outras em vez de atacar sozinha. */
  | "vigia"
  /** vem para cima, reta e sem pressa. Nao desiste. */
  | "encara"
  /** some e reaparece em outro lugar. Nunca aparece duas vezes no mesmo ponto. */
  | "espreita"
  /** nao sai do lugar: existe para fechar uma passagem. */
  | "guarda"
  /** rotina propria, escrita cena a cena. */
  | "chefe";

/** Tamanho do quadro do sprite. A folha padrao do jogo e 16 x 32; quem nao
 *  cabe nela ganha grade propria, e nao um desenho espremido. */
export type Porte = "pequeno" | "medio" | "grande" | "enorme";

export const PORTES: Record<Porte, { largura: number; altura: number }> = {
  pequeno: { largura: 16, altura: 32 },
  medio: { largura: 16, altura: 32 },
  grande: { largura: 24, altura: 40 },
  enorme: { largura: 48, altura: 48 },
};

export type Criatura = {
  id: string;
  nome: string;
  coracoes: number;
  /** a frase do livro, para o jogador ler */
  fraqueza: string;
  /** a mesma fraqueza, como chave, para o codigo comparar */
  fraquezaId: string;
  texto: string;
  /** chave do sprite em public/assets */
  sprite: string;
  porte: Porte;
  comportamento: Comportamento;
  /** px por segundo. O heroi anda a 62: acima disso ela alcanca, abaixo nao. */
  velocidade: number;
  /** distancia do golpe, em px */
  alcance: number;
  /** coracoes por golpe */
  dano: number;
  /** o aviso de meio segundo antes do golpe. Toda criatura tem um, e e por ele
   *  que o jogador aprende a ler a briga em vez de decorar. */
  telegrafo: string;
  /** 0 a 1: chance dela esquivar de um golpe que ia acertar (QUASE/INCRIVEL).
   *  Nao existe na mesa (o monstro nunca rola) -- e um atributo novo do
   *  jogo, pedido pelo Hugo em 2026-09-05: continua sendo O DADO DO HEROI
   *  quem decide o resultado, isto so filtra por cima dele. 0 = nunca
   *  esquiva (o goblin, por exemplo, nao muda em nada). */
  esquivaChance: number;
  /** o que fica no chao quando ela e vencida, e a chance de cada coisa cair
   *  (0 a 1). Guardiao unico (`unico: true`) ignora a chance na pratica: o
   *  item de historia sempre cai (chance 1), senao a missao principal
   *  travaria por azar de dado — ver docs/plano-de-itens-e-equipamento.md,
   *  secao 8. */
  larga: { id: string; chance: number }[];
  /** true pros guardioes de historia (uma luta so na vida do save: serpente,
   *  grulo, bruxa, brasanegra). Sem isso, um sistema de drop por
   *  porcentagem nao sabe diferenciar "pode lutar de novo, entao vale
   *  chance" de "so existe esta vez, entao o item tem que cair sempre". */
  unico?: boolean;
  /** em que lugares ela aparece */
  onde: string[];
};

export const BESTIARIO: Criatura[] = [
  {
    id: "goblin", nome: "Goblin da Fumaca", coracoes: 1,
    fraqueza: "barulho alto de metal", fraquezaId: "barulho-metal",
    texto: "Pequeno, verde, orelhudo. Foge mais do que briga.",
    sprite: "goblin", porte: "pequeno", comportamento: "foge",
    velocidade: 70, alcance: 12, dano: 1, esquivaChance: 0,
    telegrafo: "levanta o pau acima da cabeca e fecha os olhos",
    larga: [{ id: "moeda", chance: 0.7 }], onde: ["floresta", "caverna"],
  },
  {
    id: "aranha", nome: "Aranha da Teia Doce", coracoes: 2,
    fraqueza: "comer a teia e escapar", fraquezaId: "comer-teia",
    texto: "A teia dela e doce de verdade. Da pra comer.",
    sprite: "aranha", porte: "pequeno", comportamento: "ronda",
    velocidade: 34, alcance: 14, dano: 1, esquivaChance: 0.2,
    telegrafo: "encolhe as oito pernas antes do bote",
    larga: [{ id: "teia-doce", chance: 0.55 }, { id: "anel-teia", chance: 0.04 }], onde: ["floresta"],
  },
  {
    id: "espantalho", nome: "Espantalho Andarilho", coracoes: 2,
    fraqueza: "agua", fraquezaId: "agua",
    texto: "Anda sozinho pelo campo procurando o dono.",
    sprite: "espantalho", porte: "medio", comportamento: "ronda",
    velocidade: 28, alcance: 16, dano: 1, esquivaChance: 0,
    telegrafo: "gira os bracos como cata-vento",
    larga: [{ id: "palha", chance: 0.6 }, { id: "moeda", chance: 0.25 }], onde: ["campo", "vila"],
  },
  {
    id: "lobo-nevoa", nome: "Lobo de Nevoa", coracoes: 2,
    fraqueza: "luz forte", fraquezaId: "luz",
    texto: "Aparece e some no meio da neblina.",
    sprite: "lobo-nevoa", porte: "medio", comportamento: "espreita",
    velocidade: 78, alcance: 14, dano: 1, esquivaChance: 0.3,
    telegrafo: "a nevoa se junta num ponto antes de ele sair dela",
    larga: [{ id: "presa-de-nevoa", chance: 0.35 }, { id: "presa-lapidada", chance: 0.05 }], onde: ["floresta"],
  },
  {
    id: "serpente", nome: "Serpente do Pantano", coracoes: 3,
    fraqueza: "cocegas embaixo do queixo", fraquezaId: "cocegas",
    texto: "Engoliu o Cristal do Meio-dia sem querer.",
    sprite: "serpente", porte: "grande", comportamento: "guarda",
    velocidade: 40, alcance: 20, dano: 1, esquivaChance: 0,
    telegrafo: "recolhe o pescoco em S e fica quieta demais",
    larga: [{ id: "cristal-meio-dia", chance: 1 }, { id: "manto-pantano", chance: 1 }],
    unico: true, onde: ["pantano"],
  },
  {
    id: "grulo", nome: "Grulo, o Troll", coracoes: 4,
    fraqueza: "uma boa gargalhada", fraquezaId: "riso",
    texto: "Cobra pedagio na ponte. No fundo quer companhia.",
    sprite: "grulo", porte: "grande", comportamento: "guarda",
    velocidade: 30, alcance: 20, dano: 1, esquivaChance: 0,
    telegrafo: "bate o porrete no chao duas vezes",
    // as tres saidas da Fase 3 sao todas pacificas (pagar, charada, fazer
    // rir) — nao ha final "vencer na luta" no roadmap, so o troco de
    // resolver rindo ganha item aqui. Se o combate contra ele acontecer de
    // qualquer jeito (BESTIARIO permite), o pedagio ainda cai, mas o broche
    // fica reservado pra quem resolver pelo riso.
    larga: [{ id: "pedagio", chance: 1 }, { id: "broche-troll", chance: 1 }],
    unico: true, onde: ["ponte"],
  },
  {
    id: "bruxa", nome: "Bruxa Espinho", coracoes: 3,
    fraqueza: "nao consegue mentir sobre o proprio nome", fraquezaId: "nome-proprio",
    texto: "Foi ela quem quebrou a Pedra do Sol.",
    sprite: "bruxa", porte: "medio", comportamento: "chefe",
    velocidade: 55, alcance: 60, dano: 1, esquivaChance: 0,
    telegrafo: "o espinho racha o chao antes de subir",
    larga: [{ id: "cristal-anoitecer", chance: 1 }, { id: "cajado-bruxa-espinho", chance: 1 }],
    unico: true, onde: ["torre"],
  },
  {
    id: "cavaleiro-cinzas", nome: "Cavaleiro de Cinzas", coracoes: 5,
    fraqueza: "agua fria", fraquezaId: "agua-fria",
    texto: "Armadura vazia por dentro, cheia de cinza.",
    sprite: "cavaleiro-cinzas", porte: "grande", comportamento: "encara",
    velocidade: 36, alcance: 18, dano: 2, esquivaChance: 0,
    telegrafo: "a viseira acende por dentro",
    larga: [{ id: "cinza", chance: 0.45 }], onde: ["torre", "pico"],
  },
  {
    id: "brasanegra", nome: "Brasanegra", coracoes: 10,
    fraqueza: "o nome verdadeiro, Aurel", fraquezaId: "nome-verdadeiro",
    texto: "O dragao guardiao, com o coracao cheio de cinzas.",
    sprite: "brasanegra", porte: "enorme", comportamento: "chefe",
    velocidade: 45, alcance: 90, dano: 2, esquivaChance: 0,
    telegrafo: "o peito acende de dentro para fora antes do sopro",
    larga: [{ id: "pedra-do-sol", chance: 1 }], unico: true, onde: ["pico"],
  },
];

// ------------------------------------------------------------- utilidades
export const acharRaca = (id: string) => RACAS.find((r) => r.id === id) ?? RACAS[2];
export const acharClasse = (id: string) => CLASSES.find((c) => c.id === id) ?? CLASSES[1];
export const acharMagia = (id: string) => MAGIAS.find((m) => m.id === id);
export const acharArma = (id: string) => ARMAS.find((a) => a.id === id);
export const acharItem = (id: string) => LOJA.find((i) => i.id === id);
export const acharMaterial = (id: string) => MATERIAIS.find((m) => m.id === id);
export const acharArmadura = (id: string) => ARMADURAS.find((a) => a.id === id);
export const acharAcessorio = (id: string) => ACESSORIOS.find((a) => a.id === id);
export const acharCriatura = (id: string) => BESTIARIO.find((c) => c.id === id);

/** Qualquer coisa que a mochila possa guardar, com o suficiente pra
 *  desenhar uma linha nela: nome, descricao, e a categoria que decide qual
 *  acao mostrar (usar/vender/equipar/so examinar). Ver `Ficha.ts`,
 *  `paginaMochila()`. */
export type ItemPossuido =
  | { categoria: "consumivel"; nome: string; texto: string; preco: number }
  | { categoria: "material"; nome: string; texto: string; preco: number; raridade: Raridade }
  | { categoria: "armadura"; nome: string; bonus: string; raridade: Raridade; origem?: string }
  | { categoria: "acessorio"; nome: string; bonus: string; raridade: Raridade; origem?: string }
  | { categoria: "arma"; nome: string; bonus: string; raridade?: Raridade; origem?: string }
  /** id sem ficha em catalogo nenhum: item de historia/missao (pano-goblin,
   *  cristal-meio-dia, pedagio...) que sempre foi so uma string solta em
   *  `dialogos.ts`/`BESTIARIO.larga`, nunca ganhou nome bonito. Mostra o id
   *  humanizado em vez de fingir que tem descricao. */
  | { categoria: "historia"; nome: string };

const humanizarId = (id: string): string =>
  id.split("-").map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join(" ");

export function acharQualquerItem(id: string): ItemPossuido {
  const item = acharItem(id);
  if (item) return { categoria: "consumivel", nome: item.nome, texto: item.texto, preco: item.preco };
  const material = acharMaterial(id);
  if (material) {
    return { categoria: "material", nome: material.nome, texto: material.texto, preco: material.preco, raridade: material.raridade };
  }
  const armadura = acharArmadura(id);
  if (armadura) {
    return { categoria: "armadura", nome: armadura.nome, bonus: armadura.bonus, raridade: armadura.raridade, origem: armadura.origem };
  }
  const acessorio = acharAcessorio(id);
  if (acessorio) {
    return { categoria: "acessorio", nome: acessorio.nome, bonus: acessorio.bonus, raridade: acessorio.raridade, origem: acessorio.origem };
  }
  const arma = acharArma(id);
  if (arma) return { categoria: "arma", nome: arma.nome, bonus: arma.bonus, raridade: arma.raridade, origem: arma.origem };
  return { categoria: "historia", nome: humanizarId(id) };
}

/** O Goblin da Fumaca e UMA criatura no bestiario (mesma vida, mesma
 *  fraqueza), mas a arte desenhou 3 corpos - magricela, gorducho, moleque -
 *  pra tres goblins na mesma tela nao parecerem copia colada (retratos ja
 *  distintos em `arte/icones.py`; `BESTIARIO.goblin.sprite` sozinho nao
 *  aponta pra nenhum dos tres). A escolha e ESTAVEL pela posicao no mapa,
 *  nunca sorteada - a mesma logica de "variacao estavel" que decide mata e
 *  mato no chao - entao o mesmo goblin sempre nasce com o mesmo corpo, e
 *  Mundo.ts e Combate.ts, chamando com a MESMA casa, sempre concordam. */
const VARIANTES_GOBLIN = ["magricela", "gorducho", "moleque"] as const;
export function spriteDoGoblin(tx: number, ty: number): string {
  const indice = Math.abs(tx * 31 + ty * 17) % VARIANTES_GOBLIN.length;
  return `goblin-${VARIANTES_GOBLIN[indice]}`;
}
