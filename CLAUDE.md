# A Pedra do Sol, o jogo

Leia este arquivo inteiro antes da primeira alteracao. Ele vale mais que qualquer
suposicao sua sobre o projeto.

**Nome novo, decisao de 2026-09-04**: o projeto se chamava "Reino de Aurora, o
jogo". O nome mudou para refletir uma virada de tom (ver "Divergencia
deliberada" mais abaixo): perder dói de verdade, mesmo sem apagar o heroi. O
nome novo e so do produto/projeto - "Reino de Aurora" continua existindo dentro da
ficcao (o reino, os Cristais de Aurora, Vovo Aurora) exatamente como a
referencia descreve, porque isso vem do RPG de mesa e nao e o que mudou. Se
algum arquivo, pasta ou variavel de codigo ainda disser "reino-de-aurora" ou
similar, e resto do nome antigo do PROJETO (nao da ficcao) esperando limpeza,
nao um erro de leitura deste arquivo.

## O que estamos fazendo

Um RPG top-down completo, para qualquer pessoa que queira jogar. Nao e um brinquedo
educativo, nao e um presente para uma crianca especifica, nao e um exercicio. E um
jogo que precisa se sustentar sozinho na frente de gente que ja jogou muito jogo.
Mais especificamente: um RPG de sobrevivencia com consequencia de verdade -
perder custa dinheiro e itens de verdade, no tom seco de jogos como Project
Zomboid, nao um RPG confortavel que finge ter risco. Isso nao e permadeath: o
heroi sempre continua, o save nunca acaba (ver "Divergencia deliberada").

A materia-prima e um RPG de mesa que ja foi jogado de verdade, em
`docs/referencia/sistema-do-rpg-de-mesa.md`. Ele nao e inspiracao vaga: e a fonte da
verdade de nomes, lugares, regras e historia. **O jogo pode simplificar, mas nao deve
contradizer.** Quando este arquivo e a referencia discordarem, a referencia ganha, e
a divergencia vira uma decisao escrita, nao um acidente.

O jogo inteiro sao tres aventuras, oito lugares, tres Cristais de Aurora e dois
finais. Isso e muito trabalho. O jeito de chegar la e uma fase de cada vez, cada uma
jogavel de ponta a ponta, e nao um esqueleto de tudo ao mesmo tempo.

## Por onde toda decisao de design passa

O jogador que importa e alguem que nunca ouviu falar do Reino de Aurora, senta e joga.

- **Legibilidade.** Ler a tela em um segundo e virtude em qualquer jogo. Frase curta
  e boa escrita, nao limitacao. Texto tem voz, ritmo e piada.
- **Risco de verdade.** Da para perder de verdade. Perder uma luta acorda o
  heroi no Hospital da vila, sem o dinheiro que tinha e sem uma selecao
  aleatoria de itens da mochila - nunca mais "so o que estava na mao". O
  jogador joga com atencao porque o prejuizo e real, mesmo o heroi nunca
  deixando de existir.
- **Falha sem humilhacao, mas com peso.** O custo e material - carteira e
  mochila, nunca a vida do heroi - mas pesa mais que a versao de mesa. Nada de
  tela que julga, nada de "voce falhou": o jogo mostra o que foi perdido, seco
  e sem drama, e devolve o controle na hora.
- **Densidade.** Area grande se sustenta por quanta coisa acontece por tela, nao por
  quantas telas tem. Espaco vazio e sempre erro.
- **O espaco se explica sozinho.** Orientacao vem de marco visivel, luz, largura de
  trilha e silhueta. Seta piscando e o remendo de quando o mapa nao se explica.
- **Dominio.** O jogador tem que ficar melhor: no espaco, no sistema e no mundo. Uma
  area boa se atravessa a segunda vez em um terco do tempo, e o jogador sabe dizer
  por que.
- **Toque em primeiro lugar.** Se joga no iPad e no celular. Teclado e o extra.

## As regras do mundo

Vem do material de mesa, e sao a espinha do jogo. **Uma delas diverge de
proposito** - ver a secao logo abaixo antes de mexer em coracao, fogueira ou
derrota.

### Divergencia deliberada: a fogueira nao e mais quem resgata

