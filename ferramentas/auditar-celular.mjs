/** Auditoria de UI em tamanho de celular de verdade.
 *
 * npm run auditar ja confere sobreposicao e transbordo, mas numa janela so
 * (960x576, formato de computador). Isto aqui reusa o MESMO auditor —
 * window.auditarUI(), o mesmo que o doutor chama no iPad — só que varrendo
 * uma frota de telas de celular e tablet de verdade, retrato e paisagem.
 *
 * Por que precisa disto: LARGURA e ALTURA nao sao mais uma de tres opcoes
 * fixas (ver docs/07-design-system.md). Elas saem da conta de escala inteira
 * em cima do tamanho real da janela, e um celular em pe da uma proporcao
 * (estreita e alta) que nenhuma tela de computador testa. O roadmap listava
 * "o jogo em tela de celular deitado e em pe" como TODO; isto e a prova de
 * que ficou de pe sem sobreposicao, nao so a promessa.
 *
 * Rode com:  npm run auditar-celular
 * Precisa do build pronto:  npm run build
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { porta } from "./ambiente-atual.mjs";

const PORTA = porta(4189);
const RAIZ = new URL("../dist/", import.meta.url).pathname;
const PASTA_TELAS = new URL("./telas/celular/", import.meta.url).pathname;

const TIPOS = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".json": "application/json", ".xml": "text/xml",
  ".woff2": "font/woff2", ".mp3": "audio/mpeg",
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

/** Aparelhos de verdade, nao numeros redondos. Cada um em pe e deitado.
 *
 *  O iPad e o aparelho do Lele, entao entra nas duas orientacoes com destaque.
 *  Os celulares cobrem de uma tela pequena e antiga (o pior caso de espaco) a
 *  uma tela grande e moderna. */
const APARELHOS = [
  ["celular pequeno", 360, 740],
  ["iPhone", 390, 844],
  ["iPhone grande", 430, 932],
  ["Android grande", 412, 915],
  ["iPad", 820, 1180],
];

const http = servidor();
await new Promise((r) => http.listen(PORTA, r));
await mkdir(PASTA_TELAS, { recursive: true });

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? undefined,
  args: ["--no-sandbox"],
});

const erros = [];
const telas = [];
const problemas = [];

/** As telas que tem HUD fixo (coracoes, moedas, direcional, botao de acao) sao
 *  as que colidem primeiro numa proporcao estranha: os elementos sao ancorados
 *  nos quatro cantos, e canto perto de canto e onde sobreposicao acontece. As
 *  de criacao ja rodam nas tres visoes em auditar-ui.mjs; aqui o que muda de
 *  verdade e a FORMA da tela, entao o percurso e mais curto e focado nisso. */
