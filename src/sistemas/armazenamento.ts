/** Onde o jogo guarda os saves.
 *
 * Tem dois backends com a mesma interface:
 *   navegador  -> localStorage, uma chave por espaco de save
 *   aplicativo -> arquivo no disco, via a ponte que o Electron expoe em window.aurora
 *
 * O resto do jogo nunca sabe qual dos dois esta em uso. Se um dia trocar Electron
 * por Tauri, so este arquivo muda.
 */
import type { Estado } from "./estado";

export const MAX_ESPACOS = 3;

export type Ficha = {
  espaco: number;
  nome: string;
  raca: string;
  classe: string;
  lugar: string;
  selos: number;
  moedas: number;
  minutos: number;
  atualizadoEm: number;
};

type PonteApp = {
  lerSaves(): Promise<Record<string, string>>;
  gravarSave(chave: string, conteudo: string): Promise<void>;
  apagarSave(chave: string): Promise<void>;
  sair(): void;
  versao: string;
};

declare global {
  interface Window {
    aurora?: PonteApp;
  }
}

/** true quando o jogo esta rodando dentro do aplicativo, nao no navegador. */
export function noAplicativo(): boolean {
  return typeof window !== "undefined" && !!window.aurora;
}

const CHAVE = (espaco: number) => `aurora-save-${espaco}`;
const CHAVE_ULTIMO = "aurora-ultimo-espaco";

/** cache dos saves lidos do disco, preenchido uma vez no boot do aplicativo */
let cacheApp: Record<string, string> = {};

/** As escritas/remocoes pendentes no aplicativo desktop. `gravar()` e
 *  `remover()` disparam `window.aurora.*` sem esperar (fire-and-forget) -
 *  bom pro jogo nunca travar num frame por causa de I/O, ruim se o processo
 *  fechar antes da escrita terminar. `gravarEspaco()`, por exemplo, chama
 *  `gravar()` duas vezes seguidas (o save e o "ultimo espaco"), entao
 *  guardar so a ULTIMA promise nao bastaria se as duas nao resolverem na
 *  ordem que foram pedidas. `sairDoJogo()` espera este conjunto inteiro
 *  esvaziar antes de mandar `app:sair`, pra nao perder a ultima acao. */
const operacoesPendentes = new Set<Promise<void>>();

function registrarOperacao(p: Promise<void>) {
  const rastreada = p.catch(() => {}).finally(() => operacoesPendentes.delete(rastreada));
  operacoesPendentes.add(rastreada);
}

export async function prepararArmazenamento() {
  if (window.aurora) {
    try {
      cacheApp = await window.aurora.lerSaves();
    } catch {
      cacheApp = {};
    }
  }
}

export function ler(chave: string): string | null {
  if (window.aurora) return cacheApp[chave] ?? null;
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

export function gravar(chave: string, valor: string) {
  if (window.aurora) {
    cacheApp[chave] = valor;
    registrarOperacao(window.aurora.gravarSave(chave, valor));
    return;
  }
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* navegador sem storage: o jogo continua, so nao lembra */
  }
}

export function remover(chave: string) {
  if (window.aurora) {
    delete cacheApp[chave];
    registrarOperacao(window.aurora.apagarSave(chave));
    return;
  }
  try {
    localStorage.removeItem(chave);
  } catch {
    /* ignora */
  }
}

export function lerEspaco(espaco: number): Estado | null {
  const cru = ler(CHAVE(espaco));
  if (!cru) return null;
  try {
    const lido = JSON.parse(cru) as Estado;
    return lido?.heroi?.nome ? lido : null;
  } catch {
    return null;
  }
}

export function gravarEspaco(espaco: number, estado: Estado) {
  gravar(CHAVE(espaco), JSON.stringify(estado));
  gravar(CHAVE_ULTIMO, String(espaco));
}

export function apagarEspaco(espaco: number) {
  remover(CHAVE(espaco));
  if (ultimoEspaco() === espaco) remover(CHAVE_ULTIMO);
}

export function ultimoEspaco(): number | null {
  const v = ler(CHAVE_ULTIMO);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) && lerEspaco(n) ? n : null;
}

/** Primeiro espaco livre, ou null se os tres estiverem ocupados. */
export function espacoLivre(): number | null {
  for (let i = 0; i < MAX_ESPACOS; i++) if (!lerEspaco(i)) return i;
  return null;
}

export function fichas(): (Ficha | null)[] {
  const lista: (Ficha | null)[] = [];
  for (let i = 0; i < MAX_ESPACOS; i++) {
    const e = lerEspaco(i);
    lista.push(
      e
        ? {
            espaco: i,
            nome: e.heroi.nome,
            raca: e.heroi.raca,
            classe: e.heroi.classe,
            lugar: e.lugar ?? "Vila Semente",
            selos: e.selos,
            moedas: e.moedas,
            minutos: e.minutos ?? 0,
            atualizadoEm: e.atualizadoEm ?? 0,
          }
        : null
    );
  }
  return lista;
}

export async function sairDoJogo() {
  // espera toda gravacao pendente terminar antes de mandar o processo
  // fechar - senao "salvar() + sairDoJogo() em seguida" (Pausa.ts) podia
  // fechar o app antes do fs.writeFile terminar, perdendo a ultima acao.
  if (window.aurora) await Promise.all(operacoesPendentes);
  window.aurora?.sair();
}
