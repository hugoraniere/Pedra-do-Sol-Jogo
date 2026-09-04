# Plano: caixa fixa e ícones na criação

Dois pedidos, um pequeno e um grande. Nenhum dos dois foi implementado ainda —
isto é o plano, para revisar antes de mexer.

---

## 1. A caixa do herói muda de tamanho (bug, conserto pequeno)

**A causa, exata.** Em `vitrine()` (`src/cenas/Criacao.ts`), a altura da
moldura é calculada assim, a cada troca de raça:

```ts
const alturaRotulo = textoRotulo.height;         // muda com o texto!
const moldura = area.altura - alturaRotulo - ESPACO.xs;
```

`textoRotulo.height` depende de quantas linhas o NOME da raça ocupa. "Elfo da
Folha" cabe numa linha; "Pequenino do Trigo" às vezes quebra em duas. Quando
quebra, `alturaRotulo` cresce, e a moldura — a caixa escura com o boneco —
encolhe para compensar. É por isso que ela parece "respirar" ao trocar de
raça: ela literalmente muda de tamanho, quadro a quadro.

**O conserto.** Reservar uma altura FIXA para o rótulo, do tamanho da pior
linha possível (duas linhas de `TAMANHO.linhaTexto`), em vez de medir o texto
de verdade a cada desenho:

```ts
const alturaRotulo = TAMANHO.linhaTexto * 2 + ESPACO.xs;  // sempre a mesma
```

A caixa passa a ter altura constante em qualquer raça ou classe, e o nome
curto (que já existe, para quando a palavra não cabe) continua resolvendo o
caso de "Pequenino do Trigo": ele simplesmente centraliza na área reservada,
tenha uma linha ou duas.

Isto é uma linha de código. Não depende do item 2 e pode entrar sozinho.

---

## 2. A ficha é texto demais, e falta ícone

### O que existe hoje, e o que falta — levantado, não suposto

| peça | ícone já desenhado? | onde mora |
|---|---|---|
| Atributo (Força/Esperteza/Coração) | **campo existe, ícone não** | `ATRIBUTOS[x].icone` em `conteudo.ts` aponta para `"forca"` e `"esperteza"`, mas esses dois **não existem** em `arte/ui.py`. É um campo morto: nada no código lê `ATRIBUTOS[x].icone` hoje. |
| Coração (vida) | **sim** | `coracao_cheio`/`coracao_vazio`, em `arte/ui.py` |
| Dom de raça (5, um por raça) | **não** | nenhum |
| Habilidade de classe (5, uma por classe) | **não** | nenhum |
| Magia (13 no total) | **parcial** | `arte/icones.py` (frente de combate) desenhou 6 ícones de ação — `cajado`, `punho`, `bola-de-fogo`, `bafo-gelado`, `voz-de-trovao`, `sopro-quentinho` — cobrindo so o que aquela frente precisava para a bancada de prova. **Faltam pelo menos 8** das 13 magias. |

Ou seja: a intenção de ter ícone de atributo já está na base de dados
(`conteudo.ts`) há algum tempo, esperando a arte que nunca foi desenhada. Não é
um recurso novo, é um buraco velho que a tela de criação acabou de deixar
visível.

### O problema de fundo, não só da criação

Se os ícones forem desenhados só para a tela de criação, a Ficha (janela do
herói, seis abas) e o Combate vão repetir o mesmo texto corrido para as mesmas
informações — dom, habilidade, magia aparecem nos três lugares. Ícone
desenhado uma vez, em `arte/ui.py` ou num arquivo novo `arte/icones-poder.py`,
serve para os três, do jeito que `arte/icones.py` já serve criação e combate
para os retratos.

**Proposta: um arquivo por família de ícone, reaproveitado em toda tela que
mostrar aquela informação.**

### O que desenhar

1. **3 ícones de atributo** — Força, Esperteza, Coração-poder (diferente do
   coração de vida, que já existe). Preenche o campo `ATRIBUTOS[x].icone` que
   já existe e está vazio.
2. **5 ícones de dom**, um por raça: Nunca Desisto, Casco Duro, Olhos de
   Coruja, Pé de Coelho, Sopro Quentinho (este último já tem um `acao-` quase
   igual em `arte/icones.py` — reaproveitar, não redesenhar).
3. **5 ícones de habilidade**, um por classe: Golpe Trovão, Três Magias, Olho
   de Alvo, Fala com Bichos, Conserta Tudo.
4. **8 ícones de magia** que faltam, para fechar as 13. `Magia` (o tipo em
   `conteudo.ts`) não tem campo `icone` ainda — precisa ganhar um, do mesmo
   jeito que `ATRIBUTOS` já tem.

23 ícones novos ao todo, 6 já prontos e reaproveitáveis. Comparado aos 5
estudos anteriores desta série, isto é pequeno — mas é conteúdo (13+5+5+3),
não técnica, e cada um pede uma leitura clara em 16 px: um raio para Golpe
Trovão, uma pegada de coelho para Pé de Coelho, um alvo para Olho de Alvo. Vou
desenhar um esboço antes de gerar os 23 de uma vez, do jeito que a `skill
desenhar-sprite` manda: olhar ampliado antes de aprovar.

### Como isso muda a "ficha" da criação

Hoje (`ficha()` em `Criacao.ts`) é texto corrido:

```
Pequenino do Trigo · +1 CORACAO · 3 coracoes
Pe de Coelho: Uma vez por aventura voce troca um OPS por um QUASE.
```

Proposto: cada linha vira uma linha com ícone à esquerda e o texto encostado
nele, no estilo que `seletor()` já usa para as linhas de aparência (rótulo +
controle numa faixa medida, nunca coordenada solta):

```
[❤️ icone-coracao]  +1 CORACAO · 3 coracoes
[🐇 icone-pe-coelho] Pe de Coelho: troca um OPS por um QUASE, uma vez por aventura.
```

Isso não é mudar o texto, é dar a ele uma âncora visual. O `linhasDaFicha()`
que já quebra o texto pela largura continua igual; só a régua de `x` desloca
o parágrafo para abrir espaço ao ícone, e a altura de cada linha cresce o
suficiente para o ícone de 16 px caber.

### Ordem sugerida

1. **A caixa fixa** (item 1) — um commit pequeno, sem dependência.
2. **Os 3 ícones de atributo** — o gancho já existe em `conteudo.ts`, é o
   menor passo que já entrega ícone na tela de criação.
3. **Os 5 dons + 5 habilidades** — mesma técnica, cobre as duas primeiras
   telas de criação (raça e classe) por completo.
4. **`Magia` ganha campo `icone`**, e os 8 que faltam são desenhados —
   fecha a terceira tela e alimenta Ficha e Combate de graça.
5. **`ficha()` em `Criacao.ts` passa a desenhar com ícone.** Só depois de 2-4
   estarem prontos, senão a régua fica pela metade.
6. **Levar o mesmo padrão para a Ficha (janela) e o Combate**, que hoje
   mostram a mesma informação em texto puro — fora do escopo deste plano, mas
   é o motivo de desenhar os ícones num arquivo compartilhado desde já.

---

## O que este plano não decide

- **O desenho de cada ícone em si** — isso é o próximo passo, com esboço em
  `ferramentas/esbocar-*.py` antes de qualquer coisa entrar em produção, como
  o resto da série.
- **Se a Ficha e o Combate mudam agora ou depois** — item 6 é intencionalmente
  a fronteira de outro dia, para este plano não crescer para três telas de
  uma vez.
