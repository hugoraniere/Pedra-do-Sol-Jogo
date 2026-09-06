# Inventário de ícones — o que existe, o que falta, o que confunde

Ponto de partida para a virada de estética pedida em 2026-09-05: tipografia
deixa de ser a fonte de bitmap pixelada (`arte/fonte.py`), e os ícones deixam
de ser pixel art de 16×16 (`arte/ui.py`, `arte/icones.py`, `arte/itens.py`)
para virar uma família de ícones nova, desenhada com cuidado, autoexplicativa
à primeira olhada. Este documento começou como só o levantamento; a seção
"Decisão de 2026-09-05" logo abaixo registra o que já foi fechado depois de
várias rodadas de piloto com o Hugo. O resto do documento (o mapa original)
continua valendo como referência de cobertura. Ver "O que este documento não
decide", no fim, pro que ainda está em aberto.

## Decisão de 2026-09-05: fonte, moldura e cor

Depois de testar desenho próprio (rejeitado — "tá tudo muito ruim") e depois
ícones prontos recolorados, o piloto fechou nestes pontos. Ver o piloto de
verdade (artefato publicado durante a conversa, ícones em
`ferramentas/piloto-icones/*.svg`) pra cada escolha individual.

- **Fonte dos ícones**: [game-icons.net](https://game-icons.net/) (Lorc,
  Delapouite e outros), CC BY 3.0 — vetor pronto, recolorido pra paleta do
  jogo, nunca redesenhado do zero. Isso diverge da regra "Nada de arte
  solta" do `CLAUDE.md` (toda arte hoje nasce de `arte/*.py`, pixel a
  pixel) de propósito — exceção aberta só pra ícone, já registrada lá.
  **RESOLVIDO em 2026-09-06**: a linha de crédito exigida pela licença
  ("Ícones por Lorc e Delapouite - game-icons.net") está na aba
  CONFIGURACOES da Pausa (`src/cenas/Pausa.ts`, `CREDITO_ICONES`) — some
  numa janela muito baixa, igual o parágrafo explicativo do zoom, mas
  aparece em qualquer tamanho razoável. Os 18 ícones já usados pelo jogo
  (5 de atributo + 13 de magia) saíram de `ferramentas/piloto-icones/` e
  foram pra `public/assets/icones/`, porque só o que está em
  `public/assets/` entra no build de produção — antes disso, o ícone
  carregava em dev mas dava 404 silencioso em `npm run build`.
- **Tratamento visual**: silhueta preenchida + 1 cor de destaque + contorno
  `#2C2440` (a mesma TINTA do jogo hoje), sempre em cima do traçado original
  do ícone, viewBox 512×512.
- **Moldura**: uma só, pra tudo — quadrado fino de canto arredondado (testado
  e rejeitado antes: círculo/hexágono/quadrado-chanfrado por categoria, três
  formas diferentes). A categoria não é mais forma, é cor.
- **Cor por categoria**:
  - **Atributo** e **ação básica** (golpe, andar, atirar — família que ainda
    não existe de verdade no jogo) dividem o mesmo cinza neutro `#96A0B8`.
  - **Magia** ganha cor por **elemento**, não mais uma cor solta por feitiço:

    | elemento | cor | magias de hoje |
    |---|---|---|
    | Fogo | `#F2802B` | Bola de Fogo |
    | Gelo / Água | `#7EC4F2` | Bafo Gelado |
    | Eletricidade | `#F5B62B` | Voz de Trovão |
    | Natureza | `#3E9B62` | Cresce-Grama, Língua Selvagem |
    | Ar / Vento | `#CDE9F8` | Rajada |
    | Sombra | `#4A3E64` (ícone usa tinta clara `#8B7FB0` pra legibilidade) | Véu de Sombra |
    | Luz | `#F7E7B8` | Fogo-Fátuo |
    | Necromancia | `#7B5AC4` | reservado — nenhuma magia hoje |
    | Neutra / utilitária | `#B08658` | Aderência, Barreira, Atrair, Remendo, Salto Longo |

    Já aplicado em `MAGIAS[].cor` (`src/dados/conteudo.ts`) pras 13 magias,
    mesmo as que ainda não têm ícone novo desenhado — a cor certa já vale
    hoje, independente do ícone.

### Status por ícone (dos que entraram no piloto)

