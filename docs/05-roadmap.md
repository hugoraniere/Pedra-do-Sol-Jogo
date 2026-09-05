# Roadmap

Uma fase de cada vez. So comece a proxima quando a atual estiver **jogavel de ponta
a ponta**, sem erro no console e com `npm run build` limpo.

O arco completo sao tres aventuras e dois finais. O plano nao e construir tudo pela
metade: e deixar a **aventura 1 boa de verdade**, do sino roubado ao Cristal do
Amanhecer, e so depois repetir o metodo. Uma aventura excelente vale mais que tres
esbocadas.

---

## Fase 0, esqueleto . FEITO

- [x] projeto Vite + TypeScript + Phaser
- [x] gerador de pixel art em Python, com paleta unica
- [x] heroi em tres camadas com cores escolhidas pelo jogador
- [x] criacao de personagem em passos
- [x] Vila Semente com colisao e camera que segue
- [x] NPCs, objetos e caixa de fala
- [x] direcional de toque e teclado
- [x] estado salvo em localStorage
- [x] kit de interface em pixel art: painel de 9 fatias, coracoes, moeda, selo,
      direcional e botao de acao, tudo na paleta do material impresso
- [x] fonte de pixel Silkscreen, vinda do npm, sem depender de CDN
- [x] pipeline que aceita sprite desenhado a mao em `arte/sprites/`

---

## Fase 0.5, casca do jogo . FEITO

- [x] tela inicial com logo, CONTINUAR, NOVO JOGO, CARREGAR e SAIR
- [x] tres espacos de save com nome, lugar, tempo, selos e moedas
- [x] menu de pausa com salvar, configuracoes e sair
- [x] configuracao de zoom da camera: perto, normal, longe
- [x] aplicativo de desktop com Electron, pronto para empacotar
- [x] fonte de bitmap, sem borrao
- [x] todo o conteudo do RPG de mesa em `src/dados/conteudo.ts`
- [x] design system com `caixa()` e `pilha()`, e auditor de UI com `npm run auditar`

---

## Fase 1, o sistema . AGORA

**O maior buraco do projeto ja tem chao.** O combate joga de verdade, os
atributos vem da raca/classe/escolha, dom e magia gastam uso de aventura, e
agora o risco de verdade fecha: derrota, fogueira e Selo de Heroi funcionam de
ponta a ponta.

Tudo estreia **na Vila Semente**, que ja existe e e pequena. Nao se estreia sistema
em mapa novo.

- [ ] **O dado, como sistema proprio.** A conta (1d6 + atributo, tres faixas) existe
      espalhada — `rolar()` em `sistemas/turnos.ts`, `faixaDoDado()` em
      `dados/sons.ts` — mas nunca juntou num `sistemas/dado.ts` puro e testavel.
      Os modificadores do material impresso (+1 com ajuda, +1 com o item certo,
      -1 se dificil) **nao existem em lugar nenhum do codigo ainda**.
- [x] **Atributos no estado.** `poderesDoHeroi()` (`sistemas/poderes.ts`) soma
      raca (+1) + classe (+1) + a escolha do jogador (`heroi.poderEscolhido`),
      igual o manual pede.
- [ ] **A cena do dado.** Existe `mostrarDado()` dentro de `Combate.ts`: um cartao
      que aparece na propria tela de combate com a face, o bonus e a palavra da
      faixa. Funciona, mas e um popup embutido, nao "o momento de tensao do jogo
      inteiro" com cena e animacao propria que este item pedia — fica em aberto
      se vale a pena separar.
- [ ] **Coracoes.** Perder funciona de verdade em combate (`Combate.ts`, desconta
      e salva no estado). Falta o resto: comer e dormir nao enchem nada ainda, e o
      Anao continua nascendo com 3 coracoes em vez de 4 (`coracoesMax` e fixo em
      `novoJogo()`, o dom dele nao esta ligado).
