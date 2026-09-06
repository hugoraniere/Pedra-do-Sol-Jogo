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

Todo achado marcado **critico** passou por uma revisao adversarial separada
(um agente tentando ativamente provar que cada um estava errado ou
exagerado, lendo o codigo linha a linha e rodando script quando fazia
sentido). De 12 achados criticos revisados, 11 foram **confirmados** por
leitura e/ou reproducao direta, e 1 foi rebaixado pra `medio` por nao bater
com a propria definicao de severidade deste documento (fica marcado inline
onde acontece). Isso nao significa que o resto do documento (medio/baixo)
passou pelo mesmo crivo adversarial - so os criticos.

## Resumo executivo (os 10 achados de maior impacto)

Por tema, nao por ordem de gravidade estrita - os quatro temas sao igualmente
urgentes a sua maneira:

**Controle de toque quebrado (a plataforma primaria do jogo)**
1. `main.ts` nunca configura `input.activePointers` - o jogo inteiro so aceita
   **um dedo por vez**. Segurar uma seta e tocar o botao A ao mesmo tempo (ou
   andar na diagonal com dois dedos) simplesmente nao funciona.
2. Setas do direcional (26x26) e botao de acao (34x34) caem abaixo do minimo
   de 44px de alvo de toque em telas de celular comuns na horizontal.
3. Os slots de habilidade/ataque do combate (24x28) sao ainda menores - erro
   de toque no momento em que a decisao tem custo real (moedas, itens).

**Progresso e prejuizo da derrota nao sao confiaveis**
4. Perder uma luta com a arma da classe equipada: o item some da mochila no
   sorteio da derrota, mas volta sozinho de graca ao recarregar a pagina -
   o "prejuizo de verdade" que e o pilar de design do jogo (ver CLAUDE.md)
   desaparece pra qualquer item equipado.
5. Jogar fora (ou perder pra lixeira) um item de equipamento nao desequipa o
   heroi - ele fica "vestindo" uma peca que nao existe em lugar nenhum.
6. Entrar/sair de mapas varias vezes (ou apanhar uma derrota) acumula
   listeners de evento na Interface sem nunca remove-los - o mesmo toque no
   botao de acao pode **duplicar item e dinheiro recolhidos**.
7. No app desktop, salvar e clicar em "SAIR DO JOGO" em seguida pode perder
   a ultima acao: a escrita em disco e assincrona e o processo fecha sem
   esperar ela terminar.
8. Duas abas do navegador no mesmo slot de save se sobrescrevem em silencio,
   sem versao/timestamp/lock nenhum entre elas - uma sessao inteira de jogo
   pode ser apagada pela outra aba.

**Combate por turnos com logica incompleta**
9. As duas magias de controle do jogo (Cresce-Grama "preso", Voz de Trovao
   "assustado") nao tem NENHUM efeito em jogo - `decidirAcaoDaCriatura` nem
   recebe as condicoes como parametro.
10. O Combate nunca reage a redimensionamento/rotacao da tela - girar o
    tablet no meio de uma luta pode deixar botoes de acao fora da area
    visivel, num combate que ja tem prejuizo real.

**A propria harness deixa passar regressao**
- `npm run derrota` esta quebrado agora mesmo (import sem extensao, node puro
  sem o loader certo) - **confirmado rodando**, e ninguem percebeu porque os
  4 scripts de logica pura (`teste`/`criatura`/`condicoes`/`derrota`) nao
  entram no `npm run build` nem no workflow do GitHub Pages.
- `npm run conferir` nunca reconstroi o `dist` antes de testar - se ele ja
  existir de um build anterior, o teste roda contra o bundle antigo e nao
  pega a regressao que acabou de ser introduzida.

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

#### Filtro de erro de console por substring "404" pode engolir erro real (em TRES scripts, nao so dois)
- **arquivo:** ferramentas/auditar-ui.mjs:53-55; ferramentas/conferir-personagens.mjs:54-56; ferramentas/auditar-celular.mjs:84
- **severidade:** baixo
- **categoria:** harness
- **descricao:** o filtro descarta qualquer mensagem `console.error` que contenha a substring "404" em qualquer lugar do texto, nao so erro de rede de asset - e a mesma logica esta duplicada nos tres scripts de auditoria via navegador.
- **cenario:** um erro de aplicacao que por coincidencia cite "404" (um id de item, um id de mapa) e silenciosamente descartado da lista de erros de qualquer uma das tres auditorias (incluindo a de celular, que passeia por 5 aparelhos x 2 orientacoes), em vez de reprovar a tela.

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

### Cenas do jogo (src/cenas)

#### Listeners de Interface se acumulam a cada troca de mapa - duplica item e dinheiro
- **arquivo:** src/cenas/Mundo.ts:589-590 (registro), 792 (efeito), 1694 (restart), 663-676 (o mesmo autor ja faz o `.off()` de guarda pro Depurador, so nao aqui)
- **severidade:** critico
- **categoria:** bug
- **descricao:** `create()` reassina `this.scene.get("Interface").events.on("acao"/"pausar", ...)` sem nunca dar `.off()`, mas `create()` roda de novo a cada `trocarDeMapa()` (`scene.restart()`) e a cada derrota (`Combate.ts:851`); `Interface` nunca reinicia, entao seu `events` (EventEmitter) e o mesmo objeto a vida toda, e `Systems.shutdown()` do Phaser nao limpa listener de usuario (so `destroy()` faz isso).
- **cenario:** jogador entra/sai de 3 casas (ou apanha uma derrota e volta pro Hospital) e depois toca no botao de acao em cima de um item largado no chao: `tentarInteragir()` roda uma vez por listener acumulado, e cada chamada executa `guardar(dados.item, dados.quantidade)` de novo - o mesmo toque duplica/triplica o item e o dinheiro recolhidos. O mesmo padrao dispara `trocarDeMapa()` (portas) e `pausar()` N vezes por toque.

#### Combate nunca reage a redimensionamento/rotacao
- **arquivo:** src/cenas/Combate.ts (nenhuma chamada a `refazerAoRedimensionar` ou `this.scale.on` em 1701 linhas)
- **severidade:** critico
- **categoria:** bug
- **descricao:** ao contrario de Mundo, Interface, Ficha, Pausa e Titulo, a cena de combate por turnos nao chama `refazerAoRedimensionar()` nem assina `Phaser.Scale.Events.RESIZE` - todo o HUD (slots de acao, barra de vida, trilha de iniciativa, mira, pips de movimento) e posicionado uma unica vez em `create()`.
- **cenario:** jogador entra em combate no iPad e gira a tela (ou redimensiona a janela no desktop) no meio da luta: os botoes de acao, o botao PASSAR e a mira continuam nas coordenadas antigas - podem ficar fora da area visivel ou sobrepostos, deixando o jogador sem conseguir agir num combate que tem custo real (perder = perde moedas e itens).