A referencia (`docs/referencia/sistema-do-rpg-de-mesa.md`) diz: zero coracoes e
derrota, o heroi acorda na ultima fogueira acesa e perde o que carregava na
mao. Decisao de 2026-09-04 (revista no mesmo dia, depois de conversa com o
Hugo - a primeira versao desta secao chegou a escrever morte permanente; nao
e isso, ver abaixo): **este jogo diverge da referencia em dois pontos**,
nenhum dos dois apaga o heroi nem o save:

- **Onde o heroi acorda muda.** Nao e mais a ultima fogueira acesa - e o
  **Hospital**, um lugar fixo na Vila Semente que ainda nao existe no mapa e
  precisa ser desenhado e plantado em `src/dados/mapas.ts` antes disto
  funcionar de verdade (ver `docs/plano-de-implementacao.md`). A fogueira
  continua existindo e continua sendo onde se salva e descansa (enche
  coracao) - so deixa de ser tambem o ponto de resgate depois de uma derrota.
- **O que se perde e mais pesado.** Nao e mais so "o que carregava na mao" -
  e **todas as moedas** e **uma selecao aleatoria de itens da mochila**. Doi
  de verdade sem apagar progresso: mapa explorado, selos ganhos e criaturas ja
  derrotadas continuam intactos, so a carteira e a mochila levam o golpe.

A tela de derrota **nao e permadeath e nao trava o jogo**: ela mostra, seco e
sem julgamento, quanto dinheiro e quais itens sumiram, e devolve o controle na
hora, com o heroi ja no Hospital. Sem musica de fracasso, sem "voce perdeu",
sem tela de game over - so o resumo do prejuizo e um botao pra seguir.

### As regras propriamente ditas

- **Atributos:** FORCA, ESPERTEZA, CORACAO. Raca da +1, classe da +1, o jogador
  escolhe mais +1.
- **Teste:** 1d6 + atributo, em tres faixas. 1 a 2 **OPS** (deu errado, acontece
  outra coisa), 3 a 4 **QUASE** (deu certo com um probleminha), 5 ou mais
  **INCRIVEL**. Modificadores: +1 com ajuda, +1 com o item certo, -1 se for dificil.
- **QUASE e o coracao do sistema.** Sucesso com custo. O teste raramente tranca o
  caminho: ele cobra. E **nunca existe erro morto**: OPS faz acontecer outra coisa,
  jamais "nada aconteceu". E essa regra que deixa dado e tempo real caberem juntos.
- **Combate: Baldur's Gate em top-down.** O jogador age em tempo real, escolhe a
  habilidade, mira vendo alcance e area de impacto, confirma, e **o dado decide o
  resultado**. Nao e por turno e nao e por reflexo. So o heroi rola; a criatura
  reage. O modelo inteiro esta em `docs/modelo-de-combate.md`, que e a fonte da
  verdade desse assunto.
- **Coracoes:** 3, o Anao comeca com 4. Zero coracoes e **derrota** (ver a
  divergencia acima): o heroi acorda no Hospital da vila, perde todas as
  moedas e uma selecao aleatoria de itens da mochila. Mapa, selos e
  conhecimento nunca se perdem. Comer e dormir enchem os coracoes.
- **Fogueira e checkpoint.** Acender uma e permanente, enche os coracoes, e a
  distancia entre fogueiras ainda e a regua de dificuldade da area. **Nao e
  mais para onde o heroi volta apos uma derrota** - isso agora e sempre o
  Hospital da vila (ver a divergencia acima), nao importa onde a fogueira mais
  proxima estava.
- **Selos de Heroi:** a cada 3, o jogador escolhe +1 coracao, +1 num atributo, ou uma
  habilidade nova.

## O que ja existe

Jogo top-down estilo Stardew Valley, feito em **Phaser 3 + Vite + TypeScript**, roda
no navegador.

Ja funciona:
- criacao de personagem em passos (nome, raca, classe, cor de cabelo, cor de roupa)
- casas, arvores e moveis desenhados como pecas inteiras, nao como tiles colados,
  com sombra de chao e contorno, cada um com sua caixa de colisao em `objetos.json`
