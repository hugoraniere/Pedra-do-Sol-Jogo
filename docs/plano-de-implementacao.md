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

> **Feita.** `src/sistemas/criatura.ts`, `ferramentas/conferir-criatura.mjs`
> (`npm run criatura`, 13 casos), e `jogarCriatura` em `Provador.ts` ramificando
> pelos tres comportamentos. Conferido tambem ao vivo no `?provador`: o
> magricela ataca de surpresa uma vez e foge na proxima, o moleque vira
> curioso pra sempre ao ser notado, o medroso fraco foge sem nem tentar bater.

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

> **Feita.** `invencivelAte` guarda a janela de 900ms em `heroiApanha`; o
> pisca-pisca roda sempre (mesmo bloqueando o dano, para o jogador ver que
> "quase levou"), e `fx.achatar` simula o quadro `machucado` que a folha ainda
> nao tem. Conferido: golpes emendados descontam so 1 coracao, e a janela
> reabre sozinha no proximo golpe de verdade.

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

## FASE 2.5 . a regra dura: o combate nunca troca de lugar

Pedida antes da Fase 3, de proposito: e mais barato travar isto agora, com
pouco codigo em jogo, do que descobrir na Fase 7 que o combate depende de um
"lugar de batalha" que a Vila Semente de verdade nao tem. Ver
`docs/plano-do-combate.md`, secao 3.6, para a regra por extenso e o porque.

### 2.5.1 `conferirMesmoLugar()`
Arquivo: `src/cenas/Provador.ts`
Faz: um metodo publico de diagnostico (no mesmo espirito de
`sistemas/bancada.ts`, so que vivendo na propria cena por precisar de
`comecarCombate` privado). Tira uma fotografia do estado do "lugar" ANTES de
chamar `comecarCombate()`, dispara o combate, e compara **na hora**, sem
esperar o tween de ajuste de casa: a garantia e geometrica (o alvo e sempre o
centro da propria casa onde o heroi ja estava), entao vale em qualquer
instante da animacao, e o teste nao fica refem do relogio do jogo:

```ts
type FotoDoLugar = {
  cenaKey: string;
  tilemap: Phaser.Tilemaps.Tilemap;        // identidade do objeto, nao copia
  alvoDaCamera: unknown;
  casaDoHeroi: { tx: number; ty: number };
};
```

Compara `cenaKey` igual, `tilemap` **o mesmo objeto** (`===`, nao os mesmos
dados), `alvoDaCamera` o mesmo heroi, a casa que `comecarCombate` REALMENTE
usou (lida de `this.ultimoAjuste`, nunca recalculada por fora — testar a
propria formula contra ela mesma so prova que ela concorda com ela mesma), e
o deslocamento em pixel **por eixo, com limites diferentes**: meia casa (8px)
em X, uma casa inteira (16px) em Y, porque o sprite e ancorado pelo centro
horizontal mas pelo pe na vertical. Devolve uma lista OK/FALHA, no mesmo
formato de texto das outras conferencias deste projeto, pra rodar direto no
console: `jogo.scene.getScene("Provador").conferirMesmoLugar()`.

> Duas armadilhas apareceram so ao RODAR isto, nao ao escrever: (1) ler
> `this.heroi.x/y` logo depois de criar o tween sempre devolve o valor de
> ANTES, porque o Phaser so move a propriedade no proximo quadro — um teste
> assim passaria sempre, sem testar nada; (2) o limite "meia casa nos dois
> eixos" estava errado, porque Y e ancorado pelo pe, nao pelo centro. As duas
> so ficaram visiveis testando de verdade num canto de casa, nao no centro.
Pronto quando: os quatro itens (cena, tilemap, camera, casa) voltam OK depois
de um combate comecar a partir de tres pontos diferentes do mapa (perto da
agua, perto da moldura de pedra, no canto).
Tamanho: P

### 2.5.2 A trava para a Fase 7
Arquivo: `docs/plano-de-implementacao.md` (este arquivo), secao 7.3
Faz: acrescenta a frase que impede a Fase 7.3 de nascer como cena separada — a
integracao com `Mundo.ts` tem que rodar o turno em cima do MESMO tilemap que
`Mundo.ts` ja desenha, nunca criar um `Combate.ts` com o proprio `create()`.
Tamanho: (documentacao, sem codigo)

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

> **Trava, ver secao 2.5**: o turno roda em cima do `Tilemap` que `Mundo.ts`
> ja cria para a Vila Semente. Nao existe `Combate.ts`, nao existe
> `scene.start` para uma cena de batalha, nao existe segundo mapa. Se a
> integracao comecar assim, ela ja nasceu errada — volte e leia
> `docs/plano-do-combate.md` secao 3.6 antes de continuar. `conferirMesmoLugar()`
> (2.5.1) tem que continuar passando dentro de `Mundo.ts` tambem, nao so no
> `?provador`.

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

