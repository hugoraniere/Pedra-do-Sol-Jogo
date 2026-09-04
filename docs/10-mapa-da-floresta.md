# Plano do mapa 2, a Floresta dos Sussurros

Esboco do segundo cenario. Nada aqui foi implementado.

**Premissa:** este e um jogo completo, para qualquer pessoa que queira jogar.
`CLAUDE.md`, `docs/01-conceito.md` e `docs/05-roadmap.md` ja foram reescritos com
essa premissa; este documento e a primeira area projetada sob ela.

---

## 1. O que muda com o publico

O que sai:

- **Piso de leitura.** O texto pode ter voz, ritmo e piada. Frase curta continua
  sendo boa escrita, nao uma limitacao.
- **A seta depois de dez segundos.** Um jogo bom orienta pela forma do espaco:
  marco visivel, luz, largura de trilha, silhueta. Placa piscando e o remendo de
  quando o mapa nao se explica.
- **Recompensa garantida em todo desvio.** Se todo canto da premio, nenhum canto e
  descoberta. O que segura a exploracao e a chance, nao a certeza.
- **"Uma cena por vez, nada de mapa aberto"** (`docs/01-conceito.md`). E exatamente
  a regra que impede uma area de floresta boa.

O que fica, porque e bom design e nao concessao a idade:

- **Legibilidade.** Ler a tela em um segundo e virtude em qualquer jogo.
- **Toque em primeiro lugar.** Continua sendo onde o jogo e jogado.
- **Falha sem humilhacao.** O custo e material, nunca moral. Ver a secao 4.

O que entra:

- **Consequencia.** Sem custo nao ha tensao, e sem tensao nao ha jogo, so passeio.
- **Densidade.** Area grande se sustenta por quantidade de coisa acontecendo por
  tela, nao por quantidade de tela.
- **Dominio.** O jogador tem que ficar melhor: no espaco, no sistema e no mundo.

---

## 2. O material de mesa ja e um jogo completo

Isto e o mais importante deste documento. O sistema em
`docs/referencia/sistema-do-rpg-de-mesa.md` **ja resolve** quase tudo que um jogo
de verdade precisa, e a build atual simplesmente nao implementou nada disso:

| O que ja existe no papel | Existe no jogo? |
|---|---|
| FORCA, ESPERTEZA, CORACAO, e o +1 escolhido pelo jogador | nao |
| Teste de 1d6 + atributo, em tres faixas | nao |
| OPS / QUASE / INCRIVEL | nao |
| Tres coracoes, zero = tonto, nunca morre | nao |
| Selos de Herois: a cada 3, +1 coracao ou +1 atributo ou habilidade | nao |
| Dom de raca com 1 uso por aventura | nao |
| Tres magias com 1 uso cada | nao |
| Bestiario de 9 criaturas | so os dados, em `conteudo.ts` |
| Dois finais, um deles chamando o dragao pelo nome verdadeiro | nao |

A faixa do meio e a joia. **QUASE = deu certo, com um probleminha** e sucesso com
custo, a mesma ideia que sustenta os RPGs narrativos modernos. O teste raramente
tranca o caminho: ele **cobra**. Perde-se um coracao, faz-se barulho, quebra-se o
item, a criatura acorda, o atalho desmorona.

E ha um segundo presente, menos obvio, na coluna `fraqueza` do bestiario. Nenhuma
das nove fraquezas e um tipo de dano: sao todas **conhecimento**. Goblin da Fumaca
cai com barulho alto de metal. Lobo de Nevoa, com luz forte. A Aranha da Teia Doce
se resolve comendo a teia. Grulo, com uma boa gargalhada. A Bruxa nao consegue mentir
sobre o proprio nome. Brasanegra tem o nome verdadeiro, Aurel.

Isso amarra o jogo inteiro num no so: **saber e a arma.** Da para lutar na forca
bruta, e e caro. Quem descobriu a fraqueza gasta um terco. E como se descobre
fraqueza e explorando e escutando, o combate, os ecos e a exploracao viram o mesmo
sistema em vez de tres sistemas grudados.

**Conclusao para a floresta:** a floresta nao e onde o jogo fica maior. E onde o
jogo passa a ter sistema. Mapa grande com um verbo so (andar e conversar) e mapa
grande vazio. A ordem de execucao na secao 13 leva isso a serio.

