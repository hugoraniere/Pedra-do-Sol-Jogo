/** Mapeamento de ícones SVG game-icons.net para identificadores do jogo.
 *  Centraliza a associação entre nomes de atributo/magia e seus ícones novos em SVG.
 *  Criado 2026-09-06: sistema de ícones novo em family game-icons.net. */

import type { Atributo } from "../dados/conteudo";

/** Ícones de atributo em SVG — correspondência com atributos.ts */
export const ICONE_ATRIBUTO_SVG: Record<Atributo, string> = {
  forca: "atributo-forca",
  destreza: "atributo-destreza",
  agilidade: "atributo-agilidade",
  inteligencia: "atributo-inteligencia",
  vitalidade: "atributo-vitalidade",
} as const;

/** Ícones de magia em SVG — correspondência com magias em conteudo.ts.
 *  Tipos: ids de magias de conteudo.ts */
export const ICONE_MAGIA_SVG: Record<
  "bola-de-fogo" | "bafo-gelado" | "voz-de-trovao" | "luzinha" | "cresce-grama" |
  "pulo-de-sapo" | "dedo-colante" | "remendo" | "escudo-de-bolha" | "cheiro-de-bolo" |
  "fala-bicho" | "sumir-sumindo" | "chama-vento",
  string | null
> = {
  "bola-de-fogo": "bola-de-fogo",
  "bafo-gelado": "bafo-gelado",
  "voz-de-trovao": "voz-de-trovao",
  "luzinha": "fogo-fatuo",
  "cresce-grama": "cresce-grama",
  "pulo-de-sapo": "salto-longo",
  "dedo-colante": "aderencia",
  "remendo": "remendo",
  "escudo-de-bolha": "barreira",
  "cheiro-de-bolo": "cheiro-de-fogueira", // ex-Atrair, ainda sem substituto aprovado
  "fala-bicho": "lingua-selvagem",
  "sumir-sumindo": "veu-de-sombra",
  "chama-vento": "rajada",
} as const;

/** Diretório onde os SVGs de ícones estão armazenados (durante piloto). */
export const DIRETORIO_ICONES_PILOTO = "ferramentas/piloto-icones/";

/** Carrega um ícone SVG como textura no Phaser durante o piloto.
 *  @param cena — a cena que carrega (precisa estar no Boot ou preload)
 *  @param nomeIcone — o nome do arquivo SVG sem extensão (ex: "atributo-forca")
 *  @param chaveTexturaPhaser — a chave sob a qual o Phaser registra a textura (padrão: mesmo nome) */
export function carregarIconeSVG(
  cena: Phaser.Scene,
  nomeIcone: string,
  chaveTexturaPhaser?: string
) {
  const chave = chaveTexturaPhaser || nomeIcone;
  const caminho = `${DIRETORIO_ICONES_PILOTO}${nomeIcone}.svg`;

  // Durante desenvolvimento, o SVG está no sistema de arquivos.
  // Em produção, precisará ser copiado para public/assets/icones/ e carregado via image loader.
  if (cena.textures.exists(chave)) return; // já carregado

  // load.image() nao processa SVG sem width/height no elemento raiz (so viewBox,
  // que e o caso de todo game-icons.net) -- o Phaser falha ao converter pra
  // textura e o Loader nunca fecha a contagem, travando o jogo na tela de
  // carregamento pra sempre. load.svg() com tamanho explicito e o loader que
  // o Phaser espera pra SVG.
  cena.load.svg(chave, caminho, { width: 64, height: 64 });
}

/** Carrega todos os ícones de atributos para uma cena.
 *  Chamado tipicamente no preload do Boot.ts */
export function carregarIconesAtributos(cena: Phaser.Scene) {
  Object.values(ICONE_ATRIBUTO_SVG).forEach((nome) => {
    carregarIconeSVG(cena, nome);
  });
}

/** Carrega todos os ícones de magia para uma cena.
 *  Chamado tipicamente no preload do Boot.ts */
export function carregarIconesMagia(cena: Phaser.Scene) {
  Object.values(ICONE_MAGIA_SVG)
    .filter((nome): nome is string => nome !== null)
    .forEach((nome) => {
      carregarIconeSVG(cena, nome);
    });
}

/** Retorna o identificador de textura para renderizar um ícone de magia.
 *  @param magiaId — o id da magia (chave em conteudo.ts)
 *  @param indiceAntigo — fallback: índice da folha icones.png se SVG não existir
 *  @returns { textura, frame } — para usar em cena.add.image(x, y, textura, frame)
 *           textura = nome do SVG ou "icones" (folha); frame = nome ou índice */
export function obterTexturaMagia(magiaId: string, indiceAntigo: number) {
  const nomeIcone = ICONE_MAGIA_SVG[magiaId as keyof typeof ICONE_MAGIA_SVG];

  if (nomeIcone) {
    // Retorna o SVG (sem frame, pois é uma imagem única)
    return { textura: nomeIcone, frame: undefined as any };
  }

  // Fallback: folha de sprites antiga
  return { textura: "icones", frame: indiceAntigo };
}

/** Retorna o identificador de textura para renderizar um ícone de atributo.
 *  @param atributoId — o id do atributo (chave em ATRIBUTO)
 *  @returns { textura, frame } — o SVG do atributo */
export function obterTexturaAtributo(atributoId: Atributo) {
  return { textura: ICONE_ATRIBUTO_SVG[atributoId], frame: undefined as any };
}