- [x] **Derrota e fogueira.** Zero coracoes nocauteia de verdade: o heroi fica
      tonto, a tela esmaece e `Mundo.acordarNaFogueira()` acorda ele na ULTIMA
      fogueira acesa (`estado().fogueirasAcesas`, mesmo em mapa diferente de
      onde caiu), com coracoes cheios e moedas zeradas — conhecimento nunca se
      perde. Acender e permanente (`acenderFogueira()`), a fogueira da Vila ja
      comeca acesa, e sentar numa ja acesa tambem cura.
- [x] **Combate, o laco inteiro** — mas **o modelo mudou**. Ver a decisao logo
      abaixo: nao e mais tempo real com mira, e por turnos.
- [ ] **O modo de alvo.** A fase de mira existe de verdade (`Combate.ts`): anel de
      alcance, alvos piscando, cancelamento por ESC ou reclique. Falta a
      confirmacao em dois passos (hoje um toque dentro do alcance ja executa) e
      a previa de area para acoes "ao redor", que hoje executam na hora sem
      passar pela mira.
- [x] **Barra de habilidades**, com recarga visivel (pontinhos) e atalho 1-6 no
      teclado. `Combate.ts`.
- [x] **Selos de Heroi.** Cada criatura vencida rende um selo (`ganharSelo()`,
      `Combate.ts`); a cada 3, `acabarCombate()` abre a tela nova
      `EscolhaDeSelo.ts` por cima do Mundo (mesmo padrao de `Pausa.ts`), igual
      o manual manda: +1 coracao, +1 num poder (`heroi.bonusDeSelo`, somado em
      `poderesDoHeroi()`), ou uma magia nova (sorteada entre as ainda nao
      aprendidas).
- [x] **Dom de raca e as tres magias**, 1 uso por aventura cada, de verdade
      (`estado().usosDeAventura`, `registrarUso()` chamado ao executar em
      `Combate.ts`).

Pronto quando: da para tomar um susto na vila, perder, acordar na fogueira, e
entender exatamente o que custou. **O risco de verdade ja joga de ponta a
ponta.** O que ainda falta pra fechar a fase de vez e mais modesto: o dado
como `sistemas/dado.ts` proprio (hoje espalhado), coracoes cheios por comer/
dormir e o Anao com 4, e os dois passos que faltam no modo de alvo
(confirmacao e previa de area).

**Decisao, registrada em `docs/plano-do-combate.md`: o combate deixou de ser
tempo real com mira e virou por turnos** (estilo mesa, decidido e construido
direto no Provador antes deste roadmap ser atualizado). Duas consequencias que
o texto antigo deste roadmap ainda nao refletia: o modelo de mira/alcance em
pixel/tempo real saiu do jogo, e a regra da mesa "so o heroi rola, o monstro
reage" tambem foi revista — no jogo os dois lados rolam, com o mesmo cartao de
dado pros dois. Ver tambem `docs/mundo-que-reage.md` e `docs/11-combate-e-
magias.md`, que ja assumem turno como modelo vigente.

**Decisao, 2026-09-05: dois itens da Fase 1.2 foram adiantados antes desta fase
fechar.** A pedido direto (aprofundar os NPCs da Vila Semente e dar um ciclo de
dia/noite ao jogo), entraram fora de ordem:

- Os 8 NPCs nomeados da vila ganharam idade, papel, personalidade, historia,
  relacoes e afinidades (`src/dados/npcs.ts`). O mercador deixou de se chamar
  "Barnabe" — a referencia de mesa ja usa esse nome para o mercador de
  Portomares — e virou "Seu Cominho".
- Um relogio de jogo de verdade (`src/dados/tempo.ts` + `src/sistemas/tempo.ts`,
  persistido em `estado().relogio`), com o ceu escurecendo por cima da Vila
  Semente e cada um dos 8 indo pro lugar certo conforme o periodo do dia
  (`Pessoa.rotina` em `mapas.ts`, andado de verdade pelo mesmo A* do clique do
  heroi).

O motivo: dar vida ao elenco antes de repetir o metodo em outro lugar, em vez de
esperar o sistema de dado/combate fechar primeiro.

