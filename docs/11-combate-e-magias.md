# Combate, magias e a barra de atalhos

> **ATENCAO, parte deste documento foi superada.** O combate virou POR TURNOS, no
> molde do Baldur's Gate 3, e **os dois lados rolam o dado**. O que vale hoje esta
> em `docs/plano-do-combate.md`, secao 3.5. Continuam valendo daqui: as treze
> magias, as marcas e reacoes, o bestiario como enigma, e o livro. Nao valem mais:
> o modelo de tempo real da secao 2, "so o heroi rola", e alcance medido em pixel,
> que agora e contado em casas.

Documento de projeto, ainda nao executado. Nenhuma linha de codigo mudou por causa
dele. Ele existe para a decisao ser tomada UMA vez, no papel, antes de virar quinze
`if` espalhados por tres cenas.

Regra que vale mais que tudo aqui: `CLAUDE.md`. O Lele tem 7 anos, le pouco, joga no
iPad e **nao pode perder**. Toda escolha abaixo passou por esse filtro antes de passar
por qualquer filtro de "jogo bom".

**Decide:** o modelo de combate, a barra de skills, magias e acoes e como o jogador a
edita, o golpe com e sem arma, a logica
das treze magias, o que acontece ao bater no vazio, o livro de bestiario, os numeros
de tato, onde cada coisa mora no codigo e em que ordem construir.

**Nao decide:** desenho, quadro de animacao, efeito de particula. Isso vem depois, de
proposito, e a secao 15 lista o que a arte vai precisar quando chegar a vez dela.

---

## 1. As sete regras que mandam

1. **Escolher nunca tem pressa.** Enquanto ele decide, o mundo espera.
2. **Toque no alvo, nunca mira.** Ele aponta no que quer acertar, com o dedo. Nunca
   precisa apontar uma direcao com precisao.
3. **Sem numero na tela.** Nada de dano, mana, porcentagem. Coracao e icone.
4. **Errar e engracado.** Nao existe bipe de negado, tela de derrota, nem recomecar.
5. **Telegrafo antes de todo golpe.** Meio segundo de aviso, com desenho e som.
6. **Sempre existe a saida burra.** Bater sempre funciona. A esperteza so e mais rapida.
7. **A mesa manda no conteudo, o jogo manda no ritmo.** Nome, fraqueza e historia vem
   do RPG de papel. Cadencia e feedback sao problema do videogame.

---

## 2. O modelo: Baldur's Gate em cima de um mapa top-down

### Como uma acao acontece, do inicio ao fim

1. o Lele **toca um slot da barra** (ou aperta 1 a 6)
2. **o mundo congela**: as criaturas param, a fisica para, a animacao para
3. o que pode ser acertado ganha **um anel piscando na cor da acao**
4. ele **toca em qualquer lugar do mundo**
5. se o alvo estiver longe, **o heroi anda ate la sozinho** e so entao age
6. a acao acontece, o mundo volta a andar

E o unico fluxo do jogo. Vale para o golpe de espada, para a Bola de Fogo e para o
Remendo. Um fluxo so, aprendido uma vez.

### O atalho de dentro do atalho

Selecionar acao e depois tocar no alvo cria um **modo**, e modo e o que mais confunde
crianca pequena. Entao existe o caminho curto, igual ao clique esquerdo do Baldur's
Gate:

> **Tocar direto num inimigo ataca com a arma equipada.** Sem passar pela barra.

A barra existe para escolher algo **diferente** do padrao. O caso comum e um toque so.

### Por que congelar em vez de desacelerar

Congelar e o auto-pause do Baldur's Gate 1 e 2, e resolve de graca o problema que mais
atrapalha crianca de 7 anos em jogo de acao: pressa. Ele pode pensar dez segundos com
o dedo no ar, e nada acontece.

Nunca existe cronometro. Se ele ficar parado no modo de alvo, o jogo fica parado com
ele, para sempre, sem cobrar nada. Sair e tocar em qualquer canto vazio da barra, tocar
o mesmo slot de novo, ou apertar ESC.

### E o dado do RPG de mesa?

Continua, mas **fora da briga**. O d6 sobe na tela so nas viradas de historia: o pedagio
do Grulo, convencer o guarda, forcar a porta do sino, a virada do Zonzo, o nome
verdadeiro do dragao. Cinco ou seis vezes por aventura, nao cinquenta. E por ser raro
que ele fica tenso.

| Dado | Faixa | O que acontece |
|---|---|---|
| 5-6 | OBA (verde) | deu certo do jeito que ele imaginou |
| 3-4 | QUASE (amarelo) | deu certo, mas com um probleminha divertido |
| 1-2 | OPS (vermelho) | **acontece outra coisa**, nunca "tente de novo" |

> **Divergencia registrada.** O cabecalho de `src/dados/sons.ts` diz "quem decide o
> desfecho e o dado, nunca a colisao". Este documento restringe isso as viradas de
> historia. Um dado por goblin transformaria uma caverna de oito goblins em oito telas
> de espera.

---

## 3. A barra: skills, magias e acoes

Tres tipos de coisa entram na mesma barra, e a barra nao sabe a diferenca entre eles.
Isso e o que faz o sistema ser um so em vez de tres.

| Tipo | O que e | De onde vem | Custo |
|---|---|---|---|
| **ACAO** | golpe de arma, golpe sem arma, usar item | todo mundo tem | so recarga |
| **MAGIA** | as treze de `conteudo.ts` | classe Mago escolhe tres | so recarga |
| **SKILL** | o Dom da raca, a habilidade da classe, e as ganhas a cada 3 selos | raca, classe, selos | **1 uso por cena** |

### O tipo unificado

```ts
// src/dados/acoes.ts . dado puro. NAO confundir com src/sistemas/poderes.ts,
// que e outra coisa (FORCA, ESPERTEZA, CORACAO) e mora no ambiente `ficha`.
export type TipoAcao = "golpe" | "magia" | "skill" | "item";

export type Acao = {
  id: string;
  tipo: TipoAcao;
  nome: string;
  icone: string;       // quadro na folha ui.png
  cor: number;         // da paleta. magia ja tem a sua em conteudo.ts
  marca?: Marca;       // o verbo que ela imprime no mundo
  forma: Forma;        // que pedaco do mundo o toque atinge
  alcance: number;
  duracao: number;
  recarga: number;
  usosPorCena?: number; // skill = 1. magia e golpe nao tem
};
```

