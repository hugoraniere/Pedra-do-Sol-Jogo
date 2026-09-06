# Mapeamento de bugs e oportunidades de otimizacao

Documento de analise, gerado no ambiente `auditoria` (galho `ambiente/auditoria`).
Nao muda codigo do jogo - so cataloga o que foi encontrado, com arquivo e linha,
para quem for consertar depois escolher por onde comecar.

Comecado em 2026-09-06. Trabalho em andamento - ver "Status" no fim.

## Como ler

Cada achado tem uma severidade:

- **critico** - quebra o jogo, trava build, ou perde dado do jogador
- **medio** - funciona mas erra em algum caso, ou desperdica recurso visivelmente
- **baixo** - sobra, inconsistencia pequena, ou melhoria de manutencao

E uma categoria: **bug**, **otimizacao** ou **harness** (falha na propria
ferramentaria de verificacao).

Achados que so repetem uma "Divergencia deliberada" ja escrita em `CLAUDE.md`
NAO entram aqui - aquilo e decisao tomada, nao bug.

## Achados

### Geracao de arte e som (arte/*.py, som/*.py)

#### Formato de audio decidido pelo ambiente (ffmpeg presente ou nao) quebra reprodutibilidade
- **arquivo:** som/gerar.py:571-579, 613-619, 627-630
- **severidade:** medio
- **categoria:** bug
- **descricao:** `para_mp3()` so roda se `shutil.which("ffmpeg")` achar o binario no PATH, e quando falha `main()` mantem `ext_final = ".wav"` - o mesmo `npm run som`, com a mesma semente, produz `.mp3` numa maquina e `.wav` noutra, e `manifesto.json` (campo `"formato"` e `"arquivo"` de cada som) muda junto.
- **cenario:** duas frentes de trabalho paralelas (uma pasta com ffmpeg instalado, outra sem) rodam `npm run som` e cada uma gera arquivos de extensao diferente para os mesmos sons; `git diff` em `som/manifesto.json` e em `public/assets/som/` mostra dezenas de arquivos "mudados" sem nenhuma mudanca de conteudo de audio - o mesmo cuidado que a arte tem com PNG (semente fixa) nao existe aqui para o par mp3/wav.

#### Aranha "media" e desenhada e salva duas vezes
- **arquivo:** arte/gente.py:249-250, 258
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** o loop que gera `aranha-{tipo}.png` ja produz `aranha-media.png`, e uma linha logo abaixo desenha a MESMA aranha de novo (mesma funcao, mesmo argumento `tipo="media"`) so para salvar sob outro nome (`aranha.png`).
- **cenario:** `npm run arte` desenha 88 quadros de aranha "media" duas vezes; resultado sempre identico, e I/O e trabalho jogados fora a cada geracao.

#### Linha morta na colagem de roupa/arma (nunca executa)
- **arquivo:** arte/gente.py:126
- **severidade:** baixo
- **categoria:** bug
- **descricao:** `recorte.alpha_composite(peca_im, (x, y)) if False else None` tem a condicao fixa em `False` - o Python nunca avalia esse `alpha_composite`, dentro de `_colar()`, que roda para cada roupa/arma em cada um dos 88 quadros de cada raca/classe.
- **cenario:** quem le `_colar()` pra entender como a peca e colada assume que essa linha faz parte do recorte; quem cola de fato e so o bloco `temp`/`crop` logo abaixo - ruido que pode enganar a proxima pessoa a mexer em encaixe de roupa.

#### Calculo de linha/coluna repetido e descartado
- **arquivo:** arte/gente.py:122-123
- **severidade:** baixo
- **categoria:** bug
- **descricao:** `li, ci = divmod(quadro, len(COLUNAS))` e calculado e imediatamente sobrescrito por `li, ci = quadro // len(COLUNAS), quadro % len(COLUNAS)`, a mesma conta feita a mao - a primeira linha e codigo morto.
- **cenario:** rodado 25 (racas x classes) x 88 quadros x (roupa + arma) vezes por `npm run arte`; sem efeito no resultado, sobra de refactor incompleto.

