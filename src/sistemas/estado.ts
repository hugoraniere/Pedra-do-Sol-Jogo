/** Estado do jogo. Uma unica fonte da verdade sobre o progresso.
 *  Quem grava e le no disco e sistemas/armazenamento.ts. */
import { gravarEspaco, lerEspaco } from "./armazenamento";
import { acharMaterial } from "../dados/conteudo";

export type Heroi = {
  nome: string;
  raca: string;
  classe: string;
  magias: string[];
  /** aparencia: tudo o que muda as camadas de sprite */
  tomPele: number;
  estiloCabelo: string;
  corCabelo: number;
  estiloRoupa: string;
  corRoupa: number;
  chapeu: string;
  corChapeu: number;
  armaSprite: string;
  /** Armadura e acessorio equipados agora — achados ou comprados depois da
   *  criacao, `null` quando o slot esta vazio. A arma continua em
   *  `armaSprite` (ja existia); estes dois sao novos, ver
   *  docs/plano-de-itens-e-equipamento.md. */
  equipamento: { armadura: string | null; acessorio: string | null };
  /** O +1 que o jogador coloca onde quiser, o passo 4 do manual impresso.
   *
   *  Guardamos a ESCOLHA, e nao o total dos tres poderes. O total sai de
   *  poderesDoHeroi(), somando o +1 da raca, o +1 da classe e este. Assim, se um
   *  dia a Cria de Dragao trocar de bonus em conteudo.ts, o save do Lele
   *  acompanha em vez de ficar congelado com a regra antiga dentro dele. */
  poderEscolhido: string;
};

export type Estado = {
  espaco: number;
  heroi: Heroi;
  coracoes: number;
  coracoesMax: number;
  moedas: number;
  selos: number;
  /** posse de item, com contagem — chave e o id (de `LOJA`, `MATERIAIS`, ou
   *  um item de historia como "pano-goblin"), valor e quantos tem. Save
   *  antigo guardava so uma lista de posse (sem contar); `abrirEspaco()`
   *  migra pra `{ id: 1 }` cada, uma vez, na leitura. */
  mochila: Record<string, number>;
  visitados: string[];
  /** chave estavel de cada criatura ja vencida (`${cena}:${indice}` no mapa),
   *  para ela nao voltar a existir quando o jogador reentra no lugar */
  derrotados: string[];
  cena: string;
  lugar: string;
  minutos: number;
  /** minuto do dia simulado, 0 a 1439 — ver sistemas/tempo.ts */
  relogio: number;
  /** quanto cada NPC gosta do heroi, por escolha de dialogo. Chave = id do
   *  NPC (o mesmo de dialogos.ts/npcs.ts). So sobe: escolha errada nunca
   *  desconta, so nao rende o ponto — ver sistemas/missoes.ts. */
  afinidades: Record<string, number>;
  /** chave estavel `${cena}:${x},${y}` (tile) de cada fogueira ja acesa, na
   *  ordem em que foram acesas — a ULTIMA e onde o heroi acorda ao cair.
   *  Nao confundir com o "acesa/apagada" de docs/mundo-que-reage.md (marca
   *  elemental de fogo/agua, sistema diferente que ainda nao existe): isto
   *  aqui e o checkpoint, permanente, nunca apagado por magia nenhuma. */
  fogueirasAcesas: string[];
  criadoEm: number;
  atualizadoEm: number;
  /** quantas vezes cada acao de escopo "porAventura" (magia, dom de raca) ja
   *  foi usada nesta aventura. Chave = id da acao. Zera na troca de aventura
   *  (ainda nao existe onde isso acontece - ver Fase 9 revista). */
  usosDeAventura: Record<string, number>;
};