**Decisao, 2026-09-05: o resto da Fase 1.2 tambem foi adiantado**, a pedido
direto (falas condicionadas + missoes + opcoes de dialogo). Ver os itens
marcados abaixo — o unico que ficou de proposito pra depois foi ramificacao de
dialogo em mais de um nivel, pra nao inventar mecanismo demais antes da hora.

---

## Fase 1.2, a vila deixa de ser cenario

- [x] **Sistema de pistas** — implementado como sistema de missoes, nao como
      `pistas.ts` separado: `dados/missoes.ts` (catalogo, principal e
      secundaria, em etapas) + `sistemas/missoes.ts` (progresso, reusando
      `estado().visitados` em vez de um array novo). O varal ja guarda um item
      de verdade na mochila e avanca a missao do sino.
- [x] **Falas com estado.** `dados/dialogos.ts`: `Fala` agora e uma lista de
      `variantes` com `condicao?: () => boolean`, checadas em ordem — exatamente
      a estrutura `{ id, condicao, linhas }[]` que este item sugeria. Ja tem
      variante por periodo do dia (pescador de noite) e por etapa de missao
      (vovo antes/depois da pista).
- [x] **Diario.** Aba de verdade na ficha (`Ficha.ts`, `paginaDiario()`): so
      mostra missao ja aceita, com a etapa atual ou "Concluida!".
- [ ] **Fala com retrato**, 32x32, para a chapinha da caixa de dialogo. Ainda so
      texto (`Interface.ts`).
- [x] **O varal com o pano cinza** como objeto interagivel, com escolha de
      dialogo: examinar guarda o pano e avanca a missao, deixar pra la e so sabor.
