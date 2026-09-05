/** Confere os tres comportamentos de criatura, sem abrir navegador.
 *
 * decidirAcaoDaCriatura e logica pura (sem Phaser), entao o Node importa o
 * .ts direto e pergunta a ELE, em vez de reimplementar a regra aqui do lado
 * de fora. E a mesma ideia de sistemas/bancada.ts: o teste pergunta ao
 * codigo de verdade, nunca a uma copia das regras que pode desencontrar.
 *
 * Roda com:  npm run criatura
 * Sai com codigo 1 se qualquer caso falhar.
 */
import { decidirAcaoDaCriatura } from "../src/sistemas/criatura.ts";

let falhas = 0;

function caso(descricao, esperado, obtido) {
  const ok = esperado === obtido;
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${descricao} (esperava ${esperado}, veio ${obtido})`);
}

// -------------------------------------------------------------- passeia
caso(
  "passeia longe do heroi ignora e espera",
  "esperar",
  decidirAcaoDaCriatura("passeia", 5, 3, 3)
);
caso(
  "passeia adjacente ataca, mesmo sem ter virado curioso ainda",
  "atacar",
  decidirAcaoDaCriatura("passeia", 1, 3, 3)
);
caso(
  "passeia fraco mas longe continua so esperando (fraqueza nao e dele)",
  "esperar",
  decidirAcaoDaCriatura("passeia", 4, 1, 3)
);

// -------------------------------------------------------------- curioso
caso(
  "curioso longe avanca",
  "avancar",
  decidirAcaoDaCriatura("curioso", 3, 2, 2)
);
caso(
  "curioso adjacente ataca",
  "atacar",
  decidirAcaoDaCriatura("curioso", 1, 2, 2)
);
caso(
  "curioso nunca foge, mesmo com 1 coracao de 3",
  "atacar",
  decidirAcaoDaCriatura("curioso", 1, 1, 3)
);

// -------------------------------------------------------------- medroso
caso(
  "medroso saudavel e longe avanca",
  "avancar",
  decidirAcaoDaCriatura("medroso", 4, 2, 2)
);
caso(
  "medroso saudavel e adjacente ataca de surpresa, uma vez",
  "atacar",
  decidirAcaoDaCriatura("medroso", 1, 2, 2, false)
);
caso(
  "medroso saudavel e adjacente, mas ja atacou de surpresa: foge",
  "fugir",
  decidirAcaoDaCriatura("medroso", 1, 2, 2, true)
);
caso(
  "medroso fraco foge mesmo longe",
  "fugir",
  decidirAcaoDaCriatura("medroso", 5, 1, 3)
);
caso(
  "medroso fraco e adjacente ainda assim foge (fraqueza vence surpresa)",
  "fugir",
  decidirAcaoDaCriatura("medroso", 1, 1, 3, false)
);
caso(
  "medroso exatamente na metade dos coracoes ja conta como fraco",
  "fugir",
  decidirAcaoDaCriatura("medroso", 5, 1, 2)
);
caso(
  "medroso um coracao acima da metade ainda avanca",
  "avancar",
  decidirAcaoDaCriatura("medroso", 5, 2, 3)
);

if (falhas > 0) {
  console.error(`\n${falhas} caso(s) falharam.`);
  process.exit(1);
}
console.log("\ntodos os casos passaram.");
