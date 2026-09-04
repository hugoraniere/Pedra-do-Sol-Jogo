/** O motor de condicoes: buff e debuff sao a MESMA coisa, so uma lista de
 *  `Condicao` com duracao em turnos. Logica pura, sem Phaser — quem desenha
 *  e `Provador.ts`, quem decide o que uma marca aplica e `sistemas/marcas.ts`.
 *
 * Ver docs/mundo-que-reage.md, secao 3, para a lista inteira e o porque de
 * cada uma. Esta fase so da corpo a duas: MOLHADO e CONGELADO — o resto do
 * union ja existe como TIPO (para quem for adicionar depois nao precisar
 * renomear nada), mas so essas duas tem comportamento de verdade.
 */

export type IdCondicao =
  | "molhado" | "queimando" | "congelado" | "preso" | "assustado"
  | "atraido" | "caido" | "tonto"
  | "abencoado" | "rapido" | "protegido" | "escondido" | "iluminado";

export type Condicao = { id: IdCondicao; turnosRestantes: number };

/** O que acontece no INICIO do turno de quem carrega a condicao. So duas
 *  formas existem por enquanto: perder o turno inteiro (congelado), ou tomar
 *  dano (fase 4, quando queimando ganhar corpo). O tipo ja cobre as duas para
 *  ninguem precisar mudar a assinatura de `passarTurno` depois. */
export type EfeitoDeTurno = { id: IdCondicao; tipo: "pulaTurno" | "dano" };

/** So estas produzem efeito ao virar o turno. As outras (preso, assustado...)
 *  mudam o que a criatura FAZ no proprio turno (isso e trabalho de
 *  sistemas/criatura.ts, nao deste arquivo) ou mudam uma conta pontual
 *  (abencoado no proximo dado), nunca disparam algo sozinhas ao comecar o turno. */
const EFEITO_DE_INICIO: Partial<Record<IdCondicao, EfeitoDeTurno["tipo"]>> = {
  congelado: "pulaTurno",
};

/** Chamado no INICIO do turno de quem carrega a lista. Cada condicao perde 1
 *  turno; a que chega a 0 sai da lista. O efeito conta enquanto ela ainda
 *  estava valendo NESTE turno (antes de decrementar) — 1 turno de duracao
 *  pula exatamente 1 turno, nao zero. */
export function passarTurno(atuais: Condicao[]): { restantes: Condicao[]; efeitos: EfeitoDeTurno[] } {
  const efeitos: EfeitoDeTurno[] = [];
  const restantes: Condicao[] = [];
  for (const c of atuais) {
    const tipo = EFEITO_DE_INICIO[c.id];
    if (tipo) efeitos.push({ id: c.id, tipo });
    const turnosRestantes = c.turnosRestantes - 1;
    if (turnosRestantes > 0) restantes.push({ id: c.id, turnosRestantes });
  }
  return { restantes, efeitos };
}

/** Aplica uma condicao nova. NUNCA empilha (decisao de
 *  docs/mundo-que-reage.md, secao 11.2): duas QUEIMANDO viram uma so, com a
 *  duracao maior das duas — nunca um "queimando por 6 turnos" por ter levado
 *  fogo duas vezes. Empilhar faria o jogador ter que fazer conta. */
export function aplicar(atuais: Condicao[], nova: Condicao): Condicao[] {
  const existe = atuais.find((c) => c.id === nova.id);
  if (!existe) return [...atuais, nova];
  if (nova.turnosRestantes <= existe.turnosRestantes) return atuais;
  return atuais.map((c) => (c.id === nova.id ? nova : c));
}

/** Atalho de leitura, usado pela tabela de reacoes: esta condicao esta ativa
 *  agora? Nao muda nada, so pergunta. */
export function tem(atuais: Condicao[], id: IdCondicao): boolean {
  return atuais.some((c) => c.id === id);
}
