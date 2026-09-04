#!/usr/bin/env node
/** O doutor do Reino de Aurora.
 *
 *  Confere os contratos que ninguem consegue ver quebrar: a lista de objetos que
 *  precisa bater entre a arte e o codigo, a paleta que precisa ser a mesma dos dois
 *  lados, o objeto que esta no mapa mas nao tem fala, o PNG que o Boot carrega e nao
 *  existe. Nenhum desses erros aparece no console, e todos deixam o jogo pior.
 *
 *  Nao depende de nada. Le os arquivos como texto de proposito: um parser de verdade
 *  seria mais bonito e traria uma arvore de dependencia so pra isso.
 *
 *      node verificar.mjs            confere tudo
 *      node verificar.mjs --silencio so o resultado final
 *
 *  Sai com codigo 1 se achar ERRO, 0 se achar so AVISO.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

// o npm roda o script da raiz do projeto. --raiz existe so pra testar de fora.
const argRaiz = process.argv.find((a) => a.startsWith("--raiz="));
const RAIZ = resolve(argRaiz ? argRaiz.slice(7) : process.cwd());
const silencio = process.argv.includes("--silencio");

/* ------------------------------------------------------------------ achados */

const achados = [];
const erro = (area, msg, dica) => achados.push({ nivel: "ERRO", area, msg, dica });
const aviso = (area, msg, dica) => achados.push({ nivel: "AVISO", area, msg, dica });

/* ------------------------------------------------------------------ leitura */

function ler(caminho) {
  const cheio = join(RAIZ, caminho);
  if (!existsSync(cheio)) return null;
  return readFileSync(cheio, "utf8");
}

/** Pega o miolo de um bloco que comeca em `abre` e termina no primeiro `fecha`. */
function bloco(texto, abre, fecha) {
  if (!texto) return null;
  const i = texto.indexOf(abre);
  if (i < 0) return null;
  const j = texto.indexOf(fecha, i + abre.length);
  if (j < 0) return null;
  return texto.slice(i + abre.length, j);
}

const tudo = (re, texto) => (texto ? [...texto.matchAll(re)] : []);

/* --------------------------------------------------------------- os arquivos */

const config = ler("src/dados/config.ts");
const mapas = ler("src/dados/mapas.ts");
const dialogos = ler("src/dados/dialogos.ts");
const boot = ler("src/cenas/Boot.ts");
const mundoTs = ler("src/cenas/Mundo.ts");
const mundoPy = ler("arte/mundo.py");
const paletaPy = ler("arte/paleta.py");

for (const [nome, texto] of Object.entries({
  "src/dados/config.ts": config,
  "src/dados/mapas.ts": mapas,
  "src/dados/dialogos.ts": dialogos,
  "src/cenas/Boot.ts": boot,
  "src/cenas/Mundo.ts": mundoTs,
  "arte/mundo.py": mundoPy,
  "arte/paleta.py": paletaPy,
})) {
  if (!texto) erro("arquivos", `nao achei ${nome}`, "o verificador precisa ficar na raiz do projeto");
}

/* ------------------------------------------------------ 1. lista de objetos */
// CLAUDE.md: "A lista tem que bater com OBJETOS em arte/mundo.py."
// Se desencontrar, o objeto some do mapa calado: Mundo.ts faz `if (!ficha) return`.

const objetosTs = tudo(
  /"([a-z0-9-]+)"/g,
  bloco(config, "export const OBJETOS = [", "] as const;")
).map((m) => m[1]);

