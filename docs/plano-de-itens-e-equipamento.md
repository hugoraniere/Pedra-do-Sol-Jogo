# Plano de itens, mochila e equipamento

Documento de design, ainda sem uma linha de codigo. Nasce de um pedido do Hugo
("vamos trabalhar no sistema de itens e inventario, com equipamento, hover,
icones, animacao"), com duas referencias externas soltas na conversa — Baldur's
Gate e Project Zomboid — usadas com cuidado: **inspiracao de mecanica, nao
transplante de complexidade**. O jogo continua sendo o do RPG de mesa em
`docs/referencia/sistema-do-rpg-de-mesa.md`, que e magro em itens de proposito.

Sem numero, de proposito: e um documento que ainda vai mudar de forma, igual
`plano-do-combate.md` e `modelo-de-combate.md`.

**Segunda rodada (2026-09-05):** a primeira versao deste plano propos
Armadura/Acessorio com bonus de atributo solto ("+1 em ESPERTEZA"), parecido
demais com o que ja existia. O Hugo pediu refatoracao: itens serios, presos na
aventura de verdade, com drop de monstro em porcentagem, mais variedade de
arma/equipamento, e um sistema de preco por raridade e importancia. As secoes
4 em diante sao a reescrita. Tambem incorpora o pedido de "atualizar com a
logica de atributos que mudou": o sistema de poderes (`sistemas/poderes.ts`,
`poderesDoHeroi()`) ja esta implementado de verdade (nao e mais so dado
parado), e a secao 6 explica exatamente onde o bonus de item se encaixa nessa
conta sem duplicar o que ja existe. A Fase A desta rodada foi implementada.

**Terceira rodada (2026-09-05, depois da Fase A implementada):** o Hugo
apontou que o combate e os atributos mudaram e pediu que "tudo faca sentido,
nada de coisas muito infantis". Na conferencia, apareceu um problema real:
`sistemas/condicoes.ts` (MOLHADO/QUEIMANDO/CONGELADO/PRESO/ASSUSTADO/
ESCONDIDO/ILUMINADO etc., ja com efeito e duracao de verdade, e ja e o motor
por tras dos itens EXISTENTES da `LOJA` — Biscoito Magico gera ABENCOADO,
Bota do Vento gera RAPIDO, Capa Camaleao gera ESCONDIDO, Sino Espanta-Monstro
gera ASSUSTADO, Lanterna gera ILUMINADO) e a segunda rodada deste plano
**nunca olhou pra ele**. Os bonus de Armadura/Acessorio inventaram categorias
soltas sem base nenhuma no jogo — pior delas, "veneno", que nao existe como
condicao nem como dano em lugar nenhum (nenhum bicho do bestiario e
venenoso). Secao 6 ganhou o tipo `BonusDeEquipamento`, e as secoes 9/10 foram
corrigidas item a item: todo bonus agora ou usa uma `IdCondicao` REAL (concede,
encurta ou da resistencia — nunca inventa uma nova), ou nomeia uma criatura de
verdade do bestiario em vez de uma familia elemental solta ("Lobo de Nevoa"
em vez de "criatura de nevoa"). Ja implementado em `conteudo.ts` — ver secao
14.

## 1. Decisoes tomadas nesta conversa

1. **Uso de item dentro do combate fica fora deste plano por agora.**
   `src/sistemas/acao.ts` ja tem um comentario explicito dizendo que isso
   "fica pra Fase 6, ainda nao tem forma/efeito definidos". Este plano
   constroi mochila e equipamento completos para **fora de combate**.
2. **Armadura e acessorio equipavel dao bonus mecanico** — extensao explicita
   da mesa (que so tem arma com bonus), decidida aqui, nao encontrada por
   acidente. Nesta segunda rodada, o bonus segue a MESMA gramatica contextual
   que as armas ja usam ("+1 de perto", "+1 em magia"), nunca um numero solto
   de atributo — ver secao 6.
3. **(Nova) Todo item novo nasce de um lugar ou de uma criatura do bestiario
   existente.** Nada de nome bonito sem raiz. Isso resolveu a reclamacao de
   "itens iguais ao que tinhamos antes": os itens antigos eram genericos
   (poção, corda, capa) porque nao vinham de lugar nenhum da ficcao. Os novos
   (secao 7) vem de material largado por goblin, aranha, lobo-de-nevoa,
   espantalho e cavaleiro-de-cinzas, ou de recompensa de vitoria sobre os
   quatro guardioes unicos (serpente, Grulo, Bruxa Espinho, Brasanegra).

## 2. Onde o jogo ja esta (fatos, nao suposicao)

- `src/dados/conteudo.ts`: `ARMAS` (8 compraveis + 3 lendarias) e `LOJA` (12
  itens) ja existem, cada um com `preco` e bonus/texto bem escritos. As armas
  ja tem bonus contextual de verdade ("+1 de perto", "+1 em magia", "+1
  escondido"). `BESTIARIO` tem as 9 criaturas com `larga: string[]` (sem
  porcentagem — presenca/ausencia, nao chance) e `onde: string[]` (local).
  Quatro dessas criaturas sao guardioes de historia com item unico
  (`serpente` -> `cristal-meio-dia`, `grulo` -> `pedagio`, `bruxa` ->
  `cristal-anoitecer`, `brasanegra` -> `pedra-do-sol`); as outras cinco
  (`goblin`, `aranha`, `espantalho`, `lobo-nevoa`, `cavaleiro-cinzas`) largam
  material comum (`moeda`, `teia-doce`, `palha`, `presa-de-nevoa`, `cinza`) —
  **e esse material hoje NAO tem ficha de item nenhuma.** Ele entra na mochila
  como string solta, sem nome bonito, sem preco, sem icone: e exatamente o
  buraco que este plano fecha.
- `src/sistemas/estado.ts`: `mochila: string[]` e so posse, sem contagem.
  `moedas: number` comeca em 5. Sem campo de equipamento — o que esta "na
  mao" e `heroi.armaSprite`; roupa/chapeu sao cosmeticos de criacao.
