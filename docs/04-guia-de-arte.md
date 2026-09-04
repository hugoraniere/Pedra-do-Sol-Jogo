# Guia de arte

## De onde vem a arte

Toda a pixel art e **gerada por codigo**, em `arte/gerar.py`. Rodar `npm run arte`
apaga e reescreve `public/assets`. Nunca coloque um PNG na mao ali.

Isso parece esquisito no comeco e compensa rapido: mudar a cor da grama do jogo
inteiro e mudar uma linha em `arte/paleta.py`. E o gerador e um arquivo de texto,
entao o git mostra o que mudou na arte, coisa que binario nao mostra.

## As medidas

| Coisa | Tamanho |
|---|---|
| tile | 16 x 16 px |
| personagem | 16 x 24 px |
| objeto de cenario | 16 x 16 px |
| tela logica | 320 x 192 px |

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

## Tiles que ficam por cima da grama

Copa, tronco e arbusto sao desenhados **em cima de um tile de grama**, nao em fundo
transparente. Se voce criar um tile novo com fundo vazio, o fundo da camera aparece
por baixo e fica um buraco escuro na tela. Foi exatamente esse o primeiro bug de arte
do projeto.

## Adicionar um sprite novo

1. Escreva a funcao que desenha, em `arte/gerar.py`, usando so cores da paleta.
2. Coloque a funcao na lista certa (`TILES`, `NPCS`, ou a folha de objetos).
3. Rode `npm run arte`.
4. Se for tile, adicione o indice em `T` no `config.ts`, na mesma ordem da lista.
5. Se for solido, adicione o indice em `SOLIDOS`.

Sempre olhe o resultado ampliado antes de usar. Um jeito rapido: abrir o PNG num
visualizador com zoom sem suavizacao.
