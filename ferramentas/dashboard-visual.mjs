#!/usr/bin/env node
/** O painel visual do Reino de Aurora.
 *
 *  Junta sprite, icone, magia, habilidade e atributo numa unica pagina HTML,
 *  para ver o jogo inteiro de relance e achar buraco de padronizacao (icone
 *  reusado, retrato faltando, sprite ausente) sem abrir dez arquivos.
 *
 *  Os dados de jogo (magias, racas, classes, bestiario) vem direto de
 *  `src/dados/conteudo.ts` e `src/sistemas/acao.ts` - nao sao copiados a mao
 *  aqui, entao o painel nunca desatualiza sozinho conforme o jogo muda. So
 *  duas coisas sao curadas a mao neste arquivo, porque nao existem em codigo
 *  nenhum: a ORDEM dos icones dentro de icones.png (implicita na lista
 *  Python de arte/icones.py) e os candidatos do piloto game-icons.net
 *  (levantados em docs/inventario-de-icones.md).
 *
 *      npm run dashboard    gera ferramentas/telas/dashboard.html
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ATRIBUTOS, ORDEM_PODERES, RACAS, CLASSES, MAGIAS, BESTIARIO } from "../src/dados/conteudo.ts";
import { acaoDaMagia, golpeDaArma, ACAO_SOCO } from "../src/sistemas/acao.ts";
import { ICONE as ICONE_UI } from "../src/sistemas/icones.ts";
import { ICONE_ITEM } from "../src/sistemas/icones-itens.ts";
import {
  QUADRO, LINHA_DIRECAO, DIRECOES, COLUNAS_FOLHA,
  ALTURA_PERSONAGEM, LARGURA_PERSONAGEM, PECA_ROUPA,
  RACAS_SPRITE, ROUPAS_ESTILO, CABELOS_ESTILO, CHAPEUS,
  NPCS_SPRITE, ARANHAS_SPRITE,
} from "../src/dados/config.ts";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const ASSETS = join(RAIZ, "public", "assets");
const SAIDA_DIR = join(RAIZ, "ferramentas", "telas");
const SAIDA = join(SAIDA_DIR, "dashboard.html");

// ------------------------------------------------------------- leitura de png

/** Base64 do PNG, ou null se o arquivo nao existir - o dashboard mostra a
 *  ausencia como informacao (contorno vermelho), nunca quebra a geracao. */
function lerPng(nomeArquivo) {
  const caminho = join(ASSETS, nomeArquivo);
  if (!existsSync(caminho)) return null;
  return readFileSync(caminho).toString("base64");
}

function dataUri(base64) {
  return base64 ? `data:image/png;base64,${base64}` : null;
}

// -------------------------------------------------------- grade de cada folha
// Confirmado direto nos PNGs em disco (ver plano) - nao adivinhado de novo.

const GRADE_HEROI = { colunas: COLUNAS_FOLHA, linhas: 8, frameW: LARGURA_PERSONAGEM, frameH: ALTURA_PERSONAGEM };
const GRADE_ROUPA = { colunas: 4, linhas: 3, frameW: PECA_ROUPA.largura, frameH: PECA_ROUPA.altura };

/** Cada criatura tem seu proprio tamanho de frame (arte/gente.py), mas todas
 *  usam a mesma grade de pose/direcao (11 colunas x 8 linhas) do heroi. */
const FRAME_POR_CRIATURA = {
  goblin: { frameW: 48, frameH: 96 },
  aranha: { frameW: 16, frameH: 32 },
  espantalho: { frameW: 16, frameH: 32 },
  "lobo-nevoa": { frameW: 16, frameH: 32 },
  bruxa: { frameW: 16, frameH: 32 },
  grulo: { frameW: 24, frameH: 40 },
  "cavaleiro-cinzas": { frameW: 24, frameH: 40 },
  serpente: { frameW: 24, frameH: 40 },
  brasanegra: { frameW: 48, frameH: 48 },
};

const LADO_ICONE = 16; // icones.png, ui.png, itens.png - as tres folhas usam o mesmo U

// ------------------------------------------------ ordem de icones.png (curado)
// Implicita em arte/icones.py: RETRATOS + ACOES + dado(1-6) + atributos +
// DONS + HABILIDADES + RETRATOS_CRIATURA, nessa ordem. Nao existe em
// TypeScript nenhum porque arte/icones.py e Python - se a ordem la mudar,
// muda aqui tambem.
const NOMES_ICONES_PNG = [
  "retrato-heroi",
  "retrato-goblin-magricela", "retrato-goblin-gorducho", "retrato-goblin-moleque", "retrato-goblin-chefe",
  "acao-cajado", "acao-punho", "acao-bola-de-fogo", "acao-bafo-gelado", "acao-voz-de-trovao", "acao-sopro-quentinho",
  "dado-1", "dado-2", "dado-3", "dado-4", "dado-5", "dado-6",
  "forca", "esperteza",
  "dom-casco-duro", "dom-olhos-de-coruja", "dom-pata-de-coelho",
  "habilidade-golpe-trovao", "habilidade-tres-magias", "habilidade-olho-de-alvo", "habilidade-fala-bicho", "habilidade-conserta-tudo",
  "retrato-aranha", "retrato-lobo-nevoa",
];
const INDICE_POR_NOME_ICONE = Object.fromEntries(NOMES_ICONES_PNG.map((nome, i) => [nome, i]));

/** So para as 4 classes SEM acao de combate (Mago, Cacador, Amigo, Ferreiro):
 *  o icone delas em icones.png existe (foi gerado) mas nenhuma tela do jogo
 *  ainda usa - fica marcado como "gerado, nao referenciado em codigo". */
const ICONE_HABILIDADE_TEXTO = {
  cavaleiro: "habilidade-golpe-trovao",
  mago: "habilidade-tres-magias",
  cacador: "habilidade-olho-de-alvo",
  amigo: "habilidade-fala-bicho",
  ferreiro: "habilidade-conserta-tudo",
};

/** Candidatos do piloto game-icons.net (docs/inventario-de-icones.md,
 *  2026-09-05). Nao existe em codigo - e decisao de design ainda em aberto,
 *  fica curado aqui a mao mesmo, com o veredito de cada aposta. */