#### `dialogo-fim` tambem se acumula em Mundo a cada restart (mesma causa-raiz)
- **arquivo:** src/cenas/Mundo.ts:604
- **severidade:** medio
- **categoria:** bug
- **descricao:** `this.events.on("dialogo-fim", ...)` e registrado dentro de `create()`, que roda de novo em todo restart; como `Systems.shutdown()` nao limpa `this.events`, cada restart empilha mais uma copia do handler. Hoje o efeito colateral e so reatribuir `this.conversando = false` varias vezes seguidas - inofensivo na pratica, mas confirma que o vazamento e sistemico nessa cena.
- **cenario:** apos varias trocas de mapa, fechar qualquer caixa de fala dispara o mesmo bloco N vezes no mesmo frame; qualquer codigo novo colocado dentro desse `.on()` herda execucao multipla sem aviso.

#### Criacao de personagem e a tela de Selo tambem ignoram redimensionamento
- **arquivo:** src/cenas/Criacao.ts e src/cenas/EscolhaDeSelo.ts (nenhuma chamada a `refazerAoRedimensionar`/`scale.on`)
- **severidade:** medio
- **categoria:** bug
- **descricao:** o design system (`docs/07-design-system.md`) exige que "toda cena de interface chame `refazerAoRedimensionar()`"; essas duas nao chamam, diferente de Mundo/Interface/Ficha/Pausa/Titulo.
- **cenario:** jogador cria personagem no iPad e gira a tela (ou o teclado virtual aparece ao digitar o nome), ou atinge o 3º Selo e gira o tablet antes de escolher o premio: campos/botoes ficam nas posicoes calculadas pra resolucao antiga, podendo sobrepor ou sair da area visivel - e a tela de Selo nao tem como fechar sem escolher.

#### Itens largados no chao vazam no Map entre trocas de mapa
- **arquivo:** src/cenas/Mundo.ts:162, 790, 1315-1327
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** `itensNoChao` (Map) e populado em `largarItemNoChao()` e so remove entrada em `removerItemDoChao()` (item apanhado); nunca e limpo em `create()`, ao contrario de `interagiveis`/`fontesDeLuz`/`npcs`/`criaturas`/`saidas`, resetados a cada restart.
- **cenario:** jogador larga item no chao e muda de mapa sem apanhar de volta: a entrada continua pra sempre em `itensNoChao`, guardando referencia a um `Phaser.GameObjects.Image` ja destruido - cresce sem limite numa sessao longa (nunca e coletado pelo GC porque a Map ainda referencia o objeto).

### Sistemas do jogo (src/sistemas)

#### Diagonal corta quina de parede no combate (contraria a propria logica de `caminho.ts`)
- **arquivo:** src/sistemas/alcance.ts:57-58 (comparar com src/sistemas/caminho.ts:135-137)
- **severidade:** medio
- **categoria:** bug
- **descricao:** a checagem de "nao corta quina" usa `&&` em vez de `||`, entao um movimento diagonal so e bloqueado quando AMBAS as casas ortogonais ao redor estao bloqueadas - quando so uma parede existe (caso comum de canto de casa), a diagonal passa mesmo assim. `caminho.ts`, mesmo projeto e mesma intencao, implementa isso corretamente com `||`.
- **cenario:** heroi em (0,0), parede em (1,0), chao livre em (0,1) e (1,1): `alcancaveis()` marca (1,1) como alcancavel e a diagonal aparece andavel no combate, cortando o canto da parede.

#### Doutor (painel de diagnostico) sempre reporta "sem save" mesmo com save existente
- **arquivo:** src/sistemas/doutor.ts:220-225
- **severidade:** medio
- **categoria:** bug
- **descricao:** `resumo()` consulta a chave `localStorage.getItem("reino-de-aurora-v1")`, que nunca e escrita por nada no jogo - os saves reais usam `aurora-save-${espaco}` (src/sistemas/armazenamento.ts:45), e o app desktop nem usa `localStorage` pra isso (ver `PonteApp` em armazenamento.ts:26-32).
- **cenario:** jogador com progresso salvo abre o painel do Doutor (4 toques no canto, unico console disponivel no iPad) pra diagnosticar um problema; o resumo sempre mostra "sem save" - tanto no navegador quanto no app desktop -, escondendo justamente a informacao que a ferramenta existe pra mostrar quando alguem for investigar um bug relatado por quem joga.

#### Heroi sem arma equipada ganha um golpe fantasma de espada
- **arquivo:** src/sistemas/acao.ts:121
- **severidade:** medio
- **categoria:** bug
- **descricao:** `heroi.armaSprite || classe.arma` nunca cai no fallback quando `armaSprite === "nenhuma"`, porque a string "nenhuma" e truthy - so funciona pra string vazia. `heroi.ts::pecasDoHeroi` ja trata "nenhuma" como sentinela explicita de "sem arma"; `acao.ts` nao replica essa checagem.
- **cenario:** jogador desequipa a arma pela mochila (`equipar("arma", null)` grava `armaSprite = "nenhuma"`, fluxo real de jogo). Em combate, `golpeDaArma("nenhuma")` nao acha nada em `TABELA_DE_GOLPE` e cai no fallback interno `TABELA_DE_GOLPE["espada-curta"]` - o heroi "desarmado" ganha uma acao rotulada GOLPE com o dado 1d6 da espada curta, alem (nao em vez) do SEM ARMA (1d3) que deveria ser o unico golpe corpo a corpo.

#### Transicao de cor do ceu troca num corte seco, contrariando o proprio comentario
- **arquivo:** src/sistemas/tempo.ts:58-62
- **severidade:** baixo
- **categoria:** bug
- **descricao:** `corDoCeu()` interpola o alpha ao longo dos 90 minutos de transicao, mas a COR salta inteira em `t < 0.5 ? atual.corCeu : proximo.corCeu` - o comentario da funcao ("transicao nunca ser um corte seco") descreve exatamente o que essa linha nao entrega.
- **cenario:** nas transicoes madrugada->aurora, tarde->por-do-sol e por-do-sol->noite a cor muda com alpha ja em ~0.14-0.36 no ponto do salto - um flash de cor perceptivel, visivel toda sessao em que o jogador fica no mundo tempo suficiente.

#### `alinhamento: 0` forca centralizacao em vez de alinhar a esquerda
- **arquivo:** src/sistemas/texto.ts:72-74
- **severidade:** baixo
- **categoria:** bug
- **descricao:** `if (op.alinhamento !== undefined) t.setCenterAlign?.();` roda pra qualquer valor definido, inclusive `0` (esquerda), e nada desfaz isso depois quando o valor e `0` - so os casos `1` e `2` sao corrigidos nas linhas seguintes.
- **cenario:** hoje nenhum chamador passa `alinhamento: 0` explicitamente, entao o bug e latente; o primeiro texto multi-linha que pedir alinhamento a esquerda de forma explicita sairia centralizado sem aviso.

