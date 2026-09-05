/** Falas dos personagens da vila. Frases curtas, letra grande, uma ideia por tela.
 *
 *  Cada fala e uma lista de VARIANTES, checadas em ordem: a primeira cuja
 *  `condicao` falta ou bate e a que toca (por isso a mais especifica vem
 *  primeiro, e a sem condicao nenhuma, se existir, tem que ser a ultima —
 *  ela e o padrao que sempre bate). E a estrutura que docs/05-roadmap.md
 *  (Fase 1.2) ja previa: "a primeira condicao que bate e a que toca". */
import { noPeriodo, etapaFeita } from "../sistemas/condicoes-de-fala";
import { concluirEtapa } from "../sistemas/missoes";
import { guardar, mudarAfinidade } from "../sistemas/estado";

/** Uma resposta que o jogador pode escolher no fim de uma fala. `efeito`
 *  roda na hora (marca missao, muda afinidade, guarda item); `resposta`, se
 *  houver, e a fala seguinte do NPC — sem uma segunda rodada de escolhas
 *  nesta versao, so um nivel. */
export type Escolha = { texto: string; efeito?: () => void; resposta?: string[] };

export type VarianteDeFala = {
  id: string;
  /** sem condicao = bate sempre. So a ULTIMA variante da lista pode ficar assim. */
  condicao?: () => boolean;
  linhas: string[];
  /** roda quando esta variante e a escolhida pra mostrar (nao por escolha do jogador —
   *  isso e o `efeito` de Escolha). Serve pra "so de conversar, a missao anda". */
  efeito?: () => void;
  escolhas?: Escolha[];
};

export type Fala = { quem: string; variantes: VarianteDeFala[] };

export const DIALOGOS: Record<string, Fala> = {
  vovo: {
    quem: "Vovo Aurora",
    variantes: [
      {
        id: "ja-foi-pra-floresta",
        condicao: etapaFeita("sino-da-vila", "seguir-para-floresta"),
        linhas: [
          "Va com cuidado por la, heroi.",
          "Estou contando os minutos ate voce voltar com noticia.",
        ],
      },
      {
        id: "ja-viu-o-pano",
        condicao: etapaFeita("sino-da-vila", "achar-pista-varal"),
        linhas: [
          "Ja viu o retalho de pano no varal?",
          "Pano de capuz de goblin. A trilha do leste leva pra la.",
        ],
      },
      {
        id: "padrao",
        linhas: [
          "Voce chegou bem na hora, heroi.",
          "O sino da vila sumiu essa noite.",
          "Sem ele ninguem consegue dormir.",
          "Procure pistas aqui na vila antes de ir.",
        ],
        efeito: () => concluirEtapa("sino-da-vila", "falar-vovo"),
      },
    ],
  },
  ferreiro: {
    quem: "Ferreiro Brando",
    variantes: [
      {
        id: "padrao",
        linhas: [
          "Cortaram a corda do sino. Nao arrebentou.",
          "Foi mao pequena. Mao de goblin.",
          "Olha o varal ali atras, tem um pano estranho.",
        ],
      },
    ],
  },
  menina: {
    quem: "Nina",
    variantes: [
      {
        id: "padrao",
        linhas: [
          "Eu vi um bichinho verde correndo!",
          "Ele tinha orelha grande e chapeu pontudo.",
          "Foi pra floresta. Eu tenho medo de la.",
        ],
      },
    ],
  },
  pescador: {
    quem: "Seu Fagundes",
    variantes: [
      {
        id: "de-noite-na-fogueira",
        condicao: noPeriodo("por-do-sol", "noite", "madrugada"),
        linhas: [
          "As estrelas ficam bonitas daqui, olhando o fogo.",
          "Amanha cedo eu volto pro rio. Os peixes nao esperam.",
        ],
        efeito: () => concluirEtapa("peixes-sumindo", "ouvir-fagundes"),
      },
      {
        id: "padrao",
        linhas: [
          "Os peixes tao sumindo do rio, menino.",
          "Quando voce voltar, a gente pesca junto.",
        ],
        efeito: () => concluirEtapa("peixes-sumindo", "ouvir-fagundes"),
      },
    ],
  },
  mercador: {
    quem: "Seu Cominho",
    variantes: [
      {
        id: "padrao",
        linhas: ["Fruta fresca, heroi! Hoje nao, ne.", "Vai atras do sino primeiro."],
      },
    ],
  },
  menino: {
    quem: "Tiao",
    variantes: [
      {
        id: "padrao",
        linhas: ["Meu pai falou pra eu nao sair de casa.", "Mas eu vi umas pegadas ali no varal!"],
      },
    ],
  },
  guarda: {
    quem: "Guarda Bolota",
    variantes: [
      {
        id: "padrao",
        linhas: [
          "A trilha do leste vai pra Floresta dos Sussurros.",
          "Se for pra la, va com cuidado.",
        ],
        escolhas: [
          {
            texto: "Vou com cuidado, prometo",
            efeito: () => mudarAfinidade("guarda", 1),
            resposta: ["Bom saber disso.", "Boa sorte, heroi."],
          },
          {
            texto: "Vou dar um jeito, relaxa",
            resposta: ["Bolota so balanca a cabeca."],
          },
        ],
      },
    ],
  },
  padeira: {
    quem: "Dona Farinha",
    variantes: [
      {
        id: "padrao",
        linhas: ["Leva um biscoito, menino.", "Voce ganhou 1 moeda de ouro!"],
      },
    ],
  },
  varal: {
    quem: "O varal",
    variantes: [
      {
        id: "padrao",
        linhas: [
          "Tem um retalho de pano cinza preso no arame.",
          "E de um capuz pontudo. Capuz de goblin.",
        ],
        escolhas: [
          {
            texto: "Examinar de perto",
            efeito: () => {
              guardar("pano-goblin");
              concluirEtapa("sino-da-vila", "achar-pista-varal");
            },
            resposta: ["Voce guarda o retalho.", "Definitivamente e goblin."],
          },
          {
            texto: "Deixar ai, nao e hora",
            resposta: ["Voce decide seguir em frente."],
          },
        ],
      },
    ],
  },
  "poste-sino": {
    quem: "O poste do sino",
    variantes: [
      {
        id: "padrao",
        linhas: ["So sobrou um pedaco de corda cortada.", "Cortada, nao arrebentada."],
      },
    ],
  },
  poco: {
    quem: "O poco da praca",
    variantes: [
      {
        id: "padrao",
        linhas: ["Voce se debruca e ve seu reflexo la no fundo.", "Nada de sino aqui."],
      },
    ],
  },
  barraca: {
    quem: "A barraca da feira",
    variantes: [{ id: "padrao", linhas: ["Frutas, pao e um monte de coisa colorida."] }],
  },
  sino: {
    quem: "O poste do sino",
    variantes: [
      {
        id: "padrao",
        linhas: ["So sobrou um pedaco de corda cortada.", "Balancando no vento."],
      },
    ],
  },
  bau: {
    quem: "Um bau",
    variantes: [
      {
        id: "padrao",
        linhas: ["Vazio. So teia de aranha e uma moeda perdida.", "Voce ganhou 1 moeda de ouro!"],
      },
    ],
  },
  placa: {
    quem: "Uma placa de madeira",
    variantes: [
      {
        id: "padrao",
        linhas: ["Floresta dos Sussurros ->", "Cuidado com quem fala sem ter boca."],
      },
    ],
  },
};
