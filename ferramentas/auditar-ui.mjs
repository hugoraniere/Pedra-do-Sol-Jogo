/** Auditoria de UI tela por tela.
 *
 * Abre o jogo num navegador de verdade, passa por cada tela, chama auditarUI()
 * dentro da pagina e junta tudo num relatorio. Tambem salva um screenshot de cada
 * tela em ferramentas/telas/, para olhar depois.
 *
 * Rode com:  npm run auditar
 * Precisa do build pronto:  npm run build
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { porta } from "./ambiente-atual.mjs";

const PORTA = porta(4188);
const RAIZ = new URL("../dist/", import.meta.url).pathname;
const PASTA_TELAS = new URL("./telas/", import.meta.url).pathname;

const TIPOS = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".json": "application/json", ".xml": "text/xml",
  ".woff2": "font/woff2", ".jpg": "image/jpeg",
};

function servidor() {
  return createServer(async (req, res) => {
    try {
      let caminho = normalize(join(RAIZ, decodeURIComponent(req.url.split("?")[0])));
      if (!caminho.startsWith(RAIZ)) throw new Error("fora da raiz");
      if ((await stat(caminho)).isDirectory()) caminho = join(caminho, "index.html");
      res.writeHead(200, { "content-type": TIPOS[extname(caminho)] ?? "application/octet-stream" });
      res.end(await readFile(caminho));
    } catch {
      res.writeHead(404).end("nao encontrado");
    }
  });
}

const http = servidor();
await new Promise((r) => http.listen(PORTA, r));
await mkdir(PASTA_TELAS, { recursive: true });

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? undefined,
  args: ["--no-sandbox"],
});
const pagina = await navegador.newPage({ viewport: { width: 960, height: 576 } });

const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e.message)));
pagina.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("404")) erros.push(m.text());
});

await pagina.goto(`http://localhost:${PORTA}/`, { waitUntil: "networkidle" });
await pagina.waitForTimeout(2500);

/** A resolucao logica nao e mais uma de tres opcoes: o canvas enche a janela e o
 *  tamanho logico e o que sobra da divisao pela escala inteira, entao ele muda
 *  com o tamanho da janela E com a visao escolhida. Nada de guardar a escala:
 *  cada clique pergunta de novo onde o canvas esta e de que tamanho o jogo se
 *  considera. Foi assim que a auditoria continuou valendo depois que o zoom
 *  deixou de ser zoom de camera e virou troca de resolucao. */
async function clicar(x, y) {
  const caixa = await pagina.locator("canvas").boundingBox();
  const largura = await pagina.evaluate(() => window.jogo.scale.width);
  const escala = caixa.width / largura;
  await pagina.mouse.click(caixa.x + x * escala, caixa.y + y * escala);
}

/** ponto dado em fracao da tela, para o que nao e botao com rotulo */
async function clicarRelativo(fx, fy) {
  const t = await pagina.evaluate(() => ({
    largura: window.jogo.scale.width,
    altura: window.jogo.scale.height,
  }));
  await clicar(Math.round(t.largura * fx), Math.round(t.altura * fy));
}

/** Clica num texto pelo comeco do que ele diz. Mesmo motivo do clicarBotao: a
 *  dica de sortear o nome mudou de altura junto com o layout, e um clique em
 *  fracao da tela passou a cair na caixa do nome sem ninguem perceber. */
async function clicarTexto(inicio) {
  const ponto = await pagina.evaluate((alvo) => {
    const achatar = (l) => l.flatMap((o) => (Array.isArray(o.list) ? [o, ...achatar(o.list)] : [o]));
    for (const cena of window.jogo.scene.getScenes(true)) {
      const t = achatar(cena.children.list).find(
        (o) => o.getData?.("ui")?.tipo === "texto" && String(o.getData("ui").dono ?? "").startsWith(alvo)
      );
      if (t) {
        const r = t.getBounds();
        return { x: r.centerX, y: r.centerY };
      }
    }
    return null;
  }, inicio);
  if (!ponto) throw new Error(`texto nao encontrado: ${inicio}`);
  await clicar(ponto.x, ponto.y);
  await pagina.waitForTimeout(350);
}

/** Clica num botao pelo rotulo, nao pela coordenada. Assim mexer no layout nao
 *  quebra a auditoria, que e justamente quem deveria pegar o estrago do layout. */
