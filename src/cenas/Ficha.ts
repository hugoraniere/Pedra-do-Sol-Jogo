/** A janela do heroi, aberta por cima do mundo.
 *
 * Um lugar so, com abas no topo, como o inventario do Stardew Valley: EU,
 * PODERES, MAGIAS, MOCHILA, DIARIO, MENU. Cada aba e a folha de papel que o
 * Lele preencheu na mesa, ou uma promessa do que ainda vai existir.
 *
 * As tres primeiras vem do material impresso: docs/referencia/sistema-do-rpg-
 * de-mesa.md e os PDFs (ficha do heroi, manual do criador de heroi). MOCHILA e
 * DIARIO ainda nao tem dado nenhum por tras: mostram um recado honesto em vez
 * de fingir que ja existem. MENU e a ponte para a Pausa, ate o dia em que a
 * Pausa virar conteudo desta mesma janela.
 *
 * O que a ficha de papel tem e ainda nao mostra, porque nao existe no estado
 * do jogo: mascote, ponto fraco, grito de guerra, e o +1 de poder que o
 * jogador escolhe. Nada disso e inventado aqui: quando a criacao perguntar e o
 * estado guardar, vira mais um bloco nas listas abaixo.
 *
 * Nenhuma coordenada Y na mao: a janela devolve a area, a pilha empilha, as
 * colunas dividem. Ver docs/07-design-system.md.
 */
import Phaser from "phaser";
import { ALTURA, ALTURA_PERSONAGEM, ARMA_DO_SPRITE, COR, LARGURA, LARGURA_PERSONAGEM, SPRITE_DA_ARMA } from "../dados/config";
import {
  ATRIBUTOS,
  ORDEM_PODERES,
  acharArma,
  acharClasse,
  acharMagia,
  acharRaca,
  acharQualquerItem,
  type ItemPossuido,
} from "../dados/conteudo";
import {
  estado,
  equipar,
  venderMaterial,
  jogarFora,
  moverItem,
  capacidadeDaMochila,
  type SlotDaMochila,
} from "../sistemas/estado";
import { precisaAgora, temEfeitoForaDeCombate, usarConsumivel } from "../sistemas/consumiveis";
import { nivelDoMoodle, type NivelDeMoodle } from "../sistemas/moodles";
import { MISSOES } from "../dados/missoes";
import { missaoAceita, etapaAtual } from "../sistemas/missoes";
import { Heroi, camadasDoHeroi, criarAnimacoes } from "../sistemas/heroi";
import { ICONE, LADO_ICONE } from "../sistemas/icones";
import { ICONE_ITEM } from "../sistemas/icones-itens";
import { poderesDoHeroi } from "../sistemas/poderes";
import { Aba, alturaUtilDaJanela, janela, larguraUtilDaJanela } from "../sistemas/janela";
import { botao } from "../sistemas/botao";
import {
  ALTURA_CHIP,
  ESPACO,
  TAMANHO,
  alturaDosChips,
  arrumarChips,
  chip,
  chipsNaLinha,
  larguraDoChip,
  colunas,
  marcar,
  meio,
  pilha,
  quebrar,
  textoNaArea,
  Retangulo,
} from "../sistemas/design";
import { medirTexto, texto } from "../sistemas/texto";
import { refazerAoRedimensionar } from "../sistemas/visao";
import { tocar } from "../sistemas/som";
import type { Mundo } from "./Mundo";

/** Indice de MOCHILA em ABAS — a unica pagina que nao usa o sistema de
 *  Bloco/pilha generico: e uma grade de slot com icone, nao uma lista de
 *  texto. Ver `desenharMochila()`. */
const INDICE_MOCHILA = 3;

const SLOT = 26;
const GAP_SLOT = 4;

/** Peso da coluna do boneco+slots contra a coluna da grade — mesma tecnica
 *  de `identidade()` (colunas([1,3])), so que a grade precisa de mais
 *  espaco que um retrato porque mostra varios icones, nao um texto so. */
const PESOS_COLUNA_MOCHILA = [2, 5];

type SlotDeEquipamento = "roupa" | "armadura" | "acessorio" | "arma";

/** Os 4 slots visiveis na coluna de equipamento, nesta ordem — de dentro
 *  (o que veste primeiro) pra fora, exceto arma, que fica por ultimo por
 *  ser o mais "acao" dos quatro. Revisao de 2026-09-05: equipamento entrou
 *  na propria aba MOCHILA (Baldur's Gate 3 nao esconde isso numa aba
 *  separada), boneco e grade lado a lado. */
const SLOTS_DE_EQUIPAMENTO: { tipo: SlotDeEquipamento; rotulo: string }[] = [
  { tipo: "roupa", rotulo: "ROUPA" },
  { tipo: "armadura", rotulo: "ARMADURA" },
  { tipo: "acessorio", rotulo: "ACESSORIO" },
  { tipo: "arma", rotulo: "ARMA" },
];

/** Rotulo de categoria pra dica da mochila (secao 17.2 do plano). Historia
 *  fica de fora do dicionario de proposito: nunca tem raridade nem preco, e
 *  a propria funcao que le isto ja sai cedo pra ela. */
const ROTULO_CATEGORIA: Record<Exclude<ItemPossuido["categoria"], "historia">, string> = {
  consumivel: "CONSUMIVEL",
  material: "MATERIAL",
  roupa: "ROUPA",
  armadura: "ARMADURA",
  acessorio: "ACESSORIO",
  arma: "ARMA",
};

/** Um pedaco de pagina. Cada um sabe de quanta altura precisa antes de existir,
 *  que e o que deixa a pagina se cortar sozinha quando a tela e baixa. */
type Bloco =
  | { tipo: "identidade" }
  | { tipo: "titulo"; conteudo: string; valor?: string }
  | { tipo: "texto"; linhas: string[] }
  | { tipo: "chips"; linhas: string[][] }
  | { tipo: "acao"; rotulo: string; aoTocar: () => void };

/** Um titulo e o que vem embaixo dele sao um GRUPO, e o grupo nao se parte.
 *  Sem isto a tela baixa deixava "MINHAS MAGIAS" sozinho, sem magia nenhuma
 *  embaixo, que e pior do que nao mostrar. */
type Grupo = Bloco[];

type Pagina = { grupos: Grupo[] };

/** As abas, na ordem em que aparecem. Fixas: nao dependem do estado do heroi,
 *  entao moram fora da classe, e o indice aqui e o mesmo indice de paginas(). */
const ABAS: Aba[] = [
  { rotulo: "EU" },
  { rotulo: "PODERES" },
  { rotulo: "MAGIAS" },
  { rotulo: "MOCHILA" },
  { rotulo: "DIARIO" },
  { rotulo: "MENU" },
];

export class Ficha extends Phaser.Scene {
  private pagina = 0;
  private boneco?: Heroi;

