/** Indices da folha public/assets/ui.png, na mesma ordem de ICONES em arte/ui.py.
 *
 *  Mora aqui, e nao dentro de uma cena, porque o topo, a ficha e a mochila
 *  precisam dos mesmos numeros. Se a ordem mudar em arte/ui.py, muda aqui, e a
 *  lista inteira anda junto em vez de uma tela ficar com o icone errado. */
export const ICONE = {
  coracaoCheio: 0,
  coracaoVazio: 1,
  moeda: 2,
  selo: 3,
  setaCima: 4,
  setaBaixo: 5,
  setaEsq: 6,
  setaDir: 7,
  botaoA: 8,
  mochila: 9,
  livro: 10,
  lupa: 11,
  dado: 12,
} as const;

/** Lado de um icone da folha, em pixels do jogo. Igual a U em arte/ui.py. */
export const LADO_ICONE = 16;
