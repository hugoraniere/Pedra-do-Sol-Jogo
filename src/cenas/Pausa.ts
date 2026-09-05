/** Menu de pausa. Roda por cima do Mundo, que fica congelado atras.
 *
 * Todo o posicionamento vem de sistemas/design.ts. Nenhuma coordenada Y na mao:
 * a caixa calcula a propria altura a partir do conteudo, e a pilha empilha. */
import Phaser from "phaser";
import { LARGURA, ALTURA } from "../dados/config";
import { botao } from "../sistemas/botao";
import { texto } from "../sistemas/texto";
import {
  ESPACO,
  TAMANHO,
  alturaDoTexto,
  caixa,
  marcar,
  meio,
  pilha,
  quebrar,
  textoNaArea,
} from "../sistemas/design";
import { salvar } from "../sistemas/estado";
import { noAplicativo, sairDoJogo } from "../sistemas/armazenamento";
import { ORDEM_ZOOM, ZOOM, definirPreferencia, preferencias } from "../sistemas/preferencias";
import {
  alternarTelaCheia,
  aplicarVisao,
  emTelaCheia,
  refazerAoRedimensionar,
} from "../sistemas/visao";
import { AJUSTES } from "../dados/sons";
import { abafarMusica, definirSom, tocar } from "../sistemas/som";

/** funcao, nao constante: LARGURA muda com a visao escolhida */
const larguraCaixa = () => Math.min(208, LARGURA - ESPACO.xl * 2);
const EXPLICACAO = "LONGE mostra mais do mapa. PERTO deixa tudo maior e mais facil de ver.";

export class Pausa extends Phaser.Scene {
  private painel!: Phaser.GameObjects.Container;
  private aba: "menu" | "config" = "menu";

  constructor() {
    super("Pausa");
  }

