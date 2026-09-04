/** Criacao do personagem.
 *
 * Cinco passos curtos: nome, povo, classe, poder e aparencia. A aparencia e uma
 * tela so, com o boneco grande de um lado e uma lista de escolhas do outro, cada
 * uma com seta para a esquerda e para a direita. Foi a forma de ter a montagem
 * por partes que o Hugo pediu (referencia Baldur's Gate e Project Zomboid) sem
 * virar um formulario, que uma crianca de 7 anos nao le.
 *
 * NENHUM PASSO ESCREVE COORDENADA. A tela muda de tamanho com a visao escolhida
 * (256x160, 320x192 ou 400x240), e enquanto o palco do boneco morava num y fixo
 * e a grade de botoes se media de baixo para cima, as duas coisas se cruzavam em
 * 160 de altura: os cinco botoes de povo cobriam o boneco inteiro. Agora toda
 * faixa se mede. O titulo desce do topo, o rodape sobe da base, o que sobra e o
 * corpo, e dentro dele quem escolhe primeiro e sempre o que a crianca toca: a
 * grade e a lista pegam o espaco de que precisam e o boneco fica com o resto,
 * na maior escala inteira que couber ali.
 */
import Phaser from "phaser";
import { musica } from "../sistemas/som";
import {
  LARGURA,
  ALTURA,
  ALTURA_PERSONAGEM,
  LARGURA_PERSONAGEM,
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
import { interativo } from "../sistemas/interativo";
import { texto, medirTexto } from "../sistemas/texto";
import { ESPACO, TAMANHO, marcar, meio, pilha, colunas, Retangulo } from "../sistemas/design";
import { camadasDoHeroi, criarAnimacoes, Heroi } from "../sistemas/heroi";

const PASSOS = ["Nome", "Raca", "Classe", "Poder", "Aparencia", "Pronto"] as const;

const SORTEIO = ["Trovao da Floresta", "Vento Ligeiro", "Pedra Valente", "Faisca", "Lua Nova"];

/** A pergunta encosta no topo. E a unica altura fixa da tela: todo o resto se
 *  mede a partir do rodape dela. */
const TOPO = ESPACO.md;

/** Faixa de baixo, onde ficam VOLTAR e o botao que segue. */
const RODAPE = TAMANHO.botao + ESPACO.md;

/** Caixa onde o nome aparece enquanto ele digita. */
const CAMPO = TAMANHO.botao + ESPACO.sm;

/** Faixa clara no pe do palco, que le como chao. */
const CHAO = ESPACO.md;

/** Seta de um seletor. Quadrada, para o dedo acertar. */
const SETA = TAMANHO.botaoPequeno;

/** O boneco nao passa disto nem na tela mais alta: acima de 3 ele vira poster e
 *  come o espaco de quem escolhe. */
const ESCALA_MAX = 3;

/** Uma linha da tela de aparencia. As opcoes vem junto porque a largura da
 *  coluna sai da mais longa de TODAS elas, nao da que esta a mostra agora. */
type LinhaAparencia = {
  rotulo: string;
  valor: string;
  opcoes: string[];
  mudar: (passo: number) => void;
};

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
    // marcado como palco: e assim que o auditor sabe que nada tocavel pode
    // ficar por cima dele. Foi o que faltou para ele ver a grade de botoes
    // cobrindo o personagem em 256x160
    marcar(this.boneco, "palco");
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

  private atualizarBoneco(x: number, y: number, escala: number) {
    this.boneco.setVisible(true).setPosition(x, y).setScale(escala);
    this.boneco.trocarAparencia(this.fichaDoPreview());
    void camadasDoHeroi;
  }

  private limpar() {
    this.grupo.removeAll(true);
    this.fundo.removeAll(true);
    this.input.keyboard?.removeAllListeners("keydown");
  }

  // ------------------------------------------------------- faixas da tela
  /** Escreve a pergunta no topo e devolve o corpo da tela: tudo o que sobra
   *  entre o rodape dela e a faixa dos botoes de baixo.
   *
   *  A pergunta cai para 8 px quando nao cabe inteira na largura. Em 256 px a de
   *  16 px saia pelos dois lados da tela. Quebrar em duas linhas seria pior:
   *  a linha a mais sai justamente do espaco do boneco. */
  private corpo(pergunta: string): Retangulo {
    const t = texto(this, LARGURA / 2, TOPO, pergunta, { tamanho: 16, cor: 0x2c2440, ancora: 0.5 });
    if (t.width > LARGURA - TAMANHO.paddingTela * 2) t.setFontSize(8);
    this.grupo.add(t);
    const y = TOPO + t.height + ESPACO.sm;
    return {
      x: TAMANHO.paddingTela,
      y,
      largura: LARGURA - TAMANHO.paddingTela * 2,
      altura: ALTURA - RODAPE - ESPACO.xs - y,
    };
  }

  /** A faixa de baixo, onde moram VOLTAR e o botao que segue. */
  private faixaDoRodape(): Retangulo {
    return {
      x: TAMANHO.paddingTela,
      y: ALTURA - RODAPE,
      largura: LARGURA - TAMANHO.paddingTela * 2,
      altura: TAMANHO.botao,
    };
  }

  /** Rodape da tela: VOLTAR na esquerda, o que segue na direita, e no meio o que
   *  o passo precisar (o preview de equipamento, na aparencia). O botao do meio
   *  recebe so o vao entre os outros dois: em 256 px de largura ele nao cabe
   *  inteiro, e encolher e melhor do que encostar no SEGUIR. */
  private navegacao(
    seguir?: { rotulo: string; largura: number; aoTocar: () => void },
    meioDaFaixa?: { rotulo: string; aoTocar: () => void }
  ) {
    const faixa = this.faixaDoRodape();
    const y = meio(faixa);
    const proximo = seguir ?? {
      rotulo: "SEGUIR >",
      largura: 72,
      aoTocar: () => this.irPara(this.passo + 1),
    };
    const larguraVoltar = 60;

    if (this.passo > 0) {
      this.grupo.add(
        botao(
          this,
          faixa.x + larguraVoltar / 2,
          y,
          larguraVoltar,
          TAMANHO.botao,
          "< VOLTAR",
          () => this.irPara(this.passo - 1),
          "painel-creme"
        )
      );
    }

    if (meioDaFaixa) {
      const esquerda = faixa.x + (this.passo > 0 ? larguraVoltar : 0) + ESPACO.sm;
      const direita = faixa.x + faixa.largura - proximo.largura - ESPACO.sm;
      const largura = Math.min(
        medirTexto(this, meioDaFaixa.rotulo) + ESPACO.lg * 2,
        direita - esquerda
      );
      this.grupo.add(
        botao(
          this,
          Math.round((esquerda + direita) / 2),
          y,
          largura,
          TAMANHO.botao,
          meioDaFaixa.rotulo,
          meioDaFaixa.aoTocar,
          "painel-creme"
        )
      );
    }

    this.grupo.add(
      botao(
        this,
        faixa.x + faixa.largura - proximo.largura / 2,
        y,
        proximo.largura,
        TAMANHO.botao,
        proximo.rotulo,
        proximo.aoTocar,
        "painel-ouro"
      )
    );
  }

  private irPara(passo: number) {
    this.passo = Math.max(0, Math.min(passo, PASSOS.length - 1));
    this.desenharPasso();
  }

  // --------------------------------------------------------------- grade
  /** Mede a grade antes de qualquer pixel: quantos botoes cabem por linha, que
   *  largura eles tem e quanta altura o conjunto vai ocupar. O palco precisa
   *  desta conta pronta para saber com quanto espaco ele ficou. */
  private medirGrade(itens: string[], largura: number) {
    const maisLargo = Math.max(...itens.map((t) => medirTexto(this, t)));
    const gap = ESPACO.md;
    // ESPACO.xl de folga dentro do botao: e o que o auditor exige entre o
    // rotulo e a borda, e o que a crianca precisa para nao ler letra colada
    const cabe = (n: number) => (maisLargo + ESPACO.xl) * n + gap * (n - 1) <= largura;
    const porLinha = cabe(3) ? 3 : cabe(2) ? 2 : 1;
    const passo = TAMANHO.botao + ESPACO.sm;
    return {
      porLinha,
      gap,
      passo,
      larg: Math.floor((largura - gap * (porLinha - 1)) / porLinha),
      linhas: Math.ceil(itens.length / porLinha),
      altura: Math.ceil(itens.length / porLinha) * passo,
    };
  }

  /** Grade de escolha unica, usada em povo, classe e poder.
   *
   *  Ela e o que a crianca toca, entao fica com o espaco de que precisa, no pe do
   *  corpo. O que sobra acima volta para quem chamou, e e ali que o palco cabe:
   *  assim a grade nunca sobe por cima do boneco, em nenhuma das tres visoes. */
  private grade(
    corpo: Retangulo,
    itens: string[],
    selecionado: number,
    aoEscolher: (i: number) => void
  ): Retangulo {
    const m = this.medirGrade(itens, corpo.largura);
    const p = pilha(corpo, 0);
    const sobra = p.reservar(Math.max(0, corpo.altura - m.altura));
    const area = p.reservar(m.altura);
    const botoes: Botao[] = [];

    itens.forEach((rotulo, i) => {
      const col = i % m.porLinha;
      const lin = Math.floor(i / m.porLinha);
      const nesta = Math.min(m.porLinha, itens.length - lin * m.porLinha);
      const x = LARGURA / 2 + (col - (nesta - 1) / 2) * (m.larg + m.gap);
      const y = area.y + lin * m.passo + m.passo / 2;
      const b = botao(this, x, y, m.larg, TAMANHO.botao, rotulo, () => {
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

    return sobra;
  }

  // --------------------------------------------------------------- palco
  /** Palco do boneco: um retangulo escuro atras dele, com o chao mais claro.
   *
   *  Existe por um motivo de leitura, nao de enfeite. O personagem pode estar
   *  de qualquer cor, inclusive creme claro em cima de um fundo creme claro, e
   *  ai ele some. Com o palco, o fundo dele e sempre o mesmo e sempre escuro,
   *  entao toda combinacao de raca, roupa e chapeu aparece igual de bem.
   *
   *  A escala e a maior INTEIRA que couber na sobra, porque escala quebrada
   *  borra pixel art. Se nao couber nem a escala 1, o boneco sai de cena: e
   *  preferivel a ele aparecer por baixo de um botao. */
  private palcoComBoneco(area: Retangulo, comPalco = true) {
    const escala = Math.min(
      ESCALA_MAX,
      Math.floor((area.altura - CHAO) / ALTURA_PERSONAGEM),
      Math.floor(area.largura / LARGURA_PERSONAGEM)
    );
    if (escala < 1) {
      this.boneco.setVisible(false);
      return;
    }

    const altura = escala * ALTURA_PERSONAGEM + CHAO;
    const largura = Math.min(area.largura, escala * LARGURA_PERSONAGEM + ESPACO.xl * 2);
    const x = Math.round(area.x + area.largura / 2);
    const base = Math.round(area.y + (area.altura + altura) / 2);

    if (comPalco) {
      this.fundo.add(
        marcar(
          this.add
            .nineslice(x, base - altura, "painel-escuro", undefined, largura, altura, 8, 8, 8, 8)
            .setOrigin(0.5, 0),
          "palco"
        )
      );
      // uma faixa clara no pe do palco, que le como chao e apoia o personagem
      this.fundo.add(
        marcar(
          this.add
            .rectangle(x, base - CHAO, largura - ESPACO.lg, CHAO, 0x4a3e64)
            .setOrigin(0.5, 0),
          "fundo"
        )
      );
    }

    this.atualizarBoneco(x, base - CHAO, escala);
  }

  // ------------------------------------------------------------- seletor
  /** uma linha compacta: ROTULO  < valor >  , tudo na mesma altura */
  private seletor(area: Retangulo, larguraRotulo: number, linha: LinhaAparencia) {
    const centro = meio(area);
    this.grupo.add(texto(this, area.x, centro, linha.rotulo, { cor: 0x4a3e64, ancoraY: 0.5 }));

    const cx = area.x + larguraRotulo;
    const controle = area.largura - larguraRotulo;
    const painel = controle - (SETA + ESPACO.xs) * 2;
    this.grupo.add(
      botao(this, cx + SETA / 2, centro, SETA, area.altura, "<", () => linha.mudar(-1), "painel-creme")
    );
    this.grupo.add(
      botao(
        this,
        cx + controle - SETA / 2,
        centro,
        SETA,
        area.altura,
        ">",
        () => linha.mudar(1),
        "painel-creme"
      )
    );
    // o painel do valor entra marcado: assim o auditor reclama sozinho se um
    // nome longo voltar a vazar por cima das setas
    this.grupo.add(
      marcar(
        this.add
          .nineslice(cx + SETA + ESPACO.xs, area.y, "painel", undefined, painel, area.altura, 8, 8, 8, 8)
          .setOrigin(0),
        "painel",
        linha.rotulo
      )
    );
    this.grupo.add(
      texto(this, cx + SETA + ESPACO.xs + painel / 2, centro, linha.valor, {
        cor: 0x2c2440,
        ancora: 0.5,
        ancoraY: 0.5,
      })
    );
  }

  /** Quanto a coluna dos seletores precisa: o rotulo mais largo, as duas setas e
   *  o valor mais largo que ela pode CHEGAR a mostrar. Medir so o valor de agora
   *  faria a coluna dancar embaixo do dedo a cada troca. */
  private larguraDosSeletores(linhas: LinhaAparencia[]) {
    const rotulo = Math.max(...linhas.map((l) => medirTexto(this, l.rotulo))) + ESPACO.sm;
    const valor =
      Math.max(...linhas.flatMap((l) => l.opcoes.map((o) => medirTexto(this, o)))) +
      ESPACO.md * 2;
    return { rotulo, total: rotulo + (SETA + ESPACO.xs) * 2 + valor };
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
        this.passoEscolha(
          "De que povo ele e?",
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
        break;
      case "Classe":
        this.passoEscolha(
          "O que ele sabe fazer?",
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
    const corpo = this.corpo("Qual e o nome do seu heroi?");
    const p = pilha(corpo, ESPACO.sm);
    // o campo e a dica ficam no pe do corpo, e o boneco fica com a sobra
    const abaixo = CAMPO + TAMANHO.linhaTexto + ESPACO.sm * 2;
    const areaBoneco = p.reservar(Math.max(0, corpo.altura - abaixo));
    const areaCampo = p.reservar(CAMPO);
    const areaDica = p.reservar(TAMANHO.linhaTexto);

    this.palcoComBoneco(areaBoneco);

    this.grupo.add(
      this.add
        .nineslice(
          LARGURA / 2,
          meio(areaCampo),
          "painel-creme",
          undefined,
          Math.min(210, corpo.largura),
          CAMPO,
          8,
          8,
          8,
          8
        )
        .setOrigin(0.5)
    );
    const campo = texto(this, LARGURA / 2, meio(areaCampo), this.rascunho.nome || "_", {
      tamanho: 16,
      cor: 0x2c2440,
      ancora: 0.5,
      ancoraY: 0.5,
    });
    this.grupo.add(campo);
    const dica = texto(
      this,
      LARGURA / 2,
      meio(areaDica),
      "digite no teclado, ou toque aqui para sortear",
      { cor: 0x4a3e64, ancora: 0.5, ancoraY: 0.5 }
    ).setInteractive({ useHandCursor: true });
    this.grupo.add(dica);
    interativo(dica);
    dica.on("pointerdown", () => {
      this.rascunho.nome = Phaser.Utils.Array.GetRandom(SORTEIO);
      campo.setText(this.rascunho.nome);
    });

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (PASSOS[this.passo] !== "Nome") return;
      if (e.key === "Backspace") this.rascunho.nome = this.rascunho.nome.slice(0, -1);
      else if (e.key === "Enter") {
        this.irPara(this.passo + 1);
        return;
      } else if (e.key.length === 1 && this.rascunho.nome.length < 20) {
        this.rascunho.nome += e.key;
      }
      campo.setText(this.rascunho.nome || "_");
    });
    this.navegacao();
  }

  // ------------------------------------------------- povo, classe, poder
  /** Um passo de escolha unica: pergunta em cima, boneco no meio, grade no pe. */
  private passoEscolha(
    pergunta: string,
    itens: string[],
    selecionado: number,
    aoEscolher: (i: number) => void
  ) {
    const corpo = this.corpo(pergunta);
    const sobra = this.grade(corpo, itens, selecionado, aoEscolher);
    this.palcoComBoneco(sobra);
    this.navegacao();
  }

  // ------------------------------------------------------------ poder
  /** O passo 4 do manual: a raca deu +1, a classe deu +1, e agora ele coloca o
   *  terceiro onde quiser.
   *
   *  O botao mostra o total que o poder VAI ficar, nao o "+1" abstrato: para uma
   *  crianca de 7 anos, "ESPERTEZA 3" diz mais do que "+1 em esperteza".
   *
   *  Sem linha explicando para que serve cada poder: o "para que serve" mora na
   *  ficha, que se mede antes de desenhar. */
  private passoPoder() {
    const origem = poderesDaOrigem(this.rascunho.raca, this.rascunho.classe);
    const escolhido = poderEscolhidoDoHeroi(this.rascunho);

    this.passoEscolha(
      "Onde ele e mais forte?",
      ORDEM_PODERES.map((id) => `${ATRIBUTOS[id].nome} ${origem[id] + (id === escolhido ? 1 : 0)}`),
      ORDEM_PODERES.indexOf(escolhido),
      (k) => {
        this.rascunho.poderEscolhido = ORDEM_PODERES[k];
        // o numero de todos os botoes muda junto com a escolha, entao a grade
        // inteira se redesenha em vez de so trocar a marca do selecionado
        this.desenharPasso();
      }
    );
  }

  // -------------------------------------------------------- aparencia
  private passoAparencia() {
    const corpo = this.corpo("Como ele e?");

    const linhas: LinhaAparencia[] = [
      {
        // na Cria de Dragao isto nao e pele, e escama, e o nome muda junto
        rotulo: RACAS_SPRITE[this.rascunho.raca]?.tons[0]?.startsWith("Escama") ? "ESCAMA" : "PELE",
        valor: tonsDaRaca(this.rascunho.raca)[this.rascunho.tomPele]?.nome ?? "Clara",
        opcoes: tonsDaRaca(this.rascunho.raca).map((t) => t.nome),
        mudar: (d) => {
          const tons = tonsDaRaca(this.rascunho.raca);
          this.rascunho.tomPele = this.ciclar(tons, this.rascunho.tomPele, d);
        },
      },
      {
        rotulo: "CABELO",
        valor: CABELOS_ESTILO.find((c) => c.id === this.rascunho.estiloCabelo)?.nome ?? "Curto",
        opcoes: CABELOS_ESTILO.map((c) => c.nome),
        mudar: (d) => {
          const i = CABELOS_ESTILO.findIndex((c) => c.id === this.rascunho.estiloCabelo);
          this.rascunho.estiloCabelo =
            CABELOS_ESTILO[this.ciclar(CABELOS_ESTILO, Math.max(0, i), d)].id;
        },
      },
      {
        rotulo: "COR DO CABELO",
        valor: CABELOS.find((c) => c.cor === this.rascunho.corCabelo)?.nome ?? "Verde folha",
        opcoes: CABELOS.map((c) => c.nome),
        mudar: (d) => {
          const i = CABELOS.findIndex((c) => c.cor === this.rascunho.corCabelo);
          this.rascunho.corCabelo = CABELOS[this.ciclar(CABELOS, Math.max(0, i), d)].cor;
        },
      },
      {
        rotulo: "ROUPA",
        valor: ROUPAS_ESTILO.find((r) => r.id === this.rascunho.estiloRoupa)?.nome ?? "Tunica",
        opcoes: ROUPAS_ESTILO.map((r) => r.nome),
        mudar: (d) => {
          const i = ROUPAS_ESTILO.findIndex((r) => r.id === this.rascunho.estiloRoupa);
          this.rascunho.estiloRoupa = ROUPAS_ESTILO[this.ciclar(ROUPAS_ESTILO, Math.max(0, i), d)].id;
        },
      },
      {
        rotulo: "COR DA ROUPA",
        valor: ROUPAS.find((r) => r.cor === this.rascunho.corRoupa)?.nome ?? "Verde mata",
        opcoes: ROUPAS.map((r) => r.nome),
        mudar: (d) => {
          const i = ROUPAS.findIndex((r) => r.cor === this.rascunho.corRoupa);
          this.rascunho.corRoupa = ROUPAS[this.ciclar(ROUPAS, Math.max(0, i), d)].cor;
        },
      },
      {
        rotulo: "CHAPEU",
        valor: CHAPEUS.find((c) => c.id === this.rascunho.chapeu)?.nome ?? "Sem chapeu",
        opcoes: CHAPEUS.map((c) => c.nome),
        mudar: (d) => {
          const i = CHAPEUS.findIndex((c) => c.id === this.rascunho.chapeu);
          this.rascunho.chapeu = CHAPEUS[this.ciclar(CHAPEUS, Math.max(0, i), d)].id;
        },
      },
    ];

    // a lista pede a largura de que precisa e o boneco fica com o resto, nunca
    // menos do que um quadro dele. Em 256 px sobra pouco, e um boneco pequeno e
    // melhor do que um nome de roupa cortado
    const medida = this.larguraDosSeletores(linhas);
    const larguraLista = Math.min(
      medida.total,
      corpo.largura - ESPACO.md - LARGURA_PERSONAGEM
    );
    const [areaBoneco, areaLista] = colunas(corpo, [
      corpo.largura - ESPACO.md - larguraLista,
      larguraLista,
    ]);

    this.palcoComBoneco(areaBoneco);

    // a linha em si nao encolhe: 16 px e o minimo que o dedo de uma crianca
    // acerta (TAMANHO.alvoMinimo). Quem cede e o vao entre elas, ate ESPACO.xs,
    // e e isso que faz as seis caberem no corpo da tela de 256x160
    const vaos = linhas.length - 1;
    const gap = Math.max(
      ESPACO.xs,
      Math.min(
        ESPACO.sm,
        Math.floor((areaLista.altura - linhas.length * TAMANHO.botaoPequeno) / vaos)
      )
    );
    const alturaLista = linhas.length * TAMANHO.botaoPequeno + vaos * gap;
    const p = pilha(areaLista, gap);
    p.pular(Math.max(0, Math.floor((areaLista.altura - alturaLista) / 2)));
    linhas.forEach((linha) => {
      const r = p.reservar(TAMANHO.botaoPequeno);
      this.seletor(r, medida.rotulo, {
        ...linha,
        mudar: (d) => {
          linha.mudar(d);
          this.desenharPasso();
        },
      });
    });

    // o preview de equipamento que o Hugo pediu: ve o heroi com e sem
    this.navegacao(undefined, {
      rotulo: this.comEquipamento ? "SEM EQUIPAMENTO" : "COM EQUIPAMENTO",
      aoTocar: () => {
        this.comEquipamento = !this.comEquipamento;
        this.desenharPasso();
      },
    });
  }

  // ----------------------------------------------------------- pronto
  private passoPronto() {
    if (!this.rascunho.nome) this.rascunho.nome = "Heroi";
    const classe = CLASSES.find((c) => c.id === this.rascunho.classe)!;
    const raca = RACAS.find((r) => r.id === this.rascunho.raca)!;
    if (!this.rascunho.magias.length) this.rascunho.magias = [...classe.magias];

    const corpo = this.corpo(this.rascunho.nome.toUpperCase());
    const [areaBoneco, areaTexto] = colunas(corpo, [1, 2]);
    this.palcoComBoneco(areaBoneco, false);

    this.ficha(areaTexto, [
      `${raca.nome}`,
      `${classe.nome}`,
      `Dom: ${raca.dom}`,
      classe.magias.length
        ? `Magias: ${classe.magias.map((m) => acharMagia(m)?.nome ?? m).join(", ")}`
        : `Habilidade: ${classe.habilidade}`,
    ]);

    this.navegacao({
      rotulo: "COMECAR A AVENTURA",
      largura: 168,
      aoTocar: () => {
        novoJogo(this.espaco, this.rascunho);
        this.scene.start("Mundo");
      },
    });
  }

  /** As quatro linhas do resumo, cada uma medida antes de ser encaixada.
   *
   *  Nome de povo e de classe sao os dois nomes que ele quer ver, entao vao em
   *  16 px. Mas "Pequenino do Trigo" em 16 px nao cabe na coluna de 256 px: ali
   *  ele quebrava em duas linhas dentro de uma reserva de uma so, e a linha de
   *  baixo escrevia por cima. Se o conjunto nao couber, os dois caem para 8. */
  private ficha(area: Retangulo, linhas: string[]) {
    const montar = (grande: boolean) =>
      linhas.map((linha, i) =>
        texto(this, 0, 0, linha, {
          tamanho: i < 2 && grande ? 16 : 8,
          cor: i < 2 ? 0x2c2440 : 0x4a3e64,
          larguraMax: area.largura,
          entrelinha: 2,
        })
      );
    const alturaTotal = (ts: Phaser.GameObjects.BitmapText[]) =>
      ts.reduce((soma, t) => soma + t.height, 0) + (ts.length - 1) * ESPACO.sm;

    let textos = montar(true);
    if (alturaTotal(textos) > area.altura) {
      textos.forEach((t) => t.destroy());
      textos = montar(false);
    }

    // centrado na coluna, para bater com o boneco do lado: em 240 de altura o
    // resumo e curto e ficava pendurado no topo, com meia tela vazia embaixo
    const p = pilha(area, ESPACO.sm);
    p.pular(Math.max(0, Math.floor((area.altura - alturaTotal(textos)) / 2)));
    textos.forEach((t) => {
      const r = p.reservar(t.height);
      t.setPosition(r.x, r.y);
      this.grupo.add(t);
    });
  }
}
