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
import { ALTURA_PERSONAGEM, COR } from "../dados/config";
import {
  ATRIBUTOS,
  ORDEM_PODERES,
  acharArma,
  acharClasse,
  acharMagia,
  acharRaca,
} from "../dados/conteudo";
import { estado } from "../sistemas/estado";
import { Heroi, camadasDoHeroi, criarAnimacoes } from "../sistemas/heroi";
import { ICONE, LADO_ICONE } from "../sistemas/icones";
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
  Retangulo,
} from "../sistemas/design";
import { medirTexto, texto } from "../sistemas/texto";
import { refazerAoRedimensionar } from "../sistemas/visao";
import { tocar } from "../sistemas/som";

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

  constructor() {
    super("Ficha");
  }

  create() {
    this.pagina = 0;
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
  }

  private irPara(indice: number) {
    // da a volta: as setas do teclado nunca chegam numa aba que nao existe
    this.pagina = (indice + ABAS.length) % ABAS.length;
    this.desenhar();
  }

  private fechar() {
    tocar("pausa-fecha");
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

    // um recado honesto no lugar de fingir que existe conteudo: a mochila e o
    // diario ainda nao tem dado nenhum por tras, entao nao inventamos um aqui
    const emConstrucao = (recado: string): Pagina => ({
      grupos: [[paragrafo(recado)]],
    });

    return [
      {
        // EU
        grupos: [
          [{ tipo: "identidade" }],
          [
            { tipo: "titulo", conteudo: "MINHA ARMA E MEU DOM" },
            chips([arma?.nome ?? "Sem arma", raca.dom]),
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
      emConstrucao("A mochila ainda esta vazia. Um dia vai ter aqui o que voce guardar."),
      emConstrucao("O diario ainda nao existe. Um dia vai ter aqui o que voce ja descobriu."),
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
    if (bloco.tipo === "titulo") return bloco.valor ? ALTURA_CHIP : TAMANHO.linhaTexto;
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

    // os coracoes encostados um no outro leem como uma barra so, que e o que
    // uma crianca de 7 anos entende sem ninguem explicar
    const passo = Math.min(LADO_ICONE - 5, Math.floor(rVida.largura / st.coracoesMax));
    for (let i = 0; i < st.coracoesMax; i++) {
      marcar(
        this.add.image(
          rVida.x + passo / 2 + i * passo,
          meio(rVida),
          "ui",
          i < st.coracoes ? ICONE.coracaoCheio : ICONE.coracaoVazio
        ),
        "icone"
      );
    }

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
}