**Regra confirmada com o Hugo**: um retrato por TIPO de criatura, nunca um por
individuo na tela. Tres goblins `magricela` na arena usam o mesmo retrato — o
jogador precisa reconhecer "aquele tipo de goblin", nao decorar cada um. Quem
foge da regra e todo bicho **unico e nomeado** do bestiario (o chefe goblin,
Grulo, Bruxa Espinho, Brasanegra): esses ganham retrato proprio, porque sao
diferentes de verdade. Ja escrito assim em `arte/icones.py` (cabecalho de
`RETRATOS`), e os tres goblins normais foram redesenhados nesta rodada para se
distinguirem a 16px: `magricela` ganhou um espigao unico no topo e olhos
apertados, `gorducho` ganhou presas pendendo do queixo, `moleque` ganhou uma
crista laranja (cor antes de silhueta, a mesma licao da secao 5 de
`docs/interface-de-combate.md`). Faltam os retratos das outras 8 criaturas do
`BESTIARIO` de `conteudo.ts`.
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

---

## Atualizacao . a fronteira ja foi cruzada fora de ordem

Outra sessao portou `Combate.ts` pro jogo de verdade antes da Fase 7 chegar
aqui: hoje `Combate.ts` ja e a cena real (nao mais o `?provador`), ja pega o
`heroi`/`chaoLayer`/camera emprestados do `Mundo.ts` de verdade (a REGRA DURA da
Fase 2.5 esta valendo dentro do jogo, nao so no provador), e ja spawna goblin na
casa real onde o bicho estava andando. `Provador.ts` continua existindo como
banco de prova descartavel, mas **as Fases 9-12 abaixo mexem em `Combate.ts`,
nao em `Provador.ts`** — e a diferenca central deste bloco.

Duas coisas que a Fase 7 previa e ainda faltam, mesmo com a fronteira cruzada:
`Combate.ts` ainda usa `ACOES_DE_PROVA` (as 6 acoes de teste do provador) na
barra, em vez das 13 magias e das armas de verdade; e o tipo `Bicho` de
`Combate.ts` ainda nao tem `condicoes: Condicao[]` (o `Provador.ts` ja tem, foi
adicionado na Fase 3, mas so la). Sem essas duas coisas nao tem onde pendurar
nem a marca nem a condicao no jogo real. Sao o primeiro passo abaixo.

---

## FASE 9 . as treze magias de verdade na barra

Depende de nada alem do que ja existe. E o pre-requisito de tudo que vem depois
neste bloco, porque sem acao de verdade nao tem marca de verdade pra aplicar.

### 9.1 O tipo e os dados, fora do provador
Arquivo: **novo**, `src/dados/habilidades.ts`
Faz: o mesmo formato de `AcaoDeProva` (id, tipo, nome, icone, cor, forma,
alcance, espera, atributo, dica, som, marca?) so que povoado com as 13 entradas
de `MAGIAS` (`src/dados/conteudo.ts`) + as armas reais de `ARMAS`
(`src/dados/sons.ts`) + os 2 golpes sem-magia (cajado, soco). Os valores de
`forma / alcance / espera` de cada magia ja estao escritos em
`docs/11-combate-e-magias.md` secao 9 — este arquivo so transcreve aquela
tabela pra codigo, uma linha por magia. `marca` tambem vem dali (primeira
palavra de cada receita: `luz`, `gelo`, `planta`, `som-alto`, `pulo`, `cola`,
`conserto`, `bolha`, `doce`, `fala`, `invisivel`, `vento`, `fogo` — as 13 batem
1 a 1 com as 13 entradas de `Marca`; faltam so as 4 marcas que nenhuma magia
carrega sozinha: `agua`, `corta`, `quebra`, `empurra`, que nascem de outra
coisa: agua de rio/barril, corta de espada, quebra/empurra de objeto — Fase 5).
Pronto quando: `import { HABILIDADES } from "../dados/habilidades"` tem 15
entradas (13 magias + cajado + soco) e cada uma tem `marca` preenchida, exceto
as que a tabela da secao 9 deixa de fora de proposito (Remendo, Fala Bicho,
Sumir-Sumindo, Escudo de Bolha, Dedo Colante nao imprimem marca em ninguem —
sao efeito direto, nao reacao).
Tamanho: M

