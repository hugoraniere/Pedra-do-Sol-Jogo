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

const LARGURA_CAIXA = 208;
const EXPLICACAO = "LONGE mostra mais do mapa. PERTO deixa tudo maior e mais facil de ver.";

export class Pausa extends Phaser.Scene {
  private painel!: Phaser.GameObjects.Container;
  private aba: "menu" | "config" = "menu";

  constructor() {
    super("Pausa");
  }

  create() {
    this.aba = "menu";
    marcar(
      this.add.rectangle(0, 0, LARGURA, ALTURA, 0x2c2440, 0.66).setOrigin(0).setInteractive(),
      "fundo"
    );
    // o conteudo tem que ficar acima dos paineis que a caixa() desenha depois
    this.painel = this.add.container(0, 0).setDepth(10);
    this.desenhar();

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

  private voltarAoJogo() {
    this.scene.resume("Mundo");
    this.scene.stop();
  }

  private desenhar() {
    this.painel.removeAll(true);
    this.children.list
      .filter((o) => o !== this.painel && (o.getData("ui") as { tipo?: string })?.tipo !== "fundo")
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
    const area = caixa(this, { largura: LARGURA_CAIXA, alturaConteudo, titulo: "PAUSA" });
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
    if (!this.recadoEm) return;
    const t = textoNaArea(this, this.recadoEm, "Jogo salvo!", { cor: 0xf5b62b });
    this.painel.add(t);
    this.time.delayedCall(1600, () => t.destroy());
  }

  // ----------------------------------------------------- configuracoes
  private desenharConfig() {
    const larguraUtil = LARGURA_CAIXA - TAMANHO.paddingPainel * 2;
    const linhas = quebrar(EXPLICACAO, larguraUtil);
    const alturaConteudo =
      TAMANHO.linhaTexto +
      ESPACO.md +
      TAMANHO.botao +
      ESPACO.lg +
      alturaDoTexto(linhas.length) +
      ESPACO.lg +
      TAMANHO.botao;

    const area = caixa(this, { largura: LARGURA_CAIXA, alturaConteudo, titulo: "CONFIGURACOES" });
    const p = pilha(area, ESPACO.md);

    textoNaArea(this, p.reservar(TAMANHO.linhaTexto), "DE ONDE VOCE VE O JOGO", { cor: 0x5a4e74 });

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
          definirPreferencia("zoom", nivel);
          this.scene.get("Mundo")?.events.emit("zoom-mudou");
          this.desenhar();
        },
        "painel-creme"
      );
      b.marcar(nivel === atual);
      this.painel.add(b);
    });

    const areaTexto = p.reservar(alturaDoTexto(linhas.length), ESPACO.lg);
    linhas.forEach((linha, i) => {
      this.painel.add(
        marcar(
          texto(this, LARGURA / 2, areaTexto.y + i * TAMANHO.linhaTexto, linha, {
            cor: 0x5a4e74,
            ancora: 0.5,
          }),
          "texto",
          linha
        )
      );
    });

    const rVoltar = p.reservar(TAMANHO.botao, ESPACO.lg);
    this.painel.add(
      botao(this, LARGURA / 2, meio(rVoltar), 120, rVoltar.altura, "< VOLTAR", () => {
        this.aba = "menu";
        this.desenhar();
      }, "painel-ouro")
    );
  }
}