export const VAZIO: Estado = {
  espaco: 0,
  heroi: {
    nome: "",
    raca: "elfo",
    classe: "mago",
    magias: [],
    tomPele: 0,
    estiloCabelo: "comprido",
    corCabelo: 0x3e9b62,
    // Simples de proposito: camisa, sem chapeu, sem arma. O heroi comeca assim
    // em qualquer classe, e veste a armadura ou pega a arma da classe depois,
    // por conta ou achado. A classe MOSTRA aquele equipamento na criacao, mas
    // ninguem sai da vila ja de armadura. Ver equipamentoDaClasse() em Criacao.ts.
    estiloRoupa: "tunica",
    corRoupa: 0x3e9b62,
    chapeu: "nenhum",
    corChapeu: 0x7b5ac4,
    armaSprite: "nenhuma",
    equipamento: { armadura: null, acessorio: null },
    poderEscolhido: "",
  },
  coracoes: 3,
  coracoesMax: 3,
  moedas: 5,
  selos: 0,
  mochila: {},
  visitados: [],
  derrotados: [],
  cena: "vila",
  lugar: "Vila Semente",
  minutos: 0,
  // 480 = 8h, o heroi chega de manha
  relogio: 480,
  afinidades: {},
  // a vila comeca com a propria fogueira ja acesa: ninguem cai sem ter pra
  // onde acordar, mesmo antes de acender qualquer uma por conta propria
  fogueirasAcesas: ["vila:16,10"],
  criadoEm: 0,
  atualizadoEm: 0,
  usosDeAventura: {},
};

function copia<Tipo>(v: Tipo): Tipo {
  return JSON.parse(JSON.stringify(v));
}

let atual: Estado = copia(VAZIO);
let inicioDaSessao = Date.now();

export function estado(): Estado {
  return atual;
}

/** Comeca um jogo novo naquele espaco. */
export function novoJogo(espaco: number, heroi: Heroi) {
  atual = copia(VAZIO);
  atual.espaco = espaco;
  atual.heroi = heroi;
  atual.criadoEm = Date.now();
  inicioDaSessao = Date.now();
  salvar();
}

/** Retoma um jogo ja salvo. Devolve false se o espaco estiver vazio. */
export function abrirEspaco(espaco: number): boolean {
  const lido = lerEspaco(espaco);
  if (!lido) return false;
  atual = { ...copia(VAZIO), ...lido, espaco };
  // o espalhamento de cima e raso: o heroi lido substitui o heroi inteiro do
  // VAZIO, entao um save gravado antes de um campo novo existir voltaria sem
  // ele. Aqui o heroi antigo ganha os campos que nasceram depois dele.
  atual.heroi = { ...copia(VAZIO.heroi), ...(lido.heroi ?? {}) };
  // save antigo guardava mochila como lista (so posse, sem contagem) — um
  // array sobrescreveria o {} novo do VAZIO no espalhamento acima. Migra pra
  // contagem 1 cada, uma vez, na leitura.
  if (Array.isArray(lido.mochila)) {
    const antiga = lido.mochila as unknown as string[];
    atual.mochila = {};
    for (const item of antiga) atual.mochila[item] = (atual.mochila[item] ?? 0) + 1;
  }
  inicioDaSessao = Date.now();
  return true;
}

export function salvar() {
  const decorrido = Math.floor((Date.now() - inicioDaSessao) / 60000);
  if (decorrido > 0) {
    atual.minutos += decorrido;
    inicioDaSessao = Date.now();
  }
  atual.atualizadoEm = Date.now();
  gravarEspaco(atual.espaco, atual);
}

export function guardar(item: string, quantidade = 1) {
  atual.mochila[item] = (atual.mochila[item] ?? 0) + quantidade;
  salvar();
}

/** Tira `quantidade` de um item da mochila, sem salvar sozinha — quem chama
 *  decide o resto da transacao (usar, vender) antes de salvar uma vez so. */
function retirarDaMochila(item: string, quantidade: number): boolean {
  const posse = atual.mochila[item] ?? 0;
  if (posse < quantidade) return false;
  const restante = posse - quantidade;
  if (restante <= 0) delete atual.mochila[item];
  else atual.mochila[item] = restante;
  return true;
}

