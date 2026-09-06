# Plano de melhorias visuais

Junta os cinco estudos (`docs/estudo-de-sprites.md`, `estudo-de-animacao.md`,
`estudo-de-bichos-e-armas.md`, `estudo-de-resolucao.md`, `estudo-de-cenario.md`)
numa lista so: o que ja esta pronto, onde cada coisa mora, e o que falta, em
ordem de fazer.

Isto e Fase 1.5 do `docs/05-roadmap.md`, "sprites e animacao . FEITO EM PARTE".
Este documento e o detalhe de "em parte".

---

## 0. Resolvido: o chao unificado

`arte/tiles.py` desta pasta agora tem as tres coisas juntas: o chao por tufo
(grama, terra, caminho, areia, pedra, chao-caverna), os 6 tiles da Floresta
dos Sussurros (`mata`, `folhagem`, `trilha`, `agua-rasa`, `barranco`,
`grama-mata`, preservados **sem mudar uma linha** — conferido por diff), e as
8 beiras (`T.beiraN`...`T.beiraSL`). `T` em `config.ts` continua com 28
indices, agora todos com o chao que deveriam ter.

O `ambiente/sprites` **nao foi trazido por merge de git**: as 8 funcoes de tile
(`_ancoras`, `_tufo_grama`, `grama`, `grama_alta`, `_seixo`, `_rachadura`,
`terra`, `caminho`, `areia`, `pedra`, `chao_caverna`) foram reescritas direto
nesta pasta a partir da versao testada de la, que era a opcao mais barata (a
alternativa era reconciliar duas listas de `TILES` com indices diferentes).
`ambiente/sprites/arte/tiles.py` fica **desatualizado a partir de agora** para
fins de chao: quem for portar dali outra coisa (mao, perfil, passo — secao 1.2)
nao deve tocar em `tiles.py` daquela pasta.

Verificado: `npm run build`, `verificar` (0 erros), `conferir` (25
combinacoes) e `contraste` passam; o tileset gerado bate pixel a pixel com o
esboco (comparado lado a lado); e rodando o jogo de verdade — grama nova e
beira convivendo na mesma tela, sem erro no console.

---

## 1. Pronto e verificado

### 1.1 Em producao, nesta pasta

**Beiras de grama.** `arte/tiles.py` (8 tiles novos), `src/dados/config.ts`
(`T.beiraN`...`T.beiraSL`), `src/dados/mapas.ts` (`bordasDeGrama`),
`src/cenas/Mundo.ts` (segunda camada de tilemap, profundidade -999). A grama
avanca sobre caminho, terra, areia e agua com o mesmo conjunto de 8 desenhos.
Testado no jogo rodando: sem corte reto, sem erro no console.

### 1.2 Em `ambiente/sprites`, esperando portar

