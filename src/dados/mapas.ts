/** Mapas do jogo.
 *
 * O CHAO e desenhado em texto, um caractere por tile:
 *   .  grama       ,  flores       "  grama alta    -  terra
 *   p  caminho     ~  agua         P  pedra         a  areia
 *   c  chao de caverna              C  parede de caverna
 *   m  chao de madeira
 *   T  mata fechada  f  folhagem    t  trilha estreita
 *   =  barranco      s  agua rasa    g  grama de clareira de mata
 *
 * T e = sao SOLIDOS: o heroi nao entra. A mata nao tem uma arvore escrita em
 * lugar nenhum: `plantarMata()` le a letra T e planta o pinheiro por cima. Se
 * voce se pegar escrevendo a tricentesima linha de { nome: "pinheiro" }, pare.
 *
 * Tudo que fica EM CIMA do chao (casa, arvore, poco, cerca, npc) nao entra no
 * desenho: vai nas listas objetos e pessoas, em coordenada de tile. Isso permite
 * pecas maiores que um tile e deixa o desenho do chao limpo de ler.
 *
 * Objeto e ancorado pelo PE: a base encosta na linha de baixo do tile indicado.
 */
import { T } from "./config";
import type { Periodo } from "./tempo";

const LETRA_TILE: Record<string, number[]> = {
  ".": [T.grama, T.grama2, T.grama3],
  ",": [T.flores],
  '"': [T.gramaAlta],
  "-": [T.terra],
  p: [T.caminho],
  "~": [T.agua, T.agua2],
  P: [T.pedra],
  a: [T.areia, T.areia2, T.areia3],
  c: [T.chaoCaverna],
  C: [T.paredeCaverna],
  m: [T.madeiraChao],
  T: [T.mata],
  f: [T.folhagem],
  t: [T.trilha],
  "=": [T.barranco],
  s: [T.aguaRasa],
  g: [T.gramaMata],
  // detalhe raro: o autor planta a mao, letra por letra, nunca escondido
  // dentro do "." comum (ver arte/tiles.py)
  "'": [T.gramaPequena],
  _: [T.gramaFalha],
  "*": [T.gramaOrvalho],
  r: [T.areiaPedra],
  d: [T.areiaMancha],
  k: [T.areiaPegada],
  // interior: parede da Casa de Cura (ver arte/tiles.py)
  W: [T.paredeInterior],
};

export type Peca = { nome: string; x: number; y: number; solido?: boolean };

/** Onde uma pessoa fica em cada periodo do dia (ver dados/tempo.ts).
 *  "escondido" e pra quem passa o periodo dentro de casa, fora de cena: hoje
 *  so as criancas, que somem a noite em vez de ganhar uma cama pra andar ate. */
export type RotinaDeNpc = Record<Periodo, { x: number; y: number } | "escondido">;

/** `rotina` e opcional: sem ela a pessoa fica sempre no `x,y` de baixo, igual
 *  sempre foi. Com ela, `x,y` continua sendo onde a pessoa NASCE na cena (por
 *  isso os dois costumam bater com o periodo em que o save comeca). */
export type Pessoa = { quem: string; sprite: string; x: number; y: number; rotina?: RotinaDeNpc };

/** Uma criatura POSTA no mapa. So diz quem e e onde fica: o que ela FAZ vem do
 *  comportamento da ficha em conteudo.ts, e quem executa isso e o sistema de
 *  combate. Aqui e so presenca, para o bicho existir no mundo antes de saber
 *  brigar. */
export type Bicho = { id: string; x: number; y: number };

/** Uma borda que leva a outro mapa. Encostar nela troca de lugar.
 *  A area e em tile, e `entrada` e onde o heroi aparece do outro lado. */
export type Saida = {
  x: number; y: number; w: number; h: number;
  para: string;
  entrada: { x: number; y: number };
};

