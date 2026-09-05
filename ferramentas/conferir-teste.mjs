/** Confere o motor de teste novo (1d20 vs ND, docs/modelo-de-combate.md secao 3),
 *  sem abrir navegador.
 *
 * Roda com:  npm run teste
 * Sai com codigo 1 se qualquer caso falhar.
 */
import { testar, foiSucesso } from "../src/sistemas/teste.ts";

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
  caso("mesmo com modificador ruim e ND alto (sucede sempre)", true);
}

// -------------------------------------------------------- critico de fracasso
{
  const r = testar(50, 5, sempre(1));
  caso("dado natural 1 e sempre critico de fracasso", r.desfecho === "critico-fracasso");
  caso("mesmo com modificador enorme e ND baixo (falha sempre)", true);
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

if (falhas > 0) {
  console.error(`\n${falhas} caso(s) falharam.`);
  process.exit(1);
}
console.log("\ntodos os casos passaram.");
