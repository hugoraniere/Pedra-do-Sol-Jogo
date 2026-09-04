# O mundo que reage: superficies, condicoes, itens e progresso

Plano. Nada aqui foi construido ainda. E a camada que transforma o combate de
"bater ate acabar" em sistema: congelar o rio, acender a tocha, queimar a arvore,
molhar o inimigo antes de congelar.

Documentos irmaos: `docs/plano-do-combate.md` manda na ordem do trabalho,
`docs/11-combate-e-magias.md` tem as treze magias e o bestiario,
`docs/interface-de-combate.md` tem cor e animacao.

---

## 1. A ideia inteira em tres linhas

Ja existe no projeto o conceito de **MARCA**: a magia nao causa dano, ela
**imprime um verbo** no que toca (fogo, gelo, agua, luz, vento, planta...).

Falta so dizer **em que** ela imprime. Sao tres portadores, e nada alem disso:

| Portador | O que e | Quanto dura |
|---|---|---|
| **CHAO** | uma superficie na casa: agua, gelo, fogo, fumaca, mato | em turnos |
| **CRIATURA** | uma condicao: molhado, queimando, congelado, abencoado | em turnos |
| **OBJETO** | um estado: tocha apagada ou acesa, arvore inteira ou queimada | ate mudar |

**Uma tabela de reacoes, tres portadores.** E so isso. Toda a graca que vem
depois (molhar antes de congelar, o fogo andando pelo mato, a ponte de gelo
sumindo com o heroi em cima) sai dessa tabela, nao de codigo novo.

### O que ja esta pago, sem ninguem ter planejado

A busca de casas alcancaveis (`src/sistemas/alcance.ts`) pergunta a uma funcao
`passavel(tx, ty)` se da para pisar em cada casa. **Ela nao sabe por que.**

Entao, no dia em que a agua virar gelo, a ponte aparece nas casas azuis
**sozinha**, sem uma linha nova no sistema de movimento. O jogador ve o caminho
se abrir. Isso e consequencia de o combate ser por casas, e e o melhor argumento
que existe para ter virado por turnos.

---

## 2. As superficies do chao

Seis, e seis bastam. Cada uma **muda o custo de andar** e **imprime uma condicao
em quem parar nela**.

| Superficie | Nasce de | Dura | Andar | Em quem para nela |
|---|---|---|---|---|
| **agua** | o rio, gelo derretido, chuva | fixa | 2 casas de custo | fica **MOLHADO** |
| **gelo** | `gelo` na agua | 6 turnos | 1, mas escorrega | pode **ESCORREGAR** e perder a acao |
| **fogo** | `fogo` no que queima | 3 turnos | 1 | fica **QUEIMANDO** |
| **fumaca** | fogo encontrando agua ou gelo | 2 turnos | 1 | fica **ESCONDIDO** |
| **mato alto** | Cresce-Grama, e o tile que ja existe | 8 turnos | 2 casas de custo | fica **ESCONDIDO** |
| **brasa** | o que sobra do fogo | 2 turnos | 1 | 1 coracao se comecar o turno ali |

**Custo de movimento e a mecanica mais barata que existe.** Andar na agua custa
2 de 5, entao atravessar o rio a nado consome o turno inteiro. Congelar custa 1 e
o turno sobra para atacar. Nenhuma regra nova: e o mesmo orcamento de casas.

---

## 3. As condicoes: buff e debuff sao a mesma coisa

Nao existe sistema de buff e outro de debuff. Existe **condicao**, com duracao em
turnos, e ela conta para baixo no comeco do turno de quem a carrega.

### Debuff

| Condicao | Vem de | Dura | Faz |
|---|---|---|---|
| **MOLHADO** | agua, Bafo Gelado | 3 | congela em dobro, **nao pega fogo** |
| **QUEIMANDO** | fogo | 2 | perde 1 coracao no comeco do turno |
| **CONGELADO** | gelo em quem esta molhado | 1 | **perde o turno**. Fogo derrete na hora |
| **PRESO** | Cresce-Grama, Dedo Colante | 2 | movimento 0, mas ainda age |
| **ASSUSTADO** | Voz de Trovao, Sino Espanta-Monstro | 2 | anda para longe do heroi e nao ataca |
| **ATRAIDO** | Cheiro de Bolo | 3 | anda ate o cheiro e ignora o heroi |
| **CAIDO** | escorregar no gelo | 1 | perde a acao, movimento pela metade |
| **TONTO** | zero coracoes | 2 | nao age. Nunca e derrota |

