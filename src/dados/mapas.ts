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
 *  "escondido" e pra quem ja esta dentro de casa, fora de cena, sem andar ate
 *  la neste periodo (ver `entra` abaixo pra quem chega andando).
 *  `entra: true` marca o ponto como a PORTA da propria casa: o NPC anda ate
 *  ali de verdade (mesmo A* dos outros pontos) e so desaparece na chegada —
 *  o proximo periodo, normalmente, e "escondido". Na volta, ele reaparece
 *  bem na porta e anda de la pro proximo ponto, em vez de teleportar direto
 *  pro trabalho (ver `Mundo.ts::reaparecerNpc`). */
export type PontoDeRotina = { x: number; y: number; entra?: true };
export type RotinaDeNpc = Record<Periodo, PontoDeRotina | "escondido">;

/** `rotina` e opcional: sem ela a pessoa fica sempre no `x,y` de baixo, igual
 *  sempre foi. Com ela, `x,y` continua sendo onde a pessoa NASCE na cena (por
 *  isso os dois costumam bater com o periodo em que o save comeca). */
export type Pessoa = { quem: string; sprite: string; x: number; y: number; rotina?: RotinaDeNpc };

/** Uma criatura POSTA no mapa. So diz quem e e onde fica: o que ela FAZ vem do
 *  comportamento da ficha em conteudo.ts, e quem executa isso e o sistema de
 *  combate. Aqui e so presenca, para o bicho existir no mundo antes de saber
 *  brigar. */
export type Bicho = { id: string; x: number; y: number };

/** Uma borda que leva a outro mapa.
 *
 *  Sem `porta`: encostar nela ja troca de lugar sozinho — e assim que toda
 *  SAIDA de comodo (voltar pra Vila) e a trilha pra Floresta sempre
 *  funcionaram, e continuam. Bom pra sair: ninguem quer confirmar que quer
 *  ir embora.
 *
 *  Com `porta`: a entrada de um predio (Casa de Cura, Ferraria...) vira
 *  interagivel de verdade — precisa de botao/clique, igual pessoa ou bau,
 *  com destaque na casa quando o heroi chega perto. So andar por cima nao
 *  basta mais. `porta` e o tile (x,y) do OBJETO da casa em `objetos`
 *  (mapas.ts), pra Mundo.ts achar QUAL sprite ganha o destaque.
 *
 *  A area de `x,y,w,h` e em tile, e `entrada` e onde o heroi aparece do
 *  outro lado, com ou sem `porta`. */
