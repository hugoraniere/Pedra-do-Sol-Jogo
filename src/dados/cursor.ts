/** Os estados do cursor. Conteudo, nao codigo.
 *
 *  Esta lista e a mesma de QUADROS em arte/cursor.py, e as duas tem que bater:
 *  o nome daqui e a chave que o jogo procura em public/assets/cursor.json. Um
 *  nome escrito diferente nao da erro de compilacao, da um cursor que nunca
 *  aparece. O passo 9 do plano poe isso no verificar.mjs; ate la, a `ficha()`
 *  avisa no console quando o nome pedido nao existe na folha.
 */
export const ESTADOS = [
  "normal",
  "sobre",
  "clique",
  "andar",
  "bloqueado",
  "falar",
  "olhar",
  "pegar",
  "pegando",
  "atacar",
] as const;

export type EstadoDoCursor = (typeof ESTADOS)[number];

/** Quanto o cursor sobe quando esta sobre algo clicavel.
 *
 *  Mora aqui e nao no desenho de proposito: se a seta subisse dentro do PNG, o
 *  ponto da ponta em cursor.json mentiria sobre onde o clique cai. O desenho fica
 *  parado, quem levanta e a cena. */
export const SUBIDA_SOBRE = 1;
