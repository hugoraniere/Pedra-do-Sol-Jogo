# O modelo de combate

**SUPERADO em 2026-09-05 no que diz respeito a tempo real vs turno.** Este
documento descreve tempo real com mira ("Baldur's Gate em top-down"); o
combate de verdade, construido e jogado de ponta a ponta, e **por turnos**
(`Combate.ts`, `sistemas/turnos.ts`). Decisao registrada em `CLAUDE.md`
("Divergencia deliberada: combate fica por turnos") e em
`docs/plano-do-combate.md`, que e quem manda hoje sobre o formato. O resto
deste documento (o dado decide o resultado, os 5 desfechos, ND por acao)
continua valendo — so a moldura de tempo real com mira que ficou pra tras.

Decisao tomada. Este documento e a fonte da verdade do **modelo**: como uma acao
nasce, e mirada e resolvida.

**Sem numero de fase no nome de proposito.** Existe um `docs/11-combate-e-magias.md`
escrito por outra frente de trabalho, com 549 linhas de detalhe. Ele nao foi alterado
e nao deve ser alterado por aqui. A relacao entre os dois esta na secao 6.

---

## 1. A frase

**Baldur's Gate em top-down: o jogador age em tempo real, e o dado decide o
resultado.**

Nao e por turno. Nao e por reflexo. O dedo escolhe **o que** e **onde**; o dado
decide **como saiu**.

Isso substitui duas decisoes antigas que ficaram para tras:

- `docs/01-conceito.md` dizia "nao existe combate por reflexo, a luta e por escolha e
  rolagem". Meio certo: a rolagem manda, mas a acao acontece em tempo real.
- `docs/11-combate-e-magias.md` (secao 2) propunha duas camadas, com a acao do dia a
  dia resolvida **por colisao, sem dado**, e o dado so em cinco ou seis viradas por
  aventura. A colisao deixa de decidir. Quem decide e sempre o dado.

---

## 2. O laco de uma acao

1. **Escolher.** Toque ou clique na habilidade da barra. O mundo entra em modo de
   alvo.
2. **Mirar.** Aparecem tres coisas, sempre as tres:
   - o **anel de alcance** no chao, em volta do heroi;
   - a **previa da area de impacto**, na forma da habilidade, acompanhando o cursor;
   - **quem esta dentro** dela, destacado.
   Fora do alcance, o anel avisa e a confirmacao nao acontece.
3. **Confirmar.** Clique ou segundo toque. O heroi executa o quadro de conjuracao.
4. **Resolver.** O d6 sobe **pequeno e rapido, ao lado do alvo**, sem travar o jogo.
   Tres faixas, as da mesa.
5. **Reagir.** A criatura responde, com o telegrafo de meio segundo antes de todo
   golpe.

Cancelar esta disponivel em qualquer ponto antes do passo 3, sempre.

---

## 3. A regra que faz tempo real e dado caberem juntos

**Revisao de 2026-09-04: o d6 de tres faixas saiu, entrou o d20 contra dificuldade.**
A secao abaixo, ate a proxima linha horizontal, achava que "o sistema de papel cabe
aqui melhor que o d20" - decisao revista de proposito, no mesmo espirito que
`CLAUDE.md` ja registra pra permadeath e pro nome do jogo: o material de mesa e base,
nao camisa de forca, e o Hugo pediu explicitamente algo "mais complexo e rico", com
"sempre chances de algo diferente acontecer" nas BORDAS do resultado, nao so no meio.
O texto historico fica riscado abaixo por transparencia, nao apagado.

~~As tres faixas da mesa resolvem isso, e e por isso que o sistema de papel cabe aqui
melhor que o d20:~~

~~| Dado | Faixa | Na luta |~~
~~|---|---|---|~~
~~| 5 ou + | INCRIVEL | sai como o jogador imaginou, efeito cheio |~~
~~| 3 a 4 | QUASE | sai com um problema: pega de raspao, empurra em vez de queimar, acende a grama junto |~~
~~| 1 a 2 | OPS | acontece outra coisa, nunca "nada aconteceu" |~~

