/** Processo principal do aplicativo de desktop.
 *
 * O jogo em si e o mesmo HTML que roda no navegador. Este arquivo so abre a janela,
 * carrega o build de dist/ e cuida dos saves em arquivo. Nenhuma regra de jogo mora
 * aqui, de proposito: assim o navegador e o aplicativo nunca divergem.
 */
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

/** Qual ambiente e esta pasta, lendo o mesmo .ambiente que o resto do projeto.
 *
 * Em desenvolvimento o jogo pode estar aberto em varias pastas ao mesmo tempo.
 * A janela precisa saber em que porta o vite dela subiu, e os saves precisam de
 * uma pasta so deles: senao o teste de uma frente apaga o progresso da outra.
 */
function ambiente() {
  try {
    const lido = JSON.parse(
      require("node:fs").readFileSync(path.join(__dirname, "..", ".ambiente"), "utf-8"),
    );
    const numero = Number(lido.numero);
    return Number.isInteger(numero) && numero > 0 && numero <= 9 ? numero : 0;
  } catch {
    return 0;
  }
}

// DEV ANTES DE AMBIENTE, e nao depois. `const` nao sobe: usar DEV na linha de
// cima quebrava o aplicativo inteiro com "Cannot access 'DEV' before
// initialization", antes de qualquer janela aparecer. Nao dava erro no jogo
// porque o jogo nem chegava a carregar.
const DEV = !app.isPackaged;
const AMBIENTE = DEV ? ambiente() : 0;
const PORTA_VITE = 5173 + AMBIENTE * 10;

const PASTA_SAVES = () =>
  path.join(app.getPath("userData"), AMBIENTE ? `saves-ambiente-${AMBIENTE}` : "saves");

async function garantirPasta() {
  await fs.mkdir(PASTA_SAVES(), { recursive: true });
}

async function lerSaves() {
  await garantirPasta();
  const saida = {};
  for (const arquivo of await fs.readdir(PASTA_SAVES())) {
    if (!arquivo.endsWith(".json")) continue;
    try {
      saida[arquivo.slice(0, -5)] = await fs.readFile(path.join(PASTA_SAVES(), arquivo), "utf-8");
    } catch {
      /* save corrompido: ignora em vez de derrubar o jogo */
    }
  }
  return saida;
}

/** So aceita nome de save simples, para ninguem escrever fora da pasta. */
function nomeSeguro(chave) {
  return /^[a-z0-9-]{1,64}$/i.test(chave) ? chave : null;
}

async function gravarSave(chave, conteudo) {
  const nome = nomeSeguro(chave);
  if (!nome) return;
  await garantirPasta();
  const destino = path.join(PASTA_SAVES(), `${nome}.json`);
  // grava num temporario e troca, assim um desligamento no meio nao corrompe o save
  const temporario = `${destino}.tmp`;
  await fs.writeFile(temporario, conteudo, "utf-8");
  await fs.rename(temporario, destino);
}

async function apagarSave(chave) {
  const nome = nomeSeguro(chave);
  if (!nome) return;
  await fs.rm(path.join(PASTA_SAVES(), `${nome}.json`), { force: true });
}

function criarJanela() {
  const area = screen.getPrimaryDisplay().workAreaSize;
  // O JOGO SE ADAPTA A QUALQUER JANELA. Ele enche o espaco que recebe e escolhe
  // sozinho a escala inteira, ver src/sistemas/visao.ts. Entao aqui nao existe
  // mais conta de multiplo de 320x192: e so uma janela confortavel. A conta
  // antiga ainda tirava um degrau de escala "por seguranca", e o resultado era
  // o aplicativo abrindo numa janelinha no meio de um monitor grande.
  const largura = Math.min(area.width, Math.max(960, Math.round(area.width * 0.8)));
  const altura = Math.min(area.height, Math.max(600, Math.round(area.height * 0.8)));
  const janela = new BrowserWindow({
    width: largura,
    height: altura,
    // o piso da interface e 256x160 em escala 1, ver visao.ts. 640x400 deixa
    // folga de sobra e ainda cabe em qualquer notebook.
    minWidth: 640,
    minHeight: 400,
    backgroundColor: "#2C2440",
    title: "Reino de Aurora",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "ponte.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  janela.once("ready-to-show", () => janela.show());
  if (DEV) janela.loadURL(`http://localhost:${PORTA_VITE}`);
  else janela.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  return janela;
}

app.whenReady().then(() => {
  ipcMain.handle("saves:ler", () => lerSaves());
  ipcMain.handle("saves:gravar", (_e, chave, conteudo) => gravarSave(chave, conteudo));
  ipcMain.handle("saves:apagar", (_e, chave) => apagarSave(chave));
  ipcMain.on("app:sair", () => app.quit());

  criarJanela();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