#### `npm run arte` sempre redesenha tudo, o manifesto so relata depois
- **arquivo:** arte/gerar.py:79-137; arte/manifesto.py:43-78
- **severidade:** medio
- **categoria:** otimizacao
- **descricao:** `main()` chama `tiles.gerar()`, `mundo.gerar()`, `gente.gerar()` etc. incondicionalmente, sem checar antes se o codigo daquele desenho mudou; `manifesto.escrever()` so registra hash/bytes DEPOIS de tudo redesenhado, so pra comparar com a rodada anterior e imprimir "o que mudou".
- **cenario:** um ajuste de 1 px num icone de `arte/ui.py` obriga a regerar as 25 folhas de heroi, os goblins, todas as criaturas do bestiario e todos os tiles antes de chegar no icone - o "o que mudou" so aparece no fim, quando o trabalho pesado ja foi todo refeito.

#### Loop vazio, sem efeito nenhum
- **arquivo:** arte/ui.py:177-179
- **severidade:** baixo
- **categoria:** bug
- **descricao:** dentro de `i_mochila()` existe um `for i in range(U): for j in range(U): pass` - 256 iteracoes que nao fazem nada, sobra de uma tentativa anterior de desenhar algo ali.
- **cenario:** roda toda vez que `npm run arte` gera `ui.png`; nao quebra nada, mas confunde quem for editar o icone da mochila esperando que aquele bloco tenha algum papel.

#### Efeitos de imagem em Python puro, pixel a pixel, sem vetorizar
- **arquivo:** arte/base.py:83-128 (`contorno_seletivo`, `luz_de_cima`); arte/desenho.py:39-64 (`contorno_alfa`, `sombra`); arte/mundo.py:211-236 (`_moita`)
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** todo efeito de contorno/sombra/luz percorre a imagem com `getpixel`/`putpixel` por pixel (nao vetorizado com numpy/Pillow), aplicado em praticamente todo sprite gerado.
- **cenario:** hoje os quadros sao pequenos e o custo e baixo; mas se a resolucao do heroi subir (`arte/goblin.py` ja documenta essa possibilidade futura), o custo cresce ao quadrado do lado da imagem e `npm run arte` pode ir de segundos para dezenas de segundos so nesse encanamento.

#### `equipamento.conferir()` desenha cada arma de novo, redundante com `gerar()`
- **arquivo:** arte/equipamento.py:151-158, 164-166
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** `conferir()` chama `desenhar()` para cada arma so pra medir bounding box, e `gerar()` chama `desenhar()` de novo pra salvar o PNG - a arte de cada arma e produzida duas vezes por rodada.
- **cenario:** impacto minimo hoje (5 armas), mas escala mal se o catalogo de armas crescer (`TIPOS_ARMA` ja reserva espaco pra isso).

### Harness de testes (ferramentas/*.mjs)

#### `npm run derrota` esta quebrado agora mesmo (confirmado rodando)
- **arquivo:** package.json (script `"derrota"`), ferramentas/conferir-derrota.mjs; causa raiz src/sistemas/estado.ts:5 (`import { coracoesMaxDoHeroi } from "./poderes"`)
- **severidade:** critico
- **categoria:** harness
- **descricao:** `derrota` roda com `node` puro, sem o loader `--import ./ferramentas/registrar-resolver-ts.mjs` que `npm run dashboard` usa; `estado.ts` importa `./poderes` sem extensao, o que o Vite resolve mas o Node ESM nao. **Confirmado ao vivo**: `npm run derrota` lanca `ERR_MODULE_NOT_FOUND` e morre antes de rodar qualquer caso.
- **cenario:** os 5 casos de teste da funcao pura de derrota (zerar moedas, sortear itens, nunca sortear chave, limite de 3 itens) simplesmente nao executam mais, e `derrota` nao esta no `npm run build` nem no checklist do CLAUDE.md, entao ninguem percebe.

#### Testes de logica pura (dado, criatura, condicoes, derrota) ficam fora do gate de build/CI
- **arquivo:** package.json:`"build"` (`npm run verificar && tsc --noEmit && vite build`); .github/workflows/pages.yml:29-32
- **severidade:** critico
- **categoria:** harness
- **descricao:** os unicos testes com asserts de verdade contra o motor de combate/dado/criatura/condicoes/derrota (`conferir-teste.mjs`, `conferir-criatura.mjs`, `conferir-condicoes.mjs`, `conferir-derrota.mjs`) nao sao chamados por `npm run build` nem pelo workflow do GitHub Pages (**confirmado**: o workflow so roda `npm run build`, node 20). O checklist do CLAUDE.md ("Verifique antes de dizer que terminou") so cita `build`, `contraste`, `auditar` e `conferir` - nunca `teste`/`criatura`/`condicoes`/`derrota`.
- **cenario:** alguem quebra `testar()` (1d20 vs ND) ou `aplicarDerrota()` num PR; `npm run build` e o deploy do GitHub Pages passam limpos, e quem seguiu literalmente o checklist do CLAUDE.md nao teria motivo pra rodar os 4 scripts que pegariam o bug - exatamente o caso que ja aconteceu com `derrota` (achado acima).