export type Saida = {
  x: number; y: number; w: number; h: number;
  para: string;
  entrada: { x: number; y: number };
  porta?: { x: number; y: number };
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
    "ppppppppppppppppppppppppppppppp.....",
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
    // par da arvore acima: emoldura o afunilamento da avenida antes da
    // saida pra Floresta (fileira 11 estreita de "pp" pra "." em x>=31,
    // ver `chao`) -- sem isto o caminho so estreitava sem nenhum marco
    // visivel dizendo "aqui comeca a trilha", e lia como erro de mapa,
    // nao decisao de design.
    { nome: "arvore-escura", x: 33, y: 14 },
    { nome: "arvore-escura", x: 32, y: 17 },
    { nome: "arvore", x: 8, y: 21 },
    { nome: "arvore-escura", x: 16, y: 21 },
    { nome: "arbusto", x: 6, y: 9 },
    { nome: "arbusto", x: 25, y: 9 },
    { nome: "arbusto", x: 18, y: 18 },
    { nome: "arbusto", x: 11, y: 20 },
    { nome: "arbusto", x: 29, y: 13 },
  ],
  // As rotinas colocam cada um no lugar de sempre de dia, e a noite entram de
  // verdade na propria casa: o periodo em que cada um vai pra casa ganha
  // `entra: true` na porta (mesma conta em toda casa da vila: um tile a
  // direita e uma linha acima da `Saida` do predio, ver `saidas` abaixo — o
  // NPC anda ate ali e SO ALI some), e o periodo seguinte fica "escondido"
  // (dormindo, fora de cena) ate reaparecer na propria porta e andar de la
  // pro ponto do novo periodo (ver `Mundo.ts::reaparecerNpc`). Aurora e
  // por-do-sol (as duas janelas curtas de transicao, ver dados/tempo.ts) por
  // padrao herdam o ponto do vizinho mais proximo (aurora ~ manha,
  // por-do-sol ~ tarde) — exceto onde a bio (npcs.ts) ja da um motivo pra
  // ser diferente: a padeira acorda antes do sol pra tirar o pao do forno
  // (fica na padaria desde a madrugada, nao em casa), o pescador tem a
  // "manha de neblina no rio" como afinidade (aurora o poe la, nao em casa),
  // e as duas criancas continuam escondidas na aurora (ainda dormindo). O
  // guarda fica no posto o dia inteiro, madrugada e noite incluidas — vigia
  // nao larga a trilha por causa da hora, e por isso e o unico dos 8 que
  // nunca entra em casa nesta rotina — e o pescador fica na fogueira a noite
  // inteira (a bio dele diz "NOITES claras", o mesmo fogo que o dialogo da
  // fogueira ja descreve como "alguem que passou a noite acordado aqui"),
  // so entrando em casa de madrugada, quando a brasa esfria. Continua no rio
  // no por-do-sol: e a janela do Dourado do Poente (dados/peixes.ts).
  pessoas: [
    {
      quem: "vovo", sprite: "vovo", x: 4, y: 8,
      // porta da Casa de Cura (saida x:2,y:7 -> porta em x+1,y-1, mesma
      // conta de toda casa da vila): anda ate a porta e some so ali de
      // noite, reaparece na porta de manha e anda de la pro dia inteiro.
      rotina: {
        madrugada: "escondido", aurora: { x: 4, y: 8 }, manha: { x: 4, y: 8 },
        tarde: { x: 4, y: 8 }, "por-do-sol": { x: 4, y: 8 }, noite: { x: 3, y: 6, entra: true },
      },
    },
    {
      quem: "ferreiro", sprite: "ferreiro", x: 22, y: 8,
      // porta da Ferraria (mesma casa do menino, ver rotina dele abaixo)
      rotina: {
        madrugada: "escondido", aurora: { x: 22, y: 8 }, manha: { x: 22, y: 8 },
        tarde: { x: 22, y: 8 }, "por-do-sol": { x: 22, y: 8 }, noite: { x: 22, y: 6, entra: true },
      },
    },
    {
      quem: "menina", sprite: "menina", x: 9, y: 14,
      // porta da Casa do Mercador (mesma casa do pai, ver rotina dele
      // abaixo) -- agora anda ate la de noite em vez de sumir no ar
      rotina: {
        madrugada: "escondido", aurora: "escondido", manha: { x: 9, y: 14 },
        tarde: { x: 9, y: 14 }, "por-do-sol": { x: 9, y: 14 }, noite: { x: 15, y: 6, entra: true },
      },
    },
    {
      quem: "pescador", sprite: "pescador", x: 6, y: 19,
      // continua no rio no por-do-sol -- e quando o Dourado do Poente
      // morde a isca (dados/peixes.ts) -- e na fogueira a noite inteira
      // ("nas NOITES claras", bio dele). So de madrugada, depois que a
      // brasa esfria, ele enfim anda ate a Casa da Vila (porta em x:24,
      // y:18 -- saida x:23,y:19 -- e some, reaparecendo na porta na aurora
      // pra voltar ao rio.
      rotina: {
        madrugada: { x: 24, y: 18, entra: true }, aurora: { x: 6, y: 19 }, manha: { x: 6, y: 19 },
        tarde: { x: 6, y: 19 }, "por-do-sol": { x: 6, y: 19 }, noite: { x: 16, y: 11 },
      },
    },
    {
      quem: "mercador", sprite: "mercador", x: 19, y: 10,
      // porta da Casa do Mercador (saida x:14,y:7 -> porta em x+1,y-1);
      // Nina (menina) mora na mesma casa e usa a mesma porta
      rotina: {
        madrugada: "escondido", aurora: { x: 19, y: 10 }, manha: { x: 19, y: 10 },
        tarde: { x: 19, y: 10 }, "por-do-sol": { x: 19, y: 10 }, noite: { x: 15, y: 6, entra: true },
      },
    },
    {
      quem: "menino", sprite: "menino", x: 25, y: 13,
      // porta da Ferraria (mesma casa do pai, ver rotina do ferreiro acima)
      rotina: {
        madrugada: "escondido", aurora: "escondido", manha: { x: 25, y: 13 },
        tarde: { x: 25, y: 13 }, "por-do-sol": { x: 25, y: 13 }, noite: { x: 22, y: 6, entra: true },
      },
    },
    {
      quem: "padeira", sprite: "padeira", x: 11, y: 8,
      // por-do-sol e noite ja apontavam pro mesmo lugar (a porta, saida
      // x:9,y:7 -> porta em x+1,y-1) -- so a noite ganhou `entra`, porque
      // ela ja estava exatamente ali quando o periodo muda (ver o caso
      // "ja estava na porta" em Mundo.ts::tracarRotaDoNpc).
      rotina: {
        madrugada: { x: 11, y: 8 }, aurora: { x: 11, y: 8 }, manha: { x: 11, y: 8 },
        tarde: { x: 11, y: 8 }, "por-do-sol": { x: 10, y: 6 }, noite: { x: 10, y: 6, entra: true },
      },
    },
    {
      quem: "guarda", sprite: "guarda", x: 29, y: 11,
      rotina: {
        madrugada: { x: 30, y: 11 }, aurora: { x: 29, y: 11 }, manha: { x: 29, y: 11 },
        tarde: { x: 29, y: 11 }, "por-do-sol": { x: 29, y: 11 }, noite: { x: 29, y: 11 },
      },
    },
  ],
  entrada: { x: 15, y: 13 },
  lugar: "Vila Semente",
  // "A trilha do leste vai pra Floresta dos Sussurros", diz a placa da vila
  saidas: [
    { x: 35, y: 11, w: 1, h: 2, para: "floresta", entrada: { x: 3, y: 42 } },
    // a porta da Casa de Cura, bem em frente a casa-vovo (x:2,y:4 em objetos).
    // `porta` liga a saida ao objeto: entrar vira acao de verdade (botao ou
    // clique, com destaque na casa), sair continua so andar ate aqui.
    { x: 2, y: 7, w: 2, h: 1, para: "casa-cura", entrada: { x: 3, y: 5 }, porta: { x: 2, y: 4 } },
    // as outras 4 casas: mesma regra da Casa de Cura, porta 3 linhas abaixo
    // do objeto (x:objeto, y:objeto+3), pra dar espaco de chegar andando
    { x: 9, y: 7, w: 2, h: 1, para: "casa-padeira-interior", entrada: { x: 4, y: 6 }, porta: { x: 9, y: 4 } },
    { x: 14, y: 7, w: 2, h: 1, para: "casa-grande-interior", entrada: { x: 5, y: 7 }, porta: { x: 14, y: 4 } },
    { x: 21, y: 7, w: 2, h: 1, para: "ferraria-interior", entrada: { x: 5, y: 7 }, porta: { x: 21, y: 4 } },
    { x: 23, y: 19, w: 2, h: 1, para: "casa-pequena-interior", entrada: { x: 4, y: 6 }, porta: { x: 23, y: 16 } },
    // a terceira casa-pequena (x27,y4) so tinha decoracao ate aqui
    { x: 27, y: 7, w: 2, h: 1, para: "casa-guarda-interior", entrada: { x: 4, y: 6 }, porta: { x: 27, y: 4 } },
  ],
};

