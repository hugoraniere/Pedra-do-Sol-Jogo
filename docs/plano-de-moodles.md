**As 4 fases de codigo deste plano estao FEITAS e testadas** (ver `FRENTES.md`,
entrada de 2026-09-05, pros commits de cada fase). A Fase 5 (esta nota, mais o
paragrafo em `CLAUDE.md`) e a documentacao da propria reversao de decisao. O
que fica de fora de proposito, com o motivo escrito: frio/molhado (secao
"Escopo desta rodada" abaixo) e o icone de aviso no topo da tela (secao 5,
"De proposito fora desta fase"). O texto abaixo e o plano ORIGINAL, mantido
como registro de decisao — os numeros exatos (taxas, limiares) batem com o
que foi construido.

# Moodles: fome e sono fora de combate (frio fica pra depois)

## Contexto

O Hugo quer trazer "moodles" estilo Project Zomboid — indicadores de status
do heroi que se degradam com o tempo fora de combate, comecando por fome,
sono/cansaco e frio/molhado. Isso bate com a propria identidade nova do jogo
(CLAUDE.md, "O que estamos fazendo": "um RPG de sobrevivencia... no tom seco
de jogos como Project Zomboid"), decidida depois do merge do `ambiente/
combate`.

**Isto reverte uma decisao anterior.** `docs/plano-de-itens-e-equipamento.md`
(secao 3) excluiu fome/sede de proposito: "Nenhum esta na mesa, e todos
pesam contra Legibilidade/Densidade". Essa decisao e de ANTES do jogo virar
oficialmente tom Zomboid — a reversao e consciente, motivada pela mudanca de
identidade, e vai ficar registrada como tal (nao um acidente).

Nao existe nenhum sistema de moodle/fome/sono em nenhuma branch hoje.
`sistemas/condicoes.ts` existe mas e proprio de COMBATE (decai por turno de
luta) — nao serve pra algo que acumula com tempo de jogo fora dele.

## Escopo desta rodada: fome + sono. Frio fica de fora, por 3 motivos concretos

1. "Esquentar perto da fogueira" pediria checagem de distancia
   jogador↔fonte-de-luz que **nao existe** — `fontesDeLuz` em `Mundo.ts` e
   hoje puramente visual (so abre furo no overlay do ceu). Seria feature
   nova, nao reuso.
2. Colisao de nome: `condicoes.ts` ja tem `"molhado"`/`"congelado"` como
   condicao de COMBATE. Um moodle "frio" no mundo aberto com os mesmos
   nomes, sem ligacao real, confunde quem le o codigo depois.
3. Colisao de frente: outra conversa esta mexendo em `Mundo.ts` AGORA,
   perto do trecho de luz/fogueira (FRENTES.md, "fogo de verdade"). Entrar
   no mesmo trecho pra ligar frio e pedir conflito de merge sem precisar.

Fome + sono sozinhos ja validam a arquitetura inteira (acumulo, limiar,
penalidade, reset por interacao). Frio entra numa proxima rodada, depois que
"fogo de verdade" estabilizar e existir de fato uma checagem de proximidade
pra reusar.

## Arquitetura

### 1. Estado — `src/sistemas/estado.ts`

Dois campos novos em `Estado`/`VAZIO`, 0-100 (0 = acabou de comer/dormir):
```ts
/** 0 = acabou de comer, 100 = faminto critico. Sobe com o RELOGIO de jogo
 *  (nao minutos reais de sessao) — ver sistemas/moodles.ts. Comer reseta
 *  pra 0. Save antigo sem o campo entra em 0 via merge raso de
 *  abrirEspaco(), mesmo padrao de relogio/afinidades. */
fome: number;
/** 0 = descansado, 100 = exausto critico. Dormir numa cama reseta pra 0. */
sono: number;
```
`VAZIO`: `fome: 0, sono: 0` — o heroi chega alimentado e descansado.

### 2. Novo `src/sistemas/moodles.ts` — puro, sem Phaser, no espirito de `sistemas/tempo.ts`

```ts
import { estado } from "./estado";
import { MINUTOS_POR_DIA, MINUTOS_REAIS_POR_DIA_DE_JOGO } from "../dados/tempo";

const MINUTOS_JOGO_POR_MS = MINUTOS_POR_DIA / (MINUTOS_REAIS_POR_DIA_DE_JOGO * 60000);

// fome leva ~2 dias de jogo (2880 min) pra ficar critica; sono leva ~1 dia
// (1440 min) — dormir uma vez por ciclo dia/noite e o ritmo que a cama ja
// pede emprestado do relogio existente. Com o numero de hoje (20 min reais
// = 1 dia de jogo): sono critico em ~20 min reais de jogo continuo, fome
// critica em ~40 min (duas noites sem comer).
const TAXA_FOME = 100 / 2880;
const TAXA_SONO = 100 / 1440;

export const LIMIAR_ALERTA = 60;
export const LIMIAR_CRITICO = 90;

export function avancarMoodles(deltaMs: number) {
  const e = estado();
  const deltaMin = deltaMs * MINUTOS_JOGO_POR_MS;
  e.fome = Math.min(100, e.fome + deltaMin * TAXA_FOME);
  e.sono = Math.min(100, e.sono + deltaMin * TAXA_SONO);
}

export type Moodle = "fome" | "sono";
export function nivelDoMoodle(m: Moodle): "normal" | "alerta" | "critico" {
  const v = estado()[m];
  return v >= LIMIAR_CRITICO ? "critico" : v >= LIMIAR_ALERTA ? "alerta" : "normal";
}
export function algumMoodleCritico(): boolean {
  return nivelDoMoodle("fome") === "critico" || nivelDoMoodle("sono") === "critico";
}
```
Por que game-minutes e nao minutos reais de sessao: fome/sono sao relogio DE
FICCAO ("quantas horas desde a ultima refeicao"), entao escalam com
`MINUTOS_REAIS_POR_DIA_DE_JOGO` — se esse numero de balanceamento mudar,
fome/sono acompanham sozinhos em vez de dessincronizar do ciclo dia/noite.
Taxas isoladas em duas constantes, facil de ajustar depois de jogar.

Chamado em `Mundo.ts`, logo depois de `avancarRelogio(delta)` (mesmo delta,
mesmo lugar — herda de graca a garantia que ja existe ali: fome/sono nao
sobem em dialogo nem em combate, so andando pelo mundo).

### 3. Comida — sem loja nova, sem NPC novo

`LOJA` (`dados/conteudo.ts`) e catalogo morto hoje (nenhuma cena vende nada;
item chega na mochila via `efeito: () => guardar(...)` num dialogo, mesmo
padrao da pocao-morango do marinheiro). Um item novo, mesmo padrao:
```ts
{ id: "pao", nome: "Pao da Padeira", preco: 2, texto: "Ainda quente. Mata a fome por um bom tempo." }
```
Efeito em `sistemas/consumiveis.ts`, mesmo mapa `EFEITO` que ja cuida de
`pocao-morango`/`pocao-grandona`:
```ts
"pao": () => { estado().fome = 0; },
```
Concedido pela fala da padeira (`dialogos.ts`, hoje so um flavor text que da
1 moeda) — vira `efeito: () => guardar("pao")`, mesmo padrao do bau/varal.

**Correcao obrigatoria em `Ficha.ts`** (linha ~691): o botao USAR da mochila
tem um gate hard-coded de coracao (`st.coracoes < st.coracoesMax`) — comida
nunca vai satisfazer essa condicao, entao o botao nunca apareceria pra pao.
Trocar por uma checagem generica em `consumiveis.ts` (`precisaAgora(id):
boolean`, cada efeito decide: coracao pergunta `coracoes < coracoesMax`,
pao pergunta `fome > 0`).

### 4. Sono — so estender o que a cama ja faz

`dialogos.ts`, entrada `cama` (ja existe, ja cura coracao ao interagir):
- `efeito` da variante `padrao` ganha `st.sono = 0` junto com o coracao.
- variante `ja-cheio` (hoje so olha `coracoes >= coracoesMax`) passa a
  tambem exigir `sono` baixo — senao "Voce nem esta cansado" apareceria com
  sono no talo so porque o coracao esta cheio.

Zero arquivo novo aqui, so as duas linhas da entrada que ja existe.

### 5. Mostrar pro jogador — reusa a aba EU da Ficha, sem UI nova

A barra de topo (`Interface.ts`) ja esta cheia (coracoes, moeda, selo, icone
de periodo, nome, engrenagem) — nao mexer nela nesta fase. `Ficha.ts` ja tem
o componente certo: a aba EU e uma lista de "grupos" de `Bloco`, e
`chip()`/`chipsNaLinha()` (`design.ts`) ja existem pra "pilula com uma
palavra" (a aba PODERES ja usa esse padrao). Um grupo novo, sem peca de UI
nova, sem arte nova:
```ts
[
  { tipo: "titulo", conteudo: "COMO VOCE ESTA" },
  chipsNaLinha([rotuloDoNivel("fome", nivelDoMoodle("fome")), rotuloDoNivel("sono", nivelDoMoodle("sono"))]),
]
```
Rotulo em PALAVRA, nunca numero cru ("Bem alimentado" / "Com fome" /
"Faminto"), cor `painel-ouro` quando critico pra chamar atencao sem icone
novo — bate com Legibilidade.

**De proposito fora desta fase:** icone no topo (tipo o de periodo) que so
aparece quando ha moodle em alerta/critico. Fica documentado aqui como
proximo passo natural se o Hugo, jogando, sentir falta de aviso ambiente —
precisaria de 2 icones novos em `arte/ui.py` (skill `desenhar-sprite`).

### 6. Penalidade quando fome OU sono estao criticos

Nao existe hoje nenhum mecanismo de "modificador no dado" pra reusar —
confirmado: `biscoito` ("+1 no proximo dado") esta na LOJA mas nunca e lido
em lugar nenhum, e `heroiCondicoes` em `Combate.ts` so guarda 3 flags
booleanas sem numero (escondido/protegido/rapido). Menor custo, sem
inventar sistema generico: penalidade fixa de -1 em TODOS os atributos,
aplicada uma vez ao montar o combate:
```ts
this.atributos = poderesDoHeroi(ficha);
if (algumMoodleCritico()) {
  (Object.keys(this.atributos) as Atributo[]).forEach((a) => (this.atributos[a] -= 1));
}
```
Como todo `testar()` do arquivo le `this.atributos[...]`, o ajuste propaga
sozinho pros tres pontos que ja rolam dado. Fome E sono criticos ao mesmo
tempo somam o MESMO -1 (nunca -2) — mesma filosofia de "condicao nunca
empilha" que `condicoes.ts` ja usa. Fala honesta ao entrar em combate nesse
estado (tom seco, sem julgar: "Voce entra faminto. Os golpes saem mais
fracos.").

### 7. Registrar a reversao de decisao

`CLAUDE.md`, secao de regras/divergencias: uma nota curta com data
explicando que fome/sono entram agora, revertendo a exclusao de
`docs/plano-de-itens-e-equipamento.md` (secao 3), motivada pela virada de
tom Zomboid ja registrada ali. Mesmo padrao que toda outra divergencia do
projeto ja segue.

## Ordem de implementacao (fases pequenas, cada uma com commit e teste proprios)

1. **Arquitetura generica**: campos `fome`/`sono` em `Estado`/`VAZIO`,
   `sistemas/moodles.ts` inteiro, hook em `Mundo.ts` depois de
   `avancarRelogio`. Sem UI, sem efeito ainda — so a regua subindo,
   verificavel via `estado()` no console.
2. **Fome**: item `pao` em `LOJA`, efeito em `consumiveis.ts`, gancho na
   fala da padeira, correcao do gate em `Ficha.ts`, grupo "COMO VOCE ESTA"
   na aba EU mostrando fome. Jogavel ponta a ponta: anda, fica com fome,
   come, reseta.
3. **Sono**: estender `efeito`/`ja-cheio` da `cama`, segundo chip na aba EU.
4. **Penalidade critica em combate**: hook em `Combate.ts` + fala de
   entrada. So depois de fome/sono ja visiveis e testados sozinhos, pra
   confirmar que a regua sobe no ritmo certo antes de ligar a consequencia.
5. **Documentar** a reversao em CLAUDE.md.

Frio/molhado: registrado como fora de escopo (secao acima), motivo escrito,
nao uma decisao silenciosa.

## Verificacao

1. `npm run build` limpo em cada fase.
2. Console: forcar `estado().fome = 95` e conferir que a aba EU mostra
   "Faminto" na cor certa; comer o pao reseta pra 0 e o chip volta ao
   normal. Mesmo teste pra sono via cama.
3. Deixar o relogio avancar bastante (forcar `Mundo.travarRelogioParaAuditoria`
   varias vezes, ou esperar) e confirmar que fome/sono NAO sobem durante
   dialogo/combate, so andando no mundo.
4. Entrar em combate com fome ou sono forcados pra critico e confirmar a
   fala de aviso e que os testes ficam mais dificeis (comparar um ataque
   com e sem a penalidade, mesmo dado forcado se possivel).
5. `npm run auditar`/`contraste` — a aba EU ganha altura nova, conferir que
   nao estoura em nenhuma visao (perto/normal/longe).
6. Confirmar que um save sem os campos `fome`/`sono` abre sem erro e nasce
   em 0 (merge raso de `abrirEspaco`).
