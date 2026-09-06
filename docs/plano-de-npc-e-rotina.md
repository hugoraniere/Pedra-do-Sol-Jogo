**As Fases 1-3 deste plano estao FEITAS e testadas** (ver `FRENTES.md`,
entrada de 2026-09-05, pros commits de cada fase). A Fase 4 e este proprio
documento — o checklist pra NPC novo, na secao "Fase 4" abaixo, e o que
fica valendo daqui pra frente. Teste ao vivo no navegador ficou pendente
num momento do trabalho (dev server compartilhado com outra frente mid-
edit, ver FRENTES.md/Achados) — vale conferir numa sessao de jogo normal se
ainda nao foi feito. O texto abaixo e o plano ORIGINAL, com a Fase 3 ja
revisada durante a implementacao (a Trilha da Floresta nasceu no meio do
caminho) — mantido como registro de decisao.

# Rotina de NPC com personalidade: entrar em casa, atividade visivel, passeio

## Contexto

O Hugo quer que os NPCs da Vila Semente vivam o dia de verdade: ao anoitecer
"todos entram nas proprias casas (literalmente caminhando)", nao no mesmo
horario um do outro, e cada um com uma atividade que combina com quem ele e —
"alguns trabalham, alguns pescam, alguns passeiam pela praia, pela floresta".
A personalidade de cada um (ja escrita em `src/dados/npcs.ts`) deve ser a
BASE dessas escolhas, e o padrao usado agora deve servir de modelo para
qualquer NPC novo no futuro.

**Isto nao comeca do zero.** O jogo ja tem rotina por periodo do dia (6
periodos, `src/dados/tempo.ts`), com os 8 NPCs nomeados da Vila andando de
verdade (mesmo A* do heroi) entre 2 pontos por periodo
(`src/dados/mapas.ts::Pessoa.rotina`, `src/cenas/Mundo.ts::
atualizarRotinasDeNpc/tracarRotaDoNpc`). O que falta e o que o pedido do Hugo
aponta: ninguem entra fisicamente na propria casa (as criancas somem no ar,
os adultos so param um pouco mais perto), ninguem tem uma POSE de atividade
(todo mundo so anda ou fica parado respirando), e ninguem sai da Vila.

Investigado a fundo antes deste plano (ver "O que ja existe" abaixo) — a
noticia boa: **as tres coisas cabem no mecanismo que ja existe, sem sprite
novo e sem sistema de IA novo.** O trabalho e principalmente conectar peças
que ja estao la.

## O que ja existe (investigado, com arquivo:linha)

