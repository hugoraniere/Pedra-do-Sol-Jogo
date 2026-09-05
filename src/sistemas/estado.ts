/** Estado do jogo. Uma unica fonte da verdade sobre o progresso.
 *  Quem grava e le no disco e sistemas/armazenamento.ts. */
import { gravarEspaco, lerEspaco } from "./armazenamento.ts";
import { acharMaterial, acharMochila, acharRaca, type Atributo } from "../dados/conteudo.ts";

/** Um slot da mochila: um item (com quantidade) ou vazio. Slot tem POSICAO
 *  fixa — e o que deixa arrastar um item de lugar (`moverItem`) fazer
 *  sentido, diferente da contagem solta que a mochila usava antes (ver
 *  docs/plano-de-itens-e-equipamento.md). */
export type SlotDaMochila = { item: string; quantidade: number } | null;

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
  /** +1 permanente por Selo de Heroi escolhido em cada poder, ALEM do +1 da
   *  criacao (`poderEscolhido`). Fica no heroi, nao no estado do save-slot em
   *  geral, porque e progressao do PERSONAGEM — o mesmo motivo de
   *  `poderEscolhido` morar aqui. Ver sistemas/poderes.ts. */
  bonusDeSelo: Record<Atributo, number>;
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
  /** slot por posicao — o comprimento e sempre `acharMochila(mochilaAtual)
   *  .slots`. Save antigo guardava um dicionario de contagem (antes disso,
   *  uma lista de posse crua); `abrirEspaco()` migra os dois formatos pra
   *  slot, uma vez, na leitura. Nunca mexa no comprimento na mao — use
   *  `comprarMochila()`. */
  mochila: SlotDaMochila[];
  /** id de `MOCHILAS` (conteudo.ts) — decide `mochila.length`. Comeca na
   *  pequena; so cresce, via `comprarMochila()`. */
  mochilaAtual: string;
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
  /** 0 = acabou de comer, 100 = faminto critico. Sobe com o RELOGIO de jogo
   *  (nao com minutos reais de sessao) — ver sistemas/moodles.ts. Comer
   *  reseta pra 0. */
  fome: number;
  /** 0 = descansado, 100 = exausto critico. Dormir numa cama reseta pra 0. */
  sono: number;
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
    bonusDeSelo: { forca: 0, destreza: 0, agilidade: 0, inteligencia: 0, vitalidade: 0 },
    poderEscolhido: "",
  },
  coracoes: 3,
  coracoesMax: 3,
  moedas: 5,
  selos: 0,
  mochila: new Array(8).fill(null),
  mochilaAtual: "mochila-pequena",
  visitados: [],
  derrotados: [],
  // uma partida nova comeca na Praia de Chegada, desembarcando do navio — a
  // Trilha (e a Vila, e o sino) so aparecem depois (ver dados/mapas.ts)
  cena: "praia",
  lugar: "Praia de Chegada",
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
  // o heroi chega alimentado e descansado, do navio
  fome: 0,
  sono: 0,
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
  // o dom do Anao ("Casco Duro") e nascer com 4 coracoes em vez de 3 — o
  // numero ja existe em `acharRaca(heroi.raca).coracoes`, so precisava ser
  // lido aqui em vez do 3 fixo de VAZIO.
  atual.coracoesMax = acharRaca(heroi.raca).coracoes;
  atual.coracoes = atual.coracoesMax;
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
  atual.mochila = migrarMochila(lido.mochila, atual.mochilaAtual);
  inicioDaSessao = Date.now();
  return true;
}

/** A mochila ja teve tres formatos: lista de posse crua (`string[]`),
 *  dicionario de contagem (`Record<string, number>`), e agora slot por
 *  posicao. Detecta o formato do save e converte pro atual, uma vez, na
 *  leitura — nenhum dos dois formatos antigos e escrito de novo.
 *
 *  O tamanho normal vem da mochila equipada, mas se o save tinha MAIS
 *  pilhas de item do que a mochila atual comporta (dicionario antigo nao
 *  tinha limite nenhum), a mochila migrada cresce pra caber tudo — perder
 *  item na migracao seria pior que uma mochila temporariamente "cheia
 *  demais pro tamanho dela". */
