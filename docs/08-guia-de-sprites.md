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

Cada folha de personagem tem **6 colunas por 4 linhas**, cada quadro de 16 x 32.

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
