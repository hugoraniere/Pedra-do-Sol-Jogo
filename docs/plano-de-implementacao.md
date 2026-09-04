# Plano de implementacao: passo a passo, com as animacoes dentro

Este documento **substitui a secao 5** de `docs/plano-do-combate.md` (que virou um
indice historico de como a decisao por turnos foi tomada) e detalha, tarefa por
tarefa, o que falta construir. Cada item diz: o arquivo que muda, o numero exato
da animacao quando existe uma, e como confirmar que ficou pronto sem depender de
opiniao.

Formato de cada item:

```
### N. Titulo
Arquivo(s):
Faz:
Animacao:      (quando existir)
Pronto quando: (teste que da pra rodar no ?provador)
Tamanho:       P (menos de 1h) / M (uma tarde) / G (mais de um dia)
```

---

## 0. Onde estamos, em uma tabela

| Camada | Estado |
|---|---|
| laco por turnos, ordem de iniciativa, movimento em casas | **pronto**, rodando no provador |
| dado para os dois lados, cartao compartilhado | **pronto** |
| barra com icones proprios, hover, numero de atalho | **pronto** |
| retratos na trilha de turnos, coracoes do heroi e da criatura | **pronto** |
| comportamento de criatura (passeia / curioso / medroso) | **falta**, so existe "anda ate o heroi e bate" |
| heroi apanhar com telegrafo real e recuperar | parcial: apanha, mas sem invencibilidade nem quadro proprio |
| condicoes (MOLHADO, QUEIMANDO, CONGELADO...) | **falta** |
| superficie no chao (agua, gelo, fogo) | **falta** |
| objeto com estado (tocha, arvore, barril) | **falta** |
| itens da loja como acao | **falta** |
| selos e a tela de escolha a cada 3 | **falta** |
| motor de animacao reutilizavel | **falta**: hoje sao tweens soltos repetidos em `Provador.ts` |
| no jogo de verdade (fora do provador) | **falta**: tudo isso ainda mora so na cena descartavel |

O plano abaixo fecha as linhas "falta", nesta ordem.

---

## FASE 0 . o motor de animacao, antes de tudo o resto

Motivo de vir primeiro: a partir daqui, **toda fase nova precisa de flash, tremor,
squash e texto flutuante**. `Provador.ts` ja tem seis trechos quase iguais disso
espalhados (heroiApanha, atingir, desistir, escolher com erro...). Se cada fase
nova copiar e colar de novo, a cena vira ilegivel antes da metade do plano.
Construir o modulo agora custa uma tarde e paga a divida em todas as fases
seguintes.

### 0.1 `src/sistemas/fx.ts`, o catalogo de efeitos
Arquivo: **novo**, `src/sistemas/fx.ts`
Faz: funcoes puras de efeito, cada uma recebendo a cena e o alvo, sem saber nada
de combate. Nenhuma delas consulta `Provador`, `Bicho` ou `Slot`: assim o mesmo
modulo serve para a criacao de personagem, o mundo normal, e o combate.

```ts
export function flashBranco(cena: Phaser.Scene, alvo: Phaser.GameObjects.Sprite, ms = 70)
export function achatar(cena: Phaser.Scene, alvo: Phaser.GameObjects.GameObject, sx: number, sy: number, ms = 80)
export function agachar(cena: Phaser.Scene, alvo: Phaser.GameObjects.GameObject, ms = 90)
export function empurrar(cena: Phaser.Scene, corpo: Phaser.Physics.Arcade.Body, deX: number, deY: number, forca: number, ms = 160)
export function tremerLeve(cena: Phaser.Scene, alvo: Phaser.GameObjects.GameObject, px: number, vezes: number)
export function textoFlutuante(cena: Phaser.Scene, x: number, y: number, txt: string, cor: number, ms = 420)
export function popIn(cena: Phaser.Scene, alvo: Phaser.GameObjects.GameObject, ms = 140)   // Back.easeOut, usado em pips, estrelinhas, icones de condicao
export function sumirParaCima(cena: Phaser.Scene, alvo: Phaser.GameObjects.GameObject, ms = 380)  // desistir
export function hitstop(cena: Phaser.Scene, ms: number)   // ver 0.2
```

