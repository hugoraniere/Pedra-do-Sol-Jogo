/** Design system do jogo.
 *
 * Existe porque a UI estava sendo posicionada com numero magico espalhado pelas
 * cenas, e ai um botao acabava em cima de um texto. Aqui ficam:
 *   . a escala de espacamento e os tamanhos padrao
 *   . a PILHA, que empilha elementos calculando o y sozinha
 *   . a CAIXA, um painel que sabe qual e a area util de dentro dele
 *
 * Regra do projeto: nenhuma cena escreve coordenada Y na mao. Se voce se pegou
 * somando 34 com 18 para achar onde vai um botao, use a pilha.
 */
import Phaser from "phaser";
import { LARGURA, ALTURA } from "../dados/config";
import { texto, marcar, medirTexto, AVANCO_MAX, OpcoesTexto } from "./texto";

export { marcar };

/** Escala de espacamento. Sempre multiplo de 2, porque a tela e pixel art. */
export const ESPACO = { xs: 2, sm: 4, md: 6, lg: 10, xl: 16 } as const;

/** A escala da interface.
 *
 *  O alvo e o dedo de uma crianca de 7 anos num iPad, onde o canvas roda em
 *  escala 3: um botao de 16 px daqui vira 48 pontos de tela, e 44 e o minimo
 *  para o dedo acertar. Por isso nada de tocar fica abaixo de 16.
 *
 *  Chapinha e chip nao sao alvo de toque, entao podem ser menores. Mas nao
 *  menores que 12: a linha da fonte tem 10 px e ainda precisa de folga, senao a
 *  letra encosta na borda. */
export const TAMANHO = {
  botao: 16,
  botaoPequeno: 16,
  linhaTexto: 10,
  linhaTitulo: 16,
  chapa: 14,
  chip: 12,
  paddingPainel: 6,
  paddingTela: 8,
  /** menor alvo que um dedo acerta, em px logicos (44 pontos / escala 3) */
  alvoMinimo: 16,
} as const;

/** Largura maxima de um botao. Sem isto o FECHAR ocupava a largura inteira da
 *  janela, o que no iPad dava 768 pontos de botao: alvo bom tem 44, nao 768. */
export const LARGURA_MAX_BOTAO = 120;

export type Retangulo = { x: number; y: number; largura: number; altura: number };

/**
 * Empilha elementos de cima para baixo dentro de uma area.
 * Cada reserva devolve o retangulo daquele elemento e anda o cursor.
 *
 *   const p = pilha(area);
 *   const a = p.reservar(TAMANHO.botao);
 *   const b = p.reservar(TAMANHO.linhaTexto, ESPACO.lg);  // gap maior antes
 *   p.alturaUsada();
 */
export function pilha(area: Retangulo, gapPadrao: number = ESPACO.md) {
  let cursor = area.y;
  let primeiro = true;
  return {
    reservar(altura: number, gap: number = gapPadrao): Retangulo {
      if (!primeiro) cursor += gap;
      primeiro = false;
      const r = { x: area.x, y: cursor, largura: area.largura, altura };
      cursor += altura;
      return r;
    },
    /** pula um espaco sem colocar nada */
    pular(altura: number) {
      cursor += altura;
    },
    alturaUsada(): number {
      return cursor - area.y;
    },
    restante(): number {
      return area.y + area.altura - cursor;
    },
  };
}

/** centro vertical de um retangulo, que e onde botao e texto centrado ficam */
export const meio = (r: Retangulo) => r.y + r.altura / 2;

/**
 * Painel com chapa de titulo. A chapa fica INTEIRA acima do painel e a area util
 * comeca depois do padding, entao nada de dentro encosta no titulo.
 *
 * Devolve a area util para usar com a pilha.
 */
