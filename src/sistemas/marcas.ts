/** A tabela de reacoes: o que uma MARCA faz quando acerta alguem. Logica
 *  pura, sem Phaser. Ver docs/11-combate-e-magias.md secao 7 (a gramatica
 *  MARCA + FORMA) e docs/mundo-que-reage.md secao 3 (a tabela inteira).
 *
 * Revisao de 2026-09-04, junto da reformulacao das 11 magias restantes: sete
 * marcas tratadas agora (gelo, luz, planta, cola, doce, bolha, som-alto), as
 * seis novas sao as que as magias de debuff/buff realmente carregam. Nao
 * entraram ainda: fogo/agua (a interacao completa com gelo, que pede
 * superficie de chao pra fazer sentido - Fase 4/10 do plano) e vento/pulo/
 * conserto/fala/invisivel/corta/quebra/empurra (efeito DIRETO, nunca uma
 * condicao - tabela de "vem de" que pede sistema proprio: mover o heroi,
 * consertar objeto, abrir dialogo. Ver docs/mundo-que-reage.md secao 3, a
 * linha final da tabela).
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

  if (marca === "luz") {
    // luz revela quem estava escondido (docs/mundo-que-reage.md secao 3) -
    // "invisivel" e nome de MARCA, nao de condicao (Sumir-Sumindo e efeito
    // direto no heroi, nunca uma condicao de bicho); a condicao equivalente
    // no union de IdCondicao e "escondido".
    const semEsconderijo = condicoesDoAlvo.filter((c) => c.id !== "escondido");
    return { condicoesNovas: aplicar(semEsconderijo, { id: "iluminado", turnosRestantes: 20 }) };
  }

  if (marca === "planta" || marca === "cola") {
    return { condicoesNovas: aplicar(condicoesDoAlvo, { id: "preso", turnosRestantes: 2 }) };
  }

  if (marca === "doce") {
    return { condicoesNovas: aplicar(condicoesDoAlvo, { id: "atraido", turnosRestantes: 3 }) };
  }

  if (marca === "bolha") {
    return { condicoesNovas: aplicar(condicoesDoAlvo, { id: "protegido", turnosRestantes: 3 }) };
  }

  if (marca === "som-alto") {
    return { condicoesNovas: aplicar(condicoesDoAlvo, { id: "assustado", turnosRestantes: 2 }) };
  }

  // fogo, agua, vento, pulo, conserto, fala, invisivel, corta, quebra,
  // empurra: ainda sem reacao propria aqui (ver o comentario do arquivo).
  return { condicoesNovas: condicoesDoAlvo };
}

export type { Condicao, IdCondicao };