**A barra guarda `Acao["id"]`, nunca o objeto.** Um slot e uma string ou `null`. E so
isso que vai para o save, e e o que deixa a barra sobreviver a uma troca de arma, de
magia ou de nivel sem nenhuma migracao.

### Nem toda skill entra na barra

O material de mesa ja separou isso sozinho, e da pra ler direto de `conteudo.ts`:

| Skill | Raca / classe | Entra na barra? |
|---|---|---|
| Sopro Quentinho | Cria de Dragao | **sim**, solta fogo |
| Nunca Desisto | Gente do Vale | **sim**, rola o dado de novo |
| Pe de Coelho | Pequenino | **sim**, troca um OPS por QUASE |
| Casco Duro | Anao | nao: e passiva, ja e o 4o coracao |
| Olhos de Coruja | Elfo | nao: e passiva, e o alcance de visao |
| Golpe Trovao | Cavaleiro | **sim**, acerta sem rolar |
| Fala com Bichos | Amigo dos Bichos | **sim** |
| Conserta Tudo | Ferreiro | **sim** |
| Olho de Alvo | Cacador | nao: e passiva, e o +1 de longe |
| Tres Magias | Mago | nao: ela e o que **da** os slots de magia |

Um campo `ativa: boolean` em `conteudo.ts` resolve, e o `verificar` confere que toda
skill ativa tem ficha de `Acao` e que nenhuma passiva tem.

---

## 3.1 Onde a barra fica

No **rodape**, no vao entre o disco (canto esquerdo) e o botao de acao (canto direito).
Nenhum dos dois sai do lugar, e a area jogavel nao perde um pixel: aqueles dois cantos
ja eram interface.

```
+--------------------------------------------------------------+
|  [coracoes] [moedas] [selos]                    [nome]  [=]   |
|                                                               |
|                          o mundo                              |
|                                                               |
|   .---.                                                       |
|  ( -+- )   [1][2][3][4][5][6]                        ( A )    |
|   '---'     ^ a barra                                         |
+--------------------------------------------------------------+
```

Slot de **20x20** (o icone da folha `ui.png` ja e 16x16, com 2px de folga de cada
lado), gap de 2, passo de 22. O vao foi **medido**, nao estimado: disco ocupa ate
x=64, o alvo do botao A comeca em x=LARGURA-45, e sobram 2px de respiro de cada lado.

| Visao | Resolucao | Vao livre | Slots |
|---|---|---|---|
| PERTO | 256x160 | 143px | **6** |
| NORMAL | 320x192 | 207px | **9** |
| LONGE | 400x240 | 287px | **13** |

Seis e o piso. **O numero de slots muda com a visao, a ordem do que esta neles nunca
muda:** o que nao couber em PERTO fica guardado, no mesmo lugar, e reaparece em NORMAL.
A memoria do dedo nunca e traida por uma troca de visao.

### Como um slot se parece

- fundo `painel-creme`, e `painel-ouro` quando esta selecionado
- **a borda diz o tipo, sem texto**: cinza = acao, a cor da magia = magia,
  dourado = skill, verde = item
- o icone no meio
- **anel de recarga** que se completa por cima. Nenhum numero, nenhuma leitura
- skill ja usada na cena: o slot **apaga** ate a proxima cena, para ele ver que era raro
- em recarga: cinza, e o toque responde com um "pluft" simpatico, **nunca um bipe de
  negado**
- tocar o slot mostra **o nome grande logo acima da barra**, antes de confirmar. E o
  equivalente do tooltip do Baldur's Gate, e de quebra ensina a ler devagar

---

## 3.2 O jogador monta a propria barra

A barra nasce montada a partir da ficha, e **o jogador pode mudar tudo**.

### Onde se edita

Numa tela propria, `ARSENAL`, aberta pelo menu de pausa. **Nunca no meio da luta.**

```
+--------------------------------------------------------------+
|                        ARSENAL                                |
|   [1][2][3][4][5][6][ ][ ][ ]      <- a barra, ao vivo        |
|                                                               |
|   ( ACOES ) ( MAGIAS ) ( SKILLS ) ( ITENS )   <- as abas      |
|                                                               |
|   [][][][][]      <- o catalogo da aba, em grade              |
|   [][][][][]                                                  |
|                                                               |
|   BOLA DE FOGO                                                |
|   Uma bola de fogo que voa numa direcao.                      |
+--------------------------------------------------------------+
```

### Como se edita

**Dois toques, nunca arrastar.** Arrastar em tela de toque erra, e erra mais ainda
com dedo pequeno.

1. toca uma acao no catalogo . ela acende
2. toca um slot . ela vai para la

E so. As variacoes saem de graca do mesmo gesto:

- slot ja ocupado -> **os dois trocam de lugar**, nunca some nada
- tocar slot primeiro e acao depois -> mesma coisa, a ordem nao importa
- tocar dois slots seguidos -> **trocam entre si**, que e como se reordena
- tocar um slot e depois o botao TIRAR -> esvazia
- **no mouse, arrastar tambem funciona**, porque quem esta no Mac vai tentar

### As duas unicas travas

1. **A barra nunca fica vazia.** Se o ultimo slot for esvaziado, o `golpe sem arma`
   volta sozinho para o slot 1. Nao e uma proibicao, e um chao: nunca existe um estado
   em que nao ha proxima acao obvia.
2. **Nao da para pendurar o que ele nao tem.** O catalogo so mostra o que a ficha
   permite: as magias escolhidas, as skills da raca e da classe, os itens da mochila.
   O que nao esta com ele aparece esmaecido, com um cadeado, **e com o nome a mostra**
   . ver o que existe e o que faz vontade de ir atras.

### O que fica salvo

```ts
// src/sistemas/estado.ts
barra: (string | null)[];   // um id de Acao por slot, ou vazio
```

Uma lista de strings, e nada mais. Se uma magia sair da ficha, o slot dela vira `null`
sozinho na proxima leitura, e nao quebra o save. Se a visao mudar de LONGE para PERTO,
os slots 7 a 13 continuam guardados na lista, so nao aparecem.

---

## 4. O golpe de arma e o golpe sem arma

Os dois existem, e os dois sao slots proprios.

O **golpe sem arma** nao e um castigo por estar desarmado. Ele tem funcao:

- e o unico golpe que **nao quebra objeto**, entao serve para cutucar sem estragar
- em bicho amigo ele vira **carinho**, nao golpe
- esta sempre disponivel, sem recarga, sem condicao

Cada arma vira uma acao de golpe, no mesmo tipo `AcaoDeProva`. **Atualizado para
casas e turnos** (a tabela original estava em pixel/ms, de antes do combate virar por
turnos):

| Arma | Classe dona | Alcance | Espera | Marca extra |
|---|---|---|---|---|
| **sem arma** | qualquer | 1 casa | 0 (todo turno) | . |
| espada-curta | Cavaleiro | 1 casa | 0 | . |
| adaga | (item de loja) | 1 casa | 0 | `+1 escondido`: some do 1d6 quando **ESCONDIDO** |
| machado | (item de loja) | 1 casa | 1 turno | `corta` (derruba arvore, abre mato) |
| martelo | Ferreiro | 1 casa | 1 turno | `quebra` (racha pedra) |
| **cajado** | Mago | 1 casa | 1 turno | `empurra`, nunca `corta`/`quebra` |
| **arco** | Cacador | **5 casas** | 1 turno | projetil, forma `casa` |
| **funda** | Amigo dos Bichos | **4 casas** | 0 (todo turno) | projetil, **nunca passa de QUASE** |
| escudo | (item de loja) | . | . | nao ataca: guarda **PROTEGIDO** por 1 golpe |

**O cajado.** Nao e arma de bater, e da pra bater com ele. A ficha diz isso sem
precisar de texto: ele **acerta, mas o que ele faz de melhor e empurrar**, nunca corta
nem quebra objeto como as armas de verdade fariam. Quem escolhe cajado esta escolhendo
o `+1 em magia` que a arma ja dava no RPG de mesa, nao a pancada. O Trovao da Floresta
pode sair no tapa, so nao vai ser bom nisso, e isso e engracado em vez de punitivo.

**O arco.** E a unica arma de golpe com alcance de verdade — 5 casas, contra 1 das
armas corpo a corpo. Isso ja e a identidade toda do Cacador de Dragao sem precisar de
regra nova: ele bate de longe, o resto bate perto. O golpe do arco ganha a mesma
animacao de projetil que Bola de Fogo (ver secao 15, `fx.projetil`), so que sem marca
nenhuma — e so uma flecha.

**A funda.** Tem uma trava que nenhuma outra arma tem: **o resultado dela nunca passa
de QUASE**, mesmo tirando 6 no dado. Isso ja e a mesa (`ARMAS` em `conteudo.ts`:
"nunca passa de QUASE"), e sobrevive por inteiro: e a arma do Amigo dos Bichos, a
classe que a mesa desenhou pra **nao** ser sobre lutar bem. Ganhar OBA com ela deixaria
de fazer sentido narrativo.

### As cinco racas, e o que cada uma muda no combate

Nao precisam de arma propria — o bonus delas ja e todo em atributo e no Dom (skill do
slot dourado, ver secao 3). O que muda por raca, so olhando pra combate:

| Raca | +1 em | Dom | O que isso faz no 1d6 |
|---|---|---|---|
| Gente do Vale | CORACAO | Nunca Desisto | skill: rola de novo 1x por combate |
| Anao da Fornalha | FORCA | Casco Duro | passiva: 4 coracoes em vez de 3 |
| Elfo da Folha | ESPERTEZA | Olhos de Coruja | passiva: revela invisivel a distancia |
| Pequenino do Trigo | CORACAO | Pe de Coelho | skill: troca um OPS por QUASE |
| Cria de Dragao | FORCA | Sopro Quentinho | skill: dano de area, 1x por combate |

Golpe usa FORCA, magia usa ESPERTEZA (ja implementado, `atributo` em `AcaoDeProva`).
Isso quer dizer, sem nenhuma regra nova: **Anao e Cria de Dragao acertam mais golpe**,
**Elfo e Cacador acertam mais magia**, e as duas racas de CORACAO (Vale, Pequenino) sao
identicas nos dois — o bonus delas e todo em resiliencia (mais coracao, ou uma segunda
chance no dado), nao em acerto.

---

## 5. Bater no vazio, e quebrar coisas

Uma acao **sempre cai num ponto do mundo**, nunca "num inimigo". O que tem naquele
ponto e descoberto na hora do impacto. Isso e o que faz bater no vazio valer a pena:

| No ponto tocado tem... | O que acontece |
|---|---|
| criatura | leva o golpe |
| **criatura invisivel** | **leva o golpe, e fica visivel** |
| objeto quebravel | quebra, e larga o que tinha dentro |
| objeto duro (casa, arvore) | "tonc", poeirinha, nada quebra |
| nada | poeira, e o assobio de `IMPACTOS.errou`, que ja existe em `sons.ts` |

`IMPACTOS.errou` ja foi escrito com a instrucao certa no comentario: *"errar nao e
castigo: um assobio no ar, nunca um bipe de negado"*.

**Criatura invisivel e mecanica de verdade**, nao enfeite: o Lobo de Nevoa dentro da
neblina, e qualquer criatura que se esconda. Bater no vazio e como se acha ele. E a
recompensa de tentar.

**Objetos quebraveis** dao o laco de recompensa mais gostoso que existe para uma
crianca, o de cortar mato no Zelda. Precisam entrar em `arte/mundo.py`: `pote`,
`caixa`, `barril`, `pedra-rachada`, `teia`. Cada um solta moeda, ou item, ou nada, ou
um bichinho que sai correndo.

Regra que nunca se quebra: **nenhuma acao pode ser recusada.** Se o alvo esta longe
demais, o heroi anda ate la. Se e inalcancavel, ele chega o mais perto que da e age
mesmo assim, e o tiro erra. Nunca um "voce nao pode fazer isso aqui".

---

## 6. A briga e um enigma, nao uma barra de vida

Esta ideia ja estava escrita no bestiario sem ninguem perceber. A coluna `fraqueza`
de `conteudo.ts` nao tem tipo de dano. Ela tem **verbo**:

| Criatura | Coracoes | Fraqueza |
|---|---|---|
| Goblin da Fumaca | 1 | barulho alto de metal |
| Aranha da Teia Doce | 2 | comer a teia e escapar |
| Espantalho Andarilho | 2 | agua |
| Lobo de Nevoa | 2 | luz forte |
| Serpente do Pantano | 3 | cocegas embaixo do queixo |
| Bruxa Espinho | 3 | nao consegue mentir sobre o proprio nome |
| Grulo, o Troll | 4 | uma boa gargalhada |
| Cavaleiro de Cinzas | 5 | agua fria |
| Brasanegra | 10 | o nome verdadeiro, Aurel |