- **Os 8 NPCs ja tem casa propria.** `casa-vovo`->Casa de Cura, `casa-pequena`
  (x9)->Casa da Padeira, `casa-grande`->Casa do Mercador (mercador+menina),
  `ferraria`->Ferraria (ferreiro+menino), `casa-pequena` (x27)->Casa do Guarda
  (`src/dados/mapas.ts:427-429`, comentario confirma "o unico dos 8 NPCs sem
  casa atribuida antes desta"). **Uma casa sobrava vazia:** `casa-pequena-interior`
  (x23,y16 na Vila), `lugar: "Casa da Vila"` (`mapas.ts:399-425`), `pessoas: []`
  — nenhum dos 8 tinha rotina apontando pra la, e o pescador nao tinha casa
  nenhuma na rotina (so rio de dia, fogueira de noite). **Decidido com o
  Hugo: e a casa dele** (ver "Decidido com o Hugo" abaixo).
- **Trocar de mapa e reconstrucao total, nao incremental.**
  `Mundo.ts:1502` (`trocarDeMapa`)/`1172` (`acordarNaFogueira`) chamam
  `scene.restart()`; `create()` (`Mundo.ts:237`) le `MAPAS[estado().cena]` do
  zero e reconstroi `this.npcs` inteiro (`Mundo.ts:412-434`) so a partir do
  `pessoas` daquele mapa. **Nao existe registro global de "onde o NPC esta
  agora"** em `estado.ts` — so o dado estatico `Pessoa.x/y/rotina` por mapa.
- **Por isso, um NPC pode "visitar" outro mapa sem sistema novo:** basta o
  mesmo `quem` aparecer no `pessoas` de dois mapas, cada um com `rotina`
  cobrindo o periodo em que ele NAO esta la como `"escondido"`. Nao ha
  checagem de unicidade de id entre mapas (`ferramentas/verificar.mjs:130-136`
  so confere se cada `quem` tem entrada em `DIALOGOS`) — e seguro. A visita e
  sempre um "estava/nao estava" ao trocar de mapa, nunca visto em transito
  (mesma limitacao que ja existe pro proprio sumico das criancas hoje).
- **Toda pose de atividade ja esta desenhada e ja tem animacao registrada,
  sem nunca ser tocada.** `arte/gente.py` da a cada um dos 11 NPCs nomeados
  (nao so o heroi) a folha completa de 11 colunas — incluindo `conjura`
  (braco erguido, `arte/pessoa.py:443-445`) e `ataque` (braco esticado pra
  frente, `arte/pessoa.py:446-462`). `criarAnimacoes()`
  (`src/sistemas/heroi.ts:87-148`) ja cria `npc-<sprite>-conjura-<dir>` e
  `npc-<sprite>-ataque-<dir>` pra TODO NPC do mapa (chamada em
  `Mundo.ts:238-244`) — sao poses de UM QUADRO SO (`frameRate: 1`), perfeitas
  pra "ficou parado nessa pose o periodo inteiro", sem precisar de arte nova.
  So ninguem jamais da `.play()` nelas fora do heroi (`grep` confirma zero uso
  em `Mundo.ts`).
- **Objetos que ja sugerem oficio, pra posicionar o NPC do lado:** `forja`/
  `bigorna` (ferreiro), `forno-padaria` (padeira), `barraca` (mercador),
  `fogueira` (pescador de noite, ja usa). Nao existe objeto de pesca (vara,
  cais) nem nada perto d'agua alem do proprio pescador.
- **`RotinaDeNpc` e 1 ponto fixo por periodo** (`mapas.ts:59`,
  `Record<Periodo, {x,y}|"escondido">`) — sem patrulha multi-ponto. Passeio
  cabe nisso de graca: o "ponto do periodo" so precisa estar na praia/trilha
  em vez de na Vila.
- **Dois NPCs com sprite pronto e nunca usado:** `elfa` e `bruxo`
  (`arte/gente.py:82-112`) nao tem bio em `npcs.ts`, nem entrada em
  `mapas.ts`/`dialogos.ts` — arte de sobra, candidata natural pra um NPC
  futuro (talvez o morador da casa vazia acima).
- **Guarda ja e uma excecao deliberada:** rotina identica dia e noite
  (`mapas.ts:240-245`) — nunca entra em casa, bate com a bio ("faz a ronda de
  noite tambem, porque um guarda que so vigia de dia nao e guarda de nada").
  Este plano preserva essa excecao de proposito, nao "conserta".

## Decidido com o Hugo

- **A Casa da Vila (`casa-pequena-interior`) e do pescador.** Fase 1 liga a
  rotina dele a essa casa (entra de madrugada de verdade, sai pro rio de
  manha) em vez de deixar madrugada dele so na fogueira.
- **Guarda estende a ronda a noite** (Fase 3) — unico dos 8 atuais que sai
  da Vila neste plano. A ideia original (Trilha de Chegada) virou, na
  pratica, uma trilha nova de verdade (Trilha da Floresta) — ver a secao da
  Fase 3 abaixo pro motivo e o que foi decidido no meio do caminho. O resto
  do mecanismo de visita fica pronto e documentado (Fase 4) para o proximo
  NPC usar.

## Fases (cada uma com commit e teste proprios, igual ciclo-do-dia/moodles)

### Fase 1 — Entrar em casa de verdade (todos os 8, incluindo as criancas)

Hoje: criancas somem instantaneamente (`Mundo.ts:946-951`, `alvo ===
"escondido"` pula pathfinding); adultos andam ate um ponto perto de casa mas
ficam visiveis parados do lado de fora. O pedido do Hugo e todo mundo andar
ate a PROPRIA PORTA e so ali sumir (entrar de verdade), voltando a aparecer
na porta de manha antes de andar pro ponto do dia (nao popar direto no
trabalho).

**Mudanca de dado:** `RotinaDeNpc`'s valor por periodo ganha uma terceira
forma: `{ x: number; y: number; entra: true }` (o resto continua
`{x,y}` ou `"escondido"`), usada exatamente no periodo em que o NPC ANDA ATE
a porta antes de sumir — o `x,y` e o tile da porta de cada casa (mesmo
`porta` que ja existe em `Saida.porta`, `mapas.ts`). O periodo seguinte
(quando ninguem le mais nada, ele ja esta dentro) continua `"escondido"`.

**Mudanca de codigo, so em `Mundo.ts`:**
- `tracarRotaDoNpc` (`946`): quando o alvo tem `entra: true`, faz o pathing
  normal (nao pula como `"escondido"` puro) — a diferenca so aparece na
  CHEGADA.
- `finalizarRotaDoNpc` (`975`): se o periodo atual do NPC tem `entra: true`,
  em vez de tocar `parado`, chama a mesma logica de `esconderNpc` — e guarda
  o ponto de chegada num campo novo em `NpcComRotina` (`pontoDePorta`), pra
  `reaparecerNpc` (`1005`) usar como ponto de POP em vez do destino final: a
  criatura reaparece NA PORTA (visivel) e imediatamente comeca a andar de la
  pro ponto do novo periodo, em vez de teleportar direto pro trabalho. Isso
  fecha o ciclo simetrico: entra andando, sai andando.
- `create()` (`412-434`): ao carregar o save NO MEIO do periodo `entra`,
  nasce ESCONDIDO direto (sem andar) — mesma regra que `"escondido"` ja usa
  hoje, so tratando `entra` como "comeca esperando escondido" na primeira
  carga, nunca andando na entrada do jogo.

**Dado por NPC:** os 8 ganham um periodo `entra` (aponta pra porta da propria
casa, usando o `porta` de `Saida` de cada casa em `mapas.ts:255-264`) mais um
`"escondido"` de verdade para o(s) periodo(s) seguintes. Guarda fica de fora
(nunca entra, ver excecao acima). **Pescador entra na Casa da Vila** (porta
em `x:23,y:19`, ver "Decidido com o Hugo") na madrugada, em vez de ficar so
na fogueira — a fogueira continua sendo o destino dele a noite (bate com a
bio, "nas noites claras"), so a madrugada de fato o poe em casa.

Zero arte nova, zero sistema novo — so tipo + duas funcoes de `Mundo.ts`
tocadas + dado de 7 NPCs.

### Fase 2 — Atividade visivel, sem sprite novo

No ponto de TRABALHO/dia de cada NPC (nao no de casa), trocar `.play("...-
parado-...")` por uma pose tematica ja existente: `conjura` (braco erguido —
bate com martelar, mexer em prateleira) ou `ataque` (braco esticado — bate
com gesto de vender, ou o pescador "lancando a isca"). Tabela pequena, uma
entrada por NPC que tem atividade clara:
- ferreiro (na forja): `conjura`
- padeira (no forno): `conjura`
- mercador (na barraca): `ataque` (gesto de oferecer/vender)
- pescador (no rio): `ataque` (braco esticado, como se segurasse a vara)
- vovo, menina, menino: continuam `parado` (cuidar de ervas / brincar nao tem
  pose dedicada e forcar uma ia ler errado)

**Onde muda:** um mapa pequeno novo (`ATIVIDADE_DO_NPC: Partial<Record<string,
"conjura"|"ataque">>`, proximo de `RotinaDeNpc` em `mapas.ts` ou dentro de
`npcs.ts` — decisao de gosto na hora, provavel `mapas.ts` por ficar perto da
rotina) consultado em `Mundo.ts` sempre que o NPC ESTIVER PARADO no ponto de
dia (`finalizarRotaDoNpc`, mais o caso `create()` que nasce direto no ponto
sem andar): toca `npc-<sprite>-<atividade>-<dir>` em vez de `-parado-` quando
existe entrada pra aquele NPC E aquele periodo e o de trabalho.

Poses sao 1 quadro so (sem "respira"): aceitar que fica mais estatico que o
`parado` normal e uma troca intencional — sinaliza "ocupado", nao "vivo".

Zero arte nova.

### Fase 3 — Guarda estende a ronda a noite (REVISADA: nasceu a Trilha da Floresta)

**Desvio do plano original, decidido com o Hugo durante a implementacao.** A
ideia inicial (guarda na Trilha de Chegada) nao sobreviveu a investigacao:
essa trilha e MAO UNICA (Praia -> Trilha -> Vila, a Vila nao tem saida de
volta pra la) — ele nunca seria visto la de novo depois da introducao. Pior:
a bio do guarda fala da trilha PRA FLORESTA ("Bolota vigia a trilha que leva
a Floresta dos Sussurros"), nao da Trilha de Chegada — eram trilhas
diferentes. O Hugo pediu pra essa trilha existir de verdade, como parte do
cenario, em vez de so trocar o alvo por outro lugar que ja existia.

**O que foi feito:** `TRILHA_DA_FLORESTA`, mapa novo em `mapas.ts` (30x13,
mesmo molde pequeno de `TRILHA_DE_CHEGADA`, sem criatura — corredor de
vigia, nao de encontro), encaixado entre Vila e Floresta: `VILA.saidas` que
ia direto pra `"floresta"` agora vai pra `"trilha-floresta"` primeiro, que
so entao desagua na Floresta no mesmo ponto de entrada de sempre. A volta
(Floresta -> Vila) continua direta, sem passar pela trilha de novo — passar
por ela so na ida evita ida-e-volta cansativa no trajeto mais andado do
jogo. Registrado em `MAPAS["trilha-floresta"]`.

**Mecanismo de visita (ja existia, so faltava usar):** o `quem` do NPC
aparece TAMBEM no `pessoas` do mapa de destino, com uma `rotina` onde o
periodo da visita tem posicao real e todos os outros sao `"escondido"`. No
mapa de origem, o MESMO periodo vira `"escondido"` (ou, se for uma porta,
`entra: true` — ver Fase 1). O guarda so aparece em `TRILHA_DA_FLORESTA` de
noite, perto da entrada vinda da Vila; na Vila, a entrada dele ganha
`noite: { x: 34, y: 11, entra: true }` (anda ate a beira do mapa e some,
mesma mecanica de entrar em casa da Fase 1 — so que a "porta" aqui e a
saida pro mundo, nao uma casa). Madrugada volta pro posto de sempre na Vila.

Nenhum outro dos 8 sai da Vila neste plano — o resto do mecanismo fica
pronto (Fase 4 documenta) pro proximo NPC usar sem reinventar.

**Verificacao nova em `ferramentas/verificar.mjs`** (secao 5.6): agrupa
`pessoas` por mapa, le a rotina de quem aparece em mais de um mapa, e avisa
se algum periodo mostra o mesmo NPC visivel em mais de um lugar ao mesmo
tempo, ou escondido em TODOS os lugares (sumiu do jogo). Um ponto marcado
`entra: true` conta como "de passagem", nunca como presenca de verdade —
sem isso, todo NPC que entra em casa (Fase 1) dispararia falso positivo no
periodo em que anda ate a porta. Testado de proposito: forcei os dois erros
(visivel demais, escondido demais) e confirmei que os dois disparam, depois
revertido.

### Fase 4 — Documentar o padrao pra NPC novo

Sem codigo. O checklist que este plano usou, pra quem criar um NPC novo
repetir sem reinventar:
1. Bio em `npcs.ts` primeiro (personalidade, historia, afinidades) — a
   rotina nasce DAI, nunca ao contrario.
2. Rotina em `mapas.ts`: pelo menos um ponto de dia e, se a bio nao disser o
   contrario, um ciclo entra-casa/escondido/sai-casa (Fase 1).
3. Atividade (Fase 2) so se a bio descrever um oficio visivel — nao forcar.
4. Casa: se nao mora com outro NPC ja coberto, precisa de uma nova
   `_INTERIOR: Mapa` (mesmo molde de `CASA_GUARDA_INTERIOR`) OU reusar a
   "Casa da Vila" vaga, se ainda estiver livre.
5. Sprite: `elfa` e `bruxo` ja tem folha completa gerada e sem dono — checar
   se um dos dois serve antes de desenhar um corpo novo do zero.
6. Visita a outro mapa (passeio, ronda): so se a bio ja der um motivo
   concreto (ver o guarda na Trilha da Floresta) — nunca inventar so pra
   "usar o mecanismo". Rodar `npm run verificar` depois: a secao 5.6 pega
   NPC visivel em dois mapas ao mesmo tempo, ou sumido dos dois.

## Verificacao (por fase, mesmo padrao de ciclo-do-dia/moodles)

1. `npm run build` limpo a cada fase (TypeScript forca toda `rotina` a bater
   com o tipo novo).
2. Fase 1: forcar `estado().relogio` pra virar noite perto de um NPC e ver
   ele andar ate a porta da propria casa e sumir so ali (nao antes); forcar
   manha e ver ele reaparecer NA PORTA, nao no trabalho, e andar de la.
3. Fase 2: cada NPC com atividade mostrando a pose certa (`conjura`/`ataque`)
   parado no ponto de trabalho, sem quebrar quando o periodo muda pra um sem
   atividade.
4. Fase 3: forcar noite e andar da Vila ate a Trilha da Floresta — guarda
   tem que estar la, perto da entrada vinda da Vila; voltar pra Vila na
   mesma noite e confirmar que ele esta `"escondido"` la (nao duplicado nos
   dois mapas). `npm run verificar` com um caso de teste proposital (NPC em
   2 mapas, um periodo esquecido) confirmou que o aviso novo pega o erro.
5. `npm run contraste`/`auditar` de olho (nenhuma mudanca visual de paleta,
   mas confirmar que a pose nova nao estoura hitbox nem lê estranho em
   nenhuma visao).