### Buff

| Condicao | Vem de | Dura | Faz |
|---|---|---|---|
| **ABENCOADO** | Biscoito Magico | ate usar | **+1 no proximo dado** |
| **RAPIDO** | Bota do Vento | 3 | +3 casas de movimento por turno |
| **PROTEGIDO** | Escudo de Bolha | 3 ou 1 golpe | segura um golpe inteiro |
| **ESCONDIDO** | Sumir-Sumindo, mato, fumaca, Capa Camaleao | enquanto ficar | as criaturas nao te escolhem como alvo |
| **ILUMINADO** | Luzinha, Lanterna, tocha acesa | 20 | enxerga longe, e revela invisivel |

### A regra que faz tudo combinar

**Uma condicao pode mudar o que uma marca faz.** E aqui que mora a diversao, e
sao poucas linhas:

| Marca cai em quem esta... | Vira |
|---|---|
| `gelo` em **MOLHADO** | **CONGELADO na hora**, sem precisar de nada mais |
| `fogo` em **MOLHADO** | **nao queima**: vira fumaca e tira o molhado |
| `fogo` em **CONGELADO** | derrete: solta a criatura e faz agua embaixo dela |
| `agua` em **QUEIMANDO** | apaga, e deixa **MOLHADO** |
| `vento` em **QUEIMANDO** | piora: o fogo dura 1 turno a mais |
| `som-alto` em qualquer um | **ASSUSTADO** |

**Molhar antes de congelar** e a primeira combinacao que uma crianca descobre
sozinha, e e a que ensina que o jogo tem regras que se encaixam. Vale mais que
dez magias novas.

---

## 4. Os objetos que guardam estado

O mundo hoje e desenho parado. Objeto com estado e o que faz a Vila deixar de ser
cenario.

| Objeto | Estados | Muda com | O que faz |
|---|---|---|---|
| **tocha** | apagada, acesa | `fogo` acende, `agua` apaga | acesa da **ILUMINADO** em 3 casas, para sempre |
| **fogueira** | apagada, acesa | igual | ilumina, e poe `fogo` em quem encostar |
| **arvore** | inteira, queimando, queimada | `fogo`, `corta` | queimada **vira passavel**: abre caminho |
| **arbusto** | inteiro, quebrado | qualquer golpe, `fogo` | larga moeda, ou um bichinho |
| **teia** | inteira, queimada | `fogo` | queimada abre a passagem |
| **ponte quebrada** | quebrada, remendada | `conserto` | remendada vira passavel |
| **barril de agua** | cheio, quebrado | qualquer golpe | quebrado **espalha agua em 3 casas** |
| **sino** | parado, tocando | `som-alto`, golpe de metal | toca, e **ASSUSTA todo goblin da tela** |

O barril de agua e o sino sao os dois mais importantes desta lista, porque sao
**ferramentas que o cenario da de graca**: quebrar um barril antes de soltar o
Bafo Gelado e uma jogada que ninguem ensinou.

---

## 5. As tres cenas que voce pediu, passo a passo

### Congelar o rio

1. o heroi escolhe **Bafo Gelado** e toca uma casa de `agua`
2. rola 1d6 + ESPERTEZA. **OBA**: congela 3 casas em linha. **QUASE**: congela 1.
   **OPS**: sai so vapor, e o vapor esconde quem estiver perto
3. as casas viram superficie `gelo`, por **6 turnos**
4. **as casas alcancaveis se redesenham sozinhas** e a ponte aparece em azul
5. o heroi atravessa. Custo 1 por casa, nao 2: da para atravessar e ainda agir
6. no turno 6 o gelo derrete. **Quem estiver em cima cai na agua e fica MOLHADO**

O passo 6 e o que faz isso ser um sistema e nao um truque: a solucao tem prazo, e
o prazo esta a vista nos pontinhos da superficie.

### Acender a tocha

1. o heroi escolhe **Bola de Fogo** e toca o `objeto:tocha`
2. a tocha vira `acesa`, e nao tem prazo: fogo em tocha e para ficar
3. ela passa a dar **ILUMINADO** em 3 casas em volta
4. na caverna, isso dobra o alcance de visao. **E revela criatura invisivel**
5. `agua` na tocha apaga de novo, e o Lobo de Nevoa volta a se esconder

### Queimar a arvore

1. `fogo` na `arvore` -> ela vira `queimando` por 2 turnos
2. enquanto queima, **poe `fogo` em ate 1 casa vizinha por rodada**, e so no que
   e inflamavel: mato alto, teia, outra arvore. Grama comum e caminho nao pegam