- heroi montado em 3 camadas de sprite, com as cores escolhidas aplicadas por tint
- mapa da Vila Semente com colisao, camera que segue o heroi
- NPCs e objetos com caixa de fala
- direcional na tela e botao de acao, mais teclado (setas ou WASD, espaco)
- oito direcoes de caminhada, com as diagonais, e direcional de disco no toque
- 5 racas por 5 classes: o corpo vem da raca, a roupa e a arma vem da classe
- roupa e arma penduradas por ponto de encaixe, nao desenhadas dentro do corpo
- tres niveis de visao (perto, normal, longe), que trocam a resolucao logica
- estado salvo em localStorage

**Nada do sistema da secao anterior existe em codigo ainda.** Nao ha dado, atributo,
coracao, combate, derrota, fogueira nem selo. Esse e o maior buraco do projeto, e a
proxima fase do roadmap.

## Como rodar

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # confere, checa os tipos e gera dist/
npm run arte     # regera toda a pixel art em public/assets (precisa de python3 e Pillow)
npm run som      # regera todo o som em public/assets/som (precisa de python3)
npm run verificar# confere os contratos invisiveis: paleta, listas, falas, som, PNG solto
npm run contraste# mede a razao de contraste de cada par de cores que se encosta
npm run auditar  # percorre as telas procurando sobreposicao e transbordo de UI
npm run conferir # confere as 25 combinacoes de raca e classe, peca por peca
npm run folha    # monta a folha com as 25 combinacoes, para olhar
npm run app      # abre o jogo como aplicativo de desktop (Electron)
npm run app:build# empacota o aplicativo para instalar
npm run ambiente # frentes paralelas: listar, criar, atualizar, fechar
```

## Regras deste projeto

**Portugues em tudo.** Nomes de arquivo, variaveis, funcoes, comentarios, commits.
Sem acento em identificador de codigo, com acento em texto que aparece na tela.

**Nenhuma coordenada de encaixe na mao.** Onde fica a mao e onde fica o tronco em
cada quadro sai de `arte/pessoa.py`, vai para `public/assets/encaixes.json` e o jogo
le de la. Se voce copiar uma coordenada para dentro de um `.ts`, ela vai divergir da
arte na primeira mexida no braco. Ver `docs/08-guia-de-sprites.md`.

**Nada de arte solta.** Todo pixel do jogo sai de `arte/gerar.py` e `arte/ui.py`. Se
precisar de um sprite novo, escreva a funcao que o desenha e rode `npm run arte`.
Nunca cole um PNG na mao em `public/assets`, porque ele seria apagado na proxima
geracao. Sprite desenhado a mao entra por `arte/sprites/`, que tem prioridade sobre o
gerado. Ver `docs/06-fluxo-de-sprites.md`.

**Nada de cor solta.** Toda cor vem de `arte/paleta.py` (arte) ou de `COR` em
`src/dados/config.ts` (interface). As duas listas sao a mesma paleta do material
impresso do RPG de mesa.

**Nada de som solto.** Todo som sai de `som/gerar.py`, e `npm run som` regera tudo,
inclusive as duas trilhas, que estao escritas nota por nota la dentro. Nunca cole um
MP3 na mao em `public/assets/som`, porque ele seria apagado na proxima geracao. Som
gravado entra por `som/prontos/`, que tem prioridade sobre o gerado, igual
`arte/sprites/` tem sobre a arte. O que existe e em que volume toca fica em
`src/dados/sons.ts`; quem toca e `src/sistemas/som.ts`, e nenhuma cena chama
`this.sound` direto. Ver `docs/11-guia-de-som.md`.

**Nenhuma arvore na mao.** Mata, mato e pedraria saem do desenho do chao em texto,
plantados por funcao, com variacao estavel pela posicao. Se voce escreveu a
tricentesima linha de `{ nome: "arvore", x, y }`, pare: falta uma letra no desenho.

**Conteudo separado de codigo.** Mapas ficam em `src/dados/mapas.ts` desenhados em
texto. Falas ficam em `src/dados/dialogos.ts`. Numeros de balanceamento ficam em
`src/dados/config.ts`. As regras do RPG ficam em `src/dados/conteudo.ts`. Adicionar
uma cena nova nao deveria exigir mexer em nenhum sistema.

**Estado num lugar so.** `src/sistemas/estado.ts`. Nenhuma cena guarda progresso em
variavel propria.

**Sistema puro, separado de Phaser.** Dado, teste, dano e progressao sao funcoes sem
cena e sem sprite, testaveis sozinhas. A cena so mostra o resultado.

**Depuracao pelo console.** O jogo expoe `window.jogo`. Da para forcar uma fala com
`jogo.scene.getScene("Interface").events.emit("falar", { quem, linhas, cena: jogo.scene.getScene("Mundo") })`.

**Nenhuma coordenada Y na mao.** Toda UI usa `caixa()` e `pilha()` de
`src/sistemas/design.ts`. Se voce somou dois numeros para achar onde vai um botao,
esta errado. Ver `docs/07-design-system.md`.

**Uma frente por pasta.** O projeto fica aberto em varias pastas ao mesmo tempo,
uma por frente de trabalho, cada uma um worktree com galho e portas proprios.
**Se existir um `AMBIENTE.md` na raiz desta pasta, leia antes de qualquer outra
coisa: ele diz de quais arquivos esta pasta cuida, e voce nao mexe nos das
outras.** Duas frentes editando o mesmo arquivo e o unico jeito de este esquema
dar errado. Toda porta sai de `ferramentas/ambiente-atual.mjs`, nenhuma escrita
na mao: com duas pastas na mesma porta, uma serve a tela da outra e a auditoria
passa verde sem motivo. O `FRENTES.md` na raiz da pasta principal e o registro
vivo do que cada conversa esta fazendo, e fica fora do git de proposito. Ver
`docs/12-ambientes-paralelos.md`.

**Verifique antes de dizer que terminou.** `npm run build` tem que passar limpo, e
ele ja comeca chamando `npm run verificar`: contrato invisivel quebrado reprova a
compilacao em vez de virar bug silencioso no iPad do Lele. `npm run contraste`,
`npm run auditar` e `npm run conferir` tem que sair com zero problemas, e o jogo tem
que abrir sem erro no console. Para ouvir o som um a um, `npm run dev` e
`/banca.html`. A auditoria
salva um screenshot de cada tela em `ferramentas/telas/`, e `npm run folha` monta as
25 combinacoes de raca e classe em `ferramentas/telas/personagens.png`. Olhe as duas
coisas.

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
ferramentas/verificar.mjs   contratos invisiveis: paleta, listas, falas, PNG solto
ferramentas/auditar-ui.mjs  sobreposicao e transbordo de UI, tela por tela
ferramentas/conferir-personagens.mjs  as 25 combinacoes de raca e classe
ferramentas/ambiente.mjs    cria e fecha as frentes de trabalho paralelas
ferramentas/ambiente-atual.mjs  o numero e as portas desta pasta
arte/manifesto.py      hash de cada PNG gerado, para ver o que mudou
src/cenas/             Boot, Som, Titulo, Carregar, Criacao, Mundo, Interface, Pausa
som/gerar.py           todo o som, e as duas trilhas escritas nota por nota
som/prontos/           som gravado que substitui o gerado
src/dados/sons.ts      o catalogo: que sons existem, em que volume, com que voz
src/sistemas/som.ts    quem toca. unico arquivo que fala com o audio do Phaser
banca.html             /banca.html no npm run dev: ouvir todos os sons um a um
arte/gente.py          junta tudo e salva: heroi em camadas, npcs, goblins, aranhas
arte/pessoa.py         corpo e bracos por raca, e os pontos de encaixe
arte/roupa.py          as roupas, desenhadas fora do corpo
arte/cabelo.py         cortes de cabelo e chapeus
arte/equipamento.py    as armas, desenhadas sozinhas, com ponto de pega
arte/ui.py             painel de 9 fatias e icones da interface
arte/sprites/          desenhos a mao que substituem os gerados
docs/                  conceito, roteiro, arquitetura, arte, roadmap, sprites, design, som
docs/referencia/       o RPG de mesa original e as ilustracoes que inspiram a arte
```

## O que fazer agora

`docs/05-roadmap.md` tem as fases em ordem. A proxima esta marcada como **AGORA**.
Nao pule fase, e nao comece a fase seguinte sem o jogo estar jogavel na atual.
