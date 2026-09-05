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
};

/** Lado de um icone da folha, em pixels do jogo. Igual a U em arte/itens.py. */
export const LADO_ICONE_ITEM = 16;
