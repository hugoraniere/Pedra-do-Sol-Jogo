/** Espera o vite deste ambiente subir e abre a janela do aplicativo.
 *
 * Existe porque a porta do vite muda de ambiente para ambiente, e um
 * `wait-on tcp:5173` escrito no package.json esperaria pela pasta errada: o
 * aplicativo abriria mostrando o jogo da outra frente de trabalho.
 */
import { spawn } from "node:child_process";
import { connect } from "node:net";
import caminhoDoElectron from "electron";
import { porta, RAIZ } from "./ambiente-atual.mjs";

const PORTA = porta(5173);
const TENTATIVAS = 120;

function respondeu() {
  return new Promise((resolve) => {
    const tomada = connect(PORTA, "127.0.0.1");
    const fim = (valor) => {
      tomada.destroy();
      resolve(valor);
    };
    tomada.once("connect", () => fim(true));
    tomada.once("error", () => fim(false));
    tomada.setTimeout(500, () => fim(false));
  });
}

for (let i = 0; i < TENTATIVAS; i++) {
  if (await respondeu()) {
    const janela = spawn(caminhoDoElectron, ["."], { cwd: RAIZ, stdio: "inherit" });
    janela.on("exit", (codigo) => process.exit(codigo ?? 0));
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
  if (i === TENTATIVAS - 1) {
    console.error(`o vite nao subiu na porta ${PORTA} em 60 segundos`);
    process.exit(1);
  }
}