Toda criatura tem **tres saidas, e as tres ganham**:

- **INSISTIR** . bater ate acabar os coracoes. Sempre funciona. E a rede de seguranca:
  quem nao sacou o enigma nunca fica travado.
- **RESOLVER** . aplicar a fraqueza. Acaba na hora, com estrelinha, som proprio e
  **selo de heroi**.
- **CONVERSAR** . `Fala Bicho` transforma a luta em conversa, e a criatura vira amiga.

**Ninguem morre, nem o monstro.** O verbo e sempre `desistir`: o goblin foge, o troll
senta, a aranha come a propria teia. `CRIATURAS_SOM` em `sons.ts` ja foi escrito assim.

---

## 7. A gramatica das magias: MARCA + FORMA

Treze magias escritas uma a uma viram treze casos especiais, e ai a decima quarta custa
o mesmo que a primeira. Nao.

Toda acao faz duas coisas so:

1. tem uma **FORMA**, que diz que pedaco do mundo o toque atinge,
2. e **imprime uma MARCA** no que estiver la.

A magia nunca sabe o que vai acontecer. Quem sabe e a **tabela de reacoes**.

```ts
// src/dados/conteudo.ts . campos novos no tipo Magia
export type Magia = {
  id: string;
  nome: string;
  texto: string;
  cor: number;
  marca: Marca;        // o verbo que ela imprime
  forma: Forma;        // que pedaco do mundo o toque atinge
  alcance: number;     // px do heroi ate o ponto. 0 = so no proprio heroi
  duracao: number;     // ms. 0 = instantanea
  recarga: number;     // ms ate poder de novo
};

export type Marca =
  | "fogo" | "gelo" | "agua" | "luz" | "som-alto" | "vento"
  | "planta" | "cola" | "doce" | "invisivel" | "bolha"
  | "conserto" | "fala" | "pulo" | "corta" | "quebra" | "empurra";

export type Forma =
  | "eu"        // nao pede alvo: dispara no toque do slot
  | "ponto"     // atinge so o que esta no ponto tocado
  | "estouro"   // circulo de raio proprio, centrado no ponto tocado
  | "linha"     // tudo entre o heroi e o ponto tocado
  | "aoRedor";  // nao pede alvo: circulo centrado no heroi
```

Repare em `"eu"` e `"aoRedor"`: elas **nao entram no modo de alvo**. Tocar o slot ja
dispara. Escudo de Bolha, Sumir-Sumindo e Voz de Trovao sao um toque so.

Continua valendo a regra do projeto: `conteudo.ts` e **so dado**. Nenhum Phaser,
nenhum `if`. Quem le isso e `src/sistemas/magia.ts`.

---

## 8. A tabela de reacoes

Uma tabela. E ela que gera a sensacao de mundo vivo com quase nenhum codigo.

```ts
// src/dados/reacoes.ts . dado puro
export type Reacao = {
  marca: Marca;
  em: string;          // id de criatura, de objeto, ou nome de tile
  vira: string;        // o que acontece
  resolve?: boolean;   // true = a criatura desiste na hora, e ganha selo
};
```

Um esboco do miolo:

| Marca | Cai em | Vira |
|---|---|---|
| som-alto | goblin | **resolve**: tapa a orelha e foge |
| som-alto | qualquer criatura | para de andar por 2s |
| luz | lobo-nevoa | **resolve**: a nevoa some, ele vai embora |
| luz | caverna escura | raio de visao dobra por 20s |
| luz | criatura invisivel | fica visivel |
| agua | espantalho | **resolve**: encolhe e senta |
| agua | cavaleiro-cinzas | **resolve**: a cinza vira lama |
| gelo | tile de agua | vira ponte que da pra atravessar |
| gelo | fogo aceso | apaga |
| gelo | criatura | congela por 3s |
| fogo | teia de aranha | queima e abre caminho |
| fogo | espinho da bruxa | queima e abre caminho |
| fogo | gelo | vira vapor, e o vapor esconde o heroi |
| fogo | fogueira apagada | acende |
| vento | fumaca / nevoa | limpa por 10s |
| vento | criatura | empurra 40px pra tras |
| vento | fogo | o fogo cresce e anda 1 tile |
| doce | aranha | **resolve**: come a propria teia e escapa |
| doce | qualquer criatura | anda ate o cheiro e ignora o heroi por 8s |
| planta | ressalto | vira escada |
| planta | criatura | prende o pe por 3s |
| conserto | objeto quebrado | conserta |
| fala | qualquer bicho | abre caixa de fala em vez de briga |
| corta | arvore, mato | derruba, e larga lenha |
| quebra | pedra-rachada, pote, caixa | quebra |
| empurra | criatura, caixa | anda 1 tile pra tras |

Regra de ouro: **magia nunca da erro.** Se a marca nao acha reacao, o efeito visual
acontece do mesmo jeito e o mundo so nao muda. Nunca um "nao funciona aqui".

---

## 9. As treze magias, uma por uma

Formato: `marca / forma / alcance / duracao / recarga`.

### Luzinha . `luz / eu / 0 / 20s / 8s`
Um toque, sem alvo. Bolinha que orbita o heroi. **Mundo:** ilumina caverna, revela
coisa escondida. **Luta:** resolve o Lobo de Nevoa; **revela criatura invisivel**.

### Bafo Gelado . `gelo / linha / 40px / 3s / 6s`
**Mundo:** congela agua e vira ponte, apaga fogo. **Luta:** a criatura para 3s.

### Cresce-Grama . `planta / estouro / 48px / 12s / 8s`
**Mundo:** escada pra subir ressalto, esconderijo. **Luta:** prende o pe por 3s.

### Voz de Trovao . `som-alto / aoRedor / 60px / 0 / 7s`
Um toque, sem alvo. **Mundo:** todo mundo para pra ouvir; o eco da Floresta Sussurro.
**Luta:** resolve o Goblin; todo o resto congela 2s.
*E a magia do Trovao da Floresta. Ela tem que ser a mais gostosa das treze.*

