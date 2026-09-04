/** Preferencias do jogador: visao da camera, som, e o que mais vier.
 *  Ficam separadas do save do jogo de proposito: valem para todos os espacos,
 *  e uma preferencia nao deve viajar junto com o progresso. */

export type NivelZoom = "perto" | "normal" | "longe";

export type Preferencias = {
  zoom: NivelZoom;
  som: boolean;
};

/** Cada nivel e uma resolucao logica, nao um zoom de camera.
 *
 *  A camera fica sempre em zoom 1. Quem muda e o tamanho do canvas: canvas
 *  menor cabe mais vezes na tela, entao o Phaser o multiplica por um numero
 *  maior e tudo aparece maior. Canvas maior mostra mais mapa.
 *
 *  As tres larguras sao multiplas de 16 (o tile) e guardam a mesma proporcao
 *  proporcao larga. Em tiles: 16x10, 20x12 e 25x15. */
export const ZOOM: Record<NivelZoom, { largura: number; altura: number; nome: string }> = {
  perto: { largura: 256, altura: 160, nome: "PERTO" },
  normal: { largura: 320, altura: 192, nome: "NORMAL" },
  longe: { largura: 400, altura: 240, nome: "LONGE" },
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
