/** Efeito de usar um item da LOJA fora de combate.
 *
 *  Poucos itens tem efeito ligado ainda: Pocao de Morango/Grandona (encher
 *  coracao) e Pao da Padeira (matar a fome, ver sistemas/moodles.ts). Os
 *  outros nove (Biscoito Magico, Bota do Vento, Pena da Fenix...) sao
 *  condicao de COMBATE (ABENCOADO, RAPIDO, revive de TONTO — ver
 *  sistemas/condicoes.ts e docs/mundo-que-reage.md, secao 3), e combate nao
 *  tem "proximo dado" nem "turno" fora da propria luta. Usa-los ali e Fase 6
 *  do plano de itens, nao aqui.
 *
 *  Sistema puro: nao decide UI, so aplica o efeito e devolve se aplicou. */
import { estado, usar, salvar } from "./estado";

const EFEITO: Partial<Record<string, () => void>> = {
  "pocao-morango": () => {
    const st = estado();
    st.coracoes = Math.min(st.coracoesMax, st.coracoes + 1);
  },
  "pocao-grandona": () => {
    const st = estado();
    st.coracoes = st.coracoesMax;
  },
  "pao": () => {
    estado().fome = 0;
  },
};

/** Cada efeito decide sozinho se "ja esta cheio" agora — coracao pergunta
 *  se falta coracao, pao pergunta se ha fome. Sem isto, um item novo (como
 *  o pao) nunca satisfaria uma checagem hard-coded de coracao e o botao
 *  USAR nunca apareceria pra ele. */
const PRECISA_AGORA: Partial<Record<string, () => boolean>> = {
  "pocao-morango": () => estado().coracoes < estado().coracoesMax,
  "pocao-grandona": () => estado().coracoes < estado().coracoesMax,
  "pao": () => estado().fome > 0,
};

/** Este item tem efeito de verdade fora de combate? Usado pra decidir se a
 *  mochila mostra um botao de USAR ou so a descricao. */
export const temEfeitoForaDeCombate = (id: string): boolean => id in EFEITO;

/** So mostra USAR se fizer diferenca agora (nao adianta comer sem fome, ou
 *  beber pocao com coracao cheio). Item sem entrada aqui mas com efeito
 *  ligado (nao deveria acontecer, mas por seguranca) conta como "precisa". */
export const precisaAgora = (id: string): boolean => PRECISA_AGORA[id]?.() ?? true;

/** Usa um consumivel fora de combate. Devolve false sem gastar nada se o
 *  item nao tiver efeito ligado ainda, ou se faltar quantidade na mochila. */
export function usarConsumivel(id: string): boolean {
  const efeito = EFEITO[id];
  if (!efeito) return false;
  if (!usar(id, 1)) return false;
  // usar() ja salvou a posse; o efeito mexe em outro campo (coracoes) DEPOIS
  // disso, entao precisa do proprio salvar() pra nao ficar so na memoria.
  efeito();
  salvar();
  return true;
}
