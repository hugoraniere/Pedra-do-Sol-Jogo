# Plano: resolucao, contraste e UI

Escrito depois da reforma de racas e classes, para ser executado em fases.
Nada aqui foi implementado ainda.

## O problema, em uma frase cada

**Resolucao.** O jogo roda em 320 x 192 pixels logicos, com tile de 16 e
personagem de 16 x 32. Num monitor de 1440p esse pixel logico vira um quadrado
de 7 px de lado. Da leitura, mas nao da detalhe: um rosto tem 4 px de largura
para dois olhos e uma boca, e por isso todo personagem tem a mesma cara.

**Contraste.** A paleta inteira mora na faixa media. Grama 5eaa64, terra
b08658, madeira 805838. Sao cores bonitas e proximas demais entre si: o
personagem some no fundo quando anda pela grama, e o texto cinza sobre creme
tem contraste de leitura baixo para uma crianca de 7 anos.

**UI.** O design system resolve posicao, nao densidade. Os paineis sao grandes,
o texto e pequeno dentro deles, e as telas de criacao tem muito ar em cima e
tudo espremido embaixo.

## O que decidir antes de comecar

Duas escolhas mudam todo o resto. Nao da para adiar.

### Escolha 1: qual resolucao

| Opcao | Tile | Personagem | Tela | O que custa |
|---|---|---|---|---|
| A. Ficar em 16 | 16 | 16 x 32 | 320 x 192 | nada, e o que temos |
| B. Dobrar para 32 | 32 | 32 x 64 | 640 x 384 | redesenhar TODA a arte |
| C. Meio termo, 24 | 24 | 24 x 48 | 480 x 288 | redesenhar toda a arte, e 24 nao e potencia de 2 |

**Recomendo a B.** O motivo nao e resolucao pela resolucao: e que 32 x 64 e a
menor caixa em que um rosto ganha expressao (8 px de largura util contra 4) e
em que a roupa de uma classe se distingue da de outra por desenho, nao por cor.
Stardew usa 16 x 32 e resolve isso com um estilo bem especifico de cabeca
enorme. Nos ja estamos no limite desse estilo.

A opcao C parece um bom meio termo e nao e: 24 nao dobra nem divide nada, e
toda conta de meio pixel volta a aparecer. Se for para redesenhar, dobre.

**O custo real da B, sem enfeite.** Toda a arte e gerada por codigo, entao nao
e redesenhar a mao: e reescrever as funcoes de desenho com o dobro do espaco.
Isso e bom e ruim. Bom porque nao ha 113 PNGs para repintar, so 10 arquivos
python. Ruim porque dobrar nao e multiplicar por dois: um contorno de 1 px
continua sendo 1 px, uma sombra de 2 px continua sendo 2 px, e um olho que era
2 x 2 vira 3 x 4, nao 4 x 4. Cada funcao precisa de decisao humana, nao de
`* 2`.

Estimativa honesta: os tiles e os objetos do mundo saem rapido, porque sao
formas grandes. As pessoas sao o trabalho de verdade, e sao tambem onde o ganho
aparece.

### Escolha 2: quanto contraste

Contraste aqui nao e so "cores mais fortes". Sao tres decisoes separadas:

1. **Separar o personagem do chao.** O jeito classico e escurecer o chao e
   clarear o personagem, mais um contorno mais escuro em volta de tudo que se
   move. Custa pouco e resolve a maior parte.
2. **Afastar os tons dentro de cada material.** Hoje cada material tem tres
   tons proximos. Abrir a distancia entre eles da volume sem trocar de cor.
3. **Endurecer o texto.** Texto secundario mais escuro, e um contorno de 1 px
   atras do texto que fica em cima do mundo.

A 1 e a 3 sao seguras e melhoram na hora. A 2 muda a cara do jogo e precisa do
seu olho antes de virar padrao.

## As fases, em ordem

Cada fase termina com o jogo jogavel. Nao comece a seguinte sem testar a
anterior.

### Fase 0. Contraste, sem mexer na resolucao

Barato, rapido, e ja melhora o que voce vai testar hoje. Nada aqui depende da
decisao de resolucao.

- Escurecer a grama e a terra em dois passos e clarear a pele em um. O
  personagem passa a saltar do chao.
- Aumentar a distancia entre sombra e luz na funcao `rampa()` de
  `arte/paleta.py`. Hoje a forca padrao e 42; testar 56 e 64.
- Contorno mais escuro em tudo que se move (pessoas, goblins, aranhas) e
  contorno normal no cenario. E o truque que os jogos de pixel usam para dizer
  ao olho o que e ator e o que e fundo.
- Texto: o secundario ja ficou mais escuro nesta rodada. Falta a caixa de fala
  ganhar contorno proprio e o texto do topo ganhar sombra de 1 px.
