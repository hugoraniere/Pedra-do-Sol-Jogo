---
name: frentes
description: O registro das frentes de trabalho paralelas do Reino de Aurora. Use SEMPRE ao comecar uma tarefa nesta pasta, antes de editar o primeiro arquivo, e de novo ao terminar. Diz quem esta mexendo em que agora, o que ja foi entregue, e o que uma frente esta esperando da outra. Tambem use quando precisar de algo que pertence a outra frente, quando quiser saber por que um arquivo esta como esta, ou quando o usuario perguntar o que esta acontecendo no projeto. Cobre tambem `ESTADO-DO-JOGO.md`, o resumo condensado (nome do jogo, sistema de dado, atributos) que toda sessao le ANTES do CLAUDE.md da propria pasta.
---

# As frentes de trabalho

O Reino de Aurora e trabalhado em varias pastas ao mesmo tempo, uma por frente,
cada uma um worktree com galho proprio. Cada pasta tem um `AMBIENTE.md` que diz
de quais arquivos ela cuida.

O problema que esta skill resolve: **as conversas nao se enxergam**. Duas frentes
mexendo no mesmo arquivo, ou uma esperando algo que ninguem esta fazendo, so
aparece na hora do merge, quando ja custa caro. Ja aconteceu neste projeto: um
historico reescrito levou tres worktrees embora e o trabalho de uma frente ficou
numa pasta orfa.

## Onde fica o registro

Um arquivo so, fora do git, na pasta principal. Fora do git de proposito: se
fosse versionado, cada worktree teria a sua copia e as frentes so se veriam
depois do merge, que e exatamente tarde demais.

O caminho nao se escreve na mao. Descubra assim, de qualquer pasta:

```bash
REGISTRO="$(dirname "$(git rev-parse --git-common-dir)")/FRENTES.md"
```

Se `FRENTES.md` nao existir, crie com o modelo que esta no fim deste arquivo.

## `ESTADO-DO-JOGO.md`, o resumo de uma tela

Mesma pasta, mesmo mecanismo (fora do git, resolvido pelo mesmo
`git rev-parse --git-common-dir`), mas **outro papel**: `FRENTES.md` e o
historico (cresce por `Entregue`, nunca apaga); `ESTADO-DO-JOGO.md` e o
retrato de AGORA (nome do jogo, sistema de dado, atributos, e o que ja foi
DECIDIDO mas ainda nao chegou em toda branch) — cada secao e **sobrescrita**,
nunca acrescentada. Nasceu de um caso real: uma decisao inteira (o jogo virou
1d20, 5 atributos, novo nome) ficou 1 dia inteira presa numa branch, invisivel
pra quem trabalhava em `principal` no mesmo periodo, porque `CLAUDE.md` so
existe dentro do git — uma copia por branch, sem ninguem avisando as outras.

**Leia-o ANTES do `CLAUDE.md` da sua propria pasta**, toda vez. Se os dois
contradisserem, `ESTADO-DO-JOGO.md` ganha: sua pasta esta atras de uma decisao
tomada em outro lugar.

**Termine uma entrega que mudou nome do jogo, sistema de dado/teste, lista de
atributos, ou a propria relacao com a referencia da mesa? Reescreva a secao
certa em `ESTADO-DO-JOGO.md` antes de sair** — alem de registrar em
`FRENTES.md` como sempre. Detalhe de implementacao (uma funcao nova, um
arquivo que mudou) fica so em `FRENTES.md`; `ESTADO-DO-JOGO.md` e so pros
poucos fatos que mudam o que TODA frente presume sobre o jogo.

## O que fazer, e quando

**1. Ao comecar qualquer tarefa, antes de editar o primeiro arquivo.**

Leia `ESTADO-DO-JOGO.md` primeiro, depois o registro inteiro de `FRENTES.md`.
Depois escreva a sua entrada em `## Acontecendo agora`:
o galho, a pasta, o que voce vai fazer e **quais arquivos voce vai tocar**. A
lista de arquivos e a parte que importa: e ela que deixa outra conversa descobrir
a colisao antes de acontecer.

Se um arquivo que voce precisa ja esta na lista de outra frente, **pare e fale
com o Hugo** em vez de editar. Diga qual frente esta com ele e ofereca as saidas:
esperar, pedir para a outra frente fazer, ou combinar de dividir o arquivo.

**2. Quando precisar de algo que e de outra frente.**

Escreva em `## Pedidos entre frentes`, dizendo quem pede, para quem, o que, e por
que esta bloqueado ou nao. Um pedido bem escrito diz o suficiente para a outra
frente agir sem ler esta conversa.

**3. Ao terminar, ou ao parar no meio.**

Mova a sua entrada de `Acontecendo agora` para `## Entregue`, com uma linha do que
mudou e o commit. Se parou no meio, deixe em `Acontecendo agora` dizendo onde
parou. Uma entrada velha em `Acontecendo agora` e pior que nenhuma: ela faz outra
frente desviar de um arquivo que ja esta livre.

**4. Ao encontrar trabalho que nao e seu.**

Nao amplie o seu escopo. Escreva em `## Achados` o que voce viu, com o suficiente
para alguem agir: onde esta, como reproduzir, e por que importa. E o mesmo
criterio de abrir uma tarefa separada.

## Regras que vieram de erro real

- **Nao apague arquivo sem perguntar.** Nem arquivo gerado. Se algo precisa
  sair, mostre a lista e deixe o Hugo decidir.
- **Commite cedo, no galho da frente.** Trabalho que existe so no disco de uma
  pasta se perde quando o historico muda embaixo. Commit no galho proprio nao
  atrapalha ninguem.
- **Acrescente no fim, nunca reorganize** arquivos que todas as frentes querem:
  `config.ts`, `estado.ts`, `dialogos.ts`, `package.json`. Duas linhas novas em
  pontos diferentes o git junta sozinho; um arquivo reordenado, nao.
- **Uma frente por vez mexe em `arte/` e `public/assets`.** A geracao e
  deterministica: se duas regerarem, dezenas de PNG aparecem mudados e ninguem
  sabe o que e desenho novo.

## O modelo do arquivo

```markdown
# Frentes do Reino de Aurora

Registro vivo. Leia antes de editar; escreva antes de sair.

## Acontecendo agora

### <galho> . <pasta>
- **fazendo:** <uma frase>
- **arquivos:** <lista, os que vao ser editados>
- **desde:** <data>

## Pedidos entre frentes

- **<de> -> <para>:** <o que precisa e por que>

## Achados

- **<onde>:** <o que e, como reproduzir>

## Entregue

- **<data> . <galho>:** <o que mudou> (`<commit>`)
```
