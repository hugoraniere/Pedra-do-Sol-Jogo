/** Criacao do personagem em passos curtos, um por tela.
 *  A aventura e a mesma para todo mundo, so o heroi muda. */
import Phaser from "phaser";
import { LARGURA, ALTURA, COR, CABELOS, ROUPAS, RACAS, CLASSES } from "../dados/config";
import { texto } from "../sistemas/texto";
import { novoJogo, VAZIO } from "../sistemas/estado";
import { acharMagia } from "../dados/conteudo";
import { botao, Botao } from "../sistemas/botao";
import { criarAnimacoes, Heroi } from "../sistemas/heroi";

const PASSOS = ["Nome", "Raca", "Classe", "Cabelo", "Roupa", "Pronto"] as const;

export class Criacao extends Phaser.Scene {
  private passo = 0;
  private grupo!: Phaser.GameObjects.Container;
  private boneco!: Heroi;
  private rascunho = JSON.parse(JSON.stringify(VAZIO.heroi)) as typeof VAZIO.heroi;

  private espaco = 0;

  constructor() {
    super("Criacao");
  }

  init(dados: { espaco?: number }) {
    this.espaco = dados?.espaco ?? 0;
  }

  create() {
    criarAnimacoes(this);
    this.add.rectangle(0, 0, LARGURA, ALTURA, COR.papel).setOrigin(0);
    texto(this, LARGURA / 2, 6, "REINO DE AURORA", { cor: 0x5a4e74, ancora: 0.5 });

    this.boneco = new Heroi(this, LARGURA / 2, 94, this.rascunho.corRoupa, this.rascunho.corCabelo);
    this.boneco.body.setAllowGravity(false);
    this.boneco.body.moves = false;
    this.boneco.setScale(2);

    this.grupo = this.add.container(0, 0);
    this.desenharPasso();
  }

  private limpar() {
    this.grupo.removeAll(true);
  }

  private titulo(pergunta: string) {
    this.grupo.add(texto(this, LARGURA / 2, 18, pergunta, { tamanho: 16, cor: 0x2c2440, ancora: 0.5 }));
  }

  /** grade de botoes centrada, ate 3 por linha */
  private grade(itens: string[], selecionado: number, aoEscolher: (i: number) => void) {
    const porLinha = 3;
    const larg = 84;
    const alt = 18;
    const botoes: Botao[] = [];
    itens.forEach((texto, i) => {
      const col = i % porLinha;
      const lin = Math.floor(i / porLinha);
      const totalCols = Math.min(porLinha, itens.length - lin * porLinha);
      const x = LARGURA / 2 + (col - (totalCols - 1) / 2) * (larg + 6);
      const y = 122 + lin * (alt + 8);
      const b = botao(this, x, y, larg, alt, texto, () => {
        aoEscolher(i);
        botoes.forEach((outro, j) => outro.marcar(j === i));
      });
      b.marcar(i === selecionado);
      botoes.push(b);
      this.grupo.add(b);
    });
  }

  private avancar() {
    this.passo = Math.min(this.passo + 1, PASSOS.length - 1);
    this.desenharPasso();
  }

  private voltar() {
    this.passo = Math.max(this.passo - 1, 0);
    this.desenharPasso();
  }

  private navegacao(rotuloSeguir = "SEGUIR >") {
    if (this.passo > 0) {
      this.grupo.add(botao(this, 34, ALTURA - 14, 52, 16, "< VOLTAR", () => this.voltar(), "painel-creme"));
    }
    this.grupo.add(
      botao(this, LARGURA - 40, ALTURA - 14, 64, 16, rotuloSeguir, () => this.avancar(), "painel-ouro")
    );
  }