  // ------------------------------------------------------- grade da mochila
  // So esta pagina foge do sistema de Bloco/pilha: e uma grade de slot com
  // icone (ver docs/plano-de-itens-e-equipamento.md, "focar em icones, hover,
  // arrastar pra reorganizar, botao direito pra usar"), nao uma lista de
  // texto. Estado de arrastar/pressionar precisa sobreviver ENTRE chamadas de
  // desenhar() (que destroi e reconstroi todo o resto), entao mora aqui.
  private slotsMochila: { indice: number; area: Retangulo }[] = [];
  private zonaJogarFora?: Retangulo;
  private iconeLixeira?: Phaser.GameObjects.Image;
  private dicaCaixaMochila?: Phaser.GameObjects.Container;
  private dicaTextoMochila?: Phaser.GameObjects.BitmapText;
  private dicaChapaMochila?: Phaser.GameObjects.NineSlice;
  private indiceComDica?: number;
  private pressionando?: { indice: number; x: number; y: number; temporizador: Phaser.Time.TimerEvent };
  private arrastando?: { deIndice: number; icone: Phaser.GameObjects.Image };
  // menu de acoes (17.3): os proprios botoes ja saem destruidos por
  // children.removeAll a cada desenhar(), mas as duas listas guardam
  // referencia solta se ninguem as limpar junto — reset em desenhar().
  private botoesMenu: Phaser.GameObjects.GameObject[] = [];
  private areasBotoesMenu: Retangulo[] = [];
  private indiceComMenu?: number;
  /** true enquanto o menu de escolha de um SLOT DE EQUIPAMENTO (roupa,
   *  armadura, acessorio, arma — nao um slot da mochila) esta aberto.
   *  Reaproveita `botoesMenu`/`areasBotoesMenu`/`fecharMenuDeAcoes()` — so
   *  precisa da propria guarda porque `indiceComMenu` e um indice de
   *  mochila, e este menu nao tem um. */
  private menuDeEquipamentoAberto = false;
  /** true so entre "botao direito acabou de abrir o menu" e "o mesmo
   *  pointerdown chegou no handler global da cena" — ver aoPressionarSlot/
   *  aoPressionarNaCena. Sincrono, dura menos que um evento. */
  private ignorarProximoFechamentoDeMenu = false;

  constructor() {
    super("Ficha");
  }

