# Lore e desenho visual das cinco raças

Escrito antes de voltar a mexer no sprite do herói. Ordem do trabalho, por pedido
do Hugo: primeiro decidir quem cada raça É, por escrito, depois desenhar. Sem
isso a arte fica adivinhando, e é assim que as cinco raças de hoje viraram cinco
corpos quase iguais com um acessório trocado.

**Nada aqui foi implementado.** É plano, para aprovar ou corrigir antes de
qualquer linha em `arte/pessoa.py`.

## Aviso: o sistema de atributos mudou debaixo deste documento

A primeira versão deste plano foi escrita em cima de FORÇA/ESPERTEZA/CORAÇÃO e
teste de 1d6 — o sistema que está em
`docs/referencia/sistema-do-rpg-de-mesa.md` e ainda hoje é o que roda em
`principal`. Só que existe uma revisão de 2026-09-04, decidida pelo Hugo e já
**implementada em código**, vivendo na frente `ambiente/combate` (commits
`c833a14` e `4e3c696`, documentada em `CLAUDE.md` e `docs/modelo-de-combate.md`
**daquela pasta** — ainda não chegou em `principal`):

- **1d6 virou 1d20 contra Dificuldade (ND).** Cinco desfechos em vez de três:
  crítico de sucesso, sucesso, falha perto, falha, crítico de fracasso. OPS,
  QUASE e INCRÍVEL saem de cena.
- **Três atributos viraram cinco.** ESPERTEZA fazia três trabalhos escondidos
  e ganhou nome próprio pra cada um: **Força, Destreza, Agilidade,
  Inteligência, Vitalidade**. CORAÇÃO virou **Vitalidade** (a palavra "coração"
  fica só para os corações/vida, não mais para o atributo).
- **Sub-atributos, só conceito por enquanto:** Resistência (de Força),
  Percepção e Conhecimento (de Inteligência), Vontade (de Vitalidade). Nenhuma
  ação os testa ainda, mas já servem pra escrever lore com precisão.

Reescrevi este documento inteiro em cima do sistema novo, porque é o que o
Hugo está desenhando agora. **A referência de mesa continua intacta e
correta** — ela descreve o jogo de tabuleiro que a criança realmente jogou, e
essa divergência já está registrada por escrito no CLAUDE.md daquela pasta,
exatamente como o processo deste projeto pede.

### Segunda camada: bônus de raça deixou de ser um ponto só

Isto ainda não existe em NENHUM código — nem em `principal`, nem em
`ambiente/combate` (lá `Raca.bonus` é um `Atributo` só, singular). É pedido
novo do Hugo, feito depois da primeira versão deste documento, e revisado uma
vez: a ideia final é **todas as cinco raças com bônus duplo, e os dez pontos
(5 raças × 2) equilibrados entre os cinco atributos** — cada atributo aparece
em exatamente DUAS raças, nenhum sobra nem falta.

| Raça | Bônus (novo, só neste documento) |
|---|---|
| Gente do Vale | +1 DESTREZA, +1 AGILIDADE |
| Pequenino do Trigo | +1 AGILIDADE, +1 VITALIDADE |
| Anão da Fornalha | +1 VITALIDADE, +1 FORÇA |
| Cria de Dragão | +1 FORÇA, +1 INTELIGÊNCIA |
| Elfo da Folha | +1 INTELIGÊNCIA, +1 DESTREZA |

O jeito mais fácil de guardar isto: é um **ciclo de cinco**, não uma lista
solta. Destreza → Agilidade → Vitalidade → Força → Inteligência → e fecha de
volta em Destreza. Cada raça ocupa um elo do ciclo (dois atributos vizinhos),
cada atributo pertence a exatamente duas raças vizinhas, e as cinco duplas são
todas diferentes entre si — nenhuma raça repete o par de outra. Isso resolve
sozinho o "equilibrado entre os bônus" do pedido: não dá pra desenhar um ciclo
de cinco elos assim e sobrar desequilíbrio.

## Por que elas se parecem hoje

Bônus e Dom por raça, já com a distribuição nova de dois bônus por raça (ver
seção acima):

