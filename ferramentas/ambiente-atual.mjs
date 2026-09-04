/** Qual ambiente e esta pasta de trabalho.
 *
 * O jogo pode estar aberto em varias pastas ao mesmo tempo, uma por frente de
 * trabalho, cada uma um worktree do git. Se todas subirem o vite na 5173 e a
 * auditoria na 4188, a segunda quebra e a primeira mente: voce audita a tela da
 * outra pasta sem perceber.
 *
 * Entao cada pasta carrega um arquivo `.ambiente` na raiz, fora do git, com o
 * numero dela. Toda porta do projeto sai daqui, ninguem escreve numero na mao.
 *
 * A pasta original, sem `.ambiente`, e o ambiente 0 e continua usando as portas
 * de sempre. Quem nunca criou ambiente nenhum nao ve diferenca.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** O maior numero de ambiente que cabe sem as portas se cruzarem. */
export const LIMITE = 9;

export function ambiente() {
  const caminho = join(RAIZ, ".ambiente");
  if (!existsSync(caminho)) return { numero: 0, nome: "principal", dominio: "integracao" };
  try {
    const lido = JSON.parse(readFileSync(caminho, "utf8"));
    const numero = Number(lido.numero);
    if (!Number.isInteger(numero) || numero < 0 || numero > LIMITE) {
      throw new Error(`numero ${lido.numero} fora de 0..${LIMITE}`);
    }
    return { numero, nome: lido.nome ?? "sem-nome", dominio: lido.dominio ?? "" };
  } catch (erro) {
    console.error(`.ambiente ilegivel (${erro.message}), tratando como ambiente 0`);
    return { numero: 0, nome: "principal", dominio: "integracao" };
  }
}

/** A porta deste ambiente para um servico, a partir da porta original dele.
 *
 * Passo de 10 entre ambientes, entao 5173 vira 5183, 5193, e as bases 4188 e
 * 4191 nunca caem uma em cima da outra porque terminam em digito diferente.
 */
export function porta(base) {
  return base + ambiente().numero * 10;
}
