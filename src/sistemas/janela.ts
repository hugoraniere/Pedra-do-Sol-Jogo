/** Janela flutuante: o unico jeito de mostrar alguma coisa por cima do mundo.
 *
 * A ficha, a mochila e as habilidades nascem todas daqui, entao todas tem a
 * mesma moldura, a mesma chapa de titulo e o MESMO jeito de fechar: um botao
 * grande embaixo, escrito FECHAR. Quem joga tem 7 anos. Se cada janela fechasse
 * de um jeito diferente, ele ficaria preso na primeira que fugisse do padrao.
 *
 * O botao de fechar e reservado DENTRO da caixa, antes de a area de conteudo ser
 * devolvida. Assim nao existe o caso de o conteudo crescer e cobrir o botao: o
 * conteudo nunca chega ate la.
 */
import Phaser from "phaser";
import { ALTURA, LARGURA, COR } from "../dados/config";
import { botao } from "./botao";
import { ESPACO, TAMANHO, caixa, marcar, meio, pilha, Retangulo } from "./design";

/** Largura de janela na visao normal. Em tela menor ela encolhe junto.
 *
 *  272 nao e um numero bonito escolhido a olho: e a largura em que as frases do
 *  material impresso ("empurrar, subir, lutar, carregar") param de quebrar em
 *  duas linhas. Cada quebra que some e uma linha a mais de conteudo na tela. */
const LARGURA_MAXIMA = 272;

/** A janela nunca chega na borda: sempre sobra margem dos dois lados. */
export const larguraDaJanela = () => Math.min(LARGURA_MAXIMA, LARGURA - ESPACO.xl * 2);

/** Largura util de dentro da janela, ja sem o padding do painel. */
export const larguraUtilDaJanela = () => larguraDaJanela() - TAMANHO.paddingPainel * 2;

/**
 * Quanto de conteudo cabe numa janela NESTA resolucao.
 *
 * A visao PERTO tem 160 de altura e a LONGE tem 240. Uma janela de altura fixa
 * vazaria pela borda numa e ficaria perdida no meio da outra. Entao quem monta o
 * conteudo pergunta isto primeiro e mostra o que couber, na ordem de importancia.
 */
export function alturaUtilDaJanela(): number {
  const moldura =
    TAMANHO.paddingTela * 2 + // margem da tela, em cima e embaixo
    TAMANHO.chapa +
    ESPACO.sm + // a chapa do titulo, que fica acima do painel
    TAMANHO.paddingPainel * 2 + // o padding de dentro do painel
    ESPACO.md +
    TAMANHO.botao; // o botao de fechar, sempre reservado
  return ALTURA - moldura;
}

/**
 * Abre a janela e devolve a area util para o conteudo.
 *
 * Desenhe o conteudo DEPOIS de chamar isto: o painel ja esta na cena, e o que
 * vier depois fica por cima dele. Foi assim que a Pausa resolveu o mesmo caso.
 */
export function janela(
  cena: Phaser.Scene,
  opcoes: {
    titulo: string;
    alturaConteudo: number;
    aoFechar: () => void;
    /** Quando a janela tem mais de uma pagina, as setas nascem ao lado do FECHAR. */
    virarPagina?: (passo: number) => void;
  }
): Retangulo {
  // escurece o mundo atras e come o toque que cair fora da janela, senao o dedo
  // atravessa e mexe no direcional que continua desenhado embaixo
  marcar(
    cena.add.rectangle(0, 0, LARGURA, ALTURA, COR.tinta, 0.66).setOrigin(0).setInteractive(),
    "fundo"
  );

  const alturaConteudo = Math.min(opcoes.alturaConteudo, alturaUtilDaJanela());
  const area = caixa(cena, {
    largura: larguraDaJanela(),
    alturaConteudo: alturaConteudo + ESPACO.md + TAMANHO.botao,
    titulo: opcoes.titulo,
  });

  const p = pilha(area, ESPACO.md);
  const conteudo = p.reservar(alturaConteudo);
  const linhaFechar = p.reservar(TAMANHO.botao);
  const virar = opcoes.virarPagina;
  // as setas ficam na MESMA linha do fechar: virar pagina nao pode custar altura,
  // que e justamente o que falta numa tela de 192
  const larguraSeta = virar ? TAMANHO.botao + ESPACO.lg : 0;
  const larguraFechar = Math.min(
    linhaFechar.largura - (larguraSeta + ESPACO.sm) * 2,
    LARGURA_MAXIMA / 2
  );
  botao(
    cena,
    LARGURA / 2,
    meio(linhaFechar),
    larguraFechar,
    linhaFechar.altura,
    "FECHAR",
    opcoes.aoFechar,
    "painel-ouro",
    // fechar e desfazer, e desfazer nao soa como escolher
    "menu-volta"
  );

  if (virar) {
    ([
      [-1, "<", linhaFechar.x + larguraSeta / 2],
      [1, ">", linhaFechar.x + linhaFechar.largura - larguraSeta / 2],
    ] as [number, string, number][]).forEach(([passo, seta, x]) => {
      const b = botao(
        cena,
        x,
        meio(linhaFechar),
        larguraSeta,
        linhaFechar.altura,
        seta,
        () => virar(passo),
        "painel-creme"
      );
      // rotulo de uma letra so nao diz qual botao e, e a auditoria clica por nome
      b.setData("ui", { tipo: "botao", dono: passo < 0 ? "PAGINA ANTERIOR" : "PROXIMA PAGINA" });
    });
  }

  return conteudo;
}
