# Plano do mapa 2, a Floresta dos Sussurros

Esboco do segundo cenario. Nada aqui foi implementado ainda. O roteiro da cena
esta em `docs/02-roteiro.md`, cena 2. A fase correspondente e a **Fase 2** do
`docs/05-roadmap.md`.

---

## 1. O tamanho

A Vila Semente tem **36 x 24 tiles** = 576 x 384 px. Na visao normal (320 x 192)
isso da 3,6 telas. E pouco: a crianca atravessa a vila inteira em 9 segundos.

A floresta vai ser **72 x 56 tiles** = 1152 x 896 px, ou seja **cerca de 17 telas**,
quase cinco vezes a vila. A 62 px/s, atravessar de ponta a ponta em linha reta leva
uns 20 segundos; com os desvios, dois a quatro minutos de exploracao.

Isso e grande o suficiente para dar sensacao de floresta e pequeno o suficiente
para ninguem se perder. Mapa grande de verdade nao e mapa com muito espaco, e mapa
com muitos **lugares diferentes**. Por isso o plano abaixo divide os 72 x 56 em
sete lugares com cara propria, ligados por trilha estreita.

> A vila continua pequena. Se depois disso ela parecer pequena demais **ao lado**
> da floresta, o certo e crescer a vila num passo separado, nao encolher a floresta.

---

## 2. O esboco

Cada caractere abaixo e um bloco de **4 x 4 tiles**. O desenho inteiro e 18 x 14
blocos = 72 x 56 tiles.

```
        c0  c2  c4  c6  c8  c10 c12 c14 c16
   r0   TTTTTTTTTTTTTTTTST     y  0..3
   r1   TTooooTTTTTTTTo7pT     y  4..7
   r2   TTo6ooTTTTTTTToooT     y  8..11
   r3   TTopppppppppppppTT     y 12..15
   r4   TTTTTTTpTTTTTpTTTT     y 16..19
   r5   ~~~~~~~4~~~~~X~~~~     y 20..23
   r6   TTTTToooo TTTo5oTTT    y 24..27
   r7   TTTTTo3ooppppTTTTT     y 28..31
   r8   TTTTToooo TTTTTTTTT    y 32..35
   r9   TTTTTTpTTTTTTTTTTT     y 36..39
   r10  To1oTo2oTTTTTTTTTT     y 40..43
   r11  EpppppppTTTTTTTTTT     y 44..47
   r12  Tooo Tooo TTTTTTTTTT   y 48..51
   r13  TTTTTboTTTTTTTTTTT     y 52..55
```

```
T  mata fechada, nao se atravessa      ~  riacho
o  clareira, grama e luz               X  travessia de teia
p  trilha de terra                     E  entrada, vem da vila
b  bau escondido                       S  saida, vai pra Ponte dos Trolls
1..7  os sete lugares, na lista abaixo
```

O caminho principal e um **S deitado**: entra no oeste embaixo, corre pro leste,
sobe pelo meio, atravessa o riacho, corre pro leste de novo em cima e sai no
nordeste. Nunca ha duas saidas visiveis ao mesmo tempo.

---

## 3. Os sete lugares

| # | Lugar | Onde (tiles) | O que tem | Por que existe |
|---|-------|--------------|-----------|----------------|
| 1 | **Boca da Trilha** | x 2..15, y 40..52 | placa de madeira com seta, arco de galhos, primeiro par de pegadas de tres dedos | primeira tela da floresta: precisa dizer "e por aqui" sem texto |
| 2 | **Bosque das Lanternas** | x 20..31, y 40..52 | cogumelos que brilham, vaga-lumes, desvio pro sul com o **bau de 3 moedas** | ensina que sair da trilha da premio, nunca castigo |
| 3 | **Clareira do Eco** | x 20..35, y 24..35 | a **Arvore que Fala**, tocos pra sentar, fogueira apagada, ponto de salvar | o coracao do mapa e a piada da cena |
| 4 | **O Tronco Caido** | x 28..35, y 20..23 | tronco atravessando o riacho, pedras, peixe pulando | travessia 1, a obvia |
| 5 | **A Teia Doce** | x 48..59, y 24..27 | ninho de aranhas, teia que da pra comer, a Matriarca simpatica | travessia 2, o atalho. As aranhas **nao** perseguem |
| 6 | **Clareira do Trovao** | x 8..23, y 4..15 | arvore partida por um raio, cajado fincado no chao, folhas girando sozinhas | a piscadela pro Trovao da Floresta, Elfo da Folha, Mago |
| 7 | **A Subida da Ponte** | x 56..67, y 4..11 | degraus de pedra, o barulho de agua ficando alto, a silhueta da ponte ao longe | saida da cena, promete a proxima |