function migrarMochila(bruta: unknown, mochilaAtualId: string): SlotDaMochila[] {
  const capacidade = acharMochila(mochilaAtualId).slots;
  let pilhas: { item: string; quantidade: number }[];
  if (Array.isArray(bruta) && bruta.every((v) => typeof v === "string")) {
    // formato mais antigo: lista de posse, uma entrada por unidade
    const contagem: Record<string, number> = {};
    for (const item of bruta as string[]) contagem[item] = (contagem[item] ?? 0) + 1;
    pilhas = Object.entries(contagem).map(([item, quantidade]) => ({ item, quantidade }));
  } else if (bruta && typeof bruta === "object" && !Array.isArray(bruta)) {
    // formato do meio: dicionario de contagem
    pilhas = Object.entries(bruta as Record<string, number>).map(([item, quantidade]) => ({ item, quantidade }));
  } else if (Array.isArray(bruta)) {
    // ja e slot (ou save novo, sem mochila ainda) — so garante o tamanho certo
    const slots = (bruta as SlotDaMochila[]).slice();
    while (slots.length < capacidade) slots.push(null);
    return slots;
  } else {
    return new Array(capacidade).fill(null);
  }
  const slots: SlotDaMochila[] = new Array(Math.max(capacidade, pilhas.length)).fill(null);
  pilhas.forEach((p, i) => (slots[i] = p));
  return slots;
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

/** Guarda `quantidade` de um item: empilha num slot que ja tem esse item, ou
 *  ocupa o primeiro slot vazio. Devolve false sem gastar nada se a mochila
 *  estiver cheia (nenhum slot igual, nenhum vazio) — quem chama decide o que
 *  fazer (por agora, os dois lugares que chamam isto ignoram o retorno,
 *  igual sempre ignoraram; a mochila comeca grande o bastante pra isso ser
 *  raro no jogo de hoje). */
export function guardar(item: string, quantidade = 1): boolean {
  const iExistente = atual.mochila.findIndex((s) => s?.item === item);
  if (iExistente >= 0) {
    atual.mochila[iExistente]!.quantidade += quantidade;
    salvar();
    return true;
  }
  const iVazio = atual.mochila.findIndex((s) => s === null);
  if (iVazio < 0) return false;
  atual.mochila[iVazio] = { item, quantidade };
  salvar();
  return true;
}

/** Tira `quantidade` de um item da mochila (de qualquer slot que o tenha),
 *  sem salvar sozinha — quem chama decide o resto da transacao (usar,
 *  vender) antes de salvar uma vez so. */
function retirarDaMochila(item: string, quantidade: number): boolean {
  const i = atual.mochila.findIndex((s) => s?.item === item);
  if (i < 0) return false;
  const slot = atual.mochila[i]!;
  if (slot.quantidade < quantidade) return false;
  if (slot.quantidade === quantidade) atual.mochila[i] = null;
  else slot.quantidade -= quantidade;
  return true;
}

/** Tira `quantidade` de um slot pela POSICAO (nao pelo item) — usado por
 *  quem ja sabe o indice na grade (a Ficha, jogando fora ou vendendo pelo
 *  slot que o jogador tocou), diferente de `retirarDaMochila` (usado por
 *  quem so sabe o id, como `usar`/`venderMaterial`). */
function retirarDoSlot(indice: number, quantidade: number): boolean {
  const slot = atual.mochila[indice];
  if (!slot || slot.quantidade < quantidade) return false;
  if (slot.quantidade === quantidade) atual.mochila[indice] = null;
  else slot.quantidade -= quantidade;
  return true;
}

/** Joga fora (descarta, sem moeda nenhuma — diferente de `venderMaterial`)
 *  `quantidade` do slot `indice`. Devolve false sem mudar nada se o slot
 *  estiver vazio ou nao tiver quantidade suficiente. */
export function jogarFora(indice: number, quantidade = 1): boolean {
  if (!retirarDoSlot(indice, quantidade)) return false;
  salvar();
  return true;
}

/** Move o conteudo de um slot pra outro (o "arrastar pra reorganizar" da
 *  mochila). Slot destino vazio: so muda de lugar. Slot destino com o MESMO
 *  item: empilha os dois no destino (a origem esvazia). Slot destino com
 *  item DIFERENTE: troca os dois de lugar. Nao faz nada (devolve false) se a
 *  origem estiver vazia ou os indices forem iguais. */
export function moverItem(deIndice: number, paraIndice: number): boolean {
  if (deIndice === paraIndice) return false;
  const origem = atual.mochila[deIndice];
  if (!origem) return false;
  const destino = atual.mochila[paraIndice];
  if (destino && destino.item === origem.item) {
    destino.quantidade += origem.quantidade;
    atual.mochila[deIndice] = null;
  } else {
    atual.mochila[paraIndice] = origem;
    atual.mochila[deIndice] = destino;
  }
  salvar();
  return true;
}

/** Quantos slots a mochila equipada agora tem. */
export const capacidadeDaMochila = (): number => acharMochila(atual.mochilaAtual).slots;

/** Troca pra uma mochila maior (nunca menor — comprar so faz sentido pra
 *  cima). Preserva o conteudo dos slots que ja existiam, so acrescenta slot
 *  vazio no fim. Devolve false sem gastar nada se a mochila pedida nao for
 *  maior que a atual, ou faltar moeda.
 *
 *  Sem cena de loja pra chamar isto ainda — ver docs/plano-de-itens-e-
 *  equipamento.md, secao 7. Pronta pra quando existir. */
export function comprarMochila(id: string): boolean {
  const nova = acharMochila(id);
  if (nova.slots <= capacidadeDaMochila()) return false;
  if (atual.moedas < nova.preco) return false;
  atual.moedas -= nova.preco;
  while (atual.mochila.length < nova.slots) atual.mochila.push(null);
  atual.mochilaAtual = id;
  salvar();
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

/** Perder uma luta: zera o dinheiro e sorteia parte da mochila pra levar
 *  junto (Fase 13, `docs/plano-de-implementacao.md`). Chave de missao (id
 *  comecando com "chave-") nunca e sorteada - perder uma travaria o jogo sem
 *  volta, a mesma razao que faz o dado nunca dar "nada aconteceu". No maximo
 *  metade da mochila elegivel, arredondado pra cima, nunca mais que 3: perder
 *  uma luta nao pode zerar a mochila inteira de uma vez.
 *
 *  `sorteio` entra de fora, igual `rolar()` em turnos.ts, pra dar pra testar
 *  sem depender de Math.random. */
export function aplicarDerrota(
  sorteio: () => number = Math.random
): { moedasPerdidas: number; itensPerdidos: string[] } {
  const moedasPerdidas = atual.moedas;
  atual.moedas = 0;

  // a mochila e slot por posicao (SlotDaMochila[]) - achata pra uma unidade
  // por posicao, igual a lista antiga fazia sozinha, senao "sortear ate 3"
  // perderia sempre o mesmo item empilhado inteiro de uma vez.
  const elegiveis: string[] = [];
  atual.mochila.forEach((slot) => {
    if (!slot || slot.item.startsWith("chave-")) return;
    for (let i = 0; i < slot.quantidade; i++) elegiveis.push(slot.item);
  });
  const quantidadeAPerder = Math.min(3, Math.ceil(elegiveis.length / 2));
  const itensPerdidos: string[] = [];
  for (let i = 0; i < quantidadeAPerder; i++) {
    const indice = Math.floor(sorteio() * elegiveis.length);
    itensPerdidos.push(...elegiveis.splice(indice, 1));
  }
  itensPerdidos.forEach((id) => retirarDaMochila(id, 1));

  salvar();
  return { moedasPerdidas, itensPerdidos };
}

/** Um Selo de Heroi. Devolve true quando este e o TERCEIRO da leva — e a
 *  hora de abrir a tela de escolha (ver sistemas/poderes.ts,
 *  `selosParaProximaEscolha`, e `src/cenas/EscolhaDeSelo.ts`). */
export function ganharSelo(): boolean {
  atual.selos += 1;
  salvar();
  return atual.selos % 3 === 0;
}

/** Uma das tres escolhas do Selo de Heroi: +1 coracao permanente, ja
 *  curado — o premio e sentir o alivio na hora, nao so no proximo descanso. */
export function ganharCoracaoExtra() {
  atual.coracoesMax += 1;
  atual.coracoes = atual.coracoesMax;
  salvar();
}

/** A segunda escolha: +1 permanente num poder, alem do da criacao. */
export function ganharBonusDeAtributo(atributo: Atributo) {
  atual.heroi.bonusDeSelo[atributo] = (atual.heroi.bonusDeSelo[atributo] ?? 0) + 1;
  salvar();
}

/** A terceira escolha: aprende uma magia nova, pro resto do jogo — nao so
 *  desta aventura. Nao faz nada se ja souber (nunca deveria acontecer, quem
 *  oferece a escolha ja filtra as conhecidas). */
export function aprenderMagia(magiaId: string) {
  if (!atual.heroi.magias.includes(magiaId)) atual.heroi.magias.push(magiaId);
  salvar();
}