#### CI fixa Node 20, mas os testes de logica exigem import nativo de `.ts` (Node 22+)
- **arquivo:** .github/workflows/pages.yml:29 (`node-version: 20`); package.json sem `engines`
- **severidade:** medio
- **categoria:** harness
- **descricao:** `conferir-teste.mjs`, `conferir-criatura.mjs`, `conferir-condicoes.mjs` e `conferir-derrota.mjs` importam `.ts` direto contando com type-stripping nativo do Node (funciona em Node 22+); Node 20 do workflow nao suporta isso, e nao ha `engines` travando a versao minima.
- **cenario:** se a correcao obvia do achado anterior (rodar esses 4 scripts no CI) for feita sem subir `node-version`, o CI quebra com "Unknown file extension .ts"; contribuidor local com Node 20/18 ve o mesmo erro e pode concluir (errado) que o motor de dado esta quebrado.

#### Checagem de "screenshot desatualizado" e anulada por qualquer checkout/worktree novo
- **arquivo:** ferramentas/frente-check.mjs:290-311
- **severidade:** medio
- **categoria:** harness
- **descricao:** a comparacao usa `mtimeMs` (tempo de arquivo em disco) dos PNGs em `ferramentas/telas` contra o timestamp do commit que tocou `src/cenas` (tempo de conteudo no git) - mas `git checkout`/`worktree add`/`clone` reescreve o mtime de TODO arquivo do working tree para "agora", que e sempre posterior a qualquer commit antigo.
- **cenario:** confirmado neste proprio worktree recem-criado: o aviso "src/cenas mudou depois da ultima captura" nunca dispara logo apos um checkout/worktree novo, mesmo que os PNGs commitados sejam de uma versao de tela bem mais antiga que `src/cenas` atual.

#### `npm run frente-check` sem argumentos nunca checa a colisao que e seu proposito central
- **arquivo:** ferramentas/frente-check.mjs:174-187
- **severidade:** medio
- **categoria:** harness
- **descricao:** o unico bloco que gera ERRO (colisao de arquivo reivindicado por outra frente) so roda sobre `arquivosDaSessao`, isto e, argumentos de linha de comando; `npm run frente-check` (a forma citada primeiro no proprio cabecalho do script) roda com array vazio e portanto NUNCA reprova por colisao.
- **cenario:** uma sessao roda `npm run frente-check` sem listar arquivos, ve "0 erro(s)" e segue confiante; edita um arquivo ja reivindicado por outra frente em "Acontecendo agora" e a ferramenta feita pra pegar esse caso nunca foi de fato exercitada.

#### Servidor estatico duplicado 3x com listas de MIME divergentes
- **arquivo:** ferramentas/auditar-ui.mjs:21-39, ferramentas/auditar-celular.mjs (~28-40), ferramentas/conferir-personagens.mjs:23-27
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** as tres ferramentas reimplementam o mesmo mini-servidor HTTP com checagem de path-traversal, cada uma com um `TIPOS` (extensao->MIME) diferente - `auditar-ui.mjs` nao tem `.mp3`/`.woff`, `conferir-personagens.mjs` nao tem `.mp3`, so `auditar-celular.mjs` tem `.mp3`.
- **cenario:** se `dist/` passar a servir um tipo de arquivo novo, corrigir isso em so um dos tres arquivos deixa os outros dois servindo `application/octet-stream` pra esse tipo sem ninguem perceber - e um bug de path-traversal precisaria ser corrigido tres vezes.

#### `contraste.py` mede uma lista de pares curada a mao, nao a paleta inteira
- **arquivo:** ferramentas/contraste.py:50-87
- **severidade:** medio
- **categoria:** harness
- **descricao:** ao contrario de `verificar.mjs` (que deriva a comparacao de paleta das proprias listas `COR`/`arte/paleta.py`), `contraste.py` so testa os pares que alguem escreveu manualmente em `PARES`; nada obriga a lista a crescer quando uma cor nova entra na paleta.
- **cenario:** adiciona-se um tom de pele/criatura/tile novo em `arte/paleta.py`/`arte/gente.py` sem lembrar de acrescentar a linha em `PARES` - `npm run contraste` continua saindo "todos os pares passam" mesmo que o contorno dessa cor nova nao se destaque de nenhum chao.

