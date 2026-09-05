# A Casa de Cura, primeiro interior

Esboco de design. Nada aqui foi implementado. Nasceu de uma conversa que comecou
pedindo "um hospital" e terminou em outro lugar, porque a referencia nao deixou o
pedido original de pe.

## Por que nao um hospital

`docs/referencia/sistema-do-rpg-de-mesa.md` lista oito lugares, e nenhum deles e um
hospital: Vila Semente, Portomares, Fornalha, Altacoruja, Floresta Sussurro, Ponte
dos Trolls, Pantano Ronco, Pico Cinzalta. O mundo e fantasia medieval, com dragao,
bruxa e ferreira, nao tem predio de concreto com maca e soro. `CLAUDE.md` e direto
sobre isso: o jogo pode simplificar a referencia, mas nao pode contradize-la. Um
hospital literal contradiz.

O que cabe no lugar e uma **Casa de Cura**: cabana de curandeira, meio farmacia
medieval, meio enfermaria de vila. Mesma funcao que o pedido original queria cobrir,
sem quebrar o tom nem o material de mesa.

## Quem mora la

**Vovo Aurora**, reaproveitada, em vez de um NPC novo. Ela ja e a figura de
autoridade da Vila Semente — e quem da o gancho da aventura 1 em
`docs/02-roteiro.md` — e o mundo e pequeno o suficiente para nao precisar espalhar
personagem a toa. A Casa de Cura vira a casa dela, nao um posto de saude impessoal.

Um segundo corpo na cena evita que o lugar seja so um balcao vazio. A melhor opcao
amarra num gancho que ja existe: o roteiro tem "Seu Fagundes fala dos peixes
sumindo" como gancho de missao de pescaria. Se o segundo corpo for alguem passando
mal por causa do peixe ruim, a Casa de Cura planta essa sub-missao sem precisar de
cena nova nem NPC novo.

## Pra que serve

Este e o ponto que mais merece cuidado, porque o sistema ja resolve cura de duas
formas: **comer e dormir enchem os coracoes**, e a **fogueira** e o checkpoint e
revive de verdade. Se a Casa de Cura tambem cura de graca, ela compete com os dois
pilares e esvazia "risco de verdade" — perder tem que doer, e "queda custa" e regra
do mundo, nao coincidencia.

Por isso a Casa de Cura **nao cura de graca**. Os papeis dela sao:

- **Fonte de comida ou pocao, comprada com moedas.** Da uso cedo para os 5 moedas
  iniciais do heroi, antes de qualquer loja de verdade existir.
- **Hub de rumor e pista.** Vovo Aurora sabe de coisa que mais ninguem sabe — cabe
  perfeito no papel que ela ja tem na aventura 1.
- **Respiro de ritmo.** Depois da manha tensa da vila sem sino, um interior quieto
  e quentinho e contraste de tom, nao mecanica de cura.

A cama que existe na cena e da Vovo ou do paciente, nunca do heroi. Ele nao deita
nela para curar. Isso mantem a fogueira como o unico lugar que revive de verdade.

## O espaco

Um comodo so, pequeno de proposito — e o piloto de um mecanismo novo, nao uma
mansao. Porta, prateleira de potes e ervas penduradas, uma mesa ou caldeirao, a
cama do paciente, talvez um tapete e uma janela para luz entrar.

As pecas entram como funcoes novas em `arte/mundo.py`, na paleta de
`arte/paleta.py`, do mesmo jeito que casa, arvore e poco ja existem. Nenhum PNG
baixado entra direto: a regra "nada de arte solta" do `CLAUDE.md` vale aqui igual
vale em qualquer outro lugar do jogo, e qualquer coisa colada a mao em
`public/assets` seria apagada no proximo `npm run arte`.

### Referencias externas, so para estudo de silhueta

