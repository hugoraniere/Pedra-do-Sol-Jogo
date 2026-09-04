# Guia de arte

## De onde vem a arte

Toda a pixel art e **gerada por codigo**. Rodar `npm run arte` apaga e reescreve
`public/assets`. Nunca coloque um PNG na mao ali.

Os geradores estao separados por assunto:

| Arquivo | O que gera |
|---|---|
| `arte/paleta.py` | as cores, unica fonte de cor do projeto |
| `arte/tiles.py` | so chao: grama, terra, caminho, agua, areia, caverna |
| `arte/mundo.py` | objetos inteiros: casa, arvore, poco, barraca, cerca, varal |
| `arte/gente.py` | heroi em tres camadas, oito NPCs e o goblin, 16x32 |
| `arte/ui.py` | painel de 9 fatias e icones de interface |
| `arte/sprites/` | PNG desenhado a mao, ganha do gerado se o nome bater |

Isso parece esquisito no comeco e compensa rapido: mudar a cor da grama do jogo
inteiro e mudar uma linha em `arte/paleta.py`. E o gerador e um arquivo de texto,
entao o git mostra o que mudou na arte, coisa que binario nao mostra.

## As medidas

| Coisa | Tamanho |
|---|---|
| tile de chao | 16 x 16 px |
| personagem | 16 x 32 px |
| casa | 48 a 64 px de largura, 60 a 68 de altura |
| arvore | 40 x 52 px |
| icone de interface | 16 x 16 px |
| tela logica | 320 x 192 px |

**Objeto nao e tile.** Casa, arvore e poco sao PNG proprio, do tamanho que precisarem,
posicionados por cima do chao e ancorados pelo pe. Foi essa mudanca que tirou o jogo
da cara de quadradinho repetido. O tamanho e a caixa de colisao de cada objeto saem
em `public/assets/objetos.json`, que o jogo le em runtime, entao adicionar um objeto
novo nao exige mexer em nenhum arquivo `.ts` alem da lista `OBJETOS` no config.

Frames do personagem: 4 colunas (parado, passo 1, parado, passo 2) por 4 linhas
(baixo, esquerda, direita, cima). Sempre nessa ordem, o codigo de animacao depende disso.

## O tracado

O jogo tem que parecer o material impresso do RPG de mesa. As referencias estao em
`docs/referencia/imagens`. O que define o estilo:

- **Contorno preto grosso** em tudo. Em pixel art isso vira 1 px de `TINTA` em volta
  de cada forma que precisa se destacar do fundo.
- **Cores chapadas**, no maximo tres tons por material: claro, base, escuro.
- **Nada sombrio.** Mesmo a caverna e clara e legivel. Se ficou dificil de enxergar,
  esta errado, mesmo que fique bonito.
- **Nada de perspectiva realista.** Camera de cima, um pouco inclinada, igual Stardew.

## A paleta

`arte/paleta.py` para a arte, `COR` em `src/dados/config.ts` para a interface. As
duas tem que continuar iguais. Cor nova entra nos dois arquivos, com nome em
portugues, e so depois e usada.

Nunca escreva um valor de cor no meio do codigo.

## Duas coisas que fazem toda a diferenca

**Contorno.** `contorno_alfa()` em `arte/mundo.py` e `contorno()` em `arte/gente.py`
poem 1 px de TINTA em volta de tudo que ja foi desenhado. Sem isso o objeto some no
fundo. Chame sempre no fim da funcao, nunca no meio.

**Sombra de chao.** `sombra()` desenha uma elipse escura translucida embaixo do
objeto. E o que faz a casa parecer apoiada no chao em vez de flutuando. Todo objeto e
todo personagem tem a dele.

Tile de chao nunca tem transparencia. Se um tile sair com fundo vazio, o fundo da
camera aparece por baixo e fica um buraco escuro na tela.

## Adicionar um tile de chao

1. Escreva a funcao em `arte/tiles.py`, usando so cores da paleta.
2. Coloque na lista `TILES`, no fim do arquivo.
3. Rode `npm run arte`.
4. Adicione o indice em `T` no `config.ts`, na mesma ordem da lista.
5. Se for solido, adicione em `SOLIDOS`.
6. Se quiser desenhar com ele no mapa, adicione a letra em `LETRA_TILE` em `mapas.ts`.

## Adicionar um objeto

1. Escreva a funcao em `arte/mundo.py`. Termine com `contorno_alfa(im)` e comece com
   `sombra(...)`.
2. Coloque na lista `OBJETOS`, com a proporcao da caixa de colisao
   `(largura, altura)` em fracao do tamanho da imagem.
3. Adicione o nome em `OBJETOS` no `config.ts`.
4. Rode `npm run arte` e use no mapa: `{ nome: "seu-objeto", x, y }`.

Sempre olhe o resultado ampliado antes de usar. Um jeito rapido: abrir o PNG num
visualizador com zoom sem suavizacao.
