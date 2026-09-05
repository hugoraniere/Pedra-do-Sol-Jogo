/** Quem sao os moradores da Vila Semente: idade, papel, historia, relacoes e
 *  afinidades. So dado, sem logica de jogo — no espirito de dados/sons.ts.
 *
 *  Chaveado pelo mesmo id que ja existe em mapas.ts (`pessoas[].quem`) e em
 *  dialogos.ts (`DIALOGOS`), entao um NPC novo so precisa de uma entrada aqui
 *  a mais, nunca um id novo.
 *
 *  So Vovo Aurora e citada em docs/referencia/sistema-do-rpg-de-mesa.md; o
 *  resto e invencao livre da vila, sem contradizer nada de la. */

export type RelacaoNpc = { quem: string; tipo: string; descricao: string };

export type Npc = {
  idade: string;
  papel: string;
  personalidade: string;
  historia: string[];
  relacoes: RelacaoNpc[];
  afinidades: { gosta: string[]; naoGosta: string[] };
};

export const NPCS: Record<string, Npc> = {
  vovo: {
    idade: "72 anos",
    papel: "A mais velha da vila, e quem cuida de quem adoece",
    personalidade: "Calma, direta, nunca levanta a voz — e nunca precisa",
    historia: [
      "Vovo Aurora viu a Vila Semente inteira nascer casa por casa. Foi ela quem " +
        "deu nome ao sino da praca, e foi ela quem ensinou metade dos adultos de " +
        "hoje a ler, sentados no chao da propria sala.",
      "Guarda ervas secando na janela e um caderno cheio de remedio simples. " +
        "Nao cobra nada por cuidar de ninguem, e ninguem se atreve a pagar.",
      "Perdeu a propria avo pra Pedra do Sol se partir, e por isso e a primeira " +
        "a acordar o heroi quando alguma coisa da vila desaparece.",
    ],
    relacoes: [
      { quem: "padeira", tipo: "amizade antiga", descricao: "Trocam pao por remedio ha decadas, sem nunca contar quem deve o que" },
      { quem: "menina", tipo: "afeto", descricao: "Nina passa na casa dela quase todo dia so pra contar o que viu" },
    ],
    afinidades: {
      gosta: ["cha de ervas", "visita sem hora marcada", "silencio da manha cedo"],
      naoGosta: ["gente que esconde um machucado", "pressa"],
    },
  },

  ferreiro: {
    idade: "44 anos",
    papel: "Ferreiro da vila",
    personalidade: "Braco forte, jeito manso — o nome combina mais do que parece",
    historia: [
      "Brando aprendeu o oficio com o pai, na mesma forja que usa hoje. Nunca " +
        "quis sair da vila, mesmo quando cidades maiores mandaram chamar.",
      "Vive com o filho, Tiao, desde que a mae do menino morreu numa viagem de " +
        "comercio — e por isso proibe o filho de sair sozinho, mesmo sabendo " +
        "que a ordem nunca pega.",
      "Cada ferramenta que sai da forja dele tem uma marca pequena embutida no " +
        "cabo: uma bigorna, quase invisivel, so pra quem procura.",
    ],
    relacoes: [
      { quem: "menino", tipo: "pai e filho", descricao: "Tiao e o orgulho dele, mesmo quando o menino desobedece" },
      { quem: "guarda", tipo: "respeito profissional", descricao: "Afia toda arma do Guarda Bolota de graca, sem nunca ser pedido duas vezes" },
    ],
    afinidades: {
      gosta: ["metal ainda quente", "silencio de quem trabalha ao lado", "pao da Dona Farinha"],
      naoGosta: ["gente que mexe na forja sem avisar", "promessa vazia"],
    },
  },

  menina: {
    idade: "8 anos",
    papel: "Filha do mercador, terror simpatico da vila",
    personalidade: "Sem medo de nada — o que preocupa todo mundo, menos ela",
    historia: [
      "Nina e filha de Seu Cominho e cresceu no meio da barraca, contando moeda " +
        "antes de saber contar carneirinho.",
      "Foi ela quem viu o bichinho verde correndo com o sino roubado, e conta " +
        "essa historia pra qualquer um que pare pra ouvir, cada vez com um " +
        "detalhe novo.",
      "Melhor amiga de Tiao desde sempre; os dois se metem em mais confusao " +
        "juntos do que qualquer um dos dois sozinho.",
    ],
    relacoes: [
      { quem: "mercador", tipo: "pai e filha", descricao: "Ele se preocupa alto, ela promete cuidado e esquece na mesma hora" },
      { quem: "menino", tipo: "melhores amigos", descricao: "Onde tem Nina, Tiao aparece dez passos atras" },
    ],
    afinidades: {
      gosta: ["bicho estranho", "historia exagerada", "desafio"],
      naoGosta: ["ficar parada", "adulto falando baixinho por perto"],
    },
  },

  pescador: {
    idade: "58 anos",
    papel: "Pescador do rio da vila",
    personalidade: "Paciente do jeito que so quem pesca consegue ser",
    historia: [
      "Seu Fagundes pesca no mesmo trecho de rio desde que era mais novo que " +
        "Tiao. Diz que conhece cada peixe pelo nome, o que ninguem confirma.",
      "Nas noites claras, leva o banco de pescar ate a fogueira da praca e fica " +
        "ali quieto, olhando a brasa — e e ele quem sempre deixa a fogueira " +
        "acesa ate tarde.",
      "Prometeu ensinar Tiao a pescar assim que o pai do menino deixar, e o " +
        "menino ja sabe amarrar dois nos so de tanto ver.",
    ],
    relacoes: [
      { quem: "guarda", tipo: "amizade quieta", descricao: "Os dois vigiam a vila de pontas opostas e trocam poucas palavras, cheias de sentido" },
      { quem: "menino", tipo: "quase mestre", descricao: "Promessa de ensinar a pescar, ainda por cumprir" },
    ],
    afinidades: {
      gosta: ["manha de neblina no rio", "brasa da fogueira", "peixe grande de historia maior"],
      naoGosta: ["barulho no rio", "peixe sumindo sem explicacao"],
    },
  },

  mercador: {
    idade: "39 anos",
    papel: "Dono da barraca da feira",
    personalidade: "Fala pelos cotovelos, vende ate o que nao tem",
    historia: [
      "Seu Cominho chegou na Vila Semente de mercador ambulante e nunca mais " +
        "foi embora — a barraca virou fixa antes mesmo da filha nascer.",
      "Cria Nina sozinho e vive num sobressalto danado, porque a menina nao " +
        "tem medo de nada e ele tem medo por dois.",
      "Guarda rivalidade de brincadeira com Dona Farinha: os dois juram vender " +
        "mais que o outro, e nenhum admite que trocam receita escondido.",
    ],
    relacoes: [
      { quem: "menina", tipo: "pai e filha", descricao: "O maior orgulho e o maior susto da vida dele, na mesma pessoa" },
      { quem: "padeira", tipo: "rivalidade de brincadeira", descricao: "Competem em voz alta e se ajudam em segredo" },
    ],
    afinidades: {
      gosta: ["boa historia pra vender junto", "moeda brilhando", "regatear"],
      naoGosta: ["cliente com pressa", "fruta murcha na banca"],
    },
  },

  menino: {
    idade: "9 anos",
    papel: "Filho do ferreiro, sempre onde nao devia",
    personalidade: "Sonhador, cheio de plano — e de desculpa pra sair de casa",
    historia: [
      "Tiao mora com o pai desde que a mae morreu numa viagem, e ouve o mesmo " +
        "aviso todo dia: nao sair sozinho. Sai mesmo assim.",
      "Sonha em pescar com Seu Fagundes e martelar metal que nem o pai, nessa " +
        "ordem — ainda nao decidiu qual profissao rouba primeiro.",
      "Foi ele quem viu pegadas estranhas perto do varal, na mesma noite que " +
        "o sino sumiu, e jura pra Nina que nao contou pro pai.",
    ],
    relacoes: [
      { quem: "ferreiro", tipo: "pai e filho", descricao: "Tiao quer deixar o pai orgulhoso sem nunca fazer o que ele pede" },
      { quem: "menina", tipo: "melhores amigos", descricao: "A ideia geralmente e da Nina; a culpa geralmente sobra pra ele" },
    ],
    afinidades: {
      gosta: ["pegada misteriosa", "historia de heroi", "biscoito de graca"],
      naoGosta: ["ficar em casa", "ser tratado como crianca pequena"],
    },
  },

  guarda: {
    idade: "36 anos",
    papel: "Guarda da vila, vigia da trilha do leste",
    personalidade: "Serio no posto, mole com as criancas — quando ninguem ve",
    historia: [
      "Bolota vigia a trilha que leva a Floresta dos Sussurros desde antes de " +
        "qualquer crianca da vila nascer. Nunca precisou usar a lanca pra " +
        "valer.",
      "Finge nao ver quando Tiao escapa de casa, contanto que o menino nao " +
        "passe da cerca — e finge nao ver Nina tambem, o que e bem mais " +
        "dificil.",
      "Faz a ronda de noite tambem, porque um guarda que so vigia de dia nao " +
        "e guarda de nada.",
    ],
    relacoes: [
      { quem: "pescador", tipo: "amizade quieta", descricao: "Trocam aceno de longe quase todo dia, e isso basta pros dois" },
      { quem: "ferreiro", tipo: "confianca profissional", descricao: "So confia arma afiada nas maos do ferreiro" },
    ],
    afinidades: {
      gosta: ["trilha silenciosa", "ferramenta bem cuidada", "biscoito da padeira, mesmo sem admitir"],
      naoGosta: ["barulho de noite sem explicacao", "porta destrancada"],
    },
  },

  padeira: {
    idade: "51 anos",
    papel: "Padeira da vila",
    personalidade: "Mae de todo mundo, mesmo de quem ja e adulto",
    historia: [
      "Dona Farinha acorda antes do sol pra tirar o primeiro pao do forno, e " +
        "ninguem na vila lembra de um dia em que faltou biscoito pra quem " +
        "passasse com fome.",
      "Troca pao por remedio com Vovo Aurora ha tanto tempo que nenhuma das " +
        "duas lembra quem comecou.",
      "Reserva sempre um biscoito extra pra Nina e Tiao, com a desculpa de que " +
        "'sobrou', o que nunca sobra por acaso.",
    ],
    relacoes: [
      { quem: "vovo", tipo: "amizade antiga", descricao: "Pao por remedio, ha decadas, sem nunca fechar conta" },
      { quem: "mercador", tipo: "rivalidade de brincadeira", descricao: "Jura vender mais que Seu Cominho e nunca vendeu menos por isso" },
    ],
    afinidades: {
      gosta: ["forno quente de madrugada", "gente com fome", "uma boa disputa de venda"],
      naoGosta: ["pao desperdicado", "crianca de barriga vazia"],
    },
  },
};