| item | ícone | status |
|---|---|---|
| Fogo-Fátuo | Spark Spirit (Lorc) | ✅ aprovado |
| Aderência | Gecko (Lorc) | ✅ aprovado |
| Véu de Sombra | Cowled (Lorc) | ⚠️ aposta, não confirmado — "invisibilidade" de verdade não existe pronta no acervo |
| Barreira | Aura (Lorc) | ✅ aprovado |
| Atrair (ex-Cheiro de Fogueira) | Fluffy Swirl (Lorc) | ❌ rejeitado, sem substituto — candidato a desenho próprio |
| Espantalho, Serpente, Grulo, Bruxa, Cavaleiro de Cinzas, Brasanegra | ver piloto | ✅ aprovados (retratos novos) |
| Força, Destreza, Inteligência | Biceps, Crosshair, Brain | ✅ aprovados |
| Agilidade | Boots (Lorc) — trocado de Focused Lightning | ✅ aprovado |
| Vitalidade | Bordered Shield (Lorc) | ⚠️ aposta, não confirmado — "coragem, fazer amigo, resistir" não cabe direito num escudo |

**Status dos 8 ícones de magia restantes** (criados em 2026-09-06):
- Cresce-Grama (Sprout, Lorc) — ✅ criado, Natureza #3E9B62
- Salto Longo (Boot, Lorc) — ✅ criado, Neutra #B08658
- Remendo (Wrench, Lorc) — ✅ criado, Neutra #B08658
- Língua Selvagem (Mouth, Lorc) — ✅ criado, Natureza #3E9B62
- Rajada (Wind Tornado, Lorc) — ✅ criado, Ar #CDE9F8
- Bafo Gelado (Snowflake, Lorc) — ✅ criado, Gelo #7EC4F2
- Voz de Trovão (Lightning Bolt, Lorc) — ✅ criado, Eletricidade #F5B62B
- Bola de Fogo (Flame, Lorc) — ✅ criado, Fogo #F2802B

Todos os 13 ícones de magia agora têm uma versão na família nova em `public/assets/icones/` (produção de verdade desde 2026-09-06, ver "Decisão de 2026-09-05" acima).

**Ainda fora do piloto**: a mecânica de "ações básicas" (golpe/andar/atirar)
em si, que só existe como placeholder visual — não tem regra de jogo ainda.

---

## Por que agora

Hoje boa parte dos ícones de magia é o mesmo desenho repetido sem relação com
o que a magia faz (ver a tabela de Magias abaixo) — o sintoma exato que
motivou este documento: "os ícones são confusos e não são auto-explicativos".
Antes de desenhar qualquer ícone novo, o primeiro passo é este: mapear TUDO
que precisa de ícone, o que já existe, e onde a linguagem visual atual já
falha — para a família nova nascer resolvendo os buracos reais, não só
trocando o estilo por cima dos mesmos buracos.

---

## 1. Atributos (5)

Fonte: `ATRIBUTOS` em `src/dados/conteudo.ts`. Aparecem na ficha do herói e
(quando a tela de criação ganhar ícone) na criação de personagem.

| atributo | ícone hoje | arquivo/campo | problema |
|---|---|---|---|
| Força | `forca` | `arte/icones.py` → `FORCA` | ok, desenho próprio |
| Destreza | `esperteza` (emprestado) | `ATRIBUTOS.destreza.icone` | **sem ícone próprio** |
| Agilidade | `esperteza` (emprestado) | `ATRIBUTOS.agilidade.icone` | **sem ícone próprio** |
| Inteligência | `esperteza` (emprestado) | `ATRIBUTOS.inteligencia.icone` | **sem ícone próprio** |
| Vitalidade | `coracao_cheio` (emprestado de `ui.py`) | `ATRIBUTOS.vitalidade.icone` | **sem ícone próprio** — reusa o coração de vida, que já significa outra coisa |

**4 de 5 não têm identidade visual própria.** Três deles mostram o mesmo
desenho ("esperteza"), que é justamente o nome antigo que a revisão de
2026-09-04 explodiu em três atributos porque fazia três trabalhos escondidos
— o ícone nunca acompanhou essa divisão.

---

## 2. Dons de raça (5)

Fonte: `RACAS[].dom` / `RACAS[].icone` em `conteudo.ts`, desenhos em
`arte/icones.py` (`DONS`).

| raça | dom | ícone | observação |
|---|---|---|---|
| Gente do Vale | Nunca Desisto | `dado-5` (emprestado de `icones.py`, faces do dado) | intencional — "rolar de novo é o dado" |
| Anão da Fornalha | Casco Duro | `dom-casco-duro` | próprio |
| Elfo da Folha | Olhos de Coruja | `dom-olhos-de-coruja` | próprio |
| Pequenino do Trigo | Pé de Coelho | `dom-pata-de-coelho` | próprio |
| Cria de Dragão | Sopro Quentinho | `acao-sopro-quentinho` (emprestado do combate) | intencional — mesmo sopro, mesmo desenho |

Cobertura completa. Os dois "emprestados" são reaproveitamento deliberado
(mesmo conceito, não gambiarra) — vale manter a mesma lógica na família nova.

---

## 3. Habilidades de classe (5)

Fonte: `CLASSES[].habilidade` em `conteudo.ts`, desenhos em `arte/icones.py`
(`HABILIDADES`).

