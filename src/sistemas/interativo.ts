/** Um unico estado de hover, para todo widget da interface.
 *
 *  Hoje cada widget reage do seu jeito, e metade nao reage nada:
 *
 *    botao.ts               toca "menu-foco" e nao muda nada visualmente
 *    a engrenagem de pausa   nada. Nem som, nem visual
 *    "toque para sortear"    setInteractive() puro: nem mao, nem hover
 *
 *  Depois disto, sobre e apertado tem a MESMA subida, o MESMO som e o MESMO
 *  tempo em qualquer widget do jogo. Quem chama isto uma vez nao precisa
 *  reinventar pointerover/pointerout toda vez que um botao novo nasce.
 *
 *  O que NAO mora aqui: a cor de "isto esta selecionado" (a `marcar()` de
 *  botao.ts, que Pausa e Ficha usam para dizer qual visao ou qual opcao de som
 *  esta ligada). Selecao e hover sao coisas diferentes — passar o mouse sobre
 *  a opcao de som DESLIGADO nao pode fazer ela parecer escolhida. Por isso este
 *  sistema so mexe em POSICAO (sobe/afunda), nunca em textura.
 */
import Phaser from "phaser";
import { tocar, type ChaveEfeito } from "./som";
import { SUBIDA_SOBRE } from "../dados/cursor";

/** menos que isto entre dois toques de "menu-foco" e o mesmo som de novo, nao
 *  um som novo. Sem isto, passar o mouse rapido por cinco botoes vira
 *  metralhadora: mesmo evento, tocado cinco vezes em 100 ms. */
const DEBOUNCE_SOM_MS = 60;

const DISTANCIA_AFUNDO = 2;

export type OpcoesInterativo = {
  /** o que sobe e desce. Por padrao, o proprio alvo. Um botao passa
   *  [fundo, rotulo]: so eles tem textura e texto, a sombra fica parada, e e
   *  a sombra parada que da a ilusao de afundar. */
  pecas?: { y: number }[];
  /** false desliga o som daquele estado. Existe porque a engrenagem de pausa
   *  ja tem "pausa-abre" tocando um passo depois: com o som padrao aqui, o
   *  clique soaria duas vezes. */
  somSobre?: ChaveEfeito | false;
  somClique?: ChaveEfeito | false;
};

/** Liga sobre/apertado num objeto que ja chamou setInteractive().
 *
 *  Guarda a posicao ORIGINAL de cada peca e sempre desenha a partir dela, em
 *  vez de somar/subtrair a cada evento: um pointerover que dispara duas vezes
 *  sem o pointerout entre eles (a cena troca, o Phaser reordena a fila) nao
 *  acumula deslocamento. */
export function interativo(
  alvo: Phaser.GameObjects.GameObject,
  opcoes: OpcoesInterativo = {}
) {
  const pecas = (opcoes.pecas ?? [alvo]) as unknown as { y: number }[];
  const base = pecas.map((p) => p.y);
  const somSobre = opcoes.somSobre ?? "menu-foco";
  const somClique = opcoes.somClique ?? "menu-confirma";

  let sobre = false;
  let apertado = false;
  let ultimoSom = 0;

  const redesenhar = () => {
    const dy = apertado ? DISTANCIA_AFUNDO : sobre ? -SUBIDA_SOBRE : 0;
    pecas.forEach((p, i) => {
      p.y = base[i] + dy;
    });
  };

  const emissor = alvo as unknown as Phaser.Events.EventEmitter;

  emissor.on("pointerover", () => {
    sobre = true;
    redesenhar();
    if (!somSobre) return;
    const agora = performance.now();
    if (agora - ultimoSom < DEBOUNCE_SOM_MS) return;
    ultimoSom = agora;
    tocar(somSobre);
  });
  emissor.on("pointerout", () => {
    // sair da tela com o botao apertado nao pode deixa-lo afundado para
    // sempre: o dedo que solta fora do alvo ainda solta.
    sobre = false;
    apertado = false;
    redesenhar();
  });
  emissor.on("pointerdown", () => {
    apertado = true;
    redesenhar();
    if (somClique) tocar(somClique);
  });
  emissor.on("pointerup", () => {
    apertado = false;
    redesenhar();
  });
}
