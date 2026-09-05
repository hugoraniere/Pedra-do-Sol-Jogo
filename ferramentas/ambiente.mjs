/** Ambientes de trabalho paralelos.
 *
 * Uma frente de trabalho por pasta, cada pasta um worktree do git com o seu
 * proprio galho, as suas proprias portas e os seus proprios saves. Duas conversas
 * podem mexer no jogo ao mesmo tempo sem uma desfazer a outra e sem uma auditar a
 * tela da outra achando que e a sua.
 *
 *   npm run ambiente listar
 *   npm run ambiente criar pistas "sistema de pistas e diario"
 *   npm run ambiente atualizar
 *   npm run ambiente fechar pistas
 *
 * TODA FRENTE TRABALHA EM CIMA DA ULTIMA VERSAO, e isso e garantido aqui, nao
 * pela boa memoria de quem abre a conversa. `criar` se recusa a nascer de um
 * `principal` que esta atras do que a pasta de integracao ja tem, e `atualizar`
 * puxa o principal para dentro de cada frente limpa de uma vez so.
 *
 * As regras de convivencia estao em docs/12-ambientes-paralelos.md.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { LIMITE, RAIZ } from "./ambiente-atual.mjs";

const GALHO_BASE = "principal";

function git(...argumentos) {
  return execFileSync("git", argumentos, { cwd: RAIZ, encoding: "utf-8" }).trim();
}

/** Onde ficam as pastas dos ambientes: ao lado do repositorio, todas juntas. */
function pastaDosAmbientes() {
  const principal = integracao().caminho;
  return join(dirname(principal), `${basename(principal)}-ambientes`);
}

/** A pasta de integracao e a PRIMEIRA que o git lista, sempre.
 *
 *  Nao da para acha-la pelo numero 0: worktree sem `.ambiente` tambem cai em 0,
 *  e o proprio Claude Code cria os dele em .claude/worktrees. Ja teve mais de um
 *  zero na lista, e quem chegasse primeiro decidia onde os ambientes iam nascer. */
function integracao() {
  return worktrees()[0];
}