Cada funcao devolve a `Tween` ou `TweenChain` criada, para quem chamou poder
encadear `.then()` via `onComplete` quando precisar esperar.

Pronto quando: `Provador.ts` compila trocando pelo menos os 6 usos hoje
duplicados (`heroiApanha`, `atingir`, `desistir`, tremor do slot em recarga,
mostrarPips, sumida da vitima) para chamar `fx.ts` em vez de `this.tweens.add`
inline, e o comportamento visual **nao muda** (mesmo teste manual de antes).
Tamanho: M

### 0.2 Hitstop de verdade
Arquivo: `src/sistemas/fx.ts`
Faz: hoje "congelamento de impacto" nao existe de verdade, so um `shake` de
camera. Hitstop de verdade e **pausar o `time` e as `anims` da cena por N ms**
sem pausar a `Scene` inteira (senao a UI trava tambem). Implementacao:

```ts
export function hitstop(cena: Phaser.Scene, ms: number) {
  cena.tweens.timeScale = 0;
  cena.anims.pauseAll();
  cena.time.delayedCall(ms, () => {
    cena.tweens.timeScale = 1;
    cena.anims.resumeAll();
  }, [], null, true); // o proprio delayedCall precisa rodar em tempo real
}
```

**Cuidado que custou um bug em outro jogo Phaser antes**: `time.delayedCall`
tambem obedece ao `timeScale` da cena por padrao. Por isso este timer especifico
tem que ser criado com `paused: false` na fonte de tempo do sistema, nao na da
cena, ou ele nunca dispara. Testar isolado antes de espalhar.
Animacao: 70ms no golpe do heroi, 90ms num golpe critico (faixa OBA), 0ms em QUASE.
Pronto quando: dar um golpe faz a tela "engasgar" por um instante visivel e a
barra de slots continua respondendo ao hover durante o engasgo (prova que so o
mundo pausou, nao a interface).
Tamanho: P

### 0.3 Onda de conjuracao
Arquivo: `src/sistemas/fx.ts`
Faz: `ondaDeConjuracao(cena, x, y, cor, raioFinal)`. Uma elipse (proporcao 2:1,
como o anel de alcance) que nasce com raio 2 no pe de quem conjura, cresce ate o
`raioFinal` e desaparece.
Animacao: 320ms, `Cubic.easeOut` no raio, alpha de 0.9 a 0 no mesmo tempo.
Pronto quando: toda magia (nao o golpe) dispara essa onda antes do efeito
chegar no alvo. Chamada unica em `executar()`, condicionada a `acao.tipo === "magia"`.
Tamanho: P

---

## FASE 1 . fechar o basico: a criatura de verdade

Sem isso o combate e um saco de pancada. E o item que mais muda a sensacao de
jogo por linha de codigo escrita.

### 1.1 Os tres comportamentos
Arquivo: **novo**, `src/sistemas/criatura.ts` (logica pura, sem Phaser)
Faz:

```ts
export type Comportamento = "passeia" | "curioso" | "medroso";

export function decidirAcaoDaCriatura(
  comportamento: Comportamento,
  distancia: number,   // em casas, ate o heroi
  coracoes: number,
  coracoesMax: number,
): "avancar" | "atacar" | "fugir" | "esperar"
```

Regra: `passeia` ignora o heroi ate ele chegar a 1 casa (so entao vira `curioso`
por reflexo). `curioso` avanca ate ficar adjacente, depois `atacar`. `medroso`
(o goblin) foge quando esta a menos de 2 coracoes de vida OU quando o heroi
chega adjacente sem ele ter atacado ainda nesta rodada.
Campo novo em `ARENA.goblins` (provador.ts): `comportamento: Comportamento`.
Pronto quando: teste puro (sem Phaser) cobrindo as 3x3 combinacoes principais de
entrada, rodavel com `node --experimental-strip-types` ou via `tsx`.
Tamanho: M

