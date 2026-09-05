#!/usr/bin/env node
/** O pre-voo das frentes paralelas do Reino de Aurora.
 *
 *  A skill "frentes" pede pra cada sessao ler ESTADO-DO-JOGO.md e FRENTES.md
 *  inteiros antes de mexer em qualquer arquivo, e escrever/atualizar a propria
 *  entrada ao sair. Isso funciona, mas depende de alguem lembrar de fazer tudo
 *  isso de cabeca — e a propria FRENTES.md tem historico de erro por causa
 *  disso: ESTADO-DO-JOGO.md que fica velho sem ninguem perceber, worktree que
 *  devia ter fechado e ninguem fechou, numero de documento repetido, stash que
 *  guarda trabalho de outra sessao e quase se perde.
 *
 *  Este script confere essas coisas de uma vez, sem interpretar nada — so
 *  olha para o que ja existe (arquivos, git, tamanhos, datas) e avisa.
 *
 *      npm run frente-check
 *      npm run frente-check src/cenas/Ficha.ts src/sistemas/estado.ts
 *
 *  Os arquivos depois do comando sao os que voce esta prestes a mexer: se
 *  algum ja estiver reivindicado por outra frente em "Acontecendo agora", vira
 *  ERRO em vez de aviso, porque essa e a colisao que a skill pede pra evitar
 *  antes de editar, nao depois.
 *
 *  Sai com codigo 1 se achar ERRO, 0 se achar so AVISO.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const silencio = process.argv.includes("--silencio");
const arquivosDaSessao = process.argv.slice(2).filter((a) => !a.startsWith("--"));

/* ------------------------------------------------------------------ achados */

const achados = [];
const erro = (area, msg, dica) => achados.push({ nivel: "ERRO", area, msg, dica });
const aviso = (area, msg, dica) => achados.push({ nivel: "AVISO", area, msg, dica });

/* ---------------------------------------------------------------------- git */

function git(...argumentos) {
  return execFileSync("git", argumentos, { encoding: "utf-8" }).trim();
}

function gitEm(caminho, ...argumentos) {
  return execFileSync("git", argumentos, { cwd: caminho, encoding: "utf-8" }).trim();
}

function sujo(caminho) {
  try {
    return gitEm(caminho, "status", "--porcelain").trim();
  } catch {
    return "";
  }
}

/** `a` ja esta inteiro dentro de `b`? */
function contido(a, b) {
  try {
    git("merge-base", "--is-ancestor", a, b);
    return true;
  } catch {
    return false;
  }
}

function worktrees() {
  const saida = [];
  let atual = null;
  for (const linha of git("worktree", "list", "--porcelain").split("\n")) {
    if (linha.startsWith("worktree ")) {
      atual = { caminho: linha.slice(9), galho: "" };
      saida.push(atual);
    } else if (linha.startsWith("branch ") && atual) {
      atual.galho = linha.slice(7).replace("refs/heads/", "");
    }
  }
  return saida;
}

// FRENTES.md e ESTADO-DO-JOGO.md vivem so uma vez, na pasta de integracao,
// fora do git de proposito (ver a skill "frentes"). git-common-dir aponta pra
// la de qualquer worktree, entao a mesma conta funciona nesta pasta ou em
// qualquer ambiente.
const PASTA_COMPARTILHADA = resolve(git("rev-parse", "--git-common-dir"), "..");
const RAIZ = process.cwd();

/* --------------------------------------------------------------- a leitura */

function ler(caminho) {
  return existsSync(caminho) ? readFileSync(caminho, "utf-8") : null;
}

const frentesMd = ler(join(PASTA_COMPARTILHADA, "FRENTES.md"));
const estadoMd = ler(join(PASTA_COMPARTILHADA, "ESTADO-DO-JOGO.md"));

if (!frentesMd) {
  aviso("frentes", "nao achei FRENTES.md", "projeto ainda sem o registro de frentes, ou pasta errada");
}

/* ------------------------------------------------------- acontecendo agora */

function seccao(texto, inicio, fim) {
  const i = texto.indexOf(inicio);
  if (i < 0) return "";
  const j = fim ? texto.indexOf(fim, i + inicio.length) : -1;
  return j < 0 ? texto.slice(i + inicio.length) : texto.slice(i + inicio.length, j);
}

/** "src/sistemas/{cursor, interativo,caminho}.ts" -> os tres caminhos separados. */
function expandirChaves(token) {
  const m = token.match(/^(.*)\{([^}]+)\}(.*)$/);
  if (!m) return [token];
  const [, antes, meio, depois] = m;
  return meio.split(",").map((parte) => `${antes}${parte.trim()}${depois}`);
}