### 9.2 Trocar quem a barra le
Arquivo: `src/cenas/Combate.ts`
Faz: troca `import { ACOES_DE_PROVA, ... } from "../dados/provador"` por
`import { HABILIDADES } from "../dados/habilidades"`, e troca as 2-3 referencias
a `ACOES_DE_PROVA[i]` por `HABILIDADES[i]`. So 15 acoes nao cabem nos slots
visiveis de uma vez (a barra hoje mostra 6) — usar o mesmo `linha.cabem()` que
ja existe e paginar com as setas, OU (mais simples pra essa fase) filtrar por
classe do heroi (`poderesDoHeroi()` ja existe em `sistemas/estado.ts` e decide
quais magias cada classe conhece — usar esse filtro em vez de mostrar as 15).
Pronto quando: abrir combate de verdade no jogo mostra as magias da classe do
heroi criado (ex: Mago mostra Luzinha/Bafo Gelado/Bola de Fogo, nao golpe de
cajado como ataque principal).
Tamanho: M

### 9.3 `Bicho` ganha condicao
Arquivo: `src/cenas/Combate.ts`
Faz: `condicoes: Condicao[]` no tipo `Bicho` (copiar o campo que `Provador.ts`
ja tem) e `condicoesHeroi: Condicao[]` no heroi da cena (idem). Em
`entrarNoTurno()`, antes de decidir a acao de quem joga, chamar `passarTurno()`
de `sistemas/condicoes.ts` e tratar o `EfeitoDeTurno` que voltar (`pulaTurno`
pula a vez sem rolar dado; `dano` desconta 1 coracao antes de agir — hoje so
`congelado` gera `pulaTurno`, mas o campo ja existe para `queimando` chegar na
Fase 11 sem mexer aqui de novo).
Animacao: ficha de condicao (retangulo colorido + `texto()` do turnos
restantes) empilhada acima da barra de coracao, mesmo padrao visual que
`Provador.ts` ja usa em `condicoesUI` — copiar a funcao, nao reinventar.
Pronto quando: forcar `jogo.scene.getScene("Combate").bichos[0].condicoes =
[{id:"congelado", turnosRestantes:1}]` pelo console faz aquele goblin pular a
vez uma vez e depois voltar ao normal.
Tamanho: M

---

## FASE 10 . superficies de chao, em `Combate.ts`

O que a Fase 4 (acima) ja projetou para `src/sistemas/superficies.ts` continua
valendo palavra por palavra — **e logica pura, nao depende de qual cena
chama**. So isto muda: os itens 4.2 e 4.3 (ligar ao alcance, desenhar no chao)
apontam pra `Combate.ts`, nao mais pra `Provador.ts`, porque `Provador.ts` nao
vale mais como destino de integracao — so como banco de prova isolado. Reler
4.1-4.4 acima antes de comecar aqui; nao repetido.

### 10.1 Onde o mapa de superficies mora
Arquivo: `src/cenas/Combate.ts`
Faz: `private superficies = new Map<string, SuperficieNaCasa>();`, criado vazio
em `create()` e limpo em `acabarCombate()` (superficie e so de dentro da briga —
nao precisa sobreviver depois que o combate acaba, o `mundo-que-reage` so
promete isso pros OBJETOS com estado da Fase 5, nao pro chao efemero da Fase
4). `passavel()` (a funcao que ja existe e alimenta `alcancaveis()`) passa a
somar o `custoDeMovimento()` da casa.
Pronto quando: igual ao 4.2 acima, so que testado dentro do jogo de verdade:
Bafo Gelado numa casa de agua do mapa real congela e a casa fica alcancavel com
custo 1.
Tamanho: M

### 10.2 O desenho
Arquivo: `src/cenas/Combate.ts`
Faz: exatamente o item 4.3 acima (veu por tipo, pontinhos de turno, entra em
200ms/sai em 300ms), na camada `this.pincelCasas`/`this.pincel` que ja existe
(profundidade -600/-500), sem criar camada nova.
Tamanho: M

### 10.3 Fogo se espalhando
Arquivo: `src/sistemas/superficies.ts` (novo, logica pura) + `Combate.ts` (chamada)
Faz: exatamente o item 4.4 acima (5 regras de seguranca), chamado de dentro de
`entrarNoTurno()` uma vez por rodada nova (quando `this.ordem.rodada()` muda de
valor).
Tamanho: G

---

## FASE 11 . a tabela de reacao inteira (hoje 1 de 17 marcas)

`aplicarMarca()` (`src/sistemas/marcas.ts`) so trata `gelo`. A tabela inteira ja
esta escrita em `docs/mundo-que-reage.md` secao 3 — esta fase e transcrever
aquilo pra dentro da funcao, marca por marca, cada uma com o proprio teste em
`ferramentas/conferir-condicoes.mjs` (que ja roda puro, sem Phaser, sem
browser — o jeito certo de testar isto, depois do tanto de token que o pane do
navegador consumiu nas fases anteriores).

