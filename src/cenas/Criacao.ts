/** Criacao do personagem.
 *
 * Quatro passos: raca, classe, ponto forte, e o heroi (nome mais aparencia).
 *
 * A REGRA DESTA TELA: quem escolhe, ve o que esta escolhendo. Raca e classe nao
 * sao lista de nomes, sao o boneco daquela escolha, na maior escala que a tela
 * aguenta, com moldura de ouro. Antes eram cinco botoes de texto e um boneco
 * so, que nem trocava quando o dedo trocava a escolha: a crianca escolhia
 * "Anao da Fornalha" sem nunca ter visto um anao.
 *
 * Antes disso ainda, foram cinco bonecos lado a lado. Resolvia "ver antes de
 * escolher", mas em 16 px de largura cada, o que faz um Anao ser um Anao —
 * orelha, altura, barba — cabia no pixel e nao cabia no olho: cinco bonecos
 * espremidos leem como cinco manequins da mesma cor com roupa diferente. Um
 * boneco por vez, com setas dos lados, e o que deixa o traco da raca aparecer
 * antes do nome dela.
 *
 * A ficha embaixo da vitrine diz o que a escolha DA, e nao so o nome dela:
 * o +1 de poder, os coracoes, o dom. Escolher no escuro era o outro buraco.
 *
 * O nome mora no ultimo passo, junto da aparencia, porque nomear vem depois de
 * ver a cara do heroi. E nao ha mais tela de resumo no fim: o resumo era uma
 * parede de texto que repetia o que os passos ja tinham mostrado.
 *
 * NENHUM PASSO ESCREVE COORDENADA. A tela muda de tamanho com a visao escolhida
 * (256x160, 320x192 ou 400x240): o titulo desce do topo, o rodape sobe da base,
 * e o que sobra e o corpo. Dentro dele quem se mede primeiro e o texto, depois a
 * vitrine, e o boneco fica com o resto, na maior escala INTEIRA que couber.
 */
