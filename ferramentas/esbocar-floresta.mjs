/** Rascunho do chao da Floresta dos Sussurros.
 *
 *  ESTE ARQUIVO NAO E A FONTE DA VERDADE. A verdade e o texto que ele imprime,
 *  depois de colado em src/dados/mapas.ts. Isto aqui e o lapis, nao o desenho:
 *  serve para redesenhar do zero se a forma do mapa mudar, e para provar que o
 *  mapa e atravessavel antes de alguem jogar.
 *
 *  Entra o esboco de blocos de docs/10-mapa-da-floresta.md, 30 x 21 blocos de
 *  4 x 4 tiles. Sai o desenho de 120 x 84, com a borda entre mata e clareira
 *  quebrada por ruido estavel (a mesma posicao sempre da o mesmo resultado, ou
 *  o mapa mudaria a cada rodada e o jogo nao seria o mesmo duas vezes).
 *
 *      node ferramentas/esbocar-floresta.mjs
 */

const ESBOCO = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "TT.......................ooooT",
  "TT.oooo........oooooooo..oPooT",
  "TT.oCoo........oooVoooo..ooooT",
  "TT.oooo........oooooooo.....TT",
  "TT..pppppppppppppppppppppppp.T",
  "====p=====1======2====c===3==T",
  "TT..........................TT",
  "~~~~~R~~~~~~~~~~~~~~~~X~~~~~~~",
  "TT...p......oooooo...oooooo.TT",
  "EppoLp......ooGooo...ooDoooppS",
  "TT.oop......oooooopppoooooo.TT",
  "TT...p......oooooo...oooooo.TT",
  "TT...p..............oooooo..TT",
  "TT...p..............ooooo...TT",
  "TT.ooooooo..........oobooo..TT",
  "TT.ooBoooo.........ooooooo..TT",
  "Tpppoooooo.........ooooooo..TT",
  "TT.oooooopppppppppppoooooo..TT",
  "TT..........................TT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];

const BLOCO = 4;
const L = ESBOCO[0].length * BLOCO;   // 120
const A = ESBOCO.length * BLOCO;      // 84

/** De letra de bloco para letra de tile do jogo. */
const TILE = {
  T: "T",   // mata fechada, solida
  ".": "f", // mata aberta, chao de folha
  o: "g",   // clareira de mata
  p: "t",   // trilha
  "~": "~", // riacho, solido
  "=": "=", // barranco, solido
  1: "t", 2: "t", 3: "t", c: "t",       // as passagens no barranco
  4: "m",                               // o tronco caido, madeira por cima da agua
  X: "m",                               // a ponte de teia: superficie de andar, igual ao tronco
  E: "t", S: "t", b: "g",
  C: "g", V: "g", P: "g", G: "g", D: "g", L: "g", B: "g", R: "m",
};

/** Ruido estavel: a mesma posicao sempre devolve o mesmo numero. Nada de
 *  Math.random, ou o mapa mudaria a cada geracao. */
