/** Ponte entre o jogo e o aplicativo.
 *
 * Expoe UMA funcao por acao, nada mais. O jogo nunca ve o modulo fs nem o ipc cru,
 * que e o que mantem a janela segura mesmo carregando HTML.
 * Do lado do jogo isso aparece como window.aurora, e quem usa e
 * src/sistemas/armazenamento.ts.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aurora", {
  lerSaves: () => ipcRenderer.invoke("saves:ler"),
  gravarSave: (chave, conteudo) => ipcRenderer.invoke("saves:gravar", chave, conteudo),
  apagarSave: (chave) => ipcRenderer.invoke("saves:apagar", chave),
  sair: () => ipcRenderer.send("app:sair"),
  versao: process.versions.electron,
});
