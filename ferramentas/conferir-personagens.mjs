/** Confere as 25 combinacoes de raca e classe.
 *
 * O risco real destas telas nao e feiura, e camada faltando. Se um PNG nao foi
 * gerado ou o nome no codigo nao bate com o nome do arquivo, o Phaser nao
 * reclama: ele desenha o quadro verde de textura ausente, ou congela a camada
 * no primeiro quadro. O personagem anda com o cabelo parado no ar e ninguem ve
 * o erro no console. Entao aqui a gente pergunta ao proprio jogo, combinacao
 * por combinacao, se cada camada existe e se cada animacao foi criada.
 *
 * Roda com:  npm run conferir
 * Sai com codigo 1 se faltar qualquer coisa.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import pw from "/home/claude/.npm-global/lib/node_modules/playwright/index.js";

const { chromium } = pw;
const RAIZ = resolve("dist");
const PASTA = resolve("ferramentas/telas");
const PORTA = 4191;
const TIPOS = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".json": "application/json", ".woff": "font/woff",
  ".woff2": "font/woff2", ".xml": "text/xml", ".fnt": "text/xml",
};

if (!existsSync(RAIZ)) {
  console.error("rode npm run build antes");
  process.exit(1);
}
mkdirSync(PASTA, { recursive: true });

const faltando404 = new Set();
const servidor = createServer((req, res) => {
  let caminho = decodeURIComponent(req.url.split("?")[0]);
  if (caminho === "/") caminho = "/index.html";
  const arquivo = join(RAIZ, caminho);
  if (!existsSync(arquivo)) {
    if (caminho !== "/favicon.ico") faltando404.add(caminho);
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TIPOS[extname(arquivo)] ?? "application/octet-stream" });
  res.end(readFileSync(arquivo));
});
await new Promise((r) => servidor.listen(PORTA, r));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM ?? undefined });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e)));
pagina.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("favicon")) erros.push(m.text());
});

await pagina.goto(`http://localhost:${PORTA}/`, { waitUntil: "networkidle" });
await pagina.waitForTimeout(2500);

const relatorio = await pagina.evaluate(async () => {
  const jogo = window.jogo;
  const mod = window.__aurora;
  const linhas = [];
  for (const raca of mod.racas) {
    for (const classe of mod.classes) {
      const ficha = mod.fichaDeTeste(raca, classe);
      const pecas = mod.texturasDe(ficha);
      const cena = jogo.scene.getScene("Boot");
      const semTextura = pecas.filter((c) => !cena.textures.exists(c.chave));
      const quadrosErrados = pecas
        .filter((c) => cena.textures.exists(c.chave))
        .filter((c) => cena.textures.get(c.chave).frameTotal - 1 !== c.quadros)
        .map((c) => `${c.chave} tem ${cena.textures.get(c.chave).frameTotal - 1}, esperava ${c.quadros}`);
      const pontos = mod.pontosDe(ficha);
      linhas.push({
        raca, classe,
        camadas: pecas.map((c) => c.chave),
        semTextura: semTextura.map((c) => c.chave),
        quadrosErrados,
        pontos,
      });
    }
  }
  return linhas;
});

const semPontos = relatorio.filter((l) => !l.pontos || l.pontos.mao !== 24 || l.pontos.tronco !== 24);
const quebradas = relatorio.filter((l) => l.semTextura.length || l.quadrosErrados.length).concat(semPontos);
console.log(`combinacoes conferidas: ${relatorio.length}`);
console.log(`camadas por personagem:  ${relatorio[0]?.camadas.length ?? 0}`);
if (faltando404.size) console.log("404:", [...faltando404].join(", "));
if (erros.length) console.log("erros no console:\n  " + erros.slice(0, 8).join("\n  "));
if (quebradas.length) {
  console.log("\nPROBLEMAS:");
  quebradas.forEach((l) =>
    console.log(
      `  ${l.raca} + ${l.classe}: ` +
        [
          l.semTextura.length ? `faltam ${l.semTextura.join(", ")}` : "",
          l.quadrosErrados.join("; "),
          l.pontos ? "" : "sem pontos de encaixe",
        ].filter(Boolean).join(" | ")
    )
  );
} else {
  console.log("todas as pecas existem, com os quadros certos, e os 24 pontos de encaixe");
}

await navegador.close();
servidor.close();
process.exit(quebradas.length || erros.length || faltando404.size ? 1 : 0);