#### `montar()` do heroi recria todas as camadas de sprite a cada troca de cor na criacao
- **arquivo:** src/sistemas/heroi.ts:184-246 (chamado por `trocarAparencia`, linha 417-420)
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** toda chamada a `trocarAparencia()` destroi e recria corpo, cabelo, chapeu, bracos, roupa, armadura e arma (ate 7 objetos Phaser + `criarAnimacoes` reaplicado), mesmo quando so um tint ou uma peca mudou.
- **cenario:** em Criacao.ts, cada toque num swatch de cor dispara redesenho completo do boneco (o proprio comentario do arquivo ja registra "os bonecos sao caros de montar"); alguem testando varias cores de cabelo em sequencia rapida no iPad paga o custo de recriar sprites inteiros a cada toque, quando so o tint precisava mudar.

#### `lotado()` varre todos os sons tocando a cada efeito disparado
- **arquivo:** src/sistemas/som.ts:104-110
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** `tocarFicha()` chama `lotado()` a cada disparo, que chama `gerente.getAllPlaying()` e filtra a lista inteira de sons ativos so pra contar quantos nao sao loop, em vez de manter um contador incrementado/decrementado nos eventos de start/complete.
- **cenario:** numa cena de combate com varios efeitos curtos por segundo (passo, golpe, voz de dado, impacto), cada um dispara essa varredura completa - custo pequeno por chamada, redundante no hot path de audio que existe justamente pra nao travar o app no iPad.

### Dados e conteudo (src/dados)

#### `TRILHA_DA_FLORESTA` tem 8 linhas de chao com uma coluna a menos - buraco na borda leste
- **arquivo:** src/dados/mapas.ts:517-520,522-525 (dentro de `TRILHA_DA_FLORESTA.chao`, 513-547)
- **severidade:** medio
- **categoria:** bug
- **descricao:** **confirmado por medicao direta** - 8 das 13 linhas do desenho tem 29 caracteres (falta um "T" antes da borda leste) enquanto bordas e a linha da trilha (`t`) tem 30. `chao[y][29]` fica `undefined` nessas 8 linhas.
- **cenario:** o tilemap do Phaser usa a largura da primeira linha (30) pra todas; a coluna x=29 nessas 8 linhas vira tile vazio (sem colisao, sem desenho) na borda leste da mata que devia fechar o corredor.

#### `npm run verificar` so confere largura de linha de mapa que tem `criaturas`
- **arquivo:** ferramentas/verificar.mjs:188-207 (o `if (!listaCriaturas) continue;`)
- **severidade:** medio
- **categoria:** harness
- **descricao:** a unica checagem que le `desenho[y]?.[x]` linha a linha (e por isso pegaria linha curta) so roda pra mapas com bloco `criaturas: [...]`; `TRILHA_DA_FLORESTA` nao tem criaturas e passou batido, exatamente o caso do achado acima.
- **cenario:** uma checagem generica e independente de criaturas - por mapa, `new Set(desenho.map(l => l.length)).size === 1` - pegaria esse bug (e qualquer novo) na hora.

#### CLAUDE.md diz "3 pontos" de bonus de atributo, mas a raca sozinha ja da 2
- **arquivo:** CLAUDE.md (secao "Atributos, revisao de 2026-09-04"); src/dados/conteudo.ts:102-107; src/sistemas/poderes.ts:24-29
- **severidade:** medio
- **categoria:** bug
- **descricao:** **confirmado por leitura direta**: CLAUDE.md afirma que o bonus de origem continua 3 pontos (raca +1, classe +1, jogador +1) "so espalhados por 5 opcoes em vez de 3" - mas `conteudo.ts:102-107` documenta a revisao de 2026-09-05 (`docs/15-lore-e-visual-das-racas.md`) que trocou `Raca.bonus` por uma dupla `[Atributo, Atributo]` (ciclo de 2 atributos por raca), e `poderesDaOrigem()` soma +1 em CADA um dos dois. O total real de origem+jogador e 4 pontos (2 da raca + 1 da classe + 1 do jogador), nao 3.
- **cenario:** quem le CLAUDE.md pra saber quanto um heroi novo recebe de bonus total confia no numero "3"; a Ficha/criacao mostra um heroi com 4 pontos de atributo - a nota de design ficou desatualizada depois do redesenho de racas do dia seguinte e ninguem voltou pra corrigir o numero.

#### `Raca.icone` (dom da raca) e desenhado na arte mas nunca renderizado em nenhuma cena
- **arquivo:** src/dados/conteudo.ts:110,129,140,151,162,173 (campo `icone` de cada `Raca`); arte/icones.py:359,578-580
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** os 5 icones de dom de raca sao desenhados de verdade em `arte/icones.py`, mas nenhuma busca em `src/cenas` le `raca.icone` - Criacao.ts e Ficha.ts mostram so o texto de `raca.dom`/`raca.domTexto`, nunca o icone.
- **cenario:** o jogador nunca ve um icone pro dom da propria raca na criacao nem na Ficha, apesar do trabalho de arte ja existir pronto - dado morto que parece em uso porque tem sprite de verdade por tras.

#### `GOBLINS_SPRITE` inclui "chefe", que nunca aparece em jogo de verdade
- **arquivo:** src/dados/config.ts:299; src/dados/conteudo.ts:842-846 (`VARIANTES_GOBLIN`); src/cenas/Boot.ts:77
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** `GOBLINS_SPRITE` tem 4 variantes (inclui "chefe") e por isso Boot.ts carrega `goblin-chefe.png` toda partida, mas `spriteDoGoblin()` - a unica funcao que decide qual corpo de goblin nasce no mundo/combate - so sorteia entre as 3 primeiras (`VARIANTES_GOBLIN`, sem "chefe"). O unico uso real e o Provador (ferramenta de teste, nunca chega no jogo publicado).
- **cenario:** todo carregamento do jogo baixa e decodifica um sprite de goblin que nenhum encontro de verdade jamais mostra - bytes e tempo de loading gastos por um bicho que so existe numa bancada de teste interna.

### Aplicativo de desktop (app/, Electron)

