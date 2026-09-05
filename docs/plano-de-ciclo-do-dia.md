# Ciclo do dia: 6 periodos, iluminacao, criaturas e pesca por horario

**As 5 fases deste plano estao FEITAS e testadas ao vivo** (ver `FRENTES.md`,
entrada de 2026-09-05, pros commits de cada fase). O que fica em aberto,
listado como tal ao longo do documento: os eventos de sabor por periodo (secao
propria, brainstorm sem codigo), dano de criatura variando por horario
(bloqueado por `Criatura.dano` nunca ser lido em `Combate.ts` hoje — bug
preexistente, fora deste pedido), e qualquer animacao/sprite alem do icone do
HUD. O texto abaixo e o plano ORIGINAL, mantido como registro de decisao —
os numeros exatos (limites de periodo, cores) batem com o que foi construido.

## Contexto

O jogo ja tem um relogio de verdade (`src/dados/tempo.ts` + `src/sistemas/tempo.ts`,
persistido em `estado().relogio`) com 4 periodos (madrugada/manha/tarde/noite), um
ceu que escurece por cima da Vila Semente, e 8 NPCs com rotina por periodo. Isso
saiu de um pedido anterior do Hugo, encaixado como adiantamento da Fase 1.2.

Agora ele quer aprofundar isso de verdade: **6 periodos nomeados** (madrugada,
aurora, manha, tarde, por-do-sol, noite), um **icone no HUD** mostrando o periodo
atual, **criaturas que mudam de presenca/forca por horario** (aranha mais a noite,
goblin mais forte a noite), um **sistema simples de peixes por horario** (peixe raro
so no por-do-sol ou na aurora), e pensar (sem implementar ainda) em **eventos de
sabor** por periodo. Iluminacao/arte tambem entram nesta leva pelo minimo
necessario (o icone precisa de pixel art pra existir); animacao maior (NPC
dormindo, brilho de lanterna, etc.) fica pra depois, explicitamente.

Trata-se de expandir um sistema que ja existe e ja prova o padrao (o pescador ja
tem fala condicionada por periodo, via `noPeriodo()`) — nao inventar do zero.

**Fora de escopo, de proposito:** a missao de pescaria completa com peixes
brasileiros e o pier de Portomares (`docs/02-roteiro.md`) e "documentada... entra
no jogo numa fase posterior" — o que construimos aqui e um degrau menor, so na
Vila Semente, so dado + fala, sem minigame de fisgar peixe.

## Risco de colisao a verificar antes de comecar

`src/dados/config.ts` e `src/dados/mapas.ts` estao com mudanca **nao commitada no
disco agora**, da frente `sprites` (4 casas novas, append em `OBJETOS`/mapas).
Este plano precisa tocar `mapas.ts` (rotina dos 8 NPCs). Antes de editar,
reconferir `git status` e o `FRENTES.md` — se ainda estiver em andamento, editar
por cima com cuidado (nunca reescrever as linhas novas deles, so acrescentar/
editar as linhas de `rotina` que ja existiam antes deles chegarem).

## Os 6 periodos: limites escolhidos com cuidado

Ordem no ciclo: **madrugada -> aurora -> manha -> tarde -> por-do-sol -> noite ->
(volta pra madrugada)**. Nomes evitam de proposito "Amanhecer"/"Anoitecer" (sao os
nomes proprios das masmorras da aventura 1 e 3 na referencia de mesa).

`sistemas/tempo.ts` hoje divide o dia em fatias IGUAIS (`MINUTOS_POR_DIA /
PERIODOS.length`) — isso quebra com fatias de tamanho diferente. Os dois
crepusculos (aurora, por-do-sol) devem ser mais curtos que os outros 4, entao a
matematica precisa mudar (ver secao tecnica abaixo). Limites propostos (minuto de
inicio, dos 1440 do dia):

| Periodo | Inicio | Duracao | Cor do ceu | Alpha |
|---|---|---|---|---|
| madrugada | 0 | 180 min | `COR.tinta` | 0.50 (o ponto mais escuro) |
| aurora | 180 | 180 min | `COR.rosa` | 0.22 |
| manha | 360 | 300 min | `COR.tinta` | 0 |
| tarde | 660 | 240 min | `COR.tinta` | 0 |
| por-do-sol | 900 | 180 min | `COR.brasa` | 0.28 |
| noite | 1080 | 360 min | `COR.tinta` | 0.42 |

