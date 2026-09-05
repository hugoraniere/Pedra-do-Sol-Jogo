/** A tabela de reacoes: o que uma MARCA faz quando acerta alguem. Logica
 *  pura, sem Phaser. Ver docs/11-combate-e-magias.md secao 7 (a gramatica
 *  MARCA + FORMA) e docs/mundo-que-reage.md secao 3 (a tabela inteira).
 *
 * Revisao de 2026-09-04, junto da reformulacao das 11 magias restantes: nove
 * marcas tratadas agora (gelo, luz, planta, cola, doce, bolha, som-alto,
 * invisivel). Nao entraram ainda: fogo/agua (a interacao completa com gelo,
 * que pede superficie de chao pra fazer sentido - Fase 4/10 do plano) e
 * vento/pulo/conserto/fala/corta/quebra/empurra (efeito DIRETO, nunca uma
 * condicao - mover o heroi, consertar objeto, convencer, empurrar - por isso
 * ficam do lado de fora deste arquivo, resolvidos direto em Combate.ts. Ver
 * docs/mundo-que-reage.md secao 3, a linha final da tabela).
 *
 * "cola" mudou de alvo nesta revisao: antes prendia quem fosse acertado, mas
 * Aderencia (a magia que carrega essa marca) e autolancada - as maos que
 * grudam sao as do PROPRIO heroi, nao as de um inimigo. Por isso "cola" agora
 * sai da mesma familia de "planta" (prender) e ganha reacao propria: deixa o
 * heroi GRUDENTO, livre pra escalar o que normalmente bloqueia passagem (ver
 * `Combate.ts`, calcularAlcance). O id da condicao continua "rapido" (nunca
 * usado antes) porque o efeito de jogo e o mesmo tipo - "anda por onde outro
 * nao anda" - so o nome mostrado na tela e que muda (`condicoes-dados.ts`).
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

  if (marca === "planta") {
    return { condicoesNovas: aplicar(condicoesDoAlvo, { id: "preso", turnosRestantes: 2 }) };
  }

  if (marca === "cola") {
    // dura o resto da luta de proposito: nao ha decaimento de condicao por
    // turno ainda (ver o comentario de "livre" em sistemas/alvo.ts pro
    // raciocinio geral), e a magia so pode ser lancada uma vez por aventura -
    // nao ha como abusar de um efeito que so acontece uma vez.
    return { condicoesNovas: aplicar(condicoesDoAlvo, { id: "rapido", turnosRestantes: 99 }) };
  }

  if (marca === "invisivel") {
    // duracao alta de proposito: Veu de Sombra nao caduca contando turno,
    // caduca por AGIR - "enquanto ficar parado" (ver conteudo.ts). E
    // `Combate.ts` que tira a condicao na hora que o heroi anda ou age.
    return { condicoesNovas: aplicar(condicoesDoAlvo, { id: "escondido", turnosRestantes: 99 }) };
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