| classe | habilidade | ícone |
|---|---|---|
| Cavaleiro | Golpe Trovão | `habilidade-golpe-trovao` |
| Mago da Torre | Três Magias | `habilidade-tres-magias` |
| Caçador de Dragão | Olho de Alvo | `habilidade-olho-de-alvo` |
| Amigo dos Bichos | Fala com Bichos | `habilidade-fala-bicho` |
| Ferreiro Andarilho | Conserta Tudo | `habilidade-conserta-tudo` |

Cobertura completa.

---

## 4. Magias (13) — o problema mais grave

Fonte: `MAGIAS` em `conteudo.ts` (nome/texto) + `TABELA_DE_MAGIA` em
`src/sistemas/acao.ts` (ícone de combate, índice na folha `icones.png`).

| id | nome em jogo | ícone hoje | próprio? |
|---|---|---|---|
| `bola-de-fogo` | Bola de Fogo | `acao-bola-de-fogo` | sim |
| `bafo-gelado` | Bafo Gelado | `acao-bafo-gelado` | sim |
| `voz-de-trovao` | Voz de Trovão | `acao-voz-de-trovao` | sim |
| `luzinha` | Fogo-Fátuo | `acao-punho` (genérico) | **não** |
| `cresce-grama` | Cresce-Grama | `acao-punho` (genérico) | **não** |
| `pulo-de-sapo` | Salto Longo | `acao-punho` (genérico) | **não** |
| `dedo-colante` | Aderência | `acao-punho` (genérico) | **não** |
| `remendo` | Remendo | `acao-punho` (genérico) | **não** |
| `escudo-de-bolha` | Barreira | `acao-punho` (genérico) | **não** |
| `cheiro-de-bolo` | Cheiro de Fogueira | `acao-punho` (genérico) | **não** |
| `fala-bicho` | Língua Selvagem | `acao-punho` (genérico) | **não** |
| `sumir-sumindo` | Véu de Sombra | `acao-punho` (genérico) | **não** |
| `chama-vento` | Rajada | `acao-punho` (genérico) | **não** |

**10 das 13 magias mostram um punho fechado** — o ícone de "soco sem arma" —
não importa se a magia ilumina, conserta, esconde ou fala com bicho. Isto é
a origem literal da queixa "os ícones são confusos": o jogador vê o mesmo
desenho para Fogo-Fátuo (uma luz) e Véu de Sombra (ficar invisível), duas
coisas opostas.

Isto já tinha sido mapeado parcialmente em
[`plano-de-icones-e-diagramacao.md`](plano-de-icones-e-diagramacao.md)
("faltam pelo menos 8 das 13") — o levantamento aqui confirma o número exato
(10) na versão atual do código.

---

## 5. Armas (11 base + 6 encontradas = 17 ids, 8 silhuetas)

Fonte: `ARMAS` em `conteudo.ts`, desenhos em `arte/itens.py`
(`ARMAS_ICONE`).

| forma (silhueta própria) | ids que usam essa forma |
|---|---|
| Espada | `espada-curta`, `lamina-aurora` (dourada), `lamina-guarda-vila` (azul) |
| Escudo | `escudo`, `escudo-espelho` (prateado) |
| Arco | `arco`, `arco-lua` (pálido), `arco-trancado-teia` (teia) |
| Cajado | `cajado`, `cajado-bruxa-espinho` (roxo) |
| Martelo | `martelo`, `martelo-de-cinza` (cinza) |
| Machado | `machado` |
| Adaga | `adaga`, `adaga-da-serpente` (verde) |
| Funda | `funda`, `funda-de-presa` (pedra) |

Cobertura completa — 8 silhuetas próprias, variantes reaproveitam a forma e
trocam só a cor (o mesmo "reaproveitamento com sentido" dos dons). Modelo
razoável para levar adiante na família nova.

---

## 6. Itens da loja (12)

Fonte: `LOJA` em `conteudo.ts`, desenhos em `arte/itens.py` (`ITENS`).

Poção de Morango, Poção Grandona, Corda Saltitante, Lanterna Vaga-lume,
Biscoito Mágico, Bota do Vento, Capa Camaleão, Pena da Fênix, Sino
Espanta-Monstro, Mapa Que Fala, Saco Sem Fundo, Chave Mestra.

Cobertura completa, todos com desenho próprio e reconhecível.

---

## 7. Materiais de monstro (4)

Fio de Teia Doce, Palha de Espantalho, Presa de Névoa, Cinza de Armadura.
Cobertura completa.

## 8. Armaduras (5)

Colete de Couro da Vila, Manto de Teia, Capuz de Névoa, Couraça de Cinza,
Manto do Pântano. Cobertura completa.

## 9. Acessórios (5)

Bracelete de Palha Trancada, Anel da Teia, Presa de Névoa Lapidada, Pingente
do Sino da Vila, Broche do Troll. Cobertura completa.

