/** Janela flutuante: o unico jeito de mostrar alguma coisa por cima do mundo.
 *
 * A ficha, a mochila e as habilidades nascem todas daqui, entao todas tem a
 * mesma moldura e o MESMO jeito de fechar: um botao grande embaixo, escrito
 * FECHAR. Quem joga tem 7 anos. Se cada janela fechasse de um jeito diferente,
 * ele ficaria preso na primeira que fugisse do padrao.
 *
 * O botao de fechar e reservado DENTRO da caixa, antes de a area de conteudo ser
 * devolvida. Assim nao existe o caso de o conteudo crescer e cobrir o botao: o
 * conteudo nunca chega ate la.
 *
 * Quando a janela tem ABAS, elas substituem a chapa de titulo: nao existe as
 * duas coisas ao mesmo tempo. E o mesmo lugar da tela, so que em vez de um
 * texto so, viram varios botoes, um por assunto. Inspirado no menu de
 * inventario do Stardew Valley, que o Hugo pediu de referencia.
 */
import Phaser from "phaser";
import { ALTURA, LARGURA, COR } from "../dados/config";
import { botao } from "./botao";
import { ESPACO, LARGURA_MAX_BOTAO, TAMANHO, caixa, marcar, meio, pilha, Retangulo } from "./design";
import { medirTexto } from "./texto";

/** Largura de janela na visao normal. Em tela menor ela encolhe junto.
 *
 *  272 nao e um numero bonito escolhido a olho: e a largura em que as frases do
 *  material impresso ("empurrar, subir, lutar, carregar") param de quebrar em
 *  duas linhas. Cada quebra que some e uma linha a mais de conteudo na tela. */
const LARGURA_MAXIMA = 272;

/** Altura de uma aba. Igual a de um botao, porque uma aba E um botao: o dedo
 *  precisa acertar ela do mesmo jeito. */
const ALTURA_ABA = TAMANHO.botao;

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
export function alturaUtilDaJanela(opcoes: { comAbas?: boolean } = {}): number {
  const cabecalho = opcoes.comAbas ? ALTURA_ABA : TAMANHO.chapa;
  const moldura =
    TAMANHO.paddingTela * 2 + // margem da tela, em cima e embaixo
    cabecalho +
    ESPACO.sm + // o cabecalho, que fica acima do painel
    TAMANHO.paddingPainel * 2 + // o padding de dentro do painel
    ESPACO.md +
    TAMANHO.botao; // o botao de fechar, sempre reservado
  return ALTURA - moldura;
}

export type Aba = {
  rotulo: string;
  /** nome fixo, para a auditoria automatica achar a aba pelo nome, e nao pela
   *  posicao. Se nao vier, usa o proprio rotulo. */
  dono?: string;
};

/**
 * Abre a janela e devolve a area util para o conteudo.
 *
 * Desenhe o conteudo DEPOIS de chamar isto: o painel ja esta na cena, e o que
 * vier depois fica por cima dele.
 */
export function janela(
  cena: Phaser.Scene,
  opcoes: {
    aoFechar: () => void;
  } & (
    | { titulo: string; alturaConteudo: number; abas?: undefined }
    | {
        titulo?: undefined;
        alturaConteudo: number;
        /** as abas no lugar da chapa de titulo. */
        abas: { itens: Aba[]; ativa: number; aoEscolher: (indice: number) => void };
      }
  )
): Retangulo {
  // escurece o mundo atras e come o toque que cair fora da janela, senao o dedo
  // atravessa e mexe no direcional que continua desenhado embaixo
  marcar(
    cena.add.rectangle(0, 0, LARGURA, ALTURA, COR.tinta, 0.66).setOrigin(0).setInteractive(),
    "fundo"
  );

  const alturaConteudo = Math.min(
    opcoes.alturaConteudo,
    alturaUtilDaJanela({ comAbas: !!opcoes.abas })
  );

  let area: Retangulo;
  if (opcoes.abas) {
    area = caixaComAbas(cena, {
      largura: larguraDaJanela(),
      alturaConteudo: alturaConteudo + ESPACO.md + TAMANHO.botao,
      abas: opcoes.abas,
    });
  } else {
    area = caixa(cena, {
      largura: larguraDaJanela(),
      alturaConteudo: alturaConteudo + ESPACO.md + TAMANHO.botao,
      titulo: opcoes.titulo,
    });
  }

  const p = pilha(area, ESPACO.md);
  const conteudo = p.reservar(alturaConteudo);
  const linhaFechar = p.reservar(TAMANHO.botao);
  const larguraFechar = Math.min(linhaFechar.largura, LARGURA_MAX_BOTAO);
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

  return conteudo;
}

