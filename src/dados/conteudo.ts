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
import type { AlvoDeAcao } from "../sistemas/alvo";

/** Revisao de 2026-09-04 (CLAUDE.md): os tres da mesa (FORCA, ESPERTEZA,
 *  CORACAO) viraram cinco. "Esperteza" fazia tres trabalhos escondidos - agora
 *  cada um tem nome proprio: magia vira Inteligencia, golpe a distancia vira
 *  Destreza, iniciativa e defesa viram Agilidade. "Coracao" vira Vitalidade
 *  porque a mesma palavra fazia dois trabalhos (o atributo E os coracoes/vida). */
export type Atributo = "forca" | "destreza" | "agilidade" | "inteligencia" | "vitalidade";

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
  /** "livre" quando a acao age no proprio heroi ou numa casa vazia, e nao
   *  precisa pegar ninguem pra contar como sucesso - ver sistemas/alvo.ts.
   *  Ausente (o padrao) significa "inimigo", igual sempre foi. */
  alvo?: AlvoDeAcao;
};

/** Icones emprestados ate arte propria existir (arte/icones.py so tem "forca"
 *  e "esperteza" desenhados hoje) - Inteligencia, Destreza e Agilidade
 *  reusam o icone de esperteza, Vitalidade reusa o coracao cheio. Comecar
 *  feio de proposito, ver docs/06-fluxo-de-sprites.md. */
export const ATRIBUTOS: Record<Atributo, { nome: string; icone: string; oQueFaz: string }> = {
  forca: { nome: "FORCA", icone: "forca", oQueFaz: "empurrar, subir, golpe de perto, carregar" },
  destreza: { nome: "DESTREZA", icone: "esperteza", oQueFaz: "golpe a distancia, mira, mao firme" },
  agilidade: { nome: "AGILIDADE", icone: "esperteza", oQueFaz: "iniciativa, esquiva, reflexo" },
  inteligencia: { nome: "INTELIGENCIA", icone: "esperteza", oQueFaz: "magia, lembrar, consertar" },
  vitalidade: { nome: "VITALIDADE", icone: "coracao_cheio", oQueFaz: "coragem, fazer amigo, resistir" },
};

/** A ordem em que os cinco atributos aparecem na ficha, de cima para baixo. */
export const ORDEM_PODERES: Atributo[] = ["forca", "destreza", "agilidade", "inteligencia", "vitalidade"];

