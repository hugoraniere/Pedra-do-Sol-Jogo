# Roadmap de expansão

Levantamento pedido pelo Hugo em 2026-09-06, depois que a checklist técnica de
`docs/plano-de-lancamentos.md` ficou toda verde. Cobre oito frentes que ele
quer adicionar e que **não têm lugar em `docs/05-roadmap.md` hoje**: novos
moodles, novos cenários, interfaces melhores, melhorias em sprites, melhorias
em ícones, equipamento e armas com animação e poder próprios, interação com
objeto de mapa, e quests/side-quests com alerta na tela.

**Isto não substitui `docs/05-roadmap.md`** — ele continua sendo a ordem das
fases da aventura 1. Este documento é o que fazer com o material NOVO, e onde
ele encaixa. A numeração de versão segue `docs/plano-de-lancamentos.md`.

Duas pesquisas de referência alimentaram este documento (Stardew, BotW, BG3,
DOS:2, Hades, Dead Cells, Moonlighter, Chained Echoes, Project Zomboid, Don't
Starve, Valheim). As conclusões estão citadas ao longo do texto; onde a
pesquisa **contraria** um pedido, isso está marcado como tensão explícita, não
resolvido por conta própria.

---

## 0. Decisões que o Hugo já tomou nesta rodada

Registradas aqui porque mudam o desenho de tudo abaixo:

1. **Prioridade nº 1: quests com alerta na tela.** É a frente que ele quer ver
   funcionando primeiro.
2. **Ordem: misturada.** Fecha um item pendente da Fase 1 por vez, junto com o
   trabalho novo — em vez de fechar a Fase 1 inteira antes ou de largá-la.
3. **Resolução: vai pra 48**, como `docs/estudo-de-resolucao.md` recomenda.
   Isso encerra a contradição com `docs/09-plano-de-resolucao-e-contraste.md`
   (que pedia 32) — o `09` cede, por escrito, aqui.
4. **Uma missão "seguida" por vez** (modelo Breath of the Wild): só a missão
   seguida produz marcador de caminho; as outras ficam listadas sem marcador.
5. **O botão de ação muda de rótulo conforme o alvo** — FALAR, PEGAR, ABRIR,
   ACENDER.
6. **Quer muito mais lugares** que os três da aventura 1: Portomares,
   Fornalha, Altacoruja, os outros do material de mesa.
7. **Tudo visual incomoda:** herói/personagens, ícones, cenário e interface,
   os quatro.
8. **Sobre a interface, os quatro problemas ao mesmo tempo:** parece genérica,
   é poluída, é difícil no toque, e é inconsistente entre telas.
9. **Moodles: 4 a 6, os que a pesquisa aprova** — fome e sono (já existem) +
   peso/sobrecarregado + ferido + bem alimentado (o positivo). Sede, frio,
   sanidade e tédio ficam de fora.
10. **Os moodles ganham ícone na tela**, com mais informação ao tocar/hover, e
    aparecem **também na Ficha**. É o modelo Zomboid (ícone no HUD, nome do
    estágio sob demanda, nunca número cru) — e mantém a separação que o jogo
    já tem: HUD é o lugar do alerta, a aba EU da Ficha é o lugar do detalhe.
11. **Fecha a aventura 1 antes dos lugares novos.** Floresta → Ponte →
    Caverna → Cristal do Amanhecer, e só depois Portomares/Fornalha/
    Altacoruja. Isto confirma o `CLAUDE.md` em vez de divergir dele — nenhuma
    decisão escrita nova é necessária.
12. **A virada pra 48 entra depois do barato e antes dos mapas novos.**
    Primeiro tile de transição + rampa de 5 tons + sombra (ganho rápido, vale
    em qualquer resolução); depois a virada; só então os mapas novos, que já
    nascem grandes e nunca precisam ser refeitos.

---

## 1. A frente que ele quer primeiro: quests com alerta na tela

### O que a pesquisa achou