async function clicarBotao(rotulo) {
  const ponto = await pagina.evaluate((alvo) => {
    const achatar = (l) => l.flatMap((o) => (Array.isArray(o.list) ? [o, ...achatar(o.list)] : [o]));
    for (const cena of window.jogo.scene.getScenes(true)) {
      const b = achatar(cena.children.list).find(
        (o) => o.getData?.("ui")?.tipo === "botao" && o.getData("ui").dono === alvo
      );
      if (b) return { x: b.x, y: b.y };
    }
    return null;
  }, rotulo);
  if (!ponto) throw new Error(`botao nao encontrado: ${rotulo}`);
  await clicar(ponto.x, ponto.y);
  await pagina.waitForTimeout(350);
}

/** Le o nome curto da opcao que a vitrine de raca/classe mostra agora.
 *  A vitrine mostra um boneco por vez (ver Criacao.ts), e o rotulo embaixo
 *  dele vem marcado com esse nome curto -- e assim que a auditoria sabe onde
 *  parou sem precisar contar cliques. */
async function opcaoNaVitrine() {
  return pagina.evaluate(() => {
    const achatar = (l) => l.flatMap((o) => (Array.isArray(o.list) ? [o, ...achatar(o.list)] : [o]));
    for (const cena of window.jogo.scene.getScenes(true)) {
      // o rotulo da vitrine e um nome curto, so letras, uma palavra ("Anao",
      // "Mago"). O titulo da tela ("Escolha sua raca") tem espaco, e as setas
      // "<" / ">" da propria vitrine nao sao letra nenhuma: e assim que os
      // tres se distinguem do rotulo, sem repetir a lista de racas e classes
      // aqui (ela ja mora em conteudo.ts, fonte da verdade).
      const t = achatar(cena.children.list).find((o) => {
        const m = o.getData?.("ui");
        return m?.tipo === "texto" && m.dono && /^[A-Za-zÀ-ÿ]{2,}$/.test(m.dono);
      });
      if (t) return t.getData("ui").dono;
    }
    return null;
  });
}

/** Clica em ">" ate a vitrine mostrar `curto`. So existe um boneco por vez
 *  agora (antes eram cinco lado a lado, cada um com seu proprio botao) --
 *  isto e o que substitui `clicarBotao(nomeDaRaca)` de quando a vitrine
 *  mostrava todo mundo de uma vez. O limite de tentativas e o tamanho da
 *  lista mais um: se nao achar nesse tanto de cliques, a opcao nao existe. */
async function irParaOpcaoDaVitrine(curto, tentativas = 6) {
  for (let i = 0; i < tentativas; i++) {
    if ((await opcaoNaVitrine()) === curto) return;
    await clicarBotao("vitrine-proxima");
  }
  throw new Error(`vitrine nao chegou em "${curto}" depois de ${tentativas} cliques em ">"`);
}

/** O nome do heroi nos testes.
 *
 *  O percurso sorteava o nome, e o sorteio escolhe um de cinco a cada rodada:
 *  todo screenshot que mostra o nome mudava sozinho, sem nada ter mudado na tela.
 *  PNG instavel em pasta versionada vira conflito de imagem no merge, e conflito
 *  de imagem nao se resolve. Com o nome fixo, um screenshot so muda quando a UI
 *  muda de verdade, e ai o diff quer dizer alguma coisa.
 *
 *  O nome e o do heroi que o Lele criou na mesa. */
const NOME_DO_HEROI = "Trovao Floresta"; // 15 letras: LETRAS_DO_NOME em Criacao.ts e 16, e "Trovao da Floresta" (18) nao cabe

async function digitarNome() {
  await pagina.keyboard.type(NOME_DO_HEROI, { delay: 20 });
  await pagina.waitForTimeout(250);
}

const telas = [];

/** Para toda animacao no primeiro quadro dela, para o screenshot ser sempre o
 *  mesmo, e devolve quantas parou.
 *
 *  Sem isto a tela sai diferente de uma rodada para a outra sem nada ter mudado
 *  no jogo. O culpado e a respiracao: a pose "parado" tem dois quadros, um de
 *  2200 ms e outro de 700 ms, entao mais ou menos uma captura em cada quatro
 *  pega o personagem no meio do suspiro. O PNG entra no git, e o diff vira uma
 *  mudanca que ninguem fez, em qualquer pasta, a qualquer hora. E pior do que
 *  parece: um screenshot que muda sozinho ensina a ignorar screenshot que muda.
 *
 *  ESCOLHE O QUADRO PRIMEIRO E PARA DEPOIS, e a ordem nao e detalhe. O
 *  setCurrentFrame do Phaser so avisa a troca de quadro (ANIMATION_UPDATE) se a
 *  animacao ainda estiver tocando. Parando antes, o heroi sai montado errado: o
 *  corpo pula para o quadro 0 e a roupa e a arma ficam nos pontos de encaixe do
 *  quadro anterior, porque quem as pendura e justamente esse evento. Nao ha
 *  risco na ordem certa: entre as duas linhas o jogo nao roda, e o laco de
 *  animacao nao avanca no meio de um bloco sincrono. */
