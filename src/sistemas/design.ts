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
import { texto, marcar, OpcoesTexto } from "./texto";

export { marcar };

/** Escala de espacamento. Sempre multiplo de 2, porque a tela e pixel art. */
export const ESPACO = { xs: 2, sm: 4, md: 6, lg: 10, xl: 16 } as const;

export const TAMANHO = {
  botao: 18,
  botaoPequeno: 14,
  linhaTexto: 10,
  linhaTitulo: 18,
  chapa: 14,
  paddingPainel: 8,
  paddingTela: 10,
} as const;

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
  const topoTotal = Math.round(centro - alturaTotal / 2);
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

/** Quebra um texto em linhas que caibam na largura, em caracteres de 8 px. */
export function quebrar(conteudo: string, larguraPx: number): string[] {
  const cabe = Math.max(1, Math.floor(larguraPx / 8));
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