export type Mapa = {
  chao: string[];
  objetos: Peca[];
  pessoas: Pessoa[];
  entrada: { x: number; y: number };
  criaturas?: Bicho[];
  /** nome do lugar como aparece no save */
  lugar: string;
  saidas?: Saida[];
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
    "\"..~~~~~...........................\"",
    "\".~~~~~~~~~...,....................\"",
    "\".~~~~~~~~~........................\"",
    "\".~~~~~~~..........................\"",
    "\"..aaaaaaa.........................\"",
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
    { nome: "hospital", x: 29, y: 21 },
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
  // As rotinas colocam cada um perto da propria casa (ver `objetos` acima) de
  // madrugada e de noite, e no lugar de sempre de dia. O guarda fica no posto
  // o dia inteiro — vigia nao larga a trilha por causa da hora — e o pescador
  // troca o rio pela fogueira da praca a noite, o mesmo fogo que o dialogo da
  // fogueira ja descreve como "alguem que passou a noite acordado aqui".
  pessoas: [
    {
      quem: "vovo", sprite: "vovo", x: 4, y: 8,
      rotina: { madrugada: { x: 3, y: 6 }, manha: { x: 4, y: 8 }, tarde: { x: 4, y: 8 }, noite: { x: 3, y: 6 } },
    },
    {
      quem: "ferreiro", sprite: "ferreiro", x: 22, y: 8,
      rotina: { madrugada: { x: 22, y: 6 }, manha: { x: 22, y: 8 }, tarde: { x: 22, y: 8 }, noite: { x: 22, y: 6 } },
    },
    {
      quem: "menina", sprite: "menina", x: 9, y: 14,
      rotina: { madrugada: "escondido", manha: { x: 9, y: 14 }, tarde: { x: 9, y: 14 }, noite: "escondido" },
    },
    {
      quem: "pescador", sprite: "pescador", x: 6, y: 19,
      rotina: { madrugada: { x: 16, y: 11 }, manha: { x: 6, y: 19 }, tarde: { x: 6, y: 19 }, noite: { x: 16, y: 11 } },
    },
    {
      quem: "mercador", sprite: "mercador", x: 19, y: 10,
      rotina: { madrugada: { x: 15, y: 6 }, manha: { x: 19, y: 10 }, tarde: { x: 19, y: 10 }, noite: { x: 15, y: 6 } },
    },
    {
      quem: "menino", sprite: "menino", x: 25, y: 13,
      rotina: { madrugada: "escondido", manha: { x: 25, y: 13 }, tarde: { x: 25, y: 13 }, noite: "escondido" },
    },
    {
      quem: "padeira", sprite: "padeira", x: 11, y: 8,
      rotina: { madrugada: { x: 10, y: 6 }, manha: { x: 11, y: 8 }, tarde: { x: 11, y: 8 }, noite: { x: 10, y: 6 } },
    },
    {
      quem: "guarda", sprite: "guarda", x: 29, y: 11,
      rotina: { madrugada: { x: 30, y: 11 }, manha: { x: 29, y: 11 }, tarde: { x: 29, y: 11 }, noite: { x: 29, y: 11 } },
    },
  ],
  entrada: { x: 15, y: 13 },
  lugar: "Vila Semente",
  // "A trilha do leste vai pra Floresta dos Sussurros", diz a placa da vila
  saidas: [
    { x: 35, y: 11, w: 1, h: 2, para: "floresta", entrada: { x: 3, y: 42 } },
  ],
};

/** Onde o heroi acorda depois de uma derrota (Fase 13,
 *  docs/plano-de-implementacao.md - CLAUDE.md, "Divergencia deliberada").
 *  Um tile a frente da porta do predio "hospital" (ver VILA.objetos), que e
 *  ancorado pelo pe em (29, 21) - a mesma conta de qualquer Saida.entrada. */
export const HOSPITAL_ENTRADA = { x: 29, y: 22 };

/** A Floresta dos Sussurros, 120 x 84 tiles.
 *
 *  O desenho saiu de `node ferramentas/esbocar-floresta.mjs`, que amplia o
 *  esboco de blocos de docs/10-mapa-da-floresta.md e prova que da para andar de
 *  ponta a ponta. Rode de novo se a FORMA do mapa mudar; para mexer num canto,
 *  edite aqui mesmo: quem manda e este texto.
 *
 *  Aqui so estao os marcos, o que alguem decidiu a dedo. A mata e o enfeite de
 *  chao sao plantados por `plantarMata()`. */
