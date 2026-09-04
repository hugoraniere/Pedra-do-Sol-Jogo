# Reino de Aurora, o jogo

Leia este arquivo inteiro antes da primeira alteracao. Ele vale mais que qualquer suposicao sua sobre o projeto.

## Para quem e este jogo

Para o **Lele, 7 anos**. Ele e o unico jogador que importa. Toda decisao de design passa por isso:

- Ele le pouco e devagar. Frase curta, uma ideia por tela, letra grande.
- Ele nao sabe o que fazer quando a tela nao diz. Nunca deixe o jogador sem uma proxima acao obvia.
- Ele nao pode perder. Nao existe game over, morte, ou tela de derrota. Errar sempre gera uma consequencia divertida, nunca um castigo.
- Ele joga no iPad e no celular. Toque tem que funcionar em tudo, sem depender de teclado.
- Ele criou o personagem dele no RPG de mesa: **O Trovao da Floresta**, Elfo da Folha, Mago. Se puder fazer uma piscadela para isso, faca.

## O que ja existe

Jogo top-down estilo Stardew Valley, feito em **Phaser 3 + Vite + TypeScript**, roda no navegador.

Ja funciona:
- criacao de personagem em passos (nome, raca, classe, cor de cabelo, cor de roupa)
- casas, arvores e moveis desenhados como pecas inteiras, nao como tiles colados,
  com sombra de chao e contorno, cada um com sua caixa de colisao em `objetos.json`
- heroi montado em 3 camadas de sprite, com as cores escolhidas aplicadas por tint
- mapa da Vila Semente com colisao, camera que segue o heroi
- NPCs e objetos com caixa de fala
- direcional na tela e botao de acao, mais teclado (setas ou WASD, espaco)
- estado salvo em localStorage

## Como rodar

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # checa os tipos e gera dist/
npm run arte     # regera toda a pixel art em public/assets (precisa de python3 e Pillow)
npm run auditar  # percorre as telas procurando sobreposicao e transbordo de UI
npm run app      # abre o jogo como aplicativo de desktop (Electron)
npm run app:build# empacota o aplicativo para instalar
```

## Regras deste projeto

**Portugues em tudo.** Nomes de arquivo, variaveis, funcoes, comentarios, commits. Sem acento em identificador de codigo, com acento em texto que aparece na tela.

**Nada de arte solta.** Todo pixel do jogo sai de `arte/gerar.py` e `arte/ui.py`. Se precisar de um sprite novo, escreva a funcao que o desenha e rode `npm run arte`. Nunca cole um PNG na mao em `public/assets`, porque ele seria apagado na proxima geracao. Sprite desenhado a mao entra por `arte/sprites/`, que tem prioridade sobre o gerado. Ver `docs/06-fluxo-de-sprites.md`.

**Nada de cor solta.** Toda cor vem de `arte/paleta.py` (arte) ou de `COR` em `src/dados/config.ts` (interface). As duas listas sao a mesma paleta do material impresso do RPG de mesa.

**Conteudo separado de codigo.** Mapas ficam em `src/dados/mapas.ts` desenhados em texto. Falas ficam em `src/dados/dialogos.ts`. Numeros de balanceamento ficam em `src/dados/config.ts`. Adicionar uma cena nova nao deveria exigir mexer em nenhum sistema.

**Estado num lugar so.** `src/sistemas/estado.ts`. Nenhuma cena guarda progresso em variavel propria.

**Depuracao pelo console.** O jogo expoe `window.jogo`. Da para forcar uma fala com
`jogo.scene.getScene("Interface").events.emit("falar", { quem, linhas, cena: jogo.scene.getScene("Mundo") })`.

**Nenhuma coordenada Y na mao.** Toda UI usa `caixa()` e `pilha()` de `src/sistemas/design.ts`. Se voce somou dois numeros para achar onde vai um botao, esta errado. Ver `docs/07-design-system.md`.

**Verifique antes de dizer que terminou.** `npm run build` tem que passar limpo, `npm run auditar` tem que sair com zero problemas, e o jogo tem que abrir sem erro no console. A auditoria salva um screenshot de cada tela em `ferramentas/telas/`, olhe eles.

## Estrutura

```
arte/gerar.py          orquestra a geracao  ->  public/assets/
arte/paleta.py         a paleta, unica fonte de cor
arte/tiles.py          chao: grama, terra, caminho, agua, caverna
arte/mundo.py          objetos inteiros: casa, arvore, poco, barraca
src/main.ts            configuracao do Phaser
src/dados/             config, mapas, dialogos. conteudo, nao codigo
src/sistemas/          estado, controles, heroi, botao, design, texto, auditoria
src/dados/conteudo.ts  racas, classes, magias, armas, loja e bestiario do RPG de mesa
app/                   o aplicativo de desktop, Electron
ferramentas/           auditoria de UI e os screenshots que ela tira
src/cenas/             Boot, Criacao, Mundo, Interface
arte/gente.py          heroi, npcs e goblin, 16x32
arte/ui.py             painel de 9 fatias e icones da interface
arte/sprites/          desenhos a mao que substituem os gerados
docs/                  conceito, roteiro, arquitetura, arte, roadmap, fluxo de sprites
docs/referencia/       o RPG de mesa original e as ilustracoes que inspiram a arte
```

## O que fazer agora

`docs/05-roadmap.md` tem as fases em ordem. A proxima esta marcada como **AGORA**. Nao pule fase, e nao comece a fase seguinte sem o jogo estar jogavel na atual.
