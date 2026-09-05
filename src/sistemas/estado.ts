/** Estado do jogo. Uma unica fonte da verdade sobre o progresso.
 *  Quem grava e le no disco e sistemas/armazenamento.ts. */
import { gravarEspaco, lerEspaco } from "./armazenamento";

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
  mochila: string[];
  visitados: string[];
  /** chave estavel de cada criatura ja vencida (`${cena}:${indice}` no mapa),
   *  para ela nao voltar a existir quando o jogador reentra no lugar */
  derrotados: string[];
  cena: string;
  lugar: string;
  minutos: number;
  /** minuto do dia simulado, 0 a 1439 — ver sistemas/tempo.ts */
  relogio: number;
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
    poderEscolhido: "",
  },
  coracoes: 3,
  coracoesMax: 3,
  moedas: 5,
  selos: 0,
  mochila: [],
  visitados: [],
  derrotados: [],
  cena: "vila",
  lugar: "Vila Semente",
  minutos: 0,
  // 480 = 8h, o heroi chega de manha
  relogio: 480,
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

export function guardar(item: string) {
  if (!atual.mochila.includes(item)) atual.mochila.push(item);
  salvar();
}

export function marcarVisitado(chave: string): boolean {
  if (atual.visitados.includes(chave)) return false;
  atual.visitados.push(chave);
  salvar();
  return true;
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