- `src/sistemas/poderes.ts`: **sistema de atributos ja implementado de
  verdade.** `poderesDoHeroi(heroi)` soma `poderesDaOrigem` (raca +1, classe
  +1) com o `poderEscolhido` do jogador (+1) — tres numeros finais, FORCA/
  ESPERTEZA/CORACAO, recalculados sempre a partir do save, nunca gravados
  prontos (comentario do proprio arquivo: "um save do Lele feito hoje
  continua certo se amanha uma raca trocar de bonus"). `sistemas/turnos.ts`,
  `rolar(atributo: number, sorteio)`, so soma o dado ao numero que chega —
  **nao tem parametro de modificador ainda** (nem "+1 com ajuda", nem "+1 com
  item", nem "-1 dificil" — nenhum dos tres modificadores do manual esta
  implementado em lugar nenhum do codigo, confirmado no roadmap).
- `src/cenas/Ficha.ts`: aba MOCHILA e placeholder. Tooltip ja existe e e o
  padrao a reaproveitar: `mostrarDica()`/`esconderDica()` em `Combate.ts`/
  `Provador.ts`.
- **Combate virou por turnos** (decisao ja registrada em
  `docs/plano-do-combate.md`, nao deste plano): os dois lados rolam dado, nao
  so o heroi. Isso nao muda nada deste documento, so contextualiza onde um
  modificador de item vai encaixar quando a Fase 6 chegar.
- So 5 armas tem sprite (`cajado, espada, arco, martelo, funda`). Icone de
  mochila ja marcado ruim por quem cuida da Ficha. Sem durabilidade, peso,
  crafting ou raridade em cores hoje — `lendaria?: boolean` e so um flag
  narrativo pontual nas 3 armas de historia.

## 3. O que entra e o que fica de fora, das duas referencias

**De Baldur's Gate:** itemizacao com peso tatico real (a arma ja faz isso),
visual que muda ao equipar (gap conhecido pra armadura, secao 9), item unico
como recompensa de guardiao vencido (ja existe via `larga` dos quatro
guardioes — este plano so da nome/ficha ao que ja e garantido).

**De Project Zomboid:** a tensao de recurso escasso, nao o sistema de
sobrevivencia. Nesta rodada isso vira concreto: **drop com porcentagem**
(secao 8) e a versao deste jogo da escassez do Zomboid — nem todo goblin
derrotado da a mesma coisa, e um material raro dói de menos encontrar. Fica
de fora, de proposito: durabilidade, peso/carga, fome/sede, crafting em
bancada. Nenhum esta na mesa, e todos pesam contra Legibilidade/Densidade.

## 4. Categorias e slots de equipamento

Tres slots (sem mudanca desde a primeira versao — poucos de proposito):

- **Arma** — ja existe (`heroi.armaSprite`), passa a ser trocavel fora da
  criacao.
- **Armadura** (novo) — vestida por cima da roupa de aparencia (que continua
  100% cosmetica). Uma so por vez.
- **Acessorio** (novo) — bugiganga achada ou comprada, uma so por vez.

Mochila guarda tambem **materiais** (novo, secao 7 — trofeu/insumo de
monstro, empilhavel, vendavel, nao equipavel) e **itens de historia**
(flags, sem pilha).

## 5. Sistema de raridade e preco

Cinco raridades, cada uma com uma faixa de preco e uma faixa de chance de
drop — **sao a mesma escala**, so que inversas: quanto mais raro, mais caro
E mais dificil de cair no chao.

| Raridade | Onde se consegue | Preco (moedas) | Chance de drop (bicho comum) |
|---|---|---|---|
| Comum | loja e drop | 2 a 4 | 45% a 65% |
| Incomum | loja (depois de trazer material) e drop | 6 a 9 | 15% a 30% |
| Raro | so drop, raramente loja | 12 a 18 | 4% a 10% |
| Epico | recompensa garantida de guardiao unico | 0 (nao a venda) | 100%, mas so 1 vez na vida do save |
| Lendario/Historia | recompensa de missao principal | 0 (nao a venda) | 100%, evento fixo (ja e o que `lamina-aurora` etc. fazem hoje) |

**Formula de preco** (pra todo item novo seguir a mesma conta, em vez de
numero de vibe): `preco = BASE[raridade] + 3 x (clausulas de bonus extras)`,
onde uma "clausula" e cada frase "+1 pra/de/contra ___" que o item carrega
alem da primeira. `BASE`: comum 3, incomum 7, raro 13, epico/lendario 0. Um
item com bonus unico (a maioria) fica no piso da faixa; um item com dois
efeitos (como a Funda de Couro ja faz hoje, "+1 de longe" + "nunca passa de
QUASE") sobe uma faixa dentro da mesma raridade.

**Importancia** entra pela raridade, nao por um segundo numero: um item
"importante" (resolve uma fraqueza especifica de guardiao, ou fecha uma
missao) e por definicao Epico ou Lendario, e por isso nao tem preco — a
mesa nunca vendeu o Cristal do Amanhecer, e este sistema respeita isso.

## 6. Como o bonus de item entra no dado (o pedido de atualizar com a logica de atributos)

`poderesDoHeroi()` continua puro e sem equipamento — **nao muda**, porque o
proprio comentario do arquivo explica por que: o estado guarda so a escolha,
nunca o total pronto, pra um save antigo continuar certo se `conteudo.ts`
mudar amanha. Meter bonus de item ali dentro quebraria essa garantia (o
"total" pararia de ser so raca+classe+escolha).

Em vez disso, o bonus de item e um **modificador de teste**, no mesmo nivel
de "+1 com ajuda" e "-1 se dificil" que o manual ja prevê e que o roadmap
confirma que ainda nao existe em lugar nenhum. Proposta:

- `rolar(atributo: number, sorteio: () => number, modificador = 0)` ganha um
  terceiro parametro opcional — muda a assinatura, nao o comportamento pra
  quem ja chama sem ele.
- Uma funcao nova e pura, `modificadorDeEquipamento(heroi, contexto)` em
  `sistemas/equipamento.ts` (novo arquivo, nao em `poderes.ts` — poderes
  continua so sobre FORCA/ESPERTEZA/CORACAO, equipamento e outra coisa),
  olha a arma/armadura/acessorio equipados e devolve +1 se o `contexto` da
  acao bater com a clausula do item.
- Quem monta o teste (a Fase 1, ainda por fechar) chama `rolar(atributo,
  sorteio, modificadorDeEquipamento(heroi, contexto))`. Nenhum item deste
  plano MUDA como o dado e resolvido — so preenche um parametro que a Fase 1
  ja vai precisar de qualquer forma pros outros dois modificadores do
  manual.

**Correcao da rodada 3:** a conferencia do combate/atributos encontrou
`sistemas/condicoes.ts`, o motor real de buff/debuff (MOLHADO, QUEIMANDO,
CONGELADO, PRESO, ASSUSTADO, ATRAIDO, CAIDO, TONTO, ABENCOADO, RAPIDO,
PROTEGIDO, ESCONDIDO, ILUMINADO — cada uma com duracao e efeito de verdade,
documentadas em `docs/mundo-que-reage.md`, secao 3), que os itens **ja
existentes** da `LOJA` ja disparam (Biscoito Magico -> ABENCOADO, Bota do
Vento -> RAPIDO, Capa Camaleao -> ESCONDIDO, Sino Espanta-Monstro ->
ASSUSTADO, Lanterna -> ILUMINADO). A segunda rodada deste plano ignorou esse
motor e inventou categorias soltas de "contexto" sem base nenhuma (pior
caso: "veneno", que nao existe como condicao nem como dano em nenhum lugar
do jogo — nenhum bicho do bestiario e venenoso).

Correcao: `BonusDeEquipamento` (em `conteudo.ts`) agora tem DUAS formas, e
nenhuma terceira:

```ts
type BonusDeEquipamento =
  | { tipo: "teste"; contexto: string }
  | { tipo: "condicao"; id: IdCondicao; efeito: "concede" | "resiste" | "encurta" };
```

`"teste"` e o modificador contextual de sempre (igual arma ja usava). `"condicao"`
faz o item interagir com uma `IdCondicao` que **ja existe** em
`sistemas/condicoes.ts` — nunca inventa uma nova. Quando nenhuma condicao
real serve, o item vira `"teste"` nomeando a criatura de verdade ("+1
contra o Lobo de Nevoa"), nunca uma familia elemental inventada ("+1 contra
criatura de nevoa"). As secoes 9 e 10 abaixo ja refletem essa correcao —
implementada, nao so planejada (ver secao 14).

Isso quer dizer: **este plano nao pode terminar de "funcionar" antes da Fase
1 dar suporte a modificador de teste.** Ate la, equipar item muda o que
aparece na Ficha e o que a dica de hover promete, mas o bonus fica
"reservado" sem efeito numerico real — o mesmo tipo de honestidade que
MOCHILA/DIARIO ja usam hoje (secao 10 formaliza isso como dependencia).

## 7. Materiais de monstro (novo — da ficha ao que ja cai e nao tem nome)

As cinco criaturas comuns do bestiario ja largam material (`larga` em
`conteudo.ts`), so que sem ficha de item. Aqui esta a ficha:

| id | nome | de quem | raridade | textura/uso |
|---|---|---|---|---|
| teia-doce | Fio de Teia Doce | aranha | comum | o mesmo fio que a fraqueza dela usa pra escapar — comestivel leve, vira insumo do Manto de Teia |
| palha | Palha de Espantalho | espantalho | comum | recheio seco do proprio espantalho — vendavel, sem uso magico, so trofeu barato |
| presa-de-nevoa | Presa de Nevoa | lobo-nevoa | incomum | ainda fria ao toque — insumo do Capuz de Nevoa e da Funda de Presa |
| cinza | Cinza de Armadura | cavaleiro-cinzas | raro | cinza que nunca esfria de verdade — insumo da Couraca de Cinza e do Martelo de Cinza |
| moeda | (ja existe, sem mudanca) | goblin, espantalho | comum | vai direto pro `estado().moedas`, nao pra mochila — continua assim |

**Como material vira equipamento, sem inventar bancada de crafting:** o
Hugo ja tem o gancho certo no jogo — Seu Cominho, o mercador. Trazer N
unidades de um material pra ele **destrava** a compra do item incomum/raro
que usa aquele material (ele "faz" o item, narrativamente, na mesma cena de
dialogo que ja existe pro pano de goblin no varal). Nao e crafting: e um
degrau a mais na loja, sem UI nova nenhuma alem do que a Fase 1.2 ja
construiu (escolhas de dialogo).

## 8. Tabela de drop, com porcentagem

| criatura | porte/comportamento | material comum | chance | drop raro (equipamento) | chance |
|---|---|---|---|---|---|
| goblin | pequeno, foge | moeda | 70% | — | — |
| aranha | pequeno, ronda | teia-doce | 55% | Anel da Teia (acessorio) | 4% |
| espantalho | medio, ronda | palha | 60%, moeda 25% | — | — |
| lobo-nevoa | medio, espreita | presa-de-nevoa | 35% | Presa de Nevoa Lapidada (acessorio) | 5% |
| cavaleiro-cinzas | grande, encara | cinza | 45% | — (cinza vira equipamento so na loja, ver secao 7) | — |
| serpente (guardiao, unico) | grande, guarda | cristal-meio-dia (quest) | 100%, 1x | Manto do Pantano (armadura epica) | 100%, 1x |
| grulo (guardiao, unico) | grande, guarda | pedagio (quest) | 100%, 1x | Broche do Troll (acessorio epico) | 100%, 1x |
| bruxa (guardiao, unico) | medio, chefe | cristal-anoitecer (quest) | 100%, 1x | Cajado da Bruxa Espinho (arma epica) | 100%, 1x |
| brasanegra (guardiao final, unico) | enorme, chefe | pedra-do-sol (quest) | 100%, 1x | — (a recompensa e a historia, nao equipamento) | — |

**Nota sobre "unico":** o bestiario nao marca hoje quem e guardiao de
historia (uma so luta possivel) e quem e bicho comum (pode aparecer varias
vezes). `serpente`, `grulo`, `bruxa` e `brasanegra` ja se comportam como
unicos na pratica (`larga` deles e item de missao, `comportamento: "guarda"`
ou `"chefe"`), mas isso e leitura implicita, nao um campo. **Proposta de
mudanca de dado:** `Criatura` ganha `unico?: boolean`. Sem isso, um sistema
de drop por porcentagem nao sabe diferenciar "rolar toda vez que aparecer"
de "so uma vez na vida do save" — e rolar % num guardiao que so existe uma
vez faria sentido nenhum (e poderia ate falhar a missao principal, que
precisa do item garantido).

## 9. Armas: variedade por local e por vitoria

As 8 armas atuais (secao 2) nao mudam de bonus nem de preco — continuam a
base comum, compravel desde o inicio. O que muda: cada uma ganha uma versao
**incomum ou rara**, achada, presa a um lugar ou a uma vitoria especifica —
nao um nome bonito solto, uma progressao real dentro da aventura 1 (Vila →
Floresta → Ponte → Caverna):

| base | versao encontrada | raridade | preco | de onde vem | bonus (soma ao da base) |
|---|---|---|---|---|---|
| Espada Curta | Lamina do Guarda-Vila | incomum | 0 (recompensa) | recompensa de missao secundaria na Vila Semente | +1 de perto, +1 pra impressionar guarda |
| Cajado de Carvalho | Cajado da Bruxa Espinho | epico (guardiao) | 0 (nao a venda) | vencer a Bruxa Espinho na Torre | +1 em magia, resiste a ficar PRESO pelo espinho dela |
| Arco de Galho | Arco Trancado de Teia | incomum | 10 | comprado depois de trazer 3x Fio de Teia Doce | +1 de longe, nunca erra contra bicho pequeno (porte pequeno) |
| Funda de Couro | Funda de Presa | incomum | 13 | comprada depois de trazer 2x Presa de Nevoa | +1 de longe, nunca passa de QUASE, +1 contra o Lobo de Nevoa |
| Martelo de Fornalha | Martelo de Cinza | raro | 16 | comprado depois de trazer 4x Cinza de Armadura | +1 para quebrar e consertar, +1 contra o Cavaleiro de Cinzas |
| Adaga da Sorte | Adaga da Serpente | epico (guardiao) | 0 (nao a venda) | vencer a Serpente no Pantano | +1 escondido, +1 contra a Serpente do Pantano |

Precos recalculados pela formula da secao 5 (contando toda clausula "+1 ..."
do texto final, `BASE[raridade] + 3 x (clausulas - 1)`). **Correcao depois da
implementacao (Fase A):** a linha "Machado do Grulo" da primeira redacao foi
**removida**. O Machado do Lenhador nao ganha versao encontrada nesta leva —
o Fase 3 do roadmap so tem tres saidas pacificas pro Grulo (pagar, charada,
fazer rir), nenhuma "vencer na luta". Inventar um drop de vitoria por forca
contradiria o proprio "todas as saidas sao certas" da Ponte dos Trolls; o
Broche do Troll (secao 10, ligado ao riso) continua sendo a unica recompensa
de equipamento do Grulo. Adaga da Serpente e Cajado da Bruxa Espinho
reclassificados de "raro" pra "epico" — a regra da secao 5 e clara: recompensa
de guardiao unico e sempre epico e preco 0, "raro" e so pra drop probabilistico
de bicho comum.

**Correcao da rodada 3:** "contra criatura de espinho", "contra criatura de
nevoa" e "contra armadura" eram categorias inventadas, sem base no jogo.
Trocadas por: nome da criatura de verdade (Lobo de Nevoa, Cavaleiro de
Cinzas, Serpente do Pantano — todas do `BESTIARIO` de verdade), ou pela
condicao real que a propria descricao do bicho ja sugere (o telegrafo da
Bruxa, "o espinho racha o chao antes de subir", e literalmente PRESO).

As 3 lendarias (`lamina-aurora`, `escudo-espelho`, `arco-lua`) continuam como
estao — recompensa de historia principal, fora desta tabela de progressao
lateral.

## 10. Armadura e acessorio (redesenhados, presos ao mundo)

### Armadura

| id | nome | raridade | preco | de onde | bonus | mecanica real |
|---|---|---|---|---|---|---|
| colete-vila | Colete de Couro da Vila | comum | 3 | loja desde o inicio | resiste a ficar ASSUSTADO perto da Vila Semente | condicao: assustado/resiste |
| manto-teia | Manto de Teia | comum | 3 | loja, depois de trazer 2x Fio de Teia Doce | some de PRESO um turno mais cedo | condicao: preso/encurta |
| capuz-nevoa | Capuz de Nevoa | incomum | 7 | loja, depois de trazer 2x Presa de Nevoa | fica ESCONDIDO com mais facilidade de noite ou na neblina | condicao: escondido/concede |
| couraca-cinza | Couraca de Cinza | raro | 13 | loja, depois de trazer 4x Cinza de Armadura | QUEIMANDO dura 1 turno em vez de 2 | condicao: queimando/encurta |
| manto-pantano | Manto do Pantano | epico | 0 (guardiao) | vencer a Serpente | nunca fica PRESO na lama do Pantano | condicao: preso/resiste |

### Acessorio

| id | nome | raridade | preco | de onde | bonus | mecanica real |
|---|---|---|---|---|---|---|
| bracelete-palha | Bracelete de Palha Trancada | comum | 3 | loja, depois de trazer 3x Palha de Espantalho | fica ESCONDIDO com mais facilidade no campo aberto | condicao: escondido/concede |
| anel-teia | Anel da Teia | raro | 12 (ou drop 4% da aranha) | drop ou loja | sai de PRESO em 1 turno, nao importa a causa | condicao: preso/encurta |
| presa-lapidada | Presa de Nevoa Lapidada | raro | 14 (ou drop 5% do lobo) | drop ou loja | +1 contra o Lobo de Nevoa | teste: longe |
| pingente-sino | Pingente do Sino da Vila | incomum | 0 (recompensa de missao) | concluir "A missao do sino" (ja entregue, `53d5b63`) | +1 em teste de CORACAO, so na Vila Semente | teste: coracao-vila |

**Correcao da rodada 3:** todo bonus de armadura/acessorio que dizia
"veneno" (manto-teia, manto-pantano) foi trocado por PRESO — a teia e a
lama prendem de verdade, veneno nao existe no jogo. "Escapar de emboscada"
(anel-teia) e "se esconder"/"passar despercebido" (capuz-nevoa,
bracelete-palha) viraram concede/encurta em cima de PRESO e ESCONDIDO, as
duas condicoes reais mais proximas do que a descricao ja queria dizer.
"Coragem"/"susto" (colete-vila, pingente-sino) viraram ASSUSTADO — o
proprio nome da condicao ja e o oposto de "coragem". "Contra criatura de
nevoa" (presa-lapidada) virou o nome do bicho de verdade.
| broche-troll | Broche do Troll | epico | 0 (guardiao) | resolver o Grulo fazendo ele rir (uma das 3 saidas da Fase 3) | +1 pra fazer rir e evitar briga |

`pingente-sino` e o gancho pedido na primeira rodada: da peso de verdade a
uma missao que ja existe, sem inventar uma nova so pra ter recompensa.

## 11. Interface, icones e animacao

Sem mudanca de plano desde a primeira rodada — a reescrita desta rodada e de
**conteudo**, nao de mecanica de tela. Resumo (detalhe continua valendo):

- MOCHILA vira grade de slots com contador (material e consumivel
  empilham); hover reaproveita `mostrarDica()`; toque abre Usar/Equipar/
  Examinar/Vender (novo, porque agora ha material que so serve pra vender).
- Icone novo por item desta rodada: 7 armas encontradas + 5 armaduras + 5
  acessorios + 5 materiais = 22 icones novos. Contorno de 1px entra nesta
  leva (pendencia ja conhecida). Icone de mochila redesenhado junto.
- Trocar de arma ja e de graca (ponto de encaixe existente); armadura como
  camada de sprite **continua gap real**, ver secao 12.
- Vender material: mesma animacao de "usar" (some da mochila), com moeda
  subindo — reaproveita o icone de moeda que ja existe.

## 12. Mudancas de dado necessarias (`estado.ts` e `conteudo.ts`)

- `mochila: string[]` -> `Record<string, number>`, com migracao de save
  antigo (array vira contagem 1 cada).
- Novo `equipamento: { armadura: string | null; acessorio: string | null }`
  em `estado().heroi`.
- `Criatura.larga` muda de `string[]` para uma lista com chance:
  `{ id: string; chance: number }[]` — **exceto** guardioes unicos, cujo
  drop de historia continua garantido (100%, sem precisar de rolagem).
- `Criatura` ganha `unico?: boolean` (secao 8) — sem isso, drop por
  porcentagem e drop de historia garantido nao tem como conviver no mesmo
  campo.
- Novos tipos em `conteudo.ts`: `Material = { id, nome, preco, raridade,
  origem: string /* id da criatura */, texto }`, `Armadura` e `Acessorio`
  com o mesmo formato de `Arma` (`bonus: string`, mais `contexto: string`
  pra alimentar `modificadorDeEquipamento`, secao 6).
- `guardar(item, quantidade = 1)` incrementa em vez de so inserir.
- `usar(item)`, `equipar(slot, itemId)`, `venderMaterial(item)` novos.

## 13. O que fica projetado, nao implementado (Fase 6, fora deste plano)

Sem mudanca desde a primeira rodada: slot de item na barra de combate,
`TipoAcao` ganhando `"item"`, economia de consumo real em luta — tudo
projetado em `docs/11-combate-e-magias.md`, nada implementado aqui.

## 14. Fases de entrega

- **Fase A — dados, FEITA (2026-09-05).** `conteudo.ts`: `Raridade`, `Arma`
  ganhou `raridade?/contexto?/origem?` (6 armas encontradas novas), `Material`/
  `MATERIAIS` (4), `Armadura`/`ARMADURAS` (5), `Acessorio`/`ACESSORIOS` (5),
  `Criatura.larga` virou `{id, chance}[]`, `Criatura.unico?`, `acharMaterial/
  acharArmadura/acharAcessorio`. `estado.ts`: `mochila` virou `Record<string,
  number>` (com migracao de save antigo em `abrirEspaco`), `heroi.equipamento`
  novo, `guardar()` agora soma quantidade, `usar/equipar/venderMaterial` novos.
  Ajustados os dois pontos que liam a forma antiga: `condicoes-de-fala.ts`
  (`comItem`) e `Combate.ts` (drop de `larga`, agora rola a chance e pula pra
  guardiao unico). `npm run build`, `criatura` e `conferir` verdes. **Sem UI,
  sem arte** — MOCHILA continua placeholder, nenhum icone novo desenhado
  ainda (isso e Fase B/C).
- **Fase A, correcao FEITA (2026-09-05, mesma conversa).** `Arma.contexto?`
  virou `Arma.mecanica?: BonusDeEquipamento`; `Armadura.contexto`/
  `Acessorio.contexto` viraram `mecanica: BonusDeEquipamento` (obrigatorio).
  Novo tipo `BonusDeEquipamento` (`{tipo:"teste", contexto}` ou
  `{tipo:"condicao", id: IdCondicao, efeito}`), importando `IdCondicao` de
  `sistemas/condicoes.ts` (import de tipo, mesmo padrao que `Marca` ja
  usava). Todo bonus que inventava categoria solta ("veneno", "criatura de
  espinho", "criatura de nevoa", "contra armadura") foi reescrito pra usar
  uma condicao real ou nomear a criatura de verdade — detalhe item a item
  nas secoes 6/9/10 acima. `npm run build/criatura/conferir` verdes de
  novo.
- **Fase B — mochila de verdade, FEITA (2026-09-05).** A aba MOCHILA de
  `Ficha.ts` deixou de ser placeholder: lista todo item de `estado().mochila`
  (via `acharQualquerItem()`, novo em `conteudo.ts` — resolve id contra
  LOJA/MATERIAIS/ARMADURAS/ACESSORIOS/ARMAS, ou cai pra "item de historia"
  com o id humanizado quando nao ha ficha, tipo `pano-goblin`). **Sem grid
  nem hover**, de proposito: reaproveita os MESMOS tres tipos de `Bloco` que
  EU/PODERES/MENU ja usavam (titulo com contagem, texto, botao) em vez de
  inventar UI nova — a descricao fica sempre visivel (melhor pra toque do
  que hover teria sido, e o projeto ja prioriza toque sobre mouse). Acao por
  categoria: consumivel com efeito ligado (so Pocao de Morango e Pocao
  Grandona, via `sistemas/consumiveis.ts` novo — os outros dez da LOJA
  mostram "(sem efeito fora de combate ainda)", sem botao, em vez de fingir);
  material ganha "VENDER 1 (+N moedas)" (`venderMaterial()`); armadura/
  acessorio ganham EQUIPAR/DESEQUIPAR (`equipar()`, dois slots
  independentes); arma encontrada e item de historia ficam so-leitura (arma
  avisa que trocar fora da criacao ainda nao existe — gap de sprite real,
  ver Fase C). Testado ao vivo (`vite preview` numa porta separada, pra nao
  disputar com o dev server de outra sessao nesta pasta): posse editada no
  save, USAR encheu coracao e descontou 1 unidade, VENDER somou moeda e
  descontou material, EQUIPAR/DESEQUIPAR alternou os dois slots sem
  conflito, item de historia sem ficha mostrou nome humanizado. Nenhum
  icone novo (nao existe ainda, e continua sendo Fase C) — cada item so
  mostra nome e texto. `npm run build/criatura/conferir` verdes.
  **Conferido antes de mexer:** a worktree `ambiente/ficha` estava parada
  (zero mudanca nao commitada, ultimo commit `23c664f`, bem atras do
  `principal`) — sem ninguem pra avisar de verdade, mas registrado aqui pra
  quem retomar aquela pasta saber que `Ficha.ts`/`estado().mochila` mudaram.
- **Fase C — arma, PARCIAL (2026-09-05).** Trocar arma fora da criacao **das
  5 armas com sprite de verdade** (`config.ts`, `SPRITE_DA_ARMA` — mapeia
  `Arma.id` pra chave do desenho; so "espada-curta" diverge de "espada").
  `Ficha.ts` mostra EMPUNHAR/DESEMPUNHAR pra essas 5, e mantem a mensagem
  so-leitura pras outras 6 "encontradas" + escudo/machado/adaga/lendarias
  (equipar sem desenho quebraria a camada visual do heroi). Testado ao vivo
  (`vite preview`): cajado e arco alternam certo (o mesmo `heroi.armaSprite`
  so guarda um por vez, empunhar o segundo desempunha o primeiro sozinho),
  adaga continua so-leitura. **Ainda faltam da Fase C:** o gancho de
  "trazer material pro Seu Cominho" nos dialogos — **achado novo, muda a
  conta:** nao ha cena de loja nenhuma no jogo ainda (`LOJA`/`ARMAS` sao so
  dado), entao "comprar depois de trazer material" nao tem onde acontecer
  de verdade por enquanto; e os 22 icones + contorno de 1px, que dependem
  da skill `desenhar-sprite` e do pipeline Python (`arte/ui.py`) — trabalho
  de arte separado, nao encaixa no mesmo tipo de edicao deste plano.
  `npm run build` verde.
- **Fase D, dependencia externa a este plano:** o modificador de teste em
  `rolar()` (secao 6) so vale a pena implementar quando a Fase 1 (roadmap)
  chegar nos modificadores do manual — sem isso, o bonus de item fica
  "prometido" na Ficha sem efeito numerico. Sprite de armadura como camada
  de corpo tambem fica aqui (depende da resolucao de sprite, ainda em
  aberto). Uso de item em combate continua Fase 6 (secao 13).
- **Fase E — a mochila virou slot (2026-09-05), FEITA.** A pedido do Hugo
  ("slot com icone, hover, tamanho de mochila tipo Stardew/Zomboid, jogar
  fora, mudar de lugar, botao direito pra usar"): reformulacao real, nao
  incremento — a lista de texto da Fase B virou grade de slot com icone.
  Detalhe completo na secao 16.

## 16. A mochila vira slot (Fase E)

**Por que reformular em vez de so acrescentar:** a Fase B/C jah entregava
mochila funcional (usar/vender/equipar), mas como LISTA de texto — cada item
uma linha com nome, descricao sempre visivel, botao de acao. O Hugo pediu
o modelo Stardew Valley/Project Zomboid: grade de slot com posicao fixa,
icone em vez de nome, descricao so no hover, arrastar pra trocar de posicao,
botao direito pra usar direto. Isso muda o MODELO DE DADO (contagem por id
vira slot por posicao) e a interacao inteira, entao vira secao propria em
vez de mais uma linha na Fase C.

### Icones novos: `arte/itens.py`

Pipeline separado de `ui.py` (interface generica) e `icones.py` (retrato/
acao/dado de combate) — item de mochila e um terceiro assunto, mesma logica
que ja separava os outros dois. Mesma tecnica de `icones.py` (bloco de 16x16
letras + LEGENDA), consultada a skill `desenhar-sprite` antes de desenhar
qualquer coisa.

43 icones ao todo: os 26 itens da Fase A (consumivel/material/armadura/
acessorio) mais 17 de arma. As armas usam **8 formas-base** (uma por TIPO —
espada, escudo, arco, cajado, martelo, machado, adaga, funda), e as 3
lendarias + 6 encontradas sao a MESMA forma com cor trocada
(`com_cores()`), nao redesenhadas do zero — o mesmo principio que o jogo ja
usa pra roupa/cabelo (silhueta fixa, cor por cima). Gerados, ampliados e
OLHADOS contra o painel-creme de verdade (nao contra grama, que e onde o
personagem se julga, nao onde item se julga) antes de aceitar — 3 primeiras
tentativas (corda, lanterna, biscoito) liam mal e foram redesenhadas depois
de ver o contact sheet ampliado. Indice em `src/sistemas/icones-itens.ts`
(`ICONE_ITEM`), textura carregada em `Boot.ts` como `"itens"`.

### Mochila com tamanho (Stardew/Zomboid)

`Mochila`/`MOCHILAS` novo em `conteudo.ts`: pequena (8 slots, gratis, o
heroi comeca com ela), media (16, 15 moedas), grande (24, 30 moedas) — os
nomes/precos sao provisorios, o Hugo pode trocar. `estado().mochilaAtual`
guarda qual esta equipada; `comprarMochila()` em `estado.ts` troca pra uma
maior (nunca menor) preservando o conteudo dos slots que ja existiam. **Sem
cena de loja pra chamar isto ainda** — mesma pendencia da secao 7, a funcao
esta pronta e esperando.

### O slot substitui a contagem

`estado().mochila` mudou de `Record<string, number>` pra
`SlotDaMochila[]` (`{item, quantidade} | null`, um por posicao,
comprimento = `capacidadeDaMochila()`). `abrirEspaco()` agora migra TRES
formatos possiveis (lista de posse crua -> dicionario de contagem -> slot),
cada save abrindo no formato que tiver e saindo no formato novo. Se um save
tinha mais pilha de item do que a mochila atual comporta, a mochila migrada
cresce pra caber tudo — perder item na migracao seria pior que uma mochila
"cheia demais pro tamanho dela" por um tempo.

Novo em `estado.ts`: `moverItem(de, para)` (troca dois slots, ou empilha se
for o mesmo item), `jogarFora(indice, quantidade)` (descarta sem moeda —
diferente de `venderMaterial`).

### A grade em `Ficha.ts`

MOCHILA e a UNICA pagina que nao usa o sistema de `Bloco`/pilha generico
(que continua servindo EU/PODERES/MAGIAS/DIARIO/MENU sem mudar nada) — grade
de icone e outra forma de conteudo, nao lista de texto. `desenharMochila()`
desenha um slot por posicao (fundo encaixado + icone + numero se
empilhado), mais uma zona "ARRASTE ATE AQUI PRA JOGAR FORA".

Interacao por gesto, pensada pra funcionar igual no mouse e no dedo:

- **Hover (mouse) ou toque simples (dedo):** mostra a dica — nome,
  descricao/bonus, de onde vem. A mesma informacao que os botoes EQUIPAR/
  USAR/VENDER mostravam por extenso na Fase B, agora sob demanda.
- **Arrastar** (mouse ou dedo, com um limiar de 6px pra distinguir de toque
  parado): pega o item, solta em outro slot troca/empilha os dois, solta na
  zona de jogar fora descarta.
- **Botao direito (mouse) ou toque longo ~450ms (dedo):** usa a acao rapida
  da categoria — a MESMA logica que os botoes da Fase B faziam (usar
  consumivel com efeito, vender material, equipar/desequipar armadura ou
  acessorio, empunhar/desempunhar arma com sprite). So arma sem sprite
  proprio continua sem acao (mesmo gap de sempre, ver Fase C).

**Correcao de um bug encontrado ao testar:** a primeira versao ancorava a
dica SEMPRE acima do slot (igual o combate faz com a barra de acao no
rodape) — como a grade da mochila fica logo abaixo das abas, a dica vazava
por cima e cobria os botoes EU/PODERES/etc. Trocado pra ancorar abaixo do
slot (a mochila tem folga embaixo — zona de jogar fora, FECHAR — que o
combate nao tem).

**Testado ao vivo** (`vite preview`): hover mostra a dica certa; arrastar um
item pra um slot vazio troca de posicao (conferido no save, indice a
indice); arrastar pra zona de jogar fora remove o item sem dar moeda;
botao direito usa a pocao (coracao encheu, quantidade descontou) sem abrir
o menu do navegador (`disableContextMenu()`); os dois slots de equipamento
(armadura/acessorio) continuam independentes. `npm run build/auditar/
conferir/contraste` verdes — `auditar` inclui `11-janela-mochila` (grade
com 8 slots vazios) com 0 problema de sobreposicao/transbordo.

**O que fica pra depois, de proposito:** arrastar item pra FORA da janela
(largar no mapa) — a mochila so sabe jogar fora dentro da propria zona
marcada, nao existe ainda "item largado no chao" como objeto do mundo.
Animacao de picape/uso (o item some/aparece na hora, sem transicao) —
puro polimento, nao muda nenhum dado.

## 17. Fase F — layout consistente, menu de acoes, lixeira animada, apanhar do chao

Pedido do Hugo depois de ver a Fase E rodando: a mochila melhorou, mas falta
polimento de verdade — altura dos elementos inconsistente na ficha inteira,
tooltip mais completo, botao direito/toque longo abrindo um MENU de acoes em
vez de disparar uma so, zona de jogar fora com lixeira animada, e o item
jogado fora precisa cair no chao de verdade (o que a secao 16 ja deixou
registrado como pendente). Aqui esta o mapeamento contra o que existe hoje,
sem implementar nada ainda — so plano.

### 17.1. Alturas inconsistentes na ficha (nao so a mochila — as 5 paginas
### que ainda usam Bloco/pilha)

**O que existe:** `Ficha.ts`, `alturaDoBloco()` — cada tipo de `Bloco` tem
uma altura diferente e sem relacao entre si: `titulo` sem valor usa
`TAMANHO.linhaTexto` (10px), `titulo` COM valor (a chapa dourada do numero)
usa `ALTURA_CHIP` (12px), `texto` usa 10px POR LINHA, `chips` usa
`alturaDosChips()` (tambem 12px de base), `acao` (botao) usa `TAMANHO.botao`
(16px, fixo — e o alvo minimo de toque, nao pode encolher). Quatro numeros
diferentes (10/12/12/16) competindo na mesma pilha e o que da a sensacao de
"altura parecida mas não igual" que o Hugo notou — sobra em alguns, aperta
em outros.

**Proposta:** duas mudancas, uma de MEDIDA e uma de DISTRIBUICAO:

1. **Unificar o que pode ser unificado.** `titulo` sem valor sobe de 10 pra
   12px (mesma do `titulo` com valor e dos `chips`) — sao todos "uma linha
   de destaque", nao "uma linha de leitura corrida" como `texto` (que
   continua 10, porque e paragrafo, e paragrafo precisa de mais linha na
   tela, nao de linha mais alta). `TAMANHO.botao` continua 16 sempre — e
   contrato de alvo de toque (`docs/07-design-system.md`), mexer nisso
   quebraria o dedo de crianca em qualquer botao do jogo, nao so na ficha.
   Isto e mudanca de UM numero em `alturaDoBloco()`, sem tocar layout.
2. **Distribuir o sobra vertical, em vez de empilhar tudo colado no topo.**
   `pilha()` (`design.ts`) so tem `reservar()` (anda pra baixo) e
   `restante()` (quanto sobrou) — nunca reparte o sobrado entre os grupos.
   Hoje uma pagina curta (MAGIAS, DIARIO com uma missao so) fica com o
   conteudo grudado no topo e um vazio grande embaixo, o que reforca a
   sensacao de "elementos maldistribuidos". Proposta: `design.ts` ganha
   `distribuirFolga(area, grupos, gapMinimo)` — mede a altura de todos os
   grupos primeiro (a mesma conta que `Ficha.desenhar()` ja faz pra saber o
   que cabe), divide o espaco QUE SOBROU depois disso pelo numero de
   `gaps` entre grupos (nao dentro deles — um titulo e o texto embaixo dele
   continuam colados, isso e o proprio contrato de "grupo" que o comentario
   de `Ficha.ts` ja protege), e devolve um gap maior que `ESPACO.md` pra
   cada `pilha().reservar()` entre grupos usar. Pagina cheia (PODERES, 3
   grupos que ja enchem a tela) fica exatamente igual a hoje — a folga so
   aparece quando sobra espaco de verdade.

### 17.2. Tooltip mais completo

**O que existe:** `mostrarDicaMochila()` mostra nome + descricao/bonus +
origem (quando tem). Nao mostra categoria, raridade nem preco.

**Proposta:** acrescentar uma segunda linha de metadado, discreta (cor
`COR.tintaSuave`, tamanho 8), entre o nome e a descricao:
`CATEGORIA · RARIDADE` (ex.: "MATERIAL · RARO"), e quando o item tiver
`preco > 0`, uma terceira linha `Vale N moedas` (material) ou `Custou N
moedas` (arma/armadura/acessorio comprado — so decorativo, nao é preco de
recompra). `acharQualquerItem()` (`conteudo.ts`) ja devolve `raridade` pra
material/armadura/acessorio/arma — so falta ler no tooltip. **Item de
historia continua sem essas linhas** (nunca teve preco nem raridade, e
inventar uma pra ele contradiria a propria regra da secao 5: raridade e
preco sao coisa de item de LOJA/monstro, nao de missao).

### 17.3. Botao direito / toque longo abre MENU, nao dispara acao direto

**O que existe:** `acaoRapida(indice)` decide sozinha UMA acao pela
categoria do item (usar OU vender OU equipar OU empunhar) e executa na
hora. Pedido do Hugo: mostrar as OPCOES e deixar escolher — mais seguro
(sem risco de vender sem querer) e mais descobrivel (o jogador ve o que
pode fazer, nao decora um gesto por categoria).

**Proposta:** `acaoRapida` vira `abrirMenuDeAcoes(indice)`, que desenha uma
pilha pequena de botoes creme (reusa `botao()` de `sistemas/botao.ts`, o
MESMO que a pagina MENU ja usa) ancorada perto do slot, uma linha por acao
valida daquela categoria:

| categoria | acoes no menu |
|---|---|
| consumivel, com efeito e coracao nao cheio | USAR |
| consumivel, sem efeito OU coracao cheio | (nenhuma — continua so a dica) |
| material | VENDER 1 (+N moedas) |
| armadura/acessorio | EQUIPAR ou DESEQUIPAR (o que for oposto do estado atual) |
| arma, com sprite | EMPUNHAR ou DESEMPUNHAR |
| arma, sem sprite / historia | (nenhuma) |
| **qualquer categoria com quantidade > 0** | JOGAR FORA (novo — ver 17.4/17.5) |

Cada categoria ganha UMA acao especifica (ja existente) mais JOGAR FORA
(nova, universal). Tocar fora do menu, ou num slot vazio, fecha sem fazer
nada — o mesmo padrao de "clicar fora fecha" que outras janelas do jogo ja
usam (a propria Ficha fecha em Esc, por exemplo). Left-click/toque simples
continua mostrando so a DICA (17.2); o menu so abre pelo gesto rapido.

### 17.4. Zona de jogar fora: icone de lixeira + destaque ao arrastar por cima

**O que existe:** um retangulo `painel-creme` com o texto "ARRASTE ATE AQUI
PRA JOGAR FORA". Funciona, mas e so texto — sem icone, sem reacao ao
arrasto passar por cima.

**Proposta:**
- **Icone novo: lixeira**, em `arte/ui.py` (e chrome de interface, nao item
  de jogo — mora com `mochila`/`livro`/`lupa`, nao em `arte/itens.py`).
  Silhueta simples: balde trapezoidal com tampa, na mesma tecnica de
  `i_mochila()` (ret + contorno manual). Gerado, ampliado e OLHADO antes de
  aceitar, mesma disciplina da Fase E.
- **Destaque ao arrastar por cima:** `aoMoverPonteiro()` ja roda a cada
  frame durante o arrasto — passa a checar, alem do slot, se o ponteiro
  esta dentro de `zonaJogarFora` e trocar o tint do icone da lixeira pra
  vermelho (`COR.vermelho`, ja existe na paleta) enquanto estiver por cima,
  voltando ao tom normal quando sair. Mesmo espirito do "so mexe em
  posicao/cor, nunca reinventa" de `interativo.ts`, so que aqui e o proprio
  chamador que decide (a lixeira nao e um widget generico, e um alvo de
  drop especifico).
- **Tween ao soltar:** um "mastigada" rapida (escala 1 -> 1.15 -> 1, ~120ms)
  no icone da lixeira quando o item e solto nela de verdade — feedback de
  "recebi", parecido com o tween que ja existe em outros lugares do jogo
  (ex.: o efeito de particula ao vencer bicho em `Combate.ts`).

### 17.5. Apanhar item do chao — o sistema novo

Esta e a peca que nao existe: hoje `jogarFora()` so tira da mochila, o item
simplesmente desaparece. O pedido e ele CAIR NO CHAO, visivel, apanhavel.

**Achado que muda a conta pra melhor:** o Mundo.ts ja tem exatamente a
peca que isto precisa — `Interagivel` (`x, y, chave, tipo, largura, altura,
obj`) e a lista `this.interagiveis`, o mesmo mecanismo que ja faz o bau,
as fogueiras e os NPCs funcionarem. Um item largado no chao e so mais um
`Interagivel`, com `obj` sendo `this.add.image(x, y, "itens",
ICONE_ITEM[item])` — **o MESMO icone que a mochila ja usa**, nenhum sprite
novo de "item no chao" precisa ser desenhado.

**Fluxo proposto:**
1. `Ficha.jogarFora(indice)` (a acao do menu 17.3) chama
   `estado().jogarFora(indice, quantidade)` (ja existe, so tira da
   mochila) E, alem disso, pede pro Mundo.ts largar o item de verdade:
   `(this.scene.get("Mundo") as Mundo).largarItemNoChao(item, quantidade)`
   — mesmo padrao de acesso entre cenas que `Ficha.fechar()` ja usa
   (`this.scene.resume("Mundo")`).
2. **Onde ele cai:** na posicao atual do heroi no mundo (`mundo.heroi.x/y`)
   — o jogador jogou fora "aqui", nao importa onde "aqui" seja.
3. **`Mundo.largarItemNoChao(item, quantidade)`** (metodo novo, publico):
   cria o sprite (`this.add.image(...)`), monta o `Interagivel`
   (`chave: \`item-largado:${proximoId++}\``, `tipo: "objeto"`), da um
   pulo pequeno (tween de y, ~200ms, "cai no chao") e entra em
   `this.interagiveis`.
4. **Apanhar:** `tentarInteragir()` ganha um caso especial ANTES do lookup
   generico em `DIALOGOS` (mesmo padrao que `fogueira` e `bau` ja usam,
   `Mundo.ts:491` e `:519`): `if (alvo.chave.startsWith("item-largado:"))`
   chama `guardar(item, quantidade)`, toca um som (reusa `"moeda"` — e o
   som generico de "ganhou alguma coisa" que o jogo ja tem, nao precisa de
   som novo), tira o sprite e o `Interagivel` da lista, sem abrir caixa de
   fala nenhuma (apanhar nao e conversa).
5. **Duracao: so a sessao do mapa carregado, de proposito, sem persistir
   no save.** Se o jogador jogar fora e sair do mapa sem apanhar, o item
   some pra sempre — e a MESMA logica de "fica pra depois, de proposito"
   ja registrada na secao 16, so que agora e uma escolha deliberada em vez
   de limitacao: jogar fora e uma decisao com peso de verdade (ninguem
   "guarda no bolso" um item largado e esperando por 500 anos), e isso
   poupa a complicacao real de precisar salvar "o que esta largado onde"
   no save (mudaria `Estado`, precisaria migrar, precisaria limpar
   quando expira...). Se o Hugo quiser persistencia depois, e decisao
   nova e separada, nao uma obrigacao escondida deste plano.
6. **O que NAO faz parte disto:** criatura largando item (bestiario
   `larga`) continua indo direto pra mochila/moeda, sem passar pelo chao —
   isso e um sistema DIFERENTE (recompensa de vitoria, sempre concedida) do
   que "jogar fora e poder mudar de ideia" (a janela curta de recuperar o
   erro). Misturar os dois faria sentido narrativo nenhum: o goblin nao
   "joga" a moeda no chao pra voce correr atras, ele solta ela ao morrer.

### 17.6. O que fica de fora deste plano, de proposito

- **Arrastar item da mochila pra FORA da janela direto pro mundo** (sem
  passar pela zona de jogar fora) — o pedido do Hugo fala em "o lugar onde
  a pessoa arrasta e solta" no singular (a zona), nao em soltar em
  qualquer lugar da tela. Fica pra quando/se ele pedir.
- **Pegar item do chao de volta pra dentro de um slot ESPECIFICO** (drag do
  mundo pra um slot da mochila) — apanhar empilha/ocupa o primeiro slot
  livre, igual `guardar()` sempre fez; escolher o slot ao apanhar e
  seletividade que ninguem pediu ainda.
- **Item largado sobrevivendo troca de mapa** — decisao explicita contra,
  17.5 item 5.

### 17.7. Sequenciamento

Quatro pedacos independentes, ordem sugerida por risco (do mais isolado ao
que toca mais cena):

1. **17.1 (alturas/distribuicao)** — so `design.ts`/`Ficha.ts`, zero
   dependencia de arte nova, maior efeito visual imediato em TODAS as
   paginas da ficha, nao so mochila.
2. **17.2 (tooltip)** — so `Ficha.ts`, dado ja existe (`raridade`/`preco`
   ja estao em `acharQualquerItem`).
3. **17.4 (lixeira)** — precisa de 1 icone novo (`arte/ui.py`), senao e so
   `Ficha.ts`.
4. **17.3 + 17.5 juntos** — o menu de acoes (17.3) e o unico lugar de onde
   JOGAR FORA passa a ser chamado, entao faz sentido entregar as duas
   juntas: o menu sem o chao de destino ficaria incompleto, e o chao sem o
   menu nao teria como ser acionado (hoje so o arrasto joga fora, e isso
   continua existindo em paralelo — arrastar pra lixeira tambem larga no
   chao, mesmo destino final, so o gesto de origem muda).

### 17.8. Entregue (implementacao)

**17.1 — so a unificacao de medida, sem `distribuirFolga`.** Implementado:
`titulo` sem valor subiu de 10 pra 12px, igual `titulo` com valor e `chips`
(`alturaDoBloco()`). **Achado que muda o proposto:** `distribuirFolga()` nao
faz falta — `Ficha.desenhar()` chama `janela(this, { alturaConteudo: usado,
... })`, e `janela()` sempre dimensiona a propria area pela altura do
CONTEUDO, nao por um teto fixo da tela. Nao ha "sobra vertical" pra
redistribuir: a janela encolhe (ou cresce) exatamente do tamanho de quem
esta dentro dela. O sintoma que o Hugo viu (paginas com alturas diferentes
entre si) era so a inconsistencia de MEDIDA mesmo, ja corrigida pelo item 1;
nao existe um segundo problema de distribuicao para resolver.

**17.2, 17.3, 17.4, 17.5 — todos implementados como planejado**, com um
ajuste: 17.4 (arrastar ate a lixeira) e 17.3/17.5 (JOGAR FORA pelo menu)
inicialmente ficaram com destinos diferentes — so o menu chamava
`Mundo.largarItemNoChao()`, o arrasto so descartava. Corrigido: os dois
gestos agora chamam o mesmo `Ficha.jogarItemFora(indice)`, que sempre
descarta da mochila E larga no chao.

**Testado ao vivo** (`vite preview`, save de teste isolado): menu abre no
botao direito sem fechar sozinho (bug de ordem de evento do Phaser corrigido
com a guarda `ignorarProximoFechamentoDeMenu` — o `pointerdown` do slot e o
`pointerdown` global da cena disparam no mesmo despacho sincrono, e o
segundo fechava o menu que o primeiro tinha acabado de abrir); USAR consome
a pocao e fecha o menu; arrastar ate a lixeira remove da mochila, acende o
icone vermelho durante o arrasto, e o item aparece de verdade no chao do
Mundo (`itensNoChao`); apanhar de volta funciona e devolve o item pro
primeiro slot livre. `npm run build/contraste/conferir` verdes. **Nao
rodei `auditar` desta vez** — o script quebrou num ponto anterior e
nao-relacionado (`botao nao encontrado: CONFIGURACOES`), de outra frente
que mexeu na tela de Pausa depois do merge do d20; os PNGs de
`ferramentas/telas/` deste commit continuam os de antes desta entrega.

## 18. Coordenacao necessaria

- `ambiente/ficha` e dona de `Ficha.ts`, `janela.ts`, `design.ts`,
  `icones.ts` — falar antes de tocar de verdade nas Fases B/C.
- Resolucao de sprite (16 vs 48px) em aberto — armadura como camada nova
  de corpo (Fase D) deveria esperar essa decisao fechar.
- **Nova:** o gancho de material-pro-Seu-Cominho (secao 7) toca
  `dados/dialogos.ts` e `dados/missoes.ts`, que a frente `falas-e-missoes`
  reescreveu recentemente (`53d5b63`) — conferir se ainda esta ativa antes
  de estender o dialogo do mercador.
