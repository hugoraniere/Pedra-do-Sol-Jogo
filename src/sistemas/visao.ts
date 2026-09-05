/** Quanto do mundo cabe na tela, e de que tamanho o pixel aparece.
 *
 * DUAS REGRAS MANDAM AQUI, e as duas sao inegociaveis.
 *
 *   1. O JOGO ENCHE O ESPACO DISPONIVEL. Sem tarja preta, sem o jogo mudando
 *      de tamanho conforme a janela. O canvas tem exatamente o tamanho da area
 *      util do navegador, sempre.
 *
 *   2. A ESCALA E SEMPRE UM NUMERO INTEIRO. 1x, 2x, 3x. Se fosse 3,2x, um pixel
 *      do jogo viraria as vezes 3 e as vezes 4 pixels da tela, e a arte de pixel
 *      sairia irregular. Pior: a camera segue o heroi com suavizacao, entao o
 *      desalinhamento mudaria a cada quadro e o mapa inteiro piscaria ao andar.
 *
 * As duas juntas so fecham de um jeito: quem se adapta e a RESOLUCAO LOGICA. A
 * escala e escolhida primeiro, inteira, e o tamanho do canvas em pixels de jogo
 * e o que sobra da divisao. Numa janela de 1440x900 na visao normal a escala da
 * 4 e o mundo fica 360x225; na mesma visao numa tela de 1920x1080 a escala da 5
 * e o mundo fica 384x216. Muda quanto de mapa aparece nas beiradas, nao o
 * tamanho do heroi.
 *
 * NINGUEM MEXE NO ZOOM DA CAMERA. A camera fica em 1 sempre. Quem muda e o
 * canvas.
 *
 * Por isso toda a interface e desenhada a partir de LARGURA e ALTURA, com
 * caixa() e pilha(), e nunca com numero fixo: a resolucao logica agora e um
 * valor qualquer, nao uma de tres opcoes. Ver docs/07-design-system.md.
 */
import Phaser from "phaser";
import { definirTamanhoLogico } from "../dados/config";
import { visaoEscolhida } from "./preferencias";

/** A area que a visao do meio, a NORMAL, tenta mostrar.
 *
 *  Nao e o tamanho do canvas: e o alvo que decide de quanto vai ser a
 *  multiplicacao inteira. 400x240 sao 25 por 15 tiles, e e o padrao porque o
 *  Hugo pediu que o jogo comece afastado. */
const ALVO = { largura: 400, altura: 240 };

/** Teto do mundo visivel. Sem ele, a visao LONGE numa tela grande escolheria
 *  escala 1 e o heroi viraria uma formiga de 16 pixels no meio de uma tela de
 *  1080. 800x480 sao 50 por 30 tiles. */
const TETO = { largura: 800, altura: 480 };

/** Piso do mundo visivel, e a rede de seguranca da interface.
 *
 *  256x160 e a menor resolucao que este projeto ja teve e ja auditou, entao
 *  nenhuma tela precisa saber caber em menos que isso. Se o piso e o teto
 *  brigarem — tela absurdamente larga e baixa —, QUEM GANHA E O PISO: fonte
 *  pequena demais e feio, botao fora da tela deixa o Lele preso. */
const PISO = { largura: 256, altura: 160 };

const ESCALA_MAXIMA = 12;

export type Medida = { escala: number; largura: number; altura: number };

/** Quanto mede a area util do navegador. Em tela cheia isto ja vem como a tela
 *  inteira, entao nao existe conta separada para tela cheia. */
function janela() {
  return {
    largura: Math.max(1, Math.floor(window.innerWidth)),
    altura: Math.max(1, Math.floor(window.innerHeight)),
  };
}

