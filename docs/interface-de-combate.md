# Interface, cor e animacao do combate

Plano de melhoria. Nada aqui foi executado ainda. Escrito depois de olhar o
provador rodando (`?provador`), nao de imaginar como ele estaria.

O documento irmao, `docs/11-combate-e-magias.md`, decide **o que** o combate faz.
Este decide **como ele se parece e como ele se mexe**.

---

## 0. O diagnostico

O provador prova que o laco funciona: 11 de 11 conferencias passam. Mas ele esta
feio, e feio aqui nao e questao de gosto. Sao seis defeitos com causa identificada.

| # | O que esta errado | Causa |
|---|---|---|
| 1 | os circulos parecem bolha flutuando, nao marca no chao | **sao circulos, e centrados no meio do corpo** |
| 2 | nao da pra saber que tecla dispara cada slot | nao existe numero no slot |
| 3 | os seis slots parecem o mesmo botao seis vezes | borda de 1px, todos com o mesmo fundo creme |
| 4 | nao da pra saber quanto falta pra criatura desistir | nao existe indicador de vida nenhum |
| 5 | golpe e magia sao o mesmo desenho parado | so existe o quadro `conjura`, e ele serve pra tudo |
| 6 | o alvo do mouse e impreciso | o indicador segue o cursor cru, sem encostar em nada |

---

## 1. Os circulos: o erro e eles serem circulos

**Este e o defeito mais grave, e o mais barato de consertar.**

O jogo e top-down com perspectiva de tres quartos: os personagens sao desenhados
**em pe**, vistos de cima e um pouco de frente. Numa perspectiva assim, uma marca
**no chao** nunca aparece como circulo. Aparece como **elipse achatada**.

Hoje o provador desenha:

```ts
this.pincel.strokeCircle(hx, hy - 8, a.alcance);   // circulo perfeito, no meio do corpo
```

Sao dois erros no mesmo `1` de codigo:

- **circulo perfeito** -> o olho le como uma bolha em volta do heroi, no ar
- **`hy - 8`** -> centrado na barriga, e nao onde os pes encostam no chao

O conserto:

```ts
// elipse na razao 2:1, centrada no PE. Largura = alcance * 2, altura = alcance.
this.pincel.strokeEllipse(this.heroi.x, this.heroi.y, a.alcance * 2, a.alcance);
```

### E mais tres coisas que a elipse precisa

**Pontilhada, nao continua.** Anel continuo le como parede. O alcance nao e uma
parede: tocar fora dele funciona, so faz o heroi andar. Pontilhado diz "limite
sugerido" onde continuo diz "proibido". Desenhado como 24 arcos curtos com vao
entre eles.

**Respirando devagar.** Escala de 1,00 a 1,02 em 1,2s, ida e volta. O movimento
minimo e o que separa "elemento vivo, esperando voce" de "imagem congelada".

**Sob os personagens, sobre o chao.** Ja esta certo no provador: `setDepth(-500)`,
entre o tilemap (-1000) e os personagens (y). E o que faz a marca parecer pintada
na grama em vez de colada na lente.

---

## 2. A barra: numero, cor e estado

### 2.1 O numero de atalho

Cada slot ganha o numero no **canto de cima e a esquerda**, 8px, creme sobre um
quadradinho escuro de 7x7. E o padrao de todo jogo com barra de habilidade, e
existe por um motivo: e a unica coisa que ensina o teclado sem tutorial.

No toque ele tambem serve, de outro jeito: **numero e nome**. "O terceiro" vira uma
coisa que da pra falar em voz alta enquanto se joga junto.

O slot cresce de 20 para **22px** para caber o numero sem apertar o icone. A conta
refeita: em PERTO (256x160) o vao e 143px, com passo de 24 ainda cabem **6**. Nada
se perde.

### 2.2 A bandeja

