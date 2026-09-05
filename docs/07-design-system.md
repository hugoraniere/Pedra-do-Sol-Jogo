# Design system e auditoria de UI

## Por que existe

A UI estava sendo posicionada com numero magico espalhado pelas cenas. O resultado
foi previsivel: botao em cima do titulo do painel, botao de voltar cobrindo o texto
explicativo, rotulo vazando para fora do botao. Sempre que a soma de dois numeros
mudava, alguma coisa colidia em silencio.

A solucao tem duas partes: um sistema de layout que torna a colisao dificil de
acontecer, e um auditor que encontra a que ainda acontecer.

## Regra principal

**Nenhuma cena escreve coordenada Y na mao.** Se voce se pegou somando 34 com 18 para
achar onde vai um botao, use a pilha.

## A resolucao logica e um valor qualquer

Isto mudou, e muda como voce escreve UI daqui pra frente.

O jogo **enche a area util do navegador, sempre**. Nao existe tarja preta e nao
existe o jogo ocupando um pedaco da janela. Como a escala tem que ser inteira
(escala quebrada faz a arte de pixel sair irregular e o mapa piscar ao andar),
quem se adapta e a resolucao: a escala e escolhida primeiro e o tamanho logico e
o que sobra da divisao. Ver `src/sistemas/visao.ts`.

Na pratica:

| Janela | Visao NORMAL | Visao PERTO | Visao LONGE |
|---|---|---|---|
| 1440 x 900 | 4x, 360 x 225 | 5x, 288 x 180 | 3x, 480 x 300 |
| 1920 x 1080 | 5x, 384 x 216 | 6x, 320 x 180 | 4x, 480 x 270 |
| iPad deitado, 1180 x 820 | 3x, 394 x 274 | 4x, 295 x 205 | 2x, 590 x 410 |
| ultrawide, 2560 x 1080 | 5x, 512 x 216 | 6x, 427 x 180 | 4x, 640 x 270 |

**`LARGURA` e `ALTURA` nao sao mais uma de tres opcoes conhecidas.** Sao dois
numeros que voce nao pode prever. As consequencias:

- Nada de largura de painel escrita na mao. Use `Math.min(desejada, LARGURA - ESPACO.xl * 2)`,
  como `larguraCaixa()` na Pausa e `larguraDaJanela()` em `janela.ts`.
- Antes de empilhar conteudo, pergunte quanto cabe: `alturaUtilDaJanela()`.
  Mostre o que couber, na ordem de importancia.
- Toda cena de interface chama `refazerAoRedimensionar()` no `create`. Sem isso
  ela fica com o desenho do tamanho antigo quando a janela muda.
- A camera do Mundo tambem depende disso: quando o mundo visivel fica maior que
  o mapa (a vila tem 576 x 384), o limite da camera cresce ate o tamanho da tela,
  centrado no mapa. Sem isso o Phaser encosta o mapa no canto. Ver
  `limitarCamera()` em `src/cenas/Mundo.ts`.

O piso e o teto estao em `visao.ts`: **nenhuma tela precisa saber caber em menos
que 256 x 160**, que e a menor resolucao que este projeto ja auditou, e nenhuma
passa de 800 x 480, para o heroi nao virar uma formiga. Quando os dois brigam,
ganha o piso: fonte pequena e feio, botao fora da tela deixa o Lele preso.

`npm run auditar` roda a criacao inteira nos tres niveis de visao justamente
porque e ai que a conta de altura aperta.

## As pecas, em `src/sistemas/design.ts`

### Escala de espacamento

```
ESPACO = { xs: 2, sm: 4, md: 6, lg: 10, xl: 16 }
```

Sempre multiplo de 2, porque a tela e pixel art e meio pixel vira borrao.

### Tamanhos

```
TAMANHO = {
  botao: 18, botaoPequeno: 14,
  linhaTexto: 10, linhaTitulo: 18,
  chapa: 14, paddingPainel: 8, paddingTela: 10,
}
```

### `caixa()` , painel que sabe o proprio tamanho

Recebe a largura e a **altura do conteudo**, e calcula a altura do painel sozinha.
A chapa do titulo fica inteira ACIMA do painel, com folga, entao nada de dentro
encosta nela. Devolve o retangulo da area util, ja descontado o padding.

```ts
const area = caixa(this, { largura: 208, alturaConteudo, titulo: "PAUSA" });
```

### `pilha()` , empilha de cima para baixo

Recebe a area util e vai reservando altura. Cada reserva devolve o retangulo daquele
elemento e anda o cursor. Nunca ha dois elementos no mesmo lugar, por construcao.

```ts
const p = pilha(area, ESPACO.md);
const linhaBotao = p.reservar(TAMANHO.botao);
const linhaTexto = p.reservar(alturaDoTexto(3), ESPACO.lg);
```

### `quebrar()` e `alturaDoTexto()`

Quebram o texto em linhas antes de desenhar, para a altura entrar na conta da caixa.
Assim o painel cresce quando o texto cresce, em vez de o texto vazar.

## O auditor, em `src/sistemas/auditoria.ts`

Percorre a cena e reclama de quatro coisas:

| Problema | O que e |
|---|---|
| `sobreposicao` | dois textos, ou texto e botao, ocupando o mesmo lugar |
| `fora-da-tela` | elemento passando da borda de 320 x 192 |
| `fora-do-painel` | elemento vazando para fora do painel em que esta |
| `atras-do-painel` | elemento desenhado antes do painel, entao invisivel |

Para o auditor enxergar um elemento ele precisa estar marcado. `texto()` e `botao()`
ja se marcam sozinhos. Se voce criar um elemento na mao, use `marcar(obj, "texto")`.

Sombra de texto e fundo decorativo sao marcados como `"fundo"` de proposito, senao
toda sombra viraria um falso positivo.

### Usar no console

O jogo expoe `auditarUI()`. Abra o console do navegador em qualquer tela e chame:

```js
auditarUI()
```

## A auditoria automatica

```bash
npm run auditar
```

Abre o jogo num navegador de verdade, percorre as doze telas, chama o auditor em cada
uma e escreve `ferramentas/auditoria-ui.md`. Tambem salva um screenshot de cada tela
em `ferramentas/telas/`, o que serve para revisar a olho o que o auditor nao pega,
como hierarquia visual e espaco mal distribuido.

Sai com codigo 1 se achar qualquer problema, entao da para plugar em CI depois.

**Rode isso antes de dizer que uma tela esta pronta.** Foi assim que os dois bugs
que o Hugo apontou nos screenshots foram encontrados e corrigidos, mais um terceiro
que ninguem tinha visto: na tela de escolher cabelo, a grade de botoes invadia a
navegacao quando os nomes eram longos.

## Como adicionar uma tela nova

1. Calcule a altura do conteudo somando `TAMANHO` e `ESPACO`, nunca chutando.
2. `caixa()` para o painel, `pilha()` para o conteudo.
3. `npm run auditar` e conferir o screenshot da tela nova.