/**
 * A escala e o tamanho logico desta janela, para a visao escolhida.
 *
 * A escala base e a que faz o ALVO caber, ARREDONDADA e nao truncada. Truncar
 * desperdicava muito: num iPad de 1180 de largura, 1180/400 da 2,95, e truncar
 * levaria para escala 2, ou seja 590 pixels de mundo, mais que o mapa da vila
 * inteiro, com o heroi minusculo. Arredondar leva para 3, que e o que o olho
 * esperava.
 *
 * Cada nivel de visao e um DEGRAU nessa escala, nao uma resolucao propria:
 * PERTO e um degrau acima, LONGE e um degrau abaixo. Assim os tres niveis sao
 * sempre diferentes entre si, o que nao acontecia quando cada nivel era uma
 * resolucao fixa: em muitas janelas, dois niveis caiam na mesma escala inteira
 * e o botao nao fazia nada visivel.
 */
export function medidaDaJanela(): Medida {
  const { largura: w, altura: h } = janela();

  const base = Math.max(1, Math.round(Math.min(w / ALVO.largura, h / ALVO.altura)));

  // a faixa de escalas que respeita o teto e o piso ao mesmo tempo
  const minimaPeloTeto = Math.max(1, Math.ceil(Math.max(w / TETO.largura, h / TETO.altura)));
  const maximaPeloPiso = Math.max(1, Math.floor(Math.min(w / PISO.largura, h / PISO.altura)));
  const teto = Math.min(ESCALA_MAXIMA, maximaPeloPiso);
  const piso = Math.min(minimaPeloTeto, teto); // o piso da UI ganha da estetica

  const escala = Math.min(teto, Math.max(piso, base + visaoEscolhida().degrau));

  // ceil, e nao floor: o canvas tem que COBRIR a janela. Sobra menos de um
  // pixel de jogo para fora, que o overflow:hidden do index.html esconde. Com
  // floor sobraria uma tira preta na direita e embaixo.
  return { escala, largura: Math.ceil(w / escala), altura: Math.ceil(h / escala) };
}

/** Aplica a medida atual no jogo. Serve para os tres casos: a janela mudou de
 *  tamanho, o jogador trocou a visao, ou entrou e saiu da tela cheia. */
export function aplicarVisao(jogo: Phaser.Game) {
  const m = medidaDaJanela();
  if (jogo.scale.width !== m.largura || jogo.scale.height !== m.altura) {
    // primeiro o config, depois o Phaser: as cenas que reagem ao resize leem
    // LARGURA e ALTURA, e precisam ler o valor novo
    definirTamanhoLogico(m.largura, m.altura);
    jogo.scale.resize(m.largura, m.altura);
  }
  if (jogo.scale.zoom !== m.escala) jogo.scale.setZoom(m.escala);
}

/** Liga o jogo na janela. Qualquer coisa que mude a area util recalcula tudo. */
export function vigiarJanela(jogo: Phaser.Game) {
  aplicarVisao(jogo);
  const refazer = () => aplicarVisao(jogo);
  window.addEventListener("resize", refazer);
  window.addEventListener("orientationchange", refazer);
  // o navegador nem sempre manda "resize" ao entrar e sair da tela cheia,
  // e o Phaser tem evento proprio para isso
  jogo.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, refazer);
  jogo.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, refazer);
  // no iPad, o teclado virtual e a barra do Safari mudam a altura util sem
  // disparar resize da janela
  window.visualViewport?.addEventListener("resize", refazer);
}

/** Entra ou sai da tela cheia. Devolve false quando o navegador nao deixa, que
 *  e o caso do Safari do iPad: la a Fullscreen API so vale para video.
 *
 *  Tem que ser chamada de dentro de um toque do jogador, senao o navegador
 *  recusa. */
export function alternarTelaCheia(jogo: Phaser.Game): boolean {
  if (!jogo.scale.fullscreen.available) return false;
  jogo.scale.toggleFullscreen();
  return true;
}

export function emTelaCheia(jogo: Phaser.Game): boolean {
  return jogo.scale.isFullscreen;
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
