# A interface do mouse

O cursor, o hover, o clique no mundo e a tela de atalhos.

Sem numero de proposito, pela mesma razao de `modelo-de-combate.md`: quando um
documento nasce numa frente paralela, nome sem numero e mais barato que negociar
o numero. Este e o documento da frente `ambiente/cursor`.

O ponto de partida medido esta em `13-analise-de-ui.md`. Este documento nao repete
aquelas medidas, continua de onde elas pararam.

## O que se decidiu, e o que isso custa

O jogo deixa de ter **botao A** e **disco direcional** desenhados na tela. No lugar
dos dois entra um modelo de apontar e clicar, que vale igual no dedo e no mouse:

- **toque curto no chao** anda ate ali, por caminho
- **segurar** anda continuamente na direcao do ponteiro, sem caminho nenhum
- **toque no alvo** age nele; se estiver longe, caminha ate ele e age ao chegar
- **teclado** continua andando com WASD e setas, e agindo com espaco e enter

E uma mudanca grande e ela tem um risco que precisa estar escrito: **sem o disco,
o caminho automatico vira a unica forma de andar no toque.** Se o A\* falhar, o
jogador trava, e travar e a unica coisa que este projeto nao aceita ("falha sem
humilhacao": o custo e material, nunca a perda de controle).

O que impede isso e o gesto de **segurar**. Segurar nao usa caminho: o heroi anda
na direcao do dedo, direto, e nao ha o que falhar. **E o disco direcional de volta,
sem desenho na tela: o dedo e o direcional, e o centro dele e o proprio heroi.**
Arrastar sem levantar o dedo, que e o que o `CLAUDE.md` defende sobre o disco,
continua existindo. Por isso tirar o disco e seguro.

## 1. O cursor

Sprite dentro do canvas, numa cena por cima de tudo, com
`input.setDefaultCursor("none")`.

**Por que nao o cursor de CSS.** O cursor de CSS vive em pixels de tela. O canvas
e ampliado por numero inteiro, 3x, 4x ou 5x (`sistemas/visao.ts`). Um cursor de
16 px do lado de arte ampliada 4x tem pixels quatro vezes menores que os do jogo:
parece ser de outro programa. Acompanhar exigiria um PNG por escala, e cursor
grande e mal tratado no Safari. Dentro do canvas o cursor vive na mesma grade de
pixel do resto, e ganha animacao, tint e distintivo de graca.

**O custo, que e real.** O cursor de canvas desenha um quadro atras do cursor do
sistema, uns 16 ms. Mitigacao: desenhar direto do evento de ponteiro, nunca do
`update()`, e **jamais** interpolar a posicao com tween.

**Posicao arredondada** para o pixel logico, coerente com o `roundPixels: true`
que o jogo ja usa. Em 4x o cursor anda de 4 em 4 pixels de tela. E o que faz ele
ler como parte do jogo, e nao como coisa do sistema operacional por cima. Se na
tela parecer ruim, soltar a posicao e uma linha.

### O vocabulario

O `modelo-de-combate.md` ja diz "Baldur's Gate em top-down". Naquele jogo **o
cursor e o tooltip**: ele muda de forma antes do clique, e e assim que o jogador
descobre o que a cena aceita. Mesma gramatica aqui.

Folha nova `arte/cursor.py` -> `public/assets/cursor.png`, celulas de 16x16:

| estado | desenho | quando |
|---|---|---|
| `normal` | seta de papel, contorno tinta de 1 px, sombra dura | padrao |
| `sobre` | a mesma seta, ponta acesa em ouro, sobe 1 px | sobre coisa interativa |
| `clique` | seta achatada 1 px, mais um anel de 3 quadros na ponta | ao apertar |
| `andar` | pegada ou bota | sobre chao que da para pisar |
| `falar` | balao de fala | sobre pessoa |
| `olhar` | a lupa | sobre objeto que fala mas nao se leva |
| `pegar` | mao abrindo e fechando | sobre bau, coisa que se pega |
| `longe` | o cursor do contexto, apagado, com um traco | interativo fora de alcance |
| `atacar` | espada, ou mira | desenhado agora, guardado para a frente do combate |
| `bloqueado` | seta com um X pequeno | chao que nao da para pisar |

**A linha `longe` e a mais importante da tabela.** "Fora de alcance" tem que
parecer diferente de "nao e interativo". Um cursor de fala apagado diz "sim, isso
e uma pessoa, chegue perto" — orientacao sem seta piscando, que e o que o
`CLAUDE.md` pede em "o espaco se explica sozinho".

**Contorno de 1 px em tudo.** E o que faz o cursor passar no `npm run contraste`
sobre grama e sobre painel de papel ao mesmo tempo. E exatamente o mesmo problema
que o `13-analise-de-ui.md` anotou sobre os 13 icones nao terem contorno.

## 2. Um estado de hover so, para tudo

Hoje cada widget reage do seu jeito, e metade nao reage:

| onde | ao passar o mouse hoje |
|---|---|
| `botao.ts` | toca `menu-foco` e **nao muda nada visualmente** |
| botoes do Titulo | mudam, porque `Titulo.ts` liga `pointerover` ao foco de teclado |
| botoes da Pausa | so o som |
| engrenagem de pausa | nada |
| "toque aqui para sortear" da Criacao | `setInteractive()` puro: nem mao, nem hover |

Ou seja: **hover de mouse e foco de teclado sao a mesma coisa no Titulo e coisas
diferentes no resto do jogo.**

Arquivo novo `src/sistemas/interativo.ts`. Todo objeto clicavel passa por ele e
ganha os mesmos quatro estados — repouso, sobre, apertado, desligado — e os
mesmos tempos:

- **sobre:** sobe 1 px, painel vira `painel-ouro` (ou contorno de 1 px em ouro,
  para icone), toca `menu-foco` com **debounce de uns 60 ms**. Sem o debounce,
  passar o mouse rapido por cinco botoes vira metralhadora.
- **apertado:** afunda 2 px, que ja existe, mais `menu-confirma` e o squash do cursor.
- **tudo entre 80 e 120 ms, sem easing que passa do ponto.** Pixel art andando de
  4 em 4 pixels de tela nao faz easing sutil: le como tremor. Estalo e o certo.

Depois disto, hover de mouse e foco de teclado sao o mesmo estado em toda tela.

## 3. O mundo responde ao ponteiro

`Mundo.ts` ja tem `interagiveis: { x, y, chave }[]`, montada com pessoas, objetos
com fala e o bau. Falta so alguem perguntar a ela onde o ponteiro esta.

- `pointermove` no mundo acha o interagivel mais perto, uns 12 px em coordenada de mundo
- **contorno de 1 px** no sprite: silhueta desenhada do proprio quadro, nao
  post-fx, porque a arte aqui e estrita
- **chapinha com o nome** acima, na fonte de 8 px sobre `painel-escuro`.
  `DIALOGOS[chave].quem` ja tem o nome; custa quase nada e e o maior ganho de
  "esse jogo me respeita" da lista
- fora do alcance do heroi: contorno apagado e cursor `longe`

So aparece quando o jogador aponta. Nao e HUD permanente, e nao e um "!" flutuando
em cima de todo mundo.

## 4. Andar clicando

### A malha de passagem

Uma por mapa, montada uma vez no `create()`, sem nenhuma coordenada na mao:

1. comeca do desenho do chao, marcando os tiles de `SOLIDOS`
2. carimba por cima as caixas de colisao dos objetos, que ja saem de
   `objetos.json` (`cw`, `ch`) e ja viram retangulo de fisica

Os mesmos numeros que fazem o heroi esbarrar fazem o caminho desviar. Se
divergirem, o heroi anda para dentro de uma parede.

A Floresta dos Sussurros tem 120 x 84 tiles, ou seja 10.080 casas. A\* com fila de
prioridade resolve isso em microssegundos: nao precisa de worker nem de cache.

O corpo do heroi e 10 x 6, menor que o tile de 16, entao nao precisa inflar a
malha. Mas a diagonal **nao pode cortar quina** entre dois solidos, senao o heroi
tenta atravessar o canto de uma casa e trava contra a fisica.

### Do caminho ao passo

- **Alisar depois de achar.** Sem isso o heroi anda em escadinha, porque A\* devolve
  casa por casa. Puxar a corda: descarta o ponto do meio quando o proximo esta em
  linha livre.
- **Cancelar e sagrado.** Qualquer direcao no teclado, ou um clique novo, corta o
  caminho na hora. O jogador nunca fica preso numa animacao.
- **Desistir sozinho.** Se o heroi nao avancou em uns 400 ms, o caminho e
  abandonado em silencio. Nunca "andando contra a parede para sempre".
- **Clicar num alvo longe** anda ate o alcance dele e **age ao chegar**. E isso que
  faz o apontar e clicar parecer inteligente em vez de burocratico.

### Segurar

Segurar o dedo ou o botao anda **na direcao** do ponteiro, sem caminho. A direcao
e a mesma conta de oito fatias que o disco fazia, so que o centro agora e o heroi
e nao um desenho no canto. Zona morta perto do heroi, senao ele treme parado.

Este e o caminho que nao pode falhar, e por isso e ele que autoriza tirar o disco.

## 5. Os atalhos, e a tela que os mostra

Uma lista so, em `src/dados/atalhos.ts`: `{ acao, teclas[], descricao }`.

- `sistemas/controles.ts` monta as teclas **a partir da lista**, em vez da string
  fixa `"W,A,S,D,UP,LEFT,DOWN,RIGHT,SPACE,ENTER,ESC,P"` de hoje
- a tela de atalhos desenha **a mesma lista**

Uma lista so quer dizer que um atalho **nao pode existir no codigo e faltar na
tela**. Se estivessem em dois lugares, ja estariam divergentes na terceira semana.

Contrato novo em `ferramentas/verificar.mjs`, na mesma forma do contrato de som:
toda acao declarada e lida por `controles.ts`, e toda tecla lida esta declarada.

Onde a tela mora: aba nova na `Pausa`, que ja tem o padrao `menu` / `config`.
Quando a frente `ambiente/ficha` entregar a janela unica com abas, isto vira uma
aba de la. **Anotado como pedido entre frentes no `FRENTES.md`, para nao ser
construido duas vezes.**

## 6. O que sobra da tela

Sem o disco e sem o botao A, dois cantos de uma tela de 320 x 192 ficam livres.
Nao se enche nada por enquanto: densidade neste projeto e o que acontece no mundo,
nao no HUD. A engrenagem de pausa fica, e a caixa de fala ganha a base inteira.

A fala continua avancando com um toque em qualquer lugar: a `zona` de tela cheia
em `Interface.ts` ja faz isso, com profundidade 99. Tirar o botao A nao quebra
dialogo nenhum.

## 7. Verificacao

- `arte/cursor.py` entra em `arte/gerar.py`, e `npm run arte` gera a folha. O
  manifesto pega o arquivo novo sozinho.
- **`verificar.mjs`:** todo estado de `src/dados/cursor.ts` tem quadro em
  `cursor.png` e vice-versa; e o contrato dos atalhos, acima.
- **`auditar-ui.mjs`:** o percurso clica com `page.mouse.click`, entao o cursor
  apareceria nos 33 screenshots. Esconder o cursor antes do screenshot: esses PNG
  sao referencia de arte para todas as frentes. O percurso tambem precisa parar de
  clicar no botao A, que nao vai mais existir.
- **`npm run contraste`:** o cursor tem que passar sobre grama e sobre painel de
  papel. Quem faz isso passar e o contorno de tinta de 1 px.
- **A mao no iPad:** o cursor nunca aparece no toque. A cena some no primeiro
  `pointerdown` com `pointer.wasTouch`, e so volta num `pointermove` de mouse.

## 8. A ordem, e cada passo com o jogo jogavel

1. `arte/cursor.py`, a folha, e o carregamento no `Boot`
2. `sistemas/cursor.ts` e a cena do ponteiro, so `normal`, `sobre` e `clique`.
   **Menor coisa entregavel, e ja e visivelmente melhor**
3. `sistemas/interativo.ts`, e religar `botao.ts`, a engrenagem e o "sortear" da Criacao
4. Hover no mundo: contorno, chapinha de nome e cursor contextual. Sem clique ainda
5. Segurar para andar. **Tem que vir antes do A\***, porque e ele que torna
   seguro tirar o disco
6. Tirar o disco e o botao A
7. A malha de passagem e o A\*, com alisamento, cancelamento e desistencia
8. Clicar no alvo: agir perto, caminhar e agir longe
9. `dados/atalhos.ts`, a aba de atalhos na Pausa, e o contrato no `verificar.mjs`
10. Conserto do auditor, contraste, e a rodada final de `build`, `verificar`,
    `auditar` e `conferir`

Os passos 5 e 6 juntos sao o unico momento em que o jogo fica pior antes de ficar
melhor. Depois do 6 nao existe volta barata: e o ponto de olhar na tela antes de
seguir.

## Arquivos desta frente

Novos, e portanto sem conflito com ninguem:

    arte/cursor.py
    src/sistemas/cursor.ts
    src/sistemas/interativo.ts
    src/sistemas/caminho.ts
    src/dados/cursor.ts
    src/dados/atalhos.ts
    docs/interface-do-mouse.md

Compartilhados, e por isso mexidos o menos possivel, sempre acrescentando no fim:

    src/cenas/Interface.ts     tira o disco e o botao A
    src/cenas/Mundo.ts         hover, clique e caminho
    src/cenas/Pausa.ts         a aba de atalhos
    src/cenas/Boot.ts          carrega cursor.png
    src/main.ts                a cena do ponteiro, no fim da lista
    src/sistemas/botao.ts      uma linha: chama interativo()
    src/sistemas/controles.ts  le atalhos.ts
    arte/gerar.py              chama cursor.py
    ferramentas/verificar.mjs  dois contratos novos
    ferramentas/auditar-ui.mjs esconde o cursor, para de clicar no botao A

`Interface.ts` e `Pausa.ts` sao os unicos que preocupam, porque a frente
`ambiente/ficha` vai reescrever os dois quando a janela unica sair. Hoje ela esta
parada e sem nada em voo, e `principal` esta no mesmo commit que ela. Se ela
voltar a andar, a conversa acontece antes, nao no merge.

## O que ficou de fora, de proposito

- **Cursor de combate.** O quadro `atacar` fica desenhado e sem uso. Mirar
  alcance e area e da frente `ambiente/combate`, e o desenho dela ainda esta
  sendo escrito.
- **Trilha do cursor, particula de clique.** Enfeite. Depois que o basico estiver
  na tela e for possivel julgar se falta ou sobra.
- **Atalho configuravel pelo jogador.** A lista em `atalhos.ts` ja e o lugar
  certo para isso nascer, mas nao nasce agora.