  create() {
    this.pagina = 0;
    this.pressionando = undefined;
    this.arrastando = undefined;
    this.desenhar();
    // Esc fecha tambem, para quem esta no teclado. O botao continua sendo o
    // caminho de verdade: no iPad nao existe Esc.
    this.input.keyboard?.removeAllListeners("keydown");
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.fechar();
      if (e.key === "ArrowLeft") this.irPara(this.pagina - 1);
      if (e.key === "ArrowRight") this.irPara(this.pagina + 1);
    });
    refazerAoRedimensionar(this, () => this.desenhar());

    // botao direito usa o item (a mesma acao do toque longo, ver
    // aoPressionarSlot) — sem isto o menu do navegador cobriria o jogo.
    this.input.mouse?.disableContextMenu();
    // arrastar e soltar sao globais da CENA, nao do slot: o dedo/ponteiro sai
    // da area do slot de origem assim que comeca a arrastar.
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.aoMoverPonteiro(pointer));
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.aoSoltarPonteiro(pointer));
    // fecha o menu de acoes (17.3) se o toque foi fora dele — precisa ser
    // pointerdown pra chegar ANTES do pointerup que os proprios botoes do
    // menu escutam, ver aoPressionarNaCena.
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.aoPressionarNaCena(pointer));
  }

  private irPara(indice: number) {
    // da a volta: as setas do teclado nunca chegam numa aba que nao existe
    this.pagina = (indice + ABAS.length) % ABAS.length;
    this.desenhar();
  }

  private fechar() {
    tocar("pausa-fecha");
    // troca de roupa/armadura/acessorio/arma so mexe no boneco DESTA janela
    // (Heroi e uma instancia por cena) — sem isto o heroi no mundo ficava
    // com a aparencia antiga ate trocar de mapa.
    (this.scene.get("Mundo") as Mundo).atualizarAparenciaDoHeroi();
    this.scene.resume("Mundo");
    this.scene.stop();
  }

  // ------------------------------------------------------------- conteudo
  /** As paginas, na ordem da ficha de papel. So dado: nada aqui desenha. */
  private paginas(): Pagina[] {
    const st = estado();
    const raca = acharRaca(st.heroi.raca);
    const classe = acharClasse(st.heroi.classe);
    const largura = larguraUtilDaJanela();
    const poderes = poderesDoHeroi(st.heroi);
    const arma = acharArma(classe.arma);
    const magias = st.heroi.magias.map((m) => acharMagia(m)?.nome).filter((n): n is string => !!n);

    const chips = (textos: string[]): Bloco => ({ tipo: "chips", linhas: arrumarChips(this, textos, largura) });
    const paragrafo = (conteudo: string): Bloco => ({ tipo: "texto", linhas: quebrar(conteudo, largura) });

    // rotulo em PALAVRA, nunca numero cru — a gravidade fala por si so
    // (Legibilidade). Ver sistemas/moodles.ts.
    const ROTULO_FOME: Record<NivelDeMoodle, string> = {
      normal: "Bem alimentado", alerta: "Com fome", critico: "Faminto",
    };
    const ROTULO_SONO: Record<NivelDeMoodle, string> = {
      normal: "Descansado", alerta: "Cansado", critico: "Exausto",
    };

    // um recado honesto no lugar de fingir que existe conteudo: a mochila e o
    // diario ainda nao tem dado nenhum por tras, entao nao inventamos um aqui
    const emConstrucao = (recado: string): Pagina => ({
      grupos: [[paragrafo(recado)]],
    });

    // uma missao so aparece aqui depois de aceita (etapas[0] concluida) —
    // o diario e o registro do que o jogador ja sabe, nunca um spoiler do
    // que ainda vai encontrar
    const paginaDiario = (): Pagina => {
      const conhecidas = Object.entries(MISSOES).filter(([id]) => missaoAceita(id));
      if (conhecidas.length === 0) {
        return emConstrucao("Nada para anotar ainda. Fale com alguem na vila.");
      }
      return {
        grupos: conhecidas.map(([id, missao]) => {
          const atual = etapaAtual(id);
          return [
            { tipo: "titulo", conteudo: missao.titulo.toUpperCase() } as Bloco,
            paragrafo(atual ? atual.descricao : "Concluida!"),
          ];
        }),
      };
    };

    return [
      {
        // EU
        grupos: [
          [{ tipo: "identidade" }],
          [
            { tipo: "titulo", conteudo: "MINHA ARMA E MEU DOM" },
            chips([arma?.nome ?? "Sem arma", raca.dom]),
          ],
          [
            { tipo: "titulo", conteudo: "COMO VOCE ESTA" },
            chips([ROTULO_FOME[nivelDoMoodle("fome")], ROTULO_SONO[nivelDoMoodle("sono")]]),
          ],
        ],
      },
      {
        // PODERES
        grupos: ORDEM_PODERES.map((id) => [
          { tipo: "titulo", conteudo: ATRIBUTOS[id].nome, valor: String(poderes[id]) } as Bloco,
          paragrafo(ATRIBUTOS[id].oQueFaz),
        ]),
      },
      {
        // MAGIAS (a pagina "o que eu sei fazer" da versao anterior)
        grupos: [
          [{ tipo: "titulo", conteudo: raca.dom.toUpperCase() }, paragrafo(raca.domTexto)],
          [
            { tipo: "titulo", conteudo: classe.habilidade.toUpperCase() },
            // quando a classe tem magia, o nome das magias vale mais do que a
            // frase explicando que ele tem magias: ele ja sabe, quer saber quais
            magias.length ? chips(magias) : paragrafo(classe.habilidadeTexto),
          ],
        ],
      },
      { grupos: [] }, // MOCHILA: desenharMochila() cuida sozinha, ver desenhar()
      paginaDiario(),
      {
        // MENU: ponte para a Pausa, ate ela virar conteudo desta mesma janela
        grupos: [
          [paragrafo("Pausar o jogo, salvar, ou mudar como voce ve a tela.")],
          [
            {
              tipo: "acao",
              rotulo: "ABRIR PAUSA",
              aoTocar: () => {
                this.scene.stop();
                this.scene.launch("Pausa");
              },
            },
          ],
        ],
      },
    ];
  }

  /** Espaco que vem antes do bloco. Dentro de um grupo nada se separa. */
  private gapDoBloco(bloco: Bloco, primeiroDoGrupo: boolean): number {
    if (!primeiroDoGrupo) return bloco.tipo === "chips" ? ESPACO.xs : 0;
    return ESPACO.md;
  }

  private alturaDoBloco(bloco: Bloco): number {
    if (bloco.tipo === "identidade") return this.alturaDaIdentidade();
    // titulo SEMPRE usa ALTURA_CHIP, com valor (chapa dourada) ou sem — as
    // duas formas sao "uma linha de destaque", igual chips, e tinham numero
    // diferente (10 vs 12) so por acidente de quem escreveu cada uma. Texto
    // corrido continua TAMANHO.linhaTexto: e paragrafo, nao destaque, e
    // precisa de mais LINHA na tela, nao de linha mais alta (ver
    // docs/plano-de-itens-e-equipamento.md, secao 17.1).
    if (bloco.tipo === "titulo") return ALTURA_CHIP;
    if (bloco.tipo === "texto") return bloco.linhas.length * TAMANHO.linhaTexto;
    if (bloco.tipo === "acao") return TAMANHO.botao;
    return alturaDosChips(bloco.linhas);
  }

  /** Altura de um grupo inteiro, com os espacos de dentro dele. */
  private alturaDoGrupo(grupo: Grupo, primeiro: boolean): number {
    return grupo.reduce(
      (soma, bloco, i) =>
        soma + (i === 0 && primeiro ? 0 : this.gapDoBloco(bloco, i === 0)) + this.alturaDoBloco(bloco),
      0
    );
  }

  private alturaDaIdentidade(): number {
    return (
      TAMANHO.linhaTitulo +
      ESPACO.xs +
      TAMANHO.linhaTexto +
      ESPACO.xs +
      TAMANHO.linhaTexto +
      ESPACO.sm +
      TAMANHO.chapa
    );
  }

  // ------------------------------------------------------------- desenho
  private desenhar() {
    this.children.removeAll(true);
    this.boneco = undefined;
    // o que estava sendo arrastado, ou o menu de acoes aberto, nao
    // sobrevivem a um redesenho (removeAll acabou de destruir os
    // GameObjects deles) — sem isto o proximo pointermove/pointerdown
    // tentaria mexer em algo morto.
    this.arrastando = undefined;
    this.botoesMenu = [];
    this.areasBotoesMenu = [];
    this.indiceComMenu = undefined;
    this.menuDeEquipamentoAberto = false;

    if (this.pagina === INDICE_MOCHILA) {
      this.desenharMochila();
      return;
    }

    const pagina = this.paginas()[this.pagina];

    // mede primeiro: grupo que nao couber nesta resolucao nao entra, e sai
    // INTEIRO, nunca deixando um titulo orfao
    const teto = alturaUtilDaJanela({ comAbas: true });
    const cabem: Grupo[] = [];
    let usado = 0;
    for (const grupo of pagina.grupos) {
      const precisa = this.alturaDoGrupo(grupo, cabem.length === 0);
      if (usado + precisa > teto) break;
      usado += precisa;
      cabem.push(grupo);
    }

    const area = janela(this, {
      alturaConteudo: usado,
      aoFechar: () => this.fechar(),
      abas: { itens: ABAS, ativa: this.pagina, aoEscolher: (i) => this.irPara(i) },
    });

    const p = pilha(area, ESPACO.md);
    cabem.forEach((grupo, g) => {
      grupo.forEach((bloco, i) => {
        const gap = g === 0 && i === 0 ? 0 : this.gapDoBloco(bloco, i === 0);
        if (bloco.tipo === "identidade") {
          this.identidade(p.reservar(this.alturaDaIdentidade(), gap));
        } else if (bloco.tipo === "titulo") {
          this.titulo(p.reservar(this.alturaDoBloco(bloco), gap), bloco.conteudo, bloco.valor);
        } else if (bloco.tipo === "texto") {
          bloco.linhas.forEach((linha, j) => {
            const r = p.reservar(TAMANHO.linhaTexto, j === 0 ? gap : 0);
            marcar(texto(this, r.x, r.y, linha, { cor: COR.tintaSuave }), "texto", linha);
          });
        } else if (bloco.tipo === "chips") {
          bloco.linhas.forEach((linha, j) => {
            const r = p.reservar(ALTURA_CHIP, j === 0 ? gap : ESPACO.sm);
            chipsNaLinha(this, r, linha);
          });
        } else {
          // creme, nao ouro: FECHAR e sempre a acao em destaque desta janela, e
          // dois botoes dourados lado a lado nao diriam qual e o principal
          const r = p.reservar(TAMANHO.botao, gap);
          botao(this, r.x + r.largura / 2, meio(r), Math.min(r.largura, 160), r.altura, bloco.rotulo, bloco.aoTocar, "painel-creme");
        }
      });
    });
  }

  /** Titulo de secao. Com valor, ele vira a linha de um poder: o nome de um lado
   *  e o numero numa chapa dourada do outro, igual ao circulo da ficha de papel. */
  private titulo(linha: Retangulo, conteudo: string, valor?: string) {
    marcar(
      texto(this, linha.x, meio(linha), conteudo, { cor: COR.tinta, ancoraY: 0.5 }),
      "texto",
      conteudo
    );
    if (valor === undefined) return;
    chip(this, linha.x + linha.largura - larguraDoChip(this, valor), linha.y, valor, "painel-ouro");
  }

  /** Retrato de um lado, quem ele e do outro. E a cabeca da ficha de papel. */
  private identidade(bloco: Retangulo) {
    const st = estado();
    const [rRetrato, rDados] = colunas(bloco, [1, 3]);

    // chapa escura atras do boneco: sem ela o sprite claro some no papel claro
    marcar(
      this.add
        .nineslice(rRetrato.x, rRetrato.y, "painel-escuro", undefined, rRetrato.largura, rRetrato.altura, 8, 8, 8, 8)
        .setOrigin(0),
      "fundo"
    );

    // a escala sai da altura do bloco, nao de um numero escolhido a olho: em meio
    // pixel a arte borra, entao so meio em meio
    const escala = Math.max(1, Math.floor((rRetrato.altura / ALTURA_PERSONAGEM) * 2) / 2);
    criarAnimacoes(this, camadasDoHeroi(st.heroi).map((c) => c.chave));
    this.boneco = new Heroi(this, rRetrato.x + rRetrato.largura / 2, rRetrato.y + rRetrato.altura, st.heroi);
    this.boneco.body.moves = false;
    this.boneco.setScale(escala);

    const p = pilha(rDados, ESPACO.xs);

    const rNome = p.reservar(TAMANHO.linhaTitulo);
    const nome = st.heroi.nome || "Heroi";
    // o nome do heroi e o titulo da tela: so cai para a fonte pequena quando o
    // nome medido de verdade nao couber na coluna
    const tamanho = medirTexto(this, nome, 16) <= rNome.largura ? 16 : 8;
    marcar(
      texto(this, rNome.x, meio(rNome), nome, { tamanho, cor: COR.tinta, ancoraY: 0.5 }),
      "texto",
      nome
    );

    [acharRaca(st.heroi.raca).nome, acharClasse(st.heroi.classe).nome].forEach((linha) => {
      const r = p.reservar(TAMANHO.linhaTexto);
      marcar(texto(this, r.x, r.y, linha, { cor: COR.tintaSuave }), "texto", linha);
    });

    this.numeros(p.reservar(TAMANHO.chapa, ESPACO.sm));
  }

  /** Vida, moedas e selos. Icone grande primeiro, numero depois. */
  private numeros(linha: Retangulo) {
    const st = estado();
    const [rVida, rMoedas, rSelos] = colunas(linha, [4, 2, 2], ESPACO.sm);

    // vida virou numero de verdade (sistemas/dado.ts) - uma fileira de
    // coracoes nao cabia mais depois que a vida passou de 10. Mesma barra
    // colorida do HUD do mundo e do combate (Interface.ts, Combate.ts):
    // verde acima de metade, laranja ate um quarto, vermelho abaixo disso.
    const alturaBarra = 10;
    const yBarra = meio(rVida) - alturaBarra / 2;
    marcar(this.add.rectangle(rVida.x, yBarra, rVida.largura, alturaBarra, 0x2c2440).setOrigin(0, 0), "icone");
    const fracao = Math.max(0, Math.min(1, st.coracoes / st.coracoesMax));
    const corBarra = fracao > 0.5 ? 0x3e9b62 : fracao > 0.25 ? 0xf5b62b : 0xe2483d;
    marcar(
      this.add.rectangle(
        rVida.x + 1, yBarra + 1, Math.max(1, (rVida.largura - 2) * fracao), alturaBarra - 2, corBarra
      ).setOrigin(0, 0),
      "icone"
    );
    marcar(
      texto(this, rVida.x + rVida.largura / 2, meio(rVida), `${Math.max(0, st.coracoes)}/${st.coracoesMax}`, {
        cor: 0xfff8ea, ancora: 0.5, ancoraY: 0.5,
      }),
      "texto",
      `${st.coracoes}/${st.coracoesMax}`
    );

    ([
      [rMoedas, ICONE.moeda, st.moedas],
      [rSelos, ICONE.selo, st.selos],
    ] as [Retangulo, number, number][]).forEach(([r, quadro, valor]) => {
      marcar(this.add.image(r.x + LADO_ICONE / 2, meio(r), "ui", quadro), "icone");
      marcar(
        texto(this, r.x + LADO_ICONE, meio(r), String(valor), { cor: COR.tinta, ancoraY: 0.5 }),
        "texto",
        String(valor)
      );
    });
  }

  // --------------------------------------------------------- grade da mochila
  /** A grade inteira: slot por slot, mais a zona de jogar fora e a dica. Foge
   *  do sistema Bloco/pilha de proposito — grade de icone e outra forma de
   *  conteudo, nao uma lista de texto. */
  private desenharMochila() {
    const st = estado();
    const capacidade = capacidadeDaMochila();
    const larguraTotal = larguraUtilDaJanela();

    // as larguras das duas colunas, calculadas ANTES de saber a altura da
    // janela (colunas() so usa x/largura da area que recebe, entao um
    // retangulo fantasma de altura 0 basta pra descobrir as larguras —
    // a MESMA chamada roda de novo depois, com a area de verdade, pra
    // posicionar).
    const [colEquipFantasma, colGradeFantasma] = colunas(
      { x: 0, y: 0, largura: larguraTotal, altura: 0 },
      PESOS_COLUNA_MOCHILA
    );
    const colunasGrade = Math.max(1, Math.floor((colGradeFantasma.largura + GAP_SLOT) / (SLOT + GAP_SLOT)));
    const linhasGrade = Math.ceil(capacidade / colunasGrade);
    const alturaGrade = linhasGrade * (SLOT + GAP_SLOT) - GAP_SLOT;
    const alturaZona = Math.max(TAMANHO.linhaTexto, LADO_ICONE) + ESPACO.sm;
    const alturaColunaGrade = alturaGrade + ESPACO.md + alturaZona;

    const alturaColunaEquipamento = this.alturaEquipamento(colEquipFantasma.largura);

    const alturaConteudo = Math.max(alturaColunaGrade, alturaColunaEquipamento);

    const area = janela(this, {
      alturaConteudo,
      aoFechar: () => this.fechar(),
      abas: { itens: ABAS, ativa: this.pagina, aoEscolher: (i) => this.irPara(i) },
    });

    const [colEquip, colGrade] = colunas(area, PESOS_COLUNA_MOCHILA);
    this.desenharEquipamento(colEquip);

    this.slotsMochila = [];
    const p = pilha(colGrade, ESPACO.md);
    const rGrade = p.reservar(alturaGrade, 0);
    for (let i = 0; i < capacidade; i++) {
      const col = i % colunasGrade;
      const lin = Math.floor(i / colunasGrade);
      const slotArea: Retangulo = {
        x: rGrade.x + col * (SLOT + GAP_SLOT),
        y: rGrade.y + lin * (SLOT + GAP_SLOT),
        largura: SLOT,
        altura: SLOT,
      };
      this.slotsMochila.push({ indice: i, area: slotArea });
      this.desenharSlot(i, slotArea, st.mochila[i]);
    }

    const rJogar = p.reservar(alturaZona, ESPACO.sm);
    this.zonaJogarFora = rJogar;
    marcar(
      this.add
        .nineslice(rJogar.x, rJogar.y, "painel-creme", undefined, rJogar.largura, rJogar.altura, 6, 6, 6, 6)
        .setOrigin(0),
      "fundo"
    );
    const [rIconeLixeira, rTextoLixeira] = colunas(rJogar, [1, 6], ESPACO.xs);
    this.iconeLixeira = this.add.image(rIconeLixeira.x + LADO_ICONE / 2, meio(rJogar), "ui", ICONE.lixeira);
    marcar(this.iconeLixeira, "icone");
    textoNaArea(this, rTextoLixeira, "ARRASTE ATE AQUI PRA JOGAR FORA", { tamanho: 8, cor: COR.tintaSuave });

    this.criarDicaMochila();
  }

  // ----------------------------------------------------- coluna de equipamento
  /** Altura da coluna de equipamento (boneco + 4 slots empilhados), pra
   *  decidir o tamanho da janela ANTES de desenhar — mesma conta que
   *  `desenharEquipamento` faz de verdade, so que sem desenhar nada. */
  private alturaEquipamento(larguraColuna: number): number {
    const escala = Math.max(1, Math.min(3, Math.floor(larguraColuna / LARGURA_PERSONAGEM)));
    const alturaBoneco = escala * ALTURA_PERSONAGEM;
    const alturaSlots = SLOTS_DE_EQUIPAMENTO.length * (SLOT + ESPACO.xs) - ESPACO.xs;
    return alturaBoneco + ESPACO.sm + alturaSlots;
  }

  /** O boneco (mesma classe `Heroi` de `identidade()`, so que maior) e os 4
   *  slots de equipamento embaixo dele. Revisao de 2026-09-05: e aqui,
   *  dentro da MOCHILA, que da pra ver e trocar roupa/armadura/acessorio/
   *  arma — nao numa aba escondida. */
  private desenharEquipamento(col: Retangulo) {
    const st = estado();
    const escala = Math.max(1, Math.min(3, Math.floor(col.largura / LARGURA_PERSONAGEM)));
    const alturaBoneco = escala * ALTURA_PERSONAGEM;

    // chapa escura atras do boneco, igual identidade() — sem ela o sprite
    // claro some no papel claro
    marcar(
      this.add
        .nineslice(col.x, col.y, "painel-escuro", undefined, col.largura, alturaBoneco, 8, 8, 8, 8)
        .setOrigin(0),
      "fundo"
    );
    criarAnimacoes(this, camadasDoHeroi(st.heroi).map((c) => c.chave));
    this.boneco = new Heroi(this, col.x + col.largura / 2, col.y + alturaBoneco, st.heroi);
    this.boneco.body.moves = false;
    this.boneco.setScale(escala);

    const p = pilha({ x: col.x, y: col.y + alturaBoneco, largura: col.largura, altura: col.altura - alturaBoneco }, ESPACO.xs);
    SLOTS_DE_EQUIPAMENTO.forEach(({ tipo, rotulo }) => {
      const r = p.reservar(SLOT);
      this.desenharSlotDeEquipamento(tipo, rotulo, r);
    });
  }

  /** O id do item equipado agora nesse slot, ou null se vazio. Arma precisa
   *  de ida-e-volta: `armaSprite` guarda a CHAVE do sprite, nao o id do
   *  item (`ARMA_DO_SPRITE` desfaz isso). */
  private itemEquipadoEm(tipo: SlotDeEquipamento): string | null {
    const st = estado();
    if (tipo === "roupa") return st.heroi.estiloRoupa;
    if (tipo === "arma") return st.heroi.armaSprite ? (ARMA_DO_SPRITE[st.heroi.armaSprite] ?? null) : null;
    return st.heroi.equipamento[tipo];
  }

  /** Os itens da mochila que servem pra esse slot — um por id (nunca lista
   *  a mesma roupa/armadura duas vezes so porque a mochila tem 2 pilhas
   *  dela). Arma so entra se tiver sprite de verdade (mesmo limite de
   *  sempre, Fase C do plano). */
  private itensParaSlot(tipo: SlotDeEquipamento): { id: string; nome: string }[] {
    const vistos = new Set<string>();
    const itens: { id: string; nome: string }[] = [];
    estado().mochila.forEach((s) => {
      if (!s || vistos.has(s.item)) return;
      const info = acharQualquerItem(s.item);
      if (info.categoria !== tipo) return;
      if (tipo === "arma" && !SPRITE_DA_ARMA[s.item]) return;
      vistos.add(s.item);
      itens.push({ id: s.item, nome: info.nome });
    });
    return itens;
  }

  /** Um slot de equipamento: fundo, icone do que esta equipado (se algo
   *  estiver) e o rotulo do slot (ROUPA/ARMADURA/ACESSORIO/ARMA) — o
   *  rotulo fica sempre visivel, diferente do slot da mochila, porque aqui
   *  o jogador precisa saber o que cada quadradinho E antes de tocar. */
  private desenharSlotDeEquipamento(tipo: SlotDeEquipamento, rotulo: string, area: Retangulo) {
    marcar(
      this.add
        .nineslice(area.x, area.y, "painel-creme", undefined, area.largura, area.altura, 6, 6, 6, 6)
        .setOrigin(0),
      "fundo"
    );

    const itemId = this.itemEquipadoEm(tipo);
    const xIcone = area.x + ESPACO.xs + LADO_ICONE / 2;
    if (itemId) {
      const temIconeProprio = ICONE_ITEM[itemId] !== undefined;
      const folha = temIconeProprio ? "itens" : "ui";
      const quadro = temIconeProprio ? ICONE_ITEM[itemId] : ICONE.mochila;
      marcar(this.add.image(xIcone, meio(area), folha, quadro), "icone");
    }

    const rotuloTexto = marcar(
      texto(this, xIcone + LADO_ICONE / 2 + ESPACO.xs, meio(area), rotulo, {
        tamanho: 8,
        cor: COR.tintaSuave,
        ancoraY: 0.5,
      }),
      "texto",
      rotulo
    );

    // zona de toque do slot inteiro (transparente, alpha 0) — cobre o
    // rotulo de proposito, pra tocar em cima do texto tambem abrir o menu.
    // Precisa estar no MESMO container que o rotulo, senao o auditor
    // (sistemas/auditoria.ts) le como sobreposicao de verdade: a checagem
    // "rotulo dentro do proprio botao nao conta" so exclui quando os dois
    // compartilham `parentContainer`.
    const zona = this.add
      .rectangle(area.x + area.largura / 2, area.y + area.altura / 2, area.largura, area.altura, 0, 0)
      .setInteractive();
    marcar(zona, "botao");
    zona.on("pointerdown", () => {
      this.ignorarProximoFechamentoDeMenu = true;
      this.abrirMenuDeEquipar(tipo, area);
    });
    this.add.container(0, 0, [rotuloTexto, zona]);
  }

  /** Lista os itens da mochila que servem pra este slot (mais TIRAR, se
   *  algo ja estiver equipado) — mesmo visual empilhado de
   *  `abrirMenuDeAcoes`, so que escolhendo o QUE equipar em vez de o que
   *  FAZER com um item ja selecionado. */
  private abrirMenuDeEquipar(tipo: SlotDeEquipamento, area: Retangulo) {
    this.esconderDicaMochila();
    this.fecharMenuDeAcoes();
    const equipadoAgora = this.itemEquipadoEm(tipo);
    const itens = this.itensParaSlot(tipo);

    const opcoes: { rotulo: string; aoTocar: () => void }[] = [];
    if (equipadoAgora) {
      opcoes.push({ rotulo: "TIRAR", aoTocar: () => { equipar(tipo, null); this.desenhar(); } });
    }
    itens.forEach(({ id, nome }) => {
      if (id === equipadoAgora) return;
      opcoes.push({ rotulo: nome.toUpperCase(), aoTocar: () => { equipar(tipo, id); this.desenhar(); } });
    });
    if (opcoes.length === 0) return;

    this.menuDeEquipamentoAberto = true;

    // largura pelo maior rotulo de verdade, nao um numero fixo — nome de
    // item ("Colete de Couro da Vila") e bem mais comprido que rotulo de
    // acao ("EQUIPAR"), e um botao fixo vazava tela em coluna estreita.
    const maiorRotulo = Math.max(...opcoes.map((o) => medirTexto(this, o.rotulo)));
    const LARGURA_BOTAO = Math.min(Math.max(100, maiorRotulo + ESPACO.md * 2), LARGURA - ESPACO.lg);
    const ALTURA_BOTAO = TAMANHO.botao;
    const GAP = ESPACO.xs;
    const alturaTotal = opcoes.length * (ALTURA_BOTAO + GAP) - GAP;
    const x = Phaser.Math.Clamp(area.x + area.largura / 2, LARGURA_BOTAO / 2 + 4, LARGURA - LARGURA_BOTAO / 2 - 4);
    let y = area.y + area.altura + ALTURA_BOTAO / 2 + 4;
    if (y + alturaTotal - ALTURA_BOTAO / 2 > ALTURA - 4) y = area.y - alturaTotal + ALTURA_BOTAO / 2 - 4;

    opcoes.forEach((opcao, i) => {
      const by = y + i * (ALTURA_BOTAO + GAP);
      const b = botao(
        this, x, by, LARGURA_BOTAO, ALTURA_BOTAO, opcao.rotulo,
        () => { this.fecharMenuDeAcoes(); opcao.aoTocar(); },
        "painel-ouro"
      );
      b.setDepth(1600);
      this.botoesMenu.push(b);
      this.areasBotoesMenu.push({ x: x - LARGURA_BOTAO / 2, y: by - ALTURA_BOTAO / 2, largura: LARGURA_BOTAO, altura: ALTURA_BOTAO });
    });
  }

  /** Um slot: fundo encaixado, icone (se tiver item), numero (se empilhado),
   *  e a zona de toque que liga hover/toque/arraste/botao direito. */
  private desenharSlot(indice: number, area: Retangulo, slot: SlotDaMochila) {
    marcar(
      this.add
        .nineslice(area.x, area.y, "painel-escuro", undefined, area.largura, area.altura, 6, 6, 6, 6)
        .setOrigin(0),
      "fundo"
    );

    if (slot) {
      const temIconeProprio = ICONE_ITEM[slot.item] !== undefined;
      const folha = temIconeProprio ? "itens" : "ui";
      const quadro = temIconeProprio ? ICONE_ITEM[slot.item] : ICONE.mochila;
      marcar(this.add.image(area.x + area.largura / 2, area.y + area.altura / 2, folha, quadro), "icone");
      if (slot.quantidade > 1) {
        marcar(
          texto(this, area.x + area.largura - 2, area.y + area.altura - 2, String(slot.quantidade), {
            tamanho: 8,
            cor: COR.papel,
            ancora: 1,
            ancoraY: 1,
          }),
          "texto",
          String(slot.quantidade)
        );
      }
    }

    const zona = this.add
      .rectangle(area.x + area.largura / 2, area.y + area.altura / 2, area.largura, area.altura, 0, 0)
      .setInteractive();
    marcar(zona, "botao");
    zona.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.aoPressionarSlot(indice, area, pointer));
    zona.on("pointerover", () => this.mostrarDicaMochila(indice, area));
    zona.on("pointerout", () => this.esconderDicaMochila());
  }

  /** Botao direito abre o menu na hora (o mouse ja sabe distinguir os dois
   *  botoes). Botao esquerdo/toque comeca a contagem pro toque longo (o
   *  MESMO menu, so que pelo dedo), que `aoMoverPonteiro` cancela se o
   *  gesto virar arrasto antes de completar. */
  private aoPressionarSlot(indice: number, area: Retangulo, pointer: Phaser.Input.Pointer) {
    if (!estado().mochila[indice]) return;
    if (pointer.rightButtonDown()) {
      // este MESMO pointerdown tambem vai disparar aoPressionarNaCena logo
      // em seguida (primeiro o objeto, depois o evento global da cena, no
      // mesmo despacho sincrono) — sem a guarda, o menu que acabou de abrir
      // seria fechado no ato, porque o clique caiu no SLOT, nao em nenhum
      // botao do menu que ainda nem existia quando o clique comecou.
      this.ignorarProximoFechamentoDeMenu = true;
      this.abrirMenuDeAcoes(indice, area);
      return;
    }
    this.pressionando = {
      indice,
      x: pointer.x,
      y: pointer.y,
      temporizador: this.time.delayedCall(450, () => {
        if (this.pressionando?.indice === indice) {
          this.abrirMenuDeAcoes(indice, area);
          this.pressionando = undefined;
        }
      }),
    };
  }

  private aoMoverPonteiro(pointer: Phaser.Input.Pointer) {
    if (this.pagina !== INDICE_MOCHILA) return;
    if (this.arrastando) {
      this.arrastando.icone.setPosition(pointer.x, pointer.y);
      // destaque vermelho na lixeira so enquanto o item arrastado esta bem
      // em cima dela — a mesma pergunta que finalizarArraste vai fazer de
      // verdade na hora de soltar, so que repetida a cada frame do arrasto.
      const sobreLixeira = !!this.zonaJogarFora && this.dentroDaArea(this.zonaJogarFora, pointer.x, pointer.y);
      if (sobreLixeira) this.iconeLixeira?.setTint(COR.vermelho);
      else this.iconeLixeira?.clearTint();
      return;
    }
    if (!this.pressionando) return;
    const dx = pointer.x - this.pressionando.x;
    const dy = pointer.y - this.pressionando.y;
    if (Math.hypot(dx, dy) > 6) this.iniciarArraste(this.pressionando.indice, pointer.x, pointer.y);
  }

  private aoSoltarPonteiro(pointer: Phaser.Input.Pointer) {
    if (this.pagina !== INDICE_MOCHILA) return;
    if (this.arrastando) {
      this.finalizarArraste(pointer.x, pointer.y);
      return;
    }
    if (this.pressionando) {
      this.pressionando.temporizador.remove();
      const indice = this.pressionando.indice;
      this.pressionando = undefined;
      // toque simples (sem arrastar, sem completar o toque longo): mostra a
      // dica, igual o hover do mouse ja mostra — e o unico jeito de quem esta
      // no toque ver a descricao sem arriscar usar o item sem querer.
      if (this.indiceComDica === indice) this.esconderDicaMochila();
      else {
        const s = this.slotsMochila.find((s) => s.indice === indice);
        if (s) this.mostrarDicaMochila(indice, s.area);
      }
    }
  }

  private iniciarArraste(indice: number, x: number, y: number) {
    this.pressionando?.temporizador.remove();
    this.pressionando = undefined;
    this.esconderDicaMochila();
    const slot = estado().mochila[indice];
    if (!slot) return;
    const temIconeProprio = ICONE_ITEM[slot.item] !== undefined;
    const icone = this.add
      .image(x, y, temIconeProprio ? "itens" : "ui", temIconeProprio ? ICONE_ITEM[slot.item] : ICONE.mochila)
      .setScale(1.3)
      .setDepth(2000);
    marcar(icone, "icone");
    this.arrastando = { deIndice: indice, icone };
  }

  private finalizarArraste(x: number, y: number) {
    const arrasto = this.arrastando;
    if (!arrasto) return;
    this.arrastando = undefined;
    arrasto.icone.destroy();

    if (this.zonaJogarFora && this.dentroDaArea(this.zonaJogarFora, x, y)) {
      this.jogarItemFora(arrasto.deIndice);
      this.desenhar();
      this.animarLixeira();
      return;
    }
    const destino = this.slotsMochila.find((s) => this.dentroDaArea(s.area, x, y));
    if (destino && destino.indice !== arrasto.deIndice) moverItem(arrasto.deIndice, destino.indice);
    this.desenhar();
  }

  /** A "mastigada" da lixeira ao receber um item de verdade — feedback de
   *  "recebi", nao so o icone mudando de cor. Chamada DEPOIS de
   *  `this.desenhar()` porque o desenho anterior (com o icone vermelho do
   *  hover) acabou de ser destruido por `children.removeAll` — anima o
   *  icone NOVO, ja de volta a cor normal. */
  private animarLixeira() {
    if (!this.iconeLixeira) return;
    this.iconeLixeira.setScale(1);
    this.tweens.add({ targets: this.iconeLixeira, scale: 1.2, duration: 70, yoyo: true, ease: "Quad.easeOut" });
  }

  private dentroDaArea(r: Retangulo, x: number, y: number): boolean {
    return x >= r.x && x <= r.x + r.largura && y >= r.y && y <= r.y + r.altura;
  }

  /** As acoes validas pra esse item, uma por categoria (a mesma que a
   *  versao anterior disparava direto) mais JOGAR FORA, universal — secao
   *  17.3 do plano. Devolve so o que faz sentido: consumivel sem efeito
   *  ligado ou com coracao cheio nao ganha USAR, arma sem sprite proprio
   *  nao ganha EMPUNHAR (mesmo gap de sempre, ver Fase C). */
  private acoesDoItem(indice: number, slot: { item: string; quantidade: number }): { rotulo: string; aoTocar: () => void }[] {
    const st = estado();
    const info = acharQualquerItem(slot.item);
    const acoes: { rotulo: string; aoTocar: () => void }[] = [];
    if (info.categoria === "consumivel" && temEfeitoForaDeCombate(slot.item) && precisaAgora(slot.item)) {
      acoes.push({ rotulo: "USAR", aoTocar: () => { usarConsumivel(slot.item); this.desenhar(); } });
    } else if (info.categoria === "material") {
      acoes.push({
        rotulo: `VENDER 1 (+${info.preco})`,
        aoTocar: () => { venderMaterial(slot.item, 1); this.desenhar(); },
      });
    } else if (info.categoria === "roupa") {
      const equipado = st.heroi.estiloRoupa === slot.item;
      acoes.push({
        rotulo: equipado ? "DESEQUIPAR" : "EQUIPAR",
        aoTocar: () => { equipar("roupa", equipado ? null : slot.item); this.desenhar(); },
      });
    } else if (info.categoria === "armadura" || info.categoria === "acessorio") {
      const equipado = st.heroi.equipamento[info.categoria] === slot.item;
      acoes.push({
        rotulo: equipado ? "DESEQUIPAR" : "EQUIPAR",
        aoTocar: () => { equipar(info.categoria, equipado ? null : slot.item); this.desenhar(); },
      });
    } else if (info.categoria === "arma") {
      const spriteDaArma = SPRITE_DA_ARMA[slot.item];
      if (spriteDaArma) {
        const equipada = st.heroi.armaSprite === spriteDaArma;
        acoes.push({
          rotulo: equipada ? "DESEMPUNHAR" : "EMPUNHAR",
          aoTocar: () => { equipar("arma", equipada ? null : spriteDaArma); this.desenhar(); },
        });
      }
    }
    acoes.push({ rotulo: "JOGAR FORA", aoTocar: () => this.jogarItemForaDoMenu(indice) });
    return acoes;
  }

  /** Descarta o item do slot e larga ele de verdade no chao do mundo (secao
   *  17.5) — usado tanto pelo arrasto ate a lixeira quanto pelo menu de
   *  acoes, os dois gestos que levam ao mesmo destino final. */
  private jogarItemFora(indice: number) {
    const slot = estado().mochila[indice];
    if (!slot) return;
    jogarFora(indice, slot.quantidade);
    (this.scene.get("Mundo") as Mundo).largarItemNoChao(slot.item, slot.quantidade);
  }

  private jogarItemForaDoMenu(indice: number) {
    this.jogarItemFora(indice);
    this.desenhar();
  }

  /** Abre o menu de acoes perto do slot — botao direito (mouse) ou toque
   *  longo (dedo), secao 17.3. Fecha sozinho ao escolher uma acao, ou ao
   *  tocar fora dele (ver aoPressionarNaCena). */
  private abrirMenuDeAcoes(indice: number, area: Retangulo) {
    this.esconderDicaMochila();
    this.fecharMenuDeAcoes();
    const slot = estado().mochila[indice];
    if (!slot) return;
    const acoes = this.acoesDoItem(indice, slot);
    this.indiceComMenu = indice;

    const LARGURA_BOTAO = 100;
    const ALTURA_BOTAO = TAMANHO.botao;
    const GAP = ESPACO.xs;
    const alturaTotal = acoes.length * (ALTURA_BOTAO + GAP) - GAP;
    const x = Phaser.Math.Clamp(area.x + area.largura / 2, LARGURA_BOTAO / 2 + 4, LARGURA - LARGURA_BOTAO / 2 - 4);
    let y = area.y + area.altura + ALTURA_BOTAO / 2 + 4;
    // nao cabe embaixo (slot perto do rodape da janela)? sobe pra cima do
    // slot em vez de vazar pra fora da tela.
    if (y + alturaTotal - ALTURA_BOTAO / 2 > ALTURA - 4) y = area.y - alturaTotal + ALTURA_BOTAO / 2 - 4;

    acoes.forEach((acaoItem, i) => {
      const by = y + i * (ALTURA_BOTAO + GAP);
      const b = botao(
        this, x, by, LARGURA_BOTAO, ALTURA_BOTAO, acaoItem.rotulo,
        () => { this.fecharMenuDeAcoes(); acaoItem.aoTocar(); },
        "painel-ouro"
      );
      b.setDepth(1600);
      this.botoesMenu.push(b);
      this.areasBotoesMenu.push({ x: x - LARGURA_BOTAO / 2, y: by - ALTURA_BOTAO / 2, largura: LARGURA_BOTAO, altura: ALTURA_BOTAO });
    });
  }

  private fecharMenuDeAcoes() {
    this.botoesMenu.forEach((b) => b.destroy());
    this.botoesMenu = [];
    this.areasBotoesMenu = [];
    this.indiceComMenu = undefined;
    this.menuDeEquipamentoAberto = false;
  }

  /** So fecha se o toque foi FORA de qualquer botao do menu — um botao ja
   *  processa o proprio toque no pointerup dele; fechar no pointerdown
   *  destruiria o botao antes desse pointerup rodar, e a acao escolhida
   *  nunca executaria. */
  private aoPressionarNaCena(pointer: Phaser.Input.Pointer) {
    if (this.ignorarProximoFechamentoDeMenu) {
      this.ignorarProximoFechamentoDeMenu = false;
      return;
    }
    if (this.indiceComMenu === undefined && !this.menuDeEquipamentoAberto) return;
    const dentroDeAlgumBotao = this.areasBotoesMenu.some((r) => this.dentroDaArea(r, pointer.x, pointer.y));
    if (!dentroDeAlgumBotao) this.fecharMenuDeAcoes();
  }

  private criarDicaMochila() {
    // ancora em CIMA (0.5, 0): a caixa cresce pra baixo, a partir do slot. A
    // grade fica logo abaixo das abas, entao "cresce pra cima" (como o
    // combate faz, onde a barra de acao mora no rodape) vazaria por cima da
    // propria janela — a mochila tem mais folga embaixo (zona de jogar fora,
    // FECHAR) do que em cima.
    this.dicaChapaMochila = this.add.nineslice(0, 0, "painel-creme", undefined, 8, 24, 8, 8, 8, 8).setOrigin(0.5, 0);
    this.dicaTextoMochila = texto(this, 0, 5, "", { cor: 0x2c2440, ancora: 0.5 });
    this.dicaCaixaMochila = this.add.container(0, 0, [this.dicaChapaMochila, this.dicaTextoMochila]);
    this.dicaCaixaMochila.setVisible(false).setDepth(1500);
  }

  /** A linha "CATEGORIA · RARIDADE" e, quando fizer sentido, "Vale/Custa N
   *  moedas" — secao 17.2 do plano. Item de historia nunca teve raridade
   *  nem preco (nao e coisa de loja nem de monstro), entao sai sem nenhuma
   *  das duas em vez de fingir um preco que nao existe. */
  private linhasDeMetadado(info: ItemPossuido): string[] {
    if (info.categoria === "historia") return [];
    const raridade = "raridade" in info && info.raridade ? info.raridade.toUpperCase() : undefined;
    const linhas = [raridade ? `${ROTULO_CATEGORIA[info.categoria]} · ${raridade}` : ROTULO_CATEGORIA[info.categoria]];
    const preco = "preco" in info ? info.preco : undefined;
    if (preco !== undefined && preco > 0) {
      linhas.push(info.categoria === "material" ? `Vale ${preco} moedas` : `${preco} moedas`);
    }
    return linhas;
  }

  /** Hover (mouse) e toque simples (dedo) mostram a mesma dica: nome,
   *  categoria/raridade/preco (17.2), descricao/bonus, e de onde ela vem
   *  quando tiver. */
  private mostrarDicaMochila(indice: number, area: Retangulo) {
    const slot = estado().mochila[indice];
    if (!slot || !this.dicaCaixaMochila || !this.dicaTextoMochila || !this.dicaChapaMochila) return;
    this.indiceComDica = indice;
    const info = acharQualquerItem(slot.item);
    const descricao =
      info.categoria === "consumivel" || info.categoria === "material"
        ? info.texto
        : info.categoria === "historia"
          ? "Item de historia. Guarde para quando fizer sentido usar."
          : info.categoria === "roupa"
            ? "So aparencia — sem bonus de combate."
            : info.origem
              ? `${info.bonus} (${info.origem})`
              : info.bonus;
    const linhas = [info.nome.toUpperCase(), ...this.linhasDeMetadado(info), ...quebrar(descricao, 140)];
    const ENTRE = 2;
    const alturaTexto = linhas.length * (10 + ENTRE) - ENTRE;
    const altura = alturaTexto + 10;
    const largura = Math.min(160, Math.max(...linhas.map((l) => medirTexto(this, l))) + 12);
    this.dicaTextoMochila.setText(linhas.join("\n"));
    this.dicaTextoMochila.setLineSpacing(ENTRE);
    this.dicaChapaMochila.setSize(largura, altura);
    const x = Phaser.Math.Clamp(area.x + area.largura / 2, largura / 2 + 2, LARGURA - largura / 2 - 2);
    const y = area.y + area.altura + 4;
    this.dicaCaixaMochila.setPosition(x, y).setVisible(true);
  }

  private esconderDicaMochila() {
    this.dicaCaixaMochila?.setVisible(false);
    this.indiceComDica = undefined;
  }
}