---

## 10. Bestiário — retratos de combate (9 criaturas, 7 retratos)

Fonte: `BESTIARIO` em `conteudo.ts`, retratos em `arte/icones.py`
(`RETRATOS` + `RETRATOS_CRIATURA`). O retrato aparece na trilha de turnos do
combate.

| criatura | retrato hoje |
|---|---|
| Goblin da Fumaça | 3 variantes (magricela/gorducho/moleque) + chefe — **4 retratos** |
| Aranha da Teia Doce | `retrato-aranha` |
| Lobo de Névoa | `retrato-lobo-nevoa` |
| Espantalho Andarilho | **nenhum** |
| Serpente do Pântano | **nenhum** |
| Grulo, o Troll | **nenhum** |
| Bruxa Espinho | **nenhum** |
| Cavaleiro de Cinzas | **nenhum** |
| Brasanegra | **nenhum** |

(Há também `retrato-heroi`, para o próprio jogador na trilha.)

**6 das 9 criaturas não têm retrato de turno ainda** — incluindo três
guardiões únicos de história (Grulo, Bruxa, Brasanegra), que são encontros
que mais precisam de leitura instantânea.

---

## 11. Interface genérica (20 ícones)

Fonte: `ICONE` em `src/sistemas/icones.ts`, desenhos em `arte/ui.py`.

Coração cheio/vazio, moeda, selo, 4 setas, botão A, mochila, livro, lupa,
dado, 6 períodos do dia, lixeira. Cobertura completa e (pelo relato) não é o
alvo da queixa de confusão — são símbolos já convencionais (seta, lupa,
lixeira). Ainda assim entram na migração de estilo por consistência: não dá
para ter ícone novo ao lado de ícone pixelado na mesma tela.

## 12. Ícones de ação de combate "genéricos" (6, além dos já contados acima)

`acao-cajado`, `acao-punho`, `acao-bola-de-fogo`, `acao-bafo-gelado`,
`acao-voz-de-trovao`, `acao-sopro-quentinho` — usados tanto para golpe de
arma (cajado/punho) quanto emprestados por magia e dom. Já contados nas
seções 2 e 4; listados aqui separado porque são a "folha-mãe" de onde vários
empréstimos saem.

---

## Resumo — onde focar primeiro

| categoria | itens | com ícone próprio | sem/emprestado |
|---|---|---|---|
| Atributos | 5 | 1 (Força) | **4** |
| Dons de raça | 5 | 5 (2 são empréstimo intencional) | 0 |
| Habilidades de classe | 5 | 5 | 0 |
| **Magias** | **13** | **3** | **10** |
| Armas (silhuetas) | 8 | 8 | 0 |
| Itens de loja | 12 | 12 | 0 |
| Materiais | 4 | 4 | 0 |
| Armaduras | 5 | 5 | 0 |
| Acessórios | 5 | 5 | 0 |
| **Bestiário (retratos)** | **9** | **3** (heroi à parte) | **6** |
| Interface genérica | 20 | 20 | 0 |

As duas famílias com buraco de verdade são **magias** (10/13 confusas) e
**retratos de criatura** (6/9 ausentes) — atributos vêm logo depois (4/5).
Todo o resto (armas, itens, materiais, armaduras, acessórios, interface) já
tem cobertura completa; a família nova pode redesenhar esses com tranquilidade
maior, sem precisar inventar conceito, só estilo.

---

## O que este documento não decide

- **Como a família nova nasce tecnicamente.** Hoje toda arte (`arte/*.py`) e
  a tipografia (`arte/fonte.py`) são geradas por código Python, pixel a
  pixel, numa grade de 16×16 — regra de projeto ("Nada de arte solta", "Nada
  de cor solta", ver `CLAUDE.md`). Trocar por uma linguagem não-pixel (vetor,
  SVG, fonte de ícone, canvas maior) muda esse pipeline inteiro e as regras
  que dependem dele. Isso é uma decisão de arquitetura visual, não só de
  gosto, e precisa virar uma decisão escrita e datada no `CLAUDE.md` antes de
  qualquer ícone novo ser desenhado de verdade.
- **A mesma pergunta vale para a tipografia** (`src/sistemas/texto.ts` lê uma
  fonte de bitmap gerada por `arte/fonte.py`) — trocar por fonte não-pixel
  troca a métrica de texto inteira que `design.ts` usa para quebrar linha e
  medir largura.
- **O desenho de cada ícone em si.** Isto é só o mapa; nenhum ícone novo foi
  esboçado ainda.
- **Se a virada acontece de uma vez ou em fases** (por exemplo: fechar os
  buracos de magia/criatura na linguagem pixel atual primeiro, para o jogo
  não piorar enquanto a família nova não está pronta, e só depois migrar
  tudo de estilo).