### 1.2 Ligar ao `jogarCriatura`
Arquivo: `src/cenas/Provador.ts`
Faz: `jogarCriatura` hoje sempre anda ate o heroi e bate. Passa a chamar
`decidirAcaoDaCriatura` a cada passo do caminho (nao so no fim): se virar
`fugir` no meio do movimento, recalcula rota para **longe** do heroi usando o
mesmo `alcancaveis()` que ja existe, so invertendo o criterio de "melhor casa".
Pronto quando: o goblin `magricela` (marcado `medroso`) foge quando chega a 1
coracao, visivel no `?provador`.
Tamanho: M

### 1.3 O telegrafo, com desenho de verdade
Arquivo: `src/cenas/Provador.ts`, funcao que hoje mostra o `!`
Ja existe o `!` amarelo e o squash 0.85/1.15. Falta layered: o `!` precisa
**pulsar de tamanho** para nao competir visualmente com o `!` de outra criatura
se houver duas atacando (o plano ja limita a "nunca mais de duas simultaneas",
mas o telegrafo delas pode se sobrepor na tela).
Animacao: `!` nasce em scale 0, `popIn` (0.2 acima do normal, 140ms,
`Back.easeOut`), segura 260ms, sai com fade de 100ms. Total 500ms, batendo com o
numero que `interface-de-combate.md` ja fixou.
Pronto quando: dois goblins atacando na mesma rodada tem `!` visualmente
distintos (posicao Y alternada se as cabecas estiverem a menos de 20px na tela).
Tamanho: P

---

## FASE 2 . o heroi apanhar direito

### 2.1 Invencibilidade real
Arquivo: `src/cenas/Provador.ts`, `heroiApanha`
Faz: hoje `heroiApanha` sempre aplica dano quando chamada. Falta um campo
`invencivelAte: number` (em `this.time.now`) que, se ainda no futuro, cancela o
dano (mas mantem o flash, para o jogador ver que "quase" levou). Ninguem
consegue tirar 2 coracoes no mesmo turno por acidente de dois golpes emendados.
Animacao: pisca alpha 1/0.3 a cada 90ms por 900ms (ja existe, so falta o campo
de guarda). 900ms bate com `interface-de-combate.md`.
Pronto quando: aplicar `heroiApanha()` duas vezes em sequencia (via console) so
desconta 1 coracao.
Tamanho: P

### 2.2 O quadro `machucado` (fake ate a arte chegar)
Arquivo: `src/cenas/Provador.ts`
Faz: hoje nao existe quadro proprio de dano (a folha do heroi so tem `conjura`
servindo pra tudo). Ate a Fase 6 (arte cara) resolver isso de verdade, simular
com `fx.achatar(heroi, 1.15, 0.8, 90)` no instante do impacto: e squash sem
sprite novo, e ja da 70% do efeito visual de "levei um soco".
Pronto quando: visualmente distinguivel de "conjura" (que nao muda a escala).
Tamanho: P

---

## FASE 3 . condicoes (a fundacao de mundo-que-reage)

Esta e a fase que faz `docs/mundo-que-reage.md` deixar de ser papel. Comeca
pequena de proposito: so o motor, sem nenhuma condicao "de verdade" ainda.

### 3.1 O tipo e o relogio
Arquivo: **novo**, `src/sistemas/condicoes.ts`
Faz: logica pura.

```ts
export type IdCondicao =
  | "molhado" | "queimando" | "congelado" | "preso" | "assustado"
  | "atraido" | "caido" | "tonto"
  | "abencoado" | "rapido" | "protegido" | "escondido" | "iluminado";

export type Condicao = { id: IdCondicao; turnosRestantes: number };

/** Chamado no INICIO do turno de quem carrega a condicao.
 *  Devolve a lista atualizada (as que chegaram a 0 saem) e os EFEITOS que
 *  precisam acontecer agora (dano de queimando, por exemplo), separados para
 *  quem desenha decidir a ordem e a animacao de cada um. */
export function passarTurno(atuais: Condicao[]): { restantes: Condicao[]; efeitos: EfeitoDeTurno[] }

export function aplicar(atuais: Condicao[], nova: Condicao): Condicao[]
// nunca empilha (decisao ja tomada em mundo-que-reage.md secao 11.2): so
// substitui se a nova duracao for maior, ou insere se nao existia
```

