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

const PORTA = 4188;
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

const caixa = await pagina.locator("canvas").boundingBox();
const escala = caixa.width / 320;
const clicar = (x, y) => pagina.mouse.click(caixa.x + x * escala, caixa.y + y * escala);

const telas = [];

async function olhar(nome) {
  await pagina.waitForTimeout(500);
  await pagina.screenshot({ path: join(PASTA_TELAS, `${nome}.png`) });
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

await clicar(160, 164); // NOVO JOGO
problemas.push(...(await olhar("02-criacao-nome")));
await clicar(160, 142); // sortear nome
await clicar(280, 178);
problemas.push(...(await olhar("03-criacao-raca")));
await clicar(280, 178);
problemas.push(...(await olhar("04-criacao-classe")));
await clicar(280, 178);
problemas.push(...(await olhar("05-criacao-cabelo")));
await clicar(280, 178);
problemas.push(...(await olhar("06-criacao-roupa")));
await clicar(280, 178);
problemas.push(...(await olhar("07-criacao-pronto")));

await clicar(160, 176); // comecar
await pagina.waitForTimeout(1400);
problemas.push(...(await olhar("08-mundo")));

await clicar(310, 8); // pausa
problemas.push(...(await olhar("09-pausa")));
await clicar(160, 101); // configuracoes
problemas.push(...(await olhar("10-configuracoes")));
await pagina.keyboard.press("Escape");   // volta de config para o menu de pausa
await pagina.waitForTimeout(500);
// SAIR PARA O MENU e o quarto item da pilha; achamos pela posicao do botao
const ySair = await pagina.evaluate(() => {
  const cena = window.jogo.scene.getScene("Pausa");
  const alvo = cena.children.list
    .flatMap((o) => (Array.isArray(o.list) ? o.list : [o]))
    .find((o) => o.getData?.("ui")?.dono === "SAIR PARA O MENU");
  return alvo ? alvo.y : 150;
});
await clicar(160, ySair);
await pagina.waitForTimeout(1400);
problemas.push(...(await olhar("11-titulo-com-save")));
const yCarregar = await pagina.evaluate(() => {
  const cena = window.jogo.scene.getScene("Titulo");
  const alvo = cena.children.list.find((o) => o.getData?.("ui")?.dono === "CARREGAR JOGO");
  return alvo ? alvo.y : 168;
});
await clicar(160, yCarregar);
problemas.push(...(await olhar("12-carregar")));

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
