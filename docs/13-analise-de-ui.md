# Analise da interface, medida

Escrito depois de o Hugo dizer que a UI estava feia e quebrada. Ele estava certo,
e o que faltava era medir em vez de opinar. Este documento guarda os numeros, para
a proxima decisao de interface nao comecar do zero.

## 1. Tipografia

A fonte e a Silkscreen rasterizada em 8 px por `arte/fonte.py`.

| medida | valor | consequencia |
|---|---|---|
| desenho da letra | ~4 px | |
| avanco da letra | 6 px | **51% da largura de cada letra e vao** |
| linha | 10 px | |
| letra dentro da linha | de y+4 a y+9 | **4 px de ar acima de cada linha** |
| altura de `A` | 5 px | |
| altura de `a` | 5 px | **maiuscula e minuscula tem a mesma altura** |

**O vao.** A frase "Voce enxerga no escuro e de bem longe" ocupava 208 px e passa
a ocupar 170 com o avanco reduzido em 1. Numa linha de 256 px cabem 64 letras em
vez de 51. Nao e so densidade: com o vao antigo a palavra se desmancha em letras
soltas, o contrario do que serve para quem esta aprendendo a ler.

Corrigido em `src/sistemas/texto.ts` com `setLetterSpacing`. **O Phaser ja
multiplica o espacamento pela escala da fonte**: passar o valor multiplicado de
novo cola as letras no corpo 16.

**O ar acima da linha.** Centrar um rotulo pela altura da caixa jogava o texto
1,5 px abaixo do centro optico. Era isso que desalinhava rotulo dentro de botao e
de chapinha. Corrigido no mesmo lugar, so para quem pede `ancoraY: 0.5`.

**As minusculas.** `a` e `A` tem a mesma altura, entao todo texto le como caixa
alta, e caixa alta e a forma mais dificil para quem esta aprendendo a ler: some o
contorno da palavra que a crianca usa para reconhece-la. **Decisao em aberto:**
assumir caixa alta como estilo e parar de misturar, ou trocar a fonte.

## 2. Icones

Os 13 icones de `public/assets/ui.png`, cada um num quadro de 16x16.

- **Nenhum tem contorno.** Por isso o direcional desenha uma chapinha escura
  atras de cada seta: sem ela a seta cor de papel some sobre o painel de papel.
  O remendo esta no codigo desde sempre e o problema estava no desenho.
- **2 a 5 cores cada**, sem sombra nem volume.
- **Peso irregular:** o coracao vazio preenche 9% do quadro, o dado 55%. Nao ha
  sistema, entao icones lado a lado tem pesos visuais diferentes.
- **Tres nao se leem:** a lupa parece uma bolha azul, o livro parece uma estante,
  a mochila parece uma mala.

## 3. Escala

Com o canvas em escala 3 num iPad, 1 px logico = 3 pontos de tela.

| elemento | logico | pontos | nota |
|---|---|---|---|
| alvo de toque minimo | 15 px | 44 | o minimo para o dedo acertar |
| botao | 16 px | 48 | ok |
| icone | 16 px | 48 | ok |
| botao FECHAR, antes | 256 px | **768** | ocupava a largura inteira da janela |

Corrigido: `LARGURA_MAX_BOTAO` em `design.ts`, e `TAMANHO.alvoMinimo` como numero
com nome, derivado do dedo da crianca na escala 3, em vez de aparecer solto.

## 4. Medida de texto

`quebrar()` contava **8 px por letra**. Nenhuma letra da fonte passa de 7 e a
maioria tem 6, entao toda tela quebrava linha cedo e deixava borda vazia a
direita. Quem precisa de largura exata agora pergunta as metricas da fonte
carregada (`medirTexto`), em vez de chutar.

## 5. Cor

A paleta tem 11 cores e a interface usa 4: tinta, tinta suave, papel e ouro.
Verde, azul, roxo, brasa e rosa nao aparecem em lugar nenhum da UI, e sao as
cores do material impresso do Lele. **Ainda nao mexido.**

## O que ficou para depois

- contorno de 1 px em todos os icones, e redesenho da lupa, do livro e da mochila
- os tres icones que faltam para as abas da janela unica
- a decisao sobre a fonte
- usar a paleta inteira, e nao so quatro cores