// ------------------------------------------------------------------ racas
export type Raca = {
  id: string;
  nome: string;
  /** o nome numa palavra so, para caber embaixo do avatar na criacao */
  curto: string;
  /** Revisao de 2026-09-05 (docs/15-lore-e-visual-das-racas.md): duas raças
   *  não bastam mais para justificar cinco atributos, então o bônus virou um
   *  CICLO de cinco — cada raça soma dois atributos vizinhos (Destreza →
   *  Agilidade → Vitalidade → Força → Inteligência → e fecha em Destreza).
   *  Cada atributo cai em exatamente duas raças, e nenhuma dupla se repete. */
  bonus: [Atributo, Atributo];
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
    bonus: ["destreza", "agilidade"],
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
    bonus: ["vitalidade", "forca"],
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
    bonus: ["inteligencia", "destreza"],
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
    bonus: ["agilidade", "vitalidade"],
    dom: "Pe de Coelho",
    domTexto: "Uma vez por aventura voce troca uma Falha por uma Falha Perto.",
    icone: "dom-pata-de-coelho",
    coracoes: 3,
    cor: 0xf5b62b,
  },
  {
    id: "dragao",
    nome: "Cria de Dragao",
    curto: "Dragao",
    bonus: ["forca", "inteligencia"],
    dom: "Sopro Quentinho",
    domTexto: "Uma vez por aventura voce solta fogo pela boca.",
    icone: "acao-sopro-quentinho",
    coracoes: 3,
    cor: 0xe2483d,
    acaoDeCombate: {
      id: "sopro-quentinho", tipo: "habilidade", nome: "SOPRO QUENTINHO",
      dica: "Solta fogo pela boca. So uma vez por aventura.",
      icone: 10, cor: 0xf5b62b, forma: "casa", alcance: 2, atributo: "vitalidade", som: "fogo",
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
    bonus: "inteligencia",
    arma: "cajado",
    habilidade: "Tres Magias",
    habilidadeTexto: "Voce escolhe tres magias, cada uma com um uso por aventura.",
    magias: ["bola-de-fogo", "bafo-gelado", "cheiro-de-bolo"],
  },
  {
    id: "cacador",
    nome: "Cacador de Dragao",
    curto: "Cacador",
    bonus: "destreza",
    arma: "arco",
    habilidade: "Olho de Alvo",
    habilidadeTexto: "Voce ganha +1 no dado quando mira em alguma coisa longe.",
    magias: [],
  },
  {
    id: "amigo",
    nome: "Amigo dos Bichos",
    curto: "Amigo",
    bonus: "vitalidade",
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

/** Revisao de 2026-09-04: oito das treze ganharam nome e clima novos, "caso a
 *  caso" como o Hugo pediu - nao um reskin em bloco. O `id` de cada uma NAO
 *  mudou (evita quebrar heroi.magias salvo, CLASSES.magias, TABELA_DE_MAGIA
 *  em sistemas/acao.ts e MAGIAS_SOM em dados/sons.ts, que continuam
 *  referenciando o id antigo) - so o que o jogador LE mudou. As que ja
 *  soavam adultas (Voz de Trovao, Bafo Gelado, Bola de Fogo) ou ja eram so
 *  funcionais (Cresce-Grama, Remendo) ficaram como estavam. */
export const MAGIAS: Magia[] = [
  { id: "luzinha", nome: "Fogo-Fatuo", texto: "Uma luz fraca que ilumina o escuro e revela quem estava escondido.", cor: 0xf5b62b },
  { id: "bafo-gelado", nome: "Bafo Gelado", texto: "Um sopro que congela agua, fogo e ate goblin.", cor: 0x7ec4f2 },
  { id: "cresce-grama", nome: "Cresce-Grama", texto: "A vegetacao cresce na hora: vira escada, corda ou esconderijo.", cor: 0x3e9b62 },
  { id: "voz-de-trovao", nome: "Voz de Trovao", texto: "Um grito que ecoa longe o bastante pra fazer qualquer um parar.", cor: 0x4a3e64 },
  { id: "pulo-de-sapo", nome: "Salto Longo", texto: "Um impulso que atravessa rio, muro ou inimigo de um salto so.", cor: 0x3e9b62 },
  { id: "dedo-colante", nome: "Aderencia", texto: "As maos grudam em qualquer superficie por um instante - sobe parede, atravessa teto.", cor: 0xee7ba6 },
  { id: "remendo", nome: "Remendo", texto: "Conserta na hora o que quebrou.", cor: 0xb08658 },
  { id: "escudo-de-bolha", nome: "Barreira", texto: "Uma camada invisivel absorve o proximo golpe.", cor: 0x7ec4f2 },
  { id: "cheiro-de-bolo", nome: "Cheiro de Fogueira", texto: "Um cheiro de fumaca que atrai qualquer bicho de longe.", cor: 0xf5b62b },
  { id: "fala-bicho", nome: "Lingua Selvagem", texto: "Por um tempo, voce entende e e entendido por qualquer bicho.", cor: 0x3e9b62 },
  { id: "sumir-sumindo", nome: "Veu de Sombra", texto: "As sombras escondem voce, enquanto ficar parado.", cor: 0x4a3e64 },
  { id: "chama-vento", nome: "Rajada", texto: "Um vento forte empurra tudo pela frente - e alimenta o fogo que ja estava queimando.", cor: 0xcde9f8 },
  { id: "bola-de-fogo", nome: "Bola de Fogo", texto: "Uma bola de fogo que voa numa direcao. Goblin aguenta, gelo nao.", cor: 0xf2802b },
];

// ----------------------------------------------------------------- armas
export type Arma = { id: string; nome: string; preco: number; bonus: string; lendaria?: boolean };

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
];

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
  /** o que fica no chao quando ela e vencida */
  larga: string[];
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
    larga: ["moeda"], onde: ["floresta", "caverna"],
  },
  {
    id: "aranha", nome: "Aranha da Teia Doce", coracoes: 2,
    fraqueza: "comer a teia e escapar", fraquezaId: "comer-teia",
    texto: "A teia dela e doce de verdade. Da pra comer.",
    sprite: "aranha", porte: "pequeno", comportamento: "ronda",
    velocidade: 34, alcance: 14, dano: 1, esquivaChance: 0.2,
    telegrafo: "encolhe as oito pernas antes do bote",
    larga: ["teia-doce"], onde: ["floresta"],
  },
  {
    id: "espantalho", nome: "Espantalho Andarilho", coracoes: 2,
    fraqueza: "agua", fraquezaId: "agua",
    texto: "Anda sozinho pelo campo procurando o dono.",
    sprite: "espantalho", porte: "medio", comportamento: "ronda",
    velocidade: 28, alcance: 16, dano: 1, esquivaChance: 0,
    telegrafo: "gira os bracos como cata-vento",
    larga: ["palha", "moeda"], onde: ["campo", "vila"],
  },
  {
    id: "lobo-nevoa", nome: "Lobo de Nevoa", coracoes: 2,
    fraqueza: "luz forte", fraquezaId: "luz",
    texto: "Aparece e some no meio da neblina.",
    sprite: "lobo-nevoa", porte: "medio", comportamento: "espreita",
    velocidade: 78, alcance: 14, dano: 1, esquivaChance: 0.3,
    telegrafo: "a nevoa se junta num ponto antes de ele sair dela",
    larga: ["presa-de-nevoa"], onde: ["floresta"],
  },
  {
    id: "serpente", nome: "Serpente do Pantano", coracoes: 3,
    fraqueza: "cocegas embaixo do queixo", fraquezaId: "cocegas",
    texto: "Engoliu o Cristal do Meio-dia sem querer.",
    sprite: "serpente", porte: "grande", comportamento: "guarda",
    velocidade: 40, alcance: 20, dano: 1, esquivaChance: 0,
    telegrafo: "recolhe o pescoco em S e fica quieta demais",
    larga: ["cristal-meio-dia"], onde: ["pantano"],
  },
  {
    id: "grulo", nome: "Grulo, o Troll", coracoes: 4,
    fraqueza: "uma boa gargalhada", fraquezaId: "riso",
    texto: "Cobra pedagio na ponte. No fundo quer companhia.",
    sprite: "grulo", porte: "grande", comportamento: "guarda",
    velocidade: 30, alcance: 20, dano: 1, esquivaChance: 0,
    telegrafo: "bate o porrete no chao duas vezes",
    larga: ["pedagio"], onde: ["ponte"],
  },
  {
    id: "bruxa", nome: "Bruxa Espinho", coracoes: 3,
    fraqueza: "nao consegue mentir sobre o proprio nome", fraquezaId: "nome-proprio",
    texto: "Foi ela quem quebrou a Pedra do Sol.",
    sprite: "bruxa", porte: "medio", comportamento: "chefe",
    velocidade: 55, alcance: 60, dano: 1, esquivaChance: 0,
    telegrafo: "o espinho racha o chao antes de subir",
    larga: ["cristal-anoitecer"], onde: ["torre"],
  },
  {
    id: "cavaleiro-cinzas", nome: "Cavaleiro de Cinzas", coracoes: 5,
    fraqueza: "agua fria", fraquezaId: "agua-fria",
    texto: "Armadura vazia por dentro, cheia de cinza.",
    sprite: "cavaleiro-cinzas", porte: "grande", comportamento: "encara",
    velocidade: 36, alcance: 18, dano: 2, esquivaChance: 0,
    telegrafo: "a viseira acende por dentro",
    larga: ["cinza"], onde: ["torre", "pico"],
  },
  {
    id: "brasanegra", nome: "Brasanegra", coracoes: 10,
    fraqueza: "o nome verdadeiro, Aurel", fraquezaId: "nome-verdadeiro",
    texto: "O dragao guardiao, com o coracao cheio de cinzas.",
    sprite: "brasanegra", porte: "enorme", comportamento: "chefe",
    velocidade: 45, alcance: 90, dano: 2, esquivaChance: 0,
    telegrafo: "o peito acende de dentro para fora antes do sopro",
    larga: ["pedra-do-sol"], onde: ["pico"],
  },
];

