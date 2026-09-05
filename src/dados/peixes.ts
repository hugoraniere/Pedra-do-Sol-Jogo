/** Peixes do rio da Vila Semente. So dado, sem logica — no espirito de
 *  dados/sons.ts e dados/tempo.ts. Quem pergunta "o que da pra pescar
 *  agora" e sistemas/pesca.ts.
 *
 *  Isto NAO e a pescaria completa (peixes brasileiros de rio e mar, o pier
 *  de Portomares) que docs/02-roteiro.md ja documenta como "material de
 *  mesa, entra numa fase posterior" — e so o suficiente pra dar vida ao
 *  gancho que ja existe (Seu Fagundes, a missao "peixes-sumindo"), com
 *  peixe raro em janela curta do dia. Sem minigame de fisgar: so catalogo
 *  e fala condicionada por periodo (sistemas/condicoes-de-fala.ts). */
import type { Periodo } from "./tempo";
import type { Raridade } from "./conteudo";

export type Peixe = {
  id: string;
  nome: string;
  raridade: Raridade;
  /** em quais periodos ele morde a isca */
  periodos: Periodo[];
  local: string;
  texto: string;
};

export const PEIXES: Peixe[] = [
  {
    id: "lambari",
    nome: "Lambari",
    raridade: "comum",
    periodos: ["manha", "tarde"],
    local: "rio da Vila Semente",
    texto: "Pequeno e rapido. O primeiro que qualquer um aprende a fisgar.",
  },
  {
    id: "traira",
    nome: "Traira",
    raridade: "comum",
    periodos: ["manha", "tarde", "por-do-sol"],
    local: "rio da Vila Semente",
    texto: "Dentuca e teimosa — luta ate o fim antes de vir pra rede.",
  },
  {
    id: "dourado-do-poente",
    nome: "Dourado do Poente",
    raridade: "raro",
    periodos: ["por-do-sol"],
    local: "rio da Vila Semente",
    texto: "As escamas pegam fogo com a luz baixa. So morde quando o sol se deita.",
  },
  {
    id: "prata-da-neblina",
    nome: "Prata da Neblina",
    raridade: "raro",
    periodos: ["aurora"],
    local: "rio da Vila Semente",
    texto: "Sobe a superficie so na neblina fina da madrugada tardia. Some assim que o sol esquenta.",
  },
];