#### Titulo da janela ainda usa o nome antigo do produto
- **arquivo:** app/principal.cjs:97
- **severidade:** baixo
- **categoria:** bug
- **descricao:** `criarJanela()` fixa `title: "Reino de Aurora"` na `BrowserWindow`, mas o projeto foi renomeado pra "A Pedra do Sol" (CLAUDE.md, decisao de 2026-09-04). O resto do empacotamento ja foi atualizado: `package.json.name` e `a-pedra-do-sol`, `build.productName` e "A Pedra do Sol" - so este arquivo ficou pra tras.
- **cenario:** o jogador abre `npm run app` (ou o app instalado) e ve "Reino de Aurora" na barra de titulo/taskbar do SO, enquanto instalador, icone e nome do processo dizem "A Pedra do Sol" - exatamente o "resto do nome antigo esperando limpeza" que o CLAUDE.md pede pra corrigir.

#### Renderer roda sem sandbox do Electron
- **arquivo:** app/principal.cjs:104
- **severidade:** medio
- **categoria:** otimizacao
- **descricao:** `webPreferences` tem `contextIsolation: true` e `nodeIntegration: false` (corretos), mas `sandbox: false` desliga o isolamento de processo em nivel de SO que o Electron liga por padrao desde a v20.
- **cenario:** hoje o jogo so carrega `dist/index.html` local/`localhost` em dev, risco pratico baixo; mas se o app crescer pra carregar recurso remoto (link de patch notes, iframe de loja), um renderer sem sandbox e um anteparo a menos entre pagina comprometida e o SO do jogador.

#### Nenhuma Content-Security-Policy declarada
- **arquivo:** index.html (nenhuma linha define CSP)
- **severidade:** medio
- **categoria:** bug
- **descricao:** `index.html` nao tem `<meta http-equiv="Content-Security-Policy">`, nem no HTML servido pelo navegador nem no que o Electron carrega via `loadFile`/`loadURL` (app/principal.cjs:109-110). E item padrao da propria checklist de seguranca do Electron, ausente por completo.
- **cenario:** se qualquer dependencia futura (plugin Phaser, fonte externa, chamada de rede) for comprometida ou mal configurada, nao ha barreira declarativa impedindo carga de recurso de origem arbitraria dentro da janela do Electron.

#### Nenhum mecanismo de auto-update, nem exibicao da propria versao
- **arquivo:** package.json:50-68 (bloco `"build"`); app/principal.cjs (arquivo inteiro); src/cenas/Pausa.ts (nao referencia versao)
- **severidade:** medio
- **categoria:** otimizacao
- **descricao:** o `build` do electron-builder nao declara `publish`, `electron-updater` nao esta em `dependencies`/`devDependencies`, `app/principal.cjs` nao chama `autoUpdater`, e nenhuma tela mostra a versao instalada.
- **cenario:** um jogador que instalou o `.dmg`/`.exe`/AppImage fica preso na versao `0.1.0` pra sempre - uma correcao de bug ou balanceamento publicada depois nunca chega a quem ja instalou, sem nenhum sinal na interface de que existe versao mais nova.

### Save e persistencia (armazenamento.ts, estado.ts)

#### Ultimo save pode se perder ao sair do aplicativo desktop
- **arquivo:** src/cenas/Pausa.ts:133-134; src/sistemas/armazenamento.ts:70-77; app/principal.cjs:63-71,116-118
- **severidade:** critico
- **categoria:** bug
- **descricao:** `gravar()` dispara `window.aurora.gravarSave(...)` sem `await` (fire-and-forget), e a acao "SAIR DO JOGO" chama `salvar()` e, na sequencia imediata, `sairDoJogo()` (outro canal IPC) cujo handler roda `app.quit()` de forma sincrona, sem esperar a escrita em disco (`fs.writeFile`+`rename`) terminar.
- **cenario:** no app desktop, o jogador faz uma acao (pega item, acende fogueira) e no mesmo instante aperta "SAIR DO JOGO"; a escrita async pode nao terminar antes do processo fechar, perdendo a ultima acao - o save volta ao estado anterior na proxima abertura, sem aviso nenhum.

#### Duas abas do navegador no mesmo slot se sobrescrevem em silencio
- **arquivo:** src/sistemas/armazenamento.ts:70-81; src/sistemas/estado.ts:154-190 (`atual`, `abrirEspaco`, `salvar`)
- **severidade:** critico
- **categoria:** bug
- **descricao:** nao existe versao, timestamp comparado, listener de evento `storage` nem lock entre instancias; cada aba mantem seu proprio `atual` em memoria e `gravar()` sempre sobrescreve a chave inteira (`aurora-save-${espaco}`) com o estado daquela aba.
- **cenario:** jogador abre o jogo em duas abas do mesmo slot. Joga um tempo na aba A (que salva a cada acao). Volta pra aba B, ainda com estado antigo carregado, e faz uma unica acao la - isso reescreve o save inteiro com o estado desatualizado da aba B, apagando silenciosamente todo o progresso feito na aba A, sem erro, sem aviso, sem como desfazer.

*(observacao, nao e achado: a leitura de save trata JSON invalido/formato antigo com fallback seguro, faz merge raso com o estado vazio pra campos novos como fome/sono, migra os formatos historicos da mochila, e tem fallback defensivo pra ids de atributo/magia/mochila que nao existem mais - a migracao 3->5 atributos nao quebra save antigo.)*

### Consistencia entre docs e codigo

#### CLAUDE.md contradiz a si mesmo: diz que o sistema de dado/atributo/combate nao existe, mas o resto do proprio arquivo (e o codigo) mostra que existe
- **arquivo:** CLAUDE.md:223-224 vs CLAUDE.md:59-190 (mesmo arquivo, secao "As regras do mundo") e docs/05-roadmap.md:53-106; **confirmado em codigo**: src/sistemas/teste.ts:32 (`testar()`), src/sistemas/poderes.ts:51,72 (`poderesDoHeroi()`, `coracoesMaxDoHeroi()`), src/sistemas/estado.ts:409,453,482 (`acenderFogueira()`, `aplicarDerrota()`, `ganharSelo()`), src/cenas/Combate.ts, src/cenas/EscolhaDeSelo.ts
- **severidade:** medio *(rebaixado de "critico" apos revisao adversarial: pela propria definicao de severidade deste documento - "critico = quebra o jogo, trava build, ou perde dado do jogador" - nada disso acontece aqui; e um erro de documentacao como os outros 5 desta mesma secao, todos "medio". O risco de processo de confiar numa afirmacao falsa em CLAUDE.md e real, mas nao muda a categoria.)*
- **categoria:** harness
- **descricao:** CLAUDE.md afirma, em negrito: "Nada do sistema da secao anterior existe em codigo ainda. Nao ha dado, atributo, coracao, combate, derrota, fogueira nem selo." **Confirmado por grep que isso e falso**: as 6 funcoes citadas existem e implementam exatamente dado (1d20+ND), atributo, coracao, derrota, fogueira e selo.
- **cenario:** CLAUDE.md e a fonte de verdade lida primeiro por qualquer sessao/dev nova, com instrucao explicita de valer "mais que qualquer suposicao sua sobre o projeto" - quem le so ate essa frase conclui que o maior buraco do projeto e o sistema inteiro (dado/combate/derrota), quando a Fase 1 esta com o essencial implementado - risco real de redigitar trabalho ja feito ou recomendar a fase errada do roadmap.

