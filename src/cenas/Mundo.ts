/** O mundo jogavel. Monta o chao, os objetos, as pessoas e o heroi,
 *  e cuida de andar, esbarrar e conversar. */
import Phaser from "phaser";
import { TILE, SOLIDOS, COR } from "../dados/config";
import { MAPAS, VILA, montarChao, plantarMata, Mapa, Saida } from "../dados/mapas";
import { acharCriatura } from "../dados/conteudo";
import { DIALOGOS } from "../dados/dialogos";
import { estado, salvar, marcarVisitado, foiDerrotado } from "../sistemas/estado";
import type { Encontro } from "./Combate";
import { Controles } from "../sistemas/controles";
import { camadasDoHeroi, criarAnimacoes, Heroi } from "../sistemas/heroi";
import { COLCHAO, PONTOS } from "../dados/sons";
import {
  calarAmbiente, montarAmbiente, musica, ouvirDe, passo, soltarPassaros, tocar,
  type FonteDeSom,
} from "../sistemas/som";

type FichaObjeto = { w: number; h: number; cw: number; ch: number };
type Interagivel = { x: number; y: number; chave: string };
/** Um bicho plantado no mapa, com a chave estavel que o marca como derrotado
 *  em `estado()` e o corpo que precisa sumir junto quando ele perde a luta. */
type CriaturaViva = { sprite: Phaser.GameObjects.Sprite; corpo: Phaser.GameObjects.Rectangle; id: string; chave: string };

/** A quantas casas um goblin nota o heroi e o combate comeca. Mesma ideia do
 *  Provador (`docs/plano-do-combate.md`), numero proprio porque aqui e o
 *  mundo aberto quem decide, nao a arena. */
const DISTANCIA_DE_ENCONTRO = 3;

export class Mundo extends Phaser.Scene {
  private heroi!: Heroi;
  private controles!: Controles;
  private interagiveis: Interagivel[] = [];
  private conversando = false;
  private solidos!: Phaser.Physics.Arcade.StaticGroup;
  private chao!: Phaser.Tilemaps.TilemapLayer;
  private saidas: Saida[] = [];
  private trocandoDeMapa = false;
  private criaturas: CriaturaViva[] = [];

  /** De onde o heroi entra. Vazio quer dizer "a entrada de sempre do mapa";
   *  quem chega de outro lugar manda o tile pelo qual apareceu. */
  private entradaForcada?: { x: number; y: number };

  constructor() {
    super("Mundo");
  }

  init(dados?: { entrada?: { x: number; y: number } }) {
    this.entradaForcada = dados?.entrada;
  }

