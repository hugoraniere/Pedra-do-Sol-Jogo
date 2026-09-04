/** A cena que existe so para carregar som.
 *
 * PARECE EXAGERO E NAO E. O navegador nao deixa decodificar audio antes do
 * primeiro toque do jogador. Pedir os sons dentro do preload do Boot, junto com
 * a arte, trava a barra de carregamento pela metade: os arquivos de audio ficam
 * presos esperando a liberacao, ocupam as vagas de download, e os PNG que vem
 * depois nunca chegam a ser pedidos. O jogo nao abre, e nao aparece erro nenhum,
 * porque tecnicamente nada falhou.
 *
 * No iPad isso e pior: a liberacao so vem no primeiro toque, e nao existe toque
 * numa tela de carregamento. O Lele ficaria olhando uma barra parada.
 *
 * Entao a arte carrega no Boot, sozinha, e o som carrega aqui: uma cena que
 * comeca junto com o jogo, nunca para, e so puxa os arquivos depois que o audio
 * foi liberado. Enquanto eles nao chegam, tocar() e silencio, que e o
 * comportamento certo: som e enfeite, e enfeite nunca segura o jogo.
 *
 * Ela nao desenha nada. Nao tem create de tela, nao tem update.
 */
import Phaser from "phaser";
import { carregarSons, iniciarSom } from "../sistemas/som";

export class Som extends Phaser.Scene {
  constructor() {
    // active: comeca junto com o jogo e fica de pe o tempo todo. Um loader vive
    // dentro de uma cena, e este precisa sobreviver as trocas de tela.
    super({ key: "Som", active: true });
  }

  create() {
    iniciarSom(this);
    if (!this.sound.locked) return this.puxar();
    this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.puxar());
  }

  private puxar() {
    carregarSons(this);
    this.load.start();
  }
}