async function congelar() {
  return pagina.evaluate(() => {
    // o relogio de jogo tambem precisa parar pro screenshot: sem isto, o
    // ceu da Vila Semente muda de tom a cada rodada de auditoria por causa
    // da hora, nao da UI, e ferramentas/telas/10-mundo.png nunca fica igual
    // de uma rodada pra outra. Meio-dia = ceu limpo, sem overlay nenhum.
    const mundo = window.jogo.scene.getScene("Mundo");
    mundo?.travarRelogioParaAuditoria?.(720);
    const achatar = (l) => l.flatMap((o) => (Array.isArray(o.list) ? [o, ...achatar(o.list)] : [o]));
    const parados = [];
    for (const cena of window.jogo.scene.getScenes(true)) {
      for (const o of achatar(cena.children.list)) {
        if (!o.anims?.isPlaying || !o.anims.currentAnim) continue;
        o.anims.setCurrentFrame(o.anims.currentAnim.frames[0]);
        o.anims.pause();
        parados.push(o);
      }
    }
    window.__congelados = parados;
    return parados.length;
  });
}

/** Solta o que congelar() parou. A auditoria continua clicando depois da foto,
 *  e cena com animacao parada nao e o jogo que o jogador ve. */
async function descongelar() {
  await pagina.evaluate(() => {
    (window.__congelados ?? []).forEach((o) => o.anims?.resume());
    window.__congelados = undefined;
  });
}

async function olhar(nome) {
  await pagina.waitForTimeout(500);
  await congelar();
  await pagina.screenshot({ path: join(PASTA_TELAS, `${nome}.png`) });
  await descongelar();
  const achados = await pagina.evaluate(() => window.auditarUI());
  const contagem = await pagina.evaluate(() => {
    const conta = (lista) =>
      lista.reduce((n, o) => n + 1 + (Array.isArray(o.list) ? conta(o.list) : 0), 0);
    return window.jogo.scene
      .getScenes(true)
      .map((c) => `${c.scene.key}:${conta(c.children.list)}`)
      .join(" ");
  });
  telas.push({ nome, contagem, problemas: achados });
  return achados.map((p) => ({ ...p, tela: nome }));
}

const problemas = [];

// ----------------------------------------------------------- percurso
problemas.push(...(await olhar("01-titulo")));

await clicarBotao("NOVO JOGO");
problemas.push(...(await olhar("02-criacao-raca")));
// trocar a raca e o que o boneco da vitrine precisa provar: ele muda de corpo,
// nao so de cor, quando a seta passa de raca em raca
await irParaOpcaoDaVitrine("Anao");
problemas.push(...(await olhar("03-criacao-raca-anao")));
await clicarBotao("SEGUIR >");
problemas.push(...(await olhar("04-criacao-classe")));
await irParaOpcaoDaVitrine("Mago");
problemas.push(...(await olhar("05-criacao-classe-mago")));
await clicarBotao("SEGUIR >");
problemas.push(...(await olhar("06-criacao-poder")));
await clicarBotao("SEGUIR >");
problemas.push(...(await olhar("07-criacao-heroi")));
await digitarNome();
problemas.push(...(await olhar("08-criacao-heroi-com-nome")));
// o heroi comeca de roupa simples e sem arma (o padrao, ja na tela); COM ARMA
// so espia o equipamento da classe, sem comprometer o que vai ser salvo
await clicarBotao("COM ARMA");
problemas.push(...(await olhar("09-criacao-com-arma")));
await clicarBotao("SEM ARMA");

await clicarBotao("COMECAR A AVENTURA");
await pagina.waitForTimeout(1500);
problemas.push(...(await olhar("10-mundo")));

await clicarBotao("FICHA");        // o nome do heroi no topo abre a ficha
await pagina.waitForTimeout(500);
problemas.push(...(await olhar("11-janela-eu")));
for (const aba of ["PODERES", "MAGIAS", "MOCHILA", "DIARIO", "MENU"]) {
  await clicarBotao(aba);
  problemas.push(...(await olhar(`11-janela-${aba.toLowerCase()}`)));
}
await clicarBotao("FECHAR");
await pagina.waitForTimeout(500);

