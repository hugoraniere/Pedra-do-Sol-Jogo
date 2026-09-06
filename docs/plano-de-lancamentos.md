# Plano de lançamentos

Isto é o **como e quando fechamos uma versão**, não o **o que fazer** — o
"o que" continua em `docs/05-roadmap.md`, fase por fase. Este documento só
existe porque o roadmap nunca teve numeração de versão nem critério de "isto
está pronto pra empacotar", e as duas coisas ficaram implícitas até agora.

**Público: interno.** Nenhuma versão daqui vai pro jogador ainda — o jogo só
sai de verdade no fim da Fase 5 (`docs/05-roadmap.md`). Até lá, "lançar uma
versão" quer dizer "fechar um corte que builda limpo, joga de ponta a ponta e
o Hugo pode revisar", não publicar em lugar nenhum.

---

## 1. Esquema de versão

**Major.Minor = a Fase do roadmap, direto.** Fase 1 → versão `1.0.x`. Fase
1.2 → `1.2.x`. Fase 1.5 → `1.5.x`. Fase 2 → `2.0.x`. Não inventa número novo:
é o mesmo rótulo que `docs/05-roadmap.md` já usa, só com um `.patch` colado
no fim.

**Patch = corte interno dentro da fase**, decidido caso a caso (granularidade
fina — ver seção 2). Cada corte fechado soma 1: `1.0.0`, `1.0.1`, `1.0.2`...

**`package.json` (`version`) é a fonte de verdade do número atual.** Hoje diz
`0.1.0`, que é o default do `npm init` — não seguia nenhum esquema ainda.
A partir do primeiro corte fechado por este plano, o campo passa a mudar
junto com cada entrega, e vale conferir ali antes de perguntar "em que
versão estamos".

**Isto não é o versionamento público.** Quando o jogo publicar de verdade
(fim da Fase 5), a primeira versão pro jogador é livre pra começar do zero
(`1.0.0` público, por exemplo) — não precisa herdar o número interno que
esse dia estiver.

---

## 2. Granularidade: cortes menores dentro de cada fase

Decisão do Hugo: prefere mais lançamentos internos pequenos a poucos
grandes. Regra prática:

- Um corte fecha quando um **pedaço jogável e coerente** termina — não
  precisa ser um item inteiro da lista do roadmap, pode ser metade de um,
  desde que dê pra jogar aquele pedaço sem erro.
- Um corte **não** fecha só porque "parou de dar tempo" no meio de uma
  tarefa — nesse caso a tarefa continua em `FRENTES.md` como "Acontecendo
  agora", sem virar versão.
- Cada corte fechado ganha uma linha no changelog (seção 5) e um bump no
  `package.json`.

---

## 3. Checklist pra fechar qualquer corte

Isto substitui "acho que está pronto" por uma lista fixa. Nenhuma versão
fecha sem os itens abaixo:

- [x] `npm run build` limpo (já roda `verificar` embutido)
- [x] `npm run contraste` sem problema
- [x] `npm run auditar` sem problema (fechado em 2026-09-06, ver seção 4)
- [ ] `npm run conferir` sem problema (25 combinações de raça/classe) — **único
      bloqueador restante**, ver seção 4
- [ ] Jogo abre e joga o pedaço em questão sem erro no console
- [ ] `ESTADO-DO-JOGO.md` reflete o que o código faz de verdade (não o que
      foi decidido em papel e ainda não chegou)
- [ ] `FRENTES.md`: toda entrada relacionada ao corte moveu de "Acontecendo
      agora" pra "Entregue", com o commit
- [ ] Nenhuma worktree com trabalho real não-mergeado que pertença a este
      corte (ver seção 4)

---

## 4. O que falta pra fechar o **próximo** corte

**Bloqueadores restantes (têm que resolver antes de qualquer corte da Fase 1 fechar):**

1. ~~Merge de `ambiente/combate` em `principal`~~ — **FEITO em 2026-09-05**
   (`d41aac6`). Vida numérica de verdade, dano por dado, HUD de rodapé —
   os três já estão em `principal`. Único conflito real foi em
   `sistemas/estado.ts`: duas frentes tinham corrigido o mesmo bug (Anão com
   3 corações em vez de 4) por caminhos diferentes; resolvido mantendo
   `coracoesMaxDoHeroi()` (a versão que também conta Vitalidade). Ver
   "Achados durante a execução" abaixo — teve uma colisão com uma sessão
   concorrente no meio do caminho, contornada sem perder nada.
2. ~~`npm run auditar` quebrado~~ — **RESOLVIDO em 2026-09-06** (o crash da
   luz da fogueira já tinha sido corrigido por outra sessão entre 09-05 e
   09-06). Rodando de novo achou 4 sobreposições reais e novas, na janela de
   MOCHILA (rótulos ROUPA/ARMADURA/ACESSÓRIO/ARMA por baixo da zona de toque
   do slot — os dois não compartilhavam `Container`, então a checagem que
   ignora "rótulo dentro do próprio botão" não reconhecia o caso). Corrigido
   em `Ficha.ts` (`09601ee`) agrupando rótulo e zona de toque no mesmo
   Container. `npm run auditar` fecha zerado agora.
