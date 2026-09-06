/** Confere o motor de teste novo (1d20 vs ND, docs/modelo-de-combate.md secao 3),
 *  sem abrir navegador.
 *
 * Roda com:  npm run teste
 * Sai com codigo 1 se qualquer caso falhar.
 */
import { testar, foiSucesso, desfechoDoTeste } from "../src/sistemas/teste.ts";

let falhas = 0;

function caso(descricao, condicao) {
  const ok = !!condicao;
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${descricao}`);
}

const sempre = (n) => () => n;

// --------------------------------------------------------- critico de sucesso
{
  const r = testar(-5, 25, sempre(20));
  caso("dado natural 20 e sempre critico de sucesso", r.desfecho === "critico-sucesso");
  // a prova de que "sempre" e de verdade: total (15) fica ABAIXO do ND (25) -
  // por comparacao de total sozinha isto seria falha, mas o 20 natural vence.
  caso("mesmo com modificador ruim e ND alto (sucede sempre)", r.total < r.nd);
}

// -------------------------------------------------------- critico de fracasso
{
  const r = testar(50, 5, sempre(1));
  caso("dado natural 1 e sempre critico de fracasso", r.desfecho === "critico-fracasso");
  // mesma prova ao contrario: total (51) fica ACIMA do ND (5) - por
  // comparacao de total sozinha isto seria sucesso, mas o 1 natural vence.
  caso("mesmo com modificador enorme e ND baixo (falha sempre)", r.total >= r.nd);
}

// -------------------------------------------------------------------- sucesso
{
  const r = testar(3, 10, sempre(10));
  caso("total >= ND (sem ser 1 nem 20) e sucesso", r.desfecho === "sucesso" && r.total === 13);
}
{
  const r = testar(0, 10, sempre(10));
  caso("total EXATAMENTE igual ao ND e sucesso, nao falha", r.desfecho === "sucesso");
}

// ---------------------------------------------------------------- falha perto
{
  const r = testar(0, 10, sempre(7));
  caso("faltou 3 pontos (limite) e falha perto", r.desfecho === "falha-perto" && r.total === 7);
}
{
  const r = testar(0, 10, sempre(8));
  caso("faltou 2 pontos e falha perto", r.desfecho === "falha-perto");
}

// --------------------------------------------------------------------- falha
{
  const r = testar(0, 10, sempre(6));
  caso("faltou 4 pontos (fora da margem de 3) e falha comum", r.desfecho === "falha");
}
{
  const r = testar(0, 15, sempre(2));
  caso("faltou muito e falha comum, nao perto", r.desfecho === "falha");
}

// ------------------------------------------------------------------ foiSucesso
{
  caso("foiSucesso(sucesso) e verdadeiro", foiSucesso("sucesso"));
  caso("foiSucesso(critico-sucesso) e verdadeiro", foiSucesso("critico-sucesso"));
  caso("foiSucesso(falha-perto) e falso", !foiSucesso("falha-perto"));
  caso("foiSucesso(falha) e falso", !foiSucesso("falha"));
  caso("foiSucesso(critico-fracasso) e falso", !foiSucesso("critico-fracasso"));
}

// ------------------------------------------------------------- total sempre certo
{
  const r = testar(4, 10, sempre(9));
  caso("total e sempre dado + modificador", r.total === 13 && r.dado === 9);
}

// -------------------------------------------------- desfechoDoTeste (por alvo)
// mesmo dado/total, ND diferente - usado quando uma acao em area pega bichos
// com bonus (logo ND) diferentes: um so dado fisico, um desfecho por alvo.
{
  const d1 = desfechoDoTeste(11, 11, 10);
  const d2 = desfechoDoTeste(11, 11, 11);
  caso("mesmo total (11) contra ND mais facil (10) e sucesso", d1 === "sucesso");
  caso("mesmo total (11) contra ND mais dificil (11) tambem e sucesso (total>=nd)", d2 === "sucesso");
}
{
  const facil = desfechoDoTeste(8, 8, 10);
  const dificil = desfechoDoTeste(8, 8, 12);
  caso("mesmo dado (8) contra ND 10 e falha perto (faltou 2)", facil === "falha-perto");
  caso("o MESMO dado (8) contra ND 12 (bicho mais forte) vira falha comum (faltou 4)", dificil === "falha");
}
{
  caso("natural 20 e critico de sucesso nao importa o ND do alvo", desfechoDoTeste(20, 3, 30) === "critico-sucesso");
  caso("natural 1 e critico de fracasso nao importa o ND do alvo", desfechoDoTeste(1, 40, 5) === "critico-fracasso");
}
{
  const viaTestar = testar(4, 10, sempre(9));
  const viaDesfecho = desfechoDoTeste(viaTestar.dado, viaTestar.total, viaTestar.nd);
  caso("desfechoDoTeste reproduz exatamente o que testar() ja da", viaDesfecho === viaTestar.desfecho);
}

if (falhas > 0) {
  console.error(`\n${falhas} caso(s) falharam.`);
  process.exit(1);
}
console.log("\ntodos os casos passaram.");