#### `docs/plano-do-combate.md` descreve o combate como preso no Provador, mas ele ja esta integrado no jogo de verdade
- **arquivo:** docs/plano-do-combate.md:88-94,317-318 vs src/cenas/Combate.ts (cena real) e src/cenas/Interface.ts:45-46,219-220 (HUD ja integrado)
- **severidade:** medio
- **categoria:** harness
- **descricao:** o doc diz que a barra de habilidades esta "bloqueado por fronteira" porque `Interface.ts`/`design.ts` pertencem a outro "ambiente" e que "ate a etapa 8 o ambiente combate nao encosta em nenhum deles... tudo vive no provador" - mas `Interface.ts` ja monta o HUD de combate real e `Combate.ts` ja e cena do jogo de verdade, nao do Provador.
- **cenario:** CLAUDE.md aponta este doc como "o que vale de verdade sobre o formato do combate"; quem le pra saber o que falta pode achar que a integracao com Ficha/Interface ainda nao aconteceu e tentar renegociar uma fronteira ja cruzada.

#### `docs/09-plano-de-resolucao-e-contraste.md` cita um numero de codigo que nunca existiu
- **arquivo:** docs/09-plano-de-resolucao-e-contraste.md:3-4,89-90 vs arte/paleta.py:158 (`def rampa(base, forca=54)`)
- **severidade:** baixo
- **categoria:** harness
- **descricao:** o doc afirma "Nada aqui foi implementado ainda" e recomenda "hoje a forca padrao e 42; testar 56 e 64" - mas o codigo nunca teve `forca=42`, o valor e 54 desde a introducao da funcao.
- **cenario:** quem for validar a Fase 0 do plano de contraste procura por "42" no codigo, nao acha, e pode concluir erroneamente que nada foi feito e reabrir um trabalho ja concluido.

#### `docs/inventario-de-icones.md` contradiz a si mesmo sobre os icones de atributo
- **arquivo:** docs/inventario-de-icones.md:44-58 (tabela "Decisao de 2026-09-05", 5 atributos aprovados) vs docs/inventario-de-icones.md:108-117 (tabela "1. Atributos" mais antiga, diz "4 de 5 nao tem identidade visual propria"); confirmado: src/sistemas/icones-svg.ts:8-14 e os SVGs em public/assets/icones/
- **severidade:** medio
- **categoria:** harness
- **descricao:** a secao do topo do documento (mais recente) ja lista os 5 icones de atributo como desenhados/aprovados, e o codigo confirma os 5 SVGs em producao - mas a secao mais abaixo, nao atualizada, ainda diz que 4 dos 5 usam o icone generico emprestado.
- **cenario:** quem procura "o que falta desenhar" nesse doc pode achar a tabela errada (mais antiga) e redesenhar icones que ja existem.

#### `docs/plano-de-itens-e-equipamento.md` descreve o sistema de atributos com o modelo antigo (3 atributos)
- **arquivo:** docs/plano-de-itens-e-equipamento.md:79-82,173 vs src/sistemas/poderes.ts:16-27,51-56 (5 atributos, bonus de raca em ciclo de dois)
- **severidade:** medio
- **categoria:** harness
- **descricao:** o doc (atualizado na "Segunda rodada", 2026-09-05, o MESMO dia da revisao de atributos) ainda descreve `poderesDoHeroi()` somando "tres numeros finais, FORCA/ESPERTEZA/CORACAO" e instrui manter `equipamento.ts` separado porque "poderes continua so sobre FORCA/ESPERTEZA/CORACAO" - o codigo ja tem 5 atributos com bonus duplo de raca.
- **cenario:** quem implementar equipamento (Fase 6, ainda nao feita) usando este doc como referencia pode escrever `modificadorDeEquipamento()` pensando nos 3 atributos antigos, gerando codigo incompativel com `Poderes`/`Atributo` reais desde o primeiro commit.

#### `Mundo.acordarNaFogueira()` e codigo morto com docstring que descreve a regra ja revogada
- **arquivo:** src/cenas/Mundo.ts:1351-1364 vs src/cenas/Combate.ts:841 (`aplicarDerrota()`, a funcao de verdade chamada na derrota) e CLAUDE.md ("Divergencia deliberada: a fogueira nao e mais quem resgata")
- **severidade:** medio
- **categoria:** bug
- **descricao:** `acordarNaFogueira()` nao e chamada de lugar nenhum do codigo (so aparece na propria definicao) - sobra da implementacao anterior a decisao de trocar a fogueira pelo Hospital, mas continua no arquivo com docstring que descreve exatamente a regra revogada (zera moedas, mantem item, acorda na fogueira), sem nota de que esta obsoleta.
- **cenario:** um dev futuro que faz grep por "derrota"/"acorda" pode achar essa funcao em vez de `aplicarDerrota()`, reconecta-la por engano num refactor de `Combate.ts` e reintroduz silenciosamente o comportamento antigo ja decidido como errado.

#### `docs/plano-de-itens-e-equipamento.md` conta 12 itens na LOJA, hoje sao 13
- **arquivo:** docs/plano-de-itens-e-equipamento.md:63 ("LOJA (12 itens)") vs src/dados/conteudo.ts (`LOJA`, 13 entradas, incluindo "pao" adicionado por docs/plano-de-moodles.md)
- **severidade:** baixo
- **categoria:** harness
- **descricao:** "Pao da Padeira" foi adicionado a LOJA pelo plano de moodles depois que este documento fixou a contagem em 12; o numero nao foi atualizado.
- **cenario:** baixo risco, mas e o tipo de numero que alguem cita de cabeca em conversa de design e erra por ter lido o doc em vez de contar o array.

### Toque e mobile (controles, HUD)

#### Toque unico travado por padrao - so um dedo por vez no jogo inteiro
- **arquivo:** src/main.ts:42-59 (config do `Phaser.Game`, sem bloco `input:` nenhum)
- **severidade:** critico
- **categoria:** bug
- **descricao:** **confirmado** - `main.ts` nunca define `input.activePointers`; o padrao do Phaser e `1`, entao so existe UM pointer de toque disponivel (indice 0 e reservado ao mouse). Com um dedo ja ativo nesse unico slot, um segundo dedo simplesmente nao recebe pointer nenhum e o evento e descartado sem erro.
- **cenario:** o direcional na tela e desenhado como 4 botoes separados mais um botao de acao - o proprio design pressupoe dois toques simultaneos: segurar uma seta com um polegar e tocar o botao A com o outro (atacar/interagir andando), ou tocar duas setas adjacentes ao mesmo tempo pra andar na diagonal (a "direcional de disco" de 8 direcoes que o CLAUDE.md descreve). Nos dois casos o segundo toque nao aciona nada: o botao A fica mudo com uma seta pressionada, e a diagonal via toque nao existe na pratica - quebra o controle basico do jogo em qualquer iPad/celular, a plataforma primaria do projeto.