#### `verificar.mjs` pula asset carregado por template string no Boot que nao e objeto de cenario
- **arquivo:** ferramentas/verificar.mjs:295-305; src/cenas/Boot.ts:38-62
- **severidade:** baixo
- **categoria:** harness
- **descricao:** a secao "o que o Boot manda carregar" ignora todo caminho com `${...}` alegando "o check de objetos ja cobre" - verdade so para `OBJETOS`; `heroi-corpo-${raca}-${i}`, `roupa-${t}-${r.id}`, `armadura-${t}-${id}` e `arma-${a}` nao sao objetos de cenario e nao passam por nenhuma checagem de `verificar`.
- **cenario:** a unica rede de seguranca real pra esses PNGs templados e `npm run conferir` (abre navegador, testa as 25 combinacoes) - script separado, nao citado como obrigatorio junto de `verificar` no fluxo rapido; se `conferir` for pulado, um PNG de armadura/arma faltando so aparece como textura ausente em producao.

#### Filtro de erro de console por substring "404" pode engolir erro real
- **arquivo:** ferramentas/auditar-ui.mjs:53-55; ferramentas/conferir-personagens.mjs:54-56
- **severidade:** baixo
- **categoria:** harness
- **descricao:** o filtro descarta qualquer mensagem `console.error` que contenha a substring "404" em qualquer lugar do texto, nao so erro de rede de asset.
- **cenario:** um erro de aplicacao que por coincidencia cite "404" (um id de item, um id de mapa) e silenciosamente descartado da lista de erros da auditoria, em vez de reprovar a tela.

#### `npm run ambiente criar` tem race condition na escolha do numero da porta
- **arquivo:** ferramentas/ambiente.mjs:117-123
- **severidade:** baixo
- **categoria:** harness
- **descricao:** `numero` e escolhido lendo `worktrees()` uma vez e incrementando ate achar livre, sem lock nem checagem atomica antes do `git worktree add`; duas chamadas concorrentes de `npm run ambiente criar` podem escolher o mesmo numero.
- **cenario:** duas sessoes criam ambientes ao mesmo tempo (plausivel, o projeto e desenhado pra multiplas frentes paralelas) e ambas recebem o mesmo `numero` em `.ambiente` - `porta()` devolve a mesma porta pras duas, e `npm run auditar`/`conferir` de uma frente audita silenciosamente a tela da outra, exatamente o cenario que `.ambiente`/`porta()` foi criado pra evitar.

### Build, bundle e PWA

#### Chunk de 1,73 MB: Phaser e 83%, codigo do jogo e 17% (nao ha bloat proprio pra cortar)
- **arquivo:** dist/assets/index-*.js (saida de `vite build`)
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** bundle isolado (mesmo grafo de `src/main.ts`, minify+treeshake) mostra Phaser contribuindo 1.209.558 de 1.462.990 bytes pre-minificacao (82,7%); codigo do jogo so 247.033 bytes (16,9%).
- **cenario:** extrapolando pro output real do Vite (1.730,62 KB / 417,21 KB gzip), ~1,43 MB (~345 KB gzip) e Phaser puro; so ~290 KB (~70 KB gzip) e `src/`. O teto e o framework, nao codigo inchado.

#### Cenas de dev (Provador, Depurador) bundladas e registradas em producao pra todo jogador
- **arquivo:** src/main.ts:17-18,64; src/cenas/Provador.ts (1217 linhas); src/cenas/Depurador.ts (312 linhas)
- **severidade:** medio
- **categoria:** otimizacao
- **descricao:** `Provador` (bancada de combate, so acessivel via `?provador` na URL) e `Depurador` (debug, destravado por gesto secreto em `Titulo.ts:100`) sao importados estaticamente e vivem na cena raiz do Phaser desde o boot, mesmo sem nenhum jogador real precisar delas.
- **cenario:** Provador (54.495 bytes) + Depurador (13.892 bytes) somam ~68 KB pre-minify, ~28% de todo o codigo `src/` no bundle — codigo de teste que TODO visitante baixa e faz parse, so acessivel por URL param ou cheat code.