  private desenharPasso() {
    this.limpar();
    this.boneco.trocarCores(this.rascunho.corRoupa, this.rascunho.corCabelo);

    switch (PASSOS[this.passo]) {
      case "Nome": {
        this.titulo("Qual e o nome do seu heroi?");
        this.grupo.add(
          this.add.nineslice(LARGURA / 2, 124, "painel-creme", undefined, 200, 22, 8, 8, 8, 8).setOrigin(0.5)
        );
        const campo = texto(this, LARGURA / 2, 117, this.rascunho.nome || "_", {
          tamanho: 16,
          cor: 0x2c2440,
          ancora: 0.5,
        });
        this.grupo.add(campo);
        this.grupo.add(
          texto(this, LARGURA / 2, 142, "digite no teclado, ou toque aqui para sortear", {
            cor: 0x5a4e74,
            ancora: 0.5,
          })
            .setInteractive()
            .on("pointerdown", () => {
              const sorteio = ["Trovao da Floresta", "Vento Ligeiro", "Pedra Valente", "Faisca"];
              this.rascunho.nome = Phaser.Utils.Array.GetRandom(sorteio);
              campo.setText(this.rascunho.nome);
            })
        );
        this.input.keyboard?.removeAllListeners("keydown");
        this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
          if (PASSOS[this.passo] !== "Nome") return;
          if (e.key === "Backspace") this.rascunho.nome = this.rascunho.nome.slice(0, -1);
          else if (e.key === "Enter") this.avancar();
          else if (e.key.length === 1 && this.rascunho.nome.length < 20) this.rascunho.nome += e.key;
          campo.setText(this.rascunho.nome || "_");
        });
        this.navegacao();
        break;
      }
      case "Raca": {
        this.titulo("De que povo ele e?");
        const i = RACAS.findIndex((r) => r.id === this.rascunho.raca);
        this.grade(RACAS.map((r) => r.nome), i < 0 ? 0 : i, (k) => {
          this.rascunho.raca = RACAS[k].id;
        });
        this.navegacao();
        break;
      }
      case "Classe": {
        this.titulo("O que ele sabe fazer?");
        const i = CLASSES.findIndex((c) => c.id === this.rascunho.classe);
        this.grade(CLASSES.map((c) => c.nome), i < 0 ? 0 : i, (k) => {
          this.rascunho.classe = CLASSES[k].id;
          this.rascunho.magias = [...CLASSES[k].magias];
        });
        this.navegacao();
        break;
      }
      case "Cabelo": {
        this.titulo("A cor do cabelo");
        const i = CABELOS.findIndex((c) => c.cor === this.rascunho.corCabelo);
        this.grade(CABELOS.map((c) => c.nome), i < 0 ? 0 : i, (k) => {
          this.rascunho.corCabelo = CABELOS[k].cor;
          this.boneco.trocarCores(this.rascunho.corRoupa, this.rascunho.corCabelo);
        });
        this.navegacao();
        break;
      }
      case "Roupa": {
        this.titulo("A cor da roupa");
        const i = ROUPAS.findIndex((c) => c.cor === this.rascunho.corRoupa);
        this.grade(ROUPAS.map((c) => c.nome), i < 0 ? 0 : i, (k) => {
          this.rascunho.corRoupa = ROUPAS[k].cor;
          this.boneco.trocarCores(this.rascunho.corRoupa, this.rascunho.corCabelo);
        });
        this.navegacao();
        break;
      }
      case "Pronto": {
        if (!this.rascunho.nome) this.rascunho.nome = "Heroi";
        if (!this.rascunho.magias.length) {
          this.rascunho.magias = [...CLASSES.find((c) => c.id === this.rascunho.classe)!.magias];
        }
        this.titulo(this.rascunho.nome);
        const classe = CLASSES.find((c) => c.id === this.rascunho.classe)!;
        const raca = RACAS.find((r) => r.id === this.rascunho.raca)!;
        this.grupo.add(
          texto(
            this,
            LARGURA / 2,
            116,
              [
                `${raca.nome} . ${classe.nome}`,
                `Dom: ${raca.dom}`,
                classe.magias.length
                  ? `Magias: ${classe.magias.map((m) => acharMagia(m)?.nome ?? m).join(", ")}`
                  : `Habilidade: ${classe.habilidade}`,
            ].join("\n"),
            { cor: 0x2c2440, ancora: 0.5, alinhamento: 1, entrelinha: 4 }
          )
        );
        this.grupo.add(
          botao(this, LARGURA / 2, ALTURA - 16, 120, 20, "COMECAR A AVENTURA", () => {
            novoJogo(this.espaco, this.rascunho);
            this.scene.start("Mundo");
          }, "painel-ouro")
        );
        break;
      }
    }
  }
}