#### Dica de mira no combate chega depois da selecao e some coberta pelo dedo
- **arquivo:** src/sistemas/hudDeAcao.ts:170-176; src/cenas/Combate.ts:355-357,428-436 (`mostrarDica`)
- **severidade:** medio
- **categoria:** bug
- **descricao:** o slot de acao usa `pointerdown` pra escolher a acao e `pointerover`/`pointerout` pra mostrar a dica (nome, alcance, "uma vez por luta"). No mouse funciona (hover antes do clique). No toque, o Phaser processa `TOUCH_START` disparando `pointerdown` (ja seleciona a acao) e SO DEPOIS `pointerover` (mostra a dica); ao soltar o dedo, `TOUCH_END` sempre esconde a dica.
- **cenario:** o jogador toca um slot de magia/ataque no combate; a acao ja e selecionada no mesmo instante, a dica de alcance so aparece um instante depois com o proprio dedo ainda em cima (encobrindo o texto) e some ao soltar - quem joga de toque nunca le a dica antes de escolher, so quem usa mouse.

#### Alvos de toque do HUD principal caem abaixo de 44px mesmo na visao padrao
- **arquivo:** src/sistemas/visao.ts:80-97 (`medidaDaJanela`, escala inteira arredondada); src/cenas/Interface.ts:186-188 (seta 26x26), :207-209 (botao A 34x34)
- **severidade:** critico
- **categoria:** bug
- **descricao:** o canvas usa `Phaser.Scale.NONE` + `setZoom` com escala SEMPRE inteira. Em tela de celular pequena na horizontal (ex.: 650x340 CSS px com a barra do Safari visivel), a conta de escala ja da 1 na visao NORMAL, sem o jogador escolher LONGE. Em escala 1, um alvo desenhado com 26 ou 34 unidades logicas vira literalmente 26/34 pixels CSS reais - abaixo do minimo recomendado de 44x44 CSS px pro dedo.
- **cenario:** num iPhone SE/mini ou Android compacto, na horizontal, com a barra de endereco ainda visivel (o caso mais comum ao abrir o link), as setas do direcional e o botao de acao ficam do tamanho de um selo postal - o jogador erra o toque ou nao aciona o botao A, sem precisar mexer em preferencia nenhuma de zoom.

#### Slots de acao de combate sofrem o mesmo encolhimento, com risco de verdade em jogo
- **arquivo:** src/sistemas/hudDeAcao.ts:31 (`SLOT = 22`), 170-173 (retangulo interativo 24x28 unidades logicas)
- **severidade:** critico
- **categoria:** bug
- **descricao:** os botoes de magia/ataque do combate tem area de toque de 24x28 unidades logicas - menor ainda que o direcional (26x26). Na mesma escala 1 do achado anterior, vira 24x28 pixels CSS reais.
- **cenario:** durante um combate por turnos com coracoes e itens de verdade em jogo (perder custa moeda e mochila), o jogador tenta tocar a segunda/terceira habilidade da barra e acerta a vizinha por engano, ou erra o toque e nada acontece - no momento exato em que a decisao errada tem custo real, nao cosmetico.

#### Botao de pausa e botao da Ficha sao os menores alvos de todo o HUD
- **arquivo:** src/cenas/Interface.ts:148-150 (engrenagem, 26x20), 115-141 (botao da Ficha, altura interativa ~15 unidades)
- **severidade:** medio
- **categoria:** bug
- **descricao:** a engrenagem de pausa tem area de toque 26x20 (mais estreita em altura que qualquer seta do direcional), e o botao do nome do heroi (abre a Ficha) tem altura interativa de so ~15 unidades - ambos abaixo do direcional, ja problematico no achado acima.
- **cenario:** na mesma tela pequena em escala 1, tocar pra pausar ou abrir a ficha (as duas unicas formas de pausar/ver status no toque) fica ainda mais impreciso que tocar o direcional - 20 e 15 pixels CSS de altura real, quase do tamanho de um dedo de lado, nao da polpa do dedo.

### Harness de testes, parte 2

#### `npm run conferir` nunca reconstroi o dist - so verifica o build antigo
- **arquivo:** package.json (script `"conferir"`) vs ferramentas/conferir-personagens.mjs:20,29-32
- **severidade:** critico
- **categoria:** harness
- **descricao:** ao contrario de `"auditar": "npm run build && node ferramentas/auditar-ui.mjs"`, o script `"conferir"` e so `node ferramentas/conferir-personagens.mjs`, sem `npm run build` antes; o arquivo so checa `existsSync("dist")` - se `dist` ja existe (de um build anterior), nunca e regenerado, e o teste roda 100% contra o bundle antigo.
- **cenario:** alguem edita `src/dados/config.ts` (troca roupa/arma de uma classe, desconfigura um encaixe) e roda so `npm run conferir` - exatamente o fluxo que `docs/estudo-de-sprites.md` recomenda. O `dist/` antigo ainda tem as texturas certas, o teste sai "tudo ok", e o bug real so aparece quando alguem rodar `npm run build` de verdade ou em producao.

#### `conferir-personagens.mjs` usa espera fixa onde a ferramenta irma ja resolveu isso corretamente
- **arquivo:** ferramentas/conferir-personagens.mjs:58-59 (comparar com ferramentas/auditar-celular.mjs:129,139 `waitForFunction`)
- **severidade:** medio
- **categoria:** harness
- **descricao:** o script espera `waitForTimeout(2500)` cego antes de chamar `window.__aurora`/`window.jogo`, em vez de esperar condicao real (`waitForFunction`), padrao que `auditar-celular.mjs` ja usa.
- **cenario:** em CI/maquina mais lenta (ou quando o dist cresce com mais bestiario/magias), o boot pode passar de 2,5s; `window.__aurora` ainda nao existe quando o `evaluate()` roda, o script imprime "erros no console" e falha por lentidao do ambiente - nao por problema real de sprite - mascarando quando o boot de fato ficou mais pesado.

#### `conferir-teste.mjs` tem duas asserções que nunca podem falhar
- **arquivo:** ferramentas/conferir-teste.mjs:23,30
- **severidade:** baixo
- **categoria:** harness
- **descricao:** duas chamadas passam o literal `true` como condicao de sucesso - a funcao `caso()` so registra falha quando `!ok`, entao essas linhas sao vacuas: contam como "casos que passaram" sem checar nada de fato.
- **cenario:** se `testar()` mudar de um jeito que quebra exatamente o comportamento que essas linhas alegam cobrir (critico ignorar modificador/ND), `npm run teste` continua imprimindo "OK" pra esses dois casos, dando falsa confianca de cobertura onde nao ha checagem nenhuma.