Hoje os seis slots flutuam soltos sobre a grama. Falta o que agrupa: uma **bandeja**
de `painel-escuro` atras de todos, com 2px de folga em volta e alpha 0,85.

Isso resolve dois problemas de uma vez: os slots viram **um objeto** em vez de seis,
e o fundo para de mudar de cor conforme o mundo passa por tras.

### 2.3 As cinco caras de um slot

| Estado | Como se ve |
|---|---|
| pronto | `painel-creme`, borda de 2px na cor do tipo, icone cheio |
| escolhido | `painel-ouro`, **sobe 2px**, e a bandeja escurece o resto |
| em recarga | fatia de pizza escura por cima, icone a 40% |
| gasto na cena | tudo a 30%, e um `x` fino por cima |
| indisponivel | esmaecido, com cadeado, **mas com o nome ainda a mostra** |

**A borda vai de 1px para 2px.** Em 1px, na tela do iPad, a cor do tipo some.

### 2.4 Os grupos separados por espaco

Golpes, magias e skills ficam na ordem fixa, e o **vao entre grupos e 6px em vez de
2px**. Nenhuma linha, nenhum rotulo: so o espaco. E o jeito mais barato de dizer
"estes tres sao a mesma coisa" sem escrever nada.

### 2.5 Dois avisos que ninguem precisa olhar para receber

- **recarga terminou**: o slot pisca em ouro por 120ms. Da pra saber que a magia
  voltou sem tirar o olho do monstro.
- **slot em recarga tocado**: treme 1px, tres vezes, e toca o "pluft". Nunca um
  bipe de negado. Ja esta assim no provador.

---

## 3. A vida dos monstros

### 3.1 Coracao, nao barra

O RPG de mesa ja resolveu isso: **tudo tem coracao**, de 1 (goblin) a 10
(Brasanegra). O jogo nao precisa inventar barra de vida, precisa mostrar o que ja
existe.

```
        <3 <3 <>          <- dois cheios, um vazio
       .-''-.
       | oo |             <- o goblin
```

- pip de **4x4px**, 2px de vao, centrado sobre o sprite, 4px acima da cabeca
- cheio = vermelho da paleta; vazio = contorno de tinta
- **ate 5 pips**. De 6 para cima (so a Brasanegra, com 10) vira **duas fileiras de 5**

Numero nunca. `CLAUDE.md` e explicito, e coracao e a lingua que o Lele ja fala do
material impresso.

### 3.2 So aparece quando importa

A pesquisa e unanime num ponto desconfortavel: barra de vida em cima da cabeca
**vira o foco da atencao**, e o jogador passa a olhar o medidor em vez da luta. Com
oito goblins na tela isso vira poluicao pura.

Entao os pips **nao ficam sempre visiveis**:

| Aparecem quando | Somem quando |
|---|---|
| a criatura leva um golpe | 3s sem levar golpe |
| ela e destacada no modo de mira | o modo de mira acaba |
| o heroi chega a menos de 40px | ele se afasta |

Entram com fade de 120ms e um pulinho (`Back.easeOut`), saem com fade de 400ms.

### 3.3 O corpo tambem conta

Independente dos pips, a criatura **muda de jeito** conforme perde coracao, porque
e isso que faz o jogador olhar a criatura em vez do medidor:

- 1 golpe levado: pisca branco, recua
- **metade dos coracoes**: comeca a **tremer** de leve, 0,5px a 4Hz
- **ultimo coracao**: fica **piscando devagar** e o passeio dela acelera (ela quer sair)

---

## 4. As animacoes

### 4.1 O que a arte precisa, e nao tem

A folha de personagem tem 6 colunas (`parado`, `passoA`, `passoB`, `respira`,
`conjura`, `tonto`) e o `conjura` esta fazendo o papel de tudo. Faltam duas:

- **`ataque`**: o quadro do golpe, com o braco estendido
- **`machucado`**: o quadro de levar dano, encolhido

