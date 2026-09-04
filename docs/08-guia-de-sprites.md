# Guia de sprites

Este documento existe para que qualquer sprite novo do jogo saia coerente com os que
ja existem, sem depender de gosto.

## As referencias que usamos

**Stardew Valley** e a referencia principal, e a documentacao de mod dele e publica.
O que copiamos de la:

- **Sprite de 16 x 32 px.** Cabeca grande, proporcao chibi. Metade da altura e cabeca
  e tronco, metade e perna. Num sprite pequeno, cabeca grande e o que da expressao.
- **Ciclo de caminhada de tres quadros**, tocados na ordem `1, 2, 1, 3`, a
  **200 ms por quadro**, ou seja 5 quadros por segundo. Com quatro quadros diferentes
  em sequencia a perna "pisca"; com tres na ordem certa o passo fica natural e ainda
  economiza desenho.
- **Braco como camada separada, desenhada por cima de tudo.** No Stardew a ordem e
  corpo, calca, camisa, acessorios, cabelo, chapeu e por ultimo o braco. E isso que
  permite o personagem segurar uma ferramenta e levantar a mao sem quebrar o desenho
  da roupa. Foi a mudanca que mais melhorou os nossos sprites.

Fonte: [Modding:Farmer sprite, Stardew Valley Wiki](https://stardewvalleywiki.com/Modding:Farmer_sprite)

**Tecnica de pixel art**, do tutorial classico do Derek Yu e dos guias de
anti-serrilhado da Lospec e da Pixel Parmesan:

- **Contorno seletivo (selout).** Contorno preto puro em tudo deixa o desenho chapado.
  O certo e usar o tom escuro embaixo e do lado da sombra, e um tom medio em cima,
  onde a luz bate. No codigo isso e a funcao `contorno_seletivo()`.
- **Silhueta antes de detalhe.** A 16 px de largura, o jogador reconhece o personagem
  pela forma, nao pelo rosto. Canto de cabeca e de ombro arredondado le muito melhor
  que retangulo. Cortar quatro pixels de canto mudou mais a qualidade do que qualquer
  detalhe de rosto.
- **Nada de sombra em anel.** Sombra em volta de tudo, igual a uma almofada, e o erro
  mais comum de quem comeca. A luz vem sempre da mesma direcao: neste jogo, de cima e
  da esquerda.
- **Poucas cores, bem escolhidas.** 16 a 32 cores no total. Nao adianta mais.

Fontes: [Pixel Art Tutorial, Derek Yu](https://www.derekyu.com/makegames/pixelart.html) ·
[Anti-Aliasing Fundamentals, Pixel Parmesan](https://pixelparmesan.com/blog/anti-aliasing-fundamentals-for-pixel-artists) ·
[Tutoriais de anti-serrilhado, Lospec](https://lospec.com/pixel-art-tutorials/tags/antialiasing)

## Como e a nossa folha

Cada folha de personagem tem **6 colunas por 8 linhas**, cada quadro de 16 x 32.

As 8 linhas sao as oito direcoes (`LINHAS` em `arte/base.py`). As quatro
primeiras sao baixo, esquerda, direita e cima; as quatro ultimas sao as
diagonais, que `normalizar()` resolve como uma das quatro vistas com o rosto
virado. Sao 48 quadros por folha, mas so 4 desenhos diferentes.

| Coluna | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| | parado | passo A | passo B | respirando | conjurando | tonto |

| Linha | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| | baixo | esquerda | direita | cima |

O indice do quadro e `linha * 6 + coluna`. A tabela esta em `src/dados/config.ts`,
em `QUADRO` e `LINHA_DIRECAO`.

**Parado nao e um quadro so.** A animacao alterna `parado` por 2,2 s e `respirando`
por 0,7 s. Sem isso todo NPC vira estatua, e estatua e a coisa que mais denuncia um
jogo amador.

**Tonto** existe porque neste jogo nao ha morte. Quando o heroi leva um susto ele fica
tonto por um instante, com olhinho em X, e volta.

## As camadas do heroi

Desenhadas nesta ordem, de baixo para cima:

```
corpo -> roupa -> cabelo -> chapeu -> bracos -> arma
```

`corpo` e `bracos` saem em tres tons de pele, porque tint em pele fica sujo.
`roupa`, `cabelo` e `chapeu` saem em **branco** e recebem `setTint()` no jogo, entao
qualquer cor funciona sem gerar arte nova.

Variacoes que existem hoje:

| Peca | Opcoes |
|---|---|
| Tom de pele | 3 |
| Cabelo | curto, comprido, cacheado, rabo de cavalo, moicano |
| Cor do cabelo | 8 |
| Roupa | tunica, folhas, capa |
| Cor da roupa | 6 |
| Chapeu | nenhum, pontudo, palha, capuz, coroa |
| Arma | nenhuma, cajado, espada, arco, martelo, funda |

Da mais de cem mil combinacoes, e nenhuma delas custou um PNG a mais.

## O movimento

A funcao `deslocamento(coluna)` devolve tres numeros: balanco da perna, sobe e desce
do corpo, e balanco do braco.

**O corpo sobe 1 px no meio do passo.** Esse unico pixel e o que separa um boneco
andando de um boneco deslizando pela tela. Se voce so trocar a perna e nao mexer no
corpo, o personagem parece patinando no gelo.

## Desenhar de perfil

Foi o que mais deu trabalho. Regras que valeram:

- De perfil o rosto e **estreito**. O cabelo cobre a nuca, do lado oposto ao que o
  personagem olha. Sem isso a cabeca vira uma tabua de pele com um ponto preto.
- Um pixel de **nariz saindo** da silhueta resolve o angulo sozinho.
- O olho vira um retangulo de 3 x 3 com a pupila colada na borda da frente.

## Adicionar uma peca nova

1. Escreva a funcao em `arte/gente.py`, recebendo `(direcao, coluna, ...)`.
2. Use `deslocamento(coluna)` para o corpo subir e as pernas trocarem junto.
3. Termine com `contorno_seletivo(im, TINTA, TINTA_2)`.
4. Ponha na lista da categoria e adicione o nome em `src/dados/config.ts`.
5. `npm run arte`, depois `npm run auditar`.

## Sprites desenhados a mao

Continua valendo: qualquer PNG em `arte/sprites/` com o nome da folha substitui a
versao gerada. Ver `docs/06-fluxo-de-sprites.md`. O tamanho tem que bater: folha de
personagem e 96 x 128 (6 colunas de 16 por 4 linhas de 32).


## Duas familias de camada, e a diferenca importa

A partir da reforma de setembro o heroi tem dois tipos de camada, e eles nao
funcionam do mesmo jeito.

**Camadas animadas.** Corpo, bracos, cabelo e chapeu. Sao folhas de 6 colunas
por 4 linhas de 16 x 32, e tocam animacao normalmente.

**Camadas encaixadas.** Roupa e arma. Nao sao folhas de corpo: sao pecas
desenhadas fora dele. A arte publica em `public/assets/encaixes.json`, quadro a
quadro, onde esta o tronco e onde esta a mao, e o jogo pendura a peca no ponto.

Por que isso importa:

- A arma acompanha o balanco do braco sozinha. Antes cada arma era desenhada
  dentro do quadro do corpo com as coordenadas da mao copiadas na mao, e
  qualquer mexida no braco deixava a espada flutuando ao lado dela sem ninguem
  perceber ate olhar de perto.
- A mesma espada serve para o anao e para o elfo, que tem o braco em alturas
  diferentes. Antes era uma folha de arma por tipo de corpo.
- A roupa vira uma peca de roupa de verdade: um desenho pequeno que da para
  olhar sozinho e reconhecer como avental ou como armadura, em vez de tinta
  espalhada dentro de 24 quadros de corpo.

O que continua exigindo uma folha por tipo de corpo e so a roupa, e por um
motivo fisico: tecido nao estica. Uma tunica de anao em cima de um elfo ficaria
larga.

### A regra que mantem a arma dentro do quadro

O NPC e achatado numa folha so, entao o que passar da borda do quadro dele
some, e some SO em algumas poses: a ponta do arco aparece parada e desaparece
quando ele respira. Defeito assim ninguem acha olhando, porque nao esta errado
o tempo todo.

Por isso `arte/equipamento.py` tem a funcao `conferir()`, que a geracao chama
sempre: ela testa cada arma contra cada ponto de mao de cada raca e para a
geracao com o nome de quem estourou. Se voce desenhar uma arma nova e ela nao
couber, o `npm run arte` te diz na hora, com quadro e raca.

## Racas: a silhueta antes da cor

Cinco racas, e a diferenca entre elas e ANATOMICA, nao de paleta. O teste e
apagar todas as cores: se der para dizer quem e quem so pela silhueta, esta
certo.

| Raca | Corpo | Perna | O que marca |
|---|---|---|---|
| Gente do Vale | normal | normal | a referencia, sem traco extra |
| Anao da Fornalha | gordinho | curta | barba grande e ombro largo |
| Elfo da Folha | magro | longa | orelha de folha, subindo em diagonal |
| Pequenino do Trigo | normal | bem curta | pe grande e descalco |
| Cria de Dragao | normal | normal | chifre, escama na bochecha e cauda |

A orelha e o traco que mais identifica, porque e o unico que aparece na
silhueta a 16 px de largura.

**A cabeca tem o mesmo tamanho em todas as racas de proposito.** E o que permite
um unico conjunto de cabelos e chapeus servir para todo mundo. A diferenca de
altura mora na perna, e as camadas de cima descem o tanto que
`pessoa.desloque()` mandar.

**Todo mundo pisa na mesma linha**, a linha 30 do quadro. Quem e mais baixo tem
a perna mais curta, nao o desenho inteiro empurrado para baixo. Sem isso um
personagem baixinho pareceria afundado no chao.

## O ceu acima da cabeca

Existem exatamente 3 px livres acima da cabeca do personagem mais alto, e e
onde cabe a copa de um chapeu. E por isso que o chapeu de mago e tombado para o
lado em vez de reto para cima: reto ele nao cabe, e a copa sai pela borda de
cima do quadro. Foi o primeiro erro da reforma de sprites, e demorou a aparecer
porque so acontecia com o elfo.


## Oito direcoes

A folha passou de 4 para 8 linhas: as quatro retas mais as quatro diagonais. O
motivo e de jogo, nao de arte: no direcional a crianca anda na diagonal o tempo
todo, e sem quadro proprio o personagem andava de lado enquanto se movia na
diagonal. O passo nao batia com o movimento.

Uma diagonal nao e uma vista nova. E a vista de frente ou de costas com o rosto
virado, e a funcao `base.normalizar()` faz essa traducao: toda funcao de desenho
continua conhecendo quatro vistas e ganha as diagonais escrevendo pouco.

O que muda numa diagonal, e so isso:

- os dois olhos e a boca escorregam 1 px para o lado do giro
- um narizinho aparece fora da silhueta daquele lado
- de costas, a ponta do queixo aparece do lado do giro

Sao os unicos sinais que cabem em 16 px. Sem eles a diagonal fica identica a
frente; com eles, o rosto vira.

No toque, o direcional deixou de ser quatro botoes e virou um disco. Com quatro
botoes separados a diagonal era impossivel: exigia dois dedos em dois quadrados
de 26 px ao mesmo tempo. Com um disco, o dedo pousa em qualquer lugar e o angulo
ate o centro escolhe uma das oito direcoes, e da para arrastar sem levantar.

## Contraste: a linha de luz

`npm run contraste` mede a razao de contraste de cada par de cores que se
encostam no jogo e reprova quem fica abaixo do minimo. Foi ele que mostrou o
tamanho do problema: o goblin verde em cima da grama verde dava razao 1,03, ou
seja, o olho nao separava um do outro. Nove pares reprovavam.

A primeira tentativa foi escurecer a grama e clarear a pele, e ajudou, mas
esbarrou num limite: **nao existe cor de pele escura que contraste com a grama
sem deixar de ser escura**. Quando a pele escura passava no teste, ela ja tinha
virado pele media.

A resposta certa nao e a cor de dentro do personagem, e a borda dele:

- **contorno escuro** em volta de tudo, que resolve contra fundo claro. Ja
  existia.
- **linha de luz** de 1 px na borda de cima e da esquerda, que resolve contra
  fundo escuro. E a funcao `base.luz_de_cima()`, e foi a que faltava.

Por isso a ferramenta mede a linha de luz do personagem, e nao a cor de dentro
dele: e a linha que faz o trabalho.

A `rampa()` tambem mudou de conta. Antes ela somava um valor fixo em cada canal,
o que estourava o canal mais alto e trocava a cor: a pele clara virava amarelo na
luz. Agora ela mistura a cor com um branco quente e com um roxo escuro, entao a
cor caminha sem nunca mudar de matiz.