#### `registrar-resolver-ts.mjs` importa `pathToFileURL` e nunca usa
- **arquivo:** ferramentas/registrar-resolver-ts.mjs:6
- **severidade:** baixo
- **categoria:** otimizacao
- **descricao:** o import nao e referenciado em lugar nenhum do arquivo - sobra provavel de uma versao anterior do bootstrap de resolucao de `.ts`.
- **cenario:** sem efeito funcional hoje, mas quem for depurar por que um import nao resolve nesse hook pode perder tempo achando que esse import tem papel na resolucao, quando quem faz o trabalho e outro arquivo.

### Logica de combate (dado, condicoes, ND de area)

#### Condicoes de controle (Preso/Assustado) nao tem nenhum efeito de jogo
- **arquivo:** src/sistemas/criatura.ts:29-38 (`decidirAcaoDaCriatura` nem recebe `condicoes`); src/cenas/Combate.ts:633-647 (`jogarCriatura`)
- **severidade:** critico
- **categoria:** bug
- **descricao:** Cresce-Grama grava `{id:"preso", turnosRestantes:2}` e Voz de Trovao grava `{id:"assustado", turnosRestantes:2}` na criatura, mas nenhum dos dois e lido em lugar nenhum - `jogarCriatura` chama `decidirAcaoDaCriatura` sem passar `condicoes`. So "atraido" (doce) e consultado de fato.
- **cenario:** Mago lanca Cresce-Grama num Goblin, acerta, o goblin fica "preso" por 2 turnos. No turno seguinte o goblin anda e ataca normalmente, como se nunca tivesse sido enraizado - as duas magias de controle do jogo hoje so causam dano do dado, sem nenhum efeito de controle.

#### Duracao de condicao nunca decrementa em combate de verdade (so no Provador)
- **arquivo:** src/sistemas/condicoes.ts:36-46 (`passarTurno`, nunca chamado a partir de Combate.ts); confirmado por grep, so Provador.ts chama a funcao; o proprio comentario em Combate.ts:1506-1511 reconhece a lacuna
- **severidade:** medio
- **categoria:** bug
- **descricao:** na cena que o jogador realmente joga, `turnosRestantes` de qualquer condicao nunca cai - so e removida se algum codigo especifico remover na mao (ex: "protegido" ao absorver golpe). As que nao tem remocao manual (atraido, iluminado, preso, assustado) duram a luta inteira em vez da duracao documentada.
- **cenario:** Heroi lanca Cheiro de Bolo numa aranha (marca "atraido", turnosRestantes:3); como `passarTurno` nunca roda, a aranha fica atraida e ignorando o heroi pelo RESTO DA LUTA INTEIRA, nao so por 3 turnos como a ficha da magia promete.

#### Gate de cooldown por rodada existe mas nunca e alimentado (armadilha pronta pro proximo passo)
- **arquivo:** src/cenas/Combate.ts:366,603,935-936,1644-1648
- **severidade:** baixo
- **categoria:** bug
- **descricao:** existe uma maquina completa de "acao em espera por N rodadas" (checagem que bloqueia clicar, HUD com contagem regressiva), mas `slot.livreNaRodada` e inicializado em 0 e so volta a 0 no fim do combate - nunca e elevado depois de usar uma acao. `emEspera` portanto e sempre `false`.
- **cenario:** o campo `espera` ja existe no prototipo do Provador mas nao no `AcaoDeCombate` real; quando uma habilidade real ganhar cooldown, o gate simplesmente nao vai funcionar - o jogador poderia usar a mesma acao toda rodada sem limite, porque o gate nunca e alimentado. Hoje e codigo morto sem sintoma visivel.

#### ND de acao em area usa so o bonus do primeiro alvo, ignora os outros
- **arquivo:** src/cenas/Combate.ts:1020-1026
- **severidade:** medio
- **categoria:** bug
- **descricao:** `const nd = 10 + (pegos[0]?.bonus ?? 0)` roda UM UNICO teste cujo resultado e aplicado a todos os atingidos de uma acao em area (Bafo Gelado, Voz de Trovao, Cresce-Grama, Bola de Fogo, Rajada). O comentario ao lado diz "hoje todo bicho tem bonus 0" - falso, o bestiario ja tem bonus 0/1/2/3/5 por criatura, e nada impede tipos diferentes coexistirem no mesmo encontro (`Mundo.ts` junta qualquer criatura dentro da distancia de encontro).
- **cenario:** combate com Goblin (bonus 0, ND 10) e Aranha (bonus 1, ND 11) juntos. Heroi lanca Bafo Gelado pegando os dois; `pegos[0]` e o goblin, `nd = 10`. Heroi rola 11 no d20: total 11 >= 10, sucesso contra os DOIS - a aranha (que exigiria ND 11) deveria ter dado "falha perto", nao sucesso pleno, so por estar agrupada com um alvo mais facil.

#### Limiar de fuga do comportamento "medroso" com off-by-one na borda exata
- **arquivo:** src/sistemas/criatura.ts:26-27 (comentario diz "Abaixo de METADE"), linha 39 (codigo usa `<=`)
- **severidade:** baixo
- **categoria:** bug
- **descricao:** o comentario diz explicitamente "abaixo" (estritamente menor) mas o codigo usa `<=` (menor-ou-igual) - foge tambem exatamente na metade da vida, nao so abaixo dela.
- **cenario:** hoje inofensivo (o unico "foge" e o Goblin, `coracoes: 5`, impar - a fracao nunca cai exatamente em 0.5); mas uma criatura futura "foge" com coracoes par (a Aranha ja tem 8) expoe o bug de verdade: com 4 de 8 (exatamente metade), a criatura foge quando deveria continuar lutando ate cair estritamente abaixo da metade.

### Mochila, equipamento e economia

#### Perda de equipamento na derrota e anulada ao recarregar o save
- **arquivo:** src/sistemas/estado.ts:453-477 (`aplicarDerrota`) + 178-204 (`abrirEspaco`/`backfillarEquipamentoInicial`)
- **severidade:** critico
- **categoria:** bug
- **descricao:** `aplicarDerrota` sorteia itens da mochila pra remover e so exclui id que comece com "chave-" - nao exclui a arma (`heroi.armaSprite`) nem a roupa (`heroi.estiloRoupa`) equipadas. Se o sorteio pegar o item equipado, ele some da mochila mas o ponteiro de equipamento continua apontando pra ele; `backfillarEquipamentoInicial()`, que roda TODA VEZ que o jogo carrega, recoloca de graca na mochila qualquer item cujo id bata com `armaSprite`/`estiloRoupa` e nao esteja mais la.
- **cenario:** jogador perde uma luta com a arma da classe equipada, o sorteio a inclui e ela some; jogador recarrega a pagina e volta com "Continuar" - `abrirEspaco` devolve a arma sem custo nenhum. O prejuizo que o CLAUDE.md descreve ("doi de verdade") desaparece pra qualquer item equipado, bastando recarregar o jogo.

