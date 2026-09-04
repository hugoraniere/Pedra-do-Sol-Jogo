# Plano do combate: onde estamos e o que falta

Este e o **quadro**. Ele manda na ordem do trabalho e substitui as secoes de ordem
de implementacao dos outros dois documentos, que estavam se contradizendo.

| Documento | Decide |
|---|---|
| `docs/11-combate-e-magias.md` | **o que** o combate faz: regras, magias, marcas, bestiario |
| `docs/interface-de-combate.md` | **como se parece e como se mexe**: cor, elipse, animacao, vida |
| `docs/mundo-que-reage.md` | **a camada de cima**: superficies, condicoes, itens e selos |
| `docs/plano-de-implementacao.md` | **o passo a passo executavel**, arquivo por arquivo, com as animacoes |
| **este** | **o quadro geral**: onde estamos, e a ordem das fases |

---

## 1. O que "o basico" quer dizer

Sem uma definicao, "falta muita coisa" nao tem fim. Entao:

> **O basico e uma luta inteira dentro do jogo de verdade, do encontro ao desfecho,
> sem passar pelo provador.**

Sao sete coisas, e so elas:

1. existe uma criatura no mapa da Vila Semente, que passeia e percebe o heroi
2. o heroi tem uma barra com pelo menos um golpe e uma magia
3. da pra escolher e acertar
4. a criatura perde coracao, **mostra isso**, e desiste
5. a criatura acerta o heroi, com telegrafo antes
6. heroi a zero coracoes fica tonto, e o jogo **nao para**
7. salvar e carregar nao perde nada disso

Tudo que nao esta nesta lista, por mais que ja esteja escrito no papel, e **depois
do basico**: as treze magias, a tabela de reacoes, o livro de bestiario, o dado, a
tela ARSENAL, os trinta icones.

---

## 2. O que ja existe e roda

No provador (`npm run dev`, depois `?provador`), conferido com 11 verificacoes
automaticas e `npm run build`, `verificar` e `auditar` limpos:

- [x] o laco inteiro: escolher no slot, o mundo congelar, tocar no alvo
- [x] tocar direto no inimigo ataca com a arma, sem passar pela barra
- [x] alvo fora de alcance nao recusa: o heroi anda ate la e age
- [x] seis slots com recarga em fatia de pizza, e skill de um uso por cena
- [x] golpe com arma e golpe sem arma, com fichas diferentes
- [x] bater no vazio: poeira, som de errar, e **revela criatura invisivel**
- [x] quebrar objeto do cenario
- [x] criatura perde coracao e **desiste**, nunca morre
- [x] congelamento de impacto, recuo, tremor de camera de 1px
- [x] som de arma, de impacto por material, de magia e de criatura, todos do
      catalogo que ja existia parado
- [x] `fileira()` e `grade()`, as duas primitivas de layout que faltavam

**Isso e cerca de 40% do basico.** E a metade divertida, e e a metade que prova que
o desenho funciona. A metade que falta e a que faz virar jogo.

---

## 3. O que falta para o basico, item por item

### A. A criatura de verdade . `src/sistemas/criatura.ts`, nao existe

Hoje os goblins do provador so passeiam e apanham. Falta o outro lado:

- os tres comportamentos: `passeia`, `curioso`, `medroso`
- o ciclo `notou -> telegrafa -> golpe -> recupera -> desiste`
- **telegrafo de 500ms**: agacha e estica, `!` amarelo, e o som `reage` que ja existe
- o regulador: nunca mais de duas atacando ao mesmo tempo

E o item que mais muda o jogo, porque hoje o combate e um lado so.

### B. O heroi apanhar . espalhado, nao existe

- perder coracao, com invencibilidade de 900ms piscando
- o quadro `machucado` (por ora, `conjura` serve de quebra-galho)
- **zero coracoes: fica tonto 2s, cai uma moeda, os coracoes voltam a 1**
- nenhuma tela, nenhum menu, nenhum "voce perdeu"

### C. A vida a mostra . nao existe

Os pips de coracao sobre a cabeca, que aparecem ao levar golpe e somem em 3s.
Sem isso o jogador nao consegue planejar nada. Detalhe em
`docs/interface-de-combate.md`, secao 3.

### D. A barra no jogo de verdade . **bloqueado por fronteira**

No provador a barra e desenhada dentro da propria cena. No jogo ela mora em
`src/cenas/Interface.ts`, e `Interface.ts` e `design.ts` **pertencem ao ambiente
`ficha`**, que declara cuidar de "os slots, as habilidades".