/**
 * O mesmo painel que caixa() desenha, mas com uma fileira de abas no lugar da
 * chapa de titulo. Nao chama caixa() por dentro porque caixa() so sabe
 * desenhar UM texto de titulo, e aqui sao varios botoes lado a lado.
 *
 * A conta de onde fica o topo e identica a de caixa(): copiada de proposito,
 * em vez de caixa() virar dois jeitos de desenhar dentro da mesma funcao. Duas
 * funcoes pequenas e claras valem mais que uma com um parametro que muda o
 * comportamento inteiro dela.
 */
function caixaComAbas(
  cena: Phaser.Scene,
  opcoes: {
    largura: number;
    alturaConteudo: number;
    abas: { itens: Aba[]; ativa: number; aoEscolher: (indice: number) => void };
  }
): Retangulo {
  const { largura, alturaConteudo, abas } = opcoes;
  const alturaPainel = alturaConteudo + TAMANHO.paddingPainel * 2;
  const alturaTotal = alturaPainel + ALTURA_ABA + ESPACO.sm;
  const centro = ALTURA / 2;
  const limite = Math.max(TAMANHO.paddingTela, ALTURA - alturaTotal - TAMANHO.paddingTela);
  const topoTotal = Math.round(
    Math.min(Math.max(centro - alturaTotal / 2, TAMANHO.paddingTela), limite)
  );
  const topoPainel = topoTotal + ALTURA_ABA + ESPACO.sm;
  const x = Math.round((LARGURA - largura) / 2);

  marcar(
    cena.add
      .nineslice(x, topoPainel + 3, "painel-escuro", undefined, largura, alturaPainel, 8, 8, 8, 8)
      .setOrigin(0),
    "fundo"
  );
  marcar(
    cena.add
      .nineslice(x, topoPainel, "painel", undefined, largura, alturaPainel, 8, 8, 8, 8)
      .setOrigin(0),
    "painel",
    "janela com abas"
  );

  desenharAbas(cena, abas, x, topoTotal, largura);

  return {
    x: x + TAMANHO.paddingPainel,
    y: topoPainel + TAMANHO.paddingPainel,
    largura: largura - TAMANHO.paddingPainel * 2,
    altura: alturaConteudo,
  };
}

/**
 * A fileira de abas em si. Cada uma mede o proprio rotulo: uma palavra curta
 * como "EU" nao precisa da mesma largura que "MOCHILA". Divide o espaco sobrando
 * entre todas em vez de deixar cada uma com a largura minima, para o alvo de
 * toque ficar generoso mesmo com seis abas na fileira.
 */
function desenharAbas(
  cena: Phaser.Scene,
  abas: { itens: Aba[]; ativa: number; aoEscolher: (indice: number) => void },
  xJanela: number,
  y: number,
  larguraJanela: number
) {
  const gap = ESPACO.xs;
  const minimas = abas.itens.map((a) => medirTexto(cena, a.rotulo) + ESPACO.sm * 2);
  const somaMinima = minimas.reduce((s, w) => s + w, 0) + gap * (abas.itens.length - 1);
  const sobra = Math.max(0, larguraJanela - somaMinima);
  const porAba = sobra / abas.itens.length;
  const larguras = minimas.map((w) => Math.round(w + porAba));

  const larguraTotal = larguras.reduce((s, w) => s + w, 0) + gap * (larguras.length - 1);
  let x = xJanela + Math.round((larguraJanela - larguraTotal) / 2);

  // as inativas primeiro, para a ativa desenhar por cima e nao ficar com a
  // borda da vizinha entalhada nela
  abas.itens.forEach((aba, i) => {
    if (i === abas.ativa) {
      x += larguras[i] + gap;
      return;
    }
    const b = botao(
      cena,
      x + larguras[i] / 2,
      y + ALTURA_ABA / 2,
      larguras[i],
      ALTURA_ABA,
      aba.rotulo,
      () => abas.aoEscolher(i),
      "painel-creme",
      "menu-foco"
    );
    b.setData("ui", { tipo: "botao", dono: aba.dono ?? aba.rotulo });
    x += larguras[i] + gap;
  });

  x = xJanela + Math.round((larguraJanela - larguraTotal) / 2);
  abas.itens.forEach((aba, i) => {
    if (i !== abas.ativa) {
      x += larguras[i] + gap;
      return;
    }
    const b = botao(
      cena,
      x + larguras[i] / 2,
      y + ALTURA_ABA / 2,
      larguras[i],
      ALTURA_ABA,
      aba.rotulo,
      () => abas.aoEscolher(i),
      "painel-ouro",
      "menu-foco"
    );
    b.marcar(true);
    b.setData("ui", { tipo: "botao", dono: aba.dono ?? aba.rotulo });
    x += larguras[i] + gap;
  });
}