Pronto quando: teste puro cobrindo "renova sem duplicar", "expira e sai da
lista", "queimando gera EfeitoDeTurno de dano".
Tamanho: M

### 3.2 Onde a condicao mora e como se ve
Arquivo: `src/cenas/Provador.ts` (tipo `Bicho` ganha `condicoes: Condicao[]`,
heroi ganha o mesmo numa struct paralela ja que `Heroi` e de `sistemas/heroi.ts`
e nao deve saber de combate)
Faz: fileira de icones 8x8 **abaixo dos coracoes** que ja existem sobre a
cabeca, mesma chapa escura de fundo (a licao da Fase anterior: elemento de
estado precisa de fundo proprio). Maximo 3 visiveis, `+N` se mais.
Animacao: cada icone novo entra com `popIn` (140ms). Ao expirar, `fade 200ms`
antes de sumir — nunca some seco, senao o jogador nao sabe se foi removido de
proposito ou e bug.
Pronto quando: aplicar 4 condicoes via console mostra 3 icones + "+1", e cada
uma decrementa visualmente no inicio do turno de quem a carrega.
Tamanho: M

### 3.3 As duas condicoes que provam o conceito: MOLHADO e CONGELADO
Arquivo: `src/dados/condicoes-dados.ts` (novo, so os textos/icones/cores de
cada `IdCondicao` — separado de `condicoes.ts` porque aquele e logica pura e
este e so dado, seguindo a mesma divisao que `conteudo.ts` / os sistemas)
Faz: **apenas** essas duas entram nesta fase, deliberadamente (mundo-que-reage.md
secao 10 marcou isso como "a etapa mais barata que muda mais o jogo"):
- MOLHADO: 3 turnos, dourado no fundo do icone vira azul-claro
- CONGELADO: 1 turno, pula a acao E o movimento inteiro
A REGRA de combinacao (`gelo` em `MOLHADO` vira `CONGELADO` na hora) mora em
`src/sistemas/marcas.ts` (ainda a criar, ver 3.4), nao aqui.
Pronto quando: `Bafo Gelado` no goblin `magricela` sem MOLHADO so o atrasa;
`Bafo Gelado` nele DEPOIS de MOLHADO (aplicado via `Escudo de Bolha`... ou por
ora, via console) o congela e ele perde o proximo turno inteiro.
Tamanho: P

### 3.4 A tabela de reacoes, versao minima
Arquivo: **novo**, `src/sistemas/marcas.ts`
Faz: a funcao unica que TODA magia com `marca` chama depois de acertar.

```ts
export function aplicarMarca(
  marca: Marca, alvo: { condicoes: Condicao[] }, superficie?: IdSuperficie
): { condicoesNovas: Condicao[]; superficieNova?: IdSuperficie; efeitoEspecial?: "congelou" | "apagou" | "derreteu" }
```

Nesta fase so precisa resolver as 2-3 linhas que envolvem `molhado`/`congelado`
(a tabela completa de `mundo-que-reage.md` secao 3 entra na Fase 4).
Pronto quando: chamada isolada com `marca: "gelo"` e alvo ja `molhado` devolve
`congelado`; com alvo seco devolve so um "atrasa" generico (sem condicao nova
por enquanto, ate a Fase 4 trazer `preso`/etc via gelo puro).
Tamanho: P

---

## FASE 4 . superficies de chao

Depende da Fase 3 (o motor de condicao) porque parar numa superficie e o que
mais aplica condicao no jogo inteiro.

### 4.1 O tipo e o dono das casas
Arquivo: **novo**, `src/sistemas/superficies.ts`
Faz: logica pura, um `Map<chaveDaCasa, { id: IdSuperficie; turnosRestantes: number }>`
por arena/mapa. Mesmas chaves de `src/sistemas/alcance.ts` (`chaveDaCasa`), para
os dois sistemas conversarem sem duplicar coordenada.