Isso mexe em `QUADRO` no `config.ts`, em `arte/pessoa.py`, em `arte/gente.py` e
**regera** `encaixes.json`. E o item caro desta lista, e pertence ao ambiente
`sprites`.

**A boa noticia ja esta paga:** o sistema de ponto de encaixe faz a arma seguir a
mao quadro a quadro. Quando o quadro de ataque existir, **a espada acompanha o
golpe sozinha**, sem ninguem escrever coordenada.

### 4.2 O que da pra fazer HOJE, so com codigo

Nenhum destes precisa de um pixel novo, e juntos eles mudam o jogo mais do que os
dois quadros acima.

| Animacao | Como | Quanto |
|---|---|---|
| **antecipacao** | o heroi agacha antes de agir: escalaY 0,92 e escalaX 1,08 | 90ms |
| **investida** | ele desliza 3px na direcao do alvo e volta | 120ms, `Quad.easeOut` |
| **impacto** | congela tudo, o alvo pisca branco e **achata** (escalaY 0,8) | 70ms |
| **recuo** | o alvo anda pra tras | 160ms, ja existe |
| **tremor** | a camera anda 1px | 90ms, ja existe |
| **onda de conjuracao** | uma elipse na cor da acao **cresce a partir do pe** do heroi e some | 320ms |
| **projetil** | um ponto de 2px viaja ate o alvo, com rastro de 3 pontos que apagam | 180ms |
| **estrelinhas** | 3 pontos saltam quando a criatura desiste | 400ms, `Back.easeOut` |
| **poeira** | ja existe, para o golpe no vazio | 300ms |
| **slot apertado** | escala 0,9 e volta | 80ms |

**A onda de conjuracao e a de melhor retorno.** Uma elipse que cresce do pe do heroi
na cor da magia, em 320ms, e a diferenca inteira entre "o personagem parou" e "o
personagem lancou uma magia". Custa dez linhas de `Graphics` e um tween.

### 4.3 A regra de curva

Nada linear. `Quad.easeOut` para deslizar, `Back.easeOut` para o que salta,
`Sine.easeInOut` para o que respira. Movimento linear e o que faz animacao caseira
parecer caseira, e e de graca consertar.

### 4.4 A regra dos quadros

Em pixel art, **um pixel de diferenca ja e squash**. O agachar antes do golpe nao
precisa de desenho novo: 1px mais baixo e 1px mais largo, e o corpo inteiro ja diz
"vem coisa". E o que o Celeste faz com a Madeline.

---

## 5. Cor: uma lingua, nao enfeite

Hoje a cor da barra nao significa nada: seis slots creme iguais.

| Onde | Cor | Quer dizer |
|---|---|---|
| borda do slot de golpe | `tintaSuave` | e forca do corpo |
| borda do slot de magia | **a `cor` da propria magia**, que `conteudo.ts` ja da | e a familia dela |
| borda do slot de skill | `ouro` | e raro, um uso por cena |
| borda do slot de item | `verde` | acaba de verdade |
| elipse de alcance | a cor da acao, 70% | e desta acao que estamos falando |
| area de impacto | a cor da acao, 20% preenchida | e aqui que bate |
| destaque de alvo valido | a cor da acao, piscando | este da |
| destaque de alvo fora de alcance | `tintaSuave`, 30% | este da tambem, andando ate la |
| pip de vida cheio | `vermelho` | resta isto |

**Cada par novo passa pelo `npm run contraste` antes de entrar.** A ferramenta ja
existe e mede a razao de contraste dos pares que se encostam. A regra do projeto e
contraste medido, nao opinado, e cor de interface sobre grama e exatamente o caso
em que o olho mente.

---

## 6. O cursor e a precisao

A queixa "melhorar onde o mouse esta, pra ser mais preciso" tem tres partes.

**1. O indicador encosta no alvo.** Hoje a marca segue o cursor cru. Ela passa a
**pular para os pes do alvo** quando o cursor chega a menos de 12px, e o alvo acende
junto. O jogador sente o alvo antes de clicar, e para de errar por 2px.

