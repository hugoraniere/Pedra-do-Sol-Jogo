/** Confere a funcao pura de derrota (Fase 13.2, docs/plano-de-implementacao.md),
 *  sem abrir navegador.
 *
 * localStorage nao existe em Node - so pra estado.ts poder chamar salvar()
 * sem quebrar, viramos um shim minimo antes de importar o modulo.
 *
 * Roda com:  npm run derrota
 * Sai com codigo 1 se qualquer caso falhar.
 */
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
globalThis.window = {};

import { estado, novoJogo, aplicarDerrota } from "../src/sistemas/estado.ts";

let falhas = 0;

function caso(descricao, condicao) {
  const ok = !!condicao;
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${descricao}`);
}

function heroiDeTeste() {
  return {
    nome: "Teste", raca: "elfo", classe: "mago", magias: [],
    tomPele: 0, estiloCabelo: "comprido", corCabelo: 0, estiloRoupa: "tunica",
    corRoupa: 0, chapeu: "nenhum", corChapeu: 0, armaSprite: "nenhuma",
    poderEscolhido: "",
  };
}

// sempre sorteia o PRIMEIRO elegivel restante - deixa o teste previsivel sem
// precisar simular embaralhamento de verdade.
const primeiroSempre = () => 0;

// a mochila e Record<id, quantidade> (Fase B do plano de itens) - cada
// unidade empilhada conta como uma posicao elegivel pra sortear, igual a
// lista antiga fazia sozinha.
const totalNaMochila = () => Object.values(estado().mochila).reduce((a, b) => a + b, 0);

{
  novoJogo(0, heroiDeTeste());
  estado().moedas = 12;
  estado().mochila = { pocao: 1, isca: 1 };
  const r = aplicarDerrota(primeiroSempre);
  caso("zera as moedas", estado().moedas === 0);
  caso("devolve quanto tinha perdido", r.moedasPerdidas === 12);
  caso("com 2 itens elegiveis, sorteia 1 (metade arredondada pra cima)", r.itensPerdidos.length === 1);
  caso("o item sorteado some da mochila", totalNaMochila() === 1);
}

{
  novoJogo(0, heroiDeTeste());
  estado().mochila = { pocao: 1, isca: 1, corda: 1, "chave-mestra": 1 };
  const r = aplicarDerrota(primeiroSempre);
  caso("chave-mestra nunca e sorteada", !r.itensPerdidos.includes("chave-mestra"));
  caso("chave-mestra continua na mochila", (estado().mochila["chave-mestra"] ?? 0) === 1);
  caso("3 elegiveis -> sorteia 2 (metade arredondada pra cima)", r.itensPerdidos.length === 2);
}

{
  novoJogo(0, heroiDeTeste());
  estado().mochila = { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1 };
  const r = aplicarDerrota(primeiroSempre);
  caso("nunca sorteia mais que 3, mesmo com mochila cheia", r.itensPerdidos.length === 3);
  caso("os outros 4 continuam na mochila", totalNaMochila() === 4);
}

{
  novoJogo(0, heroiDeTeste());
  estado().mochila = {};
  estado().moedas = 5;
  const r = aplicarDerrota(primeiroSempre);
  caso("mochila vazia nao quebra, so as moedas somem", r.itensPerdidos.length === 0 && r.moedasPerdidas === 5);
}

{
  novoJogo(0, heroiDeTeste());
  estado().mochila = { "chave-mestra": 1, "chave-do-poco": 1 };
  const r = aplicarDerrota(primeiroSempre);
  caso("mochila so com chaves nunca perde nenhuma", r.itensPerdidos.length === 0);
  caso("as duas chaves continuam la", totalNaMochila() === 2);
}

if (falhas > 0) {
  console.error(`\n${falhas} caso(s) falharam.`);
  process.exit(1);
}
console.log("\ntodos os casos passaram.");