**Correcao de 2026-09-06: as tres pecas abaixo (maos, perfil, ciclo de
caminhada) ja foram portadas pra pasta principal - "esperando portar" nao
vale mais.** `arte/pessoa.py` ja trata o perfil como corpo mais fino com uma
orelha so e ja desenha a mao com o degrau de silhueta descrito aqui;
`arte/base.py` (`deslocamento()`) ja implementa "passada e posicao, nao
comprimento" quase palavra por palavra. Nao tente portar de `ambiente/
sprites` de novo - arriscaria sobrescrever a versao atual com uma copia
desatualizada da outra worktree.

Independentes do chao — a resolucao da secao 0 nao afeta nenhum destes.

**As maos**, em `bracos()`: braco, pulso em sombra, mao 1 px mais larga. Vale
para as quatro vistas do heroi de uma vez.

**O perfil de verdade**, em `corpo()`: tronco 2 px mais fino, uma orelha so (a
do lado da nuca), as duas pernas na mesma faixa de x com a de tras em tom de
sombra, pe virado para o lado.

**O ciclo de caminhada**, em `deslocamento()` (`arte/base.py`): a passada e
posicao no eixo do movimento, nao mais soma na altura da perna. O braco vai ao
contrario da perna do mesmo lado. Vale para heroi, 5 racas, 10 NPCs e os 4
goblins, porque os tres leem a mesma tabela.

**A arvore por moitas**, em `arte/mundo.py`: borda recortada, sombra e brilho
na borda de cada moita (nao no meio), 5 tons em vez de 3, galho ligando tronco
e copa. Cinco variantes em vez de duas (`arvore`, `arvore-2`, `arvore-3`,
`arvore-escura`, `arvore-escura-2`) — as tres novas estao desenhadas mas **nao
registradas** em `config.ts`/plantio, e o `verificar` ja avisa disso.

**O chao por tufo** ja esta em producao (secao 0): grama (touceira com pe em
sombra), terra (seixo em L, 4 rotacoes), caminho (seixo + mancha de desgaste),
areia (ondulacao horizontal), pedra (blocos angulares soltos, nao mais faixas
que viravam chevron).

### 1.3 Ferramentas e skill

**`ferramentas/esbocar-sprites.py`**, **`esbocar-resolucao.py`**,
**`esbocar-cenario.py`** (em `ambiente/sprites`): escrevem em
`docs/referencia/`, nunca em `public/assets`. Continuam validos como bancada de
prova para o que falta.

**A skill `desenhar-sprite`** (`.claude/skills/desenhar-sprite/`), com o script
`scripts/olhar.py`: compoe camadas, recorta quadros, mostra ampliado e no
tamanho fisico real lado a lado. Escrita a partir dos erros desta sessao —
ainda nao foi exercida numa sessao nova.

---

## 2. Desenhado em esboco, nao portado para producao

**As tres armas**: espada com guarda de 5 px e cruz, arco curvo com corda,
funda em Y com bolsa. Hoje sao barras verticais de 3 px que nao se distinguem
por silhueta. Martelo e cajado ja leem e ficam como estao.

**O goblin organico**: rosto refeito (cunha, olho com estrutura, nariz que
fura a silhueta), mas **o corpo so melhorou, nao convergiu** — perna e pe
ficaram finos, a proporcao pesa para a cabeca. Precisa de mais uma ou duas
rodadas de esboco antes de portar.

**As poses de combate** (`prepara`, `golpe`, `guardada`) e **a arma nas
costas** com ordem de desenho invertida por vista: existem como desenho e como
regra escrita, mas **nenhuma linha de codigo em `arte/pessoa.py` ainda
implementa isso.**

---

## 3. Decisao aberta que trava o resto

`docs/09-plano-de-resolucao-e-contraste.md` recomendava 32 x 64.
`docs/estudo-de-resolucao.md` recomenda **tile 48, personagem 48 x 96, escala
1**, com a conta refeita para computador em primeiro lugar. As duas nao podem
valer ao mesmo tempo, e nenhuma foi decidida.

Isto importa agora porque **as armas (secao 2) e o corpo do goblin (secao 2)
sao exatamente o tipo de trabalho que muda de figura com o dobro de espaco.**
Continuar refinando silhueta em 16 px antes dessa decisao arrisca refazer o
mesmo trabalho duas vezes.

O que **nao** espera pela decisao, porque e estrutural e vale em qualquer
resolucao: maos, perfil, ciclo de caminhada, arvore por moitas, chao por tufo,
beiras. Todos ja levam isso em conta e ja estao na secao 1.

---

## 4. Ainda sem nenhum trabalho

- **Sete das nove criaturas do bestiario** (`lobo.py`, `serpente.py`,
  `espantalho.py`, `bruxa.py`, `cavaleiro.py`, `dragao.py`, `troll.py`, commit
  `4789327`) nunca foram olhadas com as regras desta serie de estudos: tom que
  separa membro, silhueta que sobrevive a 2 px, nada de lado reto. So goblin e
  aranha foram analisados.
- **Quadros de combate de verdade** (`prepara`, `golpe`, `recolhe`, `dano`,
  `caido`, `saca`) — sem eles nao ha telegrafo, e o `src/cenas/Combate.ts` que
  acabou de nascer (commit `791b642`) hoje so usa o quadro parado.
  **Atencao**: aquele commit fala em combate **por turnos**, e
  `docs/modelo-de-combate.md` decidiu **tempo real com o dado resolvendo o
  golpe**. As duas coisas nao sao a mesma, e essa divergencia nao e deste
  documento para resolver — so registro que ela existe, porque muda que
  quadros de arte fazem sentido.
- **A segunda mao** (`maoFraca` em `encaixes.json`): escudo, tocha, arma de
  duas maos. Nada decidido.
- **Correr**: sem ciclo proprio, nao esta no roadmap.
- **NPC em camadas** em vez de achatado: so vale no dia em que um NPC precisar
  trocar de roupa por evento de historia.
- **A rampa de 5 tons na paleta** para casa, arbusto e cerca — so a arvore
  ganhou o tratamento ate agora.

---

## 5. Ordem recomendada

1. ~~Resolver a secao 0~~ **Feito.**
2. **Portar maos, perfil e ciclo de caminhada** para `arte/pessoa.py` e
   `arte/base.py` desta pasta. Estrutural, nao espera a secao 3, e e o que
   mais muda a leitura do heroi por linha escrita.
3. **Registrar as 3 arvores novas** em `config.ts` e no plantio — estao
   desenhadas e paradas.
4. **Decidir a resolucao** (secao 3). Bloqueia armas e goblin.
5. **Refazer as armas e o corpo do goblin** na resolucao escolhida.
6. **Os sete bichos que faltam** (secao 4), com as mesmas regras.
7. **Quadros de combate**, depois de saber se o modelo e tempo real ou por
   turnos — a resposta muda quais quadros fazem sentido.

Cada passo: `npm run arte`, `npm run build`, `npm run verificar`,
`npm run conferir`, `npm run contraste`, e olhar `ferramentas/telas/personagens.png`
de verdade, nao so ler o codigo. E a regra da skill `desenhar-sprite`, e ela
existe porque pular esse olhar ja custou caro nesta sessao mais de uma vez.
