/** Estado do jogo, salvo no navegador. Uma unica fonte da verdade. */

export type Heroi = {
  nome: string;
  raca: string;
  classe: string;
  magias: string[];
  corCabelo: number;
  corRoupa: number;
};

export type Estado = {
  heroi: Heroi;
  coracoes: number;
  coracoesMax: number;
  moedas: number;
  selos: number;
  mochila: string[];
  visitados: string[];
  cena: string;
};

const CHAVE = "reino-de-aurora-v1";

export const VAZIO: Estado = {
  heroi: {
    nome: "",
    raca: "elfo",
    classe: "mago",
    magias: [],
    corCabelo: 0x3e9b62,
    corRoupa: 0x3e9b62,
  },
  coracoes: 3,
  coracoesMax: 3,
  moedas: 5,
  selos: 0,
  mochila: [],
  visitados: [],
  cena: "vila",
};

let atual: Estado = estruturado(VAZIO);

function estruturado<Tipo>(v: Tipo): Tipo {
  return JSON.parse(JSON.stringify(v));
}

export function estado(): Estado {
  return atual;
}

export function definir(novo: Estado) {
  atual = novo;
  salvar();
}

export function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(atual));
  } catch {
    /* navegador sem storage, o jogo continua so nao lembra */
  }
}

export function carregar(): boolean {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return false;
    const lido = JSON.parse(cru) as Estado;
    if (!lido?.heroi?.nome) return false;
    atual = { ...estruturado(VAZIO), ...lido };
    return true;
  } catch {
    return false;
  }
}

export function limpar() {
  atual = estruturado(VAZIO);
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* ignora */
  }
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