const objetosPy = tudo(/\(\s*"([a-z0-9-]+)"/g, bloco(mundoPy, "OBJETOS = [", "\n]")).map((m) => m[1]);

if (objetosTs.length && objetosPy.length) {
  for (const n of objetosTs) {
    if (!objetosPy.includes(n))
      erro("objetos", `"${n}" esta em config.ts mas nao em arte/mundo.py`,
        "o Boot vai tentar carregar um PNG que a geracao de arte nunca produz");
  }
  for (const n of objetosPy) {
    if (!objetosTs.includes(n))
      aviso("objetos", `"${n}" e desenhado em arte/mundo.py mas nao esta em config.ts`,
        "arte gerada que o jogo nunca carrega");
  }
}

/* ------------------------------------------- 2. objetos usados nos mapas */

const pecas = tudo(/\{\s*nome:\s*"([a-z0-9-]+)"/g, mapas).map((m) => m[1]);
for (const n of new Set(pecas)) {
  if (objetosTs.length && !objetosTs.includes(n))
    erro("mapas", `o mapa usa o objeto "${n}", que nao esta em OBJETOS`,
      "esse objeto nao vai aparecer na tela, e nada avisa");
}

/* --------------------------------------------------- 3. PNGs dos objetos */

const pastaObj = join(RAIZ, "public/assets/objetos");
if (existsSync(pastaObj)) {
  const emDisco = readdirSync(pastaObj).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4));
  for (const n of objetosTs)
    if (!emDisco.includes(n))
      erro("arte", `falta public/assets/objetos/${n}.png`, "rode: npm run arte");
  for (const n of emDisco)
    if (objetosTs.length && !objetosTs.includes(n))
      aviso("arte", `${n}.png esta em disco mas ninguem carrega`, "sobra de uma geracao antiga");
} else {
  aviso("arte", "public/assets/objetos nao existe", "rode: npm run arte");
}

/* ------------------------------------------------ 4. quem fala e quem nao */
// O pior erro invisivel do jogo. Mundo.ts:
//   objeto  -> so vira interagivel se DIALOGOS[nome] existir
//   pessoa  -> vira interagivel SEMPRE, com a chave `quem`
// Entao um objeto sem fala e mudo de proposito, e uma pessoa sem fala e um bug:
// o Lele chega, aperta o botao e nao acontece nada.

