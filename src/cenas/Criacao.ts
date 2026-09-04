/** Criacao do personagem.
 *
 * Quatro passos curtos: nome, povo, classe e aparencia. A aparencia e uma tela so,
 * com o boneco grande de um lado e uma lista de escolhas do outro, cada uma com
 * seta para a esquerda e para a direita. Foi a forma de ter a montagem por partes
 * que o Hugo pediu (referencia Baldur's Gate e Project Zomboid) sem virar um
 * formulario, que uma crianca de 7 anos nao le.
 */
import Phaser from "phaser";
import { musica } from "../sistemas/som";
import {
  LARGURA,
  ALTURA,
  CABELOS,
  ROUPAS,
  RACAS,
  CLASSES,
  tonsDaRaca,
  RACAS_SPRITE,
  TIPOS_CORPO,
  CABELOS_ESTILO,
  ROUPAS_ESTILO,
  CHAPEUS,
  ARMAS_SPRITE,
  ROUPA_DA_CLASSE,
  ARMA_DA_CLASSE,
  CHAPEU_DA_CLASSE,
} from "../dados/config";
import { ATRIBUTOS, ORDEM_PODERES, acharMagia } from "../dados/conteudo";
import { poderesDaOrigem, poderEscolhidoDoHeroi } from "../sistemas/poderes";
import { novoJogo, VAZIO, Heroi as FichaHeroi } from "../sistemas/estado";
import { botao, Botao } from "../sistemas/botao";
import { texto } from "../sistemas/texto";
import { ESPACO, TAMANHO, marcar, meio, pilha } from "../sistemas/design";
import { camadasDoHeroi, criarAnimacoes, Heroi } from "../sistemas/heroi";

const PASSOS = ["Nome", "Raca", "Classe", "Poder", "Aparencia", "Pronto"] as const;

const SORTEIO = ["Trovao da Floresta", "Vento Ligeiro", "Pedra Valente", "Faisca", "Lua Nova"];

export class Criacao extends Phaser.Scene {
  private passo = 0;
  private espaco = 0;
  private grupo!: Phaser.GameObjects.Container;
  private fundo!: Phaser.GameObjects.Container;
  private boneco!: Heroi;
  private rascunho: FichaHeroi = JSON.parse(JSON.stringify(VAZIO.heroi));
  private comEquipamento = true;

  constructor() {
    super("Criacao");
  }

  init(dados: { espaco?: number }) {
    this.espaco = dados?.espaco ?? 0;
    this.passo = 0;
    this.rascunho = JSON.parse(JSON.stringify(VAZIO.heroi));
    this.comEquipamento = true;
  }

  create() {
    musica(this, "menu");
    // todas as combinacoes possiveis de camada precisam de animacao pronta
    criarAnimacoes(this, this.todasAsChaves());
    this.add.rectangle(0, 0, LARGURA, ALTURA, 0xfff8ea).setOrigin(0);
    // o cenario da tela inicial fica so como textura de fundo, bem apagado.
    // a 25 por cento ele competia com os botoes e lavava o texto
    marcar(this.add.image(0, 0, "titulo").setOrigin(0).setAlpha(0.14), "fundo");

    // tres camadas de profundidade, nesta ordem: o palco atras, o boneco em
    // cima dele, e os botoes por cima de tudo. Sem separar, o palco desenhado
    // depois do boneco simplesmente o tapava
    this.fundo = this.add.container(0, 0).setDepth(1);
    this.boneco = new Heroi(this, 0, 0, this.rascunho);
    this.boneco.body.moves = false;
    this.boneco.setDepth(2);
    this.grupo = this.add.container(0, 0).setDepth(10);
    this.desenharPasso();
  }

  /** Aqui o jogador troca de raca e de classe a vontade, entao TODA folha que
   *  ele possa fazer aparecer precisa de animacao pronta antes. Uma camada sem
   *  animacao nao da erro visivel: ela simplesmente congela no primeiro quadro,
   *  e o personagem anda com o cabelo parado no ar. */
  private todasAsChaves(): string[] {
    const chaves = new Set<string>();
    Object.entries(RACAS_SPRITE).forEach(([raca, r]) =>
      r.tons.forEach((_, i) => {
        chaves.add(`heroi-corpo-${raca}-${i}`);
        chaves.add(`heroi-bracos-${raca}-${i}`);
      })
    );
    TIPOS_CORPO.forEach((t) => {
      ROUPAS_ESTILO.forEach((r) => chaves.add(`heroi-roupa-${t}-${r.id}`));
      ARMAS_SPRITE.filter((a) => a !== "nenhuma").forEach((a) => chaves.add(`heroi-arma-${t}-${a}`));
    });
    CABELOS_ESTILO.forEach((c) => chaves.add(`heroi-cabelo-${c.id}`));
    CHAPEUS.filter((c) => c.id !== "nenhum").forEach((c) => chaves.add(`heroi-chapeu-${c.id}`));
    return [...chaves];
  }

