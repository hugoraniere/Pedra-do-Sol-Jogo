# Roadmap

Uma fase de cada vez. So comece a proxima quando a atual estiver **jogavel de ponta
a ponta**, sem erro no console e com `npm run build` limpo.

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

## Fase 1, a vila fica viva . AGORA

O objetivo e o Lele conseguir jogar a cena 1 inteira sozinho, sem ninguem explicando.

- [ ] **Sistema de pistas.** Achar uma pista guarda na mochila e muda a fala dos NPCs.
      Estrutura nova em `src/dados/pistas.ts`, estado em `estado().mochila`.
- [ ] **Diario simples.** Um botao no topo abre a lista do que ele ja descobriu e
      qual e o proximo passo, em uma frase.
- [ ] **Setinha de destino.** Se o jogador ficar 10 segundos parado, uma seta dourada
      pisca na direcao do proximo objetivo. E o que resolve o "nao sei o que fazer".
- [ ] **Fala com retrato.** A caixa de dialogo ganha o rostinho de quem esta falando.
- [ ] **O varal com o pano cinza** como objeto interagivel no mapa da vila.
- [ ] **Som.** Passo, abrir fala, achar pista. Tres efeitos sao suficientes por enquanto.
- [ ] **Sprites a mao onde mais aparece.** O heroi, os quatro NPCs e a copa da arvore
      sao os que mais pesam na primeira impressao. Ver `docs/06-fluxo-de-sprites.md`.
      Estender `a_mao()` para personagens e icones, hoje ele so cobre os tiles.
- [ ] **Sprite de retrato dos NPCs**, 32x32, para a chapinha da caixa de fala.
- [ ] **Falas com estado.** Hoje cada NPC tem uma fala fixa em `dialogos.ts`. Precisa
      de variantes: antes de achar a pista, depois de achar, depois de resolver.
      Estrutura sugerida: `{ id, condicao, linhas }[]` e a primeira condicao que bate
      e a que toca. O estado ja tem `mochila` e `visitados` para consultar.

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
- [ ] **Um sprite proprio por criatura do bestiario.** Sao 9, e por enquanto so o
      goblin existe. Usar a mesma folha de 6 por 4.
- [ ] **Quadros de acao de verdade**: ataque, pescar, colher. Hoje so existe
      `conjurando`, que serve de quebra-galho para tudo.
- [ ] **Sprites a mao onde mais aparece**, ver `docs/06-fluxo-de-sprites.md`.

---

## Fase 1.6, criacao de personagem . FEITO EM PARTE

- [x] tela de aparencia com boneco grande de um lado e as escolhas do outro
- [x] escolher tom de pele, estilo e cor de cabelo, estilo e cor de roupa, chapeu
- [x] botao COM EQUIPAMENTO / SEM EQUIPAMENTO
- [x] ficha resumida ao lado do boneco no passo final
- [ ] **Girar o boneco** com uma setinha, para ver os quatro angulos.
- [ ] **Escolher a arma** entre as de `conteudo.ts`, com o preview mudando na hora.
      Os sprites de arma ja existem, falta so a linha de escolha.
- [ ] **Escolher as tres magias** entre as 13, para a classe Mago.
- [ ] **Rosto** como camada propria: sobrancelha, sardas, olhos de cores diferentes.

Pronto quando: da para comecar do zero, achar as tres pistas e sair da vila sem
nenhuma instrucao de fora.

---

## Fase 2, a floresta

- [ ] segundo mapa em `mapas.ts`, com transicao entre lugares
- [ ] sistema de transicao de mapa (porta, borda, escada) reaproveitavel
- [ ] a arvore que fala, repetindo a ultima frase
- [ ] as aranhas andando devagar, sem perseguir o jogador
- [ ] o dado de 1d6 na tela, com as tres faixas de cor do RPG de mesa

---

## Fase 3, a caverna e o fim da aventura 1

- [ ] mapa da caverna com os tiles de caverna que ja existem
- [ ] os goblins dancando em volta do sino, em animacao de loop
- [ ] as tres saidas da cena: forca, furtividade e conversa
- [ ] a virada do Zonzo, com fala longa e escolha real do jogador
- [ ] o Cristal do Amanhecer, tela de recompensa com selos e moedas

---

## Fase 4, acabamento

- [ ] fonte de bitmap propria no lugar do `monospace` do sistema
- [ ] tela de titulo com a arte do jogo
- [ ] botao de continuar e de recomecar
- [ ] ajustar o jogo em tela de celular deitado e em pe
- [ ] publicar no GitHub Pages e mandar o link

---

## Depois, se fizer sentido

- missao da pescaria com os peixes brasileiros
- a Ponte dos Trolls como cena propria
- mais racas e classes na criacao
- um segundo jogador na mesma tela