---

## 3. O verbo da area: o Eco

Toda area boa tem um verbo que o resto do jogo nao tem. A referencia entrega o desta
de bandeja, em uma linha: *"Floresta Sussurro: as arvores repetem o que voce fala."*

Isso nao e piada de cenario, e uma mecanica de conhecimento:

- **Escutar.** Certas arvores guardam uma frase dita perto delas. Algumas ouviram
  ontem, outras ha tres invernos. Escutar coloca o **eco** na mochila.
- **Falar.** Voce pode dizer um eco que carrega para outra arvore, para uma criatura
  ou para uma passagem. O eco certo no lugar certo abre coisas: as sentinelas goblins
  baixam a guarda ao ouvir a voz do Zonzo, a parede de espinho se abre com as
  palavras da propria Bruxa.
- **A chave e o conhecimento, nao o item.** A porta nunca esta trancada. Voce e que
  ainda nao sabe o que dizer. Quem descobre antes, passa antes.
- **Isso ensina o final do jogo.** Os dois finais do material se decidem por chamar
  Brasanegra de **Aurel**. A floresta e onde o jogo ensina, em pequeno, que dizer o
  nome certo muda o mundo. Semear o verbo aqui e pagar dividendo tres aventuras
  depois.

O eco tambem justifica o tamanho do mapa: a informacao esta **distribuida no
espaco**. Explorar e como se ganha chave. Voltar nao e refazer caminho, e reler um
lugar com o que voce agora sabe.

Um eco tem tres partes: onde foi ouvido, o que diz, e para quem serve. Sao dados,
nao codigo: `src/dados/ecos.ts`, do mesmo jeito que os dialogos.

---

## 4. Risco, derrota e fogueira

**Da para perder.** Zero coracoes e derrota: o heroi cai, acorda na ultima fogueira
acesa, e a floresta se reacomoda (as criaturas voltam, as portas fechadas por
barulho se fecham de novo). Nao ha morte e nao ha tela que julgue o jogador, mas ha
consequencia.

**O que se perde:** as moedas que estavam com voce, os itens consumiveis usados no
caminho, o tempo, e o barulho que voce ja tinha feito de graca. **O que nunca se
perde:** conhecimento. Eco escutado e eco seu. Fraqueza descoberta e sua. Atalho
aberto continua aberto. Fogueira acesa continua acesa. A regra e simples e vale para
o jogo inteiro: **voce perde o que carregava, nunca o que aprendeu.** E o que faz a
derrota custar sem nunca fazer o jogador refazer descoberta, que e o pecado mortal
do checkpoint mal colocado.

**O atrito e o sistema.** Coracao nao volta sozinho. Volta comendo, dormindo, ou na
fogueira. Por isso a decisao interessante da floresta nunca e "luto ou nao luto", e
sim **"aguento chegar ate a proxima fogueira?"**. Toda area boa de checkpoint se
joga assim.

**As quatro fogueiras.** A distancia entre elas e a regua de dificuldade da area:

| Fogueira | Onde | Papel |
|---|---|---|
| **do Bosque** | Bosque Claro, perto da entrada | ensina o sistema onde e barato errar |
| **da Ouvinte** | centro, ao pe da arvore-mae | o eixo: com o atalho 2 aberto, quase tudo fica perto dela |
| **da Teia** | Teia Doce | logo antes da subida pela copa |
| **do Alto** | planalto norte | a ultima antes da Ravina, e a mais longe de todas |

O trecho **Ravina -> Passagem** e de proposito o mais longo sem fogueira do mapa. E
o climax da area, e o unico lugar onde a floresta pode assustar de verdade.

**As criaturas e a curva.** Do bestiario, tres moram aqui:

| Criatura | Onde | Fraqueza | Papel |
|---|---|---|---|
| **Aranha da Teia Doce** (2 coracoes) | leste | comer a teia e escapar | ensina que fraqueza vale mais que forca, e o unico combate que da para vencer sem lutar |
| **Lobo de Nevoa** (2 coracoes) | riacho e barranco, na nevoa | luz forte | o feixe de luz entre as folhas deixa de ser enfeite e vira arma; ensina a ler o cenario |
| **Goblin da Fumaca** (1 coracao) | planalto norte, sentinelas | barulho alto de metal | fogem mais do que brigam, mas em grupo e chamando outros. Ligam a floresta a caverna da cena 4 |