const PILOTO_GAME_ICONS = {
  luzinha: { nome: "Spark Spirit", veredito: "aprovado" },
  "dedo-colante": { nome: "Gecko", veredito: "aprovado" },
  "escudo-de-bolha": { nome: "Aura", veredito: "aprovado" },
  "sumir-sumindo": { nome: "Cowled", veredito: "aposta" },
  "cheiro-de-bolo": { nome: "Fluffy Swirl", veredito: "rejeitado" },
  destreza: { nome: "Crosshair", veredito: "aprovado" },
  agilidade: { nome: "Boots", veredito: "aprovado" },
  inteligencia: { nome: "Brain", veredito: "aprovado" },
  vitalidade: { nome: "Bordered Shield", veredito: "aposta" },
};

// --------------------------------------------------------------- 1. HEROI

const heroi = RACAS.map((raca) => {
  const sprite = RACAS_SPRITE[raca.id];
  const tons = sprite?.tons ?? [];
  return {
    id: raca.id,
    nome: raca.nome,
    corpo: sprite?.corpo ?? "normal",
    desce: sprite?.desce ?? 0,
    tons: tons.map((nomeTom, i) => ({
      nome: nomeTom,
      corpo: dataUri(lerPng(`heroi-corpo-${raca.id}-${i}.png`)),
      bracos: dataUri(lerPng(`heroi-bracos-${raca.id}-${i}.png`)),
    })),
  };
});

const cabelos = CABELOS_ESTILO.map((c) => ({ id: c.id, nome: c.nome, folha: dataUri(lerPng(`heroi-cabelo-${c.id}.png`)) }));
const chapeus = CHAPEUS.filter((c) => c.id !== "nenhum").map((c) => ({ id: c.id, nome: c.nome, folha: dataUri(lerPng(`heroi-chapeu-${c.id}.png`)) }));
const roupas = ROUPAS_ESTILO.flatMap((r) =>
  ["magro", "normal", "gordinho"].map((corpo) => ({
    id: r.id, corpo, nome: r.nome,
    folha: dataUri(lerPng(`roupa-${corpo}-${r.id}.png`)),
  }))
);

// ------------------------------------------------------------ 2. BESTIARIO

const bestiario = BESTIARIO.map((c) => {
  const frame = FRAME_POR_CRIATURA[c.sprite] ?? { frameW: 16, frameH: 32 };
  const variantes =
    c.sprite === "goblin"
      ? ["magricela", "gorducho", "moleque", "chefe"].map((t) => ({ id: t, folha: dataUri(lerPng(`goblin-${t}.png`)) }))
      : c.sprite === "aranha"
        ? [null, ...ARANHAS_SPRITE].map((t) => ({
            id: t ?? "padrao",
            folha: dataUri(lerPng(t ? `aranha-${t}.png` : "aranha.png")),
          }))
        : [{ id: "padrao", folha: dataUri(lerPng(`${c.sprite}.png`)) }];

  const retratoNome =
    c.sprite === "goblin" ? "retrato-goblin-magricela" :
    c.sprite === "aranha" ? "retrato-aranha" :
    c.sprite === "lobo-nevoa" ? "retrato-lobo-nevoa" :
    null;

  return {
    id: c.id, nome: c.nome, sprite: c.sprite, porte: c.porte, comportamento: c.comportamento,
    unico: !!c.unico, coracoes: c.coracoes,
    frame, variantes,
    retratoIndice: retratoNome ? INDICE_POR_NOME_ICONE[retratoNome] : null,
    faltando: variantes.filter((v) => !v.folha).map((v) => v.id),
  };
});

// ------------------------------------------------------------------ 3. NPCS

const npcs = NPCS_SPRITE.map((id) => ({ id, folha: dataUri(lerPng(`npc-${id}.png`)) }));

// ---------------------------------------------------------------- 4. MAGIAS

// agrupa por indice de icone REAL de combate (acaoDaMagia, nao copiado a mao)
// para achar "icone reusado" automaticamente - a mesma logica some sozinha
// do relatorio assim que uma magia ganhar icone proprio no codigo.
const acoesDeMagia = MAGIAS.map((m) => ({ magia: m, acao: acaoDaMagia(m.id) }));
const porIndiceDeIcone = new Map();
for (const { magia, acao } of acoesDeMagia) {
  if (!acao) continue;
  const lista = porIndiceDeIcone.get(acao.icone) ?? [];
  lista.push(magia.id);
  porIndiceDeIcone.set(acao.icone, lista);
}

const magias = acoesDeMagia.map(({ magia, acao }) => {
  const grupo = acao ? porIndiceDeIcone.get(acao.icone) : [];
  const reusado = grupo && grupo.length > 1;
  return {
    id: magia.id, nome: magia.nome, texto: magia.texto,
    cor: "#" + magia.cor.toString(16).padStart(6, "0"),
    iconeIndice: acao?.icone ?? null,
    reusadoCom: reusado ? grupo.filter((id) => id !== magia.id) : [],
    piloto: PILOTO_GAME_ICONS[magia.id] ?? null,
  };
});

// ------------------------------------------------------- 5. ATRIBUTOS & DONS

const porIconeDeAtributo = new Map();
for (const id of ORDEM_PODERES) {
  const nomeIcone = ATRIBUTOS[id].icone;
  const lista = porIconeDeAtributo.get(nomeIcone) ?? [];
  lista.push(id);
  porIconeDeAtributo.set(nomeIcone, lista);
}

const atributos = ORDEM_PODERES.map((id) => {
  const a = ATRIBUTOS[id];
  const grupo = porIconeDeAtributo.get(a.icone);
  const indice = INDICE_POR_NOME_ICONE[a.icone] ?? null;
  // "vitalidade" reusa coracao_cheio, que mora em ui.png (o coracao de vida),
  // nao em icones.png - nao colide com nenhum OUTRO atributo, entao o
  // agrupamento por nome sozinho nao pega esse emprestimo. Se o nome nem
  // resolve dentro de icones.png, e sinal de que veio de outra folha.
  const foraDaFolha = indice == null;
  return {
    id, nome: a.nome, oQueFaz: a.oQueFaz,
    iconeIndice: indice,
    nomeIconeOriginal: a.icone,
    foraDaFolha,
    reusadoCom: grupo.length > 1 ? grupo.filter((x) => x !== id) : [],
    piloto: PILOTO_GAME_ICONS[id] ?? null,
  };
});