// ------------------------------------------------------------- utilidades
export const acharRaca = (id: string) => RACAS.find((r) => r.id === id) ?? RACAS[2];
export const acharClasse = (id: string) => CLASSES.find((c) => c.id === id) ?? CLASSES[1];
export const acharMagia = (id: string) => MAGIAS.find((m) => m.id === id);
export const acharArma = (id: string) => ARMAS.find((a) => a.id === id);
export const acharItem = (id: string) => LOJA.find((i) => i.id === id);
export const acharCriatura = (id: string) => BESTIARIO.find((c) => c.id === id);

/** O nome legivel de qualquer id que possa acabar na mochila - comprado na
 *  LOJA ou largado por uma criatura (`BESTIARIO[].larga`, que nao tem catalogo
 *  de nome proprio ainda). Sem entrada na LOJA, formata o proprio id
 *  ("teia-doce" -> "Teia Doce") em vez de mostrar a chave crua: nunca um erro
 *  morto na tela, a mesma regra que ja vale pro dado. */
const PREPOSICOES_MINUSCULAS = new Set(["de", "do", "da", "dos", "das"]);
export function nomeDoItem(id: string): string {
  const item = acharItem(id);
  if (item) return item.nome;
  return id
    .split("-")
    .map((p, i) => (i > 0 && PREPOSICOES_MINUSCULAS.has(p) ? p : p[0]?.toUpperCase() + p.slice(1)))
    .join(" ");
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