A curva sobe do sul para o norte, junto com o terreno: o Bosque Claro nao tem
ameaca, o riacho tem a primeira, a Teia Doce tem a primeira que exige entender, e o
planalto tem grupo e vigia. Quem sobe pelo caminho longo chega preparado; quem cair
do atalho 1 no comeco vai se meter numa encrenca que ainda nao sabe resolver, e isso
e legitimo.

**Derrota nunca fecha caminho.** Nenhum combate perdido tranca uma passagem, quebra
um eco ou apaga uma fogueira. A punicao e sempre custo e tempo, nunca conteudo
perdido.

## 5. A forma do mapa

Nao e um corredor com clareiras enfiadas nele. E um **anel com atalhos**, a forma
que sustenta area grande em jogo bom:

**Um marco central visivel de todo lado.** A **Grande Ouvinte**, arvore enorme no
centro da bacia, aparece por cima da copa de quase qualquer ponto do mapa. Orientacao
por marco, nao por minimapa nem por bussola. Voce sempre sabe onde esta porque sempre
ve o centro.

**Terreno em tres alturas.** Planalto ao norte, o barranco cortando o mapa de leste a
oeste, e a bacia ao sul, com o riacho no pe da pedra. Altura resolve tres problemas
de uma vez: da leitura ao espaco, cria queda de mao unica, e deixa o jogador ver de
cima aonde vai chegar depois.

**Atalhos que abrem do lado de la.** Sao tres, e nenhum se abre de frente: voce
sempre chega neles pelo lado errado primeiro e os destrava por tras. A primeira volta
e longa; depois disso o mapa dobra sobre si mesmo e o centro fica a segundos de
qualquer borda. E a tecnica que transforma mapa grande de tarefa em dominio.

**Passagens travadas por conhecimento, nao por parede.** A ravina esta aberta desde o
comeco. Sem o eco certo, voce so nao sabe que ela leva a algum lugar.

---

## 6. Tamanho e densidade

**120 x 84 tiles** = 1920 x 1344 px. Com a mata fechada ocupando cerca de um terco,
sobram **umas 28 telas jogaveis** na visao normal (320 x 192). E oito vezes a Vila
Semente, que tem 3,6 telas.

Mas o numero que importa nao e esse. E o orcamento de densidade:

| Medida | Alvo |
|---|---|
| Ponto de interesse no caminho critico | 1 por tela |
| Segredo (nao anunciado, so recompensado) | 1 a cada 2 ou 3 telas, ~12 no total |
| Atalhos | 3 |
| Passagens travadas por eco | 4 |
| Criaturas com rotina propria | 5 tipos |
| Testes de dado no caminho critico | 6 a 8 |
| Encontros com criatura no caminho critico | 5 a 7 |
| Fogueiras | 4 |
| Trecho mais longo sem fogueira | Ravina -> Passagem, o climax da area |

Se um pedaco do mapa nao cabe nesse orcamento, ele nao e floresta, e enchimento:
corta e aproxima o resto.

---

## 7. Esboco

Cada caractere e um bloco de **4 x 4 tiles**. O desenho e 30 x 21 blocos.

```
  TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
  TT.......................ooooT
  TT.oooo........oooooooo..oPooS
  TT.oCoo........oooVoooo..ooooT
  TT.oooo........oooooooo......T
  TT..pppppppppppppppppppppppp.T
  ====p=====1======2====c===3==T
  ~~~~~R~~~~~~~~~...........p..T
  TT...p....................p.TT
  TT.oLp......oooooo..........TT
  TT.oop......ooGooo.....D....TT
  TT...p......oooooopppp......TT
  TT...p......oopooo..........TT
  TT...pppppppppp.............TT
  TT...p.....TTTTTTTTTTTTTTTTTTT
  TT.oooooo..TTTTTTTTTTTTTTTTTTT
  TT.ooBooo..TTTTTTTTTTTTTTTTTTT
  Epppooooo..TTTTTTTTTTTTTTTTTTT
  TT.oooooo..TTTTTTTTTTTTTTTTTTT
  TT.........TTTTTTTTTTTTTTTTTTT
  TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```