Isto nao se resolve com codigo, se resolve com combinado. Ver secao 6.

### E. O estado salvo . `estado.ts`, arquivo perigoso

- `barra: (string | null)[]`
- coracoes da criatura nao salvam, mas os do heroi sim
- `docs/12-ambientes-paralelos.md` lista `estado.ts` entre os arquivos que duas
  frentes querem mexer ao mesmo tempo. A regra de la: **acrescentar no fim, nunca
  reorganizar**

### F. Uma criatura na Vila . `Mundo.ts`

Um goblin so, perto do poste do sino. E o teste de verdade: o Lele encontra sem
ninguem mandar?

### G. Os quadros `ataque` e `machucado` . ambiente `sprites`

**Nao bloqueia.** `conjura` ja esta servindo de quebra-galho e continua servindo. E
acabamento, nao fundacao.

### H. Os ~30 icones . ambiente `sprites`

**Nao bloqueia.** Os emprestados servem para responder se o gesto funciona, que e a
pergunta que ainda esta aberta.

---

## 3.5 O que mudou: o combate virou POR TURNOS

Decidido e ja construido no provador. Muda o documento inteiro, e para melhor.

**Por turnos, o RPG de mesa deixa de ser enxerto e vira nativo.** O sistema de
papel ja e por turnos, o 1d6 + atributo ja e a resolucao, e o impasse que este
projeto carregava desde a primeira linha (dado ou colisao?) simplesmente deixa de
existir. Em tempo real o dado atrapalhava; por turnos ele **e** a mecanica.

O que existe hoje, rodando:

- **ordem de iniciativa**, 1d6 + ESPERTEZA, com os retratos na trilha do topo
- **orcamento de movimento em casas**, e as casas alcancaveis pintadas uma a uma
  com busca em largura. Anel de raio mentiria: acenderia o outro lado do rio
- **uma acao por turno**, escolhida na barra
- **botao PASSAR**, e o turno acaba sozinho quando movimento e acao acabam
- fora de combate, o mundo continua em tempo real

### Os dois lados rolam o dado

O material de mesa diz "so o heroi rola. O monstro nunca rola". **Isso nao vale
aqui**, e o motivo importa: na mesa, quem narra o monstro e uma pessoa, e a
pessoa e quem faz o golpe parecer justo. No videogame o computador rola de
qualquer jeito; esconder a rolagem so faz o golpe do goblin parecer arbitrario, e
apanhar sem ver por que e o que faz o jogador achar que o jogo trapaceia.

Entao: **mesmo dado, mesma tabela de tres faixas, o mesmo cartao na tela para os
dois lados.** O cartao mostra a face do dado desenhada, o que foi somado, e a
palavra da faixa. Nenhuma conta para o jogador fazer.

Isso tambem encerra a divergencia com a sessao do mapa: por turnos, **eles
estavam certos** sobre o dado decidir.

### O que a barra ganhou junto

- **numero de atalho** em cada slot, e teclas 1 a 6
- **icones de verdade**, em folha propria (`arte/icones.py` -> `icones.png`), sem
  encostar em `arte/ui.py`, que e do ambiente `sprites`
- **dica ao encostar**: nome, alcance em casas, e de quantos turnos ela precisa
- **espera contada em turnos**, em pontinhos, nao em relogio
- **coracoes sobre a cabeca** da criatura, que aparecem ao levar golpe e somem

### Tres licoes que valem para a interface inteira

1. **Elemento de estado precisa de fundo proprio.** Os pips de movimento nasceram
   verdes logo acima da barra e sumiram na grama. Os coracoes sobre a cabeca
   tiveram o mesmo problema. Os dois so passaram a existir com chapa atras.
2. **Cor tem que querer dizer alguma coisa.** Azul e movimento: as casas
   alcancaveis e os pips do turno usam o mesmo azul.
3. **Retrato ganha de retangulo colorido.** A trilha de turnos nasceu como cinco
   quadrados verdes e nao dizia nem qual goblin era o proximo, nem se o proximo
   era voce.

---

## 4. A pergunta que vale mais que toda esta lista

> **Resolvida.** A resposta foi por turnos, e esta na secao 3.5. O que segue e o
> registro de como a decisao foi tomada, porque a duvida pode voltar.

**O modelo de combate ainda nao agradou.** Construir mais em cima de um laco que
nao convence e construir mais rapido na direcao errada.