```ts
export type IdSuperficie = "agua" | "gelo" | "fogo" | "fumaca" | "mato-alto" | "brasa";
export function custoDeMovimento(id: IdSuperficie | undefined): number  // 1 por padrao, 2 pra agua e mato
export function passarTurnoDasSuperficies(mapa: Map<string, SuperficieNaCasa>): { restante: Map<...>; propagacoes: Propagacao[] }
```

Pronto quando: teste puro de propagacao de fogo respeitando "1 casa por rodada,
so em inflamavel" (a regra 1 de `mundo-que-reage.md` secao 9).
Tamanho: M

### 4.2 Ligar ao alcance: a ponte que se abre sozinha
Arquivo: `src/cenas/Provador.ts`, funcao `passavel()`
Faz: **uma linha muda**: `passavel` passa a receber o `custoDeMovimento` da
superficie da casa e o `alcancaveis()` de `sistemas/alcance.ts` ja aceita custo
por casa (hoje assume custo 1 fixo — checar se `alcance.ts` precisa de um
parametro `custo(tx, ty)` alem de `passavel(tx, ty)`; se sim, e a unica mudanca
de assinatura desta fase inteira, e vale isolar num commit proprio).
Pronto quando: uma casa de `agua` com `gelo` em cima custa 1 (nao 2), e o
`desenharCasas()` pinta essa casa como alcancavel quando antes (sem o gelo) nao
pintava — **a prova visual central deste sistema inteiro**.
Tamanho: M