| Raça | Bônus | Dom |
|---|---|---|
| Gente do Vale | +1 DESTREZA, +1 AGILIDADE | Nunca Desisto: 1x por aventura rola o dado de novo |
| Anão da Fornalha | +1 VITALIDADE, +1 FORÇA | Casco Duro: começa com 4 corações |
| Elfo da Folha | +1 INTELIGÊNCIA, +1 DESTREZA | Olhos de Coruja: enxerga no escuro e de longe |
| Pequenino do Trigo | +1 AGILIDADE, +1 VITALIDADE | Pé de Coelho: 1x por aventura troca uma Falha por uma Falha Perto |
| Cria de Dragão | +1 FORÇA, +1 INTELIGÊNCIA | Sopro Quentinho: 1x por aventura solta fogo (a própria ação usa Vitalidade — ver a raça abaixo) |

Isso é regra de jogo, não descrição de gente. Em código (`arte/pessoa.py`,
`RACAS`), cada raça hoje tem exatamente UM traço de silhueta (orelha, barba,
chifre+escama, descalço) montado num de três tipos de corpo genéricos (magro,
normal, gordinho) e uma de quatro alturas. É pouco: tirando a cor, dá pra
confundir Gente do Vale com Pequenino de longe, e o problema que o Hugo apontou
("todas são muito parecidas") é exatamente esse — a raça é uma peça anexada a
um corpo neutro, não um corpo com identidade própria.

**A regra deste documento:** cada raça precisa de uma origem, um jeito de
viver, um jeito de lutar e uma descrição visual que dê pelo menos DOIS ou TRÊS
sinais de silhueta/textura/cor — não um só — reconhecíveis mesmo sem cor, a 16
px de distância. Nada aqui contradiz a referência; tudo aqui expande o que ela
deixou em branco de propósito, ancorado nos lugares e no dom que já existem.

---

## Gente do Vale

| | |
|---|---|
| Bônus | +1 DESTREZA, +1 AGILIDADE |
| Dom | Nunca Desisto — 1x por aventura, rola o dado de novo |

**Origem e terra natal.** Vila Semente, o vale onde o próprio herói nasceu, com
Vovó Aurora. É a raça-âncora do mundo: quem planta o trigo, cria os bichos,
constrói a casa com a própria mão e não sai do vale a não ser que precise. Não
tem magia no sangue, não tem dom da natureza — tem mão rápida e reflexo pronto.

**Como vivem.** Trabalho de terra e de estação: plantio, colheita, feira,
inverno. Casa de família grande, porta sempre aberta pro vizinho. É o povo que
manda notícia por carta e reconhece todo mundo que passa pela estrada, porque
pela Vila Semente passa pouca gente de fora.

**Como lutam.** O bônus duplo muda o retrato: não é mais "sem talento nenhum",
é **rápido em duas frentes diferentes**. Destreza vem de uma vida inteira com
as mãos ocupadas — laçar bicho solto, consertar cerca, atirar pedra pra
espantar corvo — e Agilidade vem de andar em terreno vivo, imprevisível,
sempre alerta a tempo e bicho. Na mesa isso lê como reflexo bom: iniciativa
alta, esquiva melhor que a média, mão firme com funda ou faca de cozinha. Nunca
Desisto continua sendo a segunda camada, não a única: quando o reflexo não
basta, entra a teimosia. Serve bem a qualquer classe, mas principalmente
Caçador e Cavaleiro — o Cavaleiro do Vale não é o mais forte, é o que chega
primeiro no golpe.

**Pontos fortes.** Reação rápida — inicia bem, esquiva bem, acerta com precisão
em coisa que exige mão firme. Some duas fraquezas de uma vez (dado de novo, e
raramente é pego de surpresa primeiro).

**Pontos fracos.** Nenhuma reserva: sem bônus de Vitalidade, aguenta menos
pancada que antes; sem Inteligência, não tem talento pra magia nem pra
perceber o que não está na cara. É rápido, não é resistente nem sábio.

**Descrição visual.** Corpo mediano, sem exagero em nenhuma direção — é a régua
contra a qual as outras quatro raças se leem como diferentes, não a raça
"neutra sem gasto de desenho". Três sinais, não um:

1. **Pele tostada de sol e sarda.** Não é reskin de tom de pele genérico: leva
   sarda de verdade (2-3 px espalhados no rosto) e um tom mais quente que as
   outras raças, de quem trabalha na roça.