3. **`npm run conferir` continua quebrado** (as 25 combinações de raça/
   classe, "sem pontos de encaixe"). Confirmado que não foi nenhum merge —
   é o estudo de escala do herói que ficou parado em `stash@{0}` (ver
   "Achados durante a execução"). **Esse stash agora está bem desatualizado**
   (mais de 600 linhas de diff contra o `HEAD` atual, incluindo um `Ficha.ts`
   de antes da reforma de equipamento) — resgatar ele hoje tem risco real de
   repetir o mesmo tipo de conflito silencioso do `coracoesMax`. Precisa de
   uma decisão do Hugo (ver seção 6) antes de mexer.
4. **`arte/manifesto.json` sem `hospital.png`** — rodar `npm run arte`
   quando `arte/` não estiver em uso por outra frente.

**Decisões já tomadas nesta conversa, faltando só refletir no roadmap/código:**

5. Combate fica por turnos — documentado (`CLAUDE.md`, `docs/
   modelo-de-combate.md`, `docs/05-roadmap.md`). Sem trabalho de código
   pendente por causa disso.
6. Casa de Cura → Casa da Vovó Aurora, Hospital fica com toda mecânica de
   cura/resgate — documentado. **Falta implementar:** hoje nenhum dos dois
   prédios tem interior jogável ainda (`docs/14-casa-de-cura.md` é esboço,
   nunca implementado) — quando alguém for construir o interior, já nasce
   sem a mecânica de cura.
7. ~~"O modo de alvo" precisa ser redesenhado pro turno~~ — ver decisão
   registrada em `docs/05-roadmap.md` (Fase 1) e `docs/modelo-de-combate.md`.
8. ~~Corações cheios por comer/dormir + Anão nascer com 4~~ — a parte do
   Anão **já resolvida** pelo merge do item 1 (`coracoesMaxDoHeroi()` conta
   raça, que já inclui o 4 dele). Falta só comer/dormir encherem vida.

---

## Achados durante a execução (2026-09-05)

- **Colisão com sessão concorrente, contornada sem perder nada:** enquanto
  este plano era escrito, uma sessão paralela (também na pasta `principal`)
  terminou e commitou o modo Depurador (`6c50057`) exatamente durante a
  janela em que eu tinha guardado o trabalho em andamento com
  `git stash push -u` pra poder fazer o merge de `ambiente/combate` numa
  árvore limpa. Nada se perdeu: o merge simplesmente passou a ter
  `6c50057` como base (o Depurador já commitado), e o resto do que eu tinha
  guardado no stash (arte de armadura/escala do herói em andamento, mais
  estes documentos) foi recuperado depois **arquivo por arquivo**, não com
  `stash pop` direto — popar tudo de uma vez teria reaplicado uma versão
  antiga do Depurador por cima da versão completa que a outra sessão já
  tinha commitado.
- **O stash não foi descartado.** `git stash list` ainda tem
  `stash@{0}` com a arte de armadura/estudo de escala do herói em
  andamento (`arte/armadura.py`, `editor-heroi.html`,
  `estudo-heroi-escala-2x.png`, mudanças em `config.ts`/`conteudo.ts`/
  `Boot.ts`/`Combate.ts`/`Ficha.ts`/`Mundo.ts` e mais). Só os 5 arquivos de
  documentação deste plano foram recuperados de lá; **quem estiver com essa
  frente de arte em andamento precisa saber que o trabalho está em
  `stash@{0}`, não perdido, e recuperar com `git stash show -p stash@{0} --
  -- <arquivo>` ou `git checkout stash@{0} -- <arquivo>` arquivo por
  arquivo** (não `git stash pop` direto, porque `estado.ts`/`Combate.ts`/
  `Ficha.ts` já mudaram de novo com o merge de `ambiente/combate` e um pop
  cru pode reintroduzir o mesmo tipo de conflito silencioso que aconteceu
  com `coracoesMax`).
- **`npm run conferir` quebrado é dessa mesma frente de arte**, não do
  merge — confirmado que `encaixes.json` não mudou entre `principal` e
  `ambiente/combate`.

## 5. Changelog

Ainda não existe nenhum corte fechado por este esquema. A primeira linha
entra aqui quando o `1.0.1` (ou o que for decidido) fechar de verdade — não
antes.

---

## 6. Estado das decisões desta rodada

- ~~Fazer o merge de `ambiente/combate` agora, ou esperar?~~ → feito (ver
  seção 4, item 1).
- ~~Fechar as worktrees `ficha`/`pistas`/`sprites`~~ → em andamento, ver
  `FRENTES.md` pro resultado.
- ~~O modo de alvo por turno~~ → decidido, ver `docs/05-roadmap.md` (Fase 1).

**Ainda aberto, 2026-09-06:** só o bloqueador 3 da seção 4 (`conferir`
quebrado pelo estudo de escala do herói, parado em `stash@{0}` e já
desatualizado). Três caminhos, aguardando o Hugo escolher:
- **Abandonar o stash** e resolver `conferir` do zero: reconciliar
  `encaixes.json`/`config.ts` com a arte que existe HOJE (sem tentar
  recuperar o estudo de escala 2x).
- **Resgatar o stash com cuidado**, arquivo por arquivo, reconferindo cada
  um contra o `Ficha.ts`/`config.ts` atuais antes de aplicar (mais lento,
  preserva o trabalho de escala do herói).
- **Deixar como está por enquanto** e fechar o primeiro corte de versão sem
  `conferir` verde, registrando a exceção explicitamente no changelog em vez
  de esperar.