const chavesDialogo = tudo(/^ {2}"?([a-zA-Z0-9_-]+)"?:\s*\{/gm, dialogos).map((m) => m[1]);
const pessoas = tudo(/\{\s*quem:\s*"([a-z0-9-]+)",\s*sprite:\s*"([a-z0-9-]+)"/g, mapas)
  .map((m) => ({ quem: m[1], sprite: m[2] }));

for (const p of pessoas) {
  if (!chavesDialogo.includes(p.quem))
    erro("dialogos", `a pessoa "${p.quem}" esta no mapa e nao tem fala`,
      "o jogador aperta o botao na frente dela e nada acontece");
}

const usadas = new Set([...pecas, ...pessoas.map((p) => p.quem)]);
for (const c of chavesDialogo) {
  if (usadas.has(c)) continue;
  // quase-acerto: se tem um objeto no mapa com nome parecido e sem fala,
  // quase sempre e renomeacao que ficou pela metade
  const parecido = [...usadas].find(
    (u) => !chavesDialogo.includes(u) && (u.includes(c) || c.includes(u))
  );
  aviso("dialogos", `a fala "${c}" nunca e alcancada`,
    parecido
      ? `"${parecido}" esta no mapa e nao tem fala. renomeou pela metade?`
      : "nenhum objeto nem pessoa no mapa usa essa chave. nome errado, ou cena que ainda nao existe");
}

/* ------------------------------------------------------ 5. frames dos NPCs */
// NPC_FRAME[sprite] ?? 0  -> sprite desconhecido vira o frame 0 sem reclamar,
// ou seja, o NPC aparece com a cara de outro personagem.

const npcFrame = bloco(mundoTs, "const NPC_FRAME: Record<string, number> = {", "};");
if (npcFrame) {
  const conhecidos = tudo(/([a-z0-9-]+):\s*\d+/g, npcFrame).map((m) => m[1]);
  for (const p of pessoas)
    if (!conhecidos.includes(p.sprite))
      erro("npcs", `o sprite "${p.sprite}" nao esta em NPC_FRAME`,
        "esse NPC vai aparecer com o rosto do frame 0, e nada avisa");
}

/* ---------------------------------------------------------- 6. a paleta */
// CLAUDE.md: as duas listas sao a mesma paleta do material impresso.
// Nada no codigo garante isso. A cor foge devagar e ninguem percebe.

const PARES = {
  papel: "PAPEL", papel2: "PAPEL_2", tinta: "TINTA", tintaSuave: "TINTA_2",
  ouro: "OURO", vermelho: "VERMELHO", azul: "AZUL", verde: "VERDE",
  roxo: "ROXO", brasa: "BRASA", rosa: "ROSA",
  grama: "GRAMA", gramaClara: "GRAMA_C",
};

const corTs = {};
for (const m of tudo(/([a-zA-Z0-9]+):\s*0x([0-9a-fA-F]{6})/g, bloco(config, "export const COR = {", "} as const;")))
  corTs[m[1]] = m[2].toLowerCase();

const corPy = {};
for (const m of tudo(/^([A-Z][A-Z0-9_]*)\s*=\s*\((\d+),\s*(\d+),\s*(\d+)\)/gm, paletaPy))
  corPy[m[1]] = [m[2], m[3], m[4]].map((n) => (+n).toString(16).padStart(2, "0")).join("");

for (const [ts, py] of Object.entries(PARES)) {
  const a = corTs[ts], b = corPy[py];
  if (!a) { aviso("paleta", `COR.${ts} nao existe em config.ts`); continue; }
  if (!b) { aviso("paleta", `${py} nao existe em arte/paleta.py`); continue; }
  if (a !== b)
    erro("paleta", `COR.${ts} = #${a} mas ${py} = #${b}`,
      "a interface e a arte estao pintando cores diferentes com o mesmo nome");
}

/* ------------------------------------------- 7. o que o Boot manda carregar */

const caminhos = [
  ...tudo(/this\.load\.(?:image|json)\(\s*"[^"]+",\s*"([^"]+)"/g, boot),
  ...tudo(/this\.load\.spritesheet\(\s*"[^"]+",\s*"([^"]+)"/g, boot),
].map((m) => m[1]);

for (const c of new Set(caminhos)) {
  if (c.includes("${")) continue; // caminho montado em runtime, o check de objetos ja cobre
  if (!existsSync(join(RAIZ, "public", c)))
    erro("boot", `o Boot carrega "${c}" e o arquivo nao existe`,
      "a barra de carregamento trava ou a textura vem vazia");
}

/* ------------------------------------------ 8. tamanho das folhas de sprite */
// ALTURA_PERSONAGEM mudou de 24 pra 32 na virada de arte. Se um PNG ficou pra tras,
// o Phaser fatia os frames errado: o sprite fica cortado, sem nenhum erro.

const alturaPersonagem = +(config?.match(/ALTURA_PERSONAGEM\s*=\s*(\d+)/)?.[1] ?? 32);

function pngTamanho(caminho) {
  try {
    const b = readFileSync(caminho);
    if (b.length < 24 || b.readUInt32BE(12) !== 0x49484452) return null; // 'IHDR'
    return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) };
  } catch { return null; }
}

for (const nome of ["heroi-base", "heroi-roupa", "heroi-cabelo", "goblin", "npcs"]) {
  const arq = join(RAIZ, "public/assets", `${nome}.png`);
  if (!existsSync(arq)) continue;
  const t = pngTamanho(arq);
  if (!t) { aviso("sprites", `nao consegui ler o tamanho de ${nome}.png`); continue; }
  if (t.altura % alturaPersonagem !== 0)
    erro("sprites", `${nome}.png tem ${t.altura}px de altura, que nao e multiplo de ${alturaPersonagem}`,
      "o Phaser vai fatiar os frames errado e o sprite aparece cortado");
  if (t.largura % 16 !== 0)
    erro("sprites", `${nome}.png tem ${t.largura}px de largura, que nao e multiplo de 16`);
}

/* ------------------------------------------------- 9. letras do desenho do chao */
// montarChao faz `LETRA_TILE[ch] ?? LETRA_TILE["."]`: letra errada vira grama calada.

// a chave vem de tres jeitos no objeto: "x": , 'x': , ou x: sem aspas
const letras = new Set(
  tudo(
    /^\s*(?:"(.)"|'(.)'|([A-Za-z]))\s*:\s*\[/gm,
    bloco(mapas, "const LETRA_TILE: Record<string, number[]> = {", "};")
  ).map((m) => m[1] ?? m[2] ?? m[3])
);

const soltas = new Set();
for (const linhas of tudo(/chao:\s*\[([\s\S]*?)\n\s*\]/g, mapas)) {
  for (const l of tudo(/"((?:[^"\\]|\\.)*)"/g, linhas[1])) {
    const desenho = l[1].replace(/\\"/g, '"');
    for (const ch of desenho) if (!letras.has(ch)) soltas.add(ch);
  }
}
for (const ch of soltas)
  aviso("mapas", `a letra "${ch}" aparece no desenho do chao e nao esta em LETRA_TILE`,
    "vira grama, sem avisar");

/* -------------------------------------------- 10. arte solta em public/assets */
// CLAUDE.md: "Nunca cole um PNG na mao em public/assets."
// Compara com o manifesto que a geracao de arte deixa. Sem manifesto, so avisa.

const manifesto = ler("arte/manifesto.json");
if (manifesto) {
  try {
    const m = JSON.parse(manifesto);
    const conhecidos = new Set(Object.keys(m.arquivos ?? {}));
    const andar = (dir, prefixo = "") => {
      for (const f of readdirSync(join(RAIZ, dir))) {
        const rel = prefixo ? `${prefixo}/${f}` : f;
        if (statSync(join(RAIZ, dir, f)).isDirectory()) andar(join(dir, f), rel);
        else if (f.endsWith(".png") && !conhecidos.has(rel))
          aviso("arte", `${rel} nao esta no manifesto`,
            "PNG colado na mao? ele some na proxima geracao de arte");
      }
    };
    if (existsSync(join(RAIZ, "public/assets"))) andar("public/assets");
  } catch { aviso("arte", "arte/manifesto.json esta ilegivel"); }
} else {
  aviso("arte", "arte/manifesto.json ainda nao existe",
    "sem ele nao da pra saber o que mudou entre duas geracoes de arte");
}

/* --------------------------------------------------- 11. catalogo de som */
// Som e o unico assunto do jogo que nao aparece na tela quando quebra. Sprite
// faltando vira quadrado verde e alguem ve; som faltando vira silencio, e
// silencio parece proposital. Entao aqui ficam os quatro desencontros possiveis:
//
//   1. o catalogo pede um arquivo que nao existe      -> ERRO
//   2. um arquivo existe e o catalogo nao pede        -> AVISO, sobra
//   3. o catalogo tem som e o jogo nunca toca         -> AVISO, esperando cena
//   4. a tabela de voz e a lista de falas discordam   -> AVISO
//
// O caso 3 e o que mais aparece agora, e de proposito: o catalogo foi escrito
// inteiro de uma vez, para as fases que ainda vem. Ele nao e uma falha, e a
// lista do que ja esta pronto esperando a cena existir.

const sons = ler("src/dados/sons.ts");
const somGerar = ler("som/gerar.py");
const somTs = ler("src/sistemas/som.ts");

if (sons) {
  const ext = sons.match(/EXTENSAO\s*=\s*"(\.[a-z0-9]+)"/)?.[1] ?? ".mp3";
  const pedidos = new Set(tudo(/arquivo:\s*"([a-z0-9-]+)"/g, sons).map((m) => m[1]));
  // os passaros entram por lista, nao por ficha
  for (const m of tudo(/arquivos:\s*\[([^\]]+)\]/g, sons))
    for (const a of tudo(/"([a-z0-9-]+)"/g, m[1])) pedidos.add(a[1]);

  const pastaSom = join(RAIZ, "public/assets/som");
  const emDisco = existsSync(pastaSom)
    ? new Set(readdirSync(pastaSom).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)))
    : new Set();

  // "pendente: true" no catalogo e uma encomenda, nao um esquecimento: o som foi
  // projetado e o arquivo ainda nao existe. A musica e o caso de hoje, porque
  // melodia sintetizada seria pior que silencio.
  const pendentes = new Set(
    tudo(/\{[^{}]*\bpendente:\s*true[^{}]*\}/g, sons)
      .map((m) => m[0].match(/arquivo:\s*"([a-z0-9-]+)"/)?.[1])
      .filter(Boolean)
  );
  const semRascunho = pendentes;

  for (const nome of pedidos) {
    if (emDisco.has(nome) || semRascunho.has(nome)) continue;
    const temReceita = somGerar?.includes(`"${nome}"`);
    erro("som", `sons.ts pede "${nome}${ext}" e o arquivo nao existe`,
      temReceita ? "tem receita em som/gerar.py: rode npm run som"
                 : "nao tem receita nem arquivo. escreva a receita em som/gerar.py");
  }
  for (const nome of emDisco) {
    if (!pedidos.has(nome))
      aviso("som", `${nome}${ext} esta em disco e ninguem pede`, "sobra de uma geracao antiga");
  }
  for (const nome of pendentes) {
    if (emDisco.has(nome))
      aviso("som", `${nome}${ext} chegou e continua marcado como pendente`,
        "apague o `pendente: true` da ficha em sons.ts, senao o jogo nunca vai toca-lo");
    else
      aviso("som", `${nome} ainda nao existe`,
        "encomenda em aberto: som de verdade, para gravar ou baixar. o jogo nem pede o arquivo");
  }

  /* ------------------------------------------- 11b. quem toca cada som */
  // O CODIGO DO JOGO, sem o catalogo e sem o carregador.
  //
  // carregarSons() em som.ts precisa citar TODOS os grupos para poder carregar
  // os arquivos, entao ele acha que tudo esta em uso. Por isso ele sai daqui:
  // sobra so o codigo que de fato TOCA alguma coisa.
  // O CODIGO QUE TOCA SOM: so os arquivos que falam com o catalogo ou com o
  // sistema de som. E preciso ser seletivo nos dois sentidos.
  //
  //   Largo demais: "lanterna" e "biscoito" tambem sao itens da loja em
  //   conteudo.ts, e "tonto" e um estado do heroi. Varrer src/ inteiro daria
  //   por tocado um monte de som que ninguem toca.
  //
  //   Estreito demais: procurar so por tocar("nome") perde o botao, que recebe
  //   o som por parametro, e perde tudo que e escolhido por tabela.
  //
  // Fora tambem os `import`, porque citar um grupo para importa-lo nao e usar,
  // e o carregador de som.ts, que precisa citar o catalogo inteiro para carregar
  // os arquivos e por isso acharia que tudo esta em uso.
  const codigo = arquivosTs("src")
    .filter((c) => c !== "src/dados/sons.ts")
    .map((c) => [c, ler(c) ?? ""])
    .filter(([, t]) => /from\s+"[^"]*\/(som|sons)"/.test(t))
    .map(([c, t]) => (c === "src/sistemas/som.ts" ? semCarregador(t) : t))
    .join("\n")
    .replace(/import\s[\s\S]*?from\s+"[^"]+";/g, "");

  const GRUPOS = [
    ["EFEITOS", "os sons avulsos do dia a dia"],
    ["ARMAS", "as cadeias de golpe, esperando a fase de combate"],
    ["GOLPES_ESPECIAIS", "as habilidades de classe do RPG de mesa"],
    ["IMPACTOS", "o impacto por material do alvo"],
    ["DADO", "a rolagem, fase 2 do roadmap"],
    ["DESFECHO", "OPS, QUASE e OBA do d6"],
    ["MAGIAS_SOM", "as seis familias de magia"],
    ["CRIATURAS_SOM", "nota, reage e desiste do bestiario"],
    ["FRAQUEZA_SONORA", "as tres fraquezas que o bestiario escreveu como som"],
    ["MUSICAS", "as faixas"],
    ["COLCHAO", "o fundo continuo do mapa"],
    ["PONTOS", "as fontes de som com lugar no mapa"],
    ["PASSAROS", "os cantos avulsos"],
  ];

  for (const [grupo, oQueE] of GRUPOS) {
    if (new RegExp(`\\b${grupo}\\b`).test(codigo)) continue;
    const miolo = bloco(sons, `export const ${grupo} = {`, "\n} satisfies") ?? "";
    const quantos = tudo(/arquivo:\s*"[a-z0-9-]+"/g, miolo).length;
    aviso("som", `nenhuma cena usa ${grupo}${quantos ? ` (${quantos} sons)` : ""}`,
      `${oQueE}. o catalogo esta pronto e a cena ainda nao existe`);
  }

  // Dentro de EFEITOS o disparo e por nome literal: tocar("bau-abre"). Entao da
  // para saber, um por um, qual ja tem lugar no jogo e qual ainda espera.
  const efeitos = bloco(sons, "export const EFEITOS = {", "\n} satisfies");
  const chavesEfeito = tudo(/^\s*"?([a-z0-9-]+)"?:\s*\{\s*arquivo:/gm, efeitos).map((m) => m[1]);
  // o passo nao e citado por nome no codigo: quem escolhe e a tabela PASSO_DO_TILE,
  // a partir do tile em que o heroi pisou. Se passo() e chamado, todos tem dono.
  const passosLigados = /\bpasso\s*\(/.test(codigo);
  const porTabela = new Set(
    passosLigados
      ? tudo(/"([a-z0-9-]+)"/g, bloco(sons, "PASSO_DO_TILE: Record<number, ChaveEfeito> = {", "\n};") ?? "")
          .map((m) => m[1])
      : []
  );
  const orfaos = chavesEfeito.filter(
    (c) => !porTabela.has(c) && !new RegExp(`["'\`]${c}["'\`]`).test(codigo)
  );
  if (orfaos.length) {
    aviso("som", `${orfaos.length} som(ns) de EFEITOS que nenhuma cena toca`,
      `${orfaos.join(", ")} — ou falta a cena, ou o som ja nao serve e pode sair do catalogo`);
  }

  /* ---------------------------------------------- 11c. a voz e as falas */
  // VOZ da a altura da voz de cada personagem, e a chave e a mesma de DIALOGOS.
  // Se as duas listas discordarem, o personagem fala na voz neutra e ninguem ve:
  // e exatamente o tipo de desencontro silencioso que este arquivo existe para pegar.
  const vozes = tudo(/^\s*"?([a-z0-9-]+)"?:\s*-?\d+,/gm, bloco(sons, "export const VOZ: Record<string, number> = {", "\n};") ?? "")
    .map((m) => m[1]);
  const falantes = new Set(chavesDialogo);
  for (const v of vozes) {
    if (!falantes.has(v))
      aviso("som", `VOZ tem "${v}" e DIALOGOS nao`, "nome trocado, ou fala que ainda nao foi escrita");
  }
  for (const f of falantes) {
    if (!vozes.includes(f))
      aviso("som", `"${f}" fala e nao tem voz em VOZ`, "vai sair na altura neutra, igual a um objeto");
  }
}

/** Todo .ts abaixo de uma pasta, caminho relativo a raiz. */
function arquivosTs(pasta) {
  const saida = [];
  const cheio = join(RAIZ, pasta);
  if (!existsSync(cheio)) return saida;
  for (const nome of readdirSync(cheio)) {
    const rel = `${pasta}/${nome}`;
    if (statSync(join(RAIZ, rel)).isDirectory()) saida.push(...arquivosTs(rel));
    else if (nome.endsWith(".ts")) saida.push(rel);
  }
  return saida;
}

/** som.ts sem a funcao que so serve para carregar arquivo. Ver o comentario acima. */
function semCarregador(texto) {
  return texto.replace(/function arquivosDoCatalogo\(\)[\s\S]*?\n}\n/, "");
}

/* ------------------------------------------------------------------ relatorio */

const CORES = { ERRO: "\x1b[31m", AVISO: "\x1b[33m", ok: "\x1b[32m", fraco: "\x1b[90m", zero: "\x1b[0m" };
const erros = achados.filter((a) => a.nivel === "ERRO");
const avisos = achados.filter((a) => a.nivel === "AVISO");

if (!silencio) {
  const areas = [...new Set(achados.map((a) => a.area))];
  for (const area of areas) {
    console.log(`\n${CORES.fraco}${area}${CORES.zero}`);
    for (const a of achados.filter((x) => x.area === area)) {
      console.log(`  ${CORES[a.nivel]}${a.nivel}${CORES.zero}  ${a.msg}`);
      if (a.dica) console.log(`        ${CORES.fraco}${a.dica}${CORES.zero}`);
    }
  }
}

console.log("");
if (!achados.length) {
  console.log(`${CORES.ok}tudo certo.${CORES.zero} nenhum contrato quebrado.`);
} else {
  console.log(`${erros.length} erro(s), ${avisos.length} aviso(s).`);
}
process.exit(erros.length ? 1 : 0);