export function caixa(
  cena: Phaser.Scene,
  opcoes: {
    largura: number;
    alturaConteudo: number;
    titulo?: string;
    centroY?: number;
    painel?: "painel" | "painel-creme";
  }
): Retangulo {
  const { largura, alturaConteudo, titulo, painel = "painel" } = opcoes;
  const alturaPainel = alturaConteudo + TAMANHO.paddingPainel * 2;
  const alturaTotal = alturaPainel + (titulo ? TAMANHO.chapa + ESPACO.sm : 0);
  const centro = opcoes.centroY ?? ALTURA / 2;
  // em resolucao baixa a caixa pode nao caber centrada: entao ela encosta na
  // margem de cima em vez de vazar pelas duas pontas
  const limite = Math.max(TAMANHO.paddingTela, ALTURA - alturaTotal - TAMANHO.paddingTela);
  const topoTotal = Math.round(
    Math.min(Math.max(centro - alturaTotal / 2, TAMANHO.paddingTela), limite)
  );
  const topoPainel = topoTotal + (titulo ? TAMANHO.chapa + ESPACO.sm : 0);
  const x = Math.round((LARGURA - largura) / 2);

  marcar(
    cena.add
      .nineslice(x, topoPainel + 3, "painel-escuro", undefined, largura, alturaPainel, 8, 8, 8, 8)
      .setOrigin(0),
    "fundo"
  );
  marcar(
    cena.add
      .nineslice(x, topoPainel, painel, undefined, largura, alturaPainel, 8, 8, 8, 8)
      .setOrigin(0),
    "painel",
    titulo
  );

  if (titulo) {
    const larguraChapa = Math.min(largura - ESPACO.xl, titulo.length * 8 + ESPACO.xl * 2);
    marcar(
      cena.add
        .nineslice(
          Math.round((LARGURA - larguraChapa) / 2),
          topoTotal,
          "painel-ouro",
          undefined,
          larguraChapa,
          TAMANHO.chapa,
          8,
          8,
          8,
          8
        )
        .setOrigin(0),
      "fundo"
    );
    marcar(
      texto(cena, LARGURA / 2, topoTotal + TAMANHO.chapa / 2, titulo, {
        cor: 0x2c2440,
        ancora: 0.5,
        ancoraY: 0.5,
      }),
      "texto",
      titulo
    );
  }

  return {
    x: x + TAMANHO.paddingPainel,
    y: topoPainel + TAMANHO.paddingPainel,
    largura: largura - TAMANHO.paddingPainel * 2,
    altura: alturaConteudo,
  };
}

/** Texto de uma ou mais linhas, ja medido. Use para saber quanto reservar. */
export function alturaDoTexto(linhas: number, tamanho: 8 | 16 = 8): number {
  return linhas * (tamanho === 16 ? TAMANHO.linhaTitulo : TAMANHO.linhaTexto);
}

/** Quebra um texto em linhas que caibam na largura.
 *
 *  Mede pelo MAIOR avanco da fonte, nao por 8 px por letra como antes: 8 era
 *  mais largo que qualquer letra existente, entao a linha quebrava cedo e sobrava
 *  borda vazia a direita em toda tela do jogo. */