**Nenhum RPG bom da amostra pausa o jogo para anunciar quest.** O padrão é
sempre não-modal, e o "estado pendente" mora num ícone persistente do HUD. O
melhor exemplo é o Stardew: o ponto de interrogação no canto **treme até o
jogador abrir o diário** — o aviso é descartável, o lembrete é que fica.

Erros comuns que a pesquisa lista, e que valem como regra negativa:
- marcador demais (a reclamação nº 1 do BG3: 20+ setas no minimapa);
- log dessincronizado do objetivo ativo — "o jeito mais rápido de o jogador
  parar de abrir o diário para sempre";
- marcador que não some depois de concluir;
- ficar sem objetivo nenhum ativo entre capítulos;
- **"tokenização" da narrativa**: com log, o jogador passa a pular diálogo
  procurando o que virou tarefa, e ignora tudo que é sabor. Não há solução
  universal — é troca consciente.

No toque especificamente:
- **alerta na faixa SUPERIOR, nunca na inferior** — o rodapé é onde moram o
  direcional e o botão de ação; toast lá embaixo é toast que o polegar tapa;
- **o toast não pode ser interativo** (vira armadilha de toque acidental
  durante movimento). O toast informa; o ícone persistente é o alvo tocável;
- alvo mínimo de 44 pt para o ícone do diário e para cada linha de quest.

Duração: nenhum jogo publica o número. A convenção de UI é **3 a 5 s**, com 4 s
como meio-termo e limite de 2 linhas.

### Cortes propostos

- **`1.2.4` — o toast de missão.** Faixa superior, 1 linha, ~3,5–4 s, com
  fade: `Missão nova: <nome>`. Sem descrição, sem recompensa. Não pausa, não é
  clicável, e é descartado na hora se abrir diálogo, combate ou pausa. Fila,
  não pilha: três coisas juntas viram "Diário atualizado (3)". Som próprio,
  curto, distinto de item e de dano — **`dados/sons.ts` já tem "achar pista"
  cadastrado e nenhuma cena toca ele**, este é o lugar.
- **`1.2.5` — o selo persistente no ícone do diário.** Ponto/contador que só
  limpa quando a aba DIÁRIO é aberta. É o `?` tremendo do Stardew, e é o que
  faz o sistema não depender da duração do toast.
- **`1.2.6` — a missão seguida.** O jogador escolhe uma missão como "seguida"
  no diário; só ela produz marcador. Decisão do Hugo, modelo BotW.