Nenhuma cor nova: `COR.brasa` (laranja) e `COR.rosa` (rosa) ja existem na paleta e
nunca foram usadas pra ceu — encaixam perfeito em por-do-sol/aurora sem violar
"nada de cor solta". `madrugada` fica mais escura que `noite` (o ponto mais
profundo da noite), mas o alpha maximo (0.50) fica bem abaixo de opaco, porque a
referencia de mesa e explicita: **"a noite nunca ficava totalmente escura, por
causa da Pedra do Sol"** — nunca deve ficar preto de verdade.

Os dois crepusculos tem exatamente 180 min = 2x `TRANSICAO_MIN` (90), pra nao
sobrepor a propria transicao de entrada com a de saida. Minuto 720 (usado por
`ferramentas/auditar-ui.mjs` pra congelar o ceu do screenshot) cai 60 min dentro de
`tarde` (que comeca em 660): `faltam = 240 - 60 = 180 > 90`, sem blend, alpha 0
estavel — a auditoria continua determinista sem mudar o script.

### Mudanca tecnica em `sistemas/tempo.ts`

Trocar a divisao fixa por busca de limite: `periodoAtual()` passa a achar o ultimo
periodo cujo `inicio <= minutoDoDia()` (lista sempre ordenada por `inicio`
crescente comecando em 0). `corDoCeu()` ganha um helper `duracaoDoPeriodo(idx)` =
diferenca entre o `inicio` do periodo seguinte (com wrap em 1440) e o do atual, e
usa isso no lugar do `DURACAO_PERIODO` fixo pra calcular `faltam`. O resto do
blend (`TRANSICAO_MIN`) fica igual.

## NPCs: rotina cresce pra 6 periodos

`Pessoa.rotina` (`mapas.ts`) e `Record<Periodo, ... >` exaustivo — o TypeScript
ja obriga as 8 entradas a ganhar `aurora` e `por-do-sol`, o build nao compila sem
isso. Aproveitar a passagem pra:
- **Corrigir a padeira**: hoje `madrugada: "escondido"`, mas a bio dela
  (`npcs.ts`) diz "acorda antes do sol pra tirar o primeiro pao do forno" — ela
  deveria estar VISIVEL (na padaria) na madrugada, nao escondida. `aurora` pode
  ser quando ela abre a banca pra venda.
- **Pescador ganha a manha de neblina**: a bio dele cita "manha de neblina no
  rio" como afinidade — a `aurora` (janela de neblina) e o lugar natural pra ele
  estar no rio, o que tambem ancora a pesca (secao abaixo).
- As outras 6 pessoas: preencher `aurora`/`por-do-sol` copiando o ponto do
  periodo vizinho mais proximo (madrugada/manha para aurora; tarde/noite para
  por-do-sol) onde nao houver uma ideia melhor — sem inventar 6 rotinas
  completamente novas por NPC nesta passada.

Tambem reauditar a unica fala condicionada por periodo que ja existe
(`dialogos.ts`, pescador, `noPeriodo("noite", "madrugada")`) — hoje cobre a noite
inteira (21h-6h equivalente); com o split, isso passa a EXCLUIR aurora/por-do-sol
sem querer. Decidir se ele deve virar `noPeriodo("noite", "madrugada", "aurora")`
(cobre a neblina da manha tambem) ou ficar como esta — a intencao original era
"noites claras", entao provavelmente fica igual, mas precisa ser uma decisao
consciente, nao um acidente.

## Criaturas: presenca e forca por horario

Dois mecanismos NOVOS, os dois opcionais em `Criatura` (`conteudo.ts`) —
`undefined` sempre significa "sem efeito, igual hoje", nenhuma criatura existente
muda de comportamento sem eu adicionar o campo nela:

```ts
presencaPeriodos?: Periodo[];               // undefined = sempre presente
bonusPorPeriodo?: Partial<Record<Periodo, number>>; // undefined = sem bonus
```

**Presenca** (ex.: aranha so aparece a noite/madrugada): em `Mundo.ts`, no mesmo
bloco por-frame que ja detecta troca de periodo pra NPCs
(`atualizarRotinasDeNpc`), percorrer tambem `this.criaturas` e, se
`presencaPeriodos` existir e nao incluir o periodo atual, esconder — e se incluir,
reexibir (pulando quem ja foi `foiDerrotado`/removido pra sempre). Dois cuidados
que a versao de hoje de `esconderCriatura()` NAO cobre e que sao obrigatorios
aqui, senao vira bug:
1. `esconderCriatura()` hoje so faz `sprite.setVisible()` — precisa TAMBEM
   desligar `(corpo.body as Phaser.Physics.Arcade.StaticBody).enable`, senao a
   criatura escondida vira uma parede invisivel (o corpo de colisao continua
   ligado).
2. `conferirEncontro()` filtra `this.criaturas` por distancia mas nunca checa
   `sprite.visible` — uma criatura escondida por horario nao pode emboscar o
   heroi. Adicionar esse filtro.

