/** O modo DEPURADOR: teletransporte, trocar raca/classe, dar/equipar item,
 *  ajustar moedas/coracao/selo, pular relogio e fome/sono -- pra testar
 *  qualquer parte do jogo sem jogar a campanha inteira de novo.
 *
 * So existe pra quem destravou o gesto escondido (3 toques no cristal da
 * Titulo, ver `sistemas/depurador-acesso.ts`). Uma vez destravado, a cena
 * sobe sozinha junto com o Mundo (`Mundo.ts::create()`) e fica viva o jogo
 * inteiro — nunca pausa o Mundo, porque o ponto e ver o efeito de cada
 * botao ACONTECER na hora, sem fechar nada pra olhar. Comeca minimizada
 * (so um selo pequeno, sempre visivel, num canto que a Interface nao usa) e
 * so cresce pra o painel cheio quando alguem toca nele — pedido do Hugo
 * depois de testar a primeira versao (uma janela que so abria via Pausa e
 * pausava o mundo) e sentir que queria ver as mudancas acontecerem ao
 * vivo, com o jogo andando por tras.
 *
 * Fala com Mundo do mesmo jeito que Interface fala: eventos na propria
 * cena (`this.events.emit`), nunca uma chamada direta — ver os listeners
 * `depurador.on(...)` em `Mundo.ts::ligarEventosDoDepurador`.
 *
 * Cada aba usa steppers compactos (`< valor >` + um botao de acao) em vez de
 * uma lista de botao por item: a visao mais distante do jogo so tem ~240px
 * de altura util, e uma lista de 10 mapas ou 5 racas nao caberia numa
 * coluna de botoes. Mesmo espirito do seletor pele/cabelo/roupa que
 * `Criacao.ts` ja usa, so que aqui dispara um evento em vez de mudar um
 * estado local de preview. */
import Phaser from "phaser";
import { LARGURA, SPRITE_DA_ARMA } from "../dados/config";
import { RACAS, CLASSES, LOJA, acharArma } from "../dados/conteudo";
import { MAPAS } from "../dados/mapas";
import { PERIODOS } from "../dados/tempo";
import { LIMIAR_ALERTA, LIMIAR_CRITICO } from "../sistemas/moodles";
import { estado } from "../sistemas/estado";
import { Aba, janela } from "../sistemas/janela";
import { botao } from "../sistemas/botao";
import { texto } from "../sistemas/texto";
import { ESPACO, TAMANHO, meio, pilha, Retangulo } from "../sistemas/design";
import { refazerAoRedimensionar } from "../sistemas/visao";
import { tocar } from "../sistemas/som";

/** o selo minimizado: um quadrado pequeno, canto superior direito, logo
 *  abaixo da engrenagem de pausa que Interface ja desenha ali (2..18 de
 *  altura) -- y=24 fica livre em qualquer resolucao suportada (a menor,
 *  160 de altura, ainda sobra mais de 100px ate o rodape). LARGURA e `let`
 *  (muda com a visao/resize), entao a posicao so pode ser calculada na
 *  hora de desenhar, nunca guardada num const de modulo (isso capturaria
 *  o valor de quando o arquivo carregou, nunca mais atualizado). */
const SELO = 16;
// 36, nao 24: a engrenagem de pausa que Interface.ts desenha ali do lado
// (montarBotaoPausa) tem zona de toque de 26x20 centrada em y=8 -- ou
// seja, ate y=18. Um selo em y=24 (zona ate y=32) ainda encostava nessa
// borda (achado ao vivo: o clique caia numa terra de ninguem entre os
// dois, sem acertar nenhum). y=36 deixa uma folga de verdade.
const SELO_Y = 36;

const SETA = TAMANHO.botaoPequeno;

const ABAS: Aba[] = [
  { rotulo: "TELETRANSPORTE" },
  { rotulo: "PERSONAGEM" },
  { rotulo: "ITENS" },
  { rotulo: "MUNDO" },
];

const MAPA_IDS = Object.keys(MAPAS);