3. depois de 2 turnos ela vira `arvore-queimada`: **passavel**, e abre um atalho
   que nao existia
4. quem estava colado nela ficou `QUEIMANDO`
5. `agua`, ou chuva, ou uma casa de gelo derretendo, apaga antes

---

## 6. Itens: a loja ja e o sistema, falta ligar

Os doze itens de `conteudo.ts` ja tem efeito escrito. Cada um vira uma **acao com
usos contados**, no mesmo tipo `Acao` da barra. Nenhum sistema novo.

| Item | Vira |
|---|---|
| Pocao de Morango | acao: +1 coracao |
| Pocao Grandona | acao: enche tudo |
| Biscoito Magico | condicao **ABENCOADO**, +1 no proximo dado |
| Bota do Vento | condicao **RAPIDO**, +3 casas por 3 turnos |
| Capa Camaleao | condicao **ESCONDIDO** |
| Lanterna Vaga-lume | condicao **ILUMINADO**, sem prazo |
| Pena da Fenix | passiva: cancela o **TONTO** |
| Sino Espanta-Monstro | marca `som-alto` em area: **ASSUSTADO** |
| Corda Saltitante | passa buraco, no mapa |
| Chave Mestra | abre fechadura, no mapa |
| Mapa Que Fala | diz para onde ir |
| Saco Sem Fundo | mais espaco na mochila |

**Item gasta de verdade**, porque foi comprado com moeda. E a unica coisa do jogo
que acaba, e e isso que faz a escolha de usar valer alguma coisa.

---

## 7. XP nao existe. Chama-se SELO, e ja esta pronto no papel

Nao inventar sistema de experiencia. O RPG de mesa ja resolveu:

> A cada **3 Selos de Heroi**, o jogador escolhe: **+1 coracao**, **+1 num
> atributo**, ou **uma habilidade nova**.

Isso e melhor que barra de XP por tres motivos, e nenhum deles e nostalgia:

1. **A recompensa e uma escolha, nao um numero.** O momento bom e decidir, e ele
   acontece a cada 3 selos, nao a cada 100 pontos.
2. **Nao existe barra para ficar olhando.** Tres selos cabem como tres icones no
   topo, e o terceiro acende.
3. **Premia o jeito de jogar, nao a quantidade.** Selo nao cai de matar goblin.

### Duas moedas, e elas fazem coisas diferentes

| | De onde vem | Para que serve |
|---|---|---|
| **Moeda** | luta vencida, bau, arbusto quebrado, peixe | comprar na loja. Flui |
| **Selo** | esperteza, e so | crescer de verdade. Raro |

### O que da selo

| Da selo | Nao da selo |
|---|---|
| resolver pela **fraqueza** da criatura | ganhar insistindo na porrada |
| descobrir uma fraqueza nova para o livro | fugir |
| fazer amizade com **Fala Bicho** | |
| resolver uma luta sem ninguem tomar golpe | |
| usar o cenario: o barril, o sino, a arvore | |
| aceitar que o ponto fraco atrapalhe (a regra da mesa) | |

Insistir **sempre funciona e nunca e punido**. So nao e premiado. E a diferenca
entre ensinar e castigar.

---

## 8. O que aparece na tela

Sistema que nao se ve nao existe. Cada portador tem um lugar fixo:

**Superficie no chao.** A casa ganha um veu na cor da superficie, 25% de opacidade,
mais uma textura simples (ondinha na agua, risco no gelo, ponto na brasa). Os
**turnos que faltam sao pontinhos no canto da casa**, igual a espera dos slots.
Nada de numero.

**Condicao na criatura.** Uma fileira de icones de 8x8 **logo abaixo dos coracoes**
que ja existem sobre a cabeca, com a mesma chapa escura atras. No maximo tres
visiveis; acima disso, um `+`.

**Condicao no heroi.** A mesma fileira, ao lado dos coracoes no topo. Buff em
dourado, debuff em vermelho, pela **moldura**, nao pelo icone: o icone diz o que e,
a moldura diz se e bom.

**Selos.** Tres selos no topo. O terceiro acendendo abre a tela de escolha.

**Sempre no comeco do turno.** Turnos dao um momento fixo para mostrar: as
condicoes contam para baixo, o queimando tira o coracao, e o jogador ve tudo isso
acontecer em ordem, uma coisa de cada vez. Em tempo real seria uma nuvem de
numeros. **Este e o segundo grande ganho de ter virado por turnos.**