/** O comodo da Vovo Aurora, por dentro. Ver docs/14-casa-de-cura.md: um
 *  comodo so, pequeno de proposito, sem cama pro heroi -- a fogueira continua
 *  o unico lugar que revive de verdade.
 *
 *  8 x 7 tiles. Parede em W (solida), chao de madeira em m. A brecha na
 *  parede sul (linha 6, colunas 3-4) e a porta: pisar nela volta pra Vila,
 *  bem no lugar de onde se entrou. */
export const CASA_CURA: Mapa = {
  chao: [
    "WWWWWWWW",
    "WmmmmmmW",
    "WmmmmmmW",
    "WmmmmmmW",
    "WmmmmmmW",
    "WmmmmmmW",
    "WWWmmWWW",
  ],
  objetos: [
    { nome: "cama", x: 1, y: 1 },
    { nome: "prateleira-pocoes", x: 4, y: 0 },
    { nome: "caldeirao", x: 4, y: 4 },
  ],
  pessoas: [],
  entrada: { x: 3, y: 4 },
  lugar: "Casa de Cura",
  saidas: [
    { x: 3, y: 6, w: 2, h: 1, para: "vila", entrada: { x: 3, y: 9 } },
  ],
};

/** Onde o heroi acorda depois de uma derrota (Fase 13,
 *  docs/plano-de-implementacao.md - CLAUDE.md, "Divergencia deliberada").
 *  Um tile a frente da porta do predio "hospital" (ver VILA.objetos), que e
 *  ancorado pelo pe em (29, 21) - a mesma conta de qualquer Saida.entrada. */