const EXTENSAO_DE_ARQUIVO = /\.(ts|tsx|mjs|py|json|md|html|css)$/;

/** Todo caminho de arquivo citado entre crases num pedaco de texto. */
function arquivosCitados(texto) {
  const tokens = [...texto.matchAll(/`([^`]+)`/g)].map((m) => m[1].replace(/\s+/g, ""));
  const achados = new Set();
  for (const token of tokens) {
    for (const caminho of expandirChaves(token)) {
      if (EXTENSAO_DE_ARQUIVO.test(caminho)) achados.add(caminho);
    }
  }
  return achados;
}

if (frentesMd) {
  const blocoAcontecendo = seccao(frentesMd, "## Acontecendo agora", "\n## Pedidos entre frentes");
  const pedacos = blocoAcontecendo.split(/^### /m).slice(1); // o [0] e o que vem antes do primeiro "### "
  const entradas = pedacos.map((pedaco) => {
    const quebra = pedaco.indexOf("\n");
    return quebra < 0 ? [pedaco, ""] : [pedaco.slice(0, quebra), pedaco.slice(quebra + 1)];
  });

  const nomesDeWorktree = new Set(worktrees().map((w) => basename(w.caminho)));
  const reivindicantesPorArquivo = new Map(); // arquivo -> [{galho, pasta}]

  for (const [titulo, corpo] of entradas) {
    const [galho, ...resto] = titulo.split(" . ");
    const pastaCrua = resto.join(" . ").trim().split(/[\s(]/)[0];
    const pastaDeclarada = pastaCrua ? basename(pastaCrua) : "";

    if (galho.trim() !== "principal" && pastaDeclarada && !nomesDeWorktree.has(pastaDeclarada)) {
      aviso(
        "acontecendo-agora",
        `"${titulo.trim()}" aponta pra uma pasta que nao existe mais entre os worktrees atuais`,
        "mova essa entrada pra Entregue, ou apague se o trabalho nunca saiu do papel",
      );
    }

    for (const arquivo of arquivosCitados(corpo)) {
      const lista = reivindicantesPorArquivo.get(arquivo) ?? [];
      if (!lista.some((r) => r.galho === galho)) lista.push({ galho, pasta: pastaDeclarada });
      reivindicantesPorArquivo.set(arquivo, lista);
    }
  }

  for (const [arquivo, reivindicantes] of reivindicantesPorArquivo) {
    if (reivindicantes.length > 1) {
      const galhos = reivindicantes.map((r) => r.galho).join(", ");
      aviso(
        "acontecendo-agora",
        `"${arquivo}" aparece em mais de uma frente em Acontecendo agora: ${galhos}`,
        "pode ja estar resolvido em prosa mais abaixo — confirme antes de mexer",
      );
    }
  }

  for (const arquivoPedido of arquivosDaSessao) {
    const normalizado = arquivoPedido.replace(/^\.\//, "");
    const dono = [...reivindicantesPorArquivo.entries()].find(
      ([arquivo]) => arquivo === normalizado || arquivo.endsWith(`/${normalizado}`) || normalizado.endsWith(`/${arquivo}`),
    );
    if (dono) {
      const galhos = dono[1].map((r) => r.galho).join(", ");
      erro(
        "colisao",
        `"${arquivoPedido}" ja esta reivindicado em Acontecendo agora por: ${galhos}`,
        "pare e fale com o Hugo antes de editar (skill frentes) em vez de mexer direto",
      );
    }
  }
}

/* ------------------------------------------------------------ estado do jogo */

if (frentesMd && !estadoMd) {
  aviso("estado-do-jogo", "FRENTES.md existe mas ESTADO-DO-JOGO.md nao", "pasta de integracao incompleta");
}

if (frentesMd && estadoMd) {
  const mtimeEstado = statSync(join(PASTA_COMPARTILHADA, "ESTADO-DO-JOGO.md")).mtime;
  const dataMtime = mtimeEstado.toISOString().slice(0, 10);

  // procura, em FRENTES.md, qualquer trecho que fale de ESTADO-DO-JOGO.md
  // junto de uma palavra de "isto ficou pra tras" — e um sinal que uma sessao
  // anterior ja deixou escrito, na propria entrega, que o arquivo nao reflete
  // a realidade.
  let cursor = 0;
  while (true) {
    const i = frentesMd.indexOf("ESTADO-DO-JOGO.md", cursor);
    if (i < 0) break;
    cursor = i + 1;
    const janela = frentesMd.slice(Math.max(0, i - 600), i + 600);
    if (!/desatualiz/i.test(janela)) continue;

    const antesDoAviso = frentesMd.slice(0, i);
    const datas = [...antesDoAviso.matchAll(/\*\*(\d{4}-\d{2}-\d{2})\s*\.?/g)];
    const dataDoAviso = datas.length ? datas[datas.length - 1][1] : null;
    if (dataDoAviso && dataDoAviso >= dataMtime) {
      aviso(
        "estado-do-jogo",
        `uma entrega de ${dataDoAviso} marcou ESTADO-DO-JOGO.md como desatualizado, e ele nao foi editado desde entao (ultima escrita: ${dataMtime})`,
        "leia o trecho em FRENTES.md perto dessa data e atualize a secao certa antes de confiar no arquivo",
      );
    }
  }
}

/* -------------------------------------------------------------------- stash */

const listaDeStash = git("stash", "list");
if (listaDeStash) {
  aviso(
    "stash",
    `ha ${listaDeStash.split("\n").length} entrada(s) no git stash`,
    "ja aconteceu de um stash guardar trabalho de outra sessao durante um merge — confira com `git stash list`/`git stash show` antes de aplicar ou descartar",
  );
}

/* ---------------------------------------------------------------- worktrees */

const listaDeWorktrees = worktrees();
for (let i = 1; i < listaDeWorktrees.length; i++) {
  const w = listaDeWorktrees[i];
  if (!existsSync(w.caminho)) {
    erro("worktrees", `o git ainda lista ${w.caminho}, mas a pasta nao existe`, "rode: git worktree prune");
    continue;
  }
  let cabeca;
  try {
    cabeca = gitEm(w.caminho, "rev-parse", "HEAD");
  } catch {
    continue;
  }
  const juntada = contido(cabeca, "principal");
  const suja = sujo(w.caminho);
  if (juntada && !suja) {
    aviso(
      "worktrees",
      `${w.galho} (${w.caminho}) ja esta inteira em principal e sem mudanca pendente`,
      `pronta pra fechar: npm run ambiente fechar <nome>, ou git worktree remove ${w.caminho}`,
    );
  } else if (juntada && suja) {
    aviso(
      "worktrees",
      `${w.galho} (${w.caminho}) ja esta em principal mas ainda tem mudanca nao commitada`,
      "confira se nao e lixo antes de decidir",
    );
  }
}

/* --------------------------------------------------------------- documentos */

const pastaDocs = join(RAIZ, "docs");
if (existsSync(pastaDocs)) {
  const porNumero = new Map();
  for (const nome of readdirSync(pastaDocs)) {
    const m = nome.match(/^(\d{2})-.*\.md$/);
    if (!m) continue;
    const numero = m[1];
    const lista = porNumero.get(numero) ?? [];
    lista.push(nome);
    porNumero.set(numero, lista);
  }
  for (const [numero, nomes] of porNumero) {
    if (nomes.length > 1) {
      erro("documentos", `numero ${numero} usado por mais de um documento: ${nomes.join(", ")}`, "renumere um deles");
    }
  }
}

/* ---------------------------------------------------------------- capturas */

const pastaTelas = join(RAIZ, "ferramentas", "telas");
const pastaCenas = join(RAIZ, "src", "cenas");
if (existsSync(pastaTelas) && existsSync(pastaCenas)) {
  const pngs = readdirSync(pastaTelas).filter((n) => n.endsWith(".png"));
  if (pngs.length) {
    const mtimeCapturas = Math.max(...pngs.map((n) => statSync(join(pastaTelas, n)).mtimeMs));
    let epocaCenas = null;
    try {
      const segundos = gitEm(RAIZ, "log", "-1", "--format=%ct", "--", "src/cenas");
      if (segundos) epocaCenas = Number(segundos) * 1000;
    } catch {
      epocaCenas = null;
    }
    if (epocaCenas && epocaCenas > mtimeCapturas) {
      aviso(
        "capturas",
        "src/cenas mudou depois da ultima captura em ferramentas/telas",
        "rode npm run auditar antes de confiar nos screenshots como prova de tela",
      );
    }
  }
}

/* ------------------------------------------------------------------ registro */

if (frentesMd) {
  const tamanho = statSync(join(PASTA_COMPARTILHADA, "FRENTES.md")).size;
  const LIMIAR = 60_000;
  if (tamanho > LIMIAR) {
    aviso(
      "registro",
      `FRENTES.md esta com ${Math.round(tamanho / 1024)} KB`,
      "considere mover as entregas mais antigas de Entregue para FRENTES.md.anterior (o proprio projeto ja faz isso)",
    );
  }
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
  console.log(`${CORES.ok}tudo limpo.${CORES.zero} nenhuma frente em risco de colisao agora.`);
} else {
  console.log(`${erros.length} erro(s), ${avisos.length} aviso(s).`);
}
process.exit(erros.length ? 1 : 0);