### 4.3 O desenho da superficie no chao
Arquivo: `src/cenas/Provador.ts`, nova camada `this.pincelSuperficies` (entre
`pincelCasas` e `pincel`, na mesma familia de profundidade -600/-500)
Faz: veu de cor a 25% de opacidade + textura simples por tipo:
- agua: ja e o tile, nao precisa de veu
- gelo: veu azul-claro (`0xcde9f8`) + 3 riscos diagonais finos por casa
- fogo: veu laranja (`0xf2802b`) pulsando alpha 0.2-0.35 a cada 400ms (fogo "vivo")
- fumaca: veu cinza-roxo (`0x4a3e64`) a 0.3, sem pulso (fumaca e parada)
- mato-alto: reusa o tile de `gramaAlta` que ja existe em `config.ts` (T.gramaAlta)
- brasa: veu vermelho escuro fixo
Os turnos restantes: **pontinhos no canto superior direito da casa**, mesma
linguagem visual da espera dos slots (Fase anterior, ja escrito). Nunca numero.
Animacao: superficie nova entra com alpha 0 -> alvo em 200ms; ao expirar, sai em
300ms (mais lento que entra, para o jogador ter tempo de notar "isso vai
sumir" no ultimo turno).
Pronto quando: congelar 3 casas em linha mostra o veu azul nas 3, com pontinhos
de contagem regressiva visiveis, e some sozinho apos 6 turnos.
Tamanho: M

### 4.4 Fogo se espalhando, com as 5 regras de seguranca
Arquivo: `src/sistemas/superficies.ts` (a funcao `passarTurnoDasSuperficies`)
Faz: implementa as 5 regras de `mundo-que-reage.md` secao 9, na ordem:
1. so pega em `IdSuperficie` marcada `inflamavel: true` (mato-alto) ou objeto
   inflamavel (Fase 5)
2. no maximo 1 casa nova por fonte de fogo por rodada
3. a casa que vai pegar fogo **pisca (veu alpha 0.15, piscando 2x)** na rodada
   anterior a pegar de verdade — e o "aviso" da regra 2 de seguranca
4. se TODAS as casas alcancaveis de uma criatura estiverem em fogo, a de menor
   `turnosRestantes` apaga (implementado como excecao dentro do calculo, nao
   como pos-processamento — mais simples de testar)
5. fora de combate (`!this.ordem.emCombate()`), `passarTurnoDasSuperficies`
   simplesmente nao e chamada
Pronto quando: um retangulo de `mato-alto` pegando fogo numa ponta leva mais de
uma rodada pra queimar inteiro (nao tudo de uma vez), e a casa que vai pegar
fogo na proxima rodada pisca antes.
Tamanho: G

---

## FASE 5 . objetos com estado

### 5.1 O tipo
Arquivo: `src/dados/provador.ts` (por ora; quando for pro jogo de verdade, isso
vira parte de `mapas.ts`, que e do ambiente principal — ver Fase 7)
Faz:

```ts
export type ObjetoComEstado = {
  tipo: "tocha" | "fogueira" | "arvore" | "arbusto" | "teia" | "ponte" | "barril" | "sino";
  x: number; y: number;
  estado: string;  // por tipo: "apagada"|"acesa", "inteira"|"queimando"|"queimada", etc
};
```

Tamanho: P

### 5.2 A reacao de cada objeto
Arquivo: **novo**, `src/sistemas/objetos.ts`
Faz: `aplicarMarcaEmObjeto(marca, objeto) -> { novoEstado, efeito }`, seguindo a
tabela da secao 4 de `mundo-que-reage.md`. So o `barril` e o `sino` tem efeito
de AREA (espalhar agua em 3 casas / assustar toda criatura da tela) — os dois
chamam de volta em `condicoes.ts` (aplicar `assustado`) e `superficies.ts`
(criar `agua` em 3 casas), entao esta fase depende das duas anteriores.
Pronto quando: `fogo` numa `arvore` estado `inteira` vira `queimando`; dois
turnos depois vira `queimada` e `passavel()` passa a aceitar aquela casa.
Tamanho: M

### 5.3 O desenho: sprite por estado
Arquivo: `arte/icones.py` OU novo `arte/objetos-de-estado.py` (a decidir: se
crescer muito, arquivo proprio; se ficar em 3-4 desenhos, cabe em `icones.py`)
Faz: cada objeto ganha 2-3 quadros (tocha apagada/acesa; arvore
inteira/queimando/queimada). Queimando usa 2 quadros alternados a 4fps pra
parecer chama, nao imagem parada.
Animacao de transicao: ao mudar de estado, `fx.flashBranco` de 100ms no objeto
+ uma nuvem de 4 particulas (reusa o padrao ja usado em `poeira()` do
`Provador.ts`, generalizado para `fx.ts` na Fase 0 se ainda nao foi).
Pronto quando: visualmente distinguivel os 3 estados da arvore no `?provador`.
Tamanho: M (arte) + P (ligacao)

---

## FASE 6 . itens da loja como acao, e selos

### 6.1 Itens
Arquivo: `src/dados/provador.ts` (por ora), reaproveitando o tipo `AcaoDeProva`
Faz: cada item de `conteudo.ts` (`LOJA`) ganha uma entrada equivalente,
`tipo: "item"`, com `usosPorCombate` vindo da quantidade que o jogador tem
(nao fixo em 1 como as skills). A barra ja aceita `tipo` extra sem mudanca de
layout, ver `docs/plano-do-combate.md` secao 3.5 ("os slots ganharam...").
Pronto quando: um slot de item mostra "3" pequeno no canto (quantidade), nao
"1 uso por combate" como skill.
Tamanho: M

### 6.2 Selos e a tela de escolha
Arquivo: **novo**, `src/cenas/EscolhaDeSelo.ts` (cena modal, no padrao de
`Pausa.ts`: paisa a cena de baixo, desenha por cima)
Faz: 3 icones de selo no topo (ao lado dos coracoes); o terceiro acendendo
dispara a cena modal com 3 opcoes (`+1 coracao`, `+1 atributo`, `nova
habilidade`), cada uma um `botao()` do `sistemas/botao.ts` que ja existe.
Animacao: os 3 selos, ao encherem, fazem um `popIn` em cadeia (0ms, 80ms,
160ms de atraso entre eles) antes da cena modal abrir — da tempo do jogador
perceber que subiu de nivel antes do menu tomar a tela.
Pronto quando: ganhar o 3o selo (via console: `heroi.selos = 3`) abre a cena e
a escolha persiste (verificavel lendo o campo escolhido depois).
Tamanho: M

---

## FASE 7 . a fronteira: levar do provador pro jogo de verdade

Esta fase e a unica que **exige combinar com outra pessoa antes de escrever
codigo** (`docs/plano-do-combate.md` secao 6). Nao comeca por decisao tecnica
minha: comeca quando o ambiente `ficha` (que declara donos de `Interface.ts` e
`design.ts`) estiver livre para conversar sobre a divisao.

### 7.1 `estado.ts` ganha os campos novos
Arquivo: `src/sistemas/estado.ts` (**acrescentar no fim**, nunca reordenar —
regra do `docs/12-ambientes-paralelos.md`)
Campos: `barra: (string | null)[]`, condicoes do heroi, selos ja existe.
Tamanho: P, mas so depois do combinado

### 7.2 Portar a barra pra `Interface.ts`
Depende inteiramente do que o ambiente `ficha` decidir. O `Provador.ts` foi
escrito para isso ser uma extracao, nao uma reescrita: a logica de
`escolher/mirar/executar` esta separada da desenho (`montarInterface`,
`atualizarSlots`). Se `ficha` topar, a extracao e principalmente mover funcoes.
Tamanho: G, fora do controle deste plano

### 7.3 Um goblin de verdade na Vila Semente
Arquivo: `src/cenas/Mundo.ts`, `src/dados/mapas.ts`
Faz: um goblin `medroso`, perto do poste do sino (o sino ja existe no mapa e ja
tem a fraqueza escrita no bestiario — a combinacao pronta para o jogador
descobrir sozinho).
Tamanho: P, depois de 7.2

---

## FASE 8 . arte cara (paralela, ambiente `sprites`)

Nao bloqueia nada das fases 1-6. Pode comecar a qualquer momento em paralelo,
desde que outra sessao esteja de fato segurando `arte/` (regra 2 de
`docs/12-ambientes-paralelos.md`: uma frente por vez mexe em `arte/`).

### 8.1 Quadros `ataque` e `machucado`
Arquivo: `arte/pessoa.py`, `arte/gente.py`, `src/dados/config.ts` (`QUADRO`)
Efeito: a Fase 2.2 (squash falso) e substituida pelo quadro de verdade. A
`encaixes.json` e regerada automaticamente — e o unico ponto de todo o plano
onde `npm run arte` roda por inteiro.
Tamanho: G

### 8.2 Os icones que faltam
Hoje existem 5 retratos + 6 acoes + 6 faces de dado (`arte/icones.py`). Faltam:
icones de condicao (13, um por `IdCondicao`), icones de superficie (6), e os
sprites dos objetos com estado (Fase 5.3, se nao coube em `icones.py`).
Tamanho: M, incremental — nao precisa vir tudo de uma vez, cada Fase acima ja
antecipa um "icone emprestado" como fallback (mesma logica da barra: comecar
feio de proposito, so desenhar de verdade depois que a mecanica provar valer a
pena).

---

## Resumo: o que fica demonstravel depois de cada fase

| Depois da fase | O que da pra mostrar |
|---|---|
| 0 | nada de novo visivel, mas o codigo para de duplicar animacao |
| 1 | o goblin foge quando esta fraco, e telegrafa antes de bater |
| 2 | apanhar dois golpes seguidos so custa 1 coracao |
| 3 | **molhar antes de congelar funciona**, a combinacao mais importante do sistema |
| 4 | **congelar o rio abre a ponte sozinha**, e o fogo se espalha com seguranca |
| 5 | acender a tocha, queimar a arvore, quebrar o barril de agua |
| 6 | usar pocao/biscoito no combate, e a tela de escolha ao subir de nivel |
| 7 | tudo isso dentro do jogo de verdade, nao mais so no `?provador` |
| 8 | a arte deixa de ser emprestada |

**A ordem 0 -> 6 nao depende de ninguem fora deste ambiente.** So a Fase 7 tem
uma dependencia externa real. Isso significa que da pra construir o sistema
inteiro de mundo-que-reage e mostrar ele funcionando no provador antes mesmo de
resolver a fronteira com `ficha` — o que, alias, e um bom argumento pra mostrar
nessa conversa: "olha o que ja funciona, so falta portar".