### O sistema novo: 1d20 contra um numero de dificuldade (ND)

```
1d20 + modificador (atributo/sub-atributo + situacao)  vs  ND da acao
```

O ND nao e fixo global - cada acao, cada bicho, cada obstaculo declara o proprio (o
bicho fraco tem ND baixo, o chefe tem ND alto, pular um riacho tem ND baixo, pular um
abismo tem ND alto). Uma rolagem, uma comparacao, cinco desfechos possiveis - a
riqueza mora nas BORDAS do resultado, nunca no meio:

| Resultado | Quando | O que significa |
|---|---|---|
| **Critico de sucesso** | dado natural = 20 | sucede sempre, nao importa o ND - e ganha um efeito extra (dano dobrado, sem custo, revela algo a mais) |
| **Sucesso** | total ≥ ND (sem ser critico) | funciona, limpo |
| **Falha perto** | total < ND, faltou ate 3 pontos | chegou perto o bastante do perigo pra ele reagir - penalizacao especifica daquela acao (nunca generica) |
| **Falha** | total < ND, faltou mais de 3 pontos | nao rolou, sem punicao extra - mas o mundo ainda pode reagir de leve (barulho, tempo perdido), nunca "nada aconteceu" de verdade |
| **Critico de fracasso** | dado natural = 1 | o pior desfecho possivel daquela acao especifica (quebra item, se machuca, alarme, feitico vira contra quem lancou) |

**"Nunca existe erro morto" continua de pe, so que espalhado nos dois lados do
resultado** (critico de sucesso E critico de fracasso), nao concentrado no meio como a
faixa OPS fazia sozinha.

**So o heroi rola - pra tudo, nao so pra atacar.** Isso e a mudanca que menos parece
mudanca e mais muda por baixo: hoje, quando um bicho ataca, e ELE quem rola
(`rolar(b.bonus, this.d6)` em `Combate.ts`) pra saber se acerta o heroi. Isso acaba.
Todo bicho, todo obstaculo, toda porta passa a ter um ND fixo que representa a forca
dele - e e o HEROI quem rola contra esse ND pra Defesa, Esquiva, ou qualquer outro
teste que a situacao pedir. O dado sempre esta na mao de quem joga, nunca do jogo.

**Isto deixa de ser so combate.** Pular um vao, arrombar uma porta, decifrar uma
inscricao, resistir a medo - tudo isso e a MESMA rolagem, o mesmo ND, o mesmo motor de
5 desfechos, so trocando qual atributo entra na conta. Combate para de ser um sistema
a parte: e so o lugar onde essa rolagem acontece com mais frequencia.

---

## 4. Onde o dado aparece grande

Um sistema, duas apresentacoes:

- **Na luta:** dado pequeno, ao lado do alvo, nao bloqueante, meio segundo.
- **Nas viradas:** dado grande, em tela cheia, com o mundo esperando. O pedagio do
  Grulo, convencer o guarda, a virada do Zonzo, o nome verdadeiro de Aurel.

E a mesma rolagem. O que muda e quanto o jogo para para olhar. Isso responde a
preocupacao legitima da secao 2 do `docs/11` (dado em toda paulada vira imposto) sem
precisar de dois sistemas.

**O ataque basico nao rola.** Bater sempre funciona, e a "saida burra" que o `docs/11`
protege na regra 6. O dado entra quando ha chance de acontecer algo interessante:
magia, uso de fraqueza, acao de mundo, virada de historia. E o que segura a cadencia.

---

## 5. A mira

**A gramatica MARCA + ALVO do `docs/11` ja era a especificacao de mira, faltava a
interface.** Cada magia la ja declara forma, alcance, duracao e recarga
(`fogo / projetil / 100px`, `gelo / cone / 40px`, `som-alto / aoRedor / 60px`,
`planta / ponto / 48px`). Isso vira previa direto:

| ALVO | O que se ve ao mirar |
|---|---|
| `eu` | sem mira: aura no proprio heroi, confirma na hora |
| `frente` / `cone` | o cone desenhado no chao, girando com o cursor |
| `projetil` | a linha ate o cursor, e o ponto de impacto |
| `ponto` | circulo posicionavel, preso dentro do anel de alcance |
| `aoRedor` | o circulo em volta do heroi, alcance fixo |