- Passar as telas pelo auditor e olhar os screenshots lado a lado, antes e
  depois.

Como medir em vez de opinar: escrever uma ferramenta pequena que calcula a
razao de contraste entre cada par de cores que se encostam no jogo (texto sobre
painel, personagem sobre grama) e lista as que ficam abaixo de 3:1. Contraste
de interface tem numero, nao precisa de gosto.

### Fase 1. UI mais densa

Tambem independente da resolucao.

- Rever a escala de espacos do design system. Hoje os paineis respiram demais
  em cima e apertam embaixo.
- Uma segunda fonte de bitmap, maior, para titulo. Hoje o titulo e a mesma
  fonte de 8 px esticada, e esticar fonte de pixel e o que mais suja a tela.
- Caixa de fala com retrato do personagem que fala. E a mudanca que mais ajuda
  uma crianca que le devagar: ela sabe quem esta falando sem ler o nome.
- Botao de acao maior e com o nome do que vai acontecer, nao so a letra A.

### Fase 2. Dobrar a resolucao

So depois de 0 e 1 aprovadas.

A ordem importa, e e esta:

1. **Primeiro o esqueleto, nao o desenho.** `arte/pessoa.py` ja tem toda a
   anatomia em constantes e uma funcao `esqueleto()`. Dobrar comeca ali: novas
   proporcoes, novos pontos de encaixe. Se o esqueleto sair certo, o resto e
   preenchimento.
2. **Uma pessoa de teste, em todos os 24 quadros.** Antes de tocar em qualquer
   outra coisa. E aqui que se descobre se 32 x 64 esta bom ou se o estilo
   precisa mudar junto.
3. **Tiles e objetos do mundo.** Sao formas grandes, e o ganho e imediato:
   telhado com telha de verdade, arvore com folha de verdade.
4. **Racas, roupas, cabelos, chapeus, armas.** Nesta ordem, porque cada uma
   depende da anterior.
5. **Goblins e aranhas.**
6. **A interface.** Painel de 9 fatias em 32, icones em 32, e a fonte de bitmap
   regerada no dobro.

O que NAO muda: a arquitetura. Os pontos de encaixe, o design system, o
auditor, o verificador e a conferencia das 25 combinacoes continuam valendo
iguais. Foi para isso que eles existem. Os numeros que hoje estao em
`config.ts` (TILE, ALTURA_PERSONAGEM, PECA_ROUPA) ja sao constantes, e o
`encaixes.json` ja e gerado: dobrar nao deveria exigir cacar coordenada em
nenhum `.ts`.

O que precisa de atencao especial:

- **A tela.** Em 32 x 32, os mesmos 20 x 12 tiles de mundo pedem 640 x 384
  pixels logicos. Isso reduz a escala inteira que cabe na janela: onde hoje o
  canvas e multiplicado por 4, passaria a ser por 2. O jogo continua nitido,
  mas fica fisicamente menor num monitor pequeno. Vale rever os tres niveis de
  visao junto.
- **Os mapas.** `mapas.ts` desenha o chao em texto, uma letra por tile. Isso
  nao muda, porque a letra e o tile, nao o pixel. Bom sinal de que a separacao
  entre conteudo e arte esta certa.
- **Peso.** 113 PNGs hoje somam 556 KB. No dobro, cerca de 2 MB. Sem problema
  para desktop, e vale medir no celular.

### Fase 3. O que a resolucao nova libera

Coisas que hoje nao cabem e que passam a caber:

- Rosto como camada propria, com expressao. Feliz, assustado, pensando.
- Quadro de ataque de verdade, em vez de o `conjura` servir para tudo.
- Sombra que muda com a hora do dia.
- Roupa com manga, que hoje nao existe porque o braco tem 2 px de largura.

## Riscos, ditos com todas as letras

**O maior risco nao e tecnico, e de gosto.** Dobrar a resolucao muda a cara do
jogo. O que hoje e fofo e simples pode virar generico se o desenho nao
acompanhar. A protecao contra isso e a fase 2 passo 2: uma pessoa de teste
completa antes de qualquer outra coisa, para voce olhar e dizer sim ou nao,
com pouco trabalho perdido se for nao.

**O segundo risco e parar no meio.** Metade da arte em 16 e metade em 32 nao
tem como funcionar: o jogo fica quebrado ate a ultima peca. Por isso a fase 2
so deve comecar quando houver tempo de terminar, e por isso as fases 0 e 1
vem antes, ja que elas melhoram o jogo sem esse risco.

## Sugestao de ordem, se for para escolher uma so

Fase 0 primeiro, sozinha. E o melhor retorno por hora de trabalho, nao depende
de decisao nenhuma, e voce consegue julgar o resultado na mesma tarde. Depois
dela, a decisao sobre dobrar a resolucao fica mais facil, porque parte do que
hoje parece falta de resolucao pode ser so falta de contraste.