export class Depurador extends Phaser.Scene {
  private aba = 0;
  /** comeca minimizado sempre: `Mundo.ts` sobe esta cena junto com o jogo
   *  inteiro (nao so quando alguem pede), entao o padrao tem que ser
   *  discreto. Only cresce quando o proprio jogador toca no selo. */
  private minimizado = true;
  private indiceMapa = 0;
  private indiceRaca = 0;
  private indiceClasse = 0;
  private indiceArma = 0;
  private indiceItem = 0;
  private indicePeriodo = 0;

  constructor() {
    super("Depurador");
  }

  create() {
    this.aba = 0;
    this.minimizado = true;
    this.desenhar();
    this.input.keyboard?.removeAllListeners("keydown");
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (this.minimizado) return;
      if (e.key === "Escape") this.minimizar();
      if (e.key === "ArrowLeft") this.irPara(this.aba - 1);
      if (e.key === "ArrowRight") this.irPara(this.aba + 1);
    });
    refazerAoRedimensionar(this, () => this.desenhar());
  }

  /** Chamado de fora (`Mundo.ts`, antes de abrir `EscolhaDeSelo`) quando o
   *  painel cheio precisa sumir da tela sem perder o estado: nunca
   *  `scene.stop()` -- esta cena e pra ficar viva o jogo inteiro. */
  minimizar() {
    if (this.minimizado) return;
    tocar("pausa-fecha");
    this.minimizado = true;
    this.desenhar();
  }

  private expandir() {
    tocar("pausa-abre");
    this.minimizado = false;
    this.desenhar();
  }

  private irPara(indice: number) {
    this.aba = (indice + ABAS.length) % ABAS.length;
    this.desenhar();
  }

  private emitir(evento: string, dados?: Record<string, unknown>) {
    tocar("menu-confirma");
    // emite na PROPRIA cena (mesmo padrao de Interface->Mundo): quem ouve e
    // Mundo.ts, via `this.scene.get("Depurador").events.on(...)`.
    this.events.emit(evento, dados);
    // varios eventos mudam algo que esta linha mostra (moedas, coracoes,
    // relogio...) — redesenhar na hora poupa o toque de "atualizar"
    this.desenhar();
  }

  private desenhar() {
    this.children.removeAll(true);
    if (this.minimizado) {
      this.desenharSelo();
      return;
    }
    // 5 linhas de altura TAMANHO.botao (stepper + acao, por par) + espacos:
    // cada aba pede o mesmo teto generoso e deixa pilha() cortar se faltar
    const alturaConteudo = 5 * TAMANHO.botao + 4 * ESPACO.md;
    const area = janela(this, {
      alturaConteudo,
      aoFechar: () => this.minimizar(),
      abas: { itens: ABAS, ativa: this.aba, aoEscolher: (i) => this.irPara(i) },
    });
    const p = pilha(area, ESPACO.md);
    if (this.aba === 0) this.desenharTeletransporte(p);
    else if (this.aba === 1) this.desenharPersonagem(p);
    else if (this.aba === 2) this.desenharItens(p);
    else this.desenharMundo(p);
  }

  /** O selo: sempre visivel, nunca escondido atras de Pausa -- e assim que
   *  "sempre ligado, cresce quando eu quiser" funciona de verdade. Canto
   *  livre da HUD (ver a constante SELO no topo do arquivo). */
  private desenharSelo() {
    const x = LARGURA - 10;
    botao(this, x, SELO_Y, SELO, SELO, "D", () => this.expandir(), "painel-ouro");
  }

  // -------------------------------------------------------------- stepper
  /** uma linha compacta: ROTULO  < valor >  — mesmo padrao visual do
   *  seletor de pele/cabelo/roupa de `Criacao.ts`, so que aqui dispara
   *  `aoMudar(passo)` em vez de mexer num estado de preview local. */
  private stepper(area: Retangulo, rotulo: string, valor: string, aoMudar: (passo: number) => void) {
    const centro = meio(area);
    texto(this, area.x, centro, rotulo, { cor: 0x4a3e64, ancoraY: 0.5 });
    const direita = area.x + area.largura;
    botao(this, direita - SETA / 2, centro, SETA, area.altura, ">", () => aoMudar(1), "painel-creme");
    const xValor = direita - SETA - ESPACO.xs;
    texto(this, xValor, centro, valor, { cor: 0x2c2440, ancora: 1, ancoraY: 0.5 });
    botao(
      this,
      xValor - medirValorReservado(valor) - SETA / 2 - ESPACO.xs,
      centro,
      SETA,
      area.altura,
      "<",
      () => aoMudar(-1),
      "painel-creme"
    );
  }

  private ciclar(tamanho: number, atual: number, passo: number): number {
    return (atual + passo + tamanho) % tamanho;
  }

  private botaoAcao(area: Retangulo, rotulo: string, aoTocar: () => void, destaque = false) {
    const largura = Math.min(area.largura, 120);
    botao(this, area.x + area.largura / 2, meio(area), largura, area.altura, rotulo, aoTocar, destaque ? "painel-ouro" : "painel-creme");
  }

  private linhaDeDoisBotoes(area: Retangulo, esquerda: { rotulo: string; acao: () => void }, direita: { rotulo: string; acao: () => void }) {
    const largura = Math.floor((area.largura - ESPACO.sm) / 2);
    botao(this, area.x + largura / 2, meio(area), largura, area.altura, esquerda.rotulo, esquerda.acao, "painel-creme");
    botao(this, area.x + largura + ESPACO.sm + largura / 2, meio(area), largura, area.altura, direita.rotulo, direita.acao, "painel-creme");
  }

  // ------------------------------------------------------ teletransporte
  private desenharTeletransporte(p: ReturnType<typeof pilha>) {
    const mapaId = MAPA_IDS[this.indiceMapa];
    this.stepper(p.reservar(TAMANHO.botao), "MAPA", MAPAS[mapaId].lugar, (passo) => {
      this.indiceMapa = this.ciclar(MAPA_IDS.length, this.indiceMapa, passo);
      this.desenhar();
    });
    this.botaoAcao(p.reservar(TAMANHO.botao, ESPACO.lg), "IR", () => {
      this.emitir("depurar-teletransportar", { mapaId: MAPA_IDS[this.indiceMapa] });
    }, true);
  }

  // ---------------------------------------------------------- personagem
  private desenharPersonagem(p: ReturnType<typeof pilha>) {
    const st = estado();
    const raca = RACAS[this.indiceRaca];
    this.stepper(p.reservar(TAMANHO.botao), "RACA", raca.nome, (passo) => {
      this.indiceRaca = this.ciclar(RACAS.length, this.indiceRaca, passo);
      this.emitir("depurar-trocar-raca", { racaId: RACAS[this.indiceRaca].id });
    });
    const classe = CLASSES[this.indiceClasse];
    this.stepper(p.reservar(TAMANHO.botao, ESPACO.sm), "CLASSE", classe.nome, (passo) => {
      this.indiceClasse = this.ciclar(CLASSES.length, this.indiceClasse, passo);
      this.emitir("depurar-trocar-classe", { classeId: CLASSES[this.indiceClasse].id });
    });
    this.linhaDeDoisBotoes(
      p.reservar(TAMANHO.botao, ESPACO.sm),
      { rotulo: `CORACAO -1 (${st.coracoes}/${st.coracoesMax})`, acao: () => this.emitir("depurar-ajustar-coracoes", { delta: -1 }) },
      { rotulo: "ENCHER", acao: () => this.emitir("depurar-ajustar-coracoes", { encher: true }) }
    );
    this.linhaDeDoisBotoes(
      p.reservar(TAMANHO.botao, ESPACO.sm),
      { rotulo: `MOEDAS -10 (${st.moedas})`, acao: () => this.emitir("depurar-ajustar-moedas", { delta: -10 }) },
      { rotulo: "+10", acao: () => this.emitir("depurar-ajustar-moedas", { delta: 10 }) }
    );
    this.botaoAcao(p.reservar(TAMANHO.botao, ESPACO.sm), `GANHAR SELO (${st.selos})`, () => this.emitir("depurar-ganhar-selo"));
  }

  // --------------------------------------------------------------- itens
  private desenharItens(p: ReturnType<typeof pilha>) {
    const armaIds = Object.keys(SPRITE_DA_ARMA);
    const armaId = armaIds[this.indiceArma];
    this.stepper(p.reservar(TAMANHO.botao), "ARMA", acharArma(armaId)?.nome ?? armaId, (passo) => {
      this.indiceArma = this.ciclar(armaIds.length, this.indiceArma, passo);
      this.desenhar();
    });
    this.botaoAcao(p.reservar(TAMANHO.botao, ESPACO.sm), "EQUIPAR", () => {
      this.emitir("depurar-equipar-arma", { armaId: armaIds[this.indiceArma] });
    }, true);

    const item = LOJA[this.indiceItem];
    this.stepper(p.reservar(TAMANHO.botao, ESPACO.lg), "ITEM", item.nome, (passo) => {
      this.indiceItem = this.ciclar(LOJA.length, this.indiceItem, passo);
      this.desenhar();
    });
    this.linhaDeDoisBotoes(
      p.reservar(TAMANHO.botao, ESPACO.sm),
      { rotulo: "DAR 1", acao: () => this.emitir("depurar-dar-item", { itemId: item.id, quantidade: 1 }) },
      { rotulo: "DAR 5", acao: () => this.emitir("depurar-dar-item", { itemId: item.id, quantidade: 5 }) }
    );
  }

  // --------------------------------------------------------------- mundo
  private desenharMundo(p: ReturnType<typeof pilha>) {
    const st = estado();
    const periodo = PERIODOS[this.indicePeriodo];
    this.stepper(p.reservar(TAMANHO.botao), "RELOGIO", periodo.nome, (passo) => {
      this.indicePeriodo = this.ciclar(PERIODOS.length, this.indicePeriodo, passo);
      this.desenhar();
    });
    this.botaoAcao(p.reservar(TAMANHO.botao, ESPACO.sm), "IR PRO PERIODO", () => {
      this.emitir("depurar-ajustar-relogio", { minutos: PERIODOS[this.indicePeriodo].inicio });
    }, true);
    this.linhaDeTresBotoes(
      p.reservar(TAMANHO.botao, ESPACO.lg),
      { rotulo: `FOME (${Math.round(st.fome)})`, acao: () => this.emitir("depurar-ajustar-fome", { valor: 0 }) },
      { rotulo: `ALERTA`, acao: () => this.emitir("depurar-ajustar-fome", { valor: LIMIAR_ALERTA }) },
      { rotulo: `CRITICO`, acao: () => this.emitir("depurar-ajustar-fome", { valor: LIMIAR_CRITICO }) }
    );
    this.linhaDeTresBotoes(
      p.reservar(TAMANHO.botao, ESPACO.sm),
      { rotulo: `SONO (${Math.round(st.sono)})`, acao: () => this.emitir("depurar-ajustar-sono", { valor: 0 }) },
      { rotulo: `ALERTA`, acao: () => this.emitir("depurar-ajustar-sono", { valor: LIMIAR_ALERTA }) },
      { rotulo: `CRITICO`, acao: () => this.emitir("depurar-ajustar-sono", { valor: LIMIAR_CRITICO }) }
    );
  }

  private linhaDeTresBotoes(
    area: Retangulo,
    a: { rotulo: string; acao: () => void },
    b: { rotulo: string; acao: () => void },
    c: { rotulo: string; acao: () => void }
  ) {
    const largura = Math.floor((area.largura - ESPACO.sm * 2) / 3);
    [a, b, c].forEach((item, i) => {
      botao(
        this,
        area.x + i * (largura + ESPACO.sm) + largura / 2,
        meio(area),
        largura,
        area.altura,
        item.rotulo,
        item.acao,
        "painel-creme"
      );
    });
  }
}

/** Reserva uma largura estavel pro texto do valor, pra a seta esquerda nao
 *  pular de lugar a cada troca (o mesmo problema que `larguraDosSeletores`
 *  de Criacao.ts resolve medindo todas as opcoes de uma vez -- aqui, sem
 *  uma lista fixa de opcoes pra medir de antemao em toda aba, uma largura
 *  generosa fixa e suficiente: os rotulos deste modo nunca passam de
 *  "Fim de tarde" (a mais longa das 6). */
function medirValorReservado(_valor: string): number {
  return 72;
}
