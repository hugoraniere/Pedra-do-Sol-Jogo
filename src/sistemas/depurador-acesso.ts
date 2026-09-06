/** Se o modo DEPURADOR ja foi destravado neste aparelho — 7 toques no texto
 *  de versao da tela de Titulo (ver `Titulo.ts`). Guardado pelo mesmo
 *  backend dos saves (`armazenamento.ts`), nao localStorage cru, pra
 *  sobreviver dentro do aplicativo empacotado (Electron) tambem. */
import { ler, gravar } from "./armazenamento";

const CHAVE = "aurora-debug-desbloqueado";

export function depuradorDesbloqueado(): boolean {
  return ler(CHAVE) === "1";
}

export function desbloquearDepurador(): void {
  gravar(CHAVE, "1");
}
