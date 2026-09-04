# Como a arte entra no jogo

Existem dois caminhos, e os dois convivem. Voce escolhe sprite a sprite.

## Caminho 1, gerado por codigo

E o padrao. A funcao que desenha o sprite vive em `arte/gerar.py` (mundo) ou
`arte/ui.py` (interface), e `npm run arte` regera tudo.

Vantagem: mudar a paleta muda o jogo inteiro numa linha, o git mostra o que mudou, e
da para pedir ajuste ao Claude Code em texto ("deixa o telhado mais escuro").

Desvantagem: sprite organico fica duro. Cara de personagem, bicho, arvore com
personalidade. Codigo nao desenha bem essas coisas.

## Caminho 2, desenhado a mao

Qualquer PNG colocado em `arte/sprites/` **ganha** da versao gerada, desde que o nome
bata. Rode `npm run arte` depois e o gerador monta a folha usando o seu desenho.

Nomes reconhecidos hoje:

| Arquivo em `arte/sprites/` | Substitui |
|---|---|
| `tile-grama.png` | o tile de grama |
| `tile-telhado.png` | o telhado |
| `tile-copa.png` | a copa da arvore |
| `tile-<nome>.png` | qualquer tile da lista `TILES` |

O tamanho tem que bater: tile e 16 x 16, personagem e 16 x 24, icone de interface e
16 x 16. Fundo transparente, menos nos tiles de copa, tronco e arbusto, que precisam
ter grama por baixo.

Se voce quiser estender esse mecanismo para os personagens e os icones, a funcao
`a_mao(nome)` em `arte/gerar.py` ja existe e e so chamar nos outros geradores. Esta
anotado no roadmap.

## Onde desenhar, de graca

| Ferramenta | Onde roda | Observacao |
|---|---|---|
| **Pixelorama** | desktop, Windows, Mac e Linux | gratuito e aberto, tem camada, animacao e paleta importavel. E a recomendacao. |
| **LibreSprite** | desktop | fork livre do Aseprite, mesma interface |
| **Piskel** | navegador | mais simples, otimo para um sprite rapido sem instalar nada |
| **Lospec Pixel Editor** | navegador | leve, ja vem com paletas prontas |
| **Aseprite** | desktop, pago | o padrao da industria, custa pouco e vale se virar rotina |

Antes de desenhar, importe a paleta do jogo na ferramenta. Os valores estao em
`arte/paleta.py`. Assim o desenho a mao nunca sai do tom do resto.

## Bancos de arte prontos

Se em algum momento fizer sentido usar arte de terceiros em vez de desenhar:

- **Kenney.nl**, dominio publico (CC0), varios pacotes de interface e de RPG top-down
- **OpenGameArt**, filtrando por licenca CC0
- **itch.io**, secao de assets gratuitos, sempre conferindo a licenca de cada pacote

Cuidado com dois pontos. Primeiro, licenca: use so CC0 ou algo que permita uso sem
atribuicao obrigatoria, ou entao guarde os creditos num arquivo `CREDITOS.md`.
Segundo, coerencia: pacote de terceiro quase nunca casa com a paleta e o tamanho de
tile daqui. Misturar sem cuidado deixa o jogo com cara de colagem.

## O fluxo que funciona bem

1. O gerador cria a versao rascunho de tudo, e o jogo fica jogavel na hora.
2. Voce joga e percebe o que incomoda visualmente.
3. So esses sprites viram desenho a mao, um por um, no Pixelorama.
4. Cada PNG novo entra em `arte/sprites/` e substitui o rascunho.
5. O resto continua gerado, e continua acompanhando a paleta.

Assim o jogo nunca fica travado esperando arte, e a arte melhora aos poucos onde
importa mais.