function lerAmbiente(caminho) {
  try {
    const lido = JSON.parse(readFileSync(join(caminho, ".ambiente"), "utf-8"));
    return { numero: Number(lido.numero), nome: lido.nome, dominio: lido.dominio ?? "" };
  } catch {
    return { numero: 0, nome: "principal", dominio: "integracao" };
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
  return saida
    // .claude/worktrees e do proprio Claude Code, nao e frente de trabalho
    .filter((w, i) => i === 0 || !w.caminho.includes("/.claude/worktrees/"))
    .map((w) => ({ ...w, ...lerAmbiente(w.caminho) }));
}

function sujo(caminho) {
  return execFileSync("git", ["status", "--porcelain"], { cwd: caminho, encoding: "utf-8" }).trim();
}

function gitEm(caminho, ...argumentos) {
  return execFileSync("git", argumentos, { cwd: caminho, encoding: "utf-8" }).trim();
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

/** Quantos commits do principal esta pasta ainda nao tem. */
function atras(caminho) {
  return Number(gitEm(caminho, "rev-list", "--count", `HEAD..${GALHO_BASE}`));
}

function listar() {
  const lista = worktrees().sort((a, b) => a.numero - b.numero);
  console.log("");
  for (const w of lista) {
    const marca = resolve(w.caminho) === resolve(RAIZ) ? "voce esta aqui" : "";
    const pendente = sujo(w.caminho) ? "com mudanca nao commitada" : "limpo";
    const n = atras(w.caminho);
    // o atraso e o numero que mais importa nesta lista: frente atrasada resolve
    // conflito que ja foi resolvido e reescreve codigo que ja mudou
    const idade = n === 0 ? "em dia" : `${n} commit(s) atras do ${GALHO_BASE}`;
    console.log(`  ${w.numero}  ${(w.nome ?? "?").padEnd(14)} ${w.galho.padEnd(22)} ${pendente}, ${idade}  ${marca}`);
    console.log(`     ${w.caminho}`);
    if (w.dominio) console.log(`     cuida de: ${w.dominio}`);
    if (w.numero > 0) console.log(`     vite ${5173 + w.numero * 10}, auditoria ${4188 + w.numero * 10}`);
    console.log("");
  }
}

function criar(nome, dominio) {
  if (!/^[a-z][a-z0-9-]{1,20}$/.test(nome ?? "")) {
    erro("o nome do ambiente e minusculo, sem acento, sem espaco. exemplo: pistas");
  }
  const existentes = worktrees();
  if (existentes.some((w) => w.nome === nome)) erro(`ja existe um ambiente chamado ${nome}`);

  const usados = new Set(existentes.map((w) => w.numero));
  let numero = 1;
  while (usados.has(numero)) numero++;
  if (numero > LIMITE) erro(`so cabem ${LIMITE} ambientes ao mesmo tempo. feche um antes`);

  const pasta = join(pastaDosAmbientes(), nome);
  if (existsSync(pasta)) erro(`a pasta ${pasta} ja existe`);
  mkdirSync(dirname(pasta), { recursive: true });

  // A GARANTIA: ambiente novo nasce da ultima versao, sempre.
  //
  // Ja aconteceu de a pasta de integracao estar num galho proprio enquanto o
  // `principal` ficava para tras. Quem criasse uma frente ali nascia sem o
  // trabalho do dia, descobria isso horas depois, e ainda tinha um merge feio
  // pela frente. O git nao reclama disso: os dois sao commits validos.
  const casa = integracao();
  const cabeca = gitEm(casa.caminho, "rev-parse", "HEAD");
  if (!contido(cabeca, GALHO_BASE)) {
    erro(
      `${GALHO_BASE} esta atras da pasta de integracao (${casa.galho}), e o ambiente\n` +
      `  novo nasceria sem o que ja foi feito. Leve o trabalho para ${GALHO_BASE} antes:\n\n` +
      `      git -C ${casa.caminho} checkout ${GALHO_BASE}\n` +
      `      git -C ${casa.caminho} merge ${casa.galho}\n`,
    );
  }

  const pendente = sujo(RAIZ);
  git("worktree", "add", "-b", `ambiente/${nome}`, pasta, GALHO_BASE);

  writeFileSync(
    join(pasta, ".ambiente"),
    `${JSON.stringify({ numero, nome, dominio: dominio ?? "" }, null, 2)}\n`,
  );
  writeFileSync(join(pasta, "AMBIENTE.md"), folhaDeRosto(numero, nome, dominio));

  // node_modules apontando para o do principal: sao 200 MB e as dependencias sao
  // as mesmas. Se alguem mexer em package.json, o ambiente instala o seu proprio.
  const modulos = join(RAIZ, "node_modules");
  if (existsSync(modulos)) symlinkSync(modulos, join(pasta, "node_modules"), "dir");

  console.log(`\n  ambiente ${numero}, ${nome}, criado`);
  console.log(`  pasta:  ${pasta}`);
  console.log(`  galho:  ambiente/${nome}`);
  console.log(`  vite ${5173 + numero * 10}, auditoria ${4188 + numero * 10}, conferencia ${4191 + numero * 10}`);
  if (pendente) {
    console.log(`\n  atencao: ${pendente.split("\n").length} arquivo(s) nao commitado(s) ficaram`);
    console.log("  na pasta principal. O ambiente novo nasceu do ultimo commit e nao os tem.");
  }
  console.log(`\n  abra uma conversa nova com esta pasta e leia AMBIENTE.md antes de mexer.\n`);
}

/** Puxa o principal para dentro de cada frente. O mutirao que antes era na mao.
 *
 *  So avanca o que da para avancar sem decidir nada: pasta suja fica de fora, e
 *  frente que ja tem commit proprio divergindo tambem, porque juntar as duas
 *  pontas e uma decisao com conflito no meio, e conflito se resolve dentro do
 *  ambiente, com quem sabe o que aquele trabalho estava fazendo. */
function atualizar() {
  const lista = worktrees().filter((w) => w.numero > 0);
  console.log("");
  if (!lista.length) console.log("  nenhuma frente aberta.\n");
  let mexeu = 0;
  for (const w of lista) {
    const n = atras(w.caminho);
    const nome = (w.nome ?? "?").padEnd(14);
    if (n === 0) {
      console.log(`  ${nome} ja estava em dia`);
      continue;
    }
    if (sujo(w.caminho)) {
      console.log(`  ${nome} PULADA: tem mudanca nao commitada. commite e rode de novo`);
      continue;
    }
    try {
      gitEm(w.caminho, "merge", "--ff-only", GALHO_BASE);
      console.log(`  ${nome} avancou ${n} commit(s)`);
      mexeu++;
    } catch {
      console.log(`  ${nome} PULADA: tem commit proprio fora do ${GALHO_BASE}.`);
      console.log(`  ${" ".repeat(14)} junte a mao la dentro:  git -C ${w.caminho} merge ${GALHO_BASE}`);
    }
  }
  console.log(`\n  ${mexeu} frente(s) atualizada(s).\n`);
}

function fechar(nome, forcar) {
  const alvo = worktrees().find((w) => w.nome === nome && w.numero > 0);
  if (!alvo) erro(`nao achei o ambiente ${nome}`);
  if (!forcar) {
    if (sujo(alvo.caminho)) erro(`${nome} tem mudanca nao commitada. commite, ou use --forcar`);
    // o git marca com "+" o galho que esta aberto em outro worktree, e com "*" o
    // do worktree atual. Todo galho de ambiente esta aberto no worktree dele, ou
    // seja: sem tirar o "+", nenhuma frente jamais parecia fundida, e fechar so
    // funcionava com --forcar, que e justamente o que joga trabalho fora.
    const juntados = git("branch", "--merged", GALHO_BASE)
      .split("\n")
      .map((l) => l.trim().replace(/^[*+]\s+/, ""));
    if (!juntados.includes(alvo.galho)) {
      erro(`${alvo.galho} ainda nao entrou em ${GALHO_BASE}. junte antes, ou use --forcar`);
    }
  }
  git("worktree", "remove", ...(forcar ? ["--force"] : []), alvo.caminho);
  console.log(`\n  ambiente ${nome} fechado.`);
  console.log(`  o galho ainda existe. para apagar:  git branch -d ${alvo.galho}\n`);
}

function folhaDeRosto(numero, nome, dominio) {
  return `# Ambiente ${numero}: ${nome}

Esta pasta e uma frente de trabalho paralela do Reino de Aurora. Existem outras,
mexendo no mesmo jogo ao mesmo tempo. Leia isto antes da primeira alteracao.

## O que esta pasta cuida

${dominio || "(ninguem escreveu ainda. escreva aqui o que esta frente pode tocar.)"}

**So mexa no que esta escrito acima.** Se o trabalho pedir um arquivo de outra
frente, pare e fale com o Hugo. Duas frentes mexendo no mesmo arquivo e o unico
jeito de este esquema dar errado.

## Numeros desta pasta

- galho: \`ambiente/${nome}\`
- \`npm run dev\` sobe em http://localhost:${5173 + numero * 10}
- \`npm run auditar\` usa a porta ${4188 + numero * 10}, \`npm run conferir\` usa a ${4191 + numero * 10}
- os saves do navegador sao so desta porta, e os do aplicativo ficam em \`saves-ambiente-${numero}\`
- \`node_modules\` e um atalho para o da pasta principal. Se voce mexer nas
  dependencias em package.json, apague o atalho e rode \`npm install\` aqui.

## Fique em cima da ultima versao

Esta pasta nasceu do \`${GALHO_BASE}\` do dia em que foi criada, e o jogo anda
sem ela. Antes de comecar cada sessao de trabalho:

\`\`\`bash
git merge principal
\`\`\`

Frente atrasada resolve conflito que ja foi resolvido e reescreve codigo que ja
mudou. Da pasta principal, \`npm run ambiente listar\` diz quantos commits cada
frente esta atras, e \`npm run ambiente atualizar\` avanca todas as que estao
limpas de uma vez.

## Antes de dizer que terminou

\`npm run build\`, \`npm run verificar\`, \`npm run auditar\` e \`npm run conferir\`
limpos, e o jogo abrindo sem erro no console. Depois \`git merge principal\` aqui,
resolver o que der conflito aqui, e so entao levar para \`principal\`.

O resto das regras esta em \`docs/12-ambientes-paralelos.md\`.
`;
}

function erro(mensagem) {
  console.error(`\n  ${mensagem}\n`);
  process.exit(1);
}

const [comando, ...resto] = process.argv.slice(2);
const forcar = resto.includes("--forcar");
const argumentos = resto.filter((a) => a !== "--forcar");

if (comando === "listar" || comando === undefined) listar();
else if (comando === "criar") criar(argumentos[0], argumentos.slice(1).join(" "));
else if (comando === "atualizar") atualizar();
else if (comando === "fechar") fechar(argumentos[0], forcar);
else erro("comandos: listar, criar <nome> [do que cuida], atualizar, fechar <nome> [--forcar]");
