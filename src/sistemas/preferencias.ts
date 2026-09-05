/** Preferencias do jogador: visao da camera, som, e o que mais vier.
 *  Ficam separadas do save do jogo de proposito: valem para todos os espacos,
 *  e uma preferencia nao deve viajar junto com o progresso. */

export type NivelZoom = "perto" | "normal" | "longe";

export type Preferencias = {
  zoom: NivelZoom;
  som: boolean;
};

/** Cada nivel e um DEGRAU na escala inteira, nao uma resolucao propria.
 *
 *  A camera fica sempre em zoom 1. Quem muda e o tamanho do pixel na tela: o
 *  canvas enche a janela inteira sempre, e a escala escolhida decide quantos
 *  pixels de jogo cabem la dentro. Escala maior = pixel maior = menos mapa na
 *  tela. Ver sistemas/visao.ts, que faz a conta.
 *
 *  ANTES CADA NIVEL ERA UMA RESOLUCAO FIXA (256x160, 320x192, 400x240) e isso
 *  tinha um defeito que so aparecia em algumas janelas: como a escala tem que
 *  ser inteira, duas resolucoes vizinhas caiam na mesma escala e o botao nao
 *  mudava nada na tela. Degrau melhora muito isso, mas nao e magica: numa
 *  janela pequena a escala esbarra no piso ou no teto de visao.ts e dois
 *  niveis voltam a coincidir. Nas telas que importam — iPad deitado, notebook,
 *  monitor — os tres sao distintos.
 *
 *  O NORMAL e o afastado, e e o padrao. Foi pedido assim: o jogo comeca
 *  mostrando bastante mapa, PERTO aproxima um degrau e LONGE afasta um. */
export const ZOOM: Record<NivelZoom, { degrau: number; nome: string }> = {
  perto: { degrau: 1, nome: "PERTO" },
  normal: { degrau: 0, nome: "NORMAL" },
  longe: { degrau: -1, nome: "LONGE" },
};

export const ORDEM_ZOOM: NivelZoom[] = ["perto", "normal", "longe"];

const CHAVE = "aurora-preferencias";
const PADRAO: Preferencias = { zoom: "normal", som: true };

let atuais: Preferencias = { ...PADRAO };

try {
  const cru = localStorage.getItem(CHAVE);
  if (cru) atuais = { ...PADRAO, ...(JSON.parse(cru) as Preferencias) };
} catch {
  /* sem storage: fica no padrao */
}
if (!ZOOM[atuais.zoom]) atuais.zoom = PADRAO.zoom;

export function preferencias(): Preferencias {
  return atuais;
}

export function definirPreferencia<K extends keyof Preferencias>(chave: K, valor: Preferencias[K]) {
  atuais[chave] = valor;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(atuais));
  } catch {
    /* ignora */
  }
}

export function visaoEscolhida() {
  return ZOOM[atuais.zoom];
}
