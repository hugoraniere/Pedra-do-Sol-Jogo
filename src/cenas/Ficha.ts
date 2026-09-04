/** A ficha do heroi, aberta por cima do mundo.
 *
 * E a ficha de papel que o Lele preencheu na mesa, virada em tela. A de papel
 * tem duas folhas A4; a tela tem 320 por 192, entao aqui sao tres paginas curtas
 * com uma ideia cada: quem eu sou, meus poderes, o que eu sei fazer. Vira com as
 * setas ao lado do FECHAR, e da a volta: ele nunca fica preso no fim.
 *
 * Fonte da verdade: docs/referencia/sistema-do-rpg-de-mesa.md e o material
 * impresso (ficha do heroi, manual do criador de heroi).
 *
 * O que a ficha de papel tem e esta ainda nao mostra, porque nao existe no
 * estado do jogo: mascote, ponto fraco, grito de guerra, e o +1 de poder que o
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
import { alturaUtilDaJanela, janela, larguraUtilDaJanela } from "../sistemas/janela";
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
import { texto } from "../sistemas/texto";
import { refazerAoRedimensionar } from "../sistemas/visao";

/** Um pedaco de pagina. Cada um sabe de quanta altura precisa antes de existir,
 *  que e o que deixa a pagina se cortar sozinha quando a tela e baixa. */
type Bloco =
  | { tipo: "identidade" }
  | { tipo: "titulo"; conteudo: string; valor?: string }
  | { tipo: "texto"; linhas: string[] }
  | { tipo: "chips"; linhas: string[][] };

/** Um titulo e o que vem embaixo dele sao um GRUPO, e o grupo nao se parte.
 *  Sem isto a tela baixa deixava "MINHAS MAGIAS" sozinho, sem magia nenhuma
 *  embaixo, que e pior do que nao mostrar. */
type Grupo = Bloco[];

type Pagina = { titulo: string; grupos: Grupo[] };

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
      if (e.key === "ArrowLeft") this.virar(-1);
      if (e.key === "ArrowRight") this.virar(1);
    });
    refazerAoRedimensionar(this, () => this.desenhar());
  }

  private virar(passo: number) {
    const paginas = this.paginas();
    // da a volta: ele nunca chega numa seta que nao faz nada
    this.pagina = (this.pagina + passo + paginas.length) % paginas.length;
    this.desenhar();
  }

  private fechar() {
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

    const chips = (textos: string[]): Bloco => ({ tipo: "chips", linhas: arrumarChips(textos, largura) });
    const paragrafo = (conteudo: string): Bloco => ({ tipo: "texto", linhas: quebrar(conteudo, largura) });

    return [
      {
        titulo: "MEU HEROI",
        grupos: [
          [{ tipo: "identidade" }],
          [
            { tipo: "titulo", conteudo: "MINHA ARMA E MEU DOM" },
            chips([arma?.nome ?? "Sem arma", raca.dom]),
          ],
        ],
      },
      {
        titulo: "MEUS PODERES",
        grupos: ORDEM_PODERES.map((id) => [
          { tipo: "titulo", conteudo: ATRIBUTOS[id].nome, valor: String(poderes[id]) } as Bloco,
          paragrafo(ATRIBUTOS[id].oQueFaz),
        ]),
      },
      {
        titulo: "O QUE EU SEI FAZER",
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
    const teto = alturaUtilDaJanela();
    const cabem: Grupo[] = [];
    let usado = 0;
    for (const grupo of pagina.grupos) {
      const precisa = this.alturaDoGrupo(grupo, cabem.length === 0);
      if (usado + precisa > teto) break;
      usado += precisa;
      cabem.push(grupo);
    }

    const area = janela(this, {
      titulo: pagina.titulo,
      alturaConteudo: usado,
      aoFechar: () => this.fechar(),
      virarPagina: (passo) => this.virar(passo),
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
        } else {
          bloco.linhas.forEach((linha, j) => {
            const r = p.reservar(ALTURA_CHIP, j === 0 ? gap : ESPACO.sm);
            chipsNaLinha(this, r, linha);
          });
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
    chip(this, linha.x + linha.largura - larguraDoChip(valor), linha.y, valor, "painel-ouro");
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
    // 16 px por letra na fonte grande: nome comprido volta para a fonte pequena
    // em vez de vazar para fora do painel
    const tamanho = nome.length * 16 <= rNome.largura ? 16 : 8;
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
