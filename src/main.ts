import "@fontsource/silkscreen";
import Phaser from "phaser";
import { LARGURA, ALTURA, COR } from "./dados/config";
import { Boot } from "./cenas/Boot";
import { Titulo } from "./cenas/Titulo";
import { Carregar } from "./cenas/Carregar";
import { Criacao } from "./cenas/Criacao";
import { Mundo } from "./cenas/Mundo";
import { Interface } from "./cenas/Interface";
import { Pausa } from "./cenas/Pausa";

function comecar() {
  const jogo = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "jogo",
  width: LARGURA,
  height: ALTURA,
  backgroundColor: COR.tinta,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: Phaser.Scale.MAX_ZOOM,
  },
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scene: [Boot, Titulo, Carregar, Criacao, Mundo, Interface, Pausa],
  });
  // gancho de depuracao: no console do navegador da para fazer
  //   jogo.scene.getScene("Interface").events.emit("falar", {...})
  (window as unknown as { jogo: Phaser.Game }).jogo = jogo;
}

// espera a fonte de pixel carregar, senao a primeira tela sai com a fonte do sistema
if (document.fonts?.ready) {
  document.fonts.ready.then(comecar);
} else {
  comecar();
}