  create() {
    const st0 = estado();
    // Qual mapa carregar sai do estado, nao de um import fixo: e o que permite
    // o jogo ter mais de um lugar e voltar para onde o jogador parou.
    const mapaAtual: Mapa = MAPAS[st0.cena] ?? VILA;
    criarAnimacoes(this, [
      ...camadasDoHeroi(st0.heroi).map((c) => c.chave),
      ...mapaAtual.pessoas.map((p) => `npc-${p.sprite}`),
      // so as criaturas que este mapa realmente tem
      ...(mapaAtual.criaturas ?? []).map((b) => acharCriatura(b.id)?.sprite ?? b.id),
    ]);
    this.controles = new Controles(this);
    this.interagiveis = [];
    this.conversando = false;
    this.solidos = this.physics.add.staticGroup();

    const mapa: Mapa = mapaAtual;
    this.saidas = mapa.saidas ?? [];
    this.trocandoDeMapa = false;
    const fichas = this.cache.json.get("objetos") as Record<string, FichaObjeto>;

    // ---------------------------------------------------------- chao
    const chao = montarChao(mapa.chao);
    const tilemap = this.make.tilemap({ data: chao, tileWidth: TILE, tileHeight: TILE });
    const tiles = tilemap.addTilesetImage("tileset")!;
    const camada = tilemap.createLayer(0, tiles, 0, 0)!;
    camada.setCollision(SOLIDOS);
    camada.setDepth(-1000);
    this.chao = camada;

    // ------------------------------------------------------- objetos
    // Os objetos escritos a mao sao os marcos. A mata e o enfeite de chao vem
    // de plantarMata(), que le a letra T do desenho: sem isso a floresta teria
    // umas oitocentas arvores escritas na unha em mapas.ts.
    const pecas = [...mapa.objetos, ...plantarMata(mapa.chao, mapa.objetos)];
    pecas.forEach((peca) => {
      const ficha = fichas?.[peca.nome];
      if (!ficha) return;
      // ancorado pelo pe: a base do objeto encosta no tile indicado
      const x = peca.x * TILE + TILE / 2;
      const y = peca.y * TILE + TILE;
      const s = this.add.image(x, y, `obj-${peca.nome}`).setOrigin(0.5, 1);
      s.setDepth(y);
      if (peca.solido !== false && ficha.cw > 0) {
        const corpo = this.add.rectangle(x, y - ficha.ch / 2, ficha.cw, ficha.ch);
        this.solidos.add(corpo);
        (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      }
      if (DIALOGOS[peca.nome]) this.interagiveis.push({ x, y: y - 8, chave: peca.nome });
    });

    // --------------------------------------------------- som do lugar
    // Uma fonte de som e um objeto do mapa que ja existe, nao um marcador novo:
    // a fogueira que se ve e a fogueira que se ouve. Por isso a lista sai de
    // PONTOS cruzada com mapa.objetos, e nao de coordenada escrita a mao.
    const fontes: FonteDeSom[] = [];
    PONTOS.forEach((ponto) => {
      if (ponto.tile) {
        fontes.push({
          som: ponto.som,
          x: ponto.tile.x * TILE + TILE / 2,
          y: ponto.tile.y * TILE + TILE / 2,
          alcance: ponto.alcance * TILE,
        });
        return;
      }
      mapa.objetos
        .filter((peca) => peca.nome === ponto.objeto)
        .forEach((peca) =>
          fontes.push({
            som: ponto.som,
            x: peca.x * TILE + TILE / 2,
            y: peca.y * TILE + TILE,
            alcance: ponto.alcance * TILE,
          })
        );
    });
    montarAmbiente(COLCHAO.vila, fontes);
    soltarPassaros(this);
    musica(this, "vila");

    // ------------------------------------------------------- pessoas
    mapa.pessoas.forEach((pessoa) => {
      const x = pessoa.x * TILE + TILE / 2;
      const y = pessoa.y * TILE + TILE;
      const s = this.add.sprite(x, y, `npc-${pessoa.sprite}`, 0).setOrigin(0.5, 1);
      s.setDepth(y);
      s.play(`npc-${pessoa.sprite}-parado-baixo`, true);
      const corpo = this.add.rectangle(x, y - 4, 10, 8);
      this.solidos.add(corpo);
      (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      this.interagiveis.push({ x, y: y - 10, chave: pessoa.quem });
      // a respiracao agora e quadro de animacao, nao tween de escala
    });

    // ------------------------------------------------------ criaturas
    // Presenca, e so. Elas ficam paradas respirando no lugar; quem faz o
    // goblin brigar de verdade e `conferirEncontro()`, mais abaixo. As outras
    // (aranha, lobo de nevoa) ainda so decoram: o combate ainda so sabe lutar
    // contra goblin, ver `Combate.ts`.
    this.criaturas = [];
    (mapa.criaturas ?? []).forEach((bicho, i) => {
      const chave = `${st0.cena}:${i}`;
      if (foiDerrotado(chave)) return;
      const ficha = acharCriatura(bicho.id);
      if (!ficha) return;
      const x = bicho.x * TILE + TILE / 2;
      const y = bicho.y * TILE + TILE;
      const s = this.add.sprite(x, y, ficha.sprite, 0).setOrigin(0.5, 1);
      s.setDepth(y);
      s.play(`${ficha.sprite}-parado-baixo`, true);
      const corpo = this.add.rectangle(x, y - 4, 10, 8);
      this.solidos.add(corpo);
      (corpo.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      this.criaturas.push({ sprite: s, corpo, id: bicho.id, chave });
    });

    // --------------------------------------------------------- heroi
    const entrada = this.entradaForcada ?? mapa.entrada;
    this.heroi = new Heroi(
      this,
      entrada.x * TILE + TILE / 2,
      entrada.y * TILE + TILE,
      st0.heroi
    );
    this.physics.add.collider(this.heroi, camada);
    this.physics.add.collider(this.heroi, this.solidos);
    // o passo vem do chao, e quem sabe que chao e esse e o tilemap
    this.heroi.aoPassar(() => {
      const tile = this.chao.getTileAtWorldXY(this.heroi.x, this.heroi.y);
      passo(tile?.index ?? -1);
    });

    this.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.cameras.main.startFollow(this.heroi, true, 0.14, 0.14);
    this.cameras.main.setBackgroundColor(COR.tinta);
    // zoom sempre 1: quem muda a visao e a resolucao do canvas, ver sistemas/visao.ts.
    // com zoom fracionario a grade de pixels sai do lugar e o mapa pisca ao andar.
    this.cameras.main.setZoom(1);
    // quem chegou de outro mapa entrou com a tela apagada: acende de volta
    if (this.entradaForcada) this.cameras.main.fadeIn(220, 0, 0, 0);
    this.cameras.main.setRoundPixels(true);
    this.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.heroi.body.setCollideWorldBounds(true);

    this.scene.launch("Interface");
    this.scene.get("Interface").events.on("acao", () => this.tentarInteragir());
    this.scene.get("Interface").events.on("pausar", () => this.pausar());
    this.events.on("dialogo-fim", () => {
      this.conversando = false;
    });
    // volta do Combate: reacende a Interface e tira do mapa quem perdeu a
    // luta la dentro. `scene.resume` dispara este evento sozinho, o mesmo
    // que a Pausa ja usa para devolver o controle ao jogador.
    this.events.on("resume", () => {
      this.scene.setVisible(true, "Interface");
      this.scene.resume("Interface");
      this.criaturas = this.criaturas.filter((c) => {
        if (!foiDerrotado(c.chave)) return true;
        c.sprite.destroy();
        c.corpo.destroy();
        return false;
      });
    });
    // sair do mundo solta os loops. A musica sobrevive: menu e titulo sao o
    // mesmo lugar do ponto de vista de quem joga, e recomecar a faixa se ouve.
    this.events.once("shutdown", () => calarAmbiente());
  }

  pausar() {
    if (this.conversando) return;
    tocar("pausa-abre");
    this.heroi.mover(0, 0);
    this.scene.pause();
    this.scene.launch("Pausa");
  }

  private tentarInteragir() {
    if (this.conversando) return;
    const frente = this.heroi.frente();
    const alvo = this.interagiveis.find(
      (i) => Phaser.Math.Distance.Between(frente.x, frente.y, i.x, i.y) < 18
    );
    if (!alvo) return;
    const fala = DIALOGOS[alvo.chave];
    if (!fala) return;
    if (alvo.chave === "bau" && marcarVisitado("bau-vila")) {
      estado().moedas += 1;
      salvar();
      tocar("bau-abre");
      // a moeda vem depois da tampa, nao junto: dois sons no mesmo instante
      // viram um so, e o premio e justamente o segundo
      this.time.delayedCall(220, () => tocar("moeda"));
    }
    this.abrirFala(fala.quem, fala.linhas, alvo.chave);
  }

  private abrirFala(quem: string, linhas: string[], chave?: string) {
    this.conversando = true;
    this.heroi.mover(0, 0);
    // a chave viaja junto porque e ela, e nao o nome na chapinha, que a
    // tabela VOZ usa para achar a altura da voz do personagem
    this.scene.get("Interface").events.emit("falar", { quem, linhas, cena: this, chave });
  }

  update() {
    if (this.conversando) {
      this.heroi.mover(0, 0);
      return;
    }
    if (this.controles.acaoApertada()) this.tentarInteragir();
    if (this.controles.pausaApertada()) this.pausar();
    const d = this.controles.direcao();
    this.heroi.mover(d.x, d.y);
    this.heroi.atualizarProfundidade();
    ouvirDe(this.heroi.x, this.heroi.y);
    this.conferirSaida();
    this.conferirEncontro();
  }

  /** Chegou perto demais de um goblin? O mundo para e a luta comeca.
   *
   *  So goblin briga por enquanto: e a unica criatura que `Combate.ts` sabe
   *  colocar numa arena (retrato, folha de sprite parada-baixo). Aranha e
   *  lobo de nevoa continuam so decorando ate ganharem a mesma entrada. */
  private conferirEncontro() {
    if (this.conversando || this.trocandoDeMapa) return;
    const hx = Math.floor(this.heroi.x / TILE);
    const hy = Math.floor((this.heroi.y - 1) / TILE);
    const perto = this.criaturas.filter((c) => {
      if (c.id !== "goblin") return false;
      const cx = Math.floor(c.sprite.x / TILE);
      const cy = Math.floor((c.sprite.y - 1) / TILE);
      return Math.hypot(cx - hx, cy - hy) <= DISTANCIA_DE_ENCONTRO;
    });
    if (perto.length === 0) return;
    this.iniciarCombate(perto);
  }

  private iniciarCombate(alvos: CriaturaViva[]) {
    this.heroi.mover(0, 0);
    const encontro: Encontro = alvos.map((a) => ({ id: a.id, chave: a.chave }));
    this.scene.pause();
    this.scene.pause("Interface");
    this.scene.setVisible(false, "Interface");
    this.scene.launch("Combate", { encontro });
  }

  /** Encostou numa borda que leva a outro lugar? Entao troca de mapa.
   *
   *  A troca acontece com a tela esmaecendo, e nao de um quadro para o outro:
   *  corte seco em cima de uma tela cheia de arvore faz o jogador perder de
   *  vista o proprio heroi. */
  private conferirSaida() {
    if (this.trocandoDeMapa) return;
    const tx = Math.floor(this.heroi.x / TILE);
    const ty = Math.floor(this.heroi.y / TILE);
    const saida = this.saidas.find(
      (s) => tx >= s.x && tx < s.x + s.w && ty >= s.y && ty < s.y + s.h
    );
    if (!saida) return;
    const destino = MAPAS[saida.para];
    if (!destino) return;   // lugar ainda nao construido: a borda simplesmente nao leva a nada

    this.trocandoDeMapa = true;
    this.heroi.mover(0, 0);
    const st = estado();
    st.cena = saida.para;
    st.lugar = destino.lugar;
    salvar();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.restart({ entrada: saida.entrada });
    });
  }
}