### Pulo de Sapo . `pulo / ponto / 64px / 400ms / 5s`
Toca onde quer cair. **Mundo:** por cima de rio, muro, buraco. **Luta:** sair de
sufoco; o pouso empurra quem estiver perto.

### Dedo Colante . `cola / eu / 0 / 15s / 10s`
**Mundo:** sobe parede. **Luta:** cola o pe da criatura no chao.

### Remendo . `conserto / ponto / 32px / 0 / 4s`
**Mundo:** ponte, roda, o Sino da vila, e no fim a propria Pedra do Sol. Nunca cura
coracao: quem cura e comida.

### Escudo de Bolha . `bolha / eu / 0 / 6s ou 1 golpe / 10s`
Um toque, sem alvo. **Luta:** segura um golpe. **Mundo:** respira embaixo d'agua.
*E como o Trovao da Floresta atravessa rio, ja que o ponto fraco dele e nao saber nadar.*

### Cheiro de Bolo . `doce / estouro / 64px / 8s / 9s`
**Mundo:** puxa NPC ou bicho pra um lugar; resolve o enigma de tirar o guarda da porta.
**Luta:** resolve a Aranha; todo mundo anda ate o cheiro. **E a saida pacifista.**

### Fala Bicho . `fala / ponto / 32px / 0 / 6s`
Transforma a luta em conversa. Se ele for gentil, o bicho vira aliado e anda junto.

### Sumir-Sumindo . `invisivel / eu / 0 / enquanto ficar parado / 12s`
Andar cancela. E a saida de furtividade da caverna, que o roadmap pede na Fase 3.

### Chama-Vento . `vento / linha / 80px / 0 / 6s`
**Mundo:** empurra caixa, limpa a fumaca do dragao, gira moinho. **Luta:** empurra pra
tras, pra dentro da agua, pra fora da ponte. A mais interativa das treze, porque ela
move o mundo em vez de gastar coracao.

### Bola de Fogo . `fogo / ponto / 100px / 0 / 5s`
**Mundo:** acende fogueira, queima teia, queima espinho. **Luta:** 1 coracao e pega fogo.
`conteudo.ts` ja avisa: *"Goblin aguenta, gelo nao"*. Nao resolve goblin, derrete gelo.

---

## 10. O livro de bestiario

Abre pelo menu de pausa. O icone `UI.livro` ja existe na folha de interface.

Nove cartoes, um por criatura, em grade de 3 por 3. E ele que transforma **insistir**
em **resolver** ao longo do jogo.

```
 +----------------+
 |  [sprite]      |   <- o desenho da criatura, grande
 |  GOBLIN        |
 |  <3            |   <- coracoes como icone, nunca numero
 |  [sino]        |   <- a fraqueza como ICONE grande
 |  BARULHO ALTO  |   <- duas ou tres palavras, so
 +----------------+
```

Tres estagios por cartao, e o meio e o que da graca:

| Estagio | Como aparece |
|---|---|
| nunca vi | silhueta preta, e uma `?` |
| ja vi | sprite, nome, coracoes. A fraqueza e uma `?` |
| ja descobri | tudo, com a fraqueza em icone e duas palavras |

**Como a fraqueza e descoberta**, e as tres portas importam:

1. **acertando sem querer** . ele joga Voz de Trovao num goblin e o goblin foge. O
   livro anota sozinho.
2. **alguem conta** . um NPC, ou um livro de Altacoruja, a torre biblioteca do Mestre
   Corujao que ja existe no material de mesa.
3. **olhando com atencao** . a lupa, `UI.lupa`, que tambem ja existe na folha.

Estado novo em `estado.ts`: `bestiarioVistos: string[]` e `bestiarioFraquezas: string[]`.
Os dois entram no save, e a Fase 1 ja tem `visitados` funcionando do mesmo jeito.

Quase sem texto de proposito. O cartao e sprite, coracao e um icone de fraqueza. As
duas palavras embaixo sao legenda, nao explicacao.

---

## 11. Os controles e os atalhos

### Toque (iPad e celular)

| Onde | O que |
|---|---|
| disco, canto esquerdo | andar, oito direcoes. **Nao muda** |
| **barra, no rodape** | 6 a 13 slots de acao |
| **A, canto direito** | falar, pegar, abrir. Durante o modo de alvo: **confirma** |
| toque direto num inimigo | **ataca com a arma equipada**, sem passar pela barra |
| engrenagem, topo | pausa, o ARSENAL e o livro de bestiario |

**Cancelar o modo de alvo:** tocar o mesmo slot de novo, tocar o disco, ou tocar num
canto vazio da barra. Tres saidas, porque uma so nao e descoberta.

**Assistencias, e elas nao sao opcionais:**

- toque a menos de **12px** de um alvo conta como em cima dele
- alvo fora de alcance nao e recusado: **o heroi anda ate la e age**
- o que esta ao alcance pisca; o que esta fora fica esmaecido, mas ainda e tocavel

### Teclado (Mac e o aplicativo Electron)

| Tecla | O que |
|---|---|
| setas ou WASD | andar |
| **1 a 6** (ate 13, com 0 = o decimo) | os slots da barra |
| clique do mouse | escolhe o alvo |
| **TAB** | cicla entre os alvos perto |
| **C** | abre o ARSENAL, a tela de montar a barra |
| **ESPACO** ou ENTER | o botao A; no modo de alvo, confirma no alvo destacado |
| **ESC** | cancela a acao selecionada. Sem acao selecionada, pausa |
| P | pausa |
| B | livro de bestiario |

O `TAB` mais o `ESPACO` fecham o caminho so-teclado: da pra jogar a briga inteira sem
mouse. `ESC` cancelar antes de pausar e o comportamento que todo jogo de PC tem, e e o
que a mao ja espera.

### A economia de uso, e por que ela diverge da mesa

Na mesa, cada magia vale **1 uso por aventura**. No videogame isso e insuportavel: ele
vai querer soltar Bola de Fogo cinquenta vezes, e deve poder.

- **Golpe de arma e sem arma** -> so a recarga da ficha. Nunca acaba.
- **Magia** -> recarga de 4 a 12s, sem recurso, sem numero. Nunca acaba.
- **Dom da raca e habilidade da classe** -> **uma vez por cena**, slot dourado que some
  depois de usado. **E aqui que o "uma vez por aventura" da mesa foi parar**, e aqui ele
  e bom: e o momento raro. Golpe Trovao, Sopro Quentinho, Pe de Coelho, Nunca Desisto.
