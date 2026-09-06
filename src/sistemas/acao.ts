/** Quais acoes de combate um heroi tem, e nao outro.
 *
 * Antes desta fase, `Combate.ts` mostrava a mesma barra pra qualquer heroi
 * (as 6 acoes de teste do `?provador`). Isso contradizia o RPG de mesa: cada
 * classe tem arma + habilidade + magias proprias, e cada raca tem um dom -
 * boa parte disso vale 1 uso por AVENTURA, nao por combate. Ver
 * `docs/plano-de-implementacao.md`, "Fase 9 revista", pro raciocinio inteiro.
 *
 * Sistema puro: nenhuma linha de Phaser aqui, igual `sistemas/poderes.ts`.
 */
import { ARMAS, acharClasse, acharMagia, acharRaca, type AcaoDeCombate, type FormaDeAcao } from "../dados/conteudo.ts";
import type { Marca } from "./marcas.ts";
import type { AlvoDeAcao } from "./alvo.ts";
import type { Dado } from "./dado.ts";
import type { Heroi } from "./estado.ts";

/** Quando a acao volta a ficar disponivel. "porLuta" so existe pro Golpe
 *  Trovao do Cavaleiro hoje - e a unica excecao que a referencia escreve
 *  "por luta" em vez de "por aventura". */
export type EscopoDeUso = "porTurno" | "porLuta" | "porAventura";

export type AcaoDeHeroi = AcaoDeCombate & { escopo: EscopoDeUso };

/** O golpe sem arma: todo heroi tem, sempre disponivel, nunca quebra nada -
 *  regra dita no comeco deste combate inteiro. */
export const ACAO_SOCO: AcaoDeHeroi = {
  id: "soco", tipo: "golpe", nome: "SEM ARMA",
  dica: "Sempre da pra usar. Nunca quebra nada.",
  icone: 6, cor: 0x4a3e64, forma: "casa", alcance: 1, atributo: "forca", som: "soco",
  dado: { quantidade: 1, lados: 3 },
  escopo: "porTurno",
};

/** So as armas que uma classe pode comecar com hoje. Uma arma comprada na
 *  loja mais tarde (`ARMAS` em conteudo.ts) que nao esteja aqui cai no golpe
 *  generico de `golpeDaArma()` la embaixo - melhor um golpe sem graca do que
 *  a acao sumir da barra. */
const TABELA_DE_GOLPE: Record<string, Omit<AcaoDeCombate, "id" | "nome" | "cor" | "dica">> = {
  "espada-curta": { tipo: "golpe", icone: 6, forma: "casa", alcance: 1, atributo: "forca", som: "soco", dado: { quantidade: 1, lados: 6 } },
  cajado: { tipo: "golpe", icone: 5, forma: "casa", alcance: 1, atributo: "forca", som: "cajado", dado: { quantidade: 1, lados: 4 } },
  // o martelo pesa mais que as outras armas corpo a corpo - ja tinha o
  // micro-engasgo proprio na animacao (Combate.ts, hitstop no golpe-martelo),
  // agora o dado bate com o peso.
  martelo: { tipo: "golpe", icone: 6, forma: "casa", alcance: 1, atributo: "forca", som: "soco", dado: { quantidade: 1, lados: 8 } },
  arco: { tipo: "golpe", icone: 6, forma: "casa", alcance: 5, atributo: "destreza", som: "soco", dado: { quantidade: 1, lados: 6 } },
  funda: { tipo: "golpe", icone: 6, forma: "casa", alcance: 4, atributo: "destreza", som: "soco", dado: { quantidade: 1, lados: 4 } },
};

/** O golpe de arma do heroi. `armaSprite` e o que esta EQUIPADO agora (pode
 *  ter mudado na loja); `classe.arma` e so o ponto de partida da criacao. */
export function golpeDaArma(armaId: string): AcaoDeHeroi {
  const arma = ARMAS.find((a) => a.id === armaId);
  const base = TABELA_DE_GOLPE[armaId] ?? TABELA_DE_GOLPE["espada-curta"];
  return {
    id: `golpe-${armaId}`, nome: arma?.nome.toUpperCase() ?? "GOLPE",
    dica: arma ? `Ataca com ${arma.nome.toLowerCase()}.` : "Ataca de perto.",
    cor: 0xb08658,
    ...base,
    escopo: "porTurno",
  };
}

/** `forma/alcance/marca` de cada magia - o resto (nome, cor, texto) vem de
 *  `MAGIAS` em conteudo.ts, uma unica fonte pra nao divergir. Numeros de
 *  alcance batem com os ja testados no `?provador` quando a magia tinha
 *  equivalente la (bafo-gelado, voz-de-trovao, bola-de-fogo); os outros vem
 *  da tabela de `docs/11-combate-e-magias.md` secao 9, convertidos de px
 *  (real-time, obsoleto) pra casas (~16px cada). */