function ruido(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const bloco = (bx, by) => (ESBOCO[by] ?? "")[bx] ?? "T";
const tileDoBloco = (bx, by) => TILE[bloco(bx, by)] ?? "f";

// ------------------------------------------------------------ 1. ampliar
// Nao e uma ampliacao reta. Antes de ler o bloco, a coordenada e DESLOCADA por
// uma onda suave: e o que tira o mapa da cara de labirinto. Como a onda e a
// mesma para tudo, clareira, trilha, rio e barranco ondulam juntos, como se o
// terreno inteiro tivesse sido empurrado, e nao cada peca sorteada por conta.
// A amplitude e pequena de proposito: onda grande demais estrangula a abertura
// no barranco e parte o rio ao meio.
const onda = (a, k1, k2, f) => Math.sin(a * k1 + f) * 2.0 + Math.sin(a * k2) * 1.0;

const chao = [];
for (let y = 0; y < A; y++) {
  const linha = [];
  for (let x = 0; x < L; x++) {
    const dx = onda(y, 0.11, 0.27, 1.3);
    const dy = onda(x, 0.09, 0.23, 2.1);
    const bx = Math.floor((x + dx) / BLOCO), by = Math.floor((y + dy) / BLOCO);
    linha.push(tileDoBloco(bx, by));
  }
  chao.push(linha);
}

// -------------------------------------------- 2. quebrar a borda da mata
// So a fronteira entre mata e o resto e sorteada, e so em cima de tile de mata
// ou de mata aberta. Trilha, agua, barranco e madeira nunca sao tocados: e o
// que garante que o caminho continua sendo o caminho.
const INTOCAVEL = new Set(["t", "~", "=", "m"]);
const original = chao.map((l) => l.slice());
const vizinhos = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (let y = 1; y < A - 1; y++) {
  for (let x = 1; x < L - 1; x++) {
    const meu = original[y][x];
    if (INTOCAVEL.has(meu)) continue;
    // nunca encostar mata na trilha: corredor estreito e onde a crianca prende
    const pertoDeTrilha = vizinhos.some(([dx, dy]) => {
      for (let k = 1; k <= 2; k++) {
        const l = original[y + dy * k]?.[x + dx * k];
        if (l === "t" || l === "m") return true;
      }
      return false;
    });
    const diferentes = vizinhos
      .map(([dx, dy]) => original[y + dy][x + dx])
      .filter((v) => v !== meu && !INTOCAVEL.has(v));
    if (!diferentes.length) continue;
    const outro = diferentes[Math.floor(ruido(x, y) * diferentes.length)];
    if (pertoDeTrilha && outro === "T") continue;
    if (ruido(x * 3, y * 5) < 0.38) chao[y][x] = outro;
  }
}

// ---------------------------------------------- 3. temperar as clareiras
// Grama alta e flor nas clareiras, folha solta na mata aberta. So enfeite.
for (let y = 0; y < A; y++) {
  for (let x = 0; x < L; x++) {
    const r = ruido(x * 7 + 1, y * 11 + 3);
    if (chao[y][x] === "g" && r > 0.93) chao[y][x] = ",";
    else if (chao[y][x] === "g" && r < 0.05) chao[y][x] = '"';
    else if (chao[y][x] === "f" && r > 0.95) chao[y][x] = '"';
  }
}

// ------------------------------------------ 3.5 carimbar as passagens
// A entrada e a saida sao carimbadas DEPOIS do ruido e da deformacao, e nao
// antes. Antes, a onda empurrava mata por cima delas: a entrada da floresta
// caiu dentro de um pinheiro e a borda de volta para a vila ficou solida, ou
// seja, o jogador entrava e nao tinha como voltar. Passagem nao pode depender
// de sorteio. Aqui ela e lei.
const PASSAGENS = [];
for (let by = 0; by < ESBOCO.length; by++)
  for (let bx = 0; bx < ESBOCO[by].length; bx++) {
    const ch = ESBOCO[by][bx];
    if (ch !== "E" && ch !== "S") continue;
    const doOeste = bx < ESBOCO[by].length / 2;
    const y = by * BLOCO + 2;
    for (let dy = -1; dy <= 1; dy++)
      for (let k = 0; k < 7; k++) {
        const x = doOeste ? k : L - 1 - k;
        if (y + dy >= 0 && y + dy < A) chao[y + dy][x] = "t";
      }
    PASSAGENS.push({ ch, x: doOeste ? 1 : L - 2, y });
  }

// ------------------------------------------- 4. provar que da para andar
const SOLIDO = new Set(["T", "~", "=", "P"]);
function alcancaveis(inicio) {
  const visto = Array.from({ length: A }, () => new Array(L).fill(false));
  const fila = [inicio];
  visto[inicio[1]][inicio[0]] = true;
  let n = 1;
  while (fila.length) {
    const [x, y] = fila.pop();
    for (const [dx, dy] of vizinhos) {
      const a = x + dx, b = y + dy;
      if (a < 0 || b < 0 || a >= L || b >= A || visto[b][a]) continue;
      if (SOLIDO.has(chao[b][a])) continue;
      visto[b][a] = true; n++;
      fila.push([a, b]);
    }
  }
  return { visto, n };
}

/** Onde cada marco caiu, em tile, para conferir alcance e para plantar objeto. */
const MARCOS = {};
const problemasMarco = [];
for (let by = 0; by < ESBOCO.length; by++)
  for (let bx = 0; bx < ESBOCO[by].length; bx++) {
    const ch = ESBOCO[by][bx];
    if ("ESCVPGDLBR1234Xcb".includes(ch)) {
      // acha o tile mais proximo do centro do bloco que sobrou andavel depois
      // da deformacao: o marco tem que cair onde da para pisar
      const alvoX = bx * BLOCO + 2, alvoY = by * BLOCO + 2;
      let melhor = null, dist = 1e9;
      for (let y = Math.max(0, alvoY - 5); y < Math.min(A, alvoY + 6); y++)
        for (let x = Math.max(0, alvoX - 5); x < Math.min(L, alvoX + 6); x++) {
          if (SOLIDO.has(chao[y][x])) continue;
          const d = (x - alvoX) ** 2 + (y - alvoY) ** 2;
          if (d < dist) { dist = d; melhor = [x, y]; }
        }
      if (melhor) MARCOS[ch] = melhor;
      else problemasMarco.push(`o marco "${ch}" ficou soterrado pela mata`);
    }
  }

const entrada = MARCOS.E;
const { visto, n } = alcancaveis(entrada);
const problemas = [...problemasMarco];

for (const [ch, [x, y]] of Object.entries(MARCOS))
  if (!visto[y][x]) problemas.push(`o marco "${ch}" em (${x}, ${y}) nao e alcancavel da entrada`);

// largura de corredor: nenhuma passagem de 1 tile no caminho de terra
for (let y = 1; y < A - 1; y++)
  for (let x = 1; x < L - 1; x++) {
    if (chao[y][x] !== "t") continue;
    const ehParede = (a, b) => SOLIDO.has(chao[b][a]);
    if (ehParede(x - 1, y) && ehParede(x + 1, y) && ehParede(x, y - 1) && ehParede(x, y + 1))
      problemas.push(`trilha presa em (${x}, ${y})`);
  }

// O rio so pode ser atravessado onde o desenho manda. A prova nao e "existe agua
// em toda coluna": e tapar as duas travessias e conferir que o norte fica
// inalcancavel. Se sobrar caminho, existe um vau de graca em algum lugar e o
// tronco caido perdeu a razao de existir.
{
  const tapado = chao.map((l) => l.slice());
  for (const c of "RX") {
    const [mx] = MARCOS[c] ?? [];
    if (mx === undefined) continue;
    for (let y = 0; y < A; y++)
      for (let x = mx - 4; x <= mx + 4; x++)
        if (x >= 0 && x < L && (tapado[y][x] === "m" || tapado[y][x] === "~")) tapado[y][x] = "~";
  }
  const guardado = chao.map((l) => l.slice());
  for (let y = 0; y < A; y++) chao[y] = tapado[y];
  const { visto: semTravessia } = alcancaveis(entrada);
  for (let y = 0; y < A; y++) chao[y] = guardado[y];

  const norte = [["V", "a Ravina"], ["P", "a Passagem"], ["C", "a Clareira do Trovao"]];
  for (const [ch, nome] of norte) {
    const p = MARCOS[ch];
    if (p && semTravessia[p[1]][p[0]])
      problemas.push(`com o tronco e a teia tapados, ${nome} continua alcancavel: ha um vau de graca no rio`);
  }
}

// ------------------------------------------------- 5. marcos e decoracao
// O que e MARCO vai listado a mao aqui: e conteudo, e conteudo se escreve. O que
// e enfeite (cogumelo, samambaia, toco) e sorteado de forma estavel, porque
// ninguem quer decidir a dedo onde fica a tricentesima samambaia.
//
// A mata em si NAO entra nesta lista: ela e plantada por plantarMata() a partir
// da letra T. Se voce ver arvore escrita aqui, alguem errou.

const anda = (x, y) => x >= 0 && y >= 0 && x < L && y < A && !SOLIDO.has(chao[y][x]);
const perto = (m, dx, dy) => (MARCOS[m] ? [MARCOS[m][0] + dx, MARCOS[m][1] + dy] : null);

const objetos = [];
const ocupadoJa = new Set();
/** Poe o marco no tile pedido, ou no andavel mais proximo. Marco que nao cabe
 *  nao pode sumir calado: some do mapa e ninguem descobre por que. */
const por = (nome, ponto, solido) => {
  if (!ponto) { problemas.push(`o marco "${nome}" nao tem lugar: o bloco dele nao existe`); return; }
  let melhor = null, dist = 1e9;
  for (let y = ponto[1] - 3; y <= ponto[1] + 3; y++)
    for (let x = ponto[0] - 3; x <= ponto[0] + 3; x++) {
      if (!anda(x, y) || ocupadoJa.has(`${x},${y}`)) continue;
      if (chao[y][x] === "t" && solido !== false) continue;   // nunca no meio da trilha
      const d = (x - ponto[0]) ** 2 + (y - ponto[1]) ** 2;
      if (d < dist) { dist = d; melhor = [x, y]; }
    }
  if (!melhor) { problemas.push(`o marco "${nome}" nao coube perto de (${ponto})`); return; }
  ocupadoJa.add(`${melhor[0]},${melhor[1]}`);
  objetos.push({ nome, x: melhor[0], y: melhor[1], solido });
};

por("grande-ouvinte", MARCOS.G);
por("arvore-raio", MARCOS.C);
por("tronco-caido", MARCOS.R, false);
por("raizes", perto("2", 0, 1));
por("placa", perto("E", 2, 1));
por("bau", MARCOS.b);
// as quatro fogueiras: e a regua de dificuldade da area
for (const m of ["B", "G", "D", "V"]) por("fogueira", perto(m, 1, 1));
// o Oco do Lenhador: um toco, uma pedra e o que sobrou de quem morou ali
por("toco", perto("L", 0, 0));
por("pedra-musgo", perto("L", 3, 1));
por("cerca", perto("L", -2, 2));
// a Teia Doce, em volta do ninho e na ponte
for (const [dx, dy] of [[-2, -1], [2, 0], [0, 2], [3, -2]]) por("teia", perto("D", dx, dy), false);
for (const [dx, dy] of [[-1, -1], [1, -1]]) por("teia", perto("X", dx, dy), false);
// o Bosque das Lanternas: o cogumelo azul so existe aqui
for (const [dx, dy] of [[-3, 1], [2, 2], [4, -1], [-1, 3]])
  por("cogumelo-azul", perto("B", dx, dy), false);

// Enfeite de chao (samambaia, cogumelo, toco, pedra) NAO sai daqui. Ele e
// plantado por plantarMata() em src/dados/mapas.ts, pela mesma razao que a
// arvore: sao centenas, e centenas de linhas de dados apodrecem na primeira
// mexida no desenho. Aqui so sai o que alguem decidiu a dedo.

// ------------------------------------------------------------- 6. sair
// a letra da grama alta e aspas: sem escapar, ela fecha a string do TypeScript
const texto = chao
  .map((l) => `    "${l.join("").replace(/"/g, '\\"')}",`)
  .join("\n");
const linhaObj = (o) =>
  `    { nome: "${o.nome}", x: ${o.x}, y: ${o.y}${o.solido === false ? ", solido: false" : ""} },`;
console.log(texto);
console.log("  ],");
console.log("  objetos: [");
console.log(objetos.map(linhaObj).join("\n"));
console.log("  ],");
console.error(`\n${L} x ${A} tiles, ${n} andaveis (${Math.round((n / (L * A)) * 100)}%)`);
console.error(`objetos: ${objetos.length}`);
console.error("passagens:", PASSAGENS.map((p) => `${p.ch}=${p.x},${p.y}`).join("  "));
console.error("marcos:", Object.entries(MARCOS).map(([c, p]) => `${c}=${p}`).join("  "));
if (problemas.length) {
  console.error("\nPROBLEMAS:");
  for (const p of problemas) console.error("  " + p);
  process.exit(1);
}
console.error("sem problemas: tudo alcancavel a pe desde a entrada");
