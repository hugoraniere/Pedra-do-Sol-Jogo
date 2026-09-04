/** A tabela de reacoes: o que uma MARCA faz quando acerta alguem. Logica
 *  pura, sem Phaser. Ver docs/11-combate-e-magias.md secao 7 (a gramatica
 *  MARCA + FORMA) e docs/mundo-que-reage.md secao 3 (a tabela inteira).
 *
 * Versao MINIMA desta fase: so a linha que envolve `gelo`/`molhado` existe de
 * verdade. As outras dezesseis combinacoes da tabela completa entram na
 * Fase 4, junto com as superficies de chao — a maioria delas muda o CHAO, nao
 * so a criatura, e superficie ainda nao existe no jogo.
 *
 * A funcao nunca "erra": se a marca nao acha reacao, devolve um resultado
 * vazio e o efeito visual acontece do mesmo jeito (isso e responsabilidade de
 * quem chama, nao daqui). Nunca um "nao funciona aqui" — regra de ouro de
 * docs/11-combate-e-magias.md secao 8.
 */
// A extensao .ts aqui e de proposito, nao esquecimento: este modulo tambem e
// importado direto pelo Node (ferramentas/conferir-condicoes.mjs), sem passar
// pelo Vite, e o resolvedor de ESM do Node exige a extensao explicita. O Vite
// tolera ela normalmente, entao um import so serve aos dois mundos.
import { aplicar, tem, type Condicao, type IdCondicao } from "./condicoes.ts";

export type Marca =
  | "fogo" | "gelo" | "agua" | "luz" | "som-alto" | "vento"
  | "planta" | "cola" | "doce" | "invisivel" | "bolha"
  | "conserto" | "fala" | "pulo" | "corta" | "quebra" | "empurra";

export type ResultadoDaMarca = {
  condicoesNovas: Condicao[];
  efeitoEspecial?: "congelou" | "apagou" | "derreteu";
};

/** `alvo` so precisa saber ler e devolver as proprias condicoes: tanto um
 *  `Bicho` quanto o heroi (numa struct paralela) servem, sem import cruzado
 *  de cena nenhuma. */
export function aplicarMarca(marca: Marca, condicoesDoAlvo: Condicao[]): ResultadoDaMarca {
  if (marca === "gelo") {
    // gelo em quem ja esta molhado: congela na hora, sem precisar de mais nada.
    if (tem(condicoesDoAlvo, "molhado")) {
      return {
        condicoesNovas: aplicar(condicoesDoAlvo, { id: "congelado", turnosRestantes: 1 }),
        efeitoEspecial: "congelou",
      };
    }
    // gelo em quem esta seco: so atrasa (o "preso"/lentidao de verdade e
    // Fase 4, quando existir superficie de gelo para pisar). Por enquanto,
    // nenhuma condicao nova — nunca um "nao funciona", so um efeito menor.
    return { condicoesNovas: condicoesDoAlvo };
  }

  // as outras dezesseis marcas ainda nao tem reacao propria nesta fase.
  return { condicoesNovas: condicoesDoAlvo };
}

export type { Condicao, IdCondicao };
