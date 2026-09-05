import "@fontsource/silkscreen";
import Phaser from "phaser";
import { COR, definirTamanhoLogico } from "./dados/config";
import { Boot } from "./cenas/Boot";
import { Titulo } from "./cenas/Titulo";
import { Carregar } from "./cenas/Carregar";
import { Criacao } from "./cenas/Criacao";
import { Mundo } from "./cenas/Mundo";
import { Interface } from "./cenas/Interface";
import { Pausa } from "./cenas/Pausa";
import { Ficha } from "./cenas/Ficha";
import { Som } from "./cenas/Som";
import { Provador } from "./cenas/Provador";
import { Combate } from "./cenas/Combate";
import { EscolhaDeSelo } from "./cenas/EscolhaDeSelo";
import { Ponteiro } from "./cenas/Ponteiro";
import { instalarAuditor } from "./sistemas/auditoria";
import { medidaDaJanela, vigiarJanela } from "./sistemas/visao";
import { instalarBancada } from "./sistemas/bancada";
import { ligarDoutor } from "./sistemas/doutor";
import { instalarPonteiro } from "./sistemas/cursor";
import { vigiarOrientacao } from "./sistemas/orientacao";

// escuta antes do Phaser subir, senao um erro na propria subida passa batido
ligarDoutor();
// nao depende do Phaser: se o celular ja esta de pe, o aviso aparece antes
// mesmo da fonte terminar de carregar, em vez de esperar o jogo montar
vigiarOrientacao();

function comecar() {
  // a resolucao logica sai da janela e da visao escolhida, e tem que estar
  // definida antes de qualquer cena montar. A mesma conta roda de novo a cada
  // resize, dentro de vigiarJanela.
  const medida = medidaDaJanela();
  definirTamanhoLogico(medida.largura, medida.altura);

  const jogo = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "jogo",
  width: medida.largura,
  height: medida.altura,
  backgroundColor: COR.tinta,
  pixelArt: true,
  roundPixels: true,
  scale: {
    // NONE mais zoom inteiro calculado a mao. FIT sozinho estica em numero
    // quebrado (3,2x) e a arte de pixel sai com pixels de tamanhos diferentes.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // a tela cheia leva o proprio #jogo, e nao um div que o Phaser inventa:
    // assim o fundo e a centralizacao do index.html continuam valendo la dentro
    fullscreenTarget: "jogo",
  },
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    // o Ponteiro e o ULTIMO de proposito: o Phaser desenha as cenas nesta ordem,
    // e o cursor tem que ficar por cima de tudo, inclusive da caixa de fala.
    scene: [
      Boot, Titulo, Carregar, Criacao, Mundo, Interface, Pausa, Ficha, Som,
      Combate, EscolhaDeSelo, Provador, Ponteiro,
    ],
  });
  // gancho de depuracao: no console do navegador da para fazer
  //   jogo.scene.getScene("Interface").events.emit("falar", {...})
  (window as unknown as { jogo: Phaser.Game }).jogo = jogo;
  instalarBancada(jogo);
  vigiarJanela(jogo);
  instalarAuditor(jogo);
  instalarPonteiro(jogo);
}

// espera a fonte de pixel carregar, senao a primeira tela sai com a fonte do sistema
if (document.fonts?.ready) {
  document.fonts.ready.then(comecar);
} else {
  comecar();
}
