# Arquitetura

## Stack

- **Phaser 3** para cena, camera, tilemap, fisica arcade e animacao de sprite.
- **Vite** para servidor de desenvolvimento e build.
- **TypeScript** em modo estrito.
- **Python + Pillow** so para gerar a pixel art, fora do runtime do jogo.

Phaser foi escolhido porque tilemap, colisao, camera que segue e spritesheet ja vem
prontos e testados. Escrever isso na mao em canvas puro seria semanas de trabalho
que nao aparecem para quem joga.

## Resolucao

O jogo renderiza em **320 x 192 pixels logicos** e o canvas e escalado por numero
inteiro ate caber na tela. Tile de 16 px, personagem de 16 x 24 px. Num iPad isso da
sprites bem grandes e leitura facil, que e o que importa para 7 anos.

Mexer em `LARGURA` e `ALTURA` em `src/dados/config.ts` muda o enquadramento do jogo
inteiro. Cuidado: numeros que nao sao multiplos de 16 deixam meia fileira de tile
aparecendo na borda.

## As cenas

| Cena | Papel |
|---|---|
| `Boot` | carrega os PNG, decide se vai para criacao ou direto para o mundo |
| `Criacao` | criacao do personagem em passos, com o boneco atualizando ao vivo |
| `Mundo` | mapa, heroi, NPCs, objetos, colisao, interacao |
| `Interface` | roda em paralelo com `Mundo`: corac~oes, moedas, direcional e caixa de fala |

`Interface` e uma cena separada de proposito. Assim a camera do mundo pode se mover
livremente sem arrastar a interface junto, e a caixa de fala nunca fica fora de lugar.

A comunicacao entre as duas e por evento, nunca por chamada direta:
`Mundo` emite `falar` para a `Interface`, `Interface` emite `acao` e `dialogo-fim`
de volta. Se voce precisar de mais um canal, use evento tambem.

## O heroi em tres camadas

`src/sistemas/heroi.ts` monta o personagem como um `Container` com tres sprites:

1. `heroi-base` : pele, olhos, orelhas, botas, cajado. Sai colorido do gerador.
2. `heroi-roupa` : a tunica, desenhada em **branco** no PNG.
3. `heroi-cabelo` : o cabelo, desenhado em **branco** no PNG.

As camadas 2 e 3 recebem `setTint()` com a cor que o jogador escolheu. Por isso
qualquer combinacao de cabelo e roupa funciona sem gerar nenhum sprite novo. Ao
adicionar uma cor nova em `CABELOS` ou `ROUPAS`, nada mais precisa mudar.

O corpo de fisica cobre so os pes (10 x 7 px). E o que faz o heroi passar por tras
do telhado e das copas sem travar, e o que da a sensacao de profundidade.

## Mapas em texto

`src/dados/mapas.ts` guarda cada mapa como um array de strings, um caractere por
tile. Isso e proposital: da para desenhar um mapa novo no editor de texto, ver o
desenho enquanto escreve, e revisar no diff do git.

Letras maiusculas e digitos sao **marcadores**: viram NPC, objeto ou saida, e o tile
embaixo vira grama. A tabela esta em `MARCADORES`.

## Estado

`src/sistemas/estado.ts` e a unica fonte de verdade sobre o progresso, e salva em
`localStorage` a cada mudanca. Nenhuma cena guarda progresso em variavel propria.
Toda leitura e `estado()`, toda escrita passa por `salvar()`.

Se `localStorage` falhar (aba anonima, navegador travado), o jogo continua rodando,
so nao lembra. Isso e tratado com try/catch e nao deve virar erro na tela.

## Controles

`src/sistemas/controles.ts` junta teclado e toque numa interface so. O direcional na
tela vive na cena `Interface` e escreve em `controles.toque`, que a cena `Mundo` le
no `update`. Nenhuma cena le evento de teclado cru, com uma excecao consciente:
a digitacao do nome na criacao do personagem.