O riacho corre de leste a oeste na altura y 20..23 e corta o mapa em dois. Ao sul
fica a floresta clara e amigavel; ao norte, a mata mais fechada e azulada, com o
caminho alto ligando a Clareira do Trovao a Subida da Ponte.

**Duas travessias, as duas certas.** O tronco caido e a teia doce levam os dois ao
mesmo caminho alto. Escolher errado nao existe.

---

## 4. As regras do mapa grande, pro Lele nao se perder

Este e o risco real de crescer o mapa. Seis regras, todas verificaveis:

1. **Uma saida por vez.** De qualquer ponto da trilha, so da pra ver uma continuacao.
   Desvio e sempre visivelmente curto e fechado no fundo.
2. **A trilha e sempre terra, o resto e sempre grama.** A cor do chao ja e o mapa.
3. **Pegadas de goblin como migalha de pao.** Um par de pegadas em cada curva,
   sempre apontando pra frente. E a pista e a placa ao mesmo tempo.
4. **Marco unico por lugar.** Cada um dos sete tem uma silhueta que nao se repete
   em nenhum outro. E assim que ele diz "ja passei pela arvore do raio".
5. **Nenhum beco vazio.** Todo desvio termina em alguma coisa: moeda, cogumelo,
   teia doce, bau, um bichinho pra conversar.
6. **A setinha dourada da Fase 1 vale aqui tambem.** Dez segundos parado, ela
   pisca na direcao do proximo objetivo. Num mapa de 17 telas ela deixa de ser
   luxo e vira obrigacao.

Nada de escuro. A parte fechada da mata e **azulada**, com feixes de luz entrando
entre as folhas, nunca preta. Sem susto, sem perseguicao, sem game over.

---

## 5. O que precisa nascer no codigo

### 5.1 A letra de mata, para nao escrever 300 arvores na mao

Hoje cada arvore da vila e uma linha em `objetos` de `mapas.ts`. Na floresta seriam
umas 300 linhas escritas a mao, e isso quebraria na primeira mexida no desenho.

A saida e uma letra nova no desenho do chao:

```
T  mata fechada   ->  tile de grama escura, solido, e o gerador planta
                      as arvores por cima sozinho
```

`montarChao()` continua devolvendo a matriz de tiles, e uma funcao irma,
`plantarMata()`, le o mesmo desenho e devolve a lista de arvores, escolhendo a
variacao pela posicao (a mesma conta estavel que ja existe: `x * 7 + y * 13`).
A colisao vem do tile, nao de cada arvore, o que e mais barato e mais confiavel.
Assim o desenho em texto continua sendo a unica fonte da verdade, e cresce sem dor.

Letras novas do chao, alem de `T`:

```
f  folhagem no chao       s  agua rasa do riacho
t  trilha estreita        P  pedra de rio (ja existe como solido)
```

### 5.2 Transicao entre mapas

E o item da Fase 2 que ainda nao existe. Proposta minima:

```ts
export type Saida = { x: number; y: number; w: number; h: number;
                      para: string; entrada: { x: number; y: number } };
```

`Mapa` ganha `saidas: Saida[]`. `Mundo` deixa de importar `VILA` fixo e passa a ler
`estado().lugar`, com um registro `MAPAS: Record<string, Mapa>`. Encostar numa
saida faz esmaecer, trocar o mapa e reaparecer na entrada indicada. O estado ja tem
lugar e ja salva; e so passar a usar.

### 5.3 Sistemas novos

