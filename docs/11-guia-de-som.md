# O som do Reino de Aurora

Este documento existe para quem chega no projeto sem ter acompanhado o som ser
feito. Ele diz onde as coisas estao, o que nao se deve mexer sem saber por que, e
como fazer as tarefas do dia a dia.

Regra de bolso, antes de tudo: **som que falta e silencio, nunca excecao.** O
Lele nao pode ficar preso numa tela porque um arquivo de audio nao baixou.
Nenhuma linha da parte de som pode derrubar o jogo.

## O caminho de um som

```
  som/gerar.py          escreve o arquivo       (a receita)
        |
        v
  public/assets/som/*.mp3                       (o resultado, descartavel)
        |
        v
  src/dados/sons.ts     diz o que existe        (o catalogo, so dado)
        |
        v
  src/sistemas/som.ts   toca                    (unico que fala com o Phaser)
        |
        v
  src/cenas/*.ts        pede: tocar("moeda")
```

Cada seta e um lugar onde os dois lados podem desencontrar em silencio, e por
isso `npm run verificar` cruza os quatro: se o catalogo pede um arquivo que nao
existe, ou uma cena pede um som fora do catalogo, ele reprova antes de o jogo
abrir. Desde que o `verificar` entrou no `npm run build`, isso reprova a
compilacao tambem.

## Os arquivos

| Arquivo | O que e |
|---|---|
| `som/gerar.py` | **A unica fonte de som.** As receitas de sintese e as duas trilhas escritas nota por nota. `npm run som` regera tudo. |
| `som/prontos/` | Som gravado que **ganha** do gerado, pelo nome. Igual `arte/sprites/` ganha da arte gerada. |
| `som/manifesto.json` | O que saiu na ultima geracao, e se veio de receita ou de `prontos/`. Gerado, nao editar. |
| `public/assets/som/` | Os 89 arquivos. **Descartavel:** apagados e refeitos a cada `npm run som`. Nunca cole nada aqui na mao. |
| `src/dados/sons.ts` | O catalogo. So dado, nenhuma logica, nenhum Phaser, igual `conteudo.ts`. |
| `src/sistemas/som.ts` | Quem toca. Unico arquivo do projeto que fala com `this.sound`. |
| `src/cenas/Som.ts` | Uma cena que nao desenha nada e existe so para carregar audio. Ver "decisoes" abaixo. |
| `banca.html` | A banca de audicao. `npm run dev` e abrir `/banca.html`. |
| `ferramentas/verificar.mjs` | Secao 11: cruza catalogo, disco e quem toca o que. |

## As regras

**Nada de som solto.** Todo som sai de `som/gerar.py`. MP3 colado na mao em
`public/assets/som` some na proxima geracao. Som gravado entra por
`som/prontos/<nome>.mp3`.

**O catalogo e dado, nao codigo.** `sons.ts` nao importa Phaser e nao decide
nada. Som novo comeca la, sempre, nunca no meio de uma cena.

**Nenhuma cena chama `this.sound`.** Ela chama `tocar("moeda")`. E a mesma
disciplina do `caixa()`/`pilha()` para a UI e do `estado.ts` para o progresso:
um lugar so sabe como a coisa e feita.

**O volume e relativo a fala,** que e o som mais importante do jogo e vale 1.
Tudo abaixo disso. Trilha e o mais baixo de todos, porque musica que disputa com
a fala atrapalha justamente quem le devagar.

**Os grupos terminam em `satisfies`, nao em `: Record<string, FichaSom>`.** A
anotacao apagaria os nomes e deixaria qualquer texto passar; o `satisfies` faz
dos nomes um tipo, entao `tocar("mueda")` nao compila. E a primeira das tres
redes contra som quebrado.

## Como fazer as coisas

### Ouvir tudo

```bash
npm run dev
```

e abrir `http://localhost:5173/banca.html`. A banca le o catalogo de verdade, nao
uma lista copiada: som novo aparece la sozinho. Cada linha toca **no volume e na
variacao de altura do jogo**, que e diferente de ouvir o arquivo cru no Finder.
Da para tocar uma familia inteira de uma vez, e o que falta aparece em vermelho.