  /** o que o boneco mostra depende do botao com equipamento / sem equipamento */
  private fichaDoPreview(): FichaHeroi {
    if (this.comEquipamento) return this.rascunho;
    return { ...this.rascunho, chapeu: "nenhum", armaSprite: "nenhuma" };
  }

  /** Palco do boneco: um retangulo escuro atras dele, com o chao mais claro.
   *
   *  Existe por um motivo de leitura, nao de enfeite. O personagem pode estar
   *  de qualquer cor, inclusive creme claro em cima de um fundo creme claro, e
   *  ai ele some. Com o palco, o fundo dele e sempre o mesmo e sempre escuro,
   *  entao toda combinacao de raca, roupa e chapeu aparece igual de bem. */
  private palco(x: number, y: number, largura: number, altura: number) {
    const topo = y - altura;
    this.fundo.add(
      marcar(
        this.add.nineslice(x, topo, "painel-escuro", undefined, largura, altura, 8, 8, 8, 8)
          .setOrigin(0.5, 0),
        "fundo"
      )
    );
    // uma faixa clara no pe do palco, que le como chao e apoia o personagem
    this.fundo.add(
      marcar(
        this.add.rectangle(x, y - 6, largura - 10, 6, 0x4a3e64).setOrigin(0.5, 0),
        "fundo"
      )
    );
  }

  private atualizarBoneco(x: number, y: number, escala: number) {
    this.boneco.setPosition(x, y).setScale(escala);
    this.boneco.trocarAparencia(this.fichaDoPreview());
    void camadasDoHeroi;
  }

  private limpar() {
    this.grupo.removeAll(true);
    this.fundo.removeAll(true);
    this.input.keyboard?.removeAllListeners("keydown");
  }

  private titulo(pergunta: string) {
    this.grupo.add(
      texto(this, LARGURA / 2, 8, pergunta, { tamanho: 16, cor: 0x2c2440, ancora: 0.5 })
    );
  }

  private navegacao(rotulo = "SEGUIR >") {
    if (this.passo > 0) {
      this.grupo.add(
        botao(this, 36, ALTURA - 12, 60, TAMANHO.botao, "< VOLTAR", () => {
          this.passo -= 1;
          this.desenharPasso();
        }, "painel-creme")
      );
    }
    this.grupo.add(
      botao(this, LARGURA - 42, ALTURA - 12, 72, TAMANHO.botao, rotulo, () => {
        this.passo = Math.min(this.passo + 1, PASSOS.length - 1);
        this.desenharPasso();
      }, "painel-ouro")
    );
  }

  /** grade de escolha unica, usada em povo e classe */
  private grade(itens: string[], selecionado: number, aoEscolher: (i: number) => void) {
    const maisLongo = Math.max(...itens.map((t) => t.length));
    const margem = 10;
    const gap = ESPACO.md;
    const cabe = (n: number) => (maisLongo * 7 + 12) * n + gap * (n - 1) + margem * 2 <= LARGURA;
    const porLinha = cabe(3) ? 3 : cabe(2) ? 2 : 1;
    const larg = Math.floor((LARGURA - margem * 2 - gap * (porLinha - 1)) / porLinha);
    const linhas = Math.ceil(itens.length / porLinha);
    // a grade cresce de baixo para cima: o passo nunca fica menor que o botao,
    // senao uma linha sobe em cima da outra
    const passo = TAMANHO.botao + ESPACO.sm;
    const base = ALTURA - 26;
    const area = { x: margem, y: base - linhas * passo, largura: LARGURA - margem * 2, altura: linhas * passo };
    const botoes: Botao[] = [];

    itens.forEach((rotulo, i) => {
      const col = i % porLinha;
      const lin = Math.floor(i / porLinha);
      const nesta = Math.min(porLinha, itens.length - lin * porLinha);
      const x = LARGURA / 2 + (col - (nesta - 1) / 2) * (larg + gap);
      const y = area.y + lin * passo + passo / 2;
      const b = botao(this, x, y, larg, TAMANHO.botao, rotulo, () => {
        aoEscolher(i);
        // aoEscolher pode ter redesenhado o passo inteiro, e ai estes botoes ja
        // foram destruidos. Marcar um objeto destruido estoura dentro do Phaser,
        // porque setTexture procura a cena que ele ja nao tem.
        botoes.forEach((o, j) => o.scene && o.marcar(j === i));
      });
      b.marcar(i === selecionado);
      botoes.push(b);
      this.grupo.add(b);
    });
  }