export const HOSPITAL_ENTRADA = { x: 29, y: 22 };

/** As outras 4 casas da Vila, por dentro. Pedido do Hugo depois de ver a Casa
 *  de Cura funcionando: "as casas podem ser maiores e mais detalhadas".
 *  Continuam um comodo so (nada de multi-comodo ainda), mas bem mais largas
 *  que os 8x7 da Casa de Cura, com bem mais mobilia. Cada uma reusa parede-
 *  interior e madeira-chao/chao-caverna -- so a mobilia muda de casa pra
 *  casa (ver arte/mundo.py, secao "as outras casas da Vila, por dentro"). */
export const FERRARIA_INTERIOR: Mapa = {
  chao: [
    "WWWWWWWWWWWWW",
    "WcccccccccccW",
    "WcccccccccccW",
    "WcccccccccccW",
    "WcccccccccccW",
    "WcccccccccccW",
    "WcccccccccccW",
    "WcccccccccccW",
    "WcccccccccccW",
    "WWWWWccWWWWWW",
  ],
  objetos: [
    { nome: "suporte-armas", x: 2, y: 0 },
    { nome: "suporte-armas", x: 10, y: 0 },
    { nome: "forja", x: 6, y: 1 },
    { nome: "bigorna", x: 4, y: 3 },
    { nome: "banco", x: 6, y: 4 },
    { nome: "mesa", x: 9, y: 6 },
    { nome: "bau", x: 2, y: 7 },
  ],
  pessoas: [],
  entrada: { x: 5, y: 7 },
  lugar: "Ferraria",
  saidas: [
    { x: 5, y: 9, w: 2, h: 1, para: "vila", entrada: { x: 22, y: 9 } },
  ],
};

export const CASA_GRANDE_INTERIOR: Mapa = {
  chao: [
    "WWWWWWWWWWWWW",
    "WmmmmmmmmmmmW",
    "WmmmmmmmmmmmW",
    "WmmmmmmmmmmmW",
    "WmmmmmmmmmmmW",
    "WmmmmmmmmmmmW",
    "WmmmmmmmmmmmW",
    "WmmmmmmmmmmmW",
    "WmmmmmmmmmmmW",
    "WWWWWmmWWWWWW",
  ],
  objetos: [
    { nome: "estante-livros", x: 2, y: 0 },
    { nome: "cama", x: 2, y: 1 },
    { nome: "armario", x: 10, y: 2 },
    { nome: "tapete", x: 6, y: 4 },
    { nome: "mesa", x: 6, y: 6 },
    { nome: "banco", x: 4, y: 7 },
    { nome: "banco", x: 8, y: 7 },
    { nome: "bau", x: 10, y: 7 },
  ],
  pessoas: [],
  // entrada longe de qualquer movel -- o banco que estava aqui empurrava o
  // heroi bem em cima do proprio banco ao entrar
  entrada: { x: 5, y: 7 },
  lugar: "Casa do Mercador",
  saidas: [
    { x: 5, y: 9, w: 2, h: 1, para: "vila", entrada: { x: 15, y: 9 } },
  ],
};

