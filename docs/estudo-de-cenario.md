# Estudo: o cenario

Quarto da serie. Curto de proposito: parte ja virou codigo, o resto e a fila.

Esboco: `ferramentas/esbocar-cenario.py` (no ambiente `sprites`).

---

## 1. A arvore "cortada": nao era corte

Investiguei antes de mexer. **O PNG de origem nao esta cortado** e **nenhum
tile pode cobrir um objeto**: a camada de chao em `src/cenas/Mundo.ts` tem
`setDepth(-1000)` e os objetos usam `setDepth(y)` do pe. Nao existe caminho de
recorte no codigo.

O que existe e o motivo de a copa **parecer** cortada: ela era uma elipse. Borda
de elipse le como bola de bilhar, e contra o corte reto de um tile de caminho o
olho fecha a forma como se algo a tivesse decepado. **A silhueta lisa e o
problema, nao o recorte.**

---

## 2. As referencias

- [Pixelblog 44, Top Down Trees](https://www.slynyrd.com/blog/2023/5/22/pixelblog-44-top-down-trees) —
  o metodo de moitas: desenha-se UM aglomerado de folha, dele saem tres
  variantes de tom, e a copa e essas variantes empilhadas segundo a luz. 4 a 5
  cores por moita. Tronco por ultimo, com listra de casca. Sombra centrada sob
  a arvore, "mais pratico para game design".
- [Pixelblog 20, Top Down Tiles](https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles) —
  poucas cores fazem textura rica, muitas borram. Nao por textura ocupada ao
  lado de outra ocupada. Usar espaco vazio para o cenario respirar. Esconder a
  emenda com aglomerados que atravessam a borda do tile.
- [Pixelblog 43, Top Down Tiles 2](https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2) —
  camadas em vez de texturas assadas juntas: remover o fundo de alguns
  elementos permite combinar sem multiplicar variantes.
- Sobre transicao, o consenso e direto: **tile de transicao e o que separa "um
  monte de texturas" de um tileset**. Mapa sem transicao parece tabuleiro de
  xadrez em qualquer resolucao.

---

## 3. O que ja esta em codigo

Em `arte/mundo.py`, no ambiente `sprites`:

**A arvore por moitas**, 56 x 72 (era 40 x 52). Quatro mudancas de metodo:

- **borda recortada** — bossa de 1 px por moita. E o recorte que faz a silhueta
  ler como folhagem;
- **sombra na BORDA, nao no meio** — cortando por meio-plano, as sombras de
  moitas vizinhas se alinham e a copa vira listra diagonal. Foi o primeiro erro
  do esboco;
- **brilho tambem na borda, e so nas moitas de cima** — disco claro no meio le
  como bolha ou furo. Foi o segundo erro. Moita de tras nao recebe brilho:
  quem esta atras nao compete;
- **cinco tons, nao tres** — com tres, uma moita e clara ou escura.

Mais **galho aparente** ligando tronco e copa, casca listrada, e raiz alargando
na base.

**Cinco arvores em vez de duas**, de graca: `_ARRANJOS` tem tres arranjos de
moita, e a rampa escura da mais duas. Mesmo metodo, floresta que nao se repete.

O objeto ja nao era preso ao tile (a casa tem 64 x 68), entao **prop pode
crescer sem mexer no grid**. E o caminho barato para "mais resolucao".

---

## 4. O que esta desenhado e nao esta ligado

**As beiras de grama.** `beira(lados)` no esboco gera a franja de grama que
avanca sobre o terreno vizinho. Doze desenhos, e a tecnica e de **sobreposicao,
nao substituicao**: a beira e um tile quase todo transparente, desenhado por
cima do chao. Assim uma familia de beiras de grama serve para grama-contra-
caminho, contra-terra, contra-areia e contra-agua — doze desenhos em vez de doze
vezes o numero de pares de terreno.

Duas licoes do esboco:

- **a franja anda em tufos de tres colunas.** Variando coluna a coluna ela vira
  um pente, com dentes regulares — pior que o corte reto que estamos
  consertando;
- **a ponta da franja vai em tom escuro.** E a sombra que a grama joga no
  terreno mais baixo. Sem ela a franja parece papel recortado colado no chao.

**Falta ligar**, e sao dois passos:

1. `costurarBordas(chao)` no jogo, no espirito do `plantarMata()` que ja existe:
   le o desenho do mapa e decide que beira cada celula precisa. Ninguem escreve
   beira na mao, como ninguem escreve arvore na mao.
2. Uma segunda camada de tilemap acima do chao, abaixo dos objetos.

`src/cenas/Mundo.ts` e `src/dados/config.ts` nao sao do ambiente `sprites`,
entao isso nao foi feito aqui.

---

## 5. A fila

1. **Ligar as beiras** (secao 4). E a maior melhora isolada do cenario por
   trabalho gasto, e nao custa resolucao nenhuma.
2. **Registrar as tres arvores novas** em `config.ts` e no plantio. Elas estao
   em disco e ninguem as carrega — o `npm run verificar` avisa, com razao.
3. **A rampa de 5 tons na paleta**, para casa, arbusto, pedra e cerca ganharem o
   mesmo tratamento da arvore. Metade do ganho de qualidade mora aqui e nao
   custa pixel nenhum.
4. ~~Os tiles de chao: hoje sao ruido aleatorio.~~ **Feito, secao 5.1.**
5. **Sombra projetada nos objetos grandes.** A casa nao tem nenhuma. Uma sombra
   e um beiral fazem mais por ela que dobrar a resolucao.

---

## 5.1 O chao: de ruido para tufo

Implementado depois da secao 5 ser escrita, a partir do feedback "o chao e
pobre e igual, cheio de informacao" -- que descreve exatamente o que
`ruido()` fazia: espalhar 1 pixel por vez, em posicao aleatoria, pelo tile
inteiro. Muita informacao (pixel em toda parte) e nenhuma variedade (a mesma
nuvem de estatica, so troca a semente).

A troca, em `arte/tiles.py`: **tufo em vez de ruido**. Cada decisao aleatoria
planta um aglomerado pequeno com forma (touceira de grama, seixo em L, faceta
de pedra), e entre os aglomerados fica o tom base, liso. Mesmo principio da
arvore: espaco negativo e o que separa textura rica de borrao.

Duas armadilhas encontradas fazendo isto, as duas por causa de repeticao:

- **grade com jitter vira treliça.** A primeira tentativa espalhava as ancoras
  numa grade com deslocamento aleatorio. Como o tile SE REPETE, uma grade fixa
  fica visivel assim que dois tiles ficam lado a lado. Trocado por sorteio com
  rejeicao (tenta uma posicao, descarta se ficou perto demais de outra): a
  unica regra e distancia minima, nada alinha em linha ou coluna.
- **um split que cobre o tile inteiro vira zigue-zague.** A pedra, na primeira
  versao, tinha uma linha de fronteira andando de cima a baixo dividindo o
  tile em dois blocos. Cobrindo 100% da area, essa linha se repete a cada 16 px
  e forma um chevron continuo quando os tiles se encostam -- pior que as
  faixas horizontais que estava substituindo. A correcao foi a mesma ideia da
  grama: blocos SOLTOS (2-3 poligonos irregulares, ao estilo da bossa da copa
  da arvore), com o tom base como espaco negativo entre eles.

**O que continua sem resolver:** um tile estatico e deterministico sempre
mostra periodicidade numa area grande e plana, porque e o MESMO desenho
repetindo a cada 16 px. A grama ja tem tres variantes (`grama`, `grama2`,
`grama3`) que `plantarMata()` mistura para quebrar isso; terra, caminho e
chao-caverna tem uma variante so cada. O proximo passo de verdade e dar a eles
o mesmo tratamento -- e isso e `Mundo.ts` e `config.ts`, fora do dominio deste
ambiente.

---

## 6. O que nao foi feito

- **As beiras nao estao no jogo.** So no esboco.
- **A casa, o arbusto e a cerca** continuam como estavam.
- **Os tiles de chao ganharam tufo** (secao 5.1), mas so tem uma variante cada
  (exceto grama). A periodicidade de tile unico continua, e o proximo passo e
  variantes + mistura em `Mundo.ts`, igual a grama.
- **A resolucao** continua a decisao aberta do `docs/estudo-de-resolucao.md`.
  A arvore nova cresceu como prop, que e independente dessa decisao; os tiles
  nao sao.