- **Item da loja** -> gasta de verdade, porque foi comprado com moeda.

Mana nao entra. Mana e um numero pra administrar, e numero pra administrar e exatamente
o que uma crianca de 7 anos nao vai fazer.

---

## 12. O tato: os numeros

Vao todos para um bloco `COMBATE` em `src/dados/config.ts`, nunca soltos numa cena. A
regra do projeto continua: **nenhuma coordenada e nenhum numero na mao.**

| Numero | Valor | Por que |
|---|---|---|
| slot da barra | 20x20, gap 2 | com o icone de 16px da folha `ui.png` |
| raio de encosto no alvo | **12px** | o toque nao precisa ser preciso |
| hitstop | 70ms | o congelamento que da peso ao golpe |
| tremor de tela | 1px por 90ms | um so pixel. Mais que isso enjoa em pixel art |
| empurrao padrao | 90px/s por 160ms | a criatura anda pra tras, ele ve que acertou |
| invencivel apos apanhar | 900ms | piscando, pra ele ter tempo de sair |
| telegrafo da criatura | 500ms | o aviso antes do golpe |
| hitbox do heroi ao apanhar | 8x8px | **menor que o desenho** |
| area do golpe dele | **+4px** do que o desenho | **maior que parece** |
| andar ate o alvo | velocidade normal, 62px/s | sem correr: ver o heroi andar e legivel |

Os dois vieses estao de proposito: **o golpe dele acerta mais do que parece e o golpe
da criatura acerta menos do que parece.** Um adulto acharia injusto. E o ponto.

Repare no que **saiu** desta tabela em relacao a um jogo de acao normal: buffer de
entrada, janela ativa, tempo de recuperacao. Nada disso e necessario, porque **o mundo
espera enquanto ele escolhe**. Escolher no tempo dele apaga a classe inteira de
problemas que o buffer existiria para remediar.

---

## 13. As criaturas: tres comportamentos, e so

Nenhuma arvore de decisao. Tres estados, um campo em `conteudo.ts`.

- **passeia** . anda a esmo, ignora o heroi. As aranhas da Fase 2 sao isso.
- **curioso** . chega perto devagar, **para a 40px**, telegrafa 500ms e da o bote.
- **medroso** . foge do heroi. O goblin e isso.

Todas passam por `notou -> telegrafa -> golpe -> recupera -> desiste`. O telegrafo nao
e opcional: e o unico jeito de um golpe virar "eu errei" em vez de "o jogo me sacaneou",
e a pesquisa e unanime nisso.

**Telegrafo = 500ms**, com as tres coisas juntas: a criatura se agacha e estica, um `!`
amarelo aparece acima da cabeca, e toca `CRIATURAS_SOM[familia].reage`, que ja existe.

Nunca mais de **duas** criaturas atacando ao mesmo tempo. Um regulador na cena segura
as outras em `curioso`, mesmo com oito goblins na tela.

### Zero coracoes: o que acontece

Nao existe game over, nao existe tela, nao existe menu.

1. o heroi fica **tonto** por 2s (o quadro `QUADRO.tonto` ja existe)
2. cai **1 moeda** no chao, e da pra pegar de volta
3. as criaturas **recuam 1.5s** e ficam com cara de constrangido
4. os coracoes voltam pra **1**
5. uma frase curta e boba na caixa de fala: *"Ai! Que tonteira."*