export const CASA_PADEIRA_INTERIOR: Mapa = {
  chao: [
    "WWWWWWWWWWW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WWWWmmWWWWW",
  ],
  objetos: [
    { nome: "prateleira-pao", x: 2, y: 0 },
    { nome: "forno-padaria", x: 6, y: 1 },
    { nome: "mesa", x: 3, y: 5 },
    { nome: "banco", x: 3, y: 6 },
    { nome: "tapete", x: 7, y: 5 },
  ],
  pessoas: [],
  entrada: { x: 4, y: 6 },
  lugar: "Casa da Padeira",
  saidas: [
    { x: 4, y: 8, w: 2, h: 1, para: "vila", entrada: { x: 10, y: 9 } },
  ],
};

export const CASA_PEQUENA_INTERIOR: Mapa = {
  chao: [
    "WWWWWWWWWWW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WWWWmmWWWWW",
  ],
  objetos: [
    { nome: "cama", x: 2, y: 1 },
    { nome: "armario", x: 8, y: 1 },
    { nome: "tapete", x: 5, y: 4 },
    { nome: "mesa", x: 3, y: 5 },
    { nome: "banco", x: 3, y: 6 },
    { nome: "bau", x: 8, y: 6 },
  ],
  pessoas: [],
  entrada: { x: 4, y: 6 },
  lugar: "Casa da Vila",
  saidas: [
    { x: 4, y: 8, w: 2, h: 1, para: "vila", entrada: { x: 24, y: 21 } },
  ],
};

/** A terceira `casa-pequena` da Vila (x27,y4) so tinha decoracao ate agora.
 *  Casa do guarda -- o unico dos 8 NPCs sem casa atribuida antes desta. */
export const CASA_GUARDA_INTERIOR: Mapa = {
  chao: [
    "WWWWWWWWWWW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WmmmmmmmmmW",
    "WWWWmmWWWWW",
  ],
  objetos: [
    { nome: "suporte-armas", x: 2, y: 0 },
    { nome: "cama", x: 7, y: 1 },
    { nome: "tapete", x: 5, y: 3 },
    { nome: "mesa", x: 3, y: 5 },
    { nome: "banco", x: 3, y: 6 },
    { nome: "bau", x: 7, y: 6 },
  ],
  pessoas: [],
  entrada: { x: 4, y: 6 },
  lugar: "Casa do Guarda",
  saidas: [
    { x: 4, y: 8, w: 2, h: 1, para: "vila", entrada: { x: 28, y: 9 } },
  ],
};

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
    "tttttttttttttff\"fffffffttttfffffffffffff\"ffffffffffgggggggggg,gggggggggggggffffffffffffgggggggggggggggggg\",gggfffttttttt",
    "ttttttttttttttfffgffffttttfffffffffffffffffff\"ffffggggggggg,gggggggggg\"\"gg,ffffffffffffgggggggggg,g,ggggg\"ggggtttttttttt",
    "ttttttttttttttg,fg\"\"ggttttffffffffffffffffffffffffggggggg\"gg,gggggggggggggffffffffffffgggggggggggg,ggggggg,gggtttttttttt",
    "tttttttTTTftttgggg,ggfttttfffffffffffffff\"fffffffggggggg,gg\"gggggggggggggffffffffffffg,gggggggggggggggggggg,g,tttttttttt",
    "tttttttttffffggggggggttttffffffffffffffff\"ffffffgg\"ggggggggggggg\"g,ggggggtttff\"ffffffgg,gggggg\"ggggggggg,ggggttttTTTTTTT",
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

/** Praia de Chegada, 44 x 20 tiles — onde toda partida nova comeca agora
 *  (ver `VAZIO.cena` em sistemas/estado.ts). O heroi desembarca do navio que
 *  o trouxe de outras terras, fala com o marinheiro (que concede a arma da
 *  propria classe, uma bolsa de moedas e uma pocao — nada disso e equipado
 *  de verdade na criacao de personagem, so mostrado na vitrine), e segue a
 *  pe pra Trilha de Chegada.
 *
 *  Revisao de 2026-09-05, a pedido do Hugo: o desenho original (26x11) tinha
 *  a mata contornando o mapa inteiro com uma saida de 1 casa so — lia como
 *  porta escondida, nao caminho aberto. Agora: bem mais chao de areia pra
 *  andar, a saida leste e uma abertura de 7 casas de altura (a mata so
 *  emoldura ACIMA e ABAIXO dela, nunca atravessando), e o navio sai de cima
 *  da areia pra dentro da agua de verdade — ancorado ao largo, balancando
 *  sozinho de vez em quando (ver `Mundo.ts`, o `if (peca.nome === "navio")`
 *  no loop de objetos). A beira do mar deixou de ser um corte reto: varia
 *  linha a linha (mesmo espirito do lago da Floresta), com `onda` (arte
 *  animada, `garantirAnimacaoDeOnda`) plantada em alguns pontos da beira. */