### Um som novo

1. Escreva a receita em `som/gerar.py`, dentro de `RECEITAS`.
2. Rode `npm run som`.
3. Ponha a ficha no grupo certo de `sons.ts`: `{ arquivo, volume, variacao? }`.
4. Chame `tocar("nome")` na cena.
5. `npm run verificar`.

Pular o passo 3 nao compila. Pular o 2 o verificador pega. Pular o 4 vira um
aviso de "som que nenhuma cena toca", que e uma lista util, nao um erro.

### Trocar um rascunho por som de verdade

Ponha o arquivo em `som/prontos/<mesmo-nome>.mp3` e rode `npm run som`. Nao se
mexe em nenhuma linha de codigo. O manifesto passa a dizer `"origem": "pronto"`.

E assim que o jogo sai de bipe sintetizado para som bom: **um arquivo por vez,
sem refatoracao.** Prefira licenca CC0 a CC-BY: a Fase 4 do roadmap publica o
jogo, e atribuicao obrigatoria vira divida permanente.

### Mexer na melodia

As duas trilhas sao a unica coisa deste gerador que e **escrita**. O resto e
ruido filtrado e bipe, e esta certo assim: ninguem compoe um passo na grama. Ja
uma musiquinha ou tem melodia ou nao e musiquinha.

Elas estao em `MENU_MELODIA` e `VILA_MELODIA`, no formato
`(em que batida entra, qual nota, quantas batidas dura)`, com a nota em numero
MIDI (69 e o la 440, e somar 12 sobe uma oitava). Mexer nisso nao exige entender
nada de sintese. Depois, `npm run som`.

Se voce for trocar o comprimento da faixa, o `sequenciar()` precisa saber quantas
batidas tem a volta, e os acordes precisam cobrir todas elas.

### Mudar volume ou afinacao

Tudo em `sons.ts`, sem regerar nada. `volume` e o nivel; `variacao` e quanto a
altura sorteia a cada disparo, em centesimos de tom — sem isso, som repetido soa
como amostra colada. `VOZ` da a altura fixa de cada personagem na fala.

## Decisoes que parecem erradas e nao sao

Estas sao as que alguem tenta "consertar" e quebra.

**Por que existe uma cena so para carregar som.** O navegador nao decodifica
audio antes do primeiro toque do jogador. Pedir os sons no `preload` do Boot,
junto com a arte, trava a barra de carregamento pela metade: os arquivos de audio
ficam presos esperando a liberacao, ocupam as vagas de download, e os PNG
seguintes nunca chegam a ser pedidos. **Nenhum erro aparece, porque tecnicamente
nada falhou.** No iPad e pior: a liberacao so vem no toque, e nao existe toque
numa tela de carregamento. Por isso `src/cenas/Som.ts`, que comeca junto com o
jogo, nunca para, e so puxa os arquivos depois da liberacao.

**Por que o passo tem o corpo no medio, e nao no grave.** O alto-falante do iPad
nao entrega quase nada abaixo de uns 300 Hz. Passo apoiado no grave soa cheio no
fone e some no aparelho em que o Lele joga. Subir o volume nao resolveria: so
aumentaria uma faixa que aquele alto-falante nao reproduz.

**Por que o passo vale 0.45 e nao 0.2.** O instinto e deixar baixo o som que mais
toca, para nao cansar. Na pratica isso o apagou. Andar e a acao que o Lele mais
faz, e acao que nao devolve nada parece que nao aconteceu.

**Por que o passo sai do quadro da animacao, e nao de um cronometro.**
`CICLO_CAMINHADA` e `[passoA, parado, passoB, parado]`, entao o pe encosta nos
quadros 1 e 3. Com cronometro, mexer em `FPS_CAMINHADA` desencontraria o som do
desenho sem avisar ninguem.

**Por que a musica nao carrega no Boot.** Faixa inteira e pesada e travaria a
barra de carregamento no wifi do iPad. Ela entra depois, com o jogo ja rodando, e
se nao chegar o jogo segue em silencio.