const dons = RACAS.map((r) => ({
  racaId: r.id, racaNome: r.nome, nome: r.dom, texto: r.domTexto,
  iconeIndice: INDICE_POR_NOME_ICONE[r.icone] ?? null,
  ehAcaoDeCombate: !!r.acaoDeCombate,
}));

const habilidades = CLASSES.map((c) => {
  const combateIndice = c.habilidadeDeLuta?.icone ?? null;
  // reuso cruzado: uma habilidade de combate pode usar o MESMO indice de
  // icone que uma magia (ex: Golpe Trovao reusa o icone de Voz de Trovao) -
  // vale a pena mostrar, e da pra checar contra o mapa que magias ja montou.
  const reusadoComMagia = combateIndice != null ? (porIndiceDeIcone.get(combateIndice) ?? []) : [];
  return {
    classeId: c.id, classeNome: c.nome, nome: c.habilidade, texto: c.habilidadeTexto,
    temAcaoDeCombate: !!c.habilidadeDeLuta,
    combateIconeIndice: combateIndice,
    reusadoComMagia,
    fichaIconeNome: ICONE_HABILIDADE_TEXTO[c.id] ?? null,
    fichaIconeIndice: ICONE_HABILIDADE_TEXTO[c.id] ? INDICE_POR_NOME_ICONE[ICONE_HABILIDADE_TEXTO[c.id]] : null,
  };
});

// ------------------------------------------------------------ 6. ARMAS/ITENS

const itensPngB64 = lerPng("itens.png");
const itensGrid = Object.entries(ICONE_ITEM).map(([id, indice]) => ({ id, indice }));

// heroi soco + golpe de cada arma que alguma classe usa de fabrica, para
// mostrar o icone de combate de cada arma junto com o restante
const armasDeClasse = [...new Set(CLASSES.map((c) => c.arma))];
const golpes = [
  { id: "soco", nome: "Sem Arma", iconeIndice: ACAO_SOCO.icone },
  ...armasDeClasse.map((armaId) => {
    const golpe = golpeDaArma(armaId);
    return { id: armaId, nome: golpe.nome, iconeIndice: golpe.icone };
  }),
];

// -------------------------------------------------------------------- 7. UI

const uiPngB64 = lerPng("ui.png");
const uiGrid = Object.entries(ICONE_UI).map(([nome, indice]) => ({ nome, indice }));

// ------------------------------------------------------------------ 8. FOLHAS

const icones = { folha: dataUri(lerPng("icones.png")), lado: LADO_ICONE, total: NOMES_ICONES_PNG.length };
const itens = { folha: dataUri(itensPngB64), lado: LADO_ICONE, total: itensGrid.length };
const ui = { folha: dataUri(uiPngB64), lado: LADO_ICONE, total: uiGrid.length };

// -------------------------------------------------------------- 9. RESUMO

const resumo = {
  magiasProprias: magias.filter((m) => m.reusadoCom.length === 0).length,
  magiasTotal: magias.length,
  atributosProprios: atributos.filter((a) => a.reusadoCom.length === 0 && !a.foraDaFolha).length,
  atributosTotal: atributos.length,
  criaturasComRetrato: bestiario.filter((c) => c.retratoIndice != null).length,
  criaturasTotal: bestiario.length,
  spritesFaltando: bestiario.flatMap((c) => c.faltando.map((v) => `${c.sprite}-${v}`)),
};

// =================================================================== HTML

const dados = {
  quadro: QUADRO, linhaDirecao: LINHA_DIRECAO, direcoes: DIRECOES,
  gradeHeroi: GRADE_HEROI, gradeRoupa: GRADE_ROUPA,
  heroi, cabelos, chapeus, roupas,
  bestiario, npcs, magias, atributos, dons, habilidades,
  golpes, itens, itensGrid, ui, uiGrid, icones,
  nomesIconesPng: NOMES_ICONES_PNG,
  resumo,
};

const html = montarHtml(dados);
mkdirSync(SAIDA_DIR, { recursive: true });
writeFileSync(SAIDA, html, "utf-8");

const tamanhoMb = (Buffer.byteLength(html) / 1024 / 1024).toFixed(2);
console.log(`dashboard: ${SAIDA} (${tamanhoMb} MB)`);
console.log(`  magias: ${resumo.magiasProprias}/${resumo.magiasTotal} com icone proprio`);
console.log(`  atributos: ${resumo.atributosProprios}/${resumo.atributosTotal} com icone proprio`);
console.log(`  bestiario: ${resumo.criaturasComRetrato}/${resumo.criaturasTotal} com retrato`);
if (resumo.spritesFaltando.length) console.log(`  sprites faltando: ${resumo.spritesFaltando.join(", ")}`);

// ============================================================== template

