/** Se uma acao PRECISA acertar um bicho pra contar como sucesso, ou se basta
 *  o dado (autocura, escudo, esconderijo, um salto pra casa vazia).
 *
 * Antes disto, toda acao "aoRedor" de alcance 0 (Escudo de Bolha, Aderencia,
 * Veu de Sombra) nunca acertava nada de verdade: o jogo nunca deixa um bicho
 * ficar na MESMA casa do heroi, entao `pegos()` sempre vinha vazio e a acao
 * caia direto no galho de "errou" em `Combate.ts`, mesmo quando o dado tinha
 * sido um sucesso. Revisao de 2026-09-04, junto da mecanica propria das 5
 * magias utilitarias (docs/11-combate-e-magias.md secao 9).
 *
 * "livre": o efeito acontece no proprio heroi ou numa casa vazia (autocura,
 *   protecao, esconderijo, aderencia, salto) - sucesso no dado basta, nao
 *   precisa pegar ninguem.
 * "inimigo" (padrao, quando o campo nem aparece): so conta como sucesso se a
 *   acao de fato pegar alguem - todo golpe e toda magia de dano ou debuff.
 */
export type AlvoDeAcao = "inimigo" | "livre";