- [ ] **Som.** Passo, abrir fala e rolar dado tocam de verdade. "Achar pista" esta
      cadastrado (`dados/sons.ts`, com o comentario "o roadmap pede pista na
      fase 1") mas **nenhuma cena toca esse som ainda** — nem o varal, que era o
      lugar obvio.
- [ ] **Sprites a mao onde mais aparece.** O heroi, os quatro NPCs principais e a copa
      da arvore sao os que mais pesam na primeira impressao. Estender `a_mao()` para
      personagens e icones, hoje ele so cobre os tiles. Ver `docs/06-fluxo-de-sprites.md`.
      `arte/sprites/` hoje so tem tile — nenhum personagem a mao ainda.

---

## Fase 1.5, sprites e animacao . FEITO

- [x] folha de 6 colunas por 4 linhas: parado, passo A, passo B, respirando,
      conjurando e tonto, nas 4 direcoes
- [x] ciclo de caminhada no padrao do Stardew (1,2,1,3 a 5 fps) com o corpo subindo
      1 px no meio do passo
- [x] animacao de respiracao para heroi e NPC, no lugar do tween de escala
- [x] braco como camada de cima, o que permite arma na mao
- [x] 10 NPCs com corpo, cabelo, roupa e chapeu proprios
- [x] contorno seletivo, rampas de cor com deslocamento de matiz, silhueta com canto
      arredondado
- [x] guia de tecnica em `docs/08-guia-de-sprites.md`, com as referencias
- [x] **Quadros de acao de verdade**: `QUADRO` em `config.ts` ja tem ataque,
      machucado, tonto, fuga e derrota — nao e mais so `conjurando` pra tudo.
- [x] **Um sprite proprio por criatura do bestiario.** As 9 criaturas tem PNG
      proprio hoje (aranha, espantalho, lobo-nevoa, serpente, grulo, bruxa,
      cavaleiro-cinzas, brasanegra, + as variacoes de goblin).

**Em aberto, sem decisao ainda:** o goblin foi pro dobro da resolucao (48x96,
`docs/estudo-de-resolucao.md`) como excecao isolada, antes de qualquer decisao
de resolucao pro resto do jogo — que continua em conflito nao resolvido com a
recomendacao antiga de 32x64 em `docs/09-plano-de-resolucao-e-contraste.md`.
Quanto mais criatura/NPC ganhar sprite proprio, mais caro fica adiar essa
escolha.

---

## Fase 1.6, criacao de personagem . FEITO EM PARTE

- [x] tela de aparencia com boneco grande de um lado e as escolhas do outro
- [x] escolher tom de pele, estilo e cor de cabelo, estilo e cor de roupa, chapeu
- [x] botao COM EQUIPAMENTO / SEM EQUIPAMENTO
- [x] ficha resumida ao lado do boneco no passo final
- [x] **O +1 de atributo escolhido pelo jogador.** `Criacao.ts`, passo "Escolha
      seu ponto forte", grava em `poderEscolhido`.
- [ ] **Escolher a arma** entre as de `conteudo.ts`, com o preview mudando na hora.
      Os sprites ja existem, falta a linha de escolha — hoje a arma vem fixa da
      classe (`equipamentoDaClasse()`), sem escolha nenhuma.
- [ ] **Escolher as tres magias** entre as 13, para o Mago da Torre. Hoje o Mago
      recebe TODAS as magias da classe de uma vez, sem escolher.
- [ ] **Girar o boneco** com uma setinha, para ver os quatro angulos.
- [ ] **Rosto** como camada propria: sobrancelha, sardas, olhos de cores diferentes.

---

## Fase 2, a Floresta dos Sussurros

Plano completo em `docs/10-mapa-da-floresta.md`. Area grande de verdade: anel com
atalhos, cerca de 28 telas, marco central visivel de todo lado.

- [ ] sistema de transicao de mapa (porta, borda, escada) reaproveitavel
- [ ] a letra de mata no desenho do chao, que planta a floresta sem 800 linhas na mao
- [ ] **os ecos**: escutar uma arvore guarda uma frase, falar a frase certa abre
      passagem. O verbo proprio da area, e o ensaio do final do jogo
- [ ] os tres atalhos, que so abrem do lado de la
- [ ] criaturas com rotina propria, que reagem ao barulho e nao perseguem de graca
- [ ] as fogueiras da area, com a distancia entre elas afinada
- [ ] descarte de objeto fora da camera, medido no iPad

---

## Fase 3, a Ponte dos Trolls

- [ ] Grulo, o pedagio de 3 moedas e a charada
- [ ] tres saidas, todas certas: pagar, acertar a charada, fazer o troll rir
- [ ] a primeira negociacao de verdade do jogo, com o dado valendo

---

## Fase 4, a Caverna Boca-de-Sapo e o fim da aventura 1

- [ ] mapa da caverna com os tiles de caverna que ja existem
- [ ] os goblins dancando em volta do sino, em animacao de loop
- [ ] as tres entradas: forca, furtividade e conversa
- [ ] a virada do Zonzo: os goblins nao roubaram por maldade, e qualquer solucao que
      o jogador inventar depois disso funciona
- [ ] o Cristal do Amanhecer, e a recompensa com selos e moedas

---

## Fase 5, acabamento da aventura 1

- [ ] afinacao de ritmo e dificuldade de ponta a ponta
- [ ] tela de titulo com a arte do jogo
- [ ] o jogo em tela de celular deitado e em pe
- [ ] teste com gente que nunca viu o jogo, e correcao do que travou
- [ ] publicar

---

## Depois, as aventuras 2 e 3

O material de mesa ja tem tudo: o Cristal do Meio-dia engolido pela Serpente do
Pantano Ronco, o Cristal do Anoitecer com a Bruxa Espinho na Torre Torta, o Pico
Cinzalta, e os dois finais (derrubar os dez coracoes de Brasanegra, ou remontar a
Pedra do Sol e chama-lo de **Aurel**).

Tambem ficam para depois: Portomares e o Grande Mercado, Fornalha, Altacoruja, e a
missao de pescaria com os peixes brasileiros.

---

## Resolucao, contraste e UI

Plano escrito e ainda nao executado, em `docs/09-plano-de-resolucao-e-contraste.md`.
Tres fases, e a primeira (contraste) nao depende das outras duas.