function montarHtml(d) {
  const dadosJson = JSON.stringify(d);
  return `<!doctype html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="utf-8">
<title>Painel Visual - Reino de Aurora</title>
<style>
  :root {
    --fundo: #171522; --painel: #1f1d30; --painel-2: #262340;
    --borda: #35314f; --texto: #e7e4f5; --texto-fraco: #9791b8;
    --acento: #f2b33d; --ok: #4caf7d; --falta: #e2483d; --aviso: #e8a53d;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body {
    background: var(--fundo); color: var(--texto);
    font: 14px/1.5 -apple-system, "Segoe UI", sans-serif;
    margin: 0; padding: 0;
  }
  header {
    padding: 20px 24px; border-bottom: 2px solid var(--borda);
    display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap;
  }
  header h1 { margin: 0; font-size: 20px; }
  header .resumo { color: var(--texto-fraco); font-size: 13px; }
  nav {
    display: flex; gap: 4px; padding: 12px 24px 0; flex-wrap: wrap;
    border-bottom: 2px solid var(--borda); position: sticky; top: 0;
    background: var(--fundo); z-index: 10;
  }
  nav button {
    background: none; border: none; color: var(--texto-fraco);
    padding: 10px 16px; font-size: 13px; cursor: pointer; border-radius: 6px 6px 0 0;
  }
  nav button.ativo { background: var(--painel); color: var(--acento); font-weight: 600; }
  nav button:hover { color: var(--texto); }
  main { padding: 24px; max-width: 1400px; margin: 0 auto; }
  section { display: none; }
  section.ativa { display: block; }
  h2 { font-size: 16px; color: var(--acento); margin: 0 0 4px; }
  .sub { color: var(--texto-fraco); font-size: 12px; margin: 0 0 16px; }
  .grade {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  .cartao {
    background: var(--painel); border: 1px solid var(--borda); border-radius: 8px;
    padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .cartao.falta { border-color: var(--falta); border-style: dashed; }
  .cartao canvas { image-rendering: pixelated; background: #0e0c18; border-radius: 4px; }
  .cartao .nome { font-size: 12px; text-align: center; font-weight: 600; }
  .cartao .meta { font-size: 11px; color: var(--texto-fraco); text-align: center; }
  .selo {
    font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .03em;
  }
  .selo.ok { background: rgba(76,175,125,.18); color: var(--ok); }
  .selo.aviso { background: rgba(232,165,61,.18); color: var(--aviso); }
  .selo.falta { background: rgba(226,72,61,.18); color: var(--falta); }
  .controles {
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
    background: var(--painel-2); border-radius: 8px; padding: 12px; margin-bottom: 20px;
  }
  .controles label { font-size: 12px; color: var(--texto-fraco); display: flex; flex-direction: column; gap: 4px; }
  select, button.acao {
    background: var(--painel); color: var(--texto); border: 1px solid var(--borda);
    border-radius: 4px; padding: 6px 10px; font-size: 13px;
  }
  .preview-grande { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 24px; }
  .preview-grande canvas { image-rendering: pixelated; background: #0e0c18; border-radius: 8px; border: 1px solid var(--borda); }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--borda); }
  th { color: var(--texto-fraco); font-weight: 600; font-size: 11px; text-transform: uppercase; }
  .cor-chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: middle; }
  .icone-mini { image-rendering: pixelated; background: #0e0c18; border-radius: 4px; }
  .resumo-cartoes { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .resumo-cartao { background: var(--painel); border: 1px solid var(--borda); border-radius: 8px; padding: 16px; }
  .resumo-cartao .num { font-size: 28px; font-weight: 700; }
  .resumo-cartao .num.ok { color: var(--ok); }
  .resumo-cartao .num.aviso { color: var(--aviso); }
  .resumo-cartao .rotulo { font-size: 12px; color: var(--texto-fraco); }
</style>
</head>
<body>
<header>
  <h1>🎨 Painel Visual — Reino de Aurora</h1>
  <span class="resumo" id="resumo-topo"></span>
</header>
<nav id="nav"></nav>
<main id="main"></main>
<script>
const D = ${dadosJson};
</script>
<script>
${scriptRuntime()}
</script>
</body>
</html>`;
}

