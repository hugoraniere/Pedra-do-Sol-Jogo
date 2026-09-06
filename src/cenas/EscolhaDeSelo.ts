/** A tela de escolha do Selo de Heroi. Roda por cima do Mundo, que fica
 *  congelado atras — mesmo padrao de Pausa.ts.
 *
 *  A cada 3 Selos (ganhos um por criatura vencida, ver Combate.ts), o
 *  jogador escolhe UM premio, igual o manual impresso manda: +1 coracao,
 *  +1 num poder, ou uma magia nova. Dois passos: a escolha principal, e (se
 *  for poder ou magia) uma segunda tela com as opcoes daquela escolha.
 *
 *  Nenhuma coordenada Y na mao: caixa() calcula a altura, pilha() empilha.
 */
import Phaser from "phaser";
import { LARGURA, ALTURA } from "../dados/config";
import { ATRIBUTOS, ORDEM_PODERES, MAGIAS, type Atributo } from "../dados/conteudo";
import {
  estado,
  ganharCoracaoExtra,
  ganharBonusDeAtributo,
  aprenderMagia,
} from "../sistemas/estado";
import { poderesDoHeroi } from "../sistemas/poderes";
import { botao } from "../sistemas/botao";
import { ESPACO, TAMANHO, caixa, meio, pilha, textoNaArea } from "../sistemas/design";
import { tocar } from "../sistemas/som";
import { refazerAoRedimensionar } from "../sistemas/visao";

const larguraCaixa = () => Math.min(220, LARGURA - ESPACO.xl * 2);

type Passo = "principal" | "poder" | "magia";

export class EscolhaDeSelo extends Phaser.Scene {
  private painel!: Phaser.GameObjects.Container;
  private fundo!: Phaser.GameObjects.Rectangle;
  private passo: Passo = "principal";
  /** sorteadas uma vez por abertura da tela, pra nao reembaralhar a cada
   *  redesenho (ex.: ao girar a tela) */
  private magiasSorteadas: string[] = [];

  constructor() {
    super("EscolhaDeSelo");
  }

  create() {
    this.passo = "principal";
    this.magiasSorteadas = sortear3(magiasNaoAprendidas());
    tocar("selo");
    this.fundo = this.add.rectangle(0, 0, LARGURA, ALTURA, 0x2c2440, 0.72).setOrigin(0);
    this.painel = this.add.container(0, 0).setDepth(10);
    this.desenhar();
    // giro de tablet/redimensionar no meio da escolha - desenhar() ja limpa
    // e remonta do zero, o comentario de magiasSorteadas acima ("ex.: ao
    // girar a tela") ja previa isto, so faltava ligar.
    refazerAoRedimensionar(this, () => {
      this.fundo.setSize(LARGURA, ALTURA);
      this.desenhar();
    });
  }

  private fechar() {
    tocar("menu-confirma");
    this.scene.resume("Mundo");
    this.scene.resume("Interface");
    this.scene.stop();
  }

  private desenhar() {
    this.painel.removeAll(true);
    if (this.passo === "principal") this.desenharPrincipal();
    else if (this.passo === "poder") this.desenharPoder();
    else this.desenharMagia();
  }

  // ------------------------------------------------------------ principal
  private desenharPrincipal() {
    const temMagiaNova = this.magiasSorteadas.length > 0;
    const itens: { rotulo: string; acao: () => void }[] = [
      {
        rotulo: "MAIS UM CORACAO",
        acao: () => {
          ganharCoracaoExtra();
          this.fechar();
        },
      },
      { rotulo: "MAIS FORTE NUM PODER", acao: () => { this.passo = "poder"; this.desenhar(); } },
    ];
    if (temMagiaNova) {
      itens.push({ rotulo: "UMA MAGIA NOVA", acao: () => { this.passo = "magia"; this.desenhar(); } });
    }

    // texto (sem gap, e o primeiro) + cada botao com seu proprio gap antes
    const alturaConteudo = TAMANHO.linhaTexto + itens.length * (ESPACO.md + TAMANHO.botao);
    const area = caixa(this, { largura: larguraCaixa(), alturaConteudo, titulo: "SELO DE HEROI" });
    const p = pilha(area, ESPACO.md);
    const rTexto = p.reservar(TAMANHO.linhaTexto);
    this.painel.add(textoNaArea(this, rTexto, "Escolha seu premio.", { cor: 0x4a3e64 }));
    itens.forEach((item) => {
      const r = p.reservar(TAMANHO.botao);
      this.painel.add(
        botao(this, r.x + r.largura / 2, meio(r), r.largura, r.altura, item.rotulo, item.acao, "painel-creme")
      );
    });
  }

  // ---------------------------------------------------------------- poder
  private desenharPoder() {
    const poderes = poderesDoHeroi(estado().heroi);
    const alturaConteudo =
      ORDEM_PODERES.length * TAMANHO.botao +
      (ORDEM_PODERES.length - 1) * ESPACO.md +
      ESPACO.lg +
      TAMANHO.botao;
    const area = caixa(this, { largura: larguraCaixa(), alturaConteudo, titulo: "QUAL PODER?" });
    const p = pilha(area, ESPACO.md);
    ORDEM_PODERES.forEach((id) => {
      const r = p.reservar(TAMANHO.botao);
      this.painel.add(
        botao(
          this,
          r.x + r.largura / 2,
          meio(r),
          r.largura,
          r.altura,
          `${ATRIBUTOS[id].nome} (${poderes[id]})`,
          () => {
            ganharBonusDeAtributo(id as Atributo);
            this.fechar();
          },
          "painel-creme"
        )
      );
    });
    const rVoltar = p.reservar(TAMANHO.botao, ESPACO.lg);
    this.painel.add(
      botao(this, LARGURA / 2, meio(rVoltar), 120, rVoltar.altura, "< VOLTAR", () => {
        this.passo = "principal";
        this.desenhar();
      }, "painel-ouro", "menu-volta")
    );
  }

  // ---------------------------------------------------------------- magia
  private desenharMagia() {
    const opcoes = this.magiasSorteadas;
    const alturaConteudo =
      opcoes.length * TAMANHO.botao + (opcoes.length - 1) * ESPACO.md + ESPACO.lg + TAMANHO.botao;
    const area = caixa(this, { largura: larguraCaixa(), alturaConteudo, titulo: "QUAL MAGIA?" });
    const p = pilha(area, ESPACO.md);
    opcoes.forEach((id) => {
      const magia = MAGIAS.find((m) => m.id === id);
      if (!magia) return;
      const r = p.reservar(TAMANHO.botao);
      this.painel.add(
        botao(this, r.x + r.largura / 2, meio(r), r.largura, r.altura, magia.nome, () => {
          aprenderMagia(id);
          this.fechar();
        }, "painel-creme")
      );
    });
    const rVoltar = p.reservar(TAMANHO.botao, ESPACO.lg);
    this.painel.add(
      botao(this, LARGURA / 2, meio(rVoltar), 120, rVoltar.altura, "< VOLTAR", () => {
        this.passo = "principal";
        this.desenhar();
      }, "painel-ouro", "menu-volta")
    );
  }
}

function magiasNaoAprendidas(): string[] {
  const conhecidas = estado().heroi.magias;
  return MAGIAS.map((m) => m.id).filter((id) => !conhecidas.includes(id));
}

function sortear3(ids: string[]): string[] {
  const copia = [...ids];
  const sorteadas: string[] = [];
  while (copia.length > 0 && sorteadas.length < 3) {
    const i = Math.floor(Math.random() * copia.length);
    sorteadas.push(copia.splice(i, 1)[0]);
  }
  return sorteadas;
}
