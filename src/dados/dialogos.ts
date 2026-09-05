/** Falas dos personagens da vila. Frases curtas, letra grande, uma ideia por tela. */

export type Fala = { quem: string; linhas: string[] };

export const DIALOGOS: Record<string, Fala> = {
  vovo: {
    quem: "Vovo Aurora",
    linhas: [
      "Voce chegou bem na hora, heroi.",
      "O sino da vila sumiu essa noite.",
      "Sem ele ninguem consegue dormir.",
      "Procure pistas aqui na vila antes de ir.",
    ],
  },
  ferreiro: {
    quem: "Ferreiro Brando",
    linhas: [
      "Cortaram a corda do sino. Nao arrebentou.",
      "Foi mao pequena. Mao de goblin.",
      "Olha o varal ali atras, tem um pano estranho.",
    ],
  },
  menina: {
    quem: "Nina",
    linhas: [
      "Eu vi um bichinho verde correndo!",
      "Ele tinha orelha grande e chapeu pontudo.",
      "Foi pra floresta. Eu tenho medo de la.",
    ],
  },
  pescador: {
    quem: "Seu Fagundes",
    linhas: [
      "Os peixes tao sumindo do rio, menino.",
      "Quando voce voltar, a gente pesca junto.",
    ],
  },
  mercador: {
    quem: "Seu Cominho",
    linhas: ["Fruta fresca, heroi! Hoje nao, ne.", "Vai atras do sino primeiro."],
  },
  menino: {
    quem: "Tiao",
    linhas: ["Meu pai falou pra eu nao sair de casa.", "Mas eu vi umas pegadas ali no varal!"],
  },
  guarda: {
    quem: "Guarda Bolota",
    linhas: [
      "A trilha do leste vai pra Floresta dos Sussurros.",
      "Se for pra la, va com cuidado.",
    ],
  },
  padeira: {
    quem: "Dona Farinha",
    linhas: ["Leva um biscoito, menino.", "Voce ganhou 1 moeda de ouro!"],
  },
  varal: {
    quem: "O varal",
    linhas: [
      "Tem um retalho de pano cinza preso no arame.",
      "E de um capuz pontudo. Capuz de goblin.",
    ],
  },
  "poste-sino": {
    quem: "O poste do sino",
    linhas: ["So sobrou um pedaco de corda cortada.", "Cortada, nao arrebentada."],
  },
  poco: {
    quem: "O poco da praca",
    linhas: ["Voce se debruca e ve seu reflexo la no fundo.", "Nada de sino aqui."],
  },
  barraca: {
    quem: "A barraca da feira",
    linhas: ["Frutas, pao e um monte de coisa colorida."],
  },
  sino: {
    quem: "O poste do sino",
    linhas: [
      "So sobrou um pedaco de corda cortada.",
      "Balancando no vento.",
    ],
  },
  fogueira: {
    quem: "A fogueira da praca",
    linhas: ["Ainda esta quentinha. Alguem passou a noite acordado aqui."],
  },
  bau: {
    quem: "Um bau",
    linhas: ["Vazio. So teia de aranha e uma moeda perdida.", "Voce ganhou 1 moeda de ouro!"],
  },
  placa: {
    quem: "Uma placa de madeira",
    linhas: ["Floresta dos Sussurros ->", "Cuidado com quem fala sem ter boca."],
  },
};
