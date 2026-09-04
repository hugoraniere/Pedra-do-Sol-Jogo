/** Os tres poderes do heroi: FORCA, ESPERTEZA, CORACAO.
 *
 * A regra e a do manual impresso, pagina 2: todo poder comeca em zero, a raca da
 * +1, a classe da +1, e o jogador coloca mais +1 onde quiser.
 *
 * O +1 do jogador ainda nao existe no jogo, porque a criacao de personagem nao
 * pergunta. Quando perguntar, ele vira um campo no estado e entra na soma aqui,
 * e nenhuma tela precisa mudar por causa disso.
 */
import { Atributo, acharClasse, acharRaca } from "../dados/conteudo";
import type { Heroi } from "./estado";

export type Poderes = Record<Atributo, number>;

export function poderesDoHeroi(heroi: Heroi): Poderes {
  const poderes: Poderes = { forca: 0, esperteza: 0, coracao: 0 };
  poderes[acharRaca(heroi.raca).bonus] += 1;
  poderes[acharClasse(heroi.classe).bonus] += 1;
  return poderes;
}

/** Quantos selos faltam para a proxima escolha.
 *
 *  No papel: a cada 3 selos pintados o jogador escolhe mais 1 coracao, mais 1
 *  num poder, ou uma habilidade nova. E o sistema de progressao do RPG dele, e
 *  por isso o jogo nao precisa inventar experiencia nenhuma. */
export const selosParaProximaEscolha = (selos: number) => 3 - (selos % 3);