O custo e tempo e uma moedinha. Nunca progresso. A Pena da Fenix da loja (*"se voce
ficar tonto, ela te levanta na hora"*) pula os 2s, e ganha funcao mecanica de verdade.

### Selos: premiar a esperteza, nao a paulada

| Ganhou selo | Nao ganhou selo |
|---|---|
| resolveu pela fraqueza | ganhou insistindo |
| descobriu uma fraqueza nova pro livro | fugiu |
| fez amizade com Fala Bicho | |
| resolveu sem ninguem tomar golpe | |
| aceitou que o ponto fraco atrapalhasse (a regra da mesa) | |

Insistir sempre funciona e nunca e punido. So nao e premiado. E a diferenca entre
ensinar e castigar.

---

## 14. O que a UI ja tem, e o que falta

Levantamento feito no ambiente `combate`, com `npm run build` e `npm run verificar`
limpos (0 erro, 13 avisos, todos do tipo "o catalogo de som esta pronto e a cena
ainda nao existe").

### Ja existe, e serve

| Peca | Onde | Serve para |
|---|---|---|
| 4 paineis de 9 fatias | `painel`, `painel-creme`, `painel-ouro`, `painel-escuro` | fundo de slot, de caixa, de aba |
| `botao()` | `sistemas/botao.ts` | ja tem sombra, afundar, som, e `marcar(ligado)` |
| `caixa()` e `pilha()` | `sistemas/design.ts` | a tela ARSENAL e o livro de bestiario |
| `texto()` de bitmap 8px | `sistemas/texto.ts` | nome da acao, nome da criatura |
| cena por cima de cena | `Pausa` sobre `Mundo` | ARSENAL e Bestiario nascem do mesmo padrao |
| `auditarUI()` | `sistemas/auditoria.ts` | confere sobreposicao dos slots nas 3 visoes |
| catalogo de som de combate | `dados/sons.ts` | 17 sons de arma, 5 de impacto, 6 de magia, 3 de dado, ja prontos |

**O nome cabe.** "ESCUDO DE BOLHA" tem 15 caracteres, 120px na fonte de 8px, e cabe
mesmo em PERTO (256px). Nao precisa de fonte nova nem de abreviacao.

### Falta, e e este o custo real

**1. Os icones. E o maior buraco.** `ui.png` tem **13** icones de 16x16, e nenhum
deles e de acao. A barra precisa de aproximadamente **30 novos**:

| Grupo | Quantos |
|---|---|
| golpe, um por arma (espada, cajado, arco, martelo, funda, machado, adaga) | 7 |
| golpe sem arma (o punho) | 1 |
| as treze magias | 13 |
| as skills ativas (Sopro Quentinho, Nunca Desisto, Pe de Coelho, Golpe Trovao, Fala com Bichos, Conserta Tudo) | 6 |
| fraqueza, para o livro (sino, gota, sol, risada, cocega, nome) | 6 |

Isso e `arte/ui.py`, que pertence ao **ambiente `sprites`**. Sem esses icones a barra
existe mas todo slot fica igual, e ai ela nao serve para nada.

**2. `design.ts` so empilha para baixo.** `pilha()` e vertical. A barra e uma
**fileira** e o catalogo do ARSENAL e uma **grade**, e nenhuma das duas tem primitiva.
Sem elas, alguem vai somar X na mao, que e exatamente o que o design system existe
para impedir. Faltam:

```ts
export function fileira(area: Retangulo, largura: number, gap?: number)
export function grade(area: Retangulo, colunas: number, lado: number, gap?: number)
```

`design.ts` pertence ao **ambiente `ficha`**.

**3. Nao existe componente de slot.** `botao()` e um retangulo com rotulo no meio.
Um slot e outra coisa: 20x20, icone no lugar do texto, **borda na cor do tipo**,
estado apagado, e o anel de recarga. E primitiva nova, nao e `botao()` com outro
tamanho.

**4. Nao existe anel de recarga.** Nenhum arco de `Graphics` foi desenhado no projeto
ate hoje. E barato, mas e codigo novo, e tem que ficar legivel com 20px e a paleta.

**5. Nao existe desenho no chao do mundo.** O anel de alcance, o cone e o circulo de
area precisam ser desenhados **em coordenada de mundo**, abaixo dos personagens e
acima do chao. Tudo que o jogo desenha hoje e tilemap, sprite ou painel de interface.
Camada nova, com `setDepth` entre o chao (-1000) e os personagens (y).

**6. A `Interface` nao tem modo.** Hoje o unico "modo" do jogo e o `conversando:
boolean` do `Mundo`. O modo de alvo e o segundo, e fazer o segundo do mesmo jeito
avulso comeca a apodrecer. Precisa de uma maquina de estado pequena:
`livre -> mirando -> andando -> agindo`, com cancelar valido em qualquer ponto.

**7. `estado().barra` nao existe.** Uma linha, mas em `estado.ts`, que o
`docs/12-ambientes-paralelos.md` lista como um dos arquivos mais perigosos. Regra de
la: **acrescentar no fim, nunca reorganizar.**

### O caminho mais curto ate ver na tela

Nenhum dos sete e bloqueante para a **etapa 0**. Da para provar o laco inteiro com o
que ja existe:

- slot = `painel-creme` de 20x20 com um icone **emprestado** da folha atual
  (`lupa` para o golpe, `dado` para a magia). Feio de proposito, e ja testa o gesto.
- anel de alcance = um `circle` de `Graphics` sem preenchimento.
- sem anel de recarga: um `setAlpha(0.4)` enquanto recarrega ja diz a mesma coisa.

Com isso da para sentar e responder a pergunta que importa: **o gesto de escolher e
tocar no alvo se entende sozinho?** Se se entender, os icones valem a pena. Se nao,
melhor descobrir antes de desenhar trinta.

---

## 15. O que a arte vai precisar (depois, nao agora)

- **Duas colunas novas na folha de personagem.** Hoje sao 6 (`parado`, `passoA`,
  `passoB`, `respira`, `conjura`, `tonto`) e `conjura` esta servindo de quebra-galho
  pra tudo. Combate precisa de `ataque` e `machucado`. Isso mexe em `QUADRO` no
  `config.ts`, em `arte/pessoa.py`, em `arte/gente.py` e **regera** `encaixes.json`.
  E a unica mudanca cara desta lista, e o roadmap ja a previu na Fase 1.5.
- **Objetos quebraveis** em `arte/mundo.py`: `pote`, `caixa`, `barril`, `pedra-rachada`,
  `teia`, cada um com o quadro inteiro e o quadro quebrado.
- **Um `arte/magia.py` novo**, um efeito por marca: fogo, gelo, agua, luz, som, vento,
  planta, doce, bolha, cola. Quatro quadros cada, na paleta de `arte/paleta.py`.
- **8 sprites de criatura** que faltam. So o goblin existe.
- **Icones da barra**: golpe de arma (um por arma), golpe sem arma, uma por magia, e o
  anel de recarga.
- **Icones de fraqueza** para o livro: sino, gota, sol, risada, cocega, nome.
- O `!` amarelo do telegrafo, o anel de alvo, e as estrelinhas de quando a criatura
  desiste.

Em `sons.ts` faltam: os sons de reacao (`vapor`, `congelou`, `empurrao`), o de quebrar
objeto, o jingle de **resolveu pela fraqueza**, o de **descobriu uma fraqueza nova**, o
`pluft` do slot em recarga, e seis das nove entradas de `FRAQUEZA_SONORA` (so
`metal-alto`, `gargalhada` e `nome-verdadeiro` existem).

---

## 16. Onde cada coisa mora no codigo

Nada disso quebra a estrutura de hoje. Dado continua em `dados/`, sistema em
`sistemas/`, e nenhuma cena guarda progresso proprio.

| Arquivo | Estado | O que ganha |
|---|---|---|
| `src/dados/conteudo.ts` | existe | `marca`, `forma`, `alcance`, `duracao`, `recarga` em `Magia`; `ataque` em `Arma`; `comportamento` e `marcaFraqueza` em `Criatura` |
| `src/dados/reacoes.ts` | **novo** | a tabela da secao 8. Dado puro |
| `src/dados/config.ts` | existe | o bloco `COMBATE` da secao 12 |
| `src/dados/acoes.ts` | **novo** | o catalogo de tudo que entra num slot. Dado puro |
| `src/sistemas/barra.ts` | **novo** | le `estado().barra`, cuida de recarga e uso por cena |
| `src/cenas/Arsenal.ts` | **novo** | a tela onde o jogador monta a barra |
| `src/sistemas/alvo.ts` | **novo** | o modo de alvo: congela, destaca, recebe o toque |
| `src/sistemas/acao.ts` | **novo** | executa uma acao num ponto. Golpe e magia entram aqui |
| `src/sistemas/marcas.ts` | **novo** | aplica reacao, unico lugar que consulta a tabela |
| `src/sistemas/criatura.ts` | **novo** | os tres comportamentos, telegrafo, desistir |
| `src/cenas/Bestiario.ts` | **novo** | o livro, aberto pela pausa |
| `src/sistemas/heroi.ts` | existe | estado `ataca` e `machucado`; `andarAte(x, y)` |
| `src/cenas/Interface.ts` | existe | desenha a barra, via `caixa()` e `pilha()`. **E do ambiente `ficha`** |
| `src/cenas/Mundo.ts` | existe | cria as criaturas e o regulador de agressao |
| `src/sistemas/controles.ts` | existe | teclas 1 a 6, TAB, B |
| `src/sistemas/estado.ts` | existe | **`barra: (string \| null)[]`**, `magiasEquipadas`, `skillsUsadasNaCena`, `bestiarioVistos`, `bestiarioFraquezas` |

Um detalhe que ja esta pago: o sistema de **ponto de encaixe** de `heroi.ts` faz a arma
seguir a mao quadro a quadro. Quando existir um quadro de ataque, **a espada acompanha
o golpe sozinha**, sem ninguem escrever coordenada. Metade do trabalho de animacao de
combate ja foi feita sem ser pra isso.

### Contratos novos para o `verificar`

`ferramentas/verificar.mjs` ja pega o desencontro silencioso. Combate adiciona sete:

1. toda magia de `MAGIAS` tem `marca` e `forma` validas
2. toda `marca` aparece em pelo menos uma linha de `REACOES`
3. toda criatura com `marcaFraqueza` tem uma reacao com `resolve: true`
4. toda arma de `ARMAS` tem ficha de `ataque`, ou e explicitamente `naoAtaca`
5. toda skill com `ativa: true` tem ficha em `ACOES`, e nenhuma passiva tem
6. todo id que a barra padrao referencia existe em `ACOES`
7. toda magia tem familia em `FAMILIA_DA_MAGIA` de `sons.ts` (isso ja e conferido)

E `npm run auditar` passa a ter que aprovar a barra sem sobreposicao **nas tres
visoes**, principalmente em PERTO (256x160), que e onde o vao e mais apertado.

---

## 17. Ordem de implementacao

> **A ordem que vale e a de `docs/plano-do-combate.md`.** Aquele documento e o
> quadro, e junta esta lista com a do outro. Esta aqui ficou como detalhe do que
> cada etapa quer dizer, nao como sequencia.

Uma etapa por vez, e cada uma **fica jogavel sozinha**. Se a coisa morrer na etapa 3,
o que ficou pra tras continua bom.

| # | Etapa | Fica pronto quando |
|---|---|---|
| 0 | a barra com **1 slot** (golpe sem arma), o modo de alvo, e bater no vazio | tocar o chao e ver poeirinha ja e gostoso |
| 1 | golpe de arma, com a ficha por arma. Objetos quebraveis | quebrar um pote e achar moeda |
| 2 | uma criatura: o goblin `medroso`, com telegrafo e desistir | da pra afugentar um goblin |
| 3 | tontura em vez de derrota, e a moedinha | zerar coracao nao interrompe nada |
| 4 | os slots de magia, com recarga, e **so Bola de Fogo** funcionando | uma magia inteira, fim a fim |
| 4.5 | a tela ARSENAL: dois toques trocam o que esta em cada slot | ele monta a barra do jeito dele |
| 5 | marcas e a tabela de reacoes, com 4 magias | fogo derrete gelo na tela |
| 6 | fraqueza resolve, selo por esperteza, e **o livro de bestiario** | o "aha" acontece e fica anotado |
| 7 | as treze magias, os tres comportamentos, criatura invisivel | as nove criaturas do bestiario |
| 8 | o dado nas viradas de historia | o pedagio do Grulo |
| 9 | animacao e efeito de verdade | secao 14 |

A etapa 0 sozinha ja da pra sentar o Lele na frente e ver se ele entende o modo de alvo
sem ninguem explicar. E esse o teste que decide se o resto vale.

---

## 18. Em aberto

1. **Congelar ou desacelerar no modo de alvo?** O documento adota congelar. A
   alternativa e o mundo andar a 10% da velocidade, que fica mais bonito e menos
   estatico, mas reintroduz um tiquinho de pressa. *Da pra decidir olhando, na etapa 0.*
2. **Criatura encosta e machuca, ou so o golpe telegrafado machuca?** *Inclinacao: so o
   golpe telegrafado. Encostar nunca tira coracao, senao andar vira campo minado.*
3. **Os itens da mochila entram na barra?** Cabem a partir de NORMAL (320x192), mas em
   PERTO nao. *Inclinacao: sim nos slots 7+, e quem joga em PERTO usa pela mochila.*
3.5 **Slots demais em LONGE?** A conta da 13, e treze slots e mais do que um heroi
   tem o que pendurar. *Inclinacao: teto de 10, e o resto de espaco vira respiro.*
4. **O livro de bestiario ganha um slot proprio na barra?** *Inclinacao: nao. Ele mora
   na pausa e na tecla B. Slot de barra e para agir, nao para consultar.*
5. **Uma pagina de barra ou duas?** O Baldur's Gate tem varias. Com 6 a 12 slots e um
   heroi so, uma parece bastar. *Inclinacao: uma agora, e a estrutura ja aguenta duas
   porque `estado().barra` e so uma lista.*
6. **De quem e a barra?** O `AMBIENTE.md` do ambiente 3, `ficha`, diz que ele cuida de
   "`Interface.ts` e `design.ts`, os slots, as habilidades". Este documento **especifica**
   a barra e o ARSENAL; quem **constroi** deveria ser o `ficha`. Precisa de combinado
   antes de alguem escrever a primeira linha, senao sao duas frentes no mesmo arquivo.

---

## Referencias consultadas

- [Designing for Difficulty: Readability in ARPGs](https://www.gamedeveloper.com/game-platforms/designing-for-difficulty-readability-in-arpgs)
- [How to Design Enemy Attack Telegraphs](https://bugnet.io/blog/how-to-design-enemy-attack-telegraphs)
- [Maximizing Game Feel in Action Game Development](https://salivity.github.io/game-development/article/maximizing-game-feel-in-action-game-development)
- [Combat Design, Mechanics and Systems for Satisfying Game Combat](https://gamedesignskills.com/game-design/combat-design/)
- [How to Make a Game for Kids: A Step-by-Step Guide](https://www.summerengine.com/blog/how-to-make-a-game-for-kids)
- [Keys to Combat Design: Anatomy of an Attack](https://gdkeys.com/keys-to-combat-design-1-anatomy-of-an-attack/)
- [Mana vs Spell Slots](https://rpgcounterpoint.com/2023/07/04/spell-casting-mana-or-spell-slots-2/)