2. **Postura de pé plantado.** Ombro quadrado, peso nas duas pernas — a
   diferença de silhueta de quem "não sai do lugar" contra o elfo, que é todo
   peso adiantado.
3. **Mão calejada.** Um traço de sombra a mais na palma/nós dos dedos (o mesmo
   truque de textura que já existe pra sarda, aplicado na mão) — mão de quem
   segura enxada, não só espada.

Paleta: tons terrosos quentes, nada de verde ou azul saturado — essa faixa fica
reservada pro Elfo e pro Cria de Dragão.

---

## Anão da Fornalha

| | |
|---|---|
| Bônus | +1 VITALIDADE, +1 FORÇA |
| Dom | Casco Duro — começa com 4 corações |

**Origem e terra natal.** Fornalha, a cidade na montanha onde mora a ferreira
Torva Martelo-Feliz. Vive dentro e ao redor da rocha: minas, forjas, escadaria
de pedra. Onde a Gente do Vale planta, o Anão extrai e forja.

**Como vivem.** Cultura de turno de forja e guilda de ofício. Aprende-se um
ofício antes de aprender a lutar, e a lida direta com fogo e martelo desde
criança é o que explica o corpo largo e a resistência — não é magia, é
calo. Comida farta, hospitalidade calorosa, orgulho declarado do trabalho
manual.

**Como lutam.** Não esquivam, aguentam. Casco Duro é a tradução mecânica de uma
cultura que valoriza resistir ao golpe mais do que evitar ele — o Anão avança
reto, absorve o que vier, e devolve com juros. Com o bônus duplo (Força e
Vitalidade) é a raça mais dura do jogo em dois sentidos ao mesmo tempo: bate
forte E aguenta apanhar — é a raça que melhor encarna Resistência (o
sub-atributo de Força), não é só bater forte, é aguentar o tranco antes de
bater. Combina bem com Cavaleiro e Ferreiro, mas mesmo o Anão Mago prefere
ficar perto do perigo a fugir dele.

**Pontos fortes.** O maior colchão de corações do jogo, e agora também o teste
de aguentar em si. Erra de novo até dar certo, literalmente — pode gastar hit
e ainda sobrar jogo.

**Pontos fracos.** Nada de finesse: Destreza e Agilidade não são o forte de
ninguém aqui por padrão, e a cultura de "aguentar o golpe" não ensina a evitar
ele. Também é o mais lento a cobrir distância (corpo baixo e largo).

**Descrição visual.** Já está no código: baixo, largo, barba. Falta densidade:

1. **Fuligem e queimadura, não só barba ruiva.** Uma mancha de sombra a mais
   no antebraço/mão (fuligem de forja), textura que nenhuma outra raça tem.
2. **Mãos e nós dos dedos maiores que o resto do corpo pede.** Silhueta de
   quem segura martelo o dia inteiro — o oposto do dedo fino do Elfo.
3. **Centro de gravidade baixo de propósito, não só "baixo".** Postura larga,
   pés afastados, quase quadrada — lê como "não vou cair" mesmo parado.

Paleta: identidade de cor própria em vez de só "pele + barba ruiva" — um
acento em tom de brasa/cobre (não vermelho puro) em algum detalhe fixo,
sugerindo o calor da forja sem precisar de fogo desenhado.

---

## Elfo da Folha

| | |
|---|---|
| Bônus | +1 INTELIGÊNCIA, +1 DESTREZA |
| Dom | Olhos de Coruja — enxerga no escuro e de longe |

**Origem e terra natal.** Floresta Sussurro, onde as árvores repetem o que
você fala. Um Elfo da Folha cresce ouvindo a própria voz devolvida pelo mato —
faz sentido que a raça toda valorize escutar e observar antes de agir.

**Como vivem.** Pouca construção, muita copa: vive-se NA floresta, não ao lado
dela. Silêncio é cortesia; interromper alguém é feio, porque a floresta já
interrompe todo mundo o dia inteiro com eco. Decisão em grupo demora, porque
se ouve todo mundo primeiro.