await clicarRelativo(0.97, 0.042); // engrenagem de pausa no topo
await pagina.waitForTimeout(500);
problemas.push(...(await olhar("12-pausa")));
await clicarBotao("CONFIGURACOES");
problemas.push(...(await olhar("13-configuracoes")));
await clicarBotao("< VOLTAR");            // volta de config para o menu de pausa
await clicarBotao("SAIR PARA O MENU");
await pagina.waitForTimeout(1400);
problemas.push(...(await olhar("14-titulo-com-save")));
await clicarBotao("CARREGAR JOGO");
problemas.push(...(await olhar("15-carregar")));

// ------------------------------------- a criacao nas outras duas visoes
/** A visao escolhida nao e zoom de camera nem resolucao fixa: e um degrau na
 *  escala inteira, e cada degrau da uma resolucao logica diferente nesta janela.
 *  O percurso de cima roda na visao do meio, e por isso passou anos verde
 *  enquanto a tela de criacao se quebrava na visao mais apertada, onde a grade
 *  de botoes subia por cima do palco do boneco. Aqui a criacao inteira roda de
 *  novo nas outras duas, que e onde a conta de altura aperta. */
async function criacaoNaVisao(zoom) {
  await pagina.evaluate(
    (z) => localStorage.setItem("aurora-preferencias", JSON.stringify({ zoom: z, som: true })),
    zoom
  );
  await pagina.reload({ waitUntil: "networkidle" });
  await pagina.waitForTimeout(2500);
  await clicarBotao("NOVO JOGO");
  problemas.push(...(await olhar(`${zoom}-02-criacao-raca`)));
  // o Pequenino e o nome mais longo da vitrine: e ele que aperta a moldura
  // em 256 px, onde o nome inteiro as vezes nao cabe e cai para o nome curto
  await irParaOpcaoDaVitrine("Pequenino");
  problemas.push(...(await olhar(`${zoom}-03-criacao-raca-pequenino`)));
  await clicarBotao("SEGUIR >");
  problemas.push(...(await olhar(`${zoom}-04-criacao-classe`)));
  await irParaOpcaoDaVitrine("Cavaleiro");
  problemas.push(...(await olhar(`${zoom}-05-criacao-classe-cavaleiro`)));
  await clicarBotao("SEGUIR >");
  problemas.push(...(await olhar(`${zoom}-06-criacao-poder`)));
  await clicarBotao("SEGUIR >");
  problemas.push(...(await olhar(`${zoom}-07-criacao-heroi`)));
  await digitarNome();
  problemas.push(...(await olhar(`${zoom}-08-criacao-heroi-com-nome`)));
  await clicarBotao("COM ARMA");
  problemas.push(...(await olhar(`${zoom}-09-criacao-com-arma`)));
}

await criacaoNaVisao("perto");
await criacaoNaVisao("longe");

await navegador.close();
http.close();

// ---------------------------------------------------------- relatorio
const linhas = [
  "# Auditoria de UI",
  "",
  `Telas visitadas: ${telas.length}`,
  `Problemas encontrados: ${problemas.length}`,
  "",
  "| Tela | Objetos | Problemas |",
  "|---|---|---|",
  ...telas.map((t) => `| ${t.nome} | ${t.contagem} | ${t.problemas.length} |`),
  "",
];
if (erros.length) {
  linhas.push("## Erros de execucao", "");
  erros.slice(0, 10).forEach((e) => linhas.push(`- ${e}`));
  linhas.push("");
}
let total = 0;
for (const t of telas) {
  if (!t.problemas.length) continue;
  total += t.problemas.length;
  linhas.push(`## ${t.nome} (${t.problemas.length})`, "");
  for (const p of t.problemas) {
    linhas.push(`- **${p.tipo}** ${p.a}${p.b ? ` vs ${p.b}` : ""} . ${p.descricao}`);
  }
  linhas.push("");
}
if (!total) linhas.push("Nenhum problema de sobreposicao ou transbordo encontrado.", "");

const relatorio = linhas.join("\n");
await writeFile(new URL("./auditoria-ui.md", import.meta.url), relatorio);
console.log(relatorio);
console.log(`\nscreenshots em ferramentas/telas/`);
process.exit(total > 0 || erros.length ? 1 : 0);
