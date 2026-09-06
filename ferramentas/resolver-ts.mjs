/** Gancho de resolucao de modulo: quando um import sem extensao nao acha
 *  arquivo (o jeito que `src/dados/conteudo.ts` importa `./config`, por
 *  exemplo - Vite resolve isso sozinho, o Node puro nao), tenta de novo
 *  com `.ts` na ponta antes de desistir.
 *
 *  Usado via `node --import ./ferramentas/registrar-resolver-ts.mjs`, nunca
 *  chamado direto. */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (erro) {
    const semExtensao = !/\.[a-z0-9]+$/i.test(specifier);
    if (erro?.code === "ERR_MODULE_NOT_FOUND" && semExtensao) {
      return nextResolve(specifier + ".ts", context);
    }
    throw erro;
  }
}