  /** uma linha de escolha: < NOME DO VALOR > */
  /** uma linha compacta: ROTULO  < valor >  , tudo na mesma altura */
  private seletor(
    y: number,
    x: number,
    largura: number,
    rotulo: string,
    valor: string,
    aoMudar: (passo: number) => void
  ) {
    const alt = TAMANHO.botaoPequeno;
    const centro = y + alt / 2;
    const larguraRotulo = 76;
    this.grupo.add(
      texto(this, x, centro, rotulo, { cor: 0x4a3e64, ancoraY: 0.5 })
    );
    const cx = x + larguraRotulo;
    const larguraControle = largura - larguraRotulo;
    this.grupo.add(botao(this, cx + 7, centro, 14, alt, "<", () => aoMudar(-1), "painel-creme"));
    this.grupo.add(
      botao(this, cx + larguraControle - 7, centro, 14, alt, ">", () => aoMudar(1), "painel-creme")
    );
    this.grupo.add(
      this.add
        .nineslice(cx + 16, y, "painel", undefined, larguraControle - 32, alt, 8, 8, 8, 8)
        .setOrigin(0)
    );
    this.grupo.add(
      texto(this, cx + larguraControle / 2, centro, valor, {
        cor: 0x2c2440,
        ancora: 0.5,
        ancoraY: 0.5,
      })
    );
  }

  private ciclar<Tipo>(lista: Tipo[], atual: number, passo: number): number {
    return (atual + passo + lista.length) % lista.length;
  }

  private desenharPasso() {
    this.limpar();

    switch (PASSOS[this.passo]) {
      case "Nome":
        this.passoNome();
        break;
      case "Raca":
        this.titulo("De que povo ele e?");
        this.palco(LARGURA / 2, 102, 80, 70);
        this.atualizarBoneco(LARGURA / 2, 96, 2);
        this.grade(
          RACAS.map((r) => r.nome),
          Math.max(0, RACAS.findIndex((r) => r.id === this.rascunho.raca)),
          (k) => {
            this.rascunho.raca = RACAS[k].id;
            // a lista de tons muda com a raca, entao um indice antigo pode
            // apontar para fora dela
            const tons = tonsDaRaca(this.rascunho.raca);
            if (this.rascunho.tomPele >= tons.length) this.rascunho.tomPele = 0;
          }
        );
        this.navegacao();
        break;
      case "Classe":
        this.titulo("O que ele sabe fazer?");
        this.palco(LARGURA / 2, 102, 80, 70);
        this.atualizarBoneco(LARGURA / 2, 96, 2);
        this.grade(
          CLASSES.map((c) => c.nome),
          Math.max(0, CLASSES.findIndex((c) => c.id === this.rascunho.classe)),
          (k) => {
            const c = CLASSES[k];
            this.rascunho.classe = c.id;
            this.rascunho.magias = [...c.magias];
            // a classe ja veste e ja arma: ninguem sai daqui com um mago de
            // avental porque esqueceu de passar pela tela de aparencia
            this.rascunho.estiloRoupa = ROUPA_DA_CLASSE[c.id] ?? "tunica";
            this.rascunho.armaSprite = ARMA_DA_CLASSE[c.id] ?? "nenhuma";
            this.rascunho.chapeu = CHAPEU_DA_CLASSE[c.id] ?? "nenhum";
          }
        );
        this.navegacao();
        break;
      case "Poder":
        this.passoPoder();
        break;
      case "Aparencia":
        this.passoAparencia();
        break;
      case "Pronto":
        this.passoPronto();
        break;
    }
  }