**Forca** (ex.: goblin mais perigoso a noite): rastreado o fluxo completo de
`Combate.ts` — o unico ponto ja host, ligado e testado pra isso e o bonus de
ataque da criatura no dado. Hoje `create()` chama `this.porCriatura(..., 0, ...)`
com um **zero fixo** de bonus (linha ~205). Isso vira
`ficha.bonusPorPeriodo?.[periodoDoEncontro] ?? 0`, onde `periodoDoEncontro =
periodoAtual()` e capturado UMA VEZ em `create()` (guardado em
`this.periodoDoEncontro`) — pra o resultado nao mudar no meio de uma luta longa
se o relogio virar o periodo achado.

**Fora de escopo nesta passada**: `Criatura.dano` (coracoes por golpe) nunca e
lido em lugar nenhum de `Combate.ts` — o dano de verdade e um `-1 coracao` fixo
em `heroiApanha()`. Fazer "bate mais forte a noite" de verdade exigiria ligar
`.dano` primeiro, o que e um buraco preexistente e maior que este plano; o bonus
no dado (acima) ja da o efeito pedido ("fica mais perigoso") sem essa cirurgia.

**Cuidado obrigatorio**: `acharCriatura(id)` devolve a referencia real dentro do
array estatico `BESTIARIO` — NUNCA escrever em cima do objeto devolvido (ex.
`ficha.bonus = x`), isso corromperia a ficha pra sempre, pra todo encontro
futuro na mesma sessao. Os bonus sempre viram uma variavel local no ponto de
uso, nunca uma mutacao.

**Conteudo de exemplo pra provar os dois mecanismos** (nao e o bestiario
inteiro, so o suficiente pra validar): aranha ganha `presencaPeriodos:
["noite", "madrugada", "aurora"]` (sai de sempre-visivel pra so-a-noite); goblin
ganha `bonusPorPeriodo: { noite: 1 }` (mais dificil de acertar a noite, sem
mexer em presenca — ele e criatura de missao principal, nao pode sumir do
mapa).

## Peixes: catalogo + fala, sem minigame

Novo `src/dados/peixes.ts`, no espirito de `dados/sons.ts`/`dados/tempo.ts` — so
dado:
```ts
export type Peixe = { id: string; nome: string; raridade: Raridade; periodos: Periodo[]; local: string; texto: string };
export const PEIXES: Peixe[] = [ ... ];
```
Reusa o `Raridade` que ja existe em `conteudo.ts` (comum/incomum/raro/epico/
lendario) em vez de inventar escala nova. Poucos peixes bastam pra provar o
sistema: 2-3 comuns (manha/tarde, o "peixe do dia"), 1 raro so no por-do-sol, 1
raro so na aurora (a nevoa do pescador).

Uma funcao pura em `sistemas/` (`peixesDisponiveisAgora()`, ou inline se for
pequeno) filtra `PEIXES` por `periodos.includes(periodoAtual())`. Isso pluga
DIRETO no sistema de condicao que ja existe
(`sistemas/condicoes-de-fala.ts::noPeriodo`) — zero mecanismo novo: novas
`variantes` na fala do pescador (`dialogos.ts`) comentando qual peixe esta
"fisgando" agora, condicionadas pelos `periodos` de cada `Peixe`. Ancora na
missao secundaria que ja existe (`missoes.ts`, "peixes-sumindo" / etapa
"ouvir-fagundes").

