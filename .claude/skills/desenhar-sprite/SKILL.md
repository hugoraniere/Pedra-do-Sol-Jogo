---
name: desenhar-sprite
description: Como desenhar e animar pixel art no Reino de Aurora - personagens, bichos, armas, tiles e cenario. Use sempre que o trabalho tocar em arte/*.py, em public/assets, ou quando alguem falar em sprite, boneco, monstro, goblin, aranha, tile, tileset, arma, animacao, caminhada, ciclo de passo, silhueta, contorno, paleta, resolucao ou "esta feio / sem detalhe / estranho" sobre qualquer coisa que aparece na tela do jogo. Use tambem antes de mexer em arte/paleta.py, arte/pessoa.py, arte/goblin.py, arte/tiles.py ou arte/mundo.py, mesmo que o pedido pareca uma mudanca pequena de uma linha.
---

# Desenhar sprite no Reino de Aurora

Este arquivo e a memoria de erros que ja custaram caro. Quase toda regra aqui
nasceu de um desenho que pareceu certo no codigo e estava errado na tela.

## A regra que vale mais que todas as outras

**Voce nao sabe se um sprite esta bom ate olhar para ele ampliado.**

Ler o codigo de desenho nao serve. A funcao pode estar limpa, comentada e
coerente, e produzir uma mancha. Toda vez que alguem pulou o olhar, entregou
lixo com confianca.

O laco e sempre este, e nao tem atalho:

```
escrever a funcao  ->  gerar  ->  OLHAR AMPLIADO  ->  consertar  ->  olhar de novo
```

Espere iterar duas ou tres vezes. Isso e normal e nao e sinal de incompetencia:
e como pixel art funciona. O que **nao** e normal e escrever a funcao, achar
bonita e declarar pronto.

Use o script que vem junto:

```bash
python3 .claude/skills/desenhar-sprite/scripts/olhar.py public/assets/goblin-magricela.png --linha 0 --quadros 0,1,2
```

Ele monta os quadros lado a lado sobre o fundo do jogo, amplia, e ainda mostra
uma tira no **tamanho fisico real**. Depois abra o PNG que ele escreveu com a
ferramenta de leitura de arquivo e olhe de verdade. `--ajuda` lista as opcoes.

## Olhe no contexto certo, senao a imagem mente

Um sprite julgado fora do contexto leva a conclusao errada, e a conclusao errada
vira uma "correcao" que piora tudo.

- **Vestido, nao nu.** Um braco cor de pele em cima de um tronco cor de pele nao
  tem contraste nenhum. Julgando nu, a conclusao facil e "o braco sumiu, joga
  ele mais para fora" — e nasce um braco flutuando ao lado do corpo. No jogo o
  tronco esta sempre coberto pela roupa e o braco vai por cima dela.
- **Sobre o fundo do jogo**, nao sobre transparencia nem sobre branco. O que
  separa o personagem do chao e o contorno, e sobre xadrez de transparencia ele
  parece resolvido quando nao esta.
- **No tamanho fisico real, tambem.** Um detalhe que so existe a 12x nao existe.

## A ordem em que as coisas decidem

Quando algo nao le, conserte nesta ordem. Detalhe quase nunca e a resposta.

1. **Silhueta.** A forma recortada, sem cor nenhuma. Se duas coisas tem a mesma
   silhueta, elas sao a mesma coisa para o jogador. Uma barra vertical de 3 px e
   uma barra vertical de 3 px, seja espada, cajado ou funda.
2. **Tom.** Claro contra escuro. Sobrevive a qualquer distancia e e o que diz
   profundidade.
3. **Detalhe interno.** Luxo de perto. Nunca pode carregar informacao que o
   jogador precisa.

**O orcamento:** um pixel logico vira 2 px de tela nas visoes mais distantes. O
que precisa ser lido de longe cabe em 2 px e mora na silhueta ou no tom. Detalhe
de 1 px dentro do desenho e enfeite, nunca informacao.

## As regras que ja custaram caro

**Profundidade e tom, nao posicao.** O que esta atras sai num tom bem mais
escuro — perto do contorno, nao um tom de pele escura. Pele escura fica perto
demais de pele clara e o olho le duas coisas irmas lado a lado em vez de uma
atras da outra.

**O que esta atras nao compete.** Membro de tras vai chapado, sem detalhe
interno, e as vezes so espiando 1 px. Desenhado inteiro e com o mesmo cuidado do
da frente, ele vira uma mancha escura que le como mochila, nao como braco.

**O membro nasce colado no corpo.** Braco desenhado solto na frente da barriga
nao parece braco, parece bengala. Ele sai do ombro encostado e so afasta do
cotovelo para baixo.

**A mao e um degrau na silhueta.** Braco de N px, um pulso de 1 px em tom de
sombra, e a mao 1 px mais larga que o braco. O degrau e o pulso sao a mao; sem
eles o braco termina cego e o personagem tem cotos. O degrau aponta para fora do
corpo de frente, e para a frente no perfil.

**Organico e cada linha ter largura diferente da de cima.** Nao e curva suave. O
que faz um bicho parecer bicho e a cabeca em cunha, o tronco em barril e a perna
arqueada — tudo que hoje e `ret()` de lado reto le como caixa empilhada.

**Largura de 2 px vira contorno puro.** Com 2 px de largura, o selout come as
duas colunas e sobra so borda escura. E por isso que as pernas finas do jogo
parecem gravetos. Membro que precisa ser visto comeca em 3 px.

**Contorno uma vez so.** Rodar `contorno_seletivo()` duas vezes desenha contorno
em volta do contorno e engorda a silhueta em 2 px de escuro. Se o desenho ficou
pesado e emborrachado, e quase sempre isso. Peca acessoria (arma, adereco) entra
**antes** da passada de contorno.

**Nada por cima do rosto num quadro pequeno.** Uma lamina erguida por cima da
cabeca passa por dentro da cara e o quadro deixa de ler. Arme o golpe para tras,
onde a arma fica sozinha contra o fundo.

**Ordem de desenho carrega significado.** O que esta atras vai primeiro. E o
mesmo objeto muda de camada com a direcao: uma arma nas costas fica atras do
corpo de frente (so o punho espia) e na frente do corpo de costas (aparece
inteira). Uma arma na mao faz o contrario. Se a peca atravessa o peito ou o
rosto, ela esta na camada errada, nao na posicao errada.

**A cabeca nao deixa ceu.** Num quadro pequeno a cabeca ocupa quase toda a
largura. Nao ha espaco acima do ombro para punho, adereco ou copa de chapeu —
essas coisas moram **ao lado** do ombro.

## Animacao

**Passo e posicao, nao comprimento.** Se a perna cresce e encolhe, isso nao e um
passo: e uma perna esticando. O passo move a perna no eixo do movimento.

**O corpo desce quando as pernas abrem.** Pernas juntas (quadro de passagem) e o
ponto mais alto; pernas abertas (quadro de contato) e o mais baixo. O contrario
disso e o erro mais comum, e ele faz a caminhada parecer um tremor.

**Bob variavel, nao senoide.** Movimento constante le como robo. Segure mais
tempo os quadros das pontas do movimento que os do meio.

**O braco vai ao contrario da perna do mesmo lado.** E o que separa "andar" de
"marchar como boneco de corda".

**De perfil o braco balanca em X; de frente, em Y.** De frente o balanco vai na
direcao da camera e so 1 px sobra para ver. De lado ele vai para a frente e para
tras, no eixo do movimento.

**No perfil, uma perna atras da outra.** Nao lado a lado. Elas ocupam a mesma
faixa de x quando juntas, e se afastam no passo. E o tom que diz qual esta
atras.

**Telegrafo antes do golpe.** Todo ataque tem um quadro de preparacao. Sem ele o
combate vira reflexo. E o telegrafo de cada bicho deve ser diferente — e assim
que o jogador aprende o bestiario.

## As regras do projeto que nao se negociam

Estao no `CLAUDE.md` e valem aqui inteiras:

- **Nada de arte solta.** Todo pixel sai de `arte/*.py` e de `npm run arte`.
  Nunca cole um PNG na mao em `public/assets` — ele e apagado na proxima
  geracao. Desenho a mao entra por `arte/sprites/`.
- **Nada de cor solta.** Toda cor vem de `arte/paleta.py`. Se voce escreveu uma
  tupla RGB dentro de uma funcao de desenho, ela ja divergiu da paleta.
- **Nenhuma coordenada de encaixe na mao.** Onde fica a mao sai de
  `arte/pessoa.py` para `public/assets/encaixes.json`, e o jogo le de la.
  Coordenada copiada para dentro de um `.ts` diverge na primeira mexida no
  braco.
- **Nenhuma arvore na mao.** Mata e pedraria saem do desenho do chao em texto,
  plantadas por funcao com variacao estavel pela posicao.
- **Portugues em tudo**, sem acento em identificador, com acento em texto de
  tela.

## Esboce fora de producao

Proposta de mudanca grande vira esboco em `ferramentas/esbocar-*.py`, que
escreve em `docs/referencia/`. Nunca em `public/assets`. O esboco existe para ser
olhado e discutido, e morre quando a proposta virar codigo em `arte/`.

Isso permite comparar hoje contra proposto na mesma imagem, que e a unica forma
honesta de discutir arte. Quando comparar resolucoes diferentes, **amplie a
menor com vizinho mais proximo ate o mesmo tamanho fisico** — senao a comparacao
so mostra que uma imagem e maior que a outra.

## Antes de dizer que terminou

```bash
npm run arte        # regera public/assets
npm run build       # tipos
npm run verificar   # paleta, listas, falas, PNG solto
npm run contraste   # razao de contraste de cada par que se encosta
npm run auditar     # sobreposicao e transbordo de UI
npm run conferir    # as 25 combinacoes de raca e classe
npm run folha       # monta ferramentas/telas/personagens.png
```

Os cinco verificadores tem que sair com zero problemas. E **olhe**
`ferramentas/telas/personagens.png` e os screenshots de `ferramentas/telas/`:
um braco novo desencaixa alguma arma em alguma das 25 combinacoes, e a folha e
onde isso aparece.

Se um verificador acusar algo que voce nao mexeu, cheque se outra frente de
trabalho mexeu na arvore antes de assumir a culpa — e antes de "consertar" o que
nao e seu.

## Onde esta o resto

Os estudos em `docs/` tem o diagnostico detalhado e as propostas por assunto.
Leia o que for do seu assunto antes de mexer:

| arquivo | assunto |
|---|---|
| `docs/08-guia-de-sprites.md` | o contrato: grade da folha, camadas, referencias |
| `docs/estudo-de-sprites.md` | o desenho de um quadro: perfil, maos |
| `docs/estudo-de-animacao.md` | movimento, combate, e como a arma e segurada |
| `docs/estudo-de-bichos-e-armas.md` | armas, monstros, e o orcamento de leitura |
| `docs/estudo-de-resolucao.md` | o tamanho do pixel, e o que ele custa |