#### Cenas pos-evento (Combate, Ficha, Pausa, EscolhaDeSelo) vao no chunk principal, sem import() dinamico
- **arquivo:** src/main.ts:19,63-65
- **severidade:** medio
- **categoria:** otimizacao
- **descricao:** `Combate.ts` (1701 linhas), `Ficha.ts` (1090 linhas), `Pausa.ts` (378 linhas) e `EscolhaDeSelo.ts` (172 linhas) so entram em jogo depois de um evento (lutar, abrir ficha, pausar, completar 3 selos), mas carregam e sao parseados no boot igual `Mundo.ts`.
- **cenario:** Combate (79.917 bytes) + Ficha (46.496 bytes) + Pausa (13.973 bytes) somam ~140 KB pre-minify - mais da metade do codigo proprio do bundle (247 KB) - parseado antes do jogador sequer sair da Vila Semente. `import()` dinamico no primeiro `launch()` de cada cena resolveria sem mudar a API do Phaser usada em nenhum outro lugar.

#### `Boot.preload()` baixa as 5 racas x 3 tons de corpo/braco antes da Titulo aparecer
- **arquivo:** src/cenas/Boot.ts:36-41
- **severidade:** medio
- **categoria:** otimizacao
- **descricao:** o `forEach` sobre `RACAS_SPRITE` carrega `heroi-corpo-<raca>-<tom>` e `heroi-bracos-<raca>-<tom>` pra 5 racas x 3 tons (30 spritesheets) na tela de carregamento inicial, mas uma partida usa exatamente 1 raca + 1 tom pelo resto do jogo inteiro.
- **cenario:** 29 dos 30 pares de spritesheet baixados no primeiro load nunca aparecem naquela partida - em conexao de celular ("toque em primeiro lugar") isso e atraso de RTT (requisicao HTTP separada por asset) antes da Titulo, nao so peso de byte.

#### `carregarSons` baixa 89 arquivos de audio, 17 confirmados sem cena que os toque
- **arquivo:** src/sistemas/som.ts:46-49 (`carregarSons`)
- **severidade:** baixo
- **categoria:** bug
- **descricao:** o proprio `npm run verificar` ja avisa: GOLPES_ESPECIAIS (4 sons), FRAQUEZA_SONORA (3 sons) e 10 sons de EFEITOS nunca sao tocados por nenhuma cena existente, mas `carregarSons()` nao filtra - baixa o catalogo inteiro.
- **cenario:** 17 de 89 mp3 (~19% do catalogo) sao download morto toda sessao nova; `public/assets/som` pesa 596 KB total - desperdicio real, so pequeno em byte absoluto.

#### `assetsInlineLimit: 0` forca ate a fonte de 1,66 KB a virar requisicao separada
- **arquivo:** vite.config.ts:9
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** o padrao do Vite inlinearia como data-URI qualquer asset abaixo de 4 KB; com o limite zerado, `silkscreen-latin-ext-400-normal-Drdn_BEM.woff` (1,66 KB, o menor arquivo do build) sempre sai como requisicao HTTP propria.
- **cenario:** 1 requisicao HTTP a mais no caminho critico de fonte por nenhum ganho - o motivo real do `assetsInlineLimit:0` (nao inlinear PNGs do jogo) nao se aplica as fontes do @fontsource, que sao o unico asset que passa pelo pipeline do Vite.

#### PWA `generateSW` precacheia 277 arquivos / 2.716,51 KiB no install, sem runtime caching
- **arquivo:** vite.config.ts:24-29
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** o service worker baixa TODO o jogo (JS, CSS, PNG, mp3, fontes) de uma vez no install do PWA, sem `runtimeCaching` - certo pra "abrir sem internet", mas significa 2,7 MB de download de fundo assim que a pagina carrega, mesmo que o jogador so tenha chegado na Vila Semente.
- **cenario:** 2.716,51 KiB e o dado medido do proprio output do build; em conexao de celular isso concorre por banda com o carregamento do Boot ao mesmo tempo, ja que o SW comeca a baixar assim que registra.

## Status

- [ ] sistemas do jogo (src/sistemas)
- [ ] cenas do jogo (src/cenas)
- [ ] dados e conteudo (src/dados)
- [x] harness de testes (ferramentas/*.mjs)
- [x] geracao de arte e som (arte/*.py, som/*.py)
- [x] build e performance (vite, bundle, PWA)
