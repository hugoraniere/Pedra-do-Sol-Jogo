import "@fontsource/silkscreen";
import Phaser from "phaser";
import { COR, definirTamanhoLogico } from "./dados/config";
import { visaoEscolhida } from "./sistemas/preferencias";
import { Boot } from "./cenas/Boot";
import { Titulo } from "./cenas/Titulo";
import { Carregar } from "./cenas/Carregar";
import { Criacao } from "./cenas/Criacao";
import { Mundo } from "./cenas/Mundo";
import { Interface } from "./cenas/Interface";
import { Pausa } from "./cenas/Pausa";
import { instalarAuditor } from "./sistemas/auditoria";
import { vigiarJanela } from "./sistemas/visao";
import { instalarBancada } from "./sistemas/bancada";

function comecar() {
  // a visao escolhida define a resolucao logica antes de qualquer cena montar
  const visao = visaoEscolhida();
  definirTamanhoLogico(visao.largura, visao.altura);

  const jogo = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "jogo",
  width: visao.largura,
  height: visao.altura,
  backgroundColor: COR.tinta,
  pixelArt: true,
  roundPixels: true,
  scale: {
    // NONE mais zoom inteiro calculado a mao. FIT sozinho estica em numero
    // quebrado (3,2x) e a arte de pixel sai com pixels de tamanhos diferentes.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scene: [Boot, Titulo, Carregar, Criacao, Mundo, Interface, Pausa],
  });
  // gancho de depuracao: no console do navegador da para fazer
  //   jogo.scene.getScene("Interface").events.emit("falar", {...})
  (window as unknown as { jogo: Phaser.Game }).jogo = jogo;
  instalarBancada(jogo);
  vigiarJanela(jogo);
  instalarAuditor(jogo);
}

// espera a fonte de pixel carregar, senao a primeira tela sai com a fonte do sistema
if (document.fonts?.ready) {
  document.fonts.ready.then(comecar);
} else {
  comecar();
}