Nenhum destes pacotes entra no jogo, nem os gratuitos e nem os CC0 — a regra "nada
de arte solta" nao abre excecao para licenca permissiva, porque o problema nunca foi
direito autoral, e sim que nenhum pacote de fora nasceu na paleta e no traco deste
jogo (contorno seletivo, cores limitadas, proporcao chibi). Servem so para olhar
como um interior pequeno organiza porta, prateleira e caldeirao, e depois desenhar a
versao do jogo do zero em `arte/mundo.py`:

**Cabana de bruxa/alquimista, o mais proximo do que a Casa de Cura precisa:**
- [Witch Hut \[16x16\] Free Assets](https://maxence-jacquot.itch.io/witch-hut-16x16-free-assets),
  Maxence Jacquot — gratuito, 16×16 (mesmo grid do jogo), ja pensado como cabana
  inteira, nao pecas soltas.
- [Alchemist Pack – 16x16 Pixel Art](https://marcopg.itch.io/alchemist-pack-16x16-pixel-art),
  MarcoPG — parede, piso, estante, bancada, caldeirao, decoracao de laboratorio.
- [Haven Witch Pixel Pack](https://soppycraft.itch.io/haven-witch), Soppycraft —
  estante, pocao, vidro, cristal, erva, pote, em clima aconchegante.
- [Alchemy & Oddities — Icon Pack](https://pixeltier.itch.io/pixeltiers-alchemy-rpg-icon-pack),
  pixeltier — icones 16×16 de ferramenta de alquimista, pocao, po, erva. Mais util
  para pensar item/objeto solto do que tileset de chao.

**Interior de fantasia mais generico, para contexto de mobilia:**
- [The Fantasy Tileset](https://ventilatore.itch.io/the-fantasy-tileset), Ventilatore
  — mesma serie do "Medieval Interiors".
- Interior Fantasy Tileset, S Frisk (itch.io) — clima escuro, "cute mas meio
  assombrado".
- 7T4E — Apothecaries, Dreaming of Light (itch.io, gratuito) — prateleira de pocao,
  erva pendurada.
- Kenney Furniture Kit e Fantasy Town Kit (kenney.nl, CC0) — formas simples, uteis
  so para proporcao de mobilia, nao para estilo.

Pacotes de hospital moderno (maca, aparelho medico, 32 px) foram descartados: nao
tem nada a ver com o tom do jogo.

## O que isso implica de sistema

Entrar em predio e mecanismo novo — hoje casa e peca inteira vista de fora, com
colisao, ninguem entra nelas. Precisa de:

- porta como gatilho na Vila Semente
- uma cena de interior separada, mapa pequeno em `src/dados/mapas.ts`
- transicao de ida e volta que preserva o estado do heroi (`src/sistemas/estado.ts`)

Vale desenhar isso ja como template generico — piso, parede, porta, janela num grid
padrao — porque o roadmap vai querer reusar para loja, ferraria e torre depois. A
Casa de Cura e o primeiro caso, nao o unico.

## Onde isso entra no roadmap

`docs/05-roadmap.md` esta na **Fase 1, o sistema**: dado, atributo, coracao,
combate, derrota, fogueira, selo. Nada disso existe em codigo ainda, e o
`CLAUDE.md` e explicito — nao comecar fase nova sem a atual estar jogavel.

A Casa de Cura reforca coracao e fogueira em vez de competir com eles, entao cabe
dentro da Fase 1 ou logo depois dela, sem contradizer a ordem do roadmap. O que nao
cabe e construir o interior antes do sistema base existir: sem coracao e sem
fogueira em codigo, a Casa de Cura nao tem contra o que se equilibrar.

## Em aberto

- Nome e situacao exata do paciente — se vira mesmo o gancho do peixe ruim do Seu
  Fagundes, ou se e flavor solto.
- Preco de comida e pocao na Casa de Cura, que depende do sistema de moedas ainda
  nao implementado.
- Se o template generico de interior nasce junto com a Casa de Cura, ou se ela sai
  como caso unico primeiro e o template se extrai depois, no segundo interior.
