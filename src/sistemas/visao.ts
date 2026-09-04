/** Aplica a preferencia de visao trocando a resolucao logica do jogo,
 *  e garante que o canvas so apareca na tela multiplicado por numero inteiro.
 *
 *  Ninguem mexe no zoom da camera. Zoom fracionario (1.5, 0.75) deixa a grade
 *  de pixels do jogo desalinhada da grade da tela, e como a camera segue o
 *  heroi com suavizacao, o desalinhamento muda a cada quadro: e isso que fazia
 *  o mapa inteiro piscar. Aqui a camera fica em 1, quem muda e o canvas, e a
 *  escala do canvas e sempre 1x, 2x, 3x... Se fosse 3,2x, um pixel do jogo
 *  viraria as vezes 3 e as vezes 4 pixels da tela, e a arte sairia irregular. */
import Phaser from "phaser";
import { definirTamanhoLogico } from "../dados/config";
import { visaoEscolhida } from "./preferencias";

/** Maior multiplicacao inteira que ainda cabe na janela. Em tela pequena
 *  demais (celular em pe) cai para a escala exata, porque cortar e pior. */
function escalaInteira(largura: number, altura: number) {
  const cabe = Math.min(window.innerWidth / largura, window.innerHeight / altura);
  const inteira = Math.floor(cabe);
  return inteira >= 1 ? inteira : cabe;
}

export function ajustarEscala(jogo: Phaser.Game) {
  const escala = escalaInteira(jogo.scale.width, jogo.scale.height);
  if (jogo.scale.zoom !== escala) jogo.scale.setZoom(escala);
}

export function aplicarVisao(jogo: Phaser.Game) {
  const v = visaoEscolhida();
  if (jogo.scale.width !== v.largura || jogo.scale.height !== v.altura) {
    definirTamanhoLogico(v.largura, v.altura);
    jogo.scale.resize(v.largura, v.altura);
    // as cenas ativas recebem o evento resize do Phaser e se redesenham sozinhas
  }
  ajustarEscala(jogo);
}

/** Liga o jogo na janela: qualquer mudanca de tamanho recalcula a escala. */
export function vigiarJanela(jogo: Phaser.Game) {
  ajustarEscala(jogo);
  window.addEventListener("resize", () => ajustarEscala(jogo));
  window.addEventListener("orientationchange", () => ajustarEscala(jogo));
}

/** Cada cena de interface chama isto uma vez no create e volta a se montar
 *  quando a resolucao muda. Sem isto, a tela ficaria com o desenho antigo. */
export function refazerAoRedimensionar(cena: Phaser.Scene, refazer: () => void) {
  const aoMudar = () => {
    if (!cena.scene.isActive() && !cena.scene.isPaused()) return;
    // espera o quadro virar: no meio do resize o Phaser ainda esta ajustando cameras
    cena.time.delayedCall(0, refazer);
  };
  cena.scale.on(Phaser.Scale.Events.RESIZE, aoMudar);
  const soltar = () => cena.scale.off(Phaser.Scale.Events.RESIZE, aoMudar);
  cena.events.once(Phaser.Scenes.Events.SHUTDOWN, soltar);
  cena.events.once(Phaser.Scenes.Events.DESTROY, soltar);
}