export const PRAIA_DE_CHEGADA: Mapa = {
  chao: [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaTT",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaTT",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaTT",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "TTttttttttttttttttttttttttttttttttttttttttaa",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaTT",
    "TTaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaTT",
    "saaaaaaaaaaaaaaaaaaaaaasss~~~~~~~~~ssssaaaaa",
    "~sssaaaaaaaaaaaaaaaasss~~~~~~~~~~~~~~~~sssaa",
    "~~~~ssssaaaaaaaassss~~~~~~~~~~~~~~~~~~~~~~ss",
    "~~~~~~~~ssssssss~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  ],
  objetos: [
    { nome: "navio", x: 2, y: 17 },
    { nome: "onda", x: 24, y: 14 },
    { nome: "onda", x: 36, y: 14 },
    { nome: "onda", x: 21, y: 15 },
    { nome: "pedra-solta", x: 14, y: 5 },
    { nome: "arbusto", x: 32, y: 6 },
    { nome: "pedra-solta", x: 18, y: 11 },
    // do lado do marinheiro: as coisas do heroi, que ele tira daqui, nao do
    // navio ancorado (inacessivel, longe na agua). So decorativo, ver
    // "bau-marinheiro" em arte/mundo.py.
    { nome: "bau-marinheiro", x: 7, y: 13 },
  ],
  pessoas: [{ quem: "marinheiro", sprite: "marinheiro", x: 6, y: 13 }],
  entrada: { x: 4, y: 8 },
  lugar: "Praia de Chegada",
  saidas: [{ x: 43, y: 5, w: 1, h: 7, para: "chegada", entrada: { x: 3, y: 6 } }],
};

/** Trilha de Chegada, 30 x 13 tiles. Um caminho so, guiado, bordado de mata
 *  como a Floresta: nasce (vindo da Praia de Chegada), passa por uma placa
 *  (ensina interacao), passa por um goblin (ensina combate), sai na Vila.
 *  Pequeno de proposito — anda-se de ponta a ponta em poucos segundos, sem
 *  contar as paradas. */
export const TRILHA_DE_CHEGADA: Mapa = {
  chao: [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TT..........................TT",
    "TT..........................TT",
    "TT..........................TT",
    "TT..........................TT",
    "TTttttttttttttttttttttttttttTT",
    "TT..........................TT",
    "TT..........................TT",
    "TT..........................TT",
    "TT..........................TT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  ],
  objetos: [{ nome: "placa", x: 9, y: 6 }],
  pessoas: [],
  criaturas: [{ id: "goblin", x: 17, y: 6 }],
  entrada: { x: 3, y: 6 },
  lugar: "Trilha de Chegada",
  saidas: [{ x: 27, y: 6, w: 1, h: 1, para: "vila", entrada: { x: 15, y: 13 } }],
};

/** Todo mapa do jogo, pela chave que fica em `estado().cena`. */
export const MAPAS: Record<string, Mapa> = {
  praia: PRAIA_DE_CHEGADA,
  chegada: TRILHA_DE_CHEGADA,
  vila: VILA,
  floresta: FLORESTA,
  "casa-cura": CASA_CURA,
  "ferraria-interior": FERRARIA_INTERIOR,
  "casa-grande-interior": CASA_GRANDE_INTERIOR,
  "casa-padeira-interior": CASA_PADEIRA_INTERIOR,
  "casa-pequena-interior": CASA_PEQUENA_INTERIOR,
  "casa-guarda-interior": CASA_GUARDA_INTERIOR,
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