function scriptRuntime() {
  // Todo o JS que roda no navegador. Fica como string de proposito: e o
  // motor de recorte/animacao de sprite, generico o bastante pra servir
  // heroi, criatura e icone com o mesmo `desenharQuadro()`.
  return `
// ------------------------------------------------------------ infraestrutura

const abas = [
  ["heroi", "Heroi"], ["bestiario", "Bestiario"], ["npcs", "NPCs"],
  ["magias", "Magias"], ["habilidades", "Habilidades & Dons"], ["atributos", "Atributos"],
  ["itens", "Itens & Armas"], ["ui", "UI"], ["resumo", "Resumo"],
];

const nav = document.getElementById("nav");
const main = document.getElementById("main");
const secoes = {};

for (const [id, nome] of abas) {
  const btn = document.createElement("button");
  btn.textContent = nome;
  btn.onclick = () => selecionar(id);
  btn.dataset.aba = id;
  nav.appendChild(btn);
  const sec = document.createElement("section");
  sec.id = "sec-" + id;
  main.appendChild(sec);
  secoes[id] = sec;
}

function selecionar(id) {
  for (const [aid] of abas) {
    secoes[aid].classList.toggle("ativa", aid === id);
    nav.querySelector('[data-aba="' + aid + '"]').classList.toggle("ativo", aid === id);
  }
  location.hash = id;
}

// -------------------------------------------------------- imagens (cache)

const imgCache = new Map();
function carregarImagem(dataUri) {
  if (!dataUri) return null;
  if (imgCache.has(dataUri)) return imgCache.get(dataUri);
  const img = new Image();
  img.src = dataUri;
  imgCache.set(dataUri, img);
  return img;
}

/** Recorta um quadro (coluna, linha) de uma folha de pose/direcao no canvas,
 *  numa escala inteira. Serve para heroi, criatura e roupa - so muda o
 *  tamanho do frame. */
function desenharQuadro(ctx, folhaImg, frameW, frameH, coluna, linha, escala) {
  if (!folhaImg || !folhaImg.complete) return false;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(
    folhaImg, coluna * frameW, linha * frameH, frameW, frameH,
    0, 0, frameW * escala, frameH * escala
  );
  return true;
}

/** Recorta um icone de 16x16 (icones.png / ui.png / itens.png) pelo indice. */
function desenharIcone(ctx, folhaImg, indice, lado, escala) {
  if (!folhaImg || !folhaImg.complete) return false;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(folhaImg, indice * lado, 0, lado, lado, 0, 0, lado * escala, lado * escala);
  return true;
}

function canvasVazio(mensagem) {
  const div = document.createElement("div");
  div.className = "cartao falta";
  div.innerHTML = '<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;color:var(--falta);font-size:24px;">✕</div><div class="nome">' + mensagem + '</div>';
  return div;
}

// --------------------------------------------------------- loop de animacao

const relogios = []; // { ctx, folha, frameW, frameH, escala, colunaAtual, linhaAtual, ciclo, ultimoTroca }
let ultimoTick = 0;
function tick(agora) {
  if (agora - ultimoTick > 400) {
    ultimoTick = agora;
    for (const r of relogios) {
      if (!r.ciclo || r.ciclo.length < 2) continue;
      r.i = (r.i + 1) % r.ciclo.length;
      r.colunaAtual = r.ciclo[r.i];
    }
  }
  for (const r of relogios) {
    const folhaImg = carregarImagem(r.folha);
    desenharQuadro(r.ctx, folhaImg, r.frameW, r.frameH, r.colunaAtual, r.linhaAtual, r.escala);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function registrarAnimado(canvas, folha, frameW, frameH, ciclo, linha, escala) {
  canvas.width = frameW * escala;
  canvas.height = frameH * escala;
  relogios.push({
    ctx: canvas.getContext("2d"), folha, frameW, frameH, escala,
    ciclo, i: 0, colunaAtual: ciclo[0], linhaAtual: linha,
  });
}

const CICLO_PARADO = [D.quadro.parado, D.quadro.respira];

// ==================================================================== HEROI

(function montarHeroi() {
  const sec = secoes.heroi;
  sec.innerHTML = '<h2>Heroi</h2><p class="sub">5 racas, cada uma com corpo fixo (magro/normal/gordinho) e ate 3 tons de pele proprios. Grade de pose/direcao: ' + D.gradeHeroi.colunas + ' colunas x ' + D.gradeHeroi.linhas + ' linhas, frame ' + D.gradeHeroi.frameW + 'x' + D.gradeHeroi.frameH + '.</p>';

  const controles = document.createElement("div");
  controles.className = "controles";
  const selRaca = document.createElement("select");
  D.heroi.forEach((r, i) => selRaca.add(new Option(r.nome + " (" + r.corpo + ")", i)));
  const selTom = document.createElement("select");
  const selDirecao = document.createElement("select");
  D.direcoes.forEach((dir) => selDirecao.add(new Option(dir, dir)));
  controles.innerHTML = '<label>Raca</label><label>Tom de pele</label><label>Direcao</label>';
  controles.children[0].appendChild(selRaca);
  controles.children[1].appendChild(selTom);
  controles.children[2].appendChild(selDirecao);
  sec.appendChild(controles);

  const preview = document.createElement("div");
  preview.className = "preview-grande";
  sec.appendChild(preview);

  let canvasCorpo, canvasBracos;
  function redesenhar() {
    preview.innerHTML = "";
    const raca = D.heroi[selRaca.value];
    const tom = raca.tons[selTom.value] ?? raca.tons[0];
    const linha = D.linhaDirecao[selDirecao.value];
    const relogiosAntigos = relogios.length;
    relogios.length = 0; // preview grande e a unica coisa animada nesta aba

    const bloco = document.createElement("div");
    bloco.style.position = "relative";
    bloco.style.width = (D.gradeHeroi.frameW * 4) + "px";
    bloco.style.height = (D.gradeHeroi.frameH * 4) + "px";

    canvasCorpo = document.createElement("canvas");
    canvasCorpo.style.position = "absolute"; canvasCorpo.style.left = 0; canvasCorpo.style.top = 0;
    canvasBracos = document.createElement("canvas");
    canvasBracos.style.position = "absolute"; canvasBracos.style.left = 0; canvasBracos.style.top = 0;

    if (tom?.corpo) registrarAnimado(canvasCorpo, tom.corpo, D.gradeHeroi.frameW, D.gradeHeroi.frameH, CICLO_PARADO, linha, 4);
    if (tom?.bracos) registrarAnimado(canvasBracos, tom.bracos, D.gradeHeroi.frameW, D.gradeHeroi.frameH, CICLO_PARADO, linha, 4);

    bloco.appendChild(canvasCorpo);
    bloco.appendChild(canvasBracos);
    preview.appendChild(bloco);

    const legenda = document.createElement("div");
    legenda.innerHTML = '<div class="nome">' + raca.nome + " — " + (tom?.nome ?? "?") + '</div><p class="sub">Pose PARADO (idle + respiracao), 8 direcoes disponiveis no seletor.</p>';
    preview.appendChild(legenda);
  }
  function trocarRaca() {
    const raca = D.heroi[selRaca.value];
    selTom.innerHTML = "";
    raca.tons.forEach((t, i) => selTom.add(new Option(t.nome, i)));
    redesenhar();
  }
  selRaca.onchange = trocarRaca;
  selTom.onchange = redesenhar;
  selDirecao.onchange = redesenhar;
  trocarRaca();

  // grade com todas as combinacoes raca x tom, poses paradas, direcao baixo
  const h3 = document.createElement("h2");
  h3.textContent = "Todas as combinacoes (raca x tom de pele)";
  h3.style.marginTop = "32px";
  sec.appendChild(h3);
  const grade = document.createElement("div");
  grade.className = "grade";
  sec.appendChild(grade);
  D.heroi.forEach((raca) => {
    raca.tons.forEach((tom) => {
      const cartao = document.createElement("div");
      cartao.className = "cartao" + (tom.corpo ? "" : " falta");
      const canvas = document.createElement("canvas");
      if (tom.corpo) registrarAnimado(canvas, tom.corpo, D.gradeHeroi.frameW, D.gradeHeroi.frameH, CICLO_PARADO, 0, 3);
      else { canvas.width = 48; canvas.height = 96; }
      cartao.appendChild(canvas);
      const nome = document.createElement("div");
      nome.className = "nome";
      nome.textContent = raca.nome;
      cartao.appendChild(nome);
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = tom.nome;
      cartao.appendChild(meta);
      grade.appendChild(cartao);
    });
  });

  // cabelos e chapeus, folha inteira exibida (nao recortada) - referencia rapida
  const h4 = document.createElement("h2");
  h4.textContent = "Cabelos (" + D.cabelos.length + ") e chapeus (" + D.chapeus.length + ")";
  h4.style.marginTop = "32px";
  sec.appendChild(h4);
  const grade2 = document.createElement("div");
  grade2.className = "grade";
  sec.appendChild(grade2);
  [...D.cabelos, ...D.chapeus].forEach((acessorio) => {
    const cartao = document.createElement("div");
    cartao.className = "cartao" + (acessorio.folha ? "" : " falta");
    const canvas = document.createElement("canvas");
    if (acessorio.folha) registrarAnimado(canvas, acessorio.folha, D.gradeHeroi.frameW, D.gradeHeroi.frameH, CICLO_PARADO, 0, 3);
    else { canvas.width = 48; canvas.height = 96; }
    cartao.appendChild(canvas);
    const nome = document.createElement("div");
    nome.className = "nome";
    nome.textContent = acessorio.nome;
    cartao.appendChild(nome);
    grade2.appendChild(cartao);
  });
})();

// ================================================================ BESTIARIO

(function montarBestiario() {
  const sec = secoes.bestiario;
  sec.innerHTML = '<h2>Bestiario (' + D.bestiario.length + ' criaturas)</h2><p class="sub">Pose PARADO, direcao baixo. Contorno vermelho tracejado = sprite ausente no disco.</p>';
  const grade = document.createElement("div");
  grade.className = "grade";
  sec.appendChild(grade);

  D.bestiario.forEach((c) => {
    const variantePrincipal = c.variantes[0];
    const cartao = document.createElement("div");
    cartao.className = "cartao" + (c.faltando.length ? " falta" : "");

    const canvas = document.createElement("canvas");
    if (variantePrincipal?.folha) {
      registrarAnimado(canvas, variantePrincipal.folha, c.frame.frameW, c.frame.frameH, CICLO_PARADO, 0, Math.max(1, Math.round(64 / c.frame.frameW)));
    } else {
      canvas.width = 64; canvas.height = 96;
    }
    cartao.appendChild(canvas);

    const nome = document.createElement("div");
    nome.className = "nome";
    nome.textContent = c.nome;
    cartao.appendChild(nome);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = c.porte + " • " + c.comportamento + (c.unico ? " • unico" : "");
    cartao.appendChild(meta);

    // retrato de combate
    if (c.retratoIndice != null && D.icones.folha) {
      const mini = document.createElement("canvas");
      mini.width = 64; mini.height = 64;
      const ctx = mini.getContext("2d");
      const img = carregarImagem(D.icones.folha);
      const desenhar = () => desenharIcone(ctx, img, c.retratoIndice, D.icones.lado, 4);
      if (img.complete) desenhar(); else img.addEventListener("load", desenhar);
      mini.className = "icone-mini";
      mini.title = "Retrato de combate";
      cartao.appendChild(mini);
      const selo = document.createElement("span");
      selo.className = "selo ok"; selo.textContent = "com retrato";
      cartao.appendChild(selo);
    } else {
      const selo = document.createElement("span");
      selo.className = "selo falta"; selo.textContent = "sem retrato";
      cartao.appendChild(selo);
    }

    if (c.variantes.length > 1) {
      const varMeta = document.createElement("div");
      varMeta.className = "meta";
      varMeta.textContent = c.variantes.length + " variantes: " + c.variantes.map((v) => v.id + (v.folha ? "" : "✕")).join(", ");
      cartao.appendChild(varMeta);
    }
    if (c.faltando.length) {
      const faltaMeta = document.createElement("div");
      faltaMeta.className = "selo falta";
      faltaMeta.textContent = "faltando: " + c.faltando.join(", ");
      cartao.appendChild(faltaMeta);
    }

    grade.appendChild(cartao);
  });
})();

// ===================================================================== NPCS

(function montarNpcs() {
  const sec = secoes.npcs;
  sec.innerHTML = '<h2>NPCs (' + D.npcs.length + ')</h2><p class="sub">Pose PARADO, direcao baixo.</p>';
  const grade = document.createElement("div");
  grade.className = "grade";
  sec.appendChild(grade);
  D.npcs.forEach((npc) => {
    const cartao = document.createElement("div");
    cartao.className = "cartao" + (npc.folha ? "" : " falta");
    const canvas = document.createElement("canvas");
    if (npc.folha) registrarAnimado(canvas, npc.folha, D.gradeHeroi.frameW, D.gradeHeroi.frameH, CICLO_PARADO, 0, 3);
    else { canvas.width = 48; canvas.height = 96; }
    cartao.appendChild(canvas);
    const nome = document.createElement("div");
    nome.className = "nome";
    nome.textContent = npc.id;
    cartao.appendChild(nome);
    grade.appendChild(cartao);
  });
})();

// =================================================================== MAGIAS

(function montarMagias() {
  const sec = secoes.magias;
  const proprias = D.magias.filter((m) => m.reusadoCom.length === 0).length;
  sec.innerHTML = '<h2>Magias (' + D.magias.length + ')</h2><p class="sub">' + proprias + ' de ' + D.magias.length + ' com icone proprio de combate (calculado a partir de acaoDaMagia(), nao copiado a mao).</p>';
  const grade = document.createElement("div");
  grade.className = "grade";
  sec.appendChild(grade);

  D.magias.forEach((m) => {
    const cartao = document.createElement("div");
    cartao.className = "cartao";
    if (m.iconeIndice != null && D.icones.folha) {
      const canvas = document.createElement("canvas");
      canvas.width = 80; canvas.height = 80;
      const ctx = canvas.getContext("2d");
      const img = carregarImagem(D.icones.folha);
      const desenhar = () => desenharIcone(ctx, img, m.iconeIndice, D.icones.lado, 5);
      if (img.complete) desenhar(); else img.addEventListener("load", desenhar);
      canvas.className = "icone-mini";
      cartao.appendChild(canvas);
    }
    const nome = document.createElement("div");
    nome.className = "nome";
    nome.innerHTML = '<span class="cor-chip" style="background:' + m.cor + '"></span>' + m.nome;
    cartao.appendChild(nome);

    if (m.reusadoCom.length) {
      const selo = document.createElement("span");
      selo.className = "selo falta";
      selo.textContent = "reusa icone com " + m.reusadoCom.length + " outra(s)";
      cartao.appendChild(selo);
    } else {
      const selo = document.createElement("span");
      selo.className = "selo ok";
      selo.textContent = "icone proprio";
      cartao.appendChild(selo);
    }
    if (m.piloto) {
      const selo = document.createElement("span");
      selo.className = "selo " + (m.piloto.veredito === "aprovado" ? "ok" : m.piloto.veredito === "aposta" ? "aviso" : "falta");
      selo.textContent = "piloto: " + m.piloto.nome + " (" + m.piloto.veredito + ")";
      cartao.appendChild(selo);
    }
    const texto = document.createElement("div");
    texto.className = "meta";
    texto.textContent = m.texto;
    cartao.appendChild(texto);

    grade.appendChild(cartao);
  });
})();

// ============================================================ HABILIDADES

(function montarHabilidades() {
  const sec = secoes.habilidades;
  sec.innerHTML = '<h2>Habilidades de classe (' + D.habilidades.length + ') e dons de raca (' + D.dons.length + ')</h2><p class="sub">"Sem acao de combate" = existe so como texto (habilidadeTexto), nunca vira slot de luta.</p>';

  const tabela = document.createElement("table");
  tabela.innerHTML = '<tr><th>Icone</th><th>Classe</th><th>Habilidade</th><th>Combate?</th><th>Observacao</th></tr>';
  sec.appendChild(tabela);

  D.habilidades.forEach((h) => {
    const tr = document.createElement("tr");
    const tdIcone = document.createElement("td");
    const indice = h.combateIconeIndice ?? h.fichaIconeIndice;
    if (indice != null && D.icones.folha) {
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext("2d");
      const img = carregarImagem(D.icones.folha);
      const desenhar = () => desenharIcone(ctx, img, indice, D.icones.lado, 4);
      if (img.complete) desenhar(); else img.addEventListener("load", desenhar);
      canvas.className = "icone-mini";
      tdIcone.appendChild(canvas);
    }
    tr.appendChild(tdIcone);
    tr.innerHTML += '<td>' + h.classeNome + '</td><td>' + h.nome + '</td>';
    const tdCombate = document.createElement("td");
    const selo = document.createElement("span");
    selo.className = "selo " + (h.temAcaoDeCombate ? "ok" : "aviso");
    selo.textContent = h.temAcaoDeCombate ? "sim" : "nao (so texto)";
    tdCombate.appendChild(selo);
    tr.appendChild(tdCombate);
    const tdObs = document.createElement("td");
    tdObs.className = "meta";
    if (h.reusadoComMagia.length) tdObs.textContent = "reusa icone de combate com: " + h.reusadoComMagia.join(", ");
    else if (h.fichaIconeNome) tdObs.textContent = "icone proprio (" + h.fichaIconeNome + ") gerado mas nao referenciado em codigo ainda";
    tr.appendChild(tdObs);
    tabela.appendChild(tr);
  });

  const h3 = document.createElement("h2");
  h3.textContent = "Dons de raca";
  h3.style.marginTop = "24px";
  sec.appendChild(h3);
  const tabela2 = document.createElement("table");
  tabela2.innerHTML = '<tr><th>Icone</th><th>Raca</th><th>Dom</th><th>Acao de combate?</th></tr>';
  sec.appendChild(tabela2);
  D.dons.forEach((dom) => {
    const tr = document.createElement("tr");
    const tdIcone = document.createElement("td");
    if (dom.iconeIndice != null && D.icones.folha) {
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext("2d");
      const img = carregarImagem(D.icones.folha);
      const desenhar = () => desenharIcone(ctx, img, dom.iconeIndice, D.icones.lado, 4);
      if (img.complete) desenhar(); else img.addEventListener("load", desenhar);
      canvas.className = "icone-mini";
      tdIcone.appendChild(canvas);
    }
    tr.appendChild(tdIcone);
    tr.innerHTML += '<td>' + dom.racaNome + '</td><td>' + dom.nome + '</td>';
    const tdCombate = document.createElement("td");
    const selo = document.createElement("span");
    selo.className = "selo " + (dom.ehAcaoDeCombate ? "ok" : "aviso");
    selo.textContent = dom.ehAcaoDeCombate ? "sim" : "nao (passivo/dado)";
    tdCombate.appendChild(selo);
    tr.appendChild(tdCombate);
    tabela2.appendChild(tr);
  });
})();

// ============================================================== ATRIBUTOS

(function montarAtributos() {
  const sec = secoes.atributos;
  const proprios = D.atributos.filter((a) => a.reusadoCom.length === 0 && !a.foraDaFolha).length;
  sec.innerHTML = '<h2>Atributos (' + D.atributos.length + ')</h2><p class="sub">' + proprios + ' de ' + D.atributos.length + ' com icone proprio (agrupado por ATRIBUTOS[].icone; "fora da folha" = usa icone de outra planilha, tipo o coracao de vida).</p>';
  const grade = document.createElement("div");
  grade.className = "grade";
  sec.appendChild(grade);
  D.atributos.forEach((a) => {
    const cartao = document.createElement("div");
    cartao.className = "cartao";
    if (a.iconeIndice != null && D.icones.folha) {
      const canvas = document.createElement("canvas");
      canvas.width = 80; canvas.height = 80;
      const ctx = canvas.getContext("2d");
      const img = carregarImagem(D.icones.folha);
      const desenhar = () => desenharIcone(ctx, img, a.iconeIndice, D.icones.lado, 5);
      if (img.complete) desenhar(); else img.addEventListener("load", desenhar);
      canvas.className = "icone-mini";
      cartao.appendChild(canvas);
    }
    const nome = document.createElement("div");
    nome.className = "nome";
    nome.textContent = a.nome;
    cartao.appendChild(nome);
    if (a.reusadoCom.length) {
      const selo = document.createElement("span");
      selo.className = "selo falta";
      selo.textContent = "reusa icone com: " + a.reusadoCom.join(", ");
      cartao.appendChild(selo);
    } else if (a.foraDaFolha) {
      const selo = document.createElement("span");
      selo.className = "selo falta";
      selo.textContent = 'usa icone de outra folha ("' + a.nomeIconeOriginal + '")';
      cartao.appendChild(selo);
    } else {
      const selo = document.createElement("span");
      selo.className = "selo ok";
      selo.textContent = "icone proprio";
      cartao.appendChild(selo);
    }
    if (a.piloto) {
      const selo = document.createElement("span");
      selo.className = "selo " + (a.piloto.veredito === "aprovado" ? "ok" : a.piloto.veredito === "aposta" ? "aviso" : "falta");
      selo.textContent = "piloto: " + a.piloto.nome + " (" + a.piloto.veredito + ")";
      cartao.appendChild(selo);
    }
    const texto = document.createElement("div");
    texto.className = "meta";
    texto.textContent = a.oQueFaz;
    cartao.appendChild(texto);
    grade.appendChild(cartao);
  });
})();

// ================================================================== ITENS

(function montarItens() {
  const sec = secoes.itens;
  sec.innerHTML = '<h2>Golpes de arma (' + D.golpes.length + ')</h2>';
  const grade = document.createElement("div");
  grade.className = "grade";
  sec.appendChild(grade);
  D.golpes.forEach((g) => {
    const cartao = document.createElement("div");
    cartao.className = "cartao";
    if (g.iconeIndice != null && D.icones.folha) {
      const canvas = document.createElement("canvas");
      canvas.width = 80; canvas.height = 80;
      const ctx = canvas.getContext("2d");
      const img = carregarImagem(D.icones.folha);
      const desenhar = () => desenharIcone(ctx, img, g.iconeIndice, D.icones.lado, 5);
      if (img.complete) desenhar(); else img.addEventListener("load", desenhar);
      canvas.className = "icone-mini";
      cartao.appendChild(canvas);
    }
    const nome = document.createElement("div");
    nome.className = "nome";
    nome.textContent = g.nome;
    cartao.appendChild(nome);
    grade.appendChild(cartao);
  });

  const h3 = document.createElement("h2");
  h3.textContent = "Itens de mochila e silhuetas de arma (" + D.itensGrid.length + ")";
  h3.style.marginTop = "32px";
  sec.appendChild(h3);
  const grade2 = document.createElement("div");
  grade2.className = "grade";
  sec.appendChild(grade2);
  D.itensGrid.forEach((item) => {
    const cartao = document.createElement("div");
    cartao.className = "cartao";
    if (D.itens.folha) {
      const canvas = document.createElement("canvas");
      canvas.width = 80; canvas.height = 80;
      const ctx = canvas.getContext("2d");
      const img = carregarImagem(D.itens.folha);
      const desenhar = () => desenharIcone(ctx, img, item.indice, D.itens.lado, 5);
      if (img.complete) desenhar(); else img.addEventListener("load", desenhar);
      canvas.className = "icone-mini";
      cartao.appendChild(canvas);
    }
    const nome = document.createElement("div");
    nome.className = "nome";
    nome.style.fontSize = "10px";
    nome.textContent = item.id;
    cartao.appendChild(nome);
    grade2.appendChild(cartao);
  });
})();

// ====================================================================== UI

(function montarUi() {
  const sec = secoes.ui;
  sec.innerHTML = '<h2>Icones de interface (' + D.uiGrid.length + ')</h2>';
  const grade = document.createElement("div");
  grade.className = "grade";
  sec.appendChild(grade);
  D.uiGrid.forEach((item) => {
    const cartao = document.createElement("div");
    cartao.className = "cartao";
    if (D.ui.folha) {
      const canvas = document.createElement("canvas");
      canvas.width = 80; canvas.height = 80;
      const ctx = canvas.getContext("2d");
      const img = carregarImagem(D.ui.folha);
      const desenhar = () => desenharIcone(ctx, img, item.indice, D.ui.lado, 5);
      if (img.complete) desenhar(); else img.addEventListener("load", desenhar);
      canvas.className = "icone-mini";
      cartao.appendChild(canvas);
    }
    const nome = document.createElement("div");
    nome.className = "nome";
    nome.style.fontSize = "10px";
    nome.textContent = item.nome;
    cartao.appendChild(nome);
    grade.appendChild(cartao);
  });
})();

// =================================================================== RESUMO

(function montarResumo() {
  const sec = secoes.resumo;
  const r = D.resumo;
  sec.innerHTML = '<h2>Resumo de padronizacao</h2><p class="sub">Recalculado a cada npm run dashboard - nunca desatualiza sozinho.</p>';
  const cartoes = document.createElement("div");
  cartoes.className = "resumo-cartoes";
  const item = (num, total, rotulo) => {
    const div = document.createElement("div");
    div.className = "resumo-cartao";
    div.innerHTML = '<div class="num ' + (num === total ? "ok" : "aviso") + '">' + num + '/' + total + '</div><div class="rotulo">' + rotulo + '</div>';
    return div;
  };
  cartoes.appendChild(item(r.magiasProprias, r.magiasTotal, "magias com icone proprio"));
  cartoes.appendChild(item(r.atributosProprios, r.atributosTotal, "atributos com icone proprio"));
  cartoes.appendChild(item(r.criaturasComRetrato, r.criaturasTotal, "criaturas com retrato de combate"));
  const divFalta = document.createElement("div");
  divFalta.className = "resumo-cartao";
  divFalta.innerHTML = '<div class="num ' + (r.spritesFaltando.length ? "aviso" : "ok") + '">' + r.spritesFaltando.length + '</div><div class="rotulo">sprites ausentes no disco</div>';
  cartoes.appendChild(divFalta);
  sec.appendChild(cartoes);

  if (r.spritesFaltando.length) {
    const p = document.createElement("p");
    p.innerHTML = '<strong>Faltando:</strong> ' + r.spritesFaltando.join(", ") + '. Rode <code>npm run arte</code> e confira se arte/gente.py gera esse sprite.';
    sec.appendChild(p);
  }

  const p2 = document.createElement("p");
  p2.className = "sub";
  p2.textContent = "Dois pipelines de icone coexistem hoje: pixel art 16x16 (arte/icones.py, em producao) e o piloto game-icons.net (vetor recolorido, ainda nao integrado). Ver docs/inventario-de-icones.md para o veredito de cada candidato do piloto, marcado nas abas Magias e Atributos.";
  sec.appendChild(p2);
})();

// ---------------------------------------------------------------- resumo no topo

document.getElementById("resumo-topo").textContent =
  D.resumo.magiasProprias + "/" + D.resumo.magiasTotal + " magias • " +
  D.resumo.atributosProprios + "/" + D.resumo.atributosTotal + " atributos • " +
  D.resumo.criaturasComRetrato + "/" + D.resumo.criaturasTotal + " retratos" +
  (D.resumo.spritesFaltando.length ? " • " + D.resumo.spritesFaltando.length + " sprite(s) ausente(s)" : "");

// ---------------------------------------------------------------- abertura

selecionar(location.hash ? location.hash.slice(1) : "heroi");
`;
}