  create() {
    this.aba = "menu";
    // abaixa a trilha, nao para: parar faz a faixa recomecar do zero na volta
    abafarMusica(AJUSTES.abafarNaPausa);
    this.montarFundo();
    // o conteudo tem que ficar acima dos paineis que a caixa() desenha depois
    this.painel = this.add.container(0, 0).setDepth(10);
    this.desenhar();
    // trocar a visao troca a resolucao: o menu se remonta no tamanho novo,
    // continuando na mesma aba em que o jogador estava
    refazerAoRedimensionar(this, () => {
      this.montarFundo();
      this.desenhar();
    });

    this.input.keyboard?.removeAllListeners("keydown");
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "p") return;
      if (this.aba === "config") {
        this.aba = "menu";
        this.desenhar();
      } else {
        this.voltarAoJogo();
      }
    });
  }

  private montarFundo() {
    this.fundo?.destroy();
    this.fundo = marcar(
      this.add.rectangle(0, 0, LARGURA, ALTURA, 0x2c2440, 0.66).setOrigin(0).setInteractive(),
      "fundo"
    ) as Phaser.GameObjects.Rectangle;
  }

  private fundo?: Phaser.GameObjects.Rectangle;

  private voltarAoJogo() {
    tocar("pausa-fecha");
    abafarMusica(1);
    this.scene.resume("Mundo");
    this.scene.stop();
  }

  private desenhar() {
    this.painel.removeAll(true);
    this.children.list
      .filter((o) => o !== this.painel && o !== this.fundo)
      .forEach((o) => o.destroy());
    if (this.aba === "menu") this.desenharMenu();
    else this.desenharConfig();
  }

  // ------------------------------------------------------------- menu
  private desenharMenu() {
    const itens: { rotulo: string; acao: () => void; destaque?: boolean }[] = [
      { rotulo: "VOLTAR AO JOGO", acao: () => this.voltarAoJogo(), destaque: true },
      { rotulo: "SALVAR AGORA", acao: () => this.salvarComRecado() },
      {
        rotulo: "CONFIGURACOES",
        acao: () => {
          this.aba = "config";
          this.desenhar();
        },
      },
      {
        rotulo: "SAIR PARA O MENU",
        acao: () => {
          abafarMusica(1);
          salvar();
          this.scene.stop("Interface");
          this.scene.stop("Mundo");
          this.scene.stop();
          this.scene.start("Titulo");
        },
      },
    ];
    if (noAplicativo()) {
      itens.push({
        rotulo: "SAIR DO JOGO",
        acao: () => {
          salvar();
          sairDoJogo();
        },
      });
    }

    // a altura sai da conta, nao de um numero chutado
    const alturaConteudo =
      itens.length * TAMANHO.botao + (itens.length - 1) * ESPACO.md + ESPACO.lg + TAMANHO.linhaTexto;
    const area = caixa(this, { largura: larguraCaixa(), alturaConteudo, titulo: "PAUSA" });
    const p = pilha(area, ESPACO.md);

    itens.forEach((item) => {
      const r = p.reservar(TAMANHO.botao);
      this.painel.add(
        botao(
          this,
          r.x + r.largura / 2,
          meio(r),
          r.largura,
          r.altura,
          item.rotulo,
          item.acao,
          item.destaque ? "painel-ouro" : "painel-creme"
        )
      );
    });

    const rRecado = p.reservar(TAMANHO.linhaTexto, ESPACO.lg);
    this.recadoEm = rRecado;
  }

  private recadoEm?: { x: number; y: number; largura: number; altura: number };

  private salvarComRecado() {
    salvar();
    tocar("salvou");
    if (!this.recadoEm) return;
    const t = textoNaArea(this, this.recadoEm, "Jogo salvo!", { cor: 0xf5b62b });
    this.painel.add(t);
    this.time.delayedCall(1600, () => t.destroy());
  }

  // ----------------------------------------------------- configuracoes
  private desenharConfig() {
    const larguraUtil = larguraCaixa() - TAMANHO.paddingPainel * 2;
    const linhas = quebrar(EXPLICACAO, larguraUtil);
    // o Safari do iPad nao deixa nada alem de video entrar em tela cheia. La o
    // botao nao existe, em vez de existir e nao funcionar: botao que nao faz
    // nada e o pior caso para quem tem 7 anos.
    const temTelaCheia = this.scale.fullscreen.available;

    // OS CONTROLES SAO OBRIGATORIOS; O PARAGRAFO EXPLICATIVO NAO E. Numa janela
    // baixa e deitada (celular antigo, tela dividida) sobra pouca altura, e
    // "LONGE mostra mais do mapa..." e a unica coisa aqui que e descricao, nao
    // controle. Perder-la e melhor que o < VOLTAR vazar pra fora da tela — o
    // que de fato acontecia antes desta conta existir. Ver docs/07, "pergunte
    // quanto cabe, mostre o que couber, na ordem de importancia".
    const alturaControles =
      TAMANHO.linhaTexto +
      ESPACO.md +
      TAMANHO.botao +
      ESPACO.lg +
      TAMANHO.botao +
      (temTelaCheia ? ESPACO.lg + TAMANHO.botao : 0) +
      ESPACO.lg +
      TAMANHO.botao;
    const alturaComExplicacao = alturaControles + ESPACO.lg + alturaDoTexto(linhas.length);
    // o mesmo teto que caixa() respeita por dentro: alem disto ela pinca no
    // topo e vaza por baixo, porque nunca encolhe o proprio conteudo.
    const tetoDisponivel =
      ALTURA - TAMANHO.paddingTela * 2 - TAMANHO.paddingPainel * 2 - TAMANHO.chapa - ESPACO.sm;
    const cabeExplicacao = alturaComExplicacao <= tetoDisponivel;
    const alturaConteudo = cabeExplicacao ? alturaComExplicacao : alturaControles;

    const area = caixa(this, { largura: larguraCaixa(), alturaConteudo, titulo: "CONFIGURACOES" });
    const p = pilha(area, ESPACO.md);

    textoNaArea(this, p.reservar(TAMANHO.linhaTexto), "DE ONDE VOCE VE O JOGO", { cor: 0x4a3e64 });

    const linhaBotoes = p.reservar(TAMANHO.botao);
    const atual = preferencias().zoom;
    const larguraBotao = Math.floor((linhaBotoes.largura - ESPACO.sm * 2) / 3);
    ORDEM_ZOOM.forEach((nivel, i) => {
      const x = linhaBotoes.x + i * (larguraBotao + ESPACO.sm) + larguraBotao / 2;
      const b = botao(
        this,
        x,
        meio(linhaBotoes),
        larguraBotao,
        linhaBotoes.altura,
        ZOOM[nivel].nome,
        () => {
          if (nivel === preferencias().zoom) return;
          definirPreferencia("zoom", nivel);
          aplicarVisao(this.game);
          // aplicarVisao quase sempre muda a resolucao, e o resize ja manda este
          // menu se remontar. Quase: numa janela pequena dois niveis podem cair
          // na mesma escala inteira, e ai nao vem resize nenhum. Sem esta linha,
          // nesse caso, a marca ficaria no botao errado. Redesenhar duas vezes
          // no mesmo quadro nao pisca, porque nada e desenhado entre as duas.
          this.time.delayedCall(0, () => this.desenhar());
        },
        "painel-creme"
      );
      b.marcar(nivel === atual);
      this.painel.add(b);
    });

    if (cabeExplicacao) {
      const areaTexto = p.reservar(alturaDoTexto(linhas.length), ESPACO.lg);
      linhas.forEach((linha, i) => {
        this.painel.add(
          marcar(
            texto(this, LARGURA / 2, areaTexto.y + i * TAMANHO.linhaTexto, linha, {
              cor: 0x4a3e64,
              ancora: 0.5,
            }),
            "texto",
            linha
          )
        );
      });
    }

    // ------------------------------------------------------------ som
    // Dois botoes, nao uma chavinha: chavinha exige saber que o lado aceso e o
    // ligado. O rotulo diz a escolha inteira, entao a linha de titulo nao
    // precisa existir: em 192 px de altura ela era o que jogava o VOLTAR para
    // fora da tela. "COM SOM" e "SEM SOM" seguem o "COM EQUIPAMENTO" e o
    // "SEM EQUIPAMENTO" da tela de criacao, que o Lele ja conhece.
    const linhaSom = p.reservar(TAMANHO.botao, ESPACO.lg);
    const larguraSom = Math.floor((linhaSom.largura - ESPACO.sm) / 2);
    ([true, false] as const).forEach((ligado, i) => {
      const b = botao(
        this,
        linhaSom.x + i * (larguraSom + ESPACO.sm) + larguraSom / 2,
        meio(linhaSom),
        larguraSom,
        linhaSom.altura,
        ligado ? "COM SOM" : "SEM SOM",
        () => {
          if (ligado === preferencias().som) return;
          definirPreferencia("som", ligado);
          definirSom(ligado);
          this.desenhar();
        },
        "painel-creme"
      );
      b.marcar(ligado === preferencias().som);
      this.painel.add(b);
    });

    // ------------------------------------------------------- tela cheia
    // O jogo ja enche a janela do navegador sozinho, sempre. Isto aqui e o
    // passo seguinte: comer tambem a barra de enderecos e as abas.
    if (temTelaCheia) {
      const linhaCheia = p.reservar(TAMANHO.botao, ESPACO.lg);
      const bCheia = botao(
        this,
        LARGURA / 2,
        meio(linhaCheia),
        Math.min(linhaCheia.largura, 160),
        linhaCheia.altura,
        "TELA CHEIA",
        () => {
          alternarTelaCheia(this.game);
          // entrar e sair de tela cheia nem sempre muda a resolucao logica, e
          // sem mudanca de resolucao nao vem resize: sem isto a marca do botao
          // ficaria mentindo ate a proxima vez que a tela mudasse de tamanho
          this.time.delayedCall(0, () => this.desenhar());
        },
        "painel-creme"
      );
      bCheia.marcar(emTelaCheia(this.game));
      this.painel.add(bCheia);
    }

    const rVoltar = p.reservar(TAMANHO.botao, ESPACO.lg);
    this.painel.add(
      botao(this, LARGURA / 2, meio(rVoltar), 120, rVoltar.altura, "< VOLTAR", () => {
        this.aba = "menu";
        this.desenhar();
      }, "painel-ouro", "menu-volta")
    );
  }
}