```
T  mata fechada          =  barranco, parede de pedra    o  clareira
.  mata aberta           ~  riacho, no pe do barranco    p  trilha
1  queda do barranco, mao unica      c  subida pela copa da Teia Doce
2  escada de raizes                  3  descida do carroceiro
E  entrada, vem da vila              S  saida, Ponte dos Trolls

C Clareira do Trovao   V Ravina Sussurrante   P Passagem pra Ponte
L Oco do Lenhador      R o Tronco Caido       G A GRANDE OUVINTE
B Bosque Claro         D Teia Doce
```

---

## 8. Os lugares

| Lugar | Onde | O que e | O que ensina |
|---|---|---|---|
| **Bosque Claro** | sul | mata aberta, sol, cogumelos, o primeiro par de pegadas | ensina a escutar: a primeira arvore repete o que voce acabou de dizer, e a piada vira mecanica |
| **Oco do Lenhador** | oeste | abrigo abandonado, ferramenta enferrujada, um bilhete | o primeiro eco **antigo**: uma frase de tres invernos atras. Muda o que a area e |
| **O Tronco Caido** | riacho | travessia sobre agua corrente | primeiro teste de FORCA. OPS nao bloqueia: voce cai e a correnteza te leva rio abaixo, o que abre um canto que voce nao teria visto |
| **A Grande Ouvinte** | centro | a arvore-mae, marco visivel de todo o mapa, ponto de descanso | o centro do sistema de ecos: ela repete qualquer coisa dita em qualquer lugar da floresta, mas embaralhado. E o painel de dicas do mapa inteiro |
| **Teia Doce** | leste | ninho, teia comestivel, a Matriarca | as aranhas nao perseguem, mas reagem. Teste de CORACAO. A copa e a subida pro planalto |
| **O Barranco** | meio | a parede que corta o mapa | ensina leitura vertical: voce ve o norte muito antes de poder ir |
| **Clareira do Trovao** | noroeste | arvore partida por raio, cajado fincado, folhas girando sozinhas | segredo opcional com recompensa real. A piscadela para o Trovao da Floresta, Elfo da Folha, Mago, do RPG de mesa |
| **Ravina Sussurrante** | norte | o corredor onde toda palavra volta multiplicada | o quebra-cabeca da area: so passa quem tiver ouvido a coisa certa |
| **Passagem pra Ponte** | nordeste | degraus de pedra, o barulho de agua ficando alto | a saida, e a promessa da cena 3 |

---

## 9. As arestas

| De | Para | Como se passa | Observacao |
|---|---|---|---|
| entrada | Bosque Claro | livre | |
| Bosque Claro | riacho | livre | |
| riacho | pe do barranco | teste de FORCA no tronco | OPS = correnteza, nao bloqueio |
| pe do barranco | planalto oeste | subida natural | unica subida no comeco |
| Bosque Claro | Grande Ouvinte | livre | |
| Grande Ouvinte | Teia Doce | livre | |
| Teia Doce | planalto leste | subida pela copa, teste de CORACAO | |
| planalto | Ravina | livre | |
| Ravina | Passagem | **eco** | o quebra-cabeca principal |
| planalto | bacia | **atalho 1**, queda do barranco | mao unica, abre sozinho ao ser usado |
| Ravina | Grande Ouvinte | **atalho 2**, escada de raizes | destravado la de cima |
| Passagem | Teia Doce | **atalho 3**, descida do carroceiro | destravado la de cima, fecha o anel |

---

## 10. A segunda leitura

Um mapa bom se joga duas vezes sem ser jogado duas vezes.

A primeira travessia e longa, de baixo para cima, um caminho de cada vez. A partir
do momento em que os tres atalhos abrem, a floresta vira um cruzamento: da Passagem
ao Bosque Claro em menos de um minuto.

E ai vem a segunda leitura. Com os ecos na mochila, lugares por onde voce ja passou
passam a ter o que dizer: a arvore muda do Bosque Claro sempre teve uma frase, so
que voce ainda nao sabia de quem era a voz. O mapa nao cresce; o que voce entende
dele e que cresce.

---

## 11. O que precisa nascer no codigo

Em ordem de dependencia. Os cinco primeiros nao sao da floresta, sao do jogo, e
sem eles a floresta e um passeio.