import Phaser from "phaser";
import { musica, tocar } from "../sistemas/som";
import {
  LARGURA,
  ALTURA,
  ALTURA_PERSONAGEM,
  LARGURA_PERSONAGEM,
  CABELOS,
  ROUPAS,
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
import { ATRIBUTOS, ORDEM_PODERES, acharMagia, RACAS, CLASSES } from "../dados/conteudo";
import { poderesDaOrigem, poderEscolhidoDoHeroi, poderesDoHeroi } from "../sistemas/poderes";
import { novoJogo, VAZIO, Heroi as FichaHeroi } from "../sistemas/estado";
import { botao, Botao } from "../sistemas/botao";
import { texto, medirTexto } from "../sistemas/texto";
import { ESPACO, TAMANHO, marcar, meio, pilha, colunas, quebrarMedido, Retangulo } from "../sistemas/design";
import { criarAnimacoes, Heroi } from "../sistemas/heroi";
import { refazerAoRedimensionar } from "../sistemas/visao";

const PASSOS = ["Raca", "Classe", "Poder", "Heroi"] as const;

const SORTEIO = ["Trovao da Floresta", "Vento Ligeiro", "Pedra Valente", "Faisca", "Lua Nova"];

/** A pergunta encosta no topo. E a unica altura fixa da tela: todo o resto se
 *  mede a partir do rodape dela. */
const TOPO = ESPACO.md;

/** Faixa de baixo, onde ficam VOLTAR e o botao que segue. */
const RODAPE = TAMANHO.botao + ESPACO.md;

/** Faixa clara no pe do palco, que le como chao. */
const CHAO = ESPACO.md;

/** Seta de um seletor. Quadrada, para o dedo acertar. */
const SETA = TAMANHO.botaoPequeno;

/** O boneco nao passa disto nem na tela mais alta: acima de 3 ele vira poster e
 *  come o espaco de quem escolhe. */
const ESCALA_MAX = 3;

/** Altura da faixa do nome. Nao e a do botao: o nome sai em corpo 16, e a linha
 *  de corpo 16 mede 20 px. Num campo de 16 o texto vazava por cima da borda. */
const CAMPO = TAMANHO.botao + ESPACO.md;

/** Quantas letras o nome aceita. Vinte cabiam no campo antigo e vazavam no novo,
 *  que divide a faixa com o botao de sortear. */
const LETRAS_DO_NOME = 16;

/** Um dos cinco bonecos da vitrine: quem ele e, e a ficha que o desenha. */
type Opcao = { nome: string; curto: string; ficha: FichaHeroi };

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
  private fundoBranco!: Phaser.GameObjects.Rectangle;
  /** o 0 e o boneco grande; do 1 em diante sao os da vitrine */
  private bonecos: Heroi[] = [];
  private rascunho: FichaHeroi = JSON.parse(JSON.stringify(VAZIO.heroi));
  private comEquipamento = false;

  constructor() {
    super("Criacao");
  }

  init(dados: { espaco?: number }) {
    this.espaco = dados?.espaco ?? 0;
    this.passo = 0;
    this.rascunho = JSON.parse(JSON.stringify(VAZIO.heroi));
    this.rascunho.nome = "";
    this.comEquipamento = false;
    this.bonecos = [];
  }

  create() {
    musica(this, "menu");
    // todas as combinacoes possiveis de camada precisam de animacao pronta
    criarAnimacoes(this, this.todasAsChaves());
    this.fundoBranco = this.add.rectangle(0, 0, LARGURA, ALTURA, 0xfff8ea).setOrigin(0);

    // tres camadas de profundidade, nesta ordem: os palcos atras, os bonecos em
    // cima deles, e o que se toca por cima de tudo. Sem separar, o palco
    // desenhado depois do boneco simplesmente o tapava
    this.fundo = this.add.container(0, 0).setDepth(1);
    this.grupo = this.add.container(0, 0).setDepth(10);
    this.desenharPasso();
    // troca de tamanho/orientacao no meio da criacao (giro de tablet, teclado
    // virtual abrindo ao digitar o nome) - desenharPasso() ja limpa e
    // remonta do zero a cada chamada, entao reusar e seguro aqui.
    refazerAoRedimensionar(this, () => {
      this.fundoBranco.setSize(LARGURA, ALTURA);
      this.desenharPasso();
    });
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

  // ------------------------------------------------------------- bonecos
  /** Os bonecos sao caros de montar (seis sprites cada) e vivem fora do grupo
   *  que se apaga a cada passo: sao criados uma vez e reaproveitados. */
  private pegarBoneco(indice: number): Heroi {
    if (!this.bonecos[indice]) {
      const h = new Heroi(this, -100, -100, this.rascunho);
      h.body.moves = false;
      h.setDepth(2);
      this.bonecos[indice] = h;
    }
    return this.bonecos[indice];
  }

  private mostrarBoneco(indice: number, ficha: FichaHeroi, x: number, base: number, escala: number) {
    const h = this.pegarBoneco(indice);
    h.setVisible(true).setPosition(x, base).setScale(escala);
    h.trocarAparencia(ficha);
    return h;
  }

  /** O boneco grande do ultimo passo mostra o heroi de verdade (roupa simples,
   *  sem arma) por padrao — e o jeito honesto de fechar a criacao, porque e
   *  assim que ele chega na vila. O botao COM ARMA e so um espiar: mostra por
   *  cima a armadura e a arma que a classe usa, a mesma pose da vitrine do
   *  passo "Classe", para quem quiser conferir de novo antes de comecar. Nao
   *  muda `this.rascunho`: `novoJogo()` sempre salva o heroi de verdade. */
  private fichaDoPreview(): FichaHeroi {
    if (this.comEquipamento) return { ...this.rascunho, ...this.equipamentoDaClasse(this.rascunho.classe) };
    return this.rascunho;
  }

  private limpar() {
    this.grupo.removeAll(true);
    this.fundo.removeAll(true);
    this.bonecos.forEach((b) => b.setVisible(false));
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
    return this.abaixoDe(TOPO + t.height + ESPACO.sm);
  }

  /** O corpo da tela a partir de uma altura ja ocupada no topo. */
  private abaixoDe(y: number): Retangulo {
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

  /** Largura que um botao precisa para o rotulo caber com folga. Medida na
   *  fonte de verdade: rotulo curto ganhava botao de 168 px so porque o numero
   *  estava escrito na mao. */
  private larguraDoBotao(rotulo: string) {
    return Math.max(TAMANHO.alvoMinimo * 2, medirTexto(this, rotulo) + ESPACO.lg * 2);
  }

  /** O primeiro rotulo que cabe na largura. Serve para a tela estreita: o botao
   *  diz COMECAR A AVENTURA em 400 px e COMECAR em 256. */
  private rotuloQueCabe(opcoes: string[], largura: number) {
    return opcoes.find((o) => medirTexto(this, o) + ESPACO.md * 2 <= largura) ?? opcoes[opcoes.length - 1];
  }

  /** Rodape da tela: VOLTAR na esquerda, o que segue na direita, e no meio o que
   *  o passo precisar. O botao do meio recebe so o vao entre os outros dois. */
  private navegacao(
    seguir?: { rotulos: string[]; aoTocar: () => void },
    meioDaFaixa?: { rotulo: string; aoTocar: () => void }
  ) {
    const faixa = this.faixaDoRodape();
    const y = meio(faixa);
    const larguraVoltar = this.larguraDoBotao("< VOLTAR");

    // no primeiro passo o VOLTAR sai da criacao inteira: sem ele a unica saida
    // era recarregar a pagina
    this.grupo.add(
      botao(
        this,
        faixa.x + larguraVoltar / 2,
        y,
        larguraVoltar,
        TAMANHO.botao,
        "< VOLTAR",
        () => (this.passo > 0 ? this.irPara(this.passo - 1) : this.scene.start("Titulo")),
        "painel-creme",
        "menu-volta"
      )
    );

    const proximo = seguir ?? { rotulos: ["SEGUIR >"], aoTocar: () => this.irPara(this.passo + 1) };
    const sobra = faixa.largura - larguraVoltar - ESPACO.sm * 2;
    const rotuloProximo = this.rotuloQueCabe(proximo.rotulos, meioDaFaixa ? sobra * 0.6 : sobra);
    const larguraProximo = Math.min(this.larguraDoBotao(rotuloProximo), sobra);

    if (meioDaFaixa) {
      const esquerda = faixa.x + larguraVoltar + ESPACO.sm;
      const direita = faixa.x + faixa.largura - larguraProximo - ESPACO.sm;
      const largura = Math.min(this.larguraDoBotao(meioDaFaixa.rotulo), direita - esquerda);
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
        faixa.x + faixa.largura - larguraProximo / 2,
        y,
        larguraProximo,
        TAMANHO.botao,
        rotuloProximo,
        proximo.aoTocar,
        "painel-ouro"
      )
    );
  }

  private irPara(passo: number) {
    this.passo = Math.max(0, Math.min(passo, PASSOS.length - 1));
    this.desenharPasso();
  }

  // ------------------------------------------------------------ vitrine
  /** Os cinco bonecos lado a lado, com o nome embaixo e moldura de ouro no
   *  escolhido.
   *
   *  A conta e sempre a mesma: o rotulo pede a altura dele, e a moldura fica com
   *  o resto. A escala do boneco e a maior INTEIRA que cabe na moldura, porque
   *  escala quebrada borra pixel art. Em 400x240 dao bonecos de 3x; em 256x160,
   *  de 1x, e um boneco pequeno e melhor do que um nome cortado. */
  /** Um boneco por vez, bem grande, com setas dos dois lados.
   *
   *  Eram cinco lado a lado antes disso. A 16 px de largura cada, a diferenca
   *  entre um Anao e um Elfo — orelha, altura, barba — cabia no pixel mas nao
   *  cabia no olho: cinco bonecos espremidos leem como cinco manequins da
   *  mesma cor. Um boneco so, na maior escala que a tela aguenta, e o que
   *  deixa o traco da raca aparecer antes do nome dela.
   *
   *  A moldura de ouro fica sempre em volta do boneco: so existe UM mostrado,
   *  entao ele e sempre "o escolhido". As setas trocam qual e, do mesmo jeito
   *  que as setas de PELE e CABELO trocam na tela de aparencia — a mesma
   *  gramatica de toque em todo o fluxo. */
  private vitrine(area: Retangulo, opcoes: Opcao[], selecionado: number, aoEscolher: (i: number) => void) {
    const n = opcoes.length;
    const opcao = opcoes[selecionado];
    const larguraCarta = Math.min(area.largura - (SETA + ESPACO.xs) * 2, area.largura * 0.7);

    // o nome inteiro so entra se cada palavra dele couber: "Cacador de Dragao"
    // quebra em duas, "Pequenino" sozinho as vezes nao cabe em 256 px
    const rotulo = opcao.nome.split(" ").every((palavra) => medirTexto(this, palavra) <= larguraCarta)
      ? opcao.nome
      : opcao.curto;
    const textoRotulo = texto(this, 0, 0, rotulo, {
      cor: 0x2c2440,
      ancora: 0.5,
      ancoraY: 0.5,
      larguraMax: larguraCarta,
      alinhamento: 1,
    });
    // FIXA, nao medida do texto de verdade. "Elfo da Folha" cabe numa linha,
    // "Pequenino do Trigo" as vezes quebra em duas -- medir a altura real
    // fazia a moldura encolher e crescer a cada troca de raca, porque ela e
    // definida por "o que sobra depois do rotulo". Reservando sempre o pior
    // caso (duas linhas), a caixa do heroi nao muda de tamanho nunca, e o
    // rotulo so centraliza dentro do espaco que ja estava reservado.
    const alturaRotulo = TAMANHO.linhaTexto * 2 + ESPACO.xs;

    const moldura = area.altura - alturaRotulo - ESPACO.xs;
    const escala = Math.max(
      1,
      Math.min(
        ESCALA_MAX,
        Math.floor((moldura - CHAO - ESPACO.sm) / ALTURA_PERSONAGEM),
        Math.floor((larguraCarta - ESPACO.sm) / LARGURA_PERSONAGEM)
      )
    );

    const cx = Math.round(area.x + area.largura / 2);

    this.fundo.add(
      marcar(
        this.add
          .nineslice(cx, area.y - 2, "painel-ouro", undefined, larguraCarta + 4, moldura + 4, 8, 8, 8, 8)
          .setOrigin(0.5, 0),
        "fundo"
      )
    );
    this.fundo.add(
      marcar(
        this.add
          .nineslice(cx, area.y, "painel-escuro", undefined, larguraCarta, moldura, 8, 8, 8, 8)
          .setOrigin(0.5, 0),
        "fundo"
      )
    );
    this.fundo.add(
      marcar(
        this.add
          .rectangle(cx, area.y + moldura - CHAO, larguraCarta - ESPACO.md, CHAO, 0x4a3e64)
          .setOrigin(0.5, 0),
        "fundo"
      )
    );

    this.mostrarBoneco(1, opcao.ficha, cx, area.y + moldura - CHAO, escala);

    const ir = (i: number) => {
      tocar("menu-confirma");
      aoEscolher((i + n) % n);
    };
    this.grupo.add(
      marcar(
        botao(this, area.x + SETA / 2, area.y + moldura / 2, SETA, moldura, "<", () => ir(selecionado - 1), "painel-creme"),
        "botao",
        "vitrine-anterior"
      )
    );
    this.grupo.add(
      marcar(
        botao(
          this,
          area.x + area.largura - SETA / 2,
          area.y + moldura / 2,
          SETA,
          moldura,
          ">",
          () => ir(selecionado + 1),
          "painel-creme"
        ),
        "botao",
        "vitrine-proxima"
      )
    );

    // centralizado na FAIXA reservada, nao encostado no topo dela: um nome de
    // uma linha so fica no meio do espaco de duas, em vez de colado em cima
    textoRotulo.setPosition(cx, area.y + moldura + ESPACO.xs + alturaRotulo / 2);
    // marcado com o nome curto da opcao MOSTRADA agora: e como a auditoria
    // (ferramentas/auditar-ui.mjs) sabe se ja chegou em "Anao" ou se precisa
    // clicar em ">" de novo, ja que so existe um boneco por vez agora
    this.grupo.add(marcar(textoRotulo, "texto", opcao.curto));
  }

  // -------------------------------------------------------------- ficha
  /** O painel que explica a escolha: o que ela da, e o dom ou a habilidade.
   *
   *  Mede antes de desenhar. A altura vem das linhas ja quebradas, entao o
   *  painel cresce com o texto em vez de o texto vazar por baixo dele. */
  private linhasDaFicha(partes: string[], largura: number) {
    return partes.flatMap((p) => quebrarMedido(this, p, largura - TAMANHO.paddingPainel * 2));
  }

  private alturaDaFicha(linhas: string[]) {
    return linhas.length * TAMANHO.linhaTexto + TAMANHO.paddingPainel * 2;
  }

  private ficha(area: Retangulo, linhas: string[], destaque = 1) {
    this.grupo.add(
      marcar(
        this.add
          .nineslice(area.x, area.y, "painel-creme", undefined, area.largura, area.altura, 8, 8, 8, 8)
          .setOrigin(0),
        "painel",
        linhas[0]
      )
    );
    const p = pilha(
      {
        x: area.x + TAMANHO.paddingPainel,
        y: area.y + TAMANHO.paddingPainel,
        largura: area.largura - TAMANHO.paddingPainel * 2,
        altura: area.altura - TAMANHO.paddingPainel * 2,
      },
      0
    );
    linhas.forEach((linha, i) => {
      const r = p.reservar(TAMANHO.linhaTexto);
      this.grupo.add(
        texto(this, r.x + r.largura / 2, meio(r), linha, {
          cor: i < destaque ? 0x2c2440 : 0x4a3e64,
          ancora: 0.5,
          ancoraY: 0.5,
        })
      );
    });
  }

  // --------------------------------------------------------------- grade
  /** Grade de escolha unica, usada no ponto forte. Devolve a altura que ocupa
   *  para quem chama poder reservar antes de desenhar. */
  private alturaDaGrade(itens: string[], largura: number) {
    return this.medirGrade(itens, largura).altura;
  }

  private medirGrade(itens: string[], largura: number) {
    const maisLargo = Math.max(...itens.map((t) => medirTexto(this, t)));
    const vao = ESPACO.md;
    // ESPACO.xl de folga dentro do botao: e o que o auditor exige entre o
    // rotulo e a borda, e o que a crianca precisa para nao ler letra colada
    const cabe = (n: number) => (maisLargo + ESPACO.xl) * n + vao * (n - 1) <= largura;
    const porLinha = cabe(itens.length) ? itens.length : cabe(2) ? 2 : 1;
    const passo = TAMANHO.botao + ESPACO.sm;
    const linhas = Math.ceil(itens.length / porLinha);
    return {
      porLinha,
      vao,
      passo,
      larg: Math.floor((largura - vao * (porLinha - 1)) / porLinha),
      altura: linhas * passo - ESPACO.sm,
    };
  }

  private grade(area: Retangulo, itens: string[], selecionado: number, aoEscolher: (i: number) => void) {
    const m = this.medirGrade(itens, area.largura);
    const botoes: Botao[] = [];

    itens.forEach((rotulo, i) => {
      const col = i % m.porLinha;
      const lin = Math.floor(i / m.porLinha);
      const nesta = Math.min(m.porLinha, itens.length - lin * m.porLinha);
      const x = area.x + area.largura / 2 + (col - (nesta - 1) / 2) * (m.larg + m.vao);
      const y = area.y + lin * m.passo + TAMANHO.botao / 2;
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
  }

  // --------------------------------------------------------------- palco
  /** Palco do boneco grande: um retangulo escuro atras dele, com o chao mais
   *  claro.
   *
   *  Existe por um motivo de leitura, nao de enfeite. O personagem pode estar
   *  de qualquer cor, inclusive creme claro em cima de um fundo creme claro, e
   *  ai ele some. Com o palco, o fundo dele e sempre o mesmo e sempre escuro,
   *  entao toda combinacao de raca, roupa e chapeu aparece igual de bem. */
  private palcoComBoneco(area: Retangulo) {
    const escala = Math.min(
      ESCALA_MAX,
      Math.floor((area.altura - CHAO) / ALTURA_PERSONAGEM),
      Math.floor(area.largura / LARGURA_PERSONAGEM)
    );
    if (escala < 1) return;

    const altura = escala * ALTURA_PERSONAGEM + CHAO;
    const largura = Math.min(area.largura, escala * LARGURA_PERSONAGEM + ESPACO.xl * 2);
    const x = Math.round(area.x + area.largura / 2);
    const base = Math.round(area.y + (area.altura + altura) / 2);

    this.fundo.add(
      marcar(
        this.add
          .nineslice(x, base - altura, "painel-escuro", undefined, largura, altura, 8, 8, 8, 8)
          .setOrigin(0.5, 0),
        "palco"
      )
    );
    this.fundo.add(
      marcar(
        this.add.rectangle(x, base - CHAO, largura - ESPACO.lg, CHAO, 0x4a3e64).setOrigin(0.5, 0),
        "fundo"
      )
    );

    this.mostrarBoneco(0, this.fichaDoPreview(), x, base - CHAO, escala);
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
      Math.max(...linhas.flatMap((l) => l.opcoes.map((o) => medirTexto(this, o)))) + ESPACO.md * 2;
    return { rotulo, total: rotulo + (SETA + ESPACO.xs) * 2 + valor };
  }

  private ciclar<Tipo>(lista: Tipo[], atual: number, passo: number): number {
    return (atual + passo + lista.length) % lista.length;
  }

  // -------------------------------------------------------------- passos
  private desenharPasso() {
    this.limpar();

    switch (PASSOS[this.passo]) {
      case "Raca":
        this.passoRaca();
        break;
      case "Classe":
        this.passoClasse();
        break;
      case "Poder":
        this.passoPoder();
        break;
      case "Heroi":
        this.passoHeroi();
        break;
    }
  }

  // ------------------------------------------------- povo, classe, poder
  /** A vitrine e a ficha dividem o corpo: a ficha pede a altura do texto dela,
   *  a vitrine leva o resto. E o mesmo desenho nos dois primeiros passos. */
  private passoDeVitrine(
    pergunta: string,
    opcoes: Opcao[],
    selecionado: number,
    partesDaFicha: string[],
    aoEscolher: (i: number) => void
  ) {
    const corpo = this.corpo(pergunta);
    const linhas = this.linhasDaFicha(partesDaFicha, corpo.largura);
    const p = pilha(corpo, ESPACO.sm);
    const areaVitrine = p.reservar(corpo.altura - this.alturaDaFicha(linhas) - ESPACO.sm);
    const areaFicha = p.reservar(this.alturaDaFicha(linhas));

    this.vitrine(areaVitrine, opcoes, selecionado, aoEscolher);
    this.ficha(areaFicha, linhas);
    this.navegacao();
  }

  // ---------------------------------------------------------------- raca
  private passoRaca() {
    const atual = Math.max(0, RACAS.findIndex((r) => r.id === this.rascunho.raca));
    const raca = RACAS[atual];

    this.passoDeVitrine(
      "Escolha sua raca",
      RACAS.map((r) => ({
        nome: r.nome,
        curto: r.curto,
        // cada boneco da vitrine e o heroi de agora, so que daquela raca: e
        // assim que da para ver a diferenca de corpo entre elas
        ficha: { ...this.rascunho, raca: r.id, tomPele: 0 },
      })),
      atual,
      [
        `${raca.nome} · +1 ${ATRIBUTOS[raca.bonus[0]].nome} e +1 ${ATRIBUTOS[raca.bonus[1]].nome} · ${raca.coracoes} coracoes`,
        `${raca.dom}: ${raca.domTexto}`,
      ],
      (k) => {
        this.rascunho.raca = RACAS[k].id;
        // a lista de tons muda com a raca, entao um indice antigo pode apontar
        // para fora dela
        if (this.rascunho.tomPele >= tonsDaRaca(RACAS[k].id).length) this.rascunho.tomPele = 0;
        this.desenharPasso();
      }
    );
  }

  // -------------------------------------------------------------- classe
  private passoClasse() {
    const atual = Math.max(0, CLASSES.findIndex((c) => c.id === this.rascunho.classe));
    const classe = CLASSES[atual];
    const magias = classe.magias.map((m) => acharMagia(m)?.nome ?? m);

    this.passoDeVitrine(
      "Escolha sua classe",
      CLASSES.map((c) => ({
        nome: c.nome,
        curto: c.curto,
        ficha: { ...this.rascunho, ...this.equipamentoDaClasse(c.id) },
      })),
      atual,
      [
        `${classe.nome} · +1 ${ATRIBUTOS[classe.bonus].nome}`,
        `${classe.habilidade}: ${classe.habilidadeTexto}`,
        magias.length ? `Magias: ${magias.join(", ")}` : "",
      ].filter(Boolean),
      (k) => {
        const c = CLASSES[k];
        this.rascunho.classe = c.id;
        this.rascunho.magias = [...c.magias];
        this.desenharPasso();
      }
    );
  }

  /** So para a VITRINE: mostra a armadura e a arma da classe no boneco deste
   *  passo, para o jogador ver o que aquela classe usa. O heroi de verdade
   *  comeca de roupa simples e sem arma (`estado.ts`, `VAZIO.heroi`) em
   *  qualquer classe escolhida — a armadura do Cavaleiro e o cajado do Mago
   *  sao coisa que se acha ou se compra depois, nao um figurino de largada.
   *  Por isso este metodo nunca escreve em `this.rascunho`: so monta a ficha
   *  de mentira que a vitrine usa para desenhar o boneco. */
  private equipamentoDaClasse(id: string) {
    return {
      estiloRoupa: ROUPA_DA_CLASSE[id] ?? "tunica",
      armaSprite: ARMA_DA_CLASSE[id] ?? "nenhuma",
      chapeu: CHAPEU_DA_CLASSE[id] ?? "nenhum",
    };
  }

  // --------------------------------------------------------------- poder
  /** O passo 4 do manual: a raca deu +1, a classe deu +1, e agora ele coloca o
   *  terceiro onde quiser.
   *
   *  O botao mostra o total que o poder VAI ficar, nao o "+1" abstrato: para uma
   *  crianca de 7 anos, "ESPERTEZA 3" diz mais do que "+1 em esperteza". A ficha
   *  embaixo mostra de onde vieram os outros dois. */
  private passoPoder() {
    const origem = poderesDaOrigem(this.rascunho.raca, this.rascunho.classe);
    const escolhido = poderEscolhidoDoHeroi(this.rascunho);
    const raca = RACAS.find((r) => r.id === this.rascunho.raca)!;
    const classe = CLASSES.find((c) => c.id === this.rascunho.classe)!;
    const itens = ORDEM_PODERES.map(
      (id) => `${ATRIBUTOS[id].nome} ${origem[id] + (id === escolhido ? 1 : 0)}`
    );

    const corpo = this.corpo("Escolha seu ponto forte");
    const linhas = this.linhasDaFicha(
      [
        `${raca.curto} deu +1 ${ATRIBUTOS[raca.bonus[0]].nome} e +1 ${ATRIBUTOS[raca.bonus[1]].nome}, ${
          classe.curto
        } deu +1 ${ATRIBUTOS[classe.bonus].nome}.`,
        "O ultimo ponto e seu.",
      ],
      corpo.largura
    );
    const alturaGrade = this.alturaDaGrade(itens, corpo.largura);

    const p = pilha(corpo, ESPACO.sm);
    const areaBoneco = p.reservar(
      corpo.altura - alturaGrade - this.alturaDaFicha(linhas) - ESPACO.sm * 2
    );
    const areaGrade = p.reservar(alturaGrade);
    const areaFicha = p.reservar(this.alturaDaFicha(linhas));

    this.palcoComBoneco(areaBoneco);
    this.grade(areaGrade, itens, ORDEM_PODERES.indexOf(escolhido), (k) => {
      this.rascunho.poderEscolhido = ORDEM_PODERES[k];
      // o numero de todos os botoes muda junto com a escolha, entao a grade
      // inteira se redesenha em vez de so trocar a marca do selecionado
      this.desenharPasso();
    });
    this.ficha(areaFicha, linhas, 0);
    this.navegacao();
  }

  // --------------------------------------------------------------- heroi
  /** O ultimo passo: o nome no alto, o boneco de um lado, a aparencia do outro,
   *  e o botao que comeca o jogo. Era tela de resumo, e resumo ninguem le. */
  private passoHeroi() {
    const corpo = this.campoDeNome();
    const linhas = this.linhasDaAparencia();

    // a lista pede a largura de que precisa e o boneco fica com o resto, nunca
    // menos do que um quadro dele. Em 256 px sobra pouco, e um boneco pequeno e
    // melhor do que um nome de roupa cortado
    const medida = this.larguraDosSeletores(linhas);
    const larguraLista = Math.min(medida.total, corpo.largura - ESPACO.md - LARGURA_PERSONAGEM);
    const [areaEsquerda, areaLista] = colunas(corpo, [
      corpo.largura - ESPACO.md - larguraLista,
      larguraLista,
    ]);

    this.poderesEBoneco(areaEsquerda);

    // a linha em si nao encolhe: 16 px e o minimo que o dedo de uma crianca
    // acerta (TAMANHO.alvoMinimo). Quem cede e o vao entre elas, ate ESPACO.xs
    const vaos = linhas.length - 1;
    const vao = Math.max(
      ESPACO.xs,
      Math.min(
        ESPACO.sm,
        Math.floor((areaLista.altura - linhas.length * TAMANHO.botaoPequeno) / vaos)
      )
    );
    const alturaLista = linhas.length * TAMANHO.botaoPequeno + vaos * vao;
    const p = pilha(areaLista, vao);
    p.pular(Math.max(0, Math.floor((areaLista.altura - alturaLista) / 2)));
    linhas.forEach((linha) => {
      this.seletor(p.reservar(TAMANHO.botaoPequeno), medida.rotulo, {
        ...linha,
        mudar: (d) => {
          linha.mudar(d);
          this.desenharPasso();
        },
      });
    });

    this.navegacao(
      {
        rotulos: ["COMECAR A AVENTURA", "COMECAR"],
        aoTocar: () => {
          if (!this.rascunho.nome) this.rascunho.nome = Phaser.Utils.Array.GetRandom(SORTEIO);
          novoJogo(this.espaco, this.rascunho);
          this.scene.start("Mundo");
        },
      },
      // o preview de equipamento que o Hugo pediu: ve o heroi com e sem
      {
        rotulo: this.comEquipamento ? "SEM ARMA" : "COM ARMA",
        aoTocar: () => {
          this.comEquipamento = !this.comEquipamento;
          this.desenharPasso();
        },
      }
    );
  }

  /** O nome ocupa a faixa do titulo, e nao um passo so dele: o titulo desta tela
   *  E o nome do heroi. Ao lado, o botao que sorteia, que no iPad e o unico
   *  caminho: ali nao ha teclado para digitar. */
  private campoDeNome(): Retangulo {
    const faixa = { x: TAMANHO.paddingTela, y: TOPO, largura: LARGURA - TAMANHO.paddingTela * 2 };
    const larguraSortear = this.larguraDoBotao("SORTEAR");
    const larguraCampo = faixa.largura - larguraSortear - ESPACO.sm;

    this.grupo.add(
      marcar(
        this.add
          .nineslice(faixa.x, faixa.y, "painel-creme", undefined, larguraCampo, CAMPO, 8, 8, 8, 8)
          .setOrigin(0),
        "painel",
        "nome"
      )
    );

    // o nome sai em 16 px enquanto couber: e o nome dele, merece corpo grande.
    // Vazio, o campo explica o que fazer, em 8 px e cor apagada
    const vazio = !this.rascunho.nome;
    const conteudo = vazio ? "digite o nome, ou toque em sortear" : this.rascunho.nome;
    const cabeGrande = !vazio && medirTexto(this, conteudo, 16) <= larguraCampo - ESPACO.lg;
    const campo = texto(this, faixa.x + larguraCampo / 2, faixa.y + CAMPO / 2, conteudo, {
      tamanho: cabeGrande ? 16 : 8,
      cor: vazio ? 0x4a3e64 : 0x2c2440,
      ancora: 0.5,
      ancoraY: 0.5,
    });
    this.grupo.add(campo);

    this.grupo.add(
      botao(
        this,
        faixa.x + faixa.largura - larguraSortear / 2,
        faixa.y + CAMPO / 2,
        larguraSortear,
        TAMANHO.botao,
        "SORTEAR",
        () => {
          this.rascunho.nome = Phaser.Utils.Array.GetRandom(SORTEIO);
          this.desenharPasso();
        },
        "painel-creme"
      )
    );

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (PASSOS[this.passo] !== "Heroi") return;
      if (e.key === "Backspace") this.rascunho.nome = this.rascunho.nome.slice(0, -1);
      else if (e.key === "Enter") return;
      else if (e.key.length === 1 && this.rascunho.nome.length < LETRAS_DO_NOME) {
        this.rascunho.nome += e.key;
      } else return;
      this.desenharPasso();
    });

    return this.abaixoDe(faixa.y + CAMPO + ESPACO.sm);
  }

  /** A coluna da esquerda: o boneco grande e, se sobrar largura, os tres poderes
   *  escritos embaixo dele. Sao eles que o jogador levou dos tres passos
   *  anteriores, e e a ultima chance de conferir antes de comecar. */
  private poderesEBoneco(area: Retangulo) {
    const poderes = poderesDoHeroi(this.rascunho);
    const linhas = ORDEM_PODERES.map((id) => `${ATRIBUTOS[id].nome} ${poderes[id]}`);
    const cabe =
      Math.max(...linhas.map((l) => medirTexto(this, l))) <= area.largura &&
      area.altura - linhas.length * TAMANHO.linhaTexto >= ALTURA_PERSONAGEM + CHAO;

    if (!cabe) {
      this.palcoComBoneco(area);
      return;
    }

    const p = pilha(area, ESPACO.sm);
    this.palcoComBoneco(p.reservar(area.altura - linhas.length * TAMANHO.linhaTexto - ESPACO.sm));
    linhas.forEach((linha) => {
      const r = p.reservar(TAMANHO.linhaTexto, 0);
      this.grupo.add(
        texto(this, r.x + r.largura / 2, meio(r), linha, {
          cor: 0x2c2440,
          ancora: 0.5,
          ancoraY: 0.5,
        })
      );
    });
  }

  private linhasDaAparencia(): LinhaAparencia[] {
    return [
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
          this.rascunho.estiloRoupa =
            ROUPAS_ESTILO[this.ciclar(ROUPAS_ESTILO, Math.max(0, i), d)].id;
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
  }
}