**Escopo explicito desta passada: catalogo + fala, zero UI nova, zero pescar de
verdade, zero campo novo em `estado()`** (nao precisa persistir "peixe
pescado" ainda). Se isso nao bater com a expectativa, e o momento de falar antes
de eu comecar.

## Icone de periodo no HUD

`Interface.ts::montarTopo()` empacota coracoes -> moeda -> selo -> nome (que
encolhe pra caber) -> engrenagem de pausa. O icone de periodo entra logo depois
do selo (`xMoeda + 49` empurra pra frente o espaco livre que ja e repassado a
`montarBotaoFicha`), е troca de frame no evento de mudanca de periodo — sem
polling por frame na Interface: `Mundo.ts` ja calcula `mudouPeriodo` uma vez por
frame pra rotina dos NPCs, so precisa emitir
`this.scene.get("Interface").events.emit("periodo-mudou", periodo)` quando
mudar (mesmo padrao ja usado por `"falar"`). A Interface tambem seta o icone uma
vez em `create()` direto de `periodoAtual()`, pra nao nascer com o icone errado
por um frame.

**Arte, minima e agora** (o HUD precisa de algo pra desenhar): 6 icones
pequenos novos em `arte/ui.py` (uma funcao `i_periodo(id)` parametrizada, ou 6
funcoes curtas — sol alto pra manha/tarde, sol baixo laranja pro por-do-sol, lua
pra noite, lua fina/estrela pra madrugada, um meio-sol rosa pra aurora),
adicionados ao fim de `ICONES`. `src/sistemas/icones.ts` ganha 6 indices novos
no `ICONE`, na MESMA ordem (convencao manual hoje, sem script de sincronia —
conferir visualmente apos `npm run arte`).

## Eventos de sabor: brainstorm, NAO implementar agora

Lista pra guardar no proprio documento de plano (depois de aprovado, viraria
`docs/plano-de-ciclo-do-dia.md`), sem nenhum codigo nesta passada:
- **Madrugada**: cheiro/luz do forno da padeira visivel de fora; vila quase
  deserta, so ela e o guarda de ronda.
- **Aurora**: neblina no rio (visual, se/quando houver efeito de particula);
  pescador no seu ponto; pessoas comecando a sair de casa.
- **Manha**: banca do mercador aberta, mais gente na rua, pico de NPCs
  visiveis.
- **Tarde**: criancas (Nina/Tiao) mais ativas fora de casa.
- **Por-do-sol**: NPCs voltando pra casa, troca de turno do guarda, luz quente
  batendo nas casas.
- **Noite**: rua mais vazia, fogueira da praca como ponto de luz/encontro
  (pescador senta la), aranha/lobo de nevoa mais presentes na Floresta.
- Ideia narrativa maior (pra mais tarde, nao agora): um evento raro tipo "luz
  de aurora no ceu" como referencia ao proprio nome do reino, so em certas
  noites.

## Verificacao

1. `npm run build` (roda `verificar` embutido) tem que compilar limpo — o
   TypeScript vai forcar as 8 rotinas a ganharem as 2 chaves novas, entao
   qualquer uma esquecida vira erro de compilacao, nao bug silencioso.
2. `npm run contraste` — os dois novos tons de ceu (brasa/rosa em baixo alpha
   sobre o mundo) nao devem quebrar nenhum par ja medido; conferir se overlay
   de ceu entra no script ou e so visual (provavelmente so visual, mas
   confirmar).
3. `npm run auditar` — `ferramentas/telas/10-mundo.png` **nao pode mudar de
   tom** (minuto 720 continua dentro de `tarde`, alpha 0) a menos que os
   limites escolhidos acima mudem; se mudar, e sinal de erro na tabela de
   `inicio`.
4. Teste manual no navegador, forcando o relogio (mesmo mecanismo de
   `travarRelogioParaAuditoria`, ou `estado().relogio = X` no console) pra cada
   um dos 6 periodos: conferir cor do ceu, icone do HUD trocando, cada NPC no
   ponto certo (padeira visivel na madrugada, pescador no rio na aurora).
5. Testar uma aranha (ou goblin) escondida por horario: mudar pra periodo sem
   presenca, andar por cima de onde ela estava — heroi NAO pode travar (prova
   que o corpo de colisao foi desligado junto com a visibilidade), e
   `conferirEncontro()` nao pode abrir combate com ela escondida.
6. Testar o bonus por periodo entrando em combate com o goblin de noite vs de
   dia — usar o console pra forcar o relogio antes de chegar perto, e
   confirmar visualmente (ou via log temporario) que o bonus aplicado bate com
   `bonusPorPeriodo`.
7. Forcar cada periodo com peixe disponivel e conferir a fala do pescador
   mostrando a variante certa.

## Ordem de implementacao sugerida (fases pequenas, cada uma jogavel)

1. `dados/tempo.ts` + `sistemas/tempo.ts` (motor de 6 periodos, sem nenhum
   consumidor novo ainda) — testar so com o ceu mudando de cor, nada mais.
2. `mapas.ts` (rotinas) + `dialogos.ts` (reauditar o `noPeriodo` do pescador) —
   testar os NPCs se movendo certo nos 6 periodos.
3. Icone no HUD (`arte/ui.py`, `icones.ts`, `Interface.ts`, evento em
   `Mundo.ts`) — testar visualmente nos 6 periodos.
4. Criaturas (presenca + bonus, `conteudo.ts` + `Mundo.ts` + `Combate.ts`) —
   testar aranha escondendo/reaparecendo e goblin mais dificil de noite.
5. Peixes (`peixes.ts` + fala do pescador) — testar a fala mudando com o
   relogio forcado.

Cada fase termina com `npm run build` limpo e um commit proprio, seguindo o
padrao ja usado nas entregas recentes (Selo de Heroi, dado.ts).
