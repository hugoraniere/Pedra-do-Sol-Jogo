/** Lista dos tres espacos de save. Da para abrir, e da para apagar com confirmacao. */
import Phaser from "phaser";
import { musica } from "../sistemas/som";
import { LARGURA, ALTURA, COR, RACAS, CLASSES } from "../dados/config";
import { botao } from "../sistemas/botao";
import { texto } from "../sistemas/texto";
import { abrirEspaco } from "../sistemas/estado";
import { apagarEspaco, fichas, MAX_ESPACOS, Ficha } from "../sistemas/armazenamento";

const ALTURA_CARTAO = 40;

export class Carregar extends Phaser.Scene {
  private lista!: Phaser.GameObjects.Container;
  private confirmando: number | null = null;

  constructor() {
    super("Carregar");
  }

  create() {
    musica(this, "menu");
    this.add.rectangle(0, 0, LARGURA, ALTURA, COR.grama).setOrigin(0);
    this.add.image(0, -46, "titulo").setOrigin(0).setAlpha(0.5);
    this.add.rectangle(0, 0, LARGURA, ALTURA, 0x2c2440, 0.5).setOrigin(0);

    texto(this, LARGURA / 2, 6, "SEUS JOGOS", { tamanho: 16, cor: 0xfff8ea, ancora: 0.5 });

    this.lista = this.add.container(0, 0);
    this.desenhar();

    botao(this, 40, ALTURA - 12, 64, 16, "< VOLTAR", () => this.scene.start("Titulo"), "painel-creme", "menu-volta");

    this.input.keyboard?.removeAllListeners("keydown");
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.scene.start("Titulo");
    });
  }

  private desenhar() {
    this.lista.removeAll(true);
    const todas = fichas();
    const topo = 26;

    for (let i = 0; i < MAX_ESPACOS; i++) {
      const y = topo + i * (ALTURA_CARTAO + 4);
      const f = todas[i];
      this.lista.add(
        this.add
          .nineslice(10, y, f ? "painel" : "painel-creme", undefined, LARGURA - 20, ALTURA_CARTAO, 8, 8, 8, 8)
          .setOrigin(0)
          .setAlpha(f ? 1 : 0.55)
      );
      if (!f) {
        this.lista.add(
          texto(this, LARGURA / 2, y + ALTURA_CARTAO / 2, `ESPACO ${i + 1} . VAZIO`, {
            cor: 0x4a3e64,
            ancora: 0.5,
            ancoraY: 0.5,
          })
        );
        continue;
      }
      this.lista.add(this.cartao(f, i, y));
    }
  }

  private cartao(f: Ficha, indice: number, y: number) {
    const c = this.add.container(0, 0);
    const raca = RACAS.find((r) => r.id === f.raca)?.nome ?? f.raca;
    const classe = CLASSES.find((k) => k.id === f.classe)?.nome ?? f.classe;

    // as tres linhas se empilham pela TINTA, nao pela caixa: a caixa de 16 px
    // mede 20 de altura e so tem letra do 4 ao 15, entao encostar caixa em caixa
    // desperdicaria 8 px e era isso que empurrava o lugar para fora do cartao
    c.add(texto(this, 16, y + 2, f.nome.toUpperCase(), { tamanho: 16, cor: 0x2c2440 }));
    c.add(texto(this, 16, y + 19, `${raca} . ${classe}`, { cor: 0x4a3e64 }));
    c.add(texto(this, 16, y + 29, `${f.lugar} . ${this.tempo(f.minutos)}`, { cor: 0x4a3e64 }));

    c.add(this.add.image(LARGURA - 96, y + 13, "ui", 3).setScale(0.8));
    c.add(texto(this, LARGURA - 88, y + 9, String(f.selos), { cor: 0x2c2440 }));
    c.add(this.add.image(LARGURA - 96, y + 29, "ui", 2).setScale(0.8));
    c.add(texto(this, LARGURA - 88, y + 25, String(f.moedas), { cor: 0x2c2440 }));

    if (this.confirmando === indice) {
      c.add(
        botao(this, LARGURA - 58, y + ALTURA_CARTAO / 2, 56, 16, "APAGAR?", () => {
          apagarEspaco(indice);
          this.confirmando = null;
          this.desenhar();
        }, "painel-ouro")
      );
      c.add(
        botao(this, LARGURA - 20, y + ALTURA_CARTAO / 2, 20, 16, "NAO", () => {
          this.confirmando = null;
          this.desenhar();
        }, "painel-creme")
      );
      return c;
    }

    c.add(
      botao(this, LARGURA - 48, y + ALTURA_CARTAO / 2, 44, 16, "JOGAR", () => {
        if (abrirEspaco(indice)) this.scene.start("Mundo");
      }, "painel-ouro")
    );
    c.add(
      botao(this, LARGURA - 17, y + ALTURA_CARTAO / 2, 16, 16, "X", () => {
        this.confirmando = indice;
        this.desenhar();
      }, "painel-creme")
    );
    return c;
  }

  private tempo(minutos: number): string {
    if (minutos < 60) return `${minutos} min`;
    return `${Math.floor(minutos / 60)}h ${minutos % 60}min`;
  }
}