#### Jogar fora item equipado nao desequipa (arma/armadura fantasma)
- **arquivo:** src/cenas/Ficha.ts:920-955 (`acoesDoItem`), 960-965 (`jogarItemFora`); src/sistemas/estado.ts:298-302 (`jogarFora`)
- **severidade:** critico
- **categoria:** bug
- **descricao:** `acoesDoItem` sempre oferece "JOGAR FORA" pra qualquer item, inclusive equipado - a checagem de "equipado" so rotula EQUIPAR/DESEQUIPAR, nunca bloqueia ou encadeia um desequipar antes do descarte. `jogarFora` mexe so na mochila, nunca em `heroi.equipamento`.
- **cenario:** jogador arrasta a armadura equipada ate a lixeira; ela sai da mochila e vai pro chao, mas `heroi.equipamento.armadura` continua com o id antigo - o heroi segue "equipado" com uma peca que nao existe em lugar nenhum. Diferente do caso da arma/roupa (achado acima), `backfillarEquipamentoInicial` NAO cobre `equipamento.armadura`/`equipamento.acessorio` - pra esses dois o desequilibrio nunca se autocorrige nem recarregando o save.

#### Item de pista duplicavel ao infinito pela mesma fala
- **arquivo:** src/dados/dialogos.ts:225-250 (`varal`), comparar com o padrao de guarda em 40-63 (`marinheiro`, variante "ja-entregou")
- **severidade:** medio
- **categoria:** bug
- **descricao:** o `varal` tem uma unica variante de fala, sem condicao tipo `etapaFeita(...)` pra trocar de fala depois da pista ja pega - diferente do `marinheiro`, que tem variante "ja-entregou" pra isso. "Examinar de perto" chama `guardar("pano-goblin")` toda vez, sem bloqueio.
- **cenario:** jogador interage com o varal, escolhe "Examinar de perto", sai e interage de novo - a mesma escolha empilha outra unidade de "pano-goblin" indefinidamente. Item de historia (nao vendavel), entao nao gera dinheiro infinito, mas duplica algo que deveria ser unico e aparece com quantidade crescente sem sentido narrativo.

#### Mochila cheia descarta item de loot silenciosamente, sem aviso
- **arquivo:** src/sistemas/estado.ts:250-268 (`guardar`, retorno `false` ignorado pelos chamadores); src/cenas/Combate.ts:1335,1384 (loot de criatura); src/cenas/Mundo.ts:792 (item do chao)
- **severidade:** medio
- **categoria:** bug
- **descricao:** `guardar()` devolve `false` sem gastar nada quando a mochila esta cheia, mas todo call site de gameplay ignora o retorno. No loot de combate, o item simplesmente nao entra e deixa de existir (a criatura ja foi removida). No item do chao, `removerItemDoChao` roda DEPOIS de `guardar`, incondicionalmente - o item some do chao mesmo quando nao coube na mochila.
- **cenario:** mochila cheia, jogador vence um combate cujo bestiario larga item raro - `guardar(id)` falha em silencio, o item nunca aparece na Ficha, sem toast/aviso nenhum de que foi perdido.

*(verificado e limpo: nao ha caminho de compra/venda que gere dinheiro infinito - so existe `comprarMochila()` (upgrade de mochila) e `venderMaterial()`; nao ha cena de loja/compra de item ainda, `LOJA` em conteudo.ts e so dado esperando a cena.)*

### NPC, dialogo e ciclo do dia

#### Rotina de NPC pode disparar no mesmo frame em que uma conversa comeca
- **arquivo:** src/cenas/Mundo.ts:885-927 (tambem 1037-1046, 1082-1105, 1155-1168)
- **severidade:** medio
- **categoria:** bug
- **descricao:** `update()` so verifica `this.conversando` ANTES de chamar `tentarInteragir()`, usando o valor do inicio do frame. Se `tentarInteragir()` abrir uma fala nesse mesmo frame, o metodo nao retorna mais cedo: continua ate `atualizarRotinasDeNpc(delta)`, que roda mesmo com `conversando` ja `true` naquele frame. O comentario proprio ("os dois `return` de cima ja cobrem essa pausa") so vale a partir do PROXIMO frame.
- **cenario:** se o relogio cruzar o inicio do proximo periodo no mesmo instante em que o jogador aperta acao sobre um NPC com rotina, o NPC pode sumir da tela (se o alvo do periodo novo for "escondido") ou teleportar pro ponto do periodo novo, no mesmo frame, com a caixa de dialogo ainda aberta. Reproduzivel de forma deterministica ajustando `estado().relogio` no console; raro em jogo normal (janela de poucos frames a cada transicao de periodo, ~6 vezes a cada 20 minutos reais).

*(verificado e limpo: rotinas de NPC sao exaustivas por tipo, sem horario inexistente; dialogos.ts so e indexado por chave estatica, sem template string escapando de verificar.mjs; criaturas de presenca por periodo so alternam visibilidade no mesmo lugar, sem duplicar ou nascer em parede; todo estado persistente passa por sistemas/estado.ts.)*

## Verificado e limpo (nao vira achado, mas evita reverificar)

- **Seguranca de entrada do jogador**: passe dedicado (innerHTML/eval/JSON.parse de localStorage/Electron/rede externa) nao achou vulnerabilidade explaravel. O unico `innerHTML` do projeto (`src/sistemas/doutor.ts:169`) escapa tudo que interpola e so mostra dado de diagnostico interno, nunca nome do heroi nem dialogo. `contextIsolation`/`nodeIntegration` do Electron corretos. Sem `fetch`/`XMLHttpRequest` no projeto.

## Status

- [x] sistemas do jogo (src/sistemas)
- [x] cenas do jogo (src/cenas)
- [x] dados e conteudo (src/dados)
- [x] harness de testes (ferramentas/*.mjs)
- [x] geracao de arte e som (arte/*.py, som/*.py)
- [x] build e performance (vite, bundle, PWA)
- [x] save/estado (armazenamento.ts, estado.ts)
- [x] toque/mobile (controles, HUD)
- [x] consistencia docs vs codigo
- [x] harness parte 2 (scripts restantes)
- [x] logica de combate (dado, condicoes, ND de area)
- [x] aplicativo de desktop (app/, Electron)