### 11.1 As 11 fichas de condicao que faltam
Arquivo: `src/dados/condicoes-dados.ts`
Faz: hoje so `molhado` e `congelado` tem `FichaCondicao {nome, cor}`. Faltam
`queimando` (laranja `0xf2802b`), `preso` (marrom `0xb08658`), `assustado`
(roxo `0x4a3e64`), `atraido` (dourado `0xf5b62b`), `caido` (cinza `0x8a8a9a`),
`tonto` (o mesmo roxo de assustado, mas com estrela em vez de seta — cor sozinha
nao basta pra duas condicoes negativas, ver a licao da secao 5 de
`docs/interface-de-combate.md` sobre nao confiar so em cor), `abencoado`
(amarelo-claro), `rapido` (verde `0x3e9b62`), `protegido` (azul-claro
`0x7ec4f2`, mesma familia da bolha), `escondido` (cinza-esverdeado, alpha mais
baixo que os outros — a propria ficha "esconde" um pouco), `iluminado`
(amarelo forte, quase branco).
Pronto quando: as 13 entradas de `IdCondicao` tem ficha, `condicoesDados()` nao
cai mais no fallback cinza pra nenhuma.
Tamanho: P

### 11.2 A tabela marca x condicao
Arquivo: `src/sistemas/marcas.ts`
Faz, na ordem exata de `mundo-que-reage.md` secao 3 (a tabela "a regra que faz
tudo combinar", 6 linhas) + a tabela de "vem de" (8 debuffs, 5 buffs) que
completa o que cada marca faz **sem** condicao previa no alvo:

```
gelo   em molhado          -> congelado (ja existe)
gelo   em nao-molhado      -> sem efeito especial (ja existe)
fogo   em molhado          -> tira molhado, sem queimar (efeitoEspecial "apagou")
fogo   em congelado        -> derrete: tira congelado, deixa "molhado" (efeitoEspecial "derreteu")
fogo   em nao-molhado/nao-congelado -> aplica queimando (2 turnos)
agua   em queimando        -> apaga: tira queimando, aplica molhado (efeitoEspecial "apagou")
agua   em nao-queimando    -> aplica molhado (3 turnos), sem mais nada
vento  em queimando        -> queimando dura +1 turno (turnosRestantes + 1, nunca stack duplicado)
vento  em nao-queimando    -> sem condicao; efeito de empurrar 1 casa e so posicional,
                              resolvido em Combate.ts (nao em marcas.ts, que e so condicao)
som-alto em qualquer um    -> aplica assustado (2 turnos)
planta, cola  em qualquer um -> aplica preso (2 turnos)
doce   em qualquer um      -> aplica atraido (3 turnos)
bolha  em qualquer um      -> aplica protegido (3 turnos ou 1 golpe — o "ou" resolvido
                              em Combate.ts quando o golpe seguinte chega: se protegido
                              tem, o dano vira 0 e a condicao cai, mesmo com turno sobrando)
luz    em qualquer um      -> aplica iluminado (20 turnos) e revela invisivel/escondido
invisivel, pulo, conserto, fala, corta, quebra, empurra -> sem condicao (efeito direto,
   nao reacao — resolvidos como acao especial em Combate.ts, nunca em aplicarMarca)
```
Pronto quando: as 19 combinacoes acima (mais as que ja passavam) tem teste
proprio em `ferramentas/conferir-condicoes.mjs`, todas verdes.
Tamanho: G

### 11.3 Ligar em `Combate.ts`
Arquivo: `src/cenas/Combate.ts`, funcao `executar()`
Faz: hoje `executar()` ja chama `aplicarMarca()` quando `acao.marca` existe (so
pro caso gelo). Generalizar: sempre que `acao.marca` existir, chamar
`aplicarMarca()` e tratar `efeitoEspecial` (`congelou`/`apagou`/`derreteu`) com
uma linha de `dizer()`/`anunciar()` avisando o jogador em uma frase curta
("O GELO CONGELOU!", "A AGUA APAGOU O FOGO!") — nunca sem feedback de texto,
regra de design deste jogo pro Lele (uma ideia por tela).
Pronto quando: usar Bola de Fogo (ja com `marca:"fogo"` da Fase 9.1) num goblin
`molhado` (forcar via console) mostra "A AGUA APAGOU O FOGO!" e o goblin fica
sem a marca molhado.
Tamanho: P

---

## FASE 12 . uma animacao por ataque e por magia

Este e o pedido mais recente do Hugo: cada uma das 15 acoes de `HABILIDADES`
(Fase 9.1) precisa da propria animacao, nao mais o generico emprestado. Segue a
mesma logica de "comecar feio de proposito" que o resto do plano usa: **nem
toda acao precisa de sprite novo** — `fx.ts` (Fase 0, ja pronto) da conta de
metade delas sozinho, compondo primitivas que ja existem. So as acoes
centrais/mais usadas ganham desenho de verdade (Fase 8, ambiente `sprites`).
Coluna "sprite" = precisa de arte nova; coluna vazia = so `fx.ts`, sem depender
do ambiente `sprites`.

| Acao | Composicao em fx.ts | Sprite novo? |
|---|---|---|
| Golpe de Cajado | `agachar` no atacante + `projetil` curtissimo (8px) atacante->alvo + `flashBranco`+`tremerLeve` no alvo | quadro de "ataque" do heroi (Fase 8.1, ja no plano) |
| Soco | `achatar` no atacante + `flashBranco`+`tremerLeve`, sem projetil (corpo a corpo) | nao |
| Luzinha | `popIn` da bolinha + orbita (tween circular simples, novo helper `orbitar()` em fx.ts) | nao |
| Bafo Gelado | `ondaDeConjuracao` + `projetil` largo (3 pontos em leque, um por casa da linha) na cor do gelo + `piscar` no alvo | **sim** — sopro em cone, 3 quadros, e o ataque mais visto do jogo (skill de assinatura da classe Mago) |
| Cresce-Grama | `estourinho` verde saindo do chao + `pulso` na casa alvo | nao |
| Voz de Trovao | `ondaDeConjuracao` grande (raio 60px) + `tremerLeve` em TODOS os alvos dentro + `hitstop` de 80ms no impacto | **sim** — e a magia do Trovao da Floresta, "a mais gostosa das treze": merece anel de onda desenhado (nao Graphics generico) irradiando do heroi, 4 quadros |
| Pulo de Sapo | `sumirParaCima` no heroi + reaparece com `popIn` + `empurrar` em quem estiver perto do pouso | nao |
| Dedo Colante | `piscar` na mao do heroi (cor rosa) | nao |
| Remendo | `confete` pequeno (2-3 particulas) na cor do objeto + `flashBranco` no alvo | nao |
| Escudo de Bolha | `popIn` de um circulo semitransparente ao redor do heroi, que fica ate cair (`pulso` leve continuo) | nao |
| Cheiro de Bolo | `estourinho` amarelo + `textoFlutuante` "..." nos bichos que vao andar ate o cheiro | nao |
| Fala Bicho | `popIn` de balao de fala (reusa a caixa de dialogo que ja existe em `Interface.ts`) | nao |
| Sumir-Sumindo | `piscar` (alpha 0.4) continuo enquanto durar, sem tween de saida | nao |
| Chama-Vento | `projetil` largo e rapido (120ms) + `empurrar` forte (dobro do padrao) em quem estiver na linha | **sim** — e "a mais interativa das treze", precisa parecer vento de verdade: 3 riscos curvos animados, nao uma bolinha reta |
| Bola de Fogo | `ondaDeConjuracao` + `projetil` na cor do fogo + `estourinho` laranja no impacto + aplica `queimando` (Fase 11.2) | **sim** — junto com Bafo Gelado e Voz de Trovao, e uma das 3 acoes mais usadas: bola girando, 3 quadros, rastro de faisca |

Resumo: **3 sprites novos** (Bafo Gelado, Voz de Trovao, Bola de Fogo — nesta
ordem de prioridade, porque sao as 3 que mais vao aparecer numa luta comum) +
**1 helper novo em `fx.ts`** (`orbitar`, pra Luzinha, reutilizavel depois pra
qualquer coisa que precise girar em torno de um alvo) + as 11 acoes restantes
saem so com o que `fx.ts` ja tem, hoje, sem esperar arte nenhuma.

### 12.1 O helper que falta
Arquivo: `src/sistemas/fx.ts`
Faz: `orbitar(cena, alvo, raio, ms)`, tween de angulo 0->360 reaproveitando o
padrao de easing linear que `ondaDeConjuracao` ja usa.
Tamanho: P

### 12.2 Os 3 sprites, no ambiente `sprites`
Arquivo: `arte/gente.py` ou novo `arte/magias.py` (a decidir por quem estiver no
ambiente `sprites` — regra "quem mexe em arte e um so" da
`docs/12-ambientes-paralelos.md` continua valendo, isto nao se escreve daqui)
Faz: 3-4 quadros cada (sopro de gelo em cone, anel de trovao expandindo, bola de
fogo girando com rastro), seguindo a paleta de `arte/paleta.py`.
Pronto quando: `npm run folha` ou uma tela de combate de verdade mostra os 3
efeitos com sprite proprio, nao mais Graphics generico.
Tamanho: G (arte)

### 12.3 Ligar cada animacao na acao certa
Arquivo: `src/cenas/Combate.ts`, funcao `executar()` (onde o resultado do dado ja
decide acerto/erro)
Faz: um `switch (acao.id)` chamando a composicao certa da tabela acima — nunca
uma funcao gigante de `if/else`, um `case` curto por acao, cada um 2-4 linhas
porque as primitivas ja fazem o trabalho pesado.
Pronto quando: as 15 acoes de `HABILIDADES`, usadas uma por uma dentro do jogo
de verdade, mostram animacao diferente — nenhuma cai no generico "flash branco"
que serve hoje de placeholder pra tudo.
Tamanho: M

---

## Ordem de execucao deste bloco (9-12)

**9 -> 11.1 -> 11.2 -> 11.3 -> 10 -> 12.1 -> 12.3 -> 12.2 (paralelo, ambiente
`sprites`, pode comecar a qualquer momento depois que 12.1 fixar os nomes de
animacao que o sprite precisa preencher).**

A Fase 9 vem primeiro porque nada abaixo tem onde pendurar `marca` sem ela. As
reacoes (11) vem antes das superficies (10) porque superficie e so mais um
gatilho pra reacao que ja existe — inverter a ordem significaria escrever
`passarTurnoDasSuperficies` sem ter `aplicarMarca` pronto pra ele chamar. A
animacao (12) fecha por ultimo de proposito: e o que o Hugo vai OLHAR primeiro,
mas e o que depende de tudo o resto existir pra ter o que animar.

---

## Atualizacao 2 . a Fase 9 estava errada: nem todo mundo joga igual

A Fase 9 (acima) planejava por `HABILIDADES` uma lista unica de 15 acoes e
mostrar tudo pra qualquer heroi, so filtrando por classe na hora de desenhar a
barra (item 9.2). Isso contradiz o material de mesa
(`docs/referencia/sistema-do-rpg-de-mesa.md`), que **este projeto trata como
fonte da verdade**: cada raca tem um dom proprio, cada classe tem arma +
habilidade + magias proprias, e a maior parte disso vale **1 uso por
AVENTURA**, nao "espera N turnos" (o modelo que a Fase 9 antiga supunha pra
tudo). Esta secao substitui 9.1-9.2; 9.3 (`Bicho` ganha `condicoes`) continua
valendo do jeito que esta. As Fases 10, 11 e 12 nao mudam — sao sobre
superficie, reacao e animacao, ortogonais a quem pode usar o que.

### 0. A tabela real, direto da referencia

| Classe | Arma | Habilidade (1x por luta/cena, ver por linha) | Magias (1 uso cada por AVENTURA) |
|---|---|---|---|
| Cavaleiro | espada curta + escudo | Golpe Trovao — 1x **por luta**, acerta sem rolar dado | nenhuma |
| Mago da Torre | cajado | (a propria lista de magias e a habilidade) | bola-de-fogo, bafo-gelado, cheiro-de-bolo |
| Cacador de Dragao | arco | Olho de Alvo — passivo, +1 no dado mirando longe | nenhuma |
| Amigo dos Bichos | funda + mascote | Fala com Bichos — fora de combate, conversa vira aliado | fala-bicho |
| Ferreiro Andarilho | martelo | Conserta Tudo — 1x **por cena**, fora de combate | remendo |

| Raca | Dom | Onde vive |
|---|---|---|
| Gente do Vale | Nunca Desisto — 1x por aventura, rola o dado de novo | botao extra na tela do dado, so aparece se ainda nao gastou |
| Anao da Fornalha | Casco Duro — comeca com 4 coracoes | passivo puro, ja implementado (`coracoesMax` da raca) |
| Elfo da Folha | Olhos de Coruja — enxerga longe e no escuro | passivo puro, mundo aberto (visao/Fase de luz), nunca aparece no combate |
| Pequenino do Trigo | Pe de Coelho — 1x por aventura, troca 1 OPS por QUASE | botao extra quando o dado cai OPS, so aparece se ainda nao gastou |
| Cria de Dragao | Sopro Quentinho — 1x por aventura, solta fogo | **e uma acao de combate de verdade** — ja modelada no `Provador.ts` como o slot 6, so precisa ir pro heroi certo |

Duas coisas saltam da tabela: **nem toda habilidade e um botao na barra de
combate** (Fala com Bichos e Conserta Tudo acontecem fora de luta, contra um
NPC ou objeto — nunca aparecem entre as acoes de turno) e **golpe sem arma
("soco") e universal**, nao vem de raca nem classe — todo heroi tem, sempre
disponivel, regra ja dita pelo Hugo no comeco deste combate inteiro.

### 1. Classificar cada fonte antes de codar

Arquivo: nenhum ainda — isto e decisao, registrada aqui pra nao virar duvida
de novo no meio da Fase 9.2 revisada.

| Fonte | Vira acao de combate? | Escopo de uso |
|---|---|---|
| arma da classe (golpe) | sim, sempre | por turno, sem limite |
| golpe sem arma | sim, sempre, pra todo heroi | por turno, sem limite |
| magia do heroi (`heroi.magias`) | sim | **1 uso por aventura**, cada uma |
| habilidade de classe "de luta" (Golpe Trovao) | sim | 1 uso por **luta** (reseta a cada combate, nao por aventura — e a unica excecao, porque a propria referencia diz "por luta" nesta e so nesta) |
| habilidade de classe "fora de luta" (Fala com Bichos, Conserta Tudo) | **nao** | nao entra na barra; e uma acao de interacao com NPC/objeto no mundo aberto, fica fora do escopo deste bloco |
| dom de raca "de dado" (Nunca Desisto, Pe de Coelho) | nao like as magias, mas afeta o combate | 1 uso por aventura, botao contextual junto do cartao de dado, nao um slot fixo na barra |
| dom de raca "de ataque" (Sopro Quentinho) | sim | 1 uso por aventura |
| dom de raca passivo (Casco Duro, Olhos de Coruja) | nao | nunca vira acao, so muda numero ou visao |
| item da mochila usavel em combate (pocao, biscoito, sino-espanta...) | sim, os que fazem sentido em luta | consome 1 unidade da mochila (Fase 6 ja previa isso) |

### 2. O tipo unificado e de onde ele le

Arquivo: `src/dados/habilidades.ts` (o mesmo arquivo novo da Fase 9.1 antiga,
o conteudo interno e que muda)
Faz: troca a lista fixa `HABILIDADES: AcaoDeHeroi[]` por uma funcao, no
mesmo espirito de `poderesDoHeroi()`:

```ts
export type EscopoDeUso = "porTurno" | "porLuta" | "porAventura" | "item";

export type AcaoDeHeroi = AcaoDeProva & { escopo: EscopoDeUso };

export function acoesDoHeroi(heroi: Heroi, estado: Estado): AcaoDeHeroi[] {
  const classe = acharClasse(heroi.classe);
  const raca = acharRaca(heroi.raca);
  const acoes: AcaoDeHeroi[] = [
    ACAO_GOLPE_DE_ARMA[classe.arma],         // uma por arma, tabela nova (item 3 abaixo)
    ACAO_SOCO,                                // universal, sempre a mesma
    ...heroi.magias.map((id) => acaoDaMagia(id)),          // escopo "porAventura"
    ...(classe.habilidadeDeLuta ? [classe.habilidadeDeLuta] : []),  // escopo "porLuta"
    ...(raca.acaoDeCombate ? [raca.acaoDeCombate] : []),             // escopo "porAventura"
    ...itensDeCombateNaMochila(estado.mochila),                      // escopo "item"
  ];
  return acoes;
}
```
Pronto quando: um Mago e um Cavaleiro recem-criados, testados no console
(`poderesDoHeroi`-style, sem abrir combate), retornam listas de acao
diferentes — o Mago com 3 magias e cajado, o Cavaleiro com Golpe Trovao e
espada, nenhum com a lista do outro.
Tamanho: M

### 3. `Classe` e `Raca` precisam de 2 campos novos, no fim (nunca reordenar)

Arquivo: `src/dados/conteudo.ts`
Faz: hoje `Classe.habilidade`/`habilidadeTexto` sao so texto pra tela de
criacao — nao ha como o codigo saber se a habilidade e "de luta" (vira botao)
ou "fora de luta" (nunca vira). Acrescentar, **no fim de cada objeto, sem
reordenar os campos existentes**:
```ts
export type Classe = {
  ...  // campos existentes, intocados
  habilidadeDeLuta?: Omit<AcaoDeProva, "id"> & { id: string };  // so Cavaleiro tem
};
export type Raca = {
  ...
  acaoDeCombate?: Omit<AcaoDeProva, "id"> & { id: string };  // so Cria de Dragao tem
};
```
Cavaleiro ganha `habilidadeDeLuta` com `id: "golpe-trovao"`, `escopo:
"porLuta"`, som `golpe-trovao` (ja existe em `GOLPES_ESPECIAIS`, sons.ts —
a arte de som ja antecipou isso). Cria de Dragao ganha `acaoDeCombate` com
`id: "sopro-quentinho"` (o proprio `Provador.ts` ja tem essa acao pronta,
so precisa migrar do slot fixo de teste pro dom da raca). As outras 4 classes
e 4 racas ficam com o campo `undefined` — e por isso ele e opcional.
Pronto quando: so Cavaleiro e Cria de Dragao retornam algo nesses campos;
o resto retorna `undefined` e `acoesDoHeroi` trata isso com o `? [...] : []`
ja mostrado acima.
Tamanho: P

### 4. Tabela de golpe por arma

Arquivo: `src/dados/habilidades.ts`
Faz: as 5 armas de classe (espada-curta, cajado, arco, funda, martelo) + o
soco universal ganham `forma/alcance/atributo` proprios, nao mais um
`golpe-cajado` generico do provador:
```
espada-curta  casa / 1 / forca     -- corpo a corpo, o padrao
cajado        casa / 1 / forca     -- "nao e arma de bater, mas pode" (regra do Hugo)
martelo       casa / 1 / forca     -- mais pesado: dano 1.5x, mesma forma
arco          casa / 5 / esperteza -- a distancia, projetil
funda         casa / 4 / esperteza -- a distancia, projetil, um pouco mais curta que o arco
soco          casa / 1 / forca     -- universal, sem escudo/bonus de arma
```
`icone`/`som` de cada um ja existem em `ICONE`/`ARMAS` (sons.ts) — so
`espada-curta` precisa mapear pro som `espada` que ja esta la (nomes
diferentes, mesmo som).
Pronto quando: um Cacador ataca a 5 casas de distancia com o arco e o
alcance bate; um Cavaleiro tentando o mesmo a 5 casas nao consegue mirar
(fora do alcance de 1 da espada).
Tamanho: P

### 5. `Estado` ganha o contador de uso por aventura

Arquivo: `src/sistemas/estado.ts` (**acrescentar no fim**, regra do
`docs/12-ambientes-paralelos.md` — este arquivo esta na lista de arquivos
perigosos, mexer com cuidado redobrado)
Faz: `usosDeAventura: Record<string, number>` no `Estado` (chave = id da
magia/dom, valor = quantas vezes ja foi usada nesta aventura). Uma funcao
`podeUsar(estado, acao)` e `registrarUso(estado, acao)` em
`sistemas/estado.ts`, ao lado de `marcarDerrotado`/`salvar` que ja existem.
**Decisao em aberto pro Hugo**: quando "aventura" vira zero de novo? A
referencia nao diz explicitamente — a leitura mais simples e a Cristal de
Aurora de cada aventura (3 no jogo inteiro) resetando o contador, mas da pra
tambem resetar a cada fogueira (mais generoso, contradiz "por aventura" ao pe
da letra) ou nunca resetar dentro de uma aventura e so limpar ao terminar
(mais fiel, mais dificil pro jogador que gasta cedo demais). Fica registrado
aqui como pergunta, nao decisao — comecar pela leitura mais fiel (so na
troca de aventura) e ajustar se jogar mal.
Pronto quando: usar Bafo Gelado uma vez e sair do jogo/recarregar mantem o
slot apagado (cinza, "0 usos restantes") — a prova de que persiste em save,
nao so em memoria da cena.
Tamanho: M

### 6. Ligar em `Combate.ts`

Arquivo: `src/cenas/Combate.ts`
Faz: troca `import { ACOES_DE_PROVA } from "../dados/provador"` por
`acoesDoHeroi(estado().heroi, estado())`, chamado uma vez em `create()`.
Cada slot mostra `usosPorCombate`/`usosPorAventura` restantes com o mesmo
pontinho ja usado pros turnos de superficie (Fase 10.2) — nunca numero cru,
regra de legibilidade do jogo inteiro. Slot sem uso restante fica visivel
(o jogador precisa lembrar que aquilo existe) mas acinzentado e sem clique.
Pronto quando: abrir combate de verdade com um Ferreiro mostra golpe de
martelo + soco, sem nenhuma magia (Ferreiro so tem Remendo, que e fora de
luta) — e com um Mago que ja gastou Bafo Gelado numa luta anterior mostra o
slot acinzentado desde o primeiro turno da luta seguinte.
Tamanho: M

### O que fica fora deste bloco, de proposito

Habilidade "fora de luta" (Fala com Bichos, Conserta Tudo) e dom "de dado"
(Nunca Desisto, Pe de Coelho) **nao mexem em `Combate.ts`** — moram no mundo
aberto e no teste geral 1d6, fora do escopo de "cada personagem no combate"
que o Hugo pediu agora. Selo escolhendo "habilidade nova" continua sendo a
Fase 6.2 (`EscolhaDeSelo.ts`), que so entra depois deste bloco: precisa
primeiro existir uma lista de acoes por heroi (item 2 acima) pra ter onde
`push` a habilidade nova escolhida. Animacao por acao continua Fase 12 —
o Hugo pediu pra pensar nisso depois, esta ordem fica registrada aqui de
proposito.