export const FLORESTA: Mapa = {
  chao: [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTfTT\"TTTfTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTfTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTffffTfffTffTfTTTfTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTfTTfffTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTffffffffffffffffTTffTfTfTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTgTTTTTT",
    "TTTTTTffff\"ffTTTTTTTTTTTTTTTTTTTTTTTffTffTTTTTTfTTfTTfff\"ffffffffffffffffTfTTTffTTffffTfTTTTTTTTTTTTTTTTTTTTTTTgTgTTTTTT",
    "TTTTTfTfffffffff\"TfTTTTTTTTTTfTffffffffTfTTTTfTfffTfff\"ffffffffgf\"fff\"ffffffTfTTf\"fTfffffTfTTTTTTTTTTTTTTTTTTTTTg,TTTTTT",
    "TTTTTTTf\"f,\"fffffffffTTTffTfTfTTffffffffffT\"\"Tfff\"fffffffggfffggffgfgffgfff\"\"fffffffffffffffffTffTgggTgg\"TTggTgggTTTTTTT",
    "TTTTTfTff,fgfffffffTTffTfffffffffffffffffffffffffffffffffgf,gg,gggggggggffggfffff\"ffffffffffff\"\"ffTTgg\"TgTTgggggggTTTTTT",
    "TTTTTTfffffgfg,gff\"ff\"fffffffffffffffffffff\"ffffffffffffffgggggggg,gg,gg\"ggffffg\"ffffgf\"fgfff\"fffgfg,ggggggggggg\"ggTTTTT",
    "TTTTTfffffgggfgfgf\"fffffff\"fffffffff\"fffffffffffffffffffffggggggggggggggggggfgfgggggfgffgff\"fffff,fggggg\"\"gggggggggTTTTT",
    "TTTTTTTfffffggggffgffgggffgf\"fffffffffffff\"fffffffffffffffgfgggggggggggg\",ggggg,gggggg,gggg\"ffffff\"fg,gggg\"ggggggggTTTTT",
    "TTTTTTTffffgggg,ggggggfgfgggffffffffffffffffffffffffffffffg\"gggg,,gggg\"g\"gggggggggggggg\"ggfffffffffg\"\"\"gg,gggggg\"gggTTTT",
    "TTTTTTTTfffffggg\"gg,gggggggf\"ffffffffffffffffffffffffffffffgggggg,gg,ggggggggggggggggg\"g,,ggffffffffgggg,gg\"ggggg\"\"gTTTT",
    "TTTTTTTffffgf,ggggg\"g\"ggggggffffffffffffffffffff\"ffff\"fff\"ffggggggggggg,\"gg,ggggggggggggggg\"fffffffggg\"g,g\"gggggggggTTTT",
    "TTTTTTTTfff\"fgggggg,gggggggggffffff\"fffffffffffffff\"ffffffffffggg,gggggggggggg\"ggggg,,ggggggfffff\"fff\",gggg,g\"g,,g\"gTgTT",
    "TTTTTTTTfTfff,ggg,\"gg\"ggggggfg\"ffffffffffffffffffffffffffffffg,ggggg,ggg\"g,gggggg,gggggggggggffffffffgggggggggggggTT\"TTT",
    "TTTTTTTTTTfffgggg,ggg\"ggg,gg,fffffffffffffffffffffffffffffffgfgggggggggggggggggg,,gg,gggggggfffffffffgggggggggf\"gTgTTTTT",
    "TTTTTTTTT\"ffffggggggggggggggggfffff\"ffffffffffffffffffffffffffgggg,\"ggg,gggggggggg,ggggggggggfgffff\"fffggggffffggTTTTTTT",
    "TTTTTTTTTfTffffggg,,gggggg\"gggffffffffffffffffffffffffffftttttttttttg,ggg\"g,gggggggggggggggggffff\"fffffggggfgff\"ffTTTTTT",
    "TTTTTTTTTTfffgfggg,ggggggg,g,gffffffffffffffff\"fffffffttttttttttttttttttgggg\",ggggggg\"ggggg,ggfffff\"ffgfgfffffffffTfTTTT",
    "TTTTTTTTTTffffgggggggggggggggfg\"fffffffffff\"ffffffftttttttttttttttttttttttttgggggggggtg,ggggggffffffffffffffffffftf\"TfTT",
    "TTTTTTTTTfTfffffffggggggggggggffftttttttttfffffttttttttttttttttttttttttttttttttttttttttttttttffffffff\"ffffffffttttf\"ffTT",
    "TTT===TTTTTf\"ffffftgggg,ggg,ttttttttttttttttttttttttttttt===========ttttttttttttttttttttttttttttffff\"fffffftttttttfffffT",
    "TT=========ffffffftttttttttttttttttttttttttttttttttttt================ttttttttttttttttttttttttttttttttttttttttttttfff=TT",
    "TT===========fff\"fttttttttttttttttttttttttttttttttt===================tttt==ttttttttt=ttttttttttttttttttttttttttt=====TT",
    "TT==============ffttttttttttttttt=========ttttt=======================tttt================tttttttttttttttttttt========TT",
    "TT=TTT============tttttttttt==============tttt===========fffffffffff==tttt================tttt==tttttttttttttt========TT",
    "TTTTTTTTfff======tttt====================tttt=========fffffffffffffffffft================tttt============tttt========TTT",
    "TTTTTTTTfTfff====tttt====================tttt======ff\"ff\"fffffffffffffffffff=========f===tttt============tttt====TTTTTTT",
    "TTTTTTTTTfffffff=tttt============fffffffffttt==fffffffffffffffffffffffffffffffffffffffff\"ffff============tttt=fffTTTTTTT",
    "TTT~~~TTTTTffffffffttt======fffffffffffffffffffffffffffff~~~~~~~~~~~fffff\"ffffffffffff\"fff\"fffff==========tf\"f\"f\"\"TTTTTT",
    "TT~~~~~~~~~fffffffffffffffffffffffffff\"ffffffffffffff\"~~~~~~~~~~~~~~~~~~fffffffffffffffffffffffffffffffffffffffffffTT~~~",
    "TT~~~~~~~~~~~fff\"fff\"ffffffffffffffffffffffffffffff~~~~~~~~~~~~~~~~~~~~~~~~~fffffffff~ffffffffffffffffffffffff\"ff~~~~~~~",
    "TT~~~~~~~~~~~~~~f\"fffffffffffffff~~~~~~~~~fffff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~mmmffffffffffffff\"ff~~~~~~~~~~",
    "TT~TTT~~~~~~~~~~~~~fffff\"fff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ggggggggggg~~~~~~~~~~~~~~~~~~~~~~mmmm~~fffffffffff~~~~~~~~~~~~~",
    "TTTTTTTTTTT~~~~~~~~~~~mmmm~~~~~~~~~~~~~~~~~~~~~~~~~~~~,g\"ggggggggggggggg~~~~~~~~~~~~~~~~~~mmmm~~~~~~~~~~~~~~~~~~~~~~~TTT",
    "TTTTTTTTTffff~~~~~~~~~mmmm~~~~~~~~~~~~~~~~~~~~~~~~~ggggg\"ggggggggggggggggfff~~~~~~~~~f~~~~mmmm~~~~~~~~~~~~~~~~~~~fTTTTTT",
    "TTTTTTTTTTTff\"ff~~~~~~~mmmm~~~~~~f\"fffffff~~~~~ffff\"ggg,\"gggggggggggggggggggffffffffffgggggggmm~~~~~~~~~~~~~~~fffffTTTTT",
    "TTTtttTTTTfffffffff~~~~mmmm~ffffffffffffffffff\"ffffgggggggg\"gggggggg,ggggggffffffffffffggggg\"ggg~~~~~~~~~~~\"g,gfffffTTTT",
    "TTTttttttttffffffffffffttttfffffffffffffffffffff\"fggggggggggggggggggggggggfgff\"fffffff\"ggggggggggggggg\"gg\"\"gggfffff\"Tttt",
    "TTTttttttttttff\"fffffffttttfffffffffffff\"ffffffffffgggggggggg,gggggggggggggffffffffffffgggggggggggggggggg\",gggfffttttttt",
    "ttttttttttttttfffgffffttttfffffffffffffffffff\"ffffggggggggg,gggggggggg\"\"gg,ffffffffffffgggggggggg,g,ggggg\"ggggtttttttttt",
    "ttttttttttttttg,fg\"\"ggttttffffffffffffffffffffffffggggggg\"gg,gggggggggggggffffffffffffgggggggggggg,ggggggg,gggtttttttttt",
    "tttttttTTTftttgggg,ggfttttfffffffffffffff\"fffffffggggggg,gg\"gggggggggggggffffffffffffg,gggggggggggggggggggg,g,tttttttttt",
    "TTTTTTTTTffffggggggggttttffffffffffffffff\"ffffffgg\"ggggggggggggg\"g,ggggggtttff\"ffffffgg,gggggg\"ggggggggg,ggggttttTTTTTTT",
    "TTTTTTTTffffffgggggggttttf\"ffff\"\"ffffffffffffffffgg,gggggggg,ggggg\"gggg\"gttttttttttttgg,gggg\"gggggggggggggg\"gtffffTTTTTT",
    "TTTTTTTffffgggggggggttttffffffffffffffffffffffffggggggg\"ggggggggggggggg\"ttttttttttttggg,gggggggggggggggggggggfffTTTTTTTT",
    "TTTTTTTTTffffgggggggttttfffffffffffffffffffffffgggg\"gggggggggg\"gg\"gg\"\"ggttttttttttttgggggggggg\"g,gggggggggggfffffTTTTTTT",
    "TTTTTTTTffffgfffg\"ggttttf\"ffffffff\"ffffffffffff\"fgggggggggg\",g,\"g\"gggggfgfffttttttttggg\"ggggggggggggggggggggfffTTTTTTTTT",
    "TTTTTTfffffff,ffgggttttfffffffffffff\"\"ffffffffff,gggggggggg,\"fggffgfggggffffffffffffgggggggggg\"gg,gggggggg\"gffTTTTTTTTTT",
    "TTTTTTTfffffffff\"fgttttfffffffffff\"fffffffffffgfg,gg\"ggfggfg\"gfgggggffgffffffffffffggggg\"ggggggggggggggg\"gggffffTTTTTTTT",
    "TTTTTTffffffffffffttttffffffffffff\"ffffff\"ff\"ffggggfgggfffffffff\"fffggffff\"ffffff,fggggg\"ggggggg,ggggg,gg,,ffffTTTTTTTTT",
    "TTTTTTfff\"ffffffffttttfffffffffff\"ffffffff\"fff,g\"fgffgffffffffffffffffffff\"f\"ffgggfggggggggggggggggggggggfffffTTTTTTTTTT",
    "TTTTTffffff\"fff\"ffttttffffffffff\"fffffffffffffgggffffffffffffffffffffffffffffgfffgggggggggggggggggggggggg\",\"ffTTTTTTTTTT",
    "TTTTTTffffffffffffttttff\"fffffffff\"fffffffffffgfffffffffff\"fffffffffffffffffff\"gg,gggggggggggg,ggggggggfgfgfffTTTTTTTTTT",
    "TTTTTf\"fffffffffffttttffffffffff\"fffffffffffffffffffffffffffffffffff\"fffffffffggggggggggg\"gggggggggggg\"ff\"ffff\"TTTTTTTTT",
    "TTTTTfffffffffff\"fttttfffff\"\"ffffffffffffff\"fffffffffffffffffffffffff\"ffffffffggggg,gggggggggg,gggggggff\"ffffffTTTTTTTTT",
    "TTTTTTffff\"fffffffttttf\"\"ffffff\"fffffffffffffffffff\"fffffffffffffffffffffffffgf\",ggggggggg,ggggggggggggf\"f\"f\"TTTTTTTTTTT",
    "TTTTTTTfffffffffffttttffffffffffffffffffffffffffffffffffffffffffffffffffffffff,g,ggg,g\"gggggggggggggffgf\"ffffffTTTTTTTTT",
    "TTTTTTTffffffffffffttttf\"fffffffffff\"ff\"fffffffffffffffffffffffffffff\"fffffffffgggggggggggggg,gggg,fgfffffffffffTTTTTTTT",
    "TTTTTTTTfffggggffffttttfffffffffffffffffffffffffffffffffffffffffffffff\"fffffff\"fggggggggggggg\"ggggfffffffffffffTTTTTTTTT",
    "TTTTTTTT\"fgggf,g\"g,ttttfff\"fffggggggggg\"fffff\"ffffffffffffffffffffffffffffffffffgg,gggg\"ggggggg\"ggggfffffff\"fffTTTTTTTTT",
    "TTTTTTfffffg,gggggfttttfffggfggfggggg,g\"fffffffffffffff\"ffffffffffffffff\"ffff\"fgggg,gggg,ggggggg\"ggggffgff\"fffffTTTTTTTT",
    "TTTTTTTTfffgfgggg\"g,ggggggffggg\"gggggggfgfffffffffffffffffffffffff\"ffffffffffffffggggggggggggggggggfggggfffffffffTTTTTTT",
    "TTTTTTTTfffgg,gggggggggggggggggggggggggfgffffffffffffffffffffffffffffffff\"ffggffgggggggggg\"gggggggggggggffffffffTTTTTTTT",
    "TTTTTTTTf\"fgfgggggggg\"ggg,gg,gggg,gggg\",fff\"ffffffffffffffffffffff\"ffffffffffgggggggggggg,gggggggggggggffffffffffTTTTTTT",
    "TTTTttTTfffffggggggg,ggggggg\"g,gggggg,\"gg\"ffffffffffffffffffffffffffffffffffggg,ggggg,ggggggg\"gggggggggf\"ffffffTTTTTTTTT",
    "TTTTtttttttffgggggggggggggg\"gggggggggggggfffffffffffffffffffffffffffffffffffgggggggggggggggggg\"ggggggg\"ggfffffffTTTTTTTT",
    "TTTTtttttttttggggggggg,,gggggggggg\"gggggfffffffffffffffffffffffffffffffffffgfg,gggggg,gg\"ggggg,ggggggggffffffffffTTTTTTT",
    "TTTTttttttttttttg,ggggggggggggg\"ggggg,\"f\"ffffffff\"ff\"ffffffffffff\"fffffffffffggggggggggggggggggg,gg,gggfgfffffffTTTTTTTT",
    "TTTTTTttttttttttggggggggggggggg\"gggggggggfffffffffffffffftttttttttttffffffffgggggggggggggggggggggggggggf\"ff\"\"ffffTTTTTTT",
    "TTTTTTTfffftttttggggggg,ggggggggg,ggggg\"ffffffffffffffttttttttttttttttttfffffgggg\"ggggggggggggggggggg,gggffffffTTTTTTTTT",
    "TTTTTTTTf\"fg,tttgggggggg,gggggggg\"gg\"gg,ffffffff\"fftttttttttttttttttttttttttgggg,ggggggggggg\"gggg,gggggggffff\"fffTTTTTTT",
    "TTTTTTTTf\"fggggggggg,ggggggggg,gggggttttttffffftttttttttttttttttttttttttttttttttgggggggggggggggggggggggggffffffffTTTTTTT",
    "TTTTTTTTffffg\"ggggggggggg\"gggg\"\"ggggtttttttttttttttttttttfffffffffffttttttttttttggggggg\"ggggggggg,gggggggf\"fffffTTTTTTTT",
    "TTTTTTTfTffffgggg,g\"ggggggggg,ggggggttttttttttttttttttffffffff\"fffffff\"fttttttttggggggggg\"gggggggggggggggfffffffTTTTTTTT",
    "TTTTTTTTffffgg\"gggggg,ggg\"ggggggggfgtttttttttttttttfffffffffff\"fffffffffffffttttgg\"fgggggffgggggggggggggffff\"ffTTTTTTTTT",
    "TTTTTTTffffffggg,ggggggggggggffggfgg\"\"fffftttttffffff\"fffTfffTff\"TTffffffffffffffggfff,,ffgfg\"gggg,gggg\"fffffffffTTTTTTT",
    "TTTTTTTTTTffffffggggfggggfgf,ffggffffffffffffffff\"ffffTTfTTTTfTTTTffTTfTfffffffff\"fffffffffffffg,fgggfgggfffffffTfTTTTTT",
    "TTTTTTTTTTfffffff\"fgfffg,fggffffffffffffffffffffffffffffTTTTTTTTTTTTfTfTTffffffffffffffffffffffffgffg\"ffffffffffTTTTTTTT",
    "TTTTTTTTTTTTTffTffffffffffffffffffffffTTfffffffTfTfTfTTTTTTTTTTTTTTTTTTTTTfffTTffTTfTTfTTTfTffffffffffffffffffTfTfTTTTTT",
    "TTTTTTTTTTTTTffTTffffffffffffTTTTTTTfTTfTT\"ffffTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTfT\"fTffTfTTfffffffffffffff\"TTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTfffffffffffTTTfTTTTTTTTTTTffTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTfTffTffTffTffTTfTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  ],
  objetos: [
    { nome: "grande-ouvinte", x: 58, y: 42 },
    { nome: "arvore-raio", x: 18, y: 14 },
    { nome: "tronco-caido", x: 22, y: 34, solido: false },
    { nome: "raizes", x: 70, y: 27 },
    { nome: "placa", x: 7, y: 46 },
    { nome: "bau", x: 90, y: 62 },
    { nome: "fogueira", x: 23, y: 67 },
    { nome: "fogueira", x: 59, y: 43 },
    { nome: "fogueira", x: 95, y: 43 },
    { nome: "fogueira", x: 75, y: 15 },
    { nome: "toco", x: 18, y: 42 },
    { nome: "pedra-musgo", x: 21, y: 43 },
    { nome: "cerca", x: 16, y: 44 },
    { nome: "teia", x: 92, y: 41, solido: false },
    { nome: "teia", x: 96, y: 42, solido: false },
    { nome: "teia", x: 94, y: 44, solido: false },
    { nome: "teia", x: 97, y: 40, solido: false },
    { nome: "teia", x: 89, y: 32, solido: false },
    { nome: "teia", x: 91, y: 33, solido: false },
    { nome: "cogumelo-azul", x: 19, y: 67, solido: false },
    { nome: "cogumelo-azul", x: 24, y: 68, solido: false },
    { nome: "cogumelo-azul", x: 26, y: 65, solido: false },
    { nome: "cogumelo-azul", x: 21, y: 69, solido: false },
  ],
  pessoas: [],
  // Quem mora aqui sai do campo `onde` do BESTIARIO: aranha e goblin na
  // floresta, e o Lobo de Nevoa, que so existe neste mapa. Posicoes escolhidas
  // pelos lugares do plano: a Teia Doce a leste, o riacho no meio, o planalto
  // ao norte, onde ficam as sentinelas.
  //
  // POPULACAO ENGROSSADA A PEDIDO DO HUGO (2026-09-05), so pra ter combate
  // sobrando pra testar -- nada de lugar novo no mapa, so mais goblin/aranha/
  // lobo-nevoa (os tres que brigam de verdade hoje) espalhados pelo campo
  // aberto ao sul, que nao tinha nenhum. Decisao mais simples possivel: sem
  // criatura nova, sem posicionamento fino, so quantidade.
  criaturas: [
    { id: "aranha", x: 92, y: 40 },
    { id: "aranha", x: 97, y: 44 },
    { id: "aranha", x: 95, y: 38 },
    { id: "lobo-nevoa", x: 40, y: 30 },
    { id: "lobo-nevoa", x: 66, y: 29 },
    { id: "goblin", x: 72, y: 14 },
    { id: "goblin", x: 78, y: 16 },
    { id: "goblin", x: 104, y: 12 },
    { id: "goblin", x: 30, y: 10 },
    { id: "aranha", x: 50, y: 11 },
    { id: "lobo-nevoa", x: 85, y: 13 },
    { id: "goblin", x: 60, y: 17 },
    { id: "aranha", x: 90, y: 18 },
    { id: "lobo-nevoa", x: 35, y: 20 },
    { id: "goblin", x: 75, y: 21 },
    { id: "aranha", x: 45, y: 15 },
    { id: "goblin", x: 20, y: 50 },
    { id: "aranha", x: 40, y: 52 },
    { id: "lobo-nevoa", x: 60, y: 55 },
    { id: "goblin", x: 80, y: 58 },
    { id: "aranha", x: 25, y: 60 },
    { id: "lobo-nevoa", x: 50, y: 62 },
    { id: "goblin", x: 70, y: 65 },
    { id: "aranha", x: 90, y: 68 },
    { id: "lobo-nevoa", x: 30, y: 70 },
    { id: "goblin", x: 55, y: 72 },
    { id: "aranha", x: 75, y: 75 },
    { id: "lobo-nevoa", x: 95, y: 77 },
    { id: "goblin", x: 20, y: 80 },
    { id: "aranha", x: 45, y: 82 },
  ],
  entrada: { x: 3, y: 42 },
  lugar: "Floresta dos Sussurros",
  // Oeste e leste, na latitude do meio, como manda o mapa do reino em
  // docs/referencia (4-mapa-do-reino.pdf): a Vila Semente fica a OESTE da
  // floresta e a Ponte dos Trolls a LESTE, com o rio descendo do Pico Cinzalta
  // e correndo para o mar. A travessia da floresta e oeste -> leste.
  saidas: [
    { x: 0, y: 40, w: 1, h: 5, para: "vila", entrada: { x: 34, y: 12 } },
    // A borda LESTE, em (119, 40..44), e a boca da Ponte dos Trolls. Fica sem
    // saida declarada ate a ponte existir: borda que leva a lugar nenhum some
    // calada, e calado e o pior jeito de um caminho falhar.
    // Ver docs/05-roadmap.md, Fase 3.
  ],
};

/** Todo mapa do jogo, pela chave que fica em `estado().cena`. */
export const MAPAS: Record<string, Mapa> = {
  vila: VILA,
  floresta: FLORESTA,
};

export type ChaoPronto = number[][];

/** Converte o desenho em texto na matriz de indices de tile. */
export function montarChao(desenho: string[]): ChaoPronto {
  return desenho.map((linha, y) =>
    [...linha].map((ch, x) => {
      const opcoes = LETRA_TILE[ch] ?? LETRA_TILE["."];
      // variacao estavel: a mesma posicao sempre recebe o mesmo tile.
      // Aumentar o bloco do hash (tentado antes) so troca xadrez miudo por
      // xadrez grande -- a borda entre uma opcao e outra continua reta e
      // geometrica de qualquer jeito, porque e uma troca de TILE inteiro.
      // Regiao de tom de verdade (borda organica, tipo a beira ou a
      // clareira) exige uma peca propria desenhada para isso, nao um hash
      // de posicao escolhendo entre tiles prontos -- ver arte/tiles.py.
      return opcoes[(x * 7 + y * 13) % opcoes.length];
    })
  );
}

/** Todo tile que conta como GRAMA para fins de beira: e ele que "avanca"
 *  sobre o vizinho, nunca o contrario. */
const GRAMAS = new Set<number>([
  T.grama, T.grama2, T.grama3, T.flores, T.gramaAlta, T.gramaMata,
  T.gramaPequena, T.gramaFalha, T.gramaOrvalho,
]);

const BEIRA_POR_LADOS: Record<string, number> = {
  n: T.beiraN, s: T.beiraS, o: T.beiraO, l: T.beiraL,
  no: T.beiraNO, nl: T.beiraNL, so: T.beiraSO, sl: T.beiraSL,
};

/** A mesma beira, com o bojo pequeno: para quando o chao medido no lugar e
 *  estreito demais para o bojo grande caber sem virar bolha. */
const BEIRA_FINA_POR_LADOS: Record<string, number> = {
  n: T.beiraNFina, s: T.beiraSFina, o: T.beiraOFina, l: T.beiraLFina,
  no: T.beiraNOFina, nl: T.beiraNLFina, so: T.beiraSOFina, sl: T.beiraSLFina,
};

/** Chao mais estreito que isso (em tiles) usa o bojo pequeno. Um bojo grande
 *  chega a meio tile de fundo; num corredor de 3 tiles ou menos, dois bojos
 *  vindo de lados opostos quase se tocam e o corredor lê como uma bolha, nao
 *  como uma borda. */
const LARGURA_ESTREITA = 3;

/** As 15 combinacoes possiveis de vizinho-com-grama, reduzidas as 8 beiras
 *  que existem desenhadas (arte/tiles.py). Grama nos quatro lados, em lados
 *  opostos, ou em tres lados e rara no jeito como o chao e desenhado a mao;
 *  quando acontece, cai na aproximacao de um lado so, a que mais aparece. */
const APROXIMA: Record<string, string> = {
  n: "n", s: "s", o: "o", l: "l",
  no: "no", nl: "nl", so: "so", sl: "sl",
  ns: "n", ol: "o", nso: "no", nsl: "nl", nol: "n", sol: "s", nsol: "n",
};

/** Onde a grama avanca sobre o vizinho: uma segunda camada, quase toda vazia
 *  (-1, que o Phaser nao desenha), com a beira certa em cada celula que NAO e
 *  grama mas tem grama do lado.
 *
 *  A escolha e por TILE, nao por letra do desenho: `montarChao` ja decidiu
 *  entre grama/grama2/grama3 pela posicao, e e esse resultado que decide se a
 *  celula "e grama" para a beira. Ler a letra de novo aqui duplicaria a conta
 *  e podia divergir dela.
 *
 *  So GRAMA planta beira, e sempre em cima de quem nao e grama: e a grama que
 *  cresce sobre a terra, nao a terra que invade a grama. Por isso um unico
 *  conjunto de 8 desenhos serve para grama-contra-qualquer-coisa — a beira
 *  nao sabe nem precisa saber o que tem debaixo dela. */
export function bordasDeGrama(chao: ChaoPronto): ChaoPronto {
  const ehGrama = (x: number, y: number) => GRAMAS.has(chao[y]?.[x] ?? -1);
  // conta quantos tiles seguidos sem grama existem a partir de (x, y), andando
  // em (dx, dy), incluindo o proprio (x, y). Usado nos dois sentidos de um
  // eixo para medir a largura de verdade do chao naquele ponto -- e essa
  // largura, nao o tipo do tile, que decide o tamanho do bojo.
  const alcance = (x: number, y: number, dx: number, dy: number) => {
    let n = 0;
    let cx = x;
    let cy = y;
    while (chao[cy]?.[cx] !== undefined && !ehGrama(cx, cy)) {
      n++;
      cx += dx;
      cy += dy;
    }
    return n;
  };
  return chao.map((linha, y) =>
    linha.map((_tile, x) => {
      if (ehGrama(x, y)) return -1;
      let chave = "";
      if (ehGrama(x, y - 1)) chave += "n";
      if (ehGrama(x, y + 1)) chave += "s";
      if (ehGrama(x - 1, y)) chave += "o";
      if (ehGrama(x + 1, y)) chave += "l";
      const usar = APROXIMA[chave];
      if (!usar) return -1;
      // largura medida no eixo em que a grama empurra: vertical quando vem de
      // cima/baixo, horizontal quando vem dos lados. Lado com grama dos dois
      // lados (corredor estreito, "no") mede os dois eixos e fica com o menor.
      let largura = Infinity;
      if (usar.includes("n") || usar.includes("s")) {
        largura = Math.min(largura, alcance(x, y, 0, -1) + alcance(x, y, 0, 1) - 1);
      }
      if (usar.includes("o") || usar.includes("l")) {
        largura = Math.min(largura, alcance(x, y, -1, 0) + alcance(x, y, 1, 0) - 1);
      }
      const mapa = largura <= LARGURA_ESTREITA ? BEIRA_FINA_POR_LADOS : BEIRA_POR_LADOS;
      return mapa[usar];
    })
  );
}


/** Planta a mata e o enfeite de chao a partir do desenho.
 *
 *  Esta funcao existe para que nenhuma arvore precise ser escrita a mao. A
 *  Floresta dos Sussurros tem umas oitocentas: como lista de dados, elas
 *  apodreceriam na primeira mexida no desenho do chao, e ninguem ia notar.
 *
 *  A escolha e ESTAVEL: a mesma posicao sempre da o mesmo pinheiro. Se fosse
 *  sorteada de verdade, a floresta mudaria a cada vez que o jogador entrasse
 *  nela, e um lugar que muda nao vira lugar conhecido.
 *
 *  A colisao NAO vem daqui: a letra T ja e um tile solido. Por isso tudo que
 *  esta funcao planta sai com `solido: false`, inclusive a arvore. */
export function plantarMata(desenho: string[], jaOcupado: Peca[] = []): Peca[] {
  const ocupado = new Set(jaOcupado.map((p) => `${p.x},${p.y}`));
  const letra = (x: number, y: number) => desenho[y]?.[x] ?? "T";
  // conta estavel, a mesma ideia de montarChao
  const conta = (x: number, y: number, a: number, b: number) => (x * a + y * b) % 100;
  const pecas: Peca[] = [];

  for (let y = 0; y < desenho.length; y++) {
    for (let x = 0; x < desenho[y].length; x++) {
      if (ocupado.has(`${x},${y}`)) continue;
      const ch = letra(x, y);

      if (ch === "T") {
        // A borda da mata e o que o jogador ve, entao ela e plantada densa. O
        // miolo entra ralo so para a copa nao ficar com buraco visto de longe.
        let naBorda = false;
        for (let dy = -2; dy <= 2 && !naBorda; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (letra(x + dx, y + dy) !== "T") { naBorda = true; break; }
        // Densa na borda, rala no miolo. Estava ao contrario e era o pior dos
        // dois mundos: o miolo que ninguem ve saia cheio, e a borda, que e a
        // unica coisa que o jogador enxerga, saia falhada.
        const c = conta(x, y, 7, 13);
        if (naBorda ? c % 3 === 0 : c % 5 !== 0) continue;
        pecas.push({
          nome: conta(x, y, 11, 5) % 3 === 0 ? "pinheiro-baixo" : "pinheiro",
          x, y, solido: false,
        });
        continue;
      }

      // Enfeite de chao SO em chao de floresta. A primeira versao plantava em
      // qualquer tile andavel, e como esta funcao roda em todo mapa, a Vila
      // Semente amanheceu coberta de samambaia e cogumelo. O chao diz a que
      // lugar ele pertence: `f` e folhagem e `g` e clareira de mata, e nenhum
      // dos dois existe fora da floresta.
      if (ch !== "f" && ch !== "g") continue;
      const vizinhoTrilha =
        letra(x + 1, y) === "t" || letra(x - 1, y) === "t" ||
        letra(x, y + 1) === "t" || letra(x, y - 1) === "t";
      if (vizinhoTrilha) continue;
      const c = conta(x, y, 17, 23);
      if (c < 5) pecas.push({ nome: "samambaia", x, y, solido: false });
      else if (c === 7) pecas.push({ nome: "cogumelo", x, y, solido: false });
      else if (c === 11) pecas.push({ nome: "toco", x, y });
      else if (c === 13) pecas.push({ nome: "pedra-musgo", x, y });
    }
  }
  return pecas;
}