**2. O cursor vira mira.** No computador, no modo de alvo o ponteiro do sistema some
e no lugar dele entra uma cruz de 7x7 na cor da acao. Diz "estou mirando" sem
nenhuma palavra.

**3. No toque, o indicador sai de baixo do dedo.** O dedo tapa exatamente o que
precisa ser visto. Ele sobe 20px, com um risquinho ligando ao ponto de verdade.
Confirmar continua sendo o segundo toque, e errar de dedo nunca gasta a magia.

**E a linha de caminhada.** Se o alvo esta fora de alcance, sai uma linha pontilhada
do heroi ate ele. Diz "eu vou ate la primeiro" antes de acontecer, em vez de o
jogador descobrir vendo.

---

## 7. Ordem de execucao

> **A ordem que vale e a de `docs/plano-do-combate.md`.** Aquele documento e o
> quadro, e junta esta lista com a do outro. Esta aqui ficou como detalhe do que
> cada etapa quer dizer, nao como sequencia.

Do mais barato e mais visivel para o mais caro. Cada etapa e olhavel sozinha no
`?provador`.

| # | Etapa | Custo | O que muda na tela |
|---|---|---|---|
| 1 | elipse no chao, no pe, pontilhada e respirando | baixo | **o maior salto de qualidade da lista** |
| 2 | numeros de atalho, bandeja, borda de 2px, grupos separados | baixo | a barra vira uma coisa so, e ensina o teclado |
| 3 | encosto no alvo, cursor de mira, linha de caminhada | baixo | some a imprecisao |
| 4 | pips de coracao sobre a cabeca, com aparecer e sumir | medio | da pra planejar a luta |
| 5 | as dez animacoes de codigo da secao 4.2 | medio | o jogo passa a ter peso |
| 6 | curvas, cores e `npm run contraste` em tudo | baixo | acabamento |
| 7 | tremer e piscar da criatura ferida | baixo | a criatura conta a propria vida |
| 8 | quadros `ataque` e `machucado` na folha | **alto** | o golpe vira golpe |
| 9 | os ~30 icones de acao de verdade | **alto** | a barra deixa de ser rascunho |

As etapas 1 a 7 sao todas dentro do ambiente `combate` e nao dependem de mais
nenhum desenho. As 8 e 9 sao do ambiente `sprites`.

**Aviso de fronteira:** as etapas 2 e 4 mexem em componente de interface. No
provador elas ficam contidas, porque ele nao importa `Interface.ts` nem `design.ts`.
Quando forem para o jogo de verdade, `Interface.ts` e `design.ts` pertencem ao
ambiente `ficha`. Ver `docs/11-combate-e-magias.md`, secao 18, pergunta 6.

---

## Referencias consultadas

- [12 principles for game animation](https://www.gamedeveloper.com/game-platforms/12-principles-for-game-animation)
- [The 12 animation principles adapted for pixel art sprites](https://www.sprite-ai.art/guides/animation-principles)
- [Disney's 12 Animation Principles Applied to Games](https://gamejuice.co.uk/articles/disney-12-animation-principles-games)
- [Games don't need health bars](https://www.digitec.ch/en/page/games-dont-need-health-bars-32559)
- [HP displays on enemies or visual indicators?](https://gamedev.net/forums/topic/671489-hp-displays-on-enemies-or-visual-indicators/)
- [Targeting, League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/Targeting)
- [Spell Indicators, Ability Targeting Visualisation](https://forum.unity.com/threads/spell-indicators-ability-targeting-visualisation.421278/)
- [Game UI: design principles, best practices, and examples](https://www.justinmind.com/ui-design/game)
- [What are the best UI design practices for action, strategy, and RPG games?](https://www.linkedin.com/advice/0/what-best-ui-design-practices-action-strategy-rpg-bhrlf)