1. **`src/sistemas/dado.ts`.** 1d6 + atributo, tres faixas, modificadores (+1 com
   ajuda, +1 com o item certo, -1 se dificil). Puro, testavel, sem Phaser.
2. **Atributos e coracoes no estado.** `estado().heroi` ganha FORCA, ESPERTEZA,
   CORACAO e os coracoes atuais. A criacao de personagem ganha o passo do +1 que
   falta.
3. **Derrota e fogueira.** Acender fogueira e permanente e entra no save. Zero
   coracoes devolve o heroi a ultima acesa, cobrando o que ele carregava e
   preservando tudo que ele aprendeu. A regra de o que se perde e o que nao se perde
   e da secao 4, e vale para o jogo inteiro, nao so para a floresta.
4. **Combate, e as fraquezas.** O laco completo de `docs/modelo-de-combate.md`:
   escolher, mirar com alcance e area visiveis, confirmar, e o dado decidir. Cada
   criatura tem uma fraqueza conhecida ou nao conhecida, e o estado precisa lembrar
   quais o jogador ja descobriu: e isso que muda o custo da luta.
5. **A cena do dado.** O 1d6 na tela com as tres faixas de cor do material impresso,
   ja previsto na Fase 2 do roadmap. E o momento de tensao do jogo inteiro: merece
   animacao propria, nao um numero aparecendo.
6. **Ecos.** `src/dados/ecos.ts`, `estado().ecos`, e o verbo de falar um eco. Os
   dialogos passam a poder exigir eco, do mesmo jeito que vao poder exigir pista.
7. **Transicao de mapa.** `Mapa` ganha `saidas`, `Mundo` le `estado().lugar` em vez
   de importar `VILA` fixo. Continua sendo o item pendente da Fase 2.
8. **Estado de atalho.** Atalho aberto e um booleano no estado que muda a colisao do
   mapa. Precisa sobreviver ao save.
9. **A letra de mata.** Letra `T` no desenho do chao: tile solido, e uma funcao irma
   de `montarChao()` planta as arvores por cima, com variacao estavel pela posicao.
   Sem isso seriam 800 arvores escritas a mao em `mapas.ts`, que quebram na primeira
   mexida no desenho. O desenho em texto continua sendo a unica fonte da verdade.
10. **Rotina de criatura.** Aranha que ronda, corvo que levanta voo, goblin sentinela
   que patrulha. Rota em tiles, sem perseguicao, com reacao ao barulho.
11. **Descarte fora da camera.** 800 objetos estaticos numa area de 28 telas pede
   ligar e desligar por proximidade da camera. Medir no iPad antes de encher de
   detalhe.

---

## 12. A arte

Tudo por `arte/`, nada de PNG na mao. Arquivo novo: `arte/floresta.py`.

**Tiles:** grama de mata, folhagem de chao, trilha estreita, agua rasa com pedra,
face de barranco, borda de queda, musgo.

**Pecas:** pinheiro alto em duas ou tres variacoes (o tijolo da mata, precisa ficar
bom repetido em bloco), copa escura de fundo, **a Grande Ouvinte** (peca grande, de
varios tiles, com rosto na casca e quadro de boca), tronco caido, toco, raiz exposta,
samambaia, cogumelo, pedra com musgo, teia doce e portao de teia, arvore partida por
raio, cajado fincado, escada de raizes, degraus de pedra, pegadas de tres dedos.

**Camadas de ambiente:** feixe de luz entre as folhas, nevoa rasteira no riacho,
folha caindo. Sao o que separa floresta de "grama com arvore". A mata fechada e
**azulada e fria**, nunca preta.

**Ja existe e reusa:** arvore, arvore-escura, arbusto, fogueira, bau, placa, cerca,
e os quatro sprites de aranha.

---

## 13. Ordem de execucao

Cada passo deixa o jogo jogavel de ponta a ponta antes do seguinte.

- [ ] **13.1 O sistema, na vila.** Dado, atributos, coracoes, combate por escolha,
      derrota, fogueira e a tela do dado. Tudo provado na Vila Semente, que ja existe
      e e pequena. Nao se estreia sistema em mapa novo.
- [ ] **13.2 Ecos, na vila.** Duas ou tres arvores e uma passagem, para o verbo nascer
      onde e barato errar.