**Como lutam.** Vêem a abertura antes dela existir, e quando veem, acertam.
Olhos de Coruja deriva de Percepção (sub-atributo de Inteligência) — saber
ONDE mirar — mas o bônus duplo soma a mão que não treme na hora de mirar
(Destreza): o Elfo não é só quem enxerga a fresta, é quem passa a flecha por
ela. As duas coisas fazem sentido juntas — mira de verdade é ver mais acertar,
não só uma das duas. Favorece Caçador (Destreza dobrada) e Mago (Inteligência
pura), mas até o Elfo Cavaleiro escolhe o momento do golpe em vez de
simplesmente avançar.

**Pontos fortes.** Vê e acerta: Percepção pra nunca ser pego de surpresa,
Destreza pra converter a abertura vista em golpe certeiro. Inteligência alta
também ajuda Conhecimento — lembrar, reconhecer, resolver por saber.

**Pontos fracos.** Corpo magro, sem reserva de resistência — perde no cansaço e
no confronto direto e prolongado. Cultura de "ouvir antes de agir" também lê
como hesitação quando a decisão precisa ser rápida: o Elfo mira bem, mas
raramente é o primeiro a decidir atacar.

**Descrição visual.** Já está no código: alto, magro, orelha de folha. Falta
o elemento que dá o "Olhos de Coruja" de verdade:

1. **Olho grande e claro, com brilho.** Este é o sinal mais barato e mais
   forte da lista inteira: um pixel de luz na íris (âmbar ou dourado) lê como
   "enxerga o que os outros não veem" mesmo a 16 px, e nenhuma outra raça tem
   olho tratado assim.
2. **Postura de peso adiantado, atento.** O oposto do Anão: magro, leve,
   sempre parecendo prestes a ouvir alguma coisa.
3. **Um traço de textura de casca/musgo no ombro ou no cabelo**, não só a
   orelha — reforça "vive na árvore" sem precisar desenhar floresta atrás.

Paleta: verde-musgo frio como base, com o âmbar do olho como ÚNICO acento
quente — contraste reservado, o oposto do Pequenino (ver abaixo), que é
quente de ponta a ponta.

---

## Pequenino do Trigo

| | |
|---|---|
| Bônus | +1 AGILIDADE, +1 VITALIDADE |
| Dom | Pé de Coelho — 1x por aventura troca uma Falha por uma Falha Perto |

**Origem e terra natal.** Os trigais que cercam a Vila Semente — vizinhos da
Gente do Vale, não a mesma gente: onde o Vale planta e constrói, o Pequenino
colhe e negocia. Comunidade pequena, casas baixas, tudo em escala menor.

**Como vivem.** Feira, troca, conversa. Sociedade de quem é fisicamente menor
num mundo feito pros outros, então aprendeu a negociar em vez de forçar —
confiar na sorte e no jeitinho é cultura, não acidente, e é disso que sai Pé de
Coelho.

**Como lutam.** Evitam a luta direta e torcem pela sorte quando ela chega.
Fisicamente o menor das cinco raças, então o combate ideal do Pequenino é o
que nunca devia ter acontecido — ele aparece de outro ângulo, distrai, escapa
antes do golpe chegar. Agilidade cobre a fuga: iniciativa alta, esquiva boa, o
primeiro a sumir de vista. Vitalidade é o seguro contra quando a fuga falha —
callback direto ao +1 CORAÇÃO que a raça já tinha na referência de mesa,
antes da revisão de atributos: o Pequenino sempre foi resiliente por dentro,
só que agora some rápido também. Pé de Coelho cobre o resto: quando a sorte
falha mesmo assim, amortece o dano do azar, trocando uma Falha Perto (que
penaliza mais) por uma Falha comum. Favorece Amigo dos Bichos e Caçador; o
Pequenino Cavaleiro é o que menos parece Cavaleiro de todos, e isso é a graça
dele.

**Pontos fortes.** Escapa antes de apanhar — iniciativa e esquiva altas — e
quando é alcançado mesmo assim, aguenta mais do que o tamanho sugere.

**Pontos fracos.** Sem Força e sem Inteligência: não empurra, não convence
pela cabeça, não estuda a situação — só foge dela bem e aguenta o resto.

**Descrição visual.** Já está no código: baixo (criança), descalço. Falta
identidade que não seja só "pequeno":

1. **Cor de trigo, não paleta genérica.** Cabelo loiro-palha e pele clara e
   quente — identidade de cor exclusiva, ninguém mais no jogo usa essa faixa
   dourada como cor principal.