---

## 9. As cinco regras que impedem virar caos

Superficie que se espalha e a mecanica mais divertida e mais perigosa desta lista.
Sem limite, o Baldur's Gate vira um incendio e o jogador perde o controle.

1. **Fogo so pega no que e inflamavel**, e no maximo **1 casa por rodada**. Grama
   comum, caminho e areia nao pegam. Mato alto, teia e arvore pegam.
2. **Nada se espalha para a casa de alguem sem um turno de aviso.** A casa vizinha
   pisca uma rodada antes. Sempre da para sair.
3. **Toda superficie tem prazo.** A unica coisa sem prazo no jogo e o que o
   jogador acendeu de proposito: a tocha e a fogueira.
4. **Nunca da para ficar encurralado.** Se todas as casas alcancaveis estiverem em
   fogo, a de menor prazo apaga. E uma regra feia no codigo e invisivel no jogo, e
   vale cada linha.
5. **Fora de combate nada se espalha.** Sem turno nao ha propagacao, so o que ja
   esta aceso continua aceso.

---

## 10. O tamanho disto, com honestidade

Isto e maior que tudo que ja foi construido no combate ate agora, e nao deve
comecar antes do **basico estar no jogo de verdade** (`docs/plano-do-combate.md`,
secao 1). Sistema de superficie em cima de um combate que ainda so existe no
provador e profundidade sobre alicerce que ninguem pisou.

Dito isso, a ordem por retorno, do mais barato ao mais caro:

| # | Etapa | Custo | Por que vale |
|---|---|---|---|
| 1 | **condicoes** com duracao em turnos, e o desenho delas | medio | e o motor de tudo. Sem ele nada aqui existe |
| 2 | **MOLHADO e CONGELADO**, e so eles | baixo | **a primeira combinacao que a crianca descobre sozinha** |
| 3 | **superficie de gelo na agua** | baixo | congelar o rio, e as casas se abrindo sozinhas |
| 4 | **objetos com estado**: tocha, arvore, barril | medio | o cenario vira ferramenta |
| 5 | **fogo, com as cinco regras de seguranca** | alto | e o mais divertido e o mais perigoso |
| 6 | **itens da loja como acoes com usos** | baixo | doze itens ja escritos, so ligar |
| 7 | **selos, e a tela de escolha a cada 3** | medio | e a progressao inteira do jogo |
| 8 | fumaca, mato, brasa, lama | medio | profundidade, depois que o resto provar |

**A etapa 2 sozinha ja muda o jogo.** Molhar e congelar, com dois icones e uma
linha na tabela, e a diferenca entre um combate onde se aperta botao e um combate
onde se pensa.

---

## 11. Em aberto

1. **Superficie pega o heroi tambem?** Se o fogo dele o queima, ha peso e ha erro
   de verdade. Se nao queima, e brinquedo. *Inclinacao: queima, com a regra 2 e a
   regra 4 protegendo de injustica.*
2. **Condicao empilha?** Dois `QUEIMANDO` viram um mais longo, ou dois? *Inclinacao:
   nunca empilha, so renova a duracao. Empilhar exige o jogador fazer conta.*
3. **A criatura usa o cenario?** Um goblin espertinho empurrando o heroi para o
   fogo e otimo, e tambem e o jeito mais rapido de a luta ficar injusta.
   *Inclinacao: so o Chefe faz isso, e so a partir da segunda aventura.*
4. **Chuva, vento e noite mudam o mapa inteiro?** Chuva apagando todo fogo e
   molhando todo mundo e uma mecanica de graca, ja que o motor e o mesmo.
   *Inclinacao: depois, e como evento de historia, nao como clima aleatorio.*

---

## Referencias consultadas

- [Elemental Surfaces, Baldur's Gate 3 Wiki](https://baldursgate3.wiki.fextralife.com/Elemental+Surfaces)
- [Baldur's Gate 3: All Elemental Surface Types](https://www.thegamer.com/baldurs-gate-3-bg3-elemental-surface-types-terrain-explained/)
- [One Of BG3's Smallest Features Has The Biggest Impact](https://screenrant.com/baldurs-gate-3-floor-hazards-environmental-effects-bg3/)
- [Baldur's Gate 3 elemental surface types, effects and status conditions](https://gamerant.com/baldurs-gate-3-elemental-surface-types-effects-status-conditions-bg3/)
- [Status effect](https://en.wikipedia.org/wiki/Status_effect)
- [Status Effects, TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/StatusEffects)