export function quebrar(conteudo: string, larguraPx: number): string[] {
  const cabe = Math.max(1, Math.floor(larguraPx / AVANCO_MAX));
  const palavras = conteudo.split(" ");
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    if ((atual + " " + p).trim().length > cabe) {
      if (atual) linhas.push(atual.trim());
      atual = p;
    } else {
      atual = (atual + " " + p).trim();
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Texto centrado dentro de um retangulo reservado pela pilha. */
export function textoNaArea(
  cena: Phaser.Scene,
  area: Retangulo,
  conteudo: string,
  op: OpcoesTexto = {}
) {
  return marcar(
    texto(cena, area.x + area.largura / 2, meio(area), conteudo, {
      ...op,
      ancora: 0.5,
      ancoraY: 0.5,
    }),
    "texto",
    conteudo.slice(0, 20)
  );
}

/**
 * Divide um retangulo em colunas, do mesmo jeito que a pilha divide em linhas.
 *
 * A regra do projeto proibe coordenada Y na mao, e a pilha resolve isso. Mas
 * assim que uma tela tem boneco de um lado e texto do outro, o X volta a ser
 * escrito na mao. Aqui os pesos fazem a conta: `colunas(area, [1, 3])` da uma
 * coluna estreita para o retrato e uma larga para o resto.
 *
 * A ultima coluna leva a sobra da divisao, senao um pixel some no arredondamento
 * e a borda direita nunca bate com a do painel.
 */
export function colunas(area: Retangulo, pesos: number[], gap: number = ESPACO.md): Retangulo[] {
  const total = pesos.reduce((s, p) => s + p, 0);
  const util = area.largura - gap * (pesos.length - 1);
  const direita = area.x + area.largura;
  let x = area.x;
  return pesos.map((peso, i) => {
    const ultima = i === pesos.length - 1;
    const largura = ultima ? direita - x : Math.round((util * peso) / total);
    const r = { x, y: area.y, largura, altura: area.altura };
    x += largura + gap;
    return r;
  });
}

/** Altura de um chip, a pilula com uma palavra so. Nao e alvo de toque. */
export const ALTURA_CHIP = TAMANHO.chip;

/** Largura que um chip precisa para caber o texto dele, medida na fonte de
 *  verdade. Com a conta antiga de 8 px por letra, todo chip nascia com ate 60%
 *  de borda sobrando de um lado. */
export const larguraDoChip = (cena: Phaser.Scene, conteudo: string) =>
  medirTexto(cena, conteudo) + ESPACO.md * 2;

/**
 * Arruma chips em linhas que caibam na largura, sem desenhar nada.
 *
 * Existe separado de `chip()` porque a caixa precisa saber a altura ANTES de o
 * primeiro pixel aparecer. Entao a mesma conta roda duas vezes: uma para medir,
 * outra para desenhar, e as duas nao podem discordar.
 */
export function arrumarChips(
  cena: Phaser.Scene,
  textos: string[],
  largura: number,
  gap = ESPACO.sm
): string[][] {
  const linhas: string[][] = [];
  let atual: string[] = [];
  let usado = 0;
  for (const conteudo of textos) {
    const largo = larguraDoChip(cena, conteudo);
    if (atual.length && usado + gap + largo > largura) {
      linhas.push(atual);
      atual = [];
      usado = 0;
    }
    usado += (atual.length ? gap : 0) + largo;
    atual.push(conteudo);
  }
  if (atual.length) linhas.push(atual);
  return linhas;
}

/** Altura que um conjunto de chips vai ocupar depois de arrumado. */
export function alturaDosChips(linhas: string[][], gap = ESPACO.sm): number {
  return linhas.length * ALTURA_CHIP + Math.max(0, linhas.length - 1) * gap;
}

/**
 * A pilula com uma palavra, igual as da ficha de papel do Lele.
 *
 * E o jeito de mostrar muita coisa numa tela pequena sem virar paragrafo: o nome
 * da arma, o dom, cada magia. Ele reconhece a forma antes de ler a palavra.
 */
export function chip(
  cena: Phaser.Scene,
  x: number,
  y: number,
  conteudo: string,
  painel: "painel-creme" | "painel-ouro" = "painel-creme"
) {
  const largura = larguraDoChip(cena, conteudo);
  marcar(
    cena.add.nineslice(x, y, painel, undefined, largura, ALTURA_CHIP, 8, 8, 8, 8).setOrigin(0),
    "fundo"
  );
  marcar(
    texto(cena, x + largura / 2, y + ALTURA_CHIP / 2, conteudo, {
      cor: 0x2c2440,
      ancora: 0.5,
      ancoraY: 0.5,
    }),
    "texto",
    conteudo
  );
  return largura;
}

/** Desenha uma linha de chips a partir da esquerda da area. */
export function chipsNaLinha(
  cena: Phaser.Scene,
  linha: Retangulo,
  textos: string[],
  gap = ESPACO.sm,
  painel: "painel-creme" | "painel-ouro" = "painel-creme"
) {
  let x = linha.x;
  textos.forEach((conteudo) => {
    x += chip(cena, x, linha.y, conteudo, painel) + gap;
  });
}