2. **Pé descalço desenhado com dedo de verdade**, não só "sem bota" — já é o
   único traço de hoje, mas hoje é invisível (a bota de todo mundo cobre o
   pé). Vale garantir que ele apareça nas poses certas.
3. **Rosto arredondado, bochecha cheia.** Contraste direto com o Elfo
   anguloso — os dois ficam nos extremos opostos de "redondo x fino" que
   nenhuma raça ocupa hoje.

Paleta: dourado quente, o oposto frio do Elfo — as duas raças mais "cabeça"
do jogo (uma de Inteligência, outra de sorte/Vitalidade) ficam visualmente
antagônicas de propósito.

---

## Cria de Dragão

| | |
|---|---|
| Bônus | +1 FORÇA, +1 INTELIGÊNCIA |
| Dom | Sopro Quentinho — 1x por aventura solta fogo (a ação usa Vitalidade) |

**Origem e terra natal.** Aqui a referência não diz de onde vêm, e é bom
motivo pra não inventar uma cidade nova: são um povo raro e espalhado,
remanescente de quando dragões viviam em Aurora antes da Pedra do Sol se
partir. Não têm vila própria — nascem em qualquer lugar do reino, um a cada
muitas gerações, e crescem entre outra raça até a escama aparecer.

Isso não é enfeite, resolve um problema de história: evita que "Cria de
Dragão" pareça parente ou súdito de Brasanegra. Eles carregam a mesma centelha
que ele tinha ANTES da Bruxa Espinho quebrar a Pedra — o fogo quentinho e
gentil é o contraponto direto da fumaça fria e da rispidez de Brasanegra, não
uma versão pequena dela. Um jogador de Cria de Dragão está, sem saber, jogando
o que Aurel deveria ainda ser.

O sistema novo dá um detalhe que reforça isso sozinho, sem eu precisar
inventar nada: **Sopro Quentinho é uma ação de Vitalidade, não de Força.** O
bônus da raça é Força (o corpo é forte), mas o fogo que ela solta vem de
outro lugar — vida, calor, cuidado — o mesmo atributo que rege coragem e
fazer amigo. Mesmo a magia de fogo da Cria de Dragão não é sobre destruir.

**Como vivem.** Sem comunidade própria — cada Cria de Dragão cresce numa vila
alheia (Vale, Fornalha, tanto faz) e carrega isso: são gente de fora em
qualquer lugar que estejam, o que combina com Força alta e pouca paciência
para cerimônia local.

**Como lutam.** De frente, sem hesitar — Força alta e sangue quente empurram
pra briga direta em vez de espera. O bônus de Inteligência não contradiz isso:
não é estudo nem paciência, é **memória de sangue** — o sub-atributo
Conhecimento herdado de quando a própria espécie de dragões vivia em Aurora,
não Percepção (essa é do Elfo, é ficar parado observando). Um Cria de Dragão
"sabe" coisa que nunca aprendeu — reconhece magia antiga, sente Cristal de
Aurora perto, entende fogo — sem precisar ser esperto no sentido de ler
situação devagar. Sopro Quentinho é pequeno e gentil de propósito (aquece, não
incendeia), o que é ótimo narrativamente e ruim taticamente: o Dom deles ajuda
os outros mais do que ajuda a bater. Combina com Cavaleiro; o Cria de Dragão
Mago usa a memória herdada mais que o livro, e resolve magia removendo o
cajado do caminho e usando o punho.

**Pontos fortes.** Força bruta e coragem na entrada, memória herdada quando a
pergunta é "o que é isso" em vez de "onde ele está".

**Pontos fracos.** Orgulho e impaciência: sangue de dragão não gosta de
esperar, e testes que pedem Percepção ou paciência (a espera de um Elfo, o
cálculo de um Anão) custam mais caro pra essa raça do que pras outras.

**Descrição visual.** Já está no código: chifre, escama na bochecha. É a raça
com mais potencial de silhueta única do jogo e a que menos usa isso hoje:

1. **Cauda.** Já está citada no comentário de `arte/pessoa.py` como traço
   pretendido e nunca desenhada. É o único elemento de silhueta que nenhuma
   outra raça pode ter, ótimo em perfil e de costas — dois ângulos onde hoje
   a Cria de Dragão é idêntica à Gente do Vale.
