/** Preferencias do jogador: zoom da camera, som, e o que mais vier.
 *  Ficam separadas do save do jogo de proposito: valem para todos os espacos,
 *  e uma preferencia nao deve viajar junto com o progresso. */

export type NivelZoom = "perto" | "normal" | "longe";

export type Preferencias = {
  zoom: NivelZoom;
  som: boolean;
};

export const ZOOM: Record<NivelZoom, { valor: number; nome: string }> = {
  perto: { valor: 1.5, nome: "PERTO" },
  normal: { valor: 1, nome: "NORMAL" },
  longe: { valor: 0.75, nome: "LONGE" },
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

export function valorDoZoom(): number {
  return ZOOM[atuais.zoom].valor;
}
