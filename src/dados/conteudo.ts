/** Todo o conteudo do RPG de mesa, portado para o jogo.
 *
 * Fonte da verdade: docs/referencia/sistema-do-rpg-de-mesa.md
 * Se algo aqui divergir do documento, o documento ganha, porque foi ele que a
 * crianca ja jogou na mesa.
 *
 * Este arquivo e SO DADO. Nenhuma logica, nenhum Phaser. Assim da para
 * adicionar uma raca ou uma magia sem abrir nenhuma cena.
 */

export type Atributo = "forca" | "esperteza" | "coracao";

export const ATRIBUTOS: Record<Atributo, { nome: string; icone: string }> = {
  forca: { nome: "FORCA", icone: "forca" },
  esperteza: { nome: "ESPERTEZA", icone: "esperteza" },
  coracao: { nome: "CORACAO", icone: "coracao_cheio" },
};

// ------------------------------------------------------------------ racas
export type Raca = {
  id: string;
  nome: string;
  bonus: Atributo;
  dom: string;
  domTexto: string;
  coracoes: number;
  cor: number;
};

export const RACAS: Raca[] = [
  {
    id: "vale",
    nome: "Gente do Vale",
    bonus: "coracao",
    dom: "Nunca Desisto",
    domTexto: "Uma vez por aventura voce pode rolar o dado de novo.",
    coracoes: 3,
    cor: 0x3e9b62,
  },
  {
    id: "anao",
    nome: "Anao da Fornalha",
    bonus: "forca",
    dom: "Casco Duro",
    domTexto: "Voce comeca com 4 coracoes em vez de 3.",
    coracoes: 4,
    cor: 0xf2802b,
  },
  {
    id: "elfo",
    nome: "Elfo da Folha",
    bonus: "esperteza",
    dom: "Olhos de Coruja",
    domTexto: "Voce enxerga no escuro e de bem longe.",
    coracoes: 3,
    cor: 0x3e9b62,
  },
  {
    id: "pequenino",
    nome: "Pequenino do Trigo",
    bonus: "coracao",
    dom: "Pe de Coelho",
    domTexto: "Uma vez por aventura voce troca um OPS por um QUASE.",
    coracoes: 3,
    cor: 0xf5b62b,
  },
  {
    id: "dragao",
    nome: "Cria de Dragao",
    bonus: "forca",
    dom: "Sopro Quentinho",
    domTexto: "Uma vez por aventura voce solta fogo pela boca.",
    coracoes: 3,
    cor: 0xe2483d,
  },
];

// ---------------------------------------------------------------- classes
export type Classe = {
  id: string;
  nome: string;
  bonus: Atributo;
  arma: string;
  habilidade: string;
  habilidadeTexto: string;
  magias: string[];
};

export const CLASSES: Classe[] = [
  {
    id: "cavaleiro",
    nome: "Cavaleiro",
    bonus: "forca",
    arma: "espada-curta",
    habilidade: "Golpe Trovao",
    habilidadeTexto: "Uma vez por luta voce acerta sem precisar rolar o dado.",
    magias: [],
  },
  {
    id: "mago",
    nome: "Mago da Torre",
    bonus: "esperteza",
    arma: "cajado",
    habilidade: "Tres Magias",
    habilidadeTexto: "Voce escolhe tres magias, cada uma com um uso por aventura.",
    magias: ["bola-de-fogo", "bafo-gelado", "cheiro-de-bolo"],
  },
  {
    id: "cacador",
    nome: "Cacador de Dragao",
    bonus: "esperteza",
    arma: "arco",
    habilidade: "Olho de Alvo",
    habilidadeTexto: "Voce ganha +1 no dado quando mira em alguma coisa longe.",
    magias: [],
  },
  {
    id: "amigo",
    nome: "Amigo dos Bichos",
    bonus: "coracao",
    arma: "funda",
    habilidade: "Fala com Bichos",
    habilidadeTexto: "Voce conversa com qualquer bicho, e eles ajudam se gostarem de voce.",
    magias: ["fala-bicho"],
  },
  {
    id: "ferreiro",
    nome: "Ferreiro Andarilho",
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
export type Criatura = {
  id: string;
  nome: string;
  coracoes: number;
  fraqueza: string;
  texto: string;
};

export const BESTIARIO: Criatura[] = [
  { id: "goblin", nome: "Goblin da Fumaca", coracoes: 1, fraqueza: "barulho alto de metal", texto: "Pequeno, verde, orelhudo. Foge mais do que briga." },
  { id: "grulo", nome: "Grulo, o Troll", coracoes: 4, fraqueza: "uma boa gargalhada", texto: "Cobra pedagio na ponte. No fundo quer companhia." },
  { id: "espantalho", nome: "Espantalho Andarilho", coracoes: 2, fraqueza: "agua", texto: "Anda sozinho pelo campo procurando o dono." },
  { id: "aranha", nome: "Aranha da Teia Doce", coracoes: 2, fraqueza: "comer a teia e escapar", texto: "A teia dela e doce de verdade. Da pra comer." },
  { id: "lobo-nevoa", nome: "Lobo de Nevoa", coracoes: 2, fraqueza: "luz forte", texto: "Aparece e some no meio da neblina." },
  { id: "serpente", nome: "Serpente do Pantano", coracoes: 3, fraqueza: "cocegas embaixo do queixo", texto: "Engoliu o Cristal do Meio-dia sem querer." },
  { id: "cavaleiro-cinzas", nome: "Cavaleiro de Cinzas", coracoes: 5, fraqueza: "agua fria", texto: "Armadura vazia por dentro, cheia de cinza." },
  { id: "bruxa", nome: "Bruxa Espinho", coracoes: 3, fraqueza: "nao consegue mentir sobre o proprio nome", texto: "Foi ela quem quebrou a Pedra do Sol." },
  { id: "brasanegra", nome: "Brasanegra", coracoes: 10, fraqueza: "o nome verdadeiro, Aurel", texto: "O dragao guardiao, com o coracao cheio de cinzas." },
];

// ------------------------------------------------------------- utilidades
export const acharRaca = (id: string) => RACAS.find((r) => r.id === id) ?? RACAS[2];
export const acharClasse = (id: string) => CLASSES.find((c) => c.id === id) ?? CLASSES[1];
export const acharMagia = (id: string) => MAGIAS.find((m) => m.id === id);
export const acharArma = (id: string) => ARMAS.find((a) => a.id === id);
export const acharItem = (id: string) => LOJA.find((i) => i.id === id);
export const acharCriatura = (id: string) => BESTIARIO.find((c) => c.id === id);