async function auditarAparelho(nome, largura, altura, orientacao) {
  const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
  pagina.on("pageerror", (e) => erros.push(`${nome} ${orientacao}: ${e.message}`));
  pagina.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("404")) {
      erros.push(`${nome} ${orientacao}: ${m.text()}`);
    }
  });

  const prefixo = `${nome} ${orientacao}`;
  const arquivo = (n) =>
    `${nome.replace(/\s+/g, "-")}-${orientacao}-${n}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  async function olhar(n) {
    await pagina.waitForTimeout(600);
    const medida = await pagina.evaluate(() => ({
      logico: `${window.jogo.scale.width}x${window.jogo.scale.height}`,
      escala: window.jogo.scale.zoom,
      janela: `${window.innerWidth}x${window.innerHeight}`,
    }));
    await pagina.screenshot({ path: join(PASTA_TELAS, `${arquivo(n)}.png`) });
    const achados = (await pagina.evaluate(() => window.auditarUI?.() ?? [])).map((p) => ({
      ...p,
      tela: `${prefixo} · ${n}`,
    }));
    telas.push({ nome: `${prefixo} · ${n}`, medida, problemas: achados });
    problemas.push(...achados);
  }

  async function clicarBotao(rotuloAlvo) {
    const ponto = await pagina.evaluate((alvo) => {
      const achatar = (l) => l.flatMap((o) => (Array.isArray(o.list) ? [o, ...achatar(o.list)] : [o]));
      for (const cena of window.jogo.scene.getScenes(true)) {
        const b = achatar(cena.children.list).find(
          (o) => o.getData?.("ui")?.tipo === "botao" && o.getData("ui").dono === alvo
        );
        if (b) return { x: b.x, y: b.y };
      }
      return null;
    }, rotuloAlvo);
    if (!ponto) throw new Error(`${prefixo}: botao nao encontrado: ${rotuloAlvo}`);
    const caixa = await pagina.locator("canvas").boundingBox();
    const largura2 = await pagina.evaluate(() => window.jogo.scale.width);
    const escala = caixa.width / largura2;
    await pagina.mouse.click(caixa.x + ponto.x * escala, caixa.y + ponto.y * escala);
    await pagina.waitForTimeout(400);
  }

  await pagina.goto(`http://localhost:${PORTA}/`, { waitUntil: "networkidle" });
  await pagina.waitForFunction(() => window.jogo?.scene?.isActive("Titulo"), null, { timeout: 15000 });
  await olhar("titulo");

  // pula a criacao inteira: ela ja e coberta, nas tres visoes, por
  // auditar-ui.mjs. Aqui o alvo e o que so um formato de tela novo revela —
  // o mundo com o HUD inteiro em cima, e os paineis por cima do mundo.
  await pagina.evaluate(() => {
    window.jogo.scene.stop("Titulo");
    window.jogo.scene.start("Mundo");
  });
  await pagina.waitForFunction(() => window.jogo.scene.isActive("Mundo"), null, { timeout: 15000 });
  await pagina.waitForTimeout(600);
  await olhar("mundo");

  await clicarBotao("FICHA");
  await olhar("janela-eu");
  await clicarBotao("FECHAR");

  await pagina.evaluate(() => window.jogo.scene.getScene("Mundo").pausar());
  await olhar("pausa");
  await clicarBotao("CONFIGURACOES");
  await olhar("configuracoes");

  await pagina.close();
}

for (const [nome, largura, altura] of APARELHOS) {
  await auditarAparelho(nome, largura, altura, "retrato");
  await auditarAparelho(nome, altura, largura, "paisagem");
}

await navegador.close();
http.close();

// ---------------------------------------------------------- relatorio
const linhas = [
  "# Auditoria de UI em celular",
  "",
  `Telas visitadas: ${telas.length}`,
  `Problemas encontrados: ${problemas.length}`,
  "",
  "| Tela | Logico | Escala | Janela | Problemas |",
  "|---|---|---|---|---|",
  ...telas.map(
    (t) => `| ${t.nome} | ${t.medida.logico} | ${t.medida.escala}x | ${t.medida.janela} | ${t.problemas.length} |`
  ),
  "",
];
if (erros.length) {
  linhas.push("## Erros de execucao", "");
  [...new Set(erros)].slice(0, 20).forEach((e) => linhas.push(`- ${e}`));
  linhas.push("");
}
for (const t of telas) {
  if (!t.problemas.length) continue;
  linhas.push(`## ${t.nome} (${t.problemas.length})`, "");
  for (const p of t.problemas) linhas.push(`- **${p.tipo}** ${p.a}${p.b ? ` vs ${p.b}` : ""} . ${p.descricao}`);
  linhas.push("");
}
if (!problemas.length) linhas.push("Nenhum problema de sobreposicao ou transbordo encontrado.", "");

const relatorio = linhas.join("\n");
await writeFile(new URL("./auditoria-celular.md", import.meta.url), relatorio);
console.log(relatorio);
console.log(`\nscreenshots em ferramentas/telas/celular/`);
process.exit(problemas.length > 0 || erros.length ? 1 : 0);
