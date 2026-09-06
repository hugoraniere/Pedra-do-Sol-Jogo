/** Indices da folha public/assets/itens.png, na mesma ordem de ITENS em
 *  arte/itens.py. Folha propria de item de mochila (consumivel, material,
 *  armadura, acessorio) — nao mistura com `icones.ts` (interface generica)
 *  nem com o combate. Se a ordem mudar em arte/itens.py, muda aqui junto. */
export const ICONE_ITEM: Record<string, number> = {
  "pocao-morango": 0,
  "pocao-grandona": 1,
  corda: 2,
  lanterna: 3,
  biscoito: 4,
  "bota-vento": 5,
  "capa-camaleao": 6,
  "pena-fenix": 7,
  "sino-espanta": 8,
  "mapa-que-fala": 9,
  "saco-sem-fundo": 10,
  "chave-mestra": 11,
  "teia-doce": 12,
  palha: 13,
  "presa-de-nevoa": 14,
  cinza: 15,
  "colete-vila": 16,
  "manto-teia": 17,
  "capuz-nevoa": 18,
  "couraca-cinza": 19,
  "manto-pantano": 20,
  "bracelete-palha": 21,
  "anel-teia": 22,
  "presa-lapidada": 23,
  "pingente-sino": 24,
  "broche-troll": 25,
  // armas: geradas depois dos 26 itens acima, na ordem de ARMAS_ICONE
  // (arte/itens.py) — que bate 1:1 com o id de Arma em conteudo.ts.
  "espada-curta": 26,
  escudo: 27,
  arco: 28,
  cajado: 29,
  martelo: 30,
  machado: 31,
  adaga: 32,
  funda: 33,
  "lamina-aurora": 34,
  "escudo-espelho": 35,
  "arco-lua": 36,
  "lamina-guarda-vila": 37,
  "arco-trancado-teia": 38,
  "funda-de-presa": 39,
  "martelo-de-cinza": 40,
  "adaga-da-serpente": 41,
  "cajado-bruxa-espinho": 42,
};

/** Lado de um icone da folha, em pixels do jogo. Igual a U em arte/itens.py. */
export const LADO_ICONE_ITEM = 16;