2. **Trilha de escama, não duas manchas na bochecha.** Escama subindo da
   mandíbula até a base do chifre, e um pouco no antebraço — a escama vira
   textura reconhecível em vez de detalhe que só aparece de frente.
3. **Pele com fundo quente (âmbar/brasa), nunca tom de pele neutro.** É a raça
   mais próxima em paleta do Anão (os dois usam calor), mas o Anão é
   fuligem/cobre fosco e a Cria de Dragão é âmbar/brasa vivo — precisa ficar
   claro que são referências de calor diferentes.

Paleta: base âmbar/vermelho quente, escama num tom mais escuro e saturado que
a pele — o par de cores mais vivo das cinco raças, coerente com ser a raça
"corajosa até demais".

---

## Tabela-resumo, pra checagem rápida na hora de desenhar

| Raça | Bônus | Traço #1 (novo) | Traço #2 (novo) | Traço #3 (novo) | Identidade de cor |
|---|---|---|---|---|---|
| Gente do Vale | Destreza + Agilidade | sarda + pele tostada | postura quadrada, pé plantado | mão calejada | terroso quente, neutro |
| Pequenino do Trigo | Agilidade + Vitalidade | cabelo loiro-palha, pele clara quente | pé descalço com dedo visível | rosto redondo, bochecha cheia | dourado quente |
| Anão da Fornalha | Vitalidade + Força | fuligem/queimadura no braço | mão e nós de dedo grandes | postura larga e baixa | brasa/cobre fosco |
| Cria de Dragão | Força + Inteligência | cauda | trilha de escama mandíbula→chifre | pele âmbar/brasa viva | vermelho-âmbar vivo + escama escura |
| Elfo da Folha | Inteligência + Destreza | olho grande com brilho âmbar | postura leve, peso adiantado | textura de casca/musgo no ombro | verde-musgo frio + 1 acento âmbar |

Reordenei as linhas pra mostrar o ciclo: cada raça compartilha um atributo com
a de cima e um com a de baixo (a última fecha com a primeira — Elfo e Vale
dividem Destreza). Cada raça tem no mínimo dois sinais visuais que sobrevivem
sem cor (silhueta ou textura) e um terceiro que é só cor — o suficiente pra
reconhecer de longe e sem depender do jogador decorar "orelha pontuda =
dragão". Isso é independente do bônus de atributo: o par visual não precisa
bater 1-para-1 com o par mecânico (Vale tem bônus de reflexo e paleta
"neutra" de propósito, por exemplo) — são dois sistemas resolvendo dois
problemas diferentes.

Conferência de equilíbrio: 5 raças × 2 pontos = 10, e cada um dos 5 atributos
aparece em exatamente 2 raças (Força: Anão+Dragão; Destreza: Vale+Elfo;
Agilidade: Vale+Pequenino; Inteligência: Elfo+Dragão; Vitalidade:
Anão+Pequenino) — igual dos dois jeitos que importam: quantos atributos cada
raça tem, e quantas raças cada atributo tem. As cinco duplas também não se
repetem entre si, então nenhuma raça é mecanicamente idêntica a outra.

## O que fica de fora deste documento, de propósito

- **Classe não entra aqui.** Roupa (`arte/roupa.py`) já diferencia bem as cinco
  classes por desenho; o problema apontado era raça, não classe.
- **O Dom, os corações-base e o texto de cada raça são os que já estão
  implementados** em `ambiente/combate` (`src/dados/conteudo.ts`) — não mudei
  nada disso. **O bônus duplo por raça é a exceção**: é proposta nova do
  Hugo, registrada aqui pela primeira vez, e não existe em NENHUM código
  ainda — nem em `principal`, nem em `ambiente/combate`. Quem for implementar
  precisa trocar `bonus: Atributo` por uma lista em `src/dados/conteudo.ts`.
- **Merge de `ambiente/combate` pra `principal`, e agora também da ideia de
  bônus duplo pro código.** Nenhum dos dois é decisão de arte, e nenhum dos
  dois é resolvido por este documento — ele só garante que a lore não fique
  presa numa versão velha do jogo enquanto a decisão de código não chega.
- **Implementação em `arte/pessoa.py`.** Fica para depois da aprovação deste
  plano, e é onde os "pontos fortes/fracos" viram pixel de verdade.