A suspeita, e ela e a mesma que eu levantei antes de escrever a primeira linha: o
**modo**. Escolher, o mundo congelar, e so entao tocar no alvo sao tres tempos para
uma coisa que talvez queira ser um tempo so.

Antes de qualquer etapa da secao 5, vale gastar meia hora numa **variante B** dentro
do proprio provador, trocada por uma tecla:

| | A, o que existe | B, para comparar |
|---|---|---|
| escolher | toca o slot | toca o slot |
| mirar | o mundo congela e espera | **nao existe: sai na hora** |
| alvo | o dedo escolhe | **o mais proximo dentro do alcance** |
| tempo | para enquanto pensa | **continua correndo** |

B e mais rapido e menos preciso. A e mais preciso e mais lento. Nao da pra decidir
isso no papel: da pra decidir jogando os dois seguidos, e leva pouco codigo, porque
tudo que muda e o caminho entre `escolher()` e `executar()`.

**E o proximo passo que eu recomendo**, antes de A a F.

---

## 5. A ordem, depois que o modelo estiver decidido

> **Este quadro por cima continua valendo**, mas o passo a passo executavel —
> arquivo por arquivo, com os numeros de cada animacao — mudou de lugar: esta
> em `docs/plano-de-implementacao.md`. Leia aquele documento para construir;
> volte para este para saber o panorama.

Cada etapa fica olhavel sozinha no `?provador`. Nenhuma das seis primeiras depende
de desenho novo nem de arquivo de outra frente.

| # | Etapa | De onde vem |
|---|---|---|
| 0 | **variante B, e escolher entre A e B** | secao 4 |
| 1 | elipse no chao, no pe, pontilhada e respirando | interface, etapa 1 |
| 2 | numeros de atalho, bandeja, borda de 2px, grupos | interface, etapa 2 |
| 3 | encosto no alvo, cursor de mira, linha de caminhada | interface, etapa 3 |
| 4 | **a criatura de verdade: telegrafo, golpe, os tres comportamentos** | **A** |
| 5 | **o heroi apanhar, e a tontura no lugar da derrota** | **B** |
| 6 | **os pips de coracao sobre a cabeca** | **C** |
| 7 | as dez animacoes de codigo, curvas e cores medidas | interface, 4.2 a 6 |
| 8 | **levar tudo para o jogo de verdade: barra, estado, um goblin na Vila** | **D, E, F** |
| 9 | quadros `ataque` e `machucado`, e os ~30 icones | **G, H**, ambiente `sprites` |

Na etapa 8 o basico esta pronto: os sete itens da secao 1 acontecem dentro do jogo.

Depois dela, e so ai, comeca o que ja esta escrito e esperando: as treze magias, a
tabela de reacoes, as fraquezas que resolvem, o livro de bestiario, e a tela ARSENAL.

E so **depois disso** comeca `docs/mundo-que-reage.md`: superficies no chao,
condicoes com duracao em turnos, objetos com estado, os itens da loja e os selos.
Aquela e a camada que da profundidade, e profundidade sobre alicerce que ninguem
pisou nao se sustenta. A excecao barata esta la na secao 10, etapa 2: **molhado e
congelado** custam quase nada e mudam o jogo mais do que qualquer magia nova.

---

## 6. As tres fronteiras, e o que fazer com elas

O esquema de ambientes paralelos so quebra de um jeito: duas frentes no mesmo
arquivo. Estas sao as tres onde isso vai acontecer se ninguem combinar antes.

| Arquivo | De quem e | Quando o combate precisa |
|---|---|---|
| `Interface.ts`, `design.ts` | ambiente **`ficha`** | etapa 8 |
| `arte/ui.py`, `public/assets` | ambiente **`sprites`** | etapa 9 |
| `estado.ts` | de todo mundo | etapa 8 |

Ate a etapa 7 o ambiente `combate` nao encosta em nenhum deles: tudo vive no
provador, em arquivos que so ele tem. **A etapa 8 e o momento de conversar, nao de
codificar.**

E existe uma quarta fronteira, que nao e de arquivo: a sessao **Mapa da Floresta dos
Sussurros** escreveu um `docs/modelo-de-combate.md` que discorda deste em dois
pontos de fundo (o dado decide toda acao, e zero coracoes e derrota com perda de
item). Ver `docs/11-combate-e-magias.md`, secao 18. Enquanto isso nao for decidido,
as etapas 5 e 6 estao construindo sobre uma regra que a outra frente ja considerou
revogada.