- **`1.2.7` — etapas com risco visível.** Como perder custa moedas e itens de
  verdade, o diário deve dizer o que a etapa exige ANTES ("precisa atravessar
  a Mata — última fogueira: Vila Semente"). Vagueza estilo DOS:2 é anti-jogo
  aqui, porque a punição é material.
- **`1.2.8` — o toast de conclusão.** Mesmo espaço, mesma duração, mesma
  filosofia da tela de derrota: mostra o resultado seco e devolve o controle.
  **Nunca uma tela cheia.**

---

## 2. Interação com objeto de mapa

### A regra que organiza tudo

A pesquisa achou um princípio que resolve a maior parte das decisões:

> **A quantidade de destaque necessária é inversamente proporcional à
> quantidade de objetos interativos do jogo.**

BotW quase não destaca nada porque *quase tudo* é interativo — modelo caro, e
não é o caso deste jogo. A Pedra do Sol tem cenário majoritariamente
decorativo (casas, árvores e móveis desenhados como peças inteiras), então
está do lado que **precisa de sinalização explícita, mas econômica**.

### Sinalizar por consequência, não por tipo de objeto

Este é o achado mais aproveitável da pesquisa inteira:

| Tipo | Sinal | Por quê |
|---|---|---|
| **Dá item** | Cintilância permanente (modelo Sea of Stars) | É o único caso em que varrer o mapa é comportamento desejável |
| **Dá informação/sabor** | **Nenhum sinal à distância.** Só o prompt ao aproximar | Se sabor brilha, o jogador toca em tudo e depois se sente enganado. Sabor é recompensa de curiosidade, não de varredura |
| **Avança quest** | Marcador distinto e **temporário**, que só existe enquanto a quest está seguida e some quando a etapa fecha | Marcador que sobrevive à conclusão destrói a confiança no sistema |

Regra derivada: **o marcador de quest nunca é o mesmo do interativo
genérico.** Se forem iguais, o jogador não distingue "isto importa agora" de
"isto existe".

E uma regra que casa com o CLAUDE.md ("seta piscando é o remendo de quando o
mapa não se explica"): **consistência de silhueta antes de qualquer efeito.**
Se baú sempre parece baú, não precisa de brilho em baú. Efeito é remendo de
vocabulário fraco.

### Toque: botão contextual ganha do toque direto

A Larian, adaptando DOS:2 pro iPad, concluiu que **botão de confirmar explícito
ganha de duplo-toque** — "você sabe 100% que disparou no ponto que escolheu".
E o problema estrutural do toque direto num jogo de tile pequeno: **o dedo tapa
o objeto no exato momento em que o jogador precisa ver o resultado**.

### Cortes propostos

- **`1.2.9` — o botão de ação diz o que vai fazer.** Decisão do Hugo: o rótulo
  muda conforme o alvo (FALAR, PEGAR, ABRIR, ACENDER). Isso é o prompt
  contextual do BotW em forma de botão fixo, e resolve a distinção
  item/sabor/quest **sem nenhum marcador no mundo**. Raio de ativação
  generoso, **um prompt só** — nunca cinco simultâneos.
- **`1.2.10` — cintilância no que dá item.** Partícula pequena, animada, só no
  que dá item. Nada no que é sabor.
- **`1.2.11` — objetos de sabor pelo mapa.** Sem sinal nenhum: recompensa de
  curiosidade. É o que enche o mundo sem encher a tela.
- **`1.2.12` (opcional) — o botão de revelar.** O "segurar Alt" da Larian, em
  versão de toque: um ícone de olho que pisca todos os interativos da tela por
  ~2 s. Tela limpa por padrão, revelação total quando o jogador pede.

---

## 3. Armas e equipamento com personalidade

### O padrão central: arma com verbo próprio

O achado mais consistente: **arma boa muda o que você faz, não quanto você
tira.** O designer do Dead Cells é explícito — espada, maça e arma média que
jogam igual "não trazem diferença nenhuma". A técnica deles não é inventar 50
mecânicas, é derivar variantes por **condição**: "a próxima iteração dessa
espada pode ser: se você estiver com menos de 50% de vida, ela dá crítico
sempre."

Para um RPG de d20, isso é ouro: a condição é **uma cláusula de uma linha em
cima da mesma rolagem que já existe**.

O BG3 (por turnos, como este jogo) resolve com **Weapon Actions** — a arma
concede uma ação extra, **com carga limitada**, que recarrega no descanso. A
arma não muda o ataque padrão; ela **adiciona um botão que se usa 1–2 vezes por
luta**. Baratíssimo de implementar, e resolve "toda arma parece igual" sem
tocar no laço base.

### Quantas armas

Não existe número mágico com respaldo — e a pesquisa é honesta sobre isso. Os
dados: Dead Cells tem 50 (mas a variedade sai da combinatória de 4 slots, não
do catálogo); Moonlighter tem ~5; um estudo de caso indie chegou em 3 como o
mais equilibrado após playtest. O contra-exemplo canônico de inchaço é
Battlefield 4 com 88 armas primárias.

**Recomendação para este escopo: 5 a 7 arquétipos com verbo próprio, cada um
com 2–3 degraus de qualidade.** Não são "20 armas", são "6 verbos × 3 degraus".
O jogador aprende 6 coisas, não 20 — e o degrau dentro do arquétipo é onde o
"+2 de dano" mora legitimamente, porque o eixo interessante já foi resolvido
pelo verbo.

Esqueleto que casa com os 5 atributos deste jogo (proposta da pesquisa, **não
aprovada ainda**):

| Arma | Atributo | Verbo (a frase que o jogador lê) |
|---|---|---|
| Espada | Força | Confiável: ND normal, sem penalidade |
| Machado | Força | Acerta dois inimigos adjacentes, mas ND +2 |
| Lança | Destreza | Alcança 1 casa além — ataca sem ser alcançado |
| Adaga | Agilidade | Age antes na iniciativa; crítico em 19–20 |
| Arco | Destreza | Distância; desvantagem colado no inimigo |
| Cajado | Inteligência | Não bate bem, mas magia sai com ND −2 |

Cada linha é uma cláusula no motor de rolagem. Nenhuma exige sistema novo.

### Animação sem 50 sprites

Este projeto **já está estruturalmente à frente**, porque a arma já está
pendurada por ponto de encaixe, desenhada fora do corpo (`arte/equipamento.py`
+ `encaixes.json`). Essa é exatamente a técnica certa.

O que a pesquisa acrescenta, em ordem de retorno por esforço:

1. **Três gestos de braço, não um por arma:** corte horizontal, estocada,
   golpe de cima pra baixo. Espada e machado dividem o mesmo corte — o que
   muda é a arma pendurada e o *timing*.
2. **Timing como diferenciador principal.** Mesmo gesto, 6 quadros = adaga; 14
   quadros com 3 de antecipação parada = machado. Custo: dois números num
   arquivo de dados, **zero pixel novo**.
3. **Quadro de borrão (smear frame):** um arco borrado mostrando o caminho, 1
   sprite por arquétipo. É o que dá sensação de velocidade em pixel art.
4. **Efeito de impacto é o verdadeiro identificador.** O que o jogador lê como
   "arma diferente" é sobretudo o *hit*: partícula, congelamento de 1–3
   quadros, tremor de câmera, som. Dead Cells assume ter tirado isso de jogo
   de luta. **Isto é código e som, não sprite — é o item de maior retorno por
   esforço da lista inteira.**
5. **Combate por turnos tolera animação curta e telegrafada muito melhor que
   tempo real.** Não perseguir fluidez; perseguir leitura.

### Armadura e acessório sem virar planilha

O problema clássico: armadura só tem um número, então "melhor" é sempre óbvio
e a escolha morre. Três soluções vistas:

- **Chained Echoes:** a armadura é porta-passivas (cristais encaixados). A
  escolha vira "que 3 passivas eu quero", não "que número é maior".
- **DOS:2:** armadura como camada que *gateia efeitos* — enquanto está de pé,
  imune a controle. Decisão tática visível, não subtração invisível.
- **Valheim/Stardew: o limite duro.** Valheim tem 3 comidas ativas; Stardew
  tem exatamente 1 comida e 1 bebida. **O limite duro é o que impede a
  planilha.** Se o jogador só pode ter 3 coisas ativas, ele escolhe; se pode
  ter 12, ele soma.

Recomendação: armadura = um número (ND de defesa) **mais uma característica de
uma frase** (couro = "+1 na iniciativa"; robe = "magia com ND −1"). Acessório =
cláusula condicional, **limite duro de 1 equipado**.

E a regra de ouro pra reprovar um item: **se a única frase honesta que dá pra
escrever sobre ele é um número, ele não deveria existir como item — deveria ser
um degrau de qualidade da arma que já existe.**

### Cortes propostos

- **`1.7.0` — o verbo de cada arma.** 6 arquétipos, 6 cláusulas no motor de
  rolagem. Zero arte nova.
- **`1.7.1` — efeito de impacto por arquétipo.** Congelamento de quadro,
  partícula, som. Código e som, não sprite.
- **`1.7.2` — timing por arquétipo** em cima de 3 gestos de braço
  compartilhados.
- **`1.7.3` — raridade visível.** Cor da própria paleta do jogo (cadastrada em
  `arte/paleta.py`/`COR`, respeitando "Nada de cor solta") **mais um canal
  redundante de forma** — pontinhos na moldura do slot. Só cor é fraco em
  pixel art pequena e pior em celular, e redundância cor+forma também é o que
  salva quem enxerga cor diferente.
- **`1.7.4` — armadura e acessório com uma frase cada**, limite duro de 1
  acessório.

---

## 4. Moodles — e a tensão com o pedido do Hugo

### O que o Zomboid faz de verdade

Ícones circulares no canto superior direito, moldura vermelha, empilhados.
**Nunca mostram número** — o nome do estágio só aparece no hover. O Build 42
tem **26 categorias**, a maioria com 4 níveis.

Três traços estruturais que valem copiar independente de quantos moodles
entrarem:

1. **O primeiro nível não faz nada.** "Peckish" tem zero efeito mecânico; é
   puro aviso. Só em "Hungry" começa a doer. **O moodle avisa antes de punir**,
   então quando dói, o jogador sabe que foi escolha dele.
2. **Existe moodle positivo.** "Food Eaten" é bom — aumenta cura. A barra de
   status não é só má notícia.
3. **Cada moodle tem uma cura nomeada e concreta.** Nunca é "espere passar".

### A tensão, RESOLVIDA em 2026-09-06: ficam 4 a 6

O Hugo tinha pedido "vários moodles, estilo Project Zomboid"; depois de ver o
argumento da pesquisa, **decidiu pelos 4 a 6 aprovados** — fome e sono (já
existem) + peso + ferido + bem alimentado. Sede, frio, sanidade e tédio ficam
de fora. O registro do debate fica abaixo porque o raciocínio continua útil
se alguém quiser reabrir.

Os dois lados do argumento, honestamente:

- **A favor de vários:** é o tom declarado do jogo ("RPG de sobrevivência...
  no tom seco de Project Zomboid", CLAUDE.md). Mais estados = mais textura de
  sobrevivência, e o Hugo é quem define o tom.
- **Contra:** o Zomboid tem 26 moodles porque **a simulação é o jogo dele**.
  Neste jogo, o combate é o jogo. A crítica mais afiada que a pesquisa achou:
  *"medidores de fome não medem fome — medem o tempo que falta pra você morrer
  de fome"*, e quando o jogador vê quanto tempo tem, o sistema degenera em
  aritmética de manter o medidor acima da linha. Relatos consistentes de gente
  desligando o jogo em meia hora: *"não é difícil, só é tedioso"*.

**O filtro proposto, que serve pros dois lados:** um moodle vale a pena se
**muda uma decisão que o jogador já ia tomar**. Se só adiciona uma tarefa antes
da decisão, é imposto.

### O que a pesquisa aprova, com nota

| Moodle | Veredito |
|---|---|
| **Fome** ✅ já existe | Muda "sigo explorando ou volto pra vila". Casa com a economia de derrota |
| **Sono** ✅ já existe | Idem, e amarra na fogueira, que já é o checkpoint |
| **Peso / Sobrecarregado** ⭐ | **A recomendação nº 1.** Já existe mochila em grade E derrota que confisca itens — peso transforma "quanto eu carrego" numa aposta de verdade: carregar mais = perder mais quando cair. Nenhum outro moodle amarra tanta coisa que já existe |
| **Ferido / Machucado** ⭐ | Faz a ponte entre "levei dano" e "vale a pena ir ao Hospital agora", que é o prédio-âncora |
| **Bem alimentado / Descansado** ⭐ (positivo) | Dá razão **positiva** pra voltar à vila, não só medo. Barato, e muda o humor do sistema inteiro |
| Sede | ❌ É fome de novo, com o dobro da manutenção e nenhuma decisão nova. Campeão das reclamações de tédio |
| Frio/molhado | ❌ Já cortado no CLAUDE.md pelo argumento certo. Se um dia voltar, o modelo BotW é o barato: clima drena vida numa região, resolvido por item equipado, sem medidor |
| Sanidade | ❌ Genial no Don't Starve porque *distorce a apresentação do mundo* — exige shader, som alternativo e criaturas próprias. Sem isso vira só mais uma barra |
| Tédio / Estresse / Infelicidade | ❌ Fazem sentido num jogo de ficar trancado em casa por semanas. Num RPG que se atravessa explorando, é ruído |

### Moodle × combate: o erro a evitar num sistema de d20

**Não aplicar penalidade direto no d20.** Um −1 no d20 é −5% em toda rolagem,
sentido como "o jogo está me sacaneando", e — pior — **é invisível**: o jogador
rola 11 contra ND 12 e não tem como saber se a fome foi a culpada. Frustração
sem aprendizado.

Três alternativas melhores, todas conversando com sistemas que já existem:

1. **Mexer nas bordas, não no meio.** Com moodle crítico, **"falha perto" deixa
   de existir** — o que seria falha perto vira falha limpa. O jogador não perde
   chance de acertar; perde a rede de segurança. Peso sem sensação de roubo.
2. **Penalizar fora da rolagem, do jeito Zomboid.** Fome crítica → −1 slot de
   mochila; sono crítico → o herói age depois na iniciativa. Nenhum toca no
   d20, os dois são **visíveis** (vê-se o slot bloqueado, vê-se a posição na
   trilha de iniciativa), e os dois pesam de verdade.
3. **Dizer em voz alta quando penalizar.** Uma linha no log: *"Faminto: −1"*.
   Converte penalidade invisível em regra aprendida.

Observação: hoje o jogo faz −1 em atributos quando crítico, que é a opção que a
pesquisa desaconselha. A regra "fome e sono nunca empilham" (CLAUDE.md) já
protege do pior caso, e vale mantê-la religiosamente.

### Como não virar tarefa chata

- **Escala de tempo generosa.** Se o jogador precisa parar pra comer mais de
  uma vez por expedição, virou tarefa. O moodle deve dizer "hora de voltar",
  nunca "hora de abrir a mochila de novo".
- **Curar junto com o que o jogador já ia fazer.** A fogueira já é onde se
  salva e descansa — se dormir nela zerar sono *e* fome de uma vez, a
  manutenção some dentro de um ato que já tinha valor. O Zomboid não tem essa
  sorte; este jogo tem.
- **O modelo Valheim, registrado como alternativa não adotada:** em vez de
  "faminto: −1 em tudo", **"bem alimentado: +1 em tudo"**, e a fome é a
  ausência do buff. Numericamente idêntico; psicologicamente é recompensa em
  vez de punição. **Isto contradiz o tom seco declarado** — fica registrado
  como decisão consciente possível, não como recomendação.

### Como mostrar: decisão do Hugo, 2026-09-06

**Os moodles ganham ícone na tela**, com mais informação ao tocar, e aparecem
**também na Ficha**. Isso é o modelo Zomboid quase exato, e mantém a separação
que o jogo já tem — HUD é o lugar do alerta, aba EU da Ficha é o lugar do
detalhe. Detalhes que a pesquisa acrescenta:

- **Canto fixo, ícones empilhados, nada escrito na tela.** O nome do estágio e
  a cura aparecem **ao tocar no ícone** (o equivalente de toque pro hover do
  Zomboid), numa tarja curta: "Faminto — coma alguma coisa".
- **O nível 1 aparece, mas apagado.** Cor forte só no nível que penaliza. O
  jogador aprende a diferença sem ninguém explicar.
- **Escada de 3 degraus, não 4** (mais legível em pixel art): *(nada)* →
  **Fominha** → **Faminto** (este penaliza). Sono: *(nada)* → **Sonolento** →
  **Exausto**.
- **Animar a transição de estágio uma vez** — um pulso quando piora, e nada
  depois. Ícone piscando eternamente é o que faz gente odiar HUD de
  sobrevivência.
- Os ícones entram pela família nova de vetor recolorido (game-icons.net), que
  o `CLAUDE.md` já abriu como exceção só pra ícone.

### Cortes propostos

- **`1.8.0` — Peso / Sobrecarregado.** O que mais amarra sistemas existentes.
- **`1.8.1` — Ferido**, ligado ao Hospital.
- **`1.8.2` — Bem alimentado / Descansado** (o moodle positivo).
- **`1.8.3` — ícones de moodle no HUD**, com detalhe ao toque, e a mesma
  informação na aba EU da Ficha. Decisão do Hugo.
- **`1.8.4` — a fogueira cura fome e sono de uma vez**, e o primeiro estágio
  de todo moodle nunca pune.
- **`1.8.5` — a forma de penalizar.** Ver a decisão pendente na seção 7 — hoje
  o jogo faz −1 em atributo, que a pesquisa desaconselha por ser invisível.

---

## 5. O visual — e por que os quatro incômodos podem ter uma causa só

O Hugo marcou os quatro: herói/personagens, ícones, cenário e interface.

**`docs/estudo-de-resolucao.md` já respondeu parte disso, e a resposta é
contra-intuitiva:** para o cenário, **resolução não é o problema principal**.

> - a copa da árvore é um blob de 2 tons — **falta de rampa, não de pixel**;
> - a casa é um retângulo e um triângulo, sem beiral, sem espessura, sem
>   sombra projetada;
> - os tiles são **ruído, não textura** — dithering aleatório que "de longe lê
>   como chiado de TV";
> - **não existe tile de transição.** A grama encontra a terra num corte reto
>   de 16 px. **"Essa é a maior fonte isolada do aspecto simples", e não custa
>   resolução nenhuma.**

A ordem que o estudo recomenda é **transição e rampa primeiro, resolução
depois** — as duas primeiras melhoram o jogo hoje, em 16 px, e continuam
valendo quando a arte crescer.

O Hugo decidiu ir pra 48 (seção 0, item 3), o que é compatível: o barato entra
antes e não é jogado fora.

### Duas consequências não-negociáveis dos 48, segundo o estudo

1. **A rampa de cor cresce de 3 para 5 tons por material.** "Isso é metade do
   ganho, e não custa resolução nenhuma — custa `arte/paleta.py`."
2. **Os três níveis de visão viram dois.** Em escala 1 o canvas é a janela,
   então "perto" só existe como escala 2. O estudo nota que isso já é a
   realidade prática hoje: "o menu promete três e entrega dois".

### A interface: os quatro problemas de uma vez

O Hugo marcou genérica + poluída + difícil no toque + inconsistente. Vale
notar que **inconsistente e genérica costumam ter a mesma raiz** — falta de um
sistema aplicado de verdade — e o projeto já tem a ferramenta (`caixa()` e
`pilha()` em `sistemas/design.ts`, mais `npm run auditar`). Ou seja: o
mecanismo existe e o problema é aplicação, não ausência.

Sobre toque, a pesquisa dá números concretos: **alvo mínimo 44 pt (iOS) / 48 dp
(Material)**, e a Larian, portando DOS:2 pro iPad, teve de **redimensionar cada
elemento da interface de PC** porque "um dedo não tem a precisão do cursor".
Também moveu toda informação de hover para **toque longo** — padrão que vale
adotar: toque longo inspeciona, nunca age.

### Cortes propostos

- **`1.9.0` — tiles de transição.** Grama↔terra, terra↔areia, etc. O estudo
  chama de "a maior fonte isolada do aspecto simples". Não custa resolução.
- **`1.9.1` — rampa de 3 para 5 tons** em `arte/paleta.py`. "Metade do ganho."
- **`1.9.2` — sombra projetada e volume** nos objetos: beiral na casa,
  espessura na parede, sombra no chão.
- **`1.9.3` — tiles com textura em vez de ruído:** tufo de grama com direção,
  forma na pedra, veio na terra.
- **`2.5.0` — a virada pra 48.** Fase própria, porque é grande: reescrever os
  arquivos de desenho, e os três níveis de visão viram dois.
- **`1.9.4` — auditoria de alvo de toque:** todo alvo tocável com no mínimo
  44 pt, e toque longo inspeciona em vez de agir.
- **`1.9.5` — passar o design system em todas as telas**, pra matar a
  inconsistência com a ferramenta que já existe.

---

## 6. Cenários novos

O Hugo quer **muito mais lugares** — Portomares, Fornalha, Altacoruja, além
dos três da aventura 1.

**Isto é o item de maior risco de escopo do documento inteiro**, e vale dizer
por quê sem rodeio: o `CLAUDE.md` é explícito que "o jogo inteiro são três
aventuras, oito lugares... isso é muito trabalho", e que o jeito de chegar lá é
"uma fase de cada vez, cada uma jogável de ponta a ponta, e não um esqueleto de
tudo ao mesmo tempo". O roadmap existente reforça: "uma aventura excelente vale
mais que três esboçadas".

Nada disso impede fazer mais lugares — mas a ordem importa, e a decisão sobre
ordem ainda não foi tomada (ver seção 7).

Um caminho intermediário que a pesquisa e o próprio roadmap sugerem, e que dá
mundo denso sem mapa novo gigante: **interiores**. Entrar em prédio é mecanismo
novo que ainda não existe (só a Casa de Cura/Casa da Vovó Aurora tem esboço,
nunca implementado), e `docs/14-casa-de-cura.md` já recomenda nascer como
**template genérico** — piso, parede, porta, janela num grid padrão — "porque o
roadmap vai querer reusar para loja, ferraria e torre depois".

### Cortes propostos

- **`2.0.0`** (já no roadmap) — sistema de transição de mapa reaproveitável.
  **Pré-requisito de tudo nesta seção.**
- **`1.10.0` — o template genérico de interior.** Um cômodo, reusável.
- **`1.10.1` — os interiores da Vila:** Casa da Vovó Aurora, Hospital, loja
  do Seu Cominho. Densidade sem mapa novo.
- **Fases 2, 3, 4** (já no roadmap) — Floresta, Ponte, Caverna.
- **`6.x` — os outros lugares do material de mesa.** Portomares, Fornalha,
  Altacoruja. **Ainda sem número definido**, porque depende da decisão de
  ordem (seção 7).

---

## 7. Decisões que faltam

Nenhuma destas foi tomada. Estão aqui pra virar pergunta, não pra eu resolver
sozinho.

Resolvidas em 2026-09-06 (ver seção 0): quantos moodles, ordem dos lugares,
quando entra a virada pra 48, e como mostrar os moodles. O que sobra:

1. **Como a penalidade de moodle chega no jogador.** Hoje o jogo faz −1 em
   atributo, que a pesquisa desaconselha por dois motivos: um −1 no d20 é −5%
   em toda rolagem, e **é invisível** — o jogador rola 11 contra ND 12 e não
   tem como saber se a fome foi a culpada. Três caminhos, todos compatíveis
   com os ícones de HUD já decididos:
   - **penalidade estrutural visível** (fome crítica tranca 1 slot da mochila;
     sono crítico faz o herói agir depois na iniciativa) — nenhuma toca na
     chance de acertar, e o jogador vê acontecer;
   - **tirar a rede de segurança** (com moodle crítico, "falha perto" deixa de
     existir e vira falha limpa) — não perde chance, perde o amortecedor;
   - **manter o −1 e anunciar no log** ("Faminto: −1" na hora da rolagem) —
     menor mudança de código, converte castigo invisível em regra aprendida.
2. **Punição ou recompensa?** O modelo Valheim (bônus em vez de castigo) custa
   zero linhas a mais e é, na literatura, o que separa sistemas de
   sobrevivência elogiados dos odiados — mas contradiz o tom seco declarado.
3. **Fase nova ou renumeração?** Este documento propõe `1.7.x` (armas),
   `1.8.x` (moodles), `1.9.x` (visual) e `1.10.x` (interiores) — quatro faixas
   novas dentro da "Fase 1". Pode ser que mereçam ser uma Fase 1.7 "o jogo
   ganha corpo" única, em vez de quatro faixas paralelas.
4. **Por onde começar de verdade.** A prioridade nº 1 declarada é o toast de
   missão (`1.2.4`), e a ordem pedida é "misturada" — um item pendente da
   Fase 1 por vez, junto com o novo. Falta escolher qual item da Fase 1 vai
   junto: o modo de alvo (`1.0.1`) ou comer/dormir encher vida (`1.0.2`).
