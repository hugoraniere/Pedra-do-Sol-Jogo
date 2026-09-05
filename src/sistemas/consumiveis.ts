/** Efeito de usar um item da LOJA fora de combate.
 *
 *  So dois itens tem efeito ligado ainda: Pocao de Morango e Pocao Grandona,
 *  porque encher coracao e a unica coisa da LOJA que faz sentido fora de
 *  combate hoje. Os outros dez (Biscoito Magico, Bota do Vento, Pena da
 *  Fenix...) sao condicao de COMBATE (ABENCOADO, RAPIDO, revive de TONTO —
 *  ver sistemas/condicoes.ts e docs/mundo-que-reage.md, secao 3), e combate
 *  nao tem "proximo dado" nem "turno" fora da propria luta. Usa-los ali e
 *  Fase 6 do plano de itens, nao aqui.
 *
 *  Sistema puro: nao decide UI, so aplica o efeito e devolve se aplicou. */
import { estado, usar, salvar } from "./estado";
import { acharQualquerItem } from "../dados/conteudo";

const EFEITO: Partial<Record<string, () => void>> = {
  "pocao-morango": () => {
    const st = estado();
    st.coracoes = Math.min(st.coracoesMax, st.coracoes + 1);
  },
  "pocao-grandona": () => {
    const st = estado();
    st.coracoes = st.coracoesMax;
  },
};

/** Este item tem efeito de verdade fora de combate? Usado pra decidir se a
 *  mochila mostra um botao de USAR ou so a descricao. */
export const temEfeitoForaDeCombate = (id: string): boolean => id in EFEITO;

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

/** O item que o slot rapido do HUD mostra: o primeiro da mochila que seja
 *  consumivel E tenha efeito de verdade fora de combate - mesmo predicado
 *  que `Ficha.ts` ja usa pra decidir se mostra o botao USAR, entao os dois
 *  nunca discordam sobre o que da pra usar agora. Sem UI de "escolher item"
 *  de proposito: um slot so, automatico (ver docs/07-design-system.md e o
 *  plano de HUD, revisao de 2026-09-05). */
export function itemRapidoAtual(): { item: string; quantidade: number } | null {
  const slot = estado().mochila.find(
    (s) => s && acharQualquerItem(s.item).categoria === "consumivel" && temEfeitoForaDeCombate(s.item)
  );
  return slot ? { item: slot.item, quantidade: slot.quantidade } : null;
}
