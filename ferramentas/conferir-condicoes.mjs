/** Confere o motor de condicoes, sem abrir navegador.
 *
 * Mesma ideia de conferir-criatura.mjs: pergunta ao codigo de verdade.
 *
 * Roda com:  npm run condicoes
 * Sai com codigo 1 se qualquer caso falhar.
 */
import { aplicar, passarTurno, tem } from "../src/sistemas/condicoes.ts";
import { aplicarMarca } from "../src/sistemas/marcas.ts";

let falhas = 0;

function caso(descricao, condicao) {
  const ok = !!condicao;
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${descricao}`);
}

function igual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ------------------------------------------------------------- aplicar()
caso(
  "aplicar numa lista vazia insere a condicao",
  igual(aplicar([], { id: "molhado", turnosRestantes: 3 }), [{ id: "molhado", turnosRestantes: 3 }])
);
caso(
  "aplicar de novo com duracao MAIOR substitui",
  igual(
    aplicar([{ id: "molhado", turnosRestantes: 1 }], { id: "molhado", turnosRestantes: 3 }),
    [{ id: "molhado", turnosRestantes: 3 }]
  )
);
caso(
  "aplicar de novo com duracao MENOR OU IGUAL nao faz nada (nunca empilha)",
  igual(
    aplicar([{ id: "molhado", turnosRestantes: 3 }], { id: "molhado", turnosRestantes: 1 }),
    [{ id: "molhado", turnosRestantes: 3 }]
  )
);
caso(
  "aplicar duas condicoes diferentes guarda as duas",
  igual(
    aplicar([{ id: "molhado", turnosRestantes: 3 }], { id: "congelado", turnosRestantes: 1 }),
    [{ id: "molhado", turnosRestantes: 3 }, { id: "congelado", turnosRestantes: 1 }]
  )
);

// ---------------------------------------------------------------- tem()
caso("tem() acha uma condicao presente", tem([{ id: "molhado", turnosRestantes: 3 }], "molhado"));
caso("tem() nao acha uma condicao ausente", !tem([{ id: "molhado", turnosRestantes: 3 }], "congelado"));

// ----------------------------------------------------------- passarTurno()
{
  const { restantes, efeitos } = passarTurno([{ id: "molhado", turnosRestantes: 3 }]);
  caso("passarTurno decrementa a duracao", igual(restantes, [{ id: "molhado", turnosRestantes: 2 }]));
  caso("molhado nao gera efeito de inicio de turno", efeitos.length === 0);
}
{
  const { restantes, efeitos } = passarTurno([{ id: "molhado", turnosRestantes: 1 }]);
  caso("com 1 turno restante, expira e SAI da lista", restantes.length === 0);
}
{
  // 1 turno de congelado tem que pular EXATAMENTE 1 turno: o efeito dispara
  // no MESMO passarTurno que ja zera e remove a condicao.
  const { restantes, efeitos } = passarTurno([{ id: "congelado", turnosRestantes: 1 }]);
  caso("congelado com 1 turno restante gera o efeito pulaTurno",
    igual(efeitos, [{ id: "congelado", tipo: "pulaTurno" }]));
  caso("e ja sai da lista no mesmo passarTurno (nao pula dois turnos)", restantes.length === 0);
}
{
  const { efeitos } = passarTurno([]);
  caso("passarTurno numa lista vazia nao gera efeito nenhum", efeitos.length === 0);
}
{
  const { restantes, efeitos } = passarTurno([
    { id: "molhado", turnosRestantes: 2 },
    { id: "congelado", turnosRestantes: 1 },
  ]);
  caso("varias condicoes ao mesmo tempo: cada uma decrementa por conta propria",
    igual(restantes, [{ id: "molhado", turnosRestantes: 1 }]));
  caso("e so a que tem efeito de inicio dispara, a outra fica quieta",
    igual(efeitos, [{ id: "congelado", tipo: "pulaTurno" }]));
}

// -------------------------------------------------------- aplicarMarca()
{
  const seco = [];
  const r = aplicarMarca("gelo", seco);
  caso("gelo em alvo SECO nao muda as condicoes (so atrasa, sem novidade)",
    igual(r.condicoesNovas, seco));
  caso("gelo em alvo seco nao gera efeito especial", r.efeitoEspecial === undefined);
}
{
  const molhado = [{ id: "molhado", turnosRestantes: 2 }];
  const r = aplicarMarca("gelo", molhado);
  caso("gelo em alvo MOLHADO congela na hora",
    igual(r.condicoesNovas, [{ id: "molhado", turnosRestantes: 2 }, { id: "congelado", turnosRestantes: 1 }]));
  caso("e sinaliza o efeito especial \"congelou\"", r.efeitoEspecial === "congelou");
}
{
  const r = aplicarMarca("fogo", []);
  caso("marca sem reacao ainda escrita devolve a lista intacta, nunca erro", igual(r.condicoesNovas, []));
}

// -------------- as seis marcas novas (revisao de 2026-09-04, 11 magias) ---
{
  const r = aplicarMarca("luz", [{ id: "escondido", turnosRestantes: 5 }]);
  caso("luz tira escondido", !r.condicoesNovas.some((c) => c.id === "escondido"));
  caso("e aplica iluminado", igual(r.condicoesNovas, [{ id: "iluminado", turnosRestantes: 20 }]));
}
{
  const r = aplicarMarca("planta", []);
  caso("planta aplica preso", igual(r.condicoesNovas, [{ id: "preso", turnosRestantes: 2 }]));
}
{
  const r = aplicarMarca("cola", []);
  caso("cola tambem aplica preso (mesma reacao de planta)", igual(r.condicoesNovas, [{ id: "preso", turnosRestantes: 2 }]));
}
{
  const r = aplicarMarca("doce", []);
  caso("doce aplica atraido", igual(r.condicoesNovas, [{ id: "atraido", turnosRestantes: 3 }]));
}
{
  const r = aplicarMarca("bolha", []);
  caso("bolha aplica protegido", igual(r.condicoesNovas, [{ id: "protegido", turnosRestantes: 3 }]));
}
{
  const r = aplicarMarca("som-alto", []);
  caso("som-alto aplica assustado", igual(r.condicoesNovas, [{ id: "assustado", turnosRestantes: 2 }]));
}
{
  const jaPreso = [{ id: "preso", turnosRestantes: 1 }];
  const r = aplicarMarca("planta", jaPreso);
  caso("planta de novo com duracao maior renova (nunca empilha, regra de condicoes.ts)",
    igual(r.condicoesNovas, [{ id: "preso", turnosRestantes: 2 }]));
}

if (falhas > 0) {
  console.error(`\n${falhas} caso(s) falharam.`);
  process.exit(1);
}
console.log("\ntodos os casos passaram.");