  // ------------------------------------------------------------- nome
  private passoNome() {
    this.titulo("Qual e o nome do seu heroi?");
    this.palco(LARGURA / 2, 102, 80, 70);
    this.atualizarBoneco(LARGURA / 2, 96, 2);

    this.grupo.add(
      this.add.nineslice(LARGURA / 2, 124, "painel-creme", undefined, 210, 22, 8, 8, 8, 8).setOrigin(0.5)
    );
    const campo = texto(this, LARGURA / 2, 117, this.rascunho.nome || "_", {
      tamanho: 16,
      cor: 0x2c2440,
      ancora: 0.5,
    });
    this.grupo.add(campo);
    this.grupo.add(
      texto(this, LARGURA / 2, 142, "digite no teclado, ou toque aqui para sortear", {
        cor: 0x4a3e64,
        ancora: 0.5,
      })
        .setInteractive()
        .on("pointerdown", () => {
          this.rascunho.nome = Phaser.Utils.Array.GetRandom(SORTEIO);
          campo.setText(this.rascunho.nome);
        })
    );

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (PASSOS[this.passo] !== "Nome") return;
      if (e.key === "Backspace") this.rascunho.nome = this.rascunho.nome.slice(0, -1);
      else if (e.key === "Enter") {
        this.passo += 1;
        this.desenharPasso();
        return;
      } else if (e.key.length === 1 && this.rascunho.nome.length < 20) {
        this.rascunho.nome += e.key;
      }
      campo.setText(this.rascunho.nome || "_");
    });
    this.navegacao();
  }

  // -------------------------------------------------------- aparencia
  private passoAparencia() {
    this.titulo("Como ele e?");
    this.palco(48, 148, 84, 116);
    this.atualizarBoneco(48, 140, 3);

    const x = 96;
    const largura = LARGURA - x - 8;
    const p = pilha({ x, y: 30, largura, altura: 120 }, ESPACO.sm);

    const linhas: [string, string, (d: number) => void][] = [
      [
        // na Cria de Dragao isto nao e pele, e escama, e o nome muda junto
        RACAS_SPRITE[this.rascunho.raca]?.tons[0]?.startsWith("Escama") ? "ESCAMA" : "PELE",
        tonsDaRaca(this.rascunho.raca)[this.rascunho.tomPele]?.nome ?? "Clara",
        (d) => {
          const tons = tonsDaRaca(this.rascunho.raca);
          this.rascunho.tomPele = this.ciclar(tons, this.rascunho.tomPele, d);
        },
      ],
      [
        "CABELO",
        CABELOS_ESTILO.find((c) => c.id === this.rascunho.estiloCabelo)?.nome ?? "Curto",
        (d) => {
          const i = CABELOS_ESTILO.findIndex((c) => c.id === this.rascunho.estiloCabelo);
          this.rascunho.estiloCabelo = CABELOS_ESTILO[this.ciclar(CABELOS_ESTILO, Math.max(0, i), d)].id;
        },
      ],
      [
        "COR DO CABELO",
        CABELOS.find((c) => c.cor === this.rascunho.corCabelo)?.nome ?? "Verde folha",
        (d) => {
          const i = CABELOS.findIndex((c) => c.cor === this.rascunho.corCabelo);
          this.rascunho.corCabelo = CABELOS[this.ciclar(CABELOS, Math.max(0, i), d)].cor;
        },
      ],
      [
        "ROUPA",
        ROUPAS_ESTILO.find((r) => r.id === this.rascunho.estiloRoupa)?.nome ?? "Tunica",
        (d) => {
          const i = ROUPAS_ESTILO.findIndex((r) => r.id === this.rascunho.estiloRoupa);
          this.rascunho.estiloRoupa = ROUPAS_ESTILO[this.ciclar(ROUPAS_ESTILO, Math.max(0, i), d)].id;
        },
      ],
      [
        "COR DA ROUPA",
        ROUPAS.find((r) => r.cor === this.rascunho.corRoupa)?.nome ?? "Verde mata",
        (d) => {
          const i = ROUPAS.findIndex((r) => r.cor === this.rascunho.corRoupa);
          this.rascunho.corRoupa = ROUPAS[this.ciclar(ROUPAS, Math.max(0, i), d)].cor;
        },
      ],
      [
        "CHAPEU",
        CHAPEUS.find((c) => c.id === this.rascunho.chapeu)?.nome ?? "Sem chapeu",
        (d) => {
          const i = CHAPEUS.findIndex((c) => c.id === this.rascunho.chapeu);
          this.rascunho.chapeu = CHAPEUS[this.ciclar(CHAPEUS, Math.max(0, i), d)].id;
        },
      ],
    ];

    linhas.forEach(([rotulo, valor, mudar]) => {
      const r = p.reservar(TAMANHO.botaoPequeno);
      this.seletor(r.y, r.x, r.largura, rotulo, valor, (d) => {
        mudar(d);
        this.desenharPasso();
      });
    });

    // o preview de equipamento que o Hugo pediu: ve o heroi com e sem
    this.grupo.add(
      botao(
        this,
        58,
        ALTURA - 30,
        104,
        TAMANHO.botaoPequeno,
        this.comEquipamento ? "SEM EQUIPAMENTO" : "COM EQUIPAMENTO",
        () => {
          this.comEquipamento = !this.comEquipamento;
          this.desenharPasso();
        },
        "painel-creme"
      )
    );
    this.navegacao();
  }

  // ------------------------------------------------------------ poder
  /** O passo 4 do manual: a raca deu +1, a classe deu +1, e agora ele coloca o
   *  terceiro onde quiser.
   *
   *  O botao mostra o total que o poder VAI ficar, nao o "+1" abstrato: para uma
   *  crianca de 7 anos, "ESPERTEZA 3" diz mais do que "+1 em esperteza".
   *
   *  Sem linha explicando para que serve cada poder: esta tela tem o palco fixo
   *  entre o titulo e a grade, e o que sobra entre eles muda com a resolucao. O
   *  "para que serve" mora na ficha, que se mede antes de desenhar.
   */
  private passoPoder() {
    this.titulo("Onde ele e mais forte?");
    this.palco(LARGURA / 2, 102, 80, 70);
    this.atualizarBoneco(LARGURA / 2, 96, 2);

    const origem = poderesDaOrigem(this.rascunho.raca, this.rascunho.classe);
    const escolhido = poderEscolhidoDoHeroi(this.rascunho);

    this.grade(
      ORDEM_PODERES.map((id) => `${ATRIBUTOS[id].nome} ${origem[id] + (id === escolhido ? 1 : 0)}`),
      ORDEM_PODERES.indexOf(escolhido),
      (k) => {
        this.rascunho.poderEscolhido = ORDEM_PODERES[k];
        // o numero de todos os botoes muda junto com a escolha, entao a grade
        // inteira se redesenha em vez de so trocar a marca do selecionado
        this.desenharPasso();
      }
    );
    this.navegacao();
  }

  // ----------------------------------------------------------- pronto
  private passoPronto() {
    if (!this.rascunho.nome) this.rascunho.nome = "Heroi";
    const classe = CLASSES.find((c) => c.id === this.rascunho.classe)!;
    const raca = RACAS.find((r) => r.id === this.rascunho.raca)!;
    if (!this.rascunho.magias.length) this.rascunho.magias = [...classe.magias];

    this.titulo(this.rascunho.nome.toUpperCase());
    this.atualizarBoneco(64, 132, 3);

    const x = 116;
    const p = pilha({ x, y: 34, largura: LARGURA - x - 10, altura: 110 }, ESPACO.sm);
    const linhas = [
      `${raca.nome}`,
      `${classe.nome}`,
      `Dom: ${raca.dom}`,
      classe.magias.length
        ? `Magias: ${classe.magias.map((m) => acharMagia(m)?.nome ?? m).join(", ")}`
        : `Habilidade: ${classe.habilidade}`,
    ];
    linhas.forEach((linha, i) => {
      const r = p.reservar(i < 2 ? TAMANHO.linhaTitulo : TAMANHO.linhaTexto * 2);
      this.grupo.add(
        texto(this, r.x, r.y, linha, {
          tamanho: i < 2 ? 16 : 8,
          cor: i < 2 ? 0x2c2440 : 0x4a3e64,
          larguraMax: r.largura,
          entrelinha: 2,
        })
      );
      void meio;
    });

    this.grupo.add(
      botao(this, LARGURA / 2, ALTURA - 14, 168, TAMANHO.botao, "COMECAR A AVENTURA", () => {
        novoJogo(this.espaco, this.rascunho);
        this.scene.start("Mundo");
      }, "painel-ouro")
    );
    this.grupo.add(
      botao(this, 36, ALTURA - 34, 60, TAMANHO.botaoPequeno, "< VOLTAR", () => {
        this.passo -= 1;
        this.desenharPasso();
      }, "painel-creme")
    );
  }
}