const TABELA_DE_MAGIA: Record<
  string,
  { forma: FormaDeAcao; alcance: number; icone: number; marca?: Marca; alvo?: AlvoDeAcao; dado?: Dado }
> = {
  luzinha: { forma: "aoRedor", alcance: 0, icone: 6, marca: "luz", dado: { quantidade: 1, lados: 4 } },
  "bafo-gelado": { forma: "linha", alcance: 3, icone: 8, marca: "gelo", dado: { quantidade: 1, lados: 6 } },
  "cresce-grama": { forma: "aoRedor", alcance: 3, icone: 6, marca: "planta", dado: { quantidade: 1, lados: 4 } },
  "voz-de-trovao": { forma: "aoRedor", alcance: 3, icone: 9, marca: "som-alto", dado: { quantidade: 1, lados: 6 } },
  // salta pra qualquer casa livre dentro do alcance, sem se importar com o que
  // tem no meio do caminho - "atravessa rio, muro ou inimigo de um salto so".
  // alvo "livre": nao precisa pegar ninguem, o efeito e mover o proprio heroi.
  // sem dado: nunca causa dano.
  "pulo-de-sapo": { forma: "casa", alcance: 4, icone: 6, marca: "pulo", alvo: "livre" },
  "dedo-colante": { forma: "aoRedor", alcance: 0, icone: 6, marca: "cola", alvo: "livre" },
  // "casa"/alcance 2 nunca fazia sentido pra um conserto no proprio corpo -
  // virou aoRedor/0, igual todo outro autocuidado (escudo, esconderijo).
  remendo: { forma: "aoRedor", alcance: 0, icone: 6, marca: "conserto", alvo: "livre" },
  "escudo-de-bolha": { forma: "aoRedor", alcance: 0, icone: 6, marca: "bolha", alvo: "livre" },
  "cheiro-de-bolo": { forma: "aoRedor", alcance: 4, icone: 6, marca: "doce", dado: { quantidade: 1, lados: 4 } },
  "fala-bicho": { forma: "casa", alcance: 2, icone: 6, marca: "fala" },
  "sumir-sumindo": { forma: "aoRedor", alcance: 0, icone: 6, marca: "invisivel", alvo: "livre" },
  "chama-vento": { forma: "linha", alcance: 5, icone: 6, marca: "vento", dado: { quantidade: 1, lados: 6 } },
  // a magia mais forte do Mago (docs/plano-de-implementacao.md, Atualizacao
  // 3) merece pesar mais que as outras doze tambem no dado, nao so na
  // animacao.
  "bola-de-fogo": { forma: "casa", alcance: 6, icone: 7, marca: "fogo", dado: { quantidade: 2, lados: 6 } },
};

/** As magias tocam INTELIGENCIA (revisao de 2026-09-04 - era ESPERTEZA na
 *  mesa), igual golpe toca FORCA - regra geral, sem excecao entre as treze. */
export function acaoDaMagia(id: string): AcaoDeHeroi | undefined {
  const dados = TABELA_DE_MAGIA[id];
  const magia = acharMagia(id);
  if (!dados || !magia) return undefined;
  const somPorMarca: Partial<Record<string, string>> = { fogo: "fogo", gelo: "gelo", "som-alto": "voz" };
  return {
    id: magia.id, tipo: "magia", nome: magia.nome.toUpperCase(), dica: magia.texto,
    cor: magia.cor, atributo: "inteligencia",
    som: (dados.marca && somPorMarca[dados.marca]) ?? "",
    ...dados,
    escopo: "porAventura",
  };
}

/** Tudo que este heroi pode fazer numa luta: golpe de arma, soco sempre
 *  disponivel, as magias que ele conhece (`heroi.magias`), a habilidade de
 *  luta da classe e o dom de combate da raca - so quando existirem. Itens da
 *  mochila usaveis em luta (pocao, biscoito...) ficam pra Fase 6, ainda nao
 *  tem forma/efeito definidos. */
export function acoesDoHeroi(heroi: Heroi): AcaoDeHeroi[] {
  const classe = acharClasse(heroi.classe);
  const raca = acharRaca(heroi.raca);
  const acoes: AcaoDeHeroi[] = [golpeDaArma(heroi.armaSprite || classe.arma), ACAO_SOCO];
  for (const id of heroi.magias) {
    const acao = acaoDaMagia(id);
    if (acao) acoes.push(acao);
  }
  if (classe.habilidadeDeLuta) acoes.push({ ...classe.habilidadeDeLuta, escopo: "porLuta" });
  if (raca.acaoDeCombate) acoes.push({ ...raca.acaoDeCombate, escopo: "porAventura" });
  return acoes;
}