**Por que o loop da musica emenda por cima de si mesmo.** `sequenciar()` escreve
as notas num trecho do tamanho exato de uma volta, e o que passa do fim volta
para o comeco em vez de ser cortado: quando a primeira nota retorna, a cauda do
ultimo sino ja esta tocando por cima dela. O fade cruzado que serve para os
ambientes (`emenda_de_loop`) nao serve aqui, porque **encurta** o trecho e
desalinha o compasso.

**Por que a Pausa abaixa a trilha em vez de parar.** Parar faz a faixa recomecar
do zero na volta, e isso se ouve.

**Por que MP3 e nao OGG.** O Safari so toca OGG a partir do iOS 18.4. MP3 e o
unico formato que funciona em tudo sem manter duas versoes de cada arquivo.

**Por que `pendente: true` existe.** Marca som que o catalogo ja projetou e que
ainda nao existe em disco. Nao e esquecimento, e encomenda: o jogo nem tenta
pedir o arquivo, entao nao ha 404, e o verificador lista em vez de reprovar.
Quando o arquivo chegar, apague a linha — o verificador avisa se voce esquecer.
Hoje nenhuma ficha esta pendente, e e por isso que `som.ts` anota a ficha da
musica como `FichaSom` em vez de deixar inferir: sem nenhuma pendente, o tipo
inferido nao teria mais o campo para a guarda consultar.

**Por que o verificador so tira `import` ancorado no comeco da linha.** A versao
solta abria a mordida na palavra "import" dentro de um comentario e so fechava no
proximo `from "..."`, comendo milhares de caracteres de corpo de cena. O
resultado era o verificador jurar que nenhuma cena usava `COLCHAO` nem `PONTOS`
com o `Mundo.ts` usando os dois. Aviso falso e pior que aviso nenhum: ensina a
ignorar a lista inteira.

## As tres redes contra som quebrado

Som que falta nao aparece na tela do jeito que sprite faltando aparece. Sobra um
buraco que ninguem nota ate alguem perguntar "nao era pra tocar alguma coisa
aqui?". Por isso:

1. **Tipo.** `tocar()` so aceita chave que existe no catalogo. Som pedido antes
   de entrar la nao compila.
2. **`npm run verificar`.** Cruza catalogo, disco e quem toca o que. Roda dentro
   do `npm run build`.
3. **O doutor.** Em jogo, som que nao carregou vira linha no painel de
   `src/sistemas/doutor.ts`, o unico console que existe no iPad. Reclama uma vez
   por som, nao por disparo.

## Como saber que esta funcionando

```bash
npm run som        # 89 rascunhos, deterministico: gerar duas vezes da o mesmo arquivo
npm run build      # ja chama o verificar antes de compilar
npm run dev        # e abrir /banca.html: tem que dizer 89 no catalogo, 89 em disco, 0 faltando
```

No jogo: a trilha do menu entra na tela de titulo, o passo muda de som conforme o
chao, a fala sai letra por letra na altura de cada personagem, e a fogueira, o
poco, a feira e o rio sobem e descem conforme o heroi chega perto.

## O que ainda falta

O verificador responde isso sozinho, sem ninguem perguntar, e a resposta muda
conforme as cenas nascem. Hoje ele lista **47 sons prontos esperando cena**:
armas, golpes especiais, impacto por material, dado, desfecho, magias, bestiario
e as tres fraquezas sonoras. Nao e falha, e a lista de compras da Fase 2.

Alem disso:

- **As trilhas sao rascunho.** Sintetizadas, nao gravadas. Funcionam, mas som
  bom em `som/prontos/` ganha delas.
- **`ARMAS_SPRITE` tem 6 armas e `ARMAS` em `conteudo.ts` tem 11.** Machado,
  adaga, escudo e as tres lendarias nao tem sprite. Isso e bloqueio para as
  animacoes de golpe, e os sons das onze ja existem esperando.
- **Nao ha um so mapa alem da vila com ambiente proprio.** `COLCHAO` tem uma
  entrada. Mapa novo pede a dele.
