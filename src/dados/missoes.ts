/** O catalogo de missoes do jogo: principais e secundarias, em etapas. So
 *  dado, sem logica de jogo — no espirito de dados/sons.ts. Quem le e marca
 *  progresso e sistemas/missoes.ts.
 *
 *  Pensado pra servir as 3 aventuras: uma aventura nova so acrescenta
 *  entradas aqui, nunca muda a maquina por tras. Por ora so tem conteudo do
 *  Ato 1 — a missao do sino da Vila Semente, ja esbocada nas falas de hoje. */

export type EtapaDeMissao = { id: string; descricao: string };

export type Missao = {
  titulo: string;
  tipo: "principal" | "secundaria";
  /** id do NPC que da a missao — o mesmo id de dialogos.ts/npcs.ts */
  quemDa: string;
  /** em ordem narrativa. `etapas[0]` concluida e o que conta como "aceita". */
  etapas: EtapaDeMissao[];
};

export const MISSOES: Record<string, Missao> = {
  "primeiros-passos": {
    titulo: "Primeiros passos",
    tipo: "principal",
    // sem NPC: comeca sozinha ao nascer na Trilha de Chegada. "nenhum" e
    // proposital, pra nao virar um id de NPC falso (ver dados/dialogos.ts).
    quemDa: "nenhum",
    etapas: [
      { id: "ler-a-placa", descricao: "Ler a placa na Trilha de Chegada" },
      { id: "derrotar-o-goblin", descricao: "Derrotar o goblin que atravessa o caminho" },
      { id: "chegar-na-vila", descricao: "Seguir a trilha ate a Vila Semente" },
    ],
  },
  "sino-da-vila": {
    titulo: "O sino sumiu",
    tipo: "principal",
    quemDa: "vovo",
    etapas: [
      { id: "falar-vovo", descricao: "Descobrir o que aconteceu com o sino" },
      { id: "achar-pista-varal", descricao: "Examinar o varal atras da ferraria" },
      { id: "seguir-para-floresta", descricao: "Seguir a trilha do leste ate a Floresta dos Sussurros" },
    ],
  },
  "peixes-sumindo": {
    titulo: "Os peixes estao sumindo",
    tipo: "secundaria",
    quemDa: "pescador",
    etapas: [
      { id: "ouvir-fagundes", descricao: "Seu Fagundes prometeu pescar junto quando voce voltar" },
    ],
  },
};