- **Andarilho.** Aranha que anda devagar numa rota de dois ou tres tiles, ida e
  volta, sem nunca olhar pro heroi. Uma funcao pequena em `src/sistemas/`, nao um
  sistema de IA.
- **O eco.** A Arvore que Fala guarda a ultima linha dita na cena e repete. Se ela
  ainda nao ouviu nada, repete o nome do heroi. Se o heroi se chamar Trovao, ela
  faz festa.
- **Decalque.** Objeto sem colisao desenhado embaixo do heroi (pegadas, folhas,
  poca). Ja da pra fazer com `solido: false`, falta so a profundidade certa.

### 5.4 Onde o conteudo mora

Se `mapas.ts` passar de umas 300 linhas, vira pasta: `src/dados/mapas/vila.ts`,
`src/dados/mapas/floresta.ts` e um `index.ts` que reexporta. O contrato de
"conteudo separado de codigo" continua valendo igual.

---

## 6. A arte que falta

Tudo por `arte/`, nada de PNG na mao. Proposta de arquivo novo: `arte/floresta.py`,
irmao de `arte/mundo.py`.

**Tiles** (`arte/tiles.py`): grama escura de mata, folhagem de chao, trilha
estreita, agua rasa com pedra, borda de barranco.

**Objetos** (`arte/floresta.py`):

| Peca | Nota |
|------|------|
| pinheiro alto, 2 variacoes | o tijolo da mata fechada, precisa ficar bom em bloco |
| copa escura de fundo | a faixa azulada do norte |
| arvore-que-fala | sprite proprio, com quadro de boca aberta e fechada |
| tronco caido, horizontal | a ponte sobre o riacho |
| toco, raiz exposta, samambaia, cogumelo | o enchimento das clareiras |
| pedra grande e pedra com musgo | marcos de canto |
| teia doce, e o portao de teia | rosa clara, comestivel, nada de aranha assustadora |
| pegadas de tres dedos | decalque, dois quadros de direcao ja bastam |
| arvore partida por raio | o marco da Clareira do Trovao |
| cajado fincado | a piscadela |
| degraus de pedra | a subida da ponte |

**Ja existe e da pra reusar:** arvore, arvore-escura, arbusto, fogueira, bau,
placa, cerca, e os quatro sprites de aranha.

---

## 7. Ordem de execucao

Cada passo tem que deixar o jogo jogavel de ponta a ponta antes do seguinte.

- [ ] **7.1 Esqueleto que anda.** Letra `T`, `plantarMata()`, transicao de mapa,
      e o desenho de 72 x 56 com arte emprestada da vila. Objetivo: sair da vila,
      atravessar a floresta inteira, chegar na saida da ponte. Feio, mas inteiro.
- [ ] **7.2 A arte da floresta.** `arte/floresta.py`, os tiles novos, os pinheiros.
      Objetivo: a floresta deixar de parecer a vila com mais arvores.
- [ ] **7.3 Os sete lugares.** Marco de cada um, o bau, os cogumelos, o riacho e as
      duas travessias.
- [ ] **7.4 A vida.** Arvore que Fala com o eco, as aranhas andarilhas, a teia doce,
      as pegadas em cada curva.
- [ ] **7.5 Nao se perder.** Setinha de destino ligada aos objetivos da floresta,
      som de passo mudando na terra e na madeira, e o teste de verdade: o Lele
      atravessa sozinho, sem ninguem falando nada.

---

## 8. O que verificar antes de dizer que terminou

Alem do de sempre (`npm run build`, `verificar`, `contraste`, `auditar`,
`conferir`), este mapa pede tres conferencias proprias:

1. **Nenhum lugar inalcancavel.** Um teste que varre o mapa a partir da entrada e
   confirma que a saida, os sete lugares e o bau sao todos alcancaveis andando.
   Cabe em `ferramentas/`, junto dos outros verificadores.
2. **Nenhuma trilha de um tile so.** Corredor de largura 1 e onde a crianca fica
   presa na quina. Minimo dois tiles em toda a trilha principal.
3. **Quadro por quadro no iPad.** Mapa cinco vezes maior e mais objeto na tela;
   conferir que nao cai o desempenho antes de encher de detalhe.
