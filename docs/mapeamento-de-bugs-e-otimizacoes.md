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
- **severidade:** critico
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

## Status

- [x] sistemas do jogo (src/sistemas)
- [x] cenas do jogo (src/cenas)
- [x] dados e conteudo (src/dados)
- [x] harness de testes (ferramentas/*.mjs)
- [x] geracao de arte e som (arte/*.py, som/*.py)
- [x] build e performance (vite, bundle, PWA)