- [ ] **13.3 Esqueleto que anda.** Letra `T`, transicao de mapa, os 120 x 84
      desenhados com arte emprestada da vila. Atravessar a floresta inteira. Feio,
      mas inteiro, com o anel e os tres atalhos ja funcionando.
- [ ] **13.4 A arte da floresta.** `arte/floresta.py`, a Grande Ouvinte, o barranco,
      as camadas de luz.
- [ ] **13.5 Os lugares.** Os nove, com o marco de cada um, os segredos e o
      orcamento de densidade da secao 6 cumprido.
- [ ] **13.6 A vida.** Criaturas com rotina, a Matriarca, os testes de dado no
      caminho critico, o quebra-cabeca da Ravina.
- [ ] **13.7 O risco.** As quatro fogueiras, os encontros, as fraquezas
      descobriveis, e a curva do sul para o norte. So aqui a floresta passa a ter
      dificuldade, e so aqui da para afina-la: dificuldade se ajusta em area pronta,
      nunca em area pela metade.
- [ ] **13.8 Afinacao.** Ritmo, som, e o teste da secao 14.

---

## 14. Como saber se ficou bom

O criterio antigo era "o Lele atravessa sozinho". O criterio agora e outro, e se
mede com gente que nunca viu o jogo:

1. **Sem ninguem explicando**, o jogador acha a saida. Se travar, trava por nao ter
   entendido o quebra-cabeca, nunca por nao saber onde ficam as coisas.
2. **A segunda travessia e pelo menos tres vezes mais rapida** que a primeira, e o
   jogador consegue dizer por que.
3. **Ele sabe nomear tres lugares** de cabeca, depois de fechar o jogo.
4. **Mais da metade acha pelo menos um segredo** sem ter sido mandada procurar.
5. **Um OPS no dado gera reacao boa**, do tipo "ah, droga" com sorriso, e nunca "que
   injusto". Se gerar a segunda, o custo esta no lugar errado.
6. **Uma derrota gera vontade de voltar na hora**, nao vontade de fechar o jogo. Se
   o jogador suspira ao acordar na fogueira, a fogueira esta longe demais ou ele
   perdeu alguma coisa que devia ter sido conhecimento.
7. **Ninguem vence a Teia Doce na forca bruta sem perceber que dava para nao lutar.**
   Se ninguem perceber, a fraqueza nao esta descobrivel o suficiente.
8. **Ninguem pergunta onde fica o centro.** Se perguntarem, a Grande Ouvinte nao esta
   alta o suficiente.

Alem dos verificadores de sempre (`build`, `verificar`, `contraste`, `auditar`,
`conferir`), este mapa pede tres proprios:

- **Alcancabilidade.** Varredura a partir da entrada provando que a saida, os nove
  lugares e os doze segredos sao alcancaveis, e que os atalhos so abrem do lado certo.
- **Largura de trilha.** Nenhum corredor de um tile. Minimo dois em todo caminho
  critico.
- **Orcamento de densidade.** Contar pontos de interesse por tela e reprovar as telas
  vazias.

---

## 15. Em aberto

- **Derrota sem morte.** Decidido: da para perder, com custo real e volta na
  fogueira, mas o heroi e nocauteado, nunca morto. O material de mesa diz "nunca
  morre" e manda nao contradize-lo; derrota de verdade cabe dentro disso. Se um dia
  se quiser morte literal, e uma decisao de uma linha, e ela contradiz a referencia
  de propria vontade, o que precisa ficar escrito.
- **Combate.** Decidido: Baldur's Gate em top-down, em `docs/modelo-de-combate.md`.
  Acao em tempo real, mira com alcance e area, e o dado decidindo o resultado. Para a
  floresta isso muda pouco (a curva e as fraquezas continuam iguais) e muda uma coisa
  muito: **a mata fechada e o terreno da mira.** Arvore no caminho do projetil,
  clareira que abre linha de tiro, nevoa que encurta alcance, o feixe de luz que e a
  fraqueza do Lobo de Nevoa. Ao desenhar os nove lugares, desenhar tambem o espaco
  de combate de cada um.
- **A Vila Semente** vai parecer minuscula ao lado desta area. Ou ela cresce, ou
  passa a ser deliberadamente o lugar apertado e seguro de onde se sai. As duas
  respostas servem; escolher por acidente, nao.