**O tempo desacelera enquanto se mira**, nao para. Mantem o jogo em tempo real,
deixa a mira justa no toque, e le como poder do heroi em vez de menu.

**No mouse:** passar o cursor mostra a previa, clique confirma, Esc cancela.

**No toque:** o dedo tapa o alvo, entao a previa fica **acima do dedo, com
deslocamento**, nunca embaixo dele. Arrastar posiciona, soltar **nao** confirma:
confirma-se num segundo toque ou no botao grande que aparece. Errar de dedo nunca
gasta a magia.

**Modificadores a mostra.** Metade da graca do Baldur's Gate e ver a conta. Aparecem
como palavra curta ao lado do dado, nunca como planilha: `+1 com o item certo`,
`+1 um amigo ajuda`, `-1 dificil`. O jogador nunca precisa somar; ele precisa
**ver por que** deu no que deu.

---

## 6. O que sobrevive do `docs/11`, e o que nao

O `docs/11-combate-e-magias.md` nao foi tocado. Ele continua valendo em quase tudo, e
nada abaixo autoriza edita-lo: a reconciliacao dele com este documento e um passo
proprio, para quem estiver escrevendo aquele arquivo.

**Continua valendo, e e bom:**
- a leitura do bestiario: **fraqueza e conhecimento, nao tipo de dano** (secao 3)
- a gramatica MARCA + ALVO e as treze magias, uma por uma (secoes 4 e 6)
- a tabela de reacoes entre marca e cenario (secao 5)
- os tres comportamentos de criatura (secao 7)
- o telegrafo de meio segundo antes de todo golpe
- os numeros de tato, alcance e recarga (secao 10)
- os contratos novos para o `verificar` (secao 14)
- a lista do que a arte vai precisar (secao 15)

**Nao vale mais:**
- o cabecalho e as sete regras, na parte em que derivam de "o Lele tem 7 anos e nao
  pode perder". O jogo agora e para qualquer pessoa, e da para perder.
- a secao 8 inteira, "Nunca perder". Zero coracoes e **derrota**: o heroi e
  nocauteado, acorda na ultima fogueira acesa e perde o que carregava. Nunca perde o
  que aprendeu.
- a Camada A resolvida por colisao. A colisao posiciona; quem decide o resultado e o
  dado.
- "sem numero na tela", na parte dos modificadores: eles aparecem, como palavra.

---

## 7. O que isso obriga a construir

Alem do que ja estava listado (dado, atributos, coracoes, derrota, fogueira):

1. **Modo de alvo.** Uma maquina de estado pequena: parado -> mirando -> confirmado
   -> resolvendo. Cancelavel, e a unica dona do tempo desacelerado.
2. **Desenho de alcance e area no chao.** Anel, cone, circulo e linha, na paleta, por
   baixo dos personagens e por cima do chao.
3. **Barra de habilidades.** Toque grande, recarga visivel, e o teclado como atalho.
4. **O dado em duas apresentacoes**, pequeno e nao bloqueante, ou grande e em tela
   cheia. Mesma funcao, dois modos.
5. **Alvo por toque com deslocamento**, e confirmacao em dois passos.

Os cinco sao de interface, e nenhum deles existe. E o maior pedaco de UI que o
projeto ja teve, e por isso ele estreia na vila, nao em area nova.

---

## 8. Em aberto

- **Plataforma primeira.** A mira nasceu de mouse e o projeto nasceu de toque. Este
  documento projeta os dois com a mesma informacao na tela, mas se o alvo principal
  virar desktop, a barra de habilidades pode crescer e ganhar mais espaco.
- **O ataque basico nao rola** (secao 4) e a decisao mais discutivel daqui. E o que
  segura a cadencia; se o jogo parecer raso demais, e o primeiro lugar para mexer.
- **Reconciliar o `docs/11`** com este documento, no arquivo dele, por quem o escreve.