/** Consome um consumivel fora de combate (a Fase 6, uso em luta, e outro
 *  assunto — ver docs/plano-de-itens-e-equipamento.md). Devolve false sem
 *  gastar nada se nao houver o suficiente na mochila. O EFEITO em si (encher
 *  coracao, etc.) ainda nao existe: isto so cuida da posse. */
export function usar(item: string, quantidade = 1): boolean {
  if (!retirarDaMochila(item, quantidade)) return false;
  salvar();
  return true;
}

/** Troca material por moeda, pelo preco de `MATERIAIS` em conteudo.ts.
 *  Devolve false sem gastar nada se o item nao for um material conhecido ou
 *  faltar quantidade. */
export function venderMaterial(item: string, quantidade = 1): boolean {
  const material = acharMaterial(item);
  if (!material) return false;
  if (!retirarDaMochila(item, quantidade)) return false;
  atual.moedas += material.preco * quantidade;
  salvar();
  return true;
}

/** Poe ou tira algo de um slot de equipamento. `itemId: null` esvazia o
 *  slot. A arma continua morando em `heroi.armaSprite` (ja existia); isto
 *  so unifica os tres numa mesma porta de entrada. */
export function equipar(slot: "arma" | "armadura" | "acessorio", itemId: string | null) {
  if (slot === "arma") atual.heroi.armaSprite = itemId ?? "nenhuma";
  else atual.heroi.equipamento[slot] = itemId;
  salvar();
}

export function marcarVisitado(chave: string): boolean {
  if (atual.visitados.includes(chave)) return false;
  atual.visitados.push(chave);
  salvar();
  return true;
}

/** Escolha de dialogo que o NPC gosta soma ponto; a que ele nao gosta nunca
 *  desconta, so nao rende o extra (falha sem humilhacao vale pra afinidade
 *  tambem). */
export function mudarAfinidade(npcId: string, delta: number) {
  atual.afinidades[npcId] = (atual.afinidades[npcId] ?? 0) + delta;
  salvar();
}

export function afinidadeCom(npcId: string): number {
  return atual.afinidades[npcId] ?? 0;
}

export function foiAcesa(chave: string): boolean {
  return atual.fogueirasAcesas.includes(chave);
}

/** Acender e permanente: uma fogueira ja acesa nunca sai da lista, nem apaga.
 *  Chamar de novo numa ja acesa NAO e no-op: ela sobe pro fim da lista, porque
 *  descansar ali agora e o que a torna o ponto de retorno, nao so o fato dela
 *  ja ter sido acesa uma vez antes. */
export function acenderFogueira(chave: string) {
  const i = atual.fogueirasAcesas.indexOf(chave);
  if (i !== -1) atual.fogueirasAcesas.splice(i, 1);
  atual.fogueirasAcesas.push(chave);
  salvar();
}

/** Onde o heroi acorda se cair agora. A lista sempre tem pelo menos a
 *  fogueira da vila (ver `VAZIO`), entao isto nunca devolve vazio. */
export function ultimaFogueiraAcesa(): string {
  return atual.fogueirasAcesas[atual.fogueirasAcesas.length - 1];
}

export function foiDerrotado(chave: string): boolean {
  return atual.derrotados.includes(chave);
}

export function marcarDerrotado(chave: string) {
  if (atual.derrotados.includes(chave)) return;
  atual.derrotados.push(chave);
  salvar();
}

/** Quantas vezes uma acao "por aventura" (magia, dom de raca) ja foi usada. */
export function usosGastos(acaoId: string): number {
  return atual.usosDeAventura[acaoId] ?? 0;
}

/** Registra mais um uso de uma acao "por aventura" e salva na hora - perder
 *  o save no meio nunca pode devolver um uso de graca. */
export function registrarUso(acaoId: string) {
  atual.usosDeAventura[acaoId] = usosGastos(acaoId) + 1;
  salvar();
}
