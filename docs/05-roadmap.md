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

**O maior buraco do projeto.** O RPG de mesa em `docs/referencia/` ja e um jogo
completo no papel, e nada dele existe em codigo: nao ha dado, atributo, coracao,
combate, derrota, fogueira nem selo. Sem isso o jogo e um passeio com dialogo, e
nenhuma area nova conserta isso.

Tudo estreia **na Vila Semente**, que ja existe e e pequena. Nao se estreia sistema
em mapa novo.

- [ ] **`src/sistemas/dado.ts`.** 1d6 + atributo, tres faixas, modificadores (+1 com
      ajuda, +1 com o item certo, -1 se dificil). Puro, sem Phaser, testavel sozinho.
- [ ] **Atributos no estado.** FORCA, ESPERTEZA e CORACAO em `estado().heroi`, vindos
      da raca e da classe, mais o +1 que o jogador escolhe.
- [ ] **A cena do dado.** O 1d6 na tela com as tres faixas de cor do material
      impresso. E o momento de tensao do jogo inteiro: merece animacao propria, nao
      um numero aparecendo.
- [ ] **Coracoes.** Tres, quatro para o Anao. Perder, encher comendo e dormindo.
- [ ] **Derrota e fogueira.** Zero coracoes: o heroi cai, acorda na ultima fogueira
      acesa e perde o que carregava. Conhecimento nunca se perde. Acender fogueira e
      permanente e entra no save.
- [ ] **Combate, o laco inteiro.** Escolher a habilidade, mirar vendo alcance e area
      de impacto, confirmar, e o dado decidir. Tempo real, com o tempo desacelerando
      durante a mira. So o heroi rola; a criatura reage. Um inimigo de teste na vila
      basta para provar o laco. Modelo em `docs/modelo-de-combate.md`.
- [ ] **O modo de alvo.** Anel de alcance, previa da area no chao, alvo destacado,
      cancelamento, e a confirmacao em dois passos no toque. E o maior pedaco de UI
      que o projeto ja teve, e por isso estreia na vila.
- [ ] **Barra de habilidades**, com recarga visivel e atalho de teclado.
- [ ] **Selos de Heroi.** A cada 3, o jogador escolhe +1 coracao, +1 atributo ou uma
      habilidade nova.
- [ ] **Dom de raca e as tres magias**, com 1 uso por aventura cada.

Pronto quando: da para tomar um susto na vila, perder, acordar na fogueira, e
entender exatamente o que custou.

---

## Fase 1.2, a vila deixa de ser cenario

- [ ] **Sistema de pistas.** Achar uma pista guarda na mochila e muda a fala dos
      NPCs. Estrutura em `src/dados/pistas.ts`, estado em `estado().mochila`.
- [ ] **Falas com estado.** Hoje cada NPC tem uma fala fixa em `dialogos.ts`. Precisa
      de variantes: antes de achar a pista, depois de achar, depois de resolver.
      Estrutura sugerida: `{ id, condicao, linhas }[]`, e a primeira condicao que bate
      e a que toca.
- [ ] **Diario.** A lista do que ja se descobriu e do que esta em aberto. E o registro
      do jogador, nao um guia que aponta para onde ir.
- [ ] **Fala com retrato**, 32x32, para a chapinha da caixa de dialogo.
- [ ] **O varal com o pano cinza** como objeto interagivel.
- [ ] **Som.** Passo, abrir fala, achar pista, rolar dado.
- [ ] **Sprites a mao onde mais aparece.** O heroi, os quatro NPCs principais e a copa
      da arvore sao os que mais pesam na primeira impressao. Estender `a_mao()` para
      personagens e icones, hoje ele so cobre os tiles. Ver `docs/06-fluxo-de-sprites.md`.

---

## Fase 1.5, sprites e animacao . FEITO EM PARTE

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
- [ ] **Quadros de acao de verdade**: atacar, ser atingido, cair. Hoje so existe
      `conjurando`, que serve de quebra-galho para tudo. A Fase 1 precisa deles.
- [ ] **Um sprite proprio por criatura do bestiario.** Sao 9, e por enquanto so o
      goblin existe. Usar a mesma folha de 6 por 4.

---

## Fase 1.6, criacao de personagem . FEITO EM PARTE

- [x] tela de aparencia com boneco grande de um lado e as escolhas do outro
- [x] escolher tom de pele, estilo e cor de cabelo, estilo e cor de roupa, chapeu
- [x] botao COM EQUIPAMENTO / SEM EQUIPAMENTO
- [x] ficha resumida ao lado do boneco no passo final
- [ ] **O +1 de atributo escolhido pelo jogador.** Depende da Fase 1 e e a escolha
      mais importante da criacao.
- [ ] **Escolher a arma** entre as de `conteudo.ts`, com o preview mudando na hora.
      Os sprites ja existem, falta a linha de escolha.
- [ ] **Escolher as tres magias** entre as 13, para o Mago da Torre.
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
