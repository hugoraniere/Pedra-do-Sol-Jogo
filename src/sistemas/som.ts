/** O som do jogo.
 *
 * Unico arquivo que fala com o audio do Phaser. O catalogo em dados/sons.ts diz
 * O QUE existe e em que volume; aqui esta COMO toca. Nenhuma cena chama
 * `this.sound` direto, do mesmo jeito que nenhuma cena escreve coordenada Y.
 *
 * TRES REDES CONTRA SOM QUEBRADO, porque som que falta nao aparece na tela.
 * Sprite faltando o jogador ve; som faltando so deixa um buraco que ninguem
 * nota ate alguem perguntar "nao era pra tocar alguma coisa aqui?".
 *
 *   1. TIPO. tocar() so aceita chave que existe em EFEITOS. Som pedido pelo
 *      jogo antes de entrar no catalogo nao compila: npm run build reprova.
 *   2. VERIFICADOR. npm run verificar cruza catalogo, disco e quem toca cada
 *      som. Ver ferramentas/verificar.mjs, secao 11.
 *   3. DOUTOR. Em jogo, som que nao carregou vira anotacao no painel do doutor,
 *      o unico console que existe no iPad. Reclama uma vez por som, nao por
 *      disparo, senao 60 linhas por segundo enterram o resto.
 *
 * NADA AQUI DERRUBA O JOGO. Som que falta e silencio, nunca excecao: o Lele nao
 * pode ficar preso numa tela porque um mp3 nao baixou no wifi.
 */
import Phaser from "phaser";
import {
  AJUSTES, ARMAS, CRIATURAS_SOM, COLCHAO, DADO, DESFECHO, EFEITOS, EXTENSAO,
  FRAQUEZA_SONORA, GOLPES_ESPECIAIS, IMPACTOS, MAGIAS_SOM, MUSICAS, PASSAROS,
  PASSO_DO_TILE, PASSO_PADRAO, PONTOS, VOZ, VOZ_PADRAO,
  type CadeiaDeArma, type ChaveEfeito, type ChaveMusica, type FichaSom,
} from "../dados/sons";
import { preferencias } from "./preferencias";
import { suspeitar } from "./doutor";

export type { ChaveEfeito };

let gerente: Phaser.Sound.BaseSoundManager | undefined;
/** loops vivos, pela etiqueta que os criou. Existe para poder desligar. */
const loops = new Map<string, Phaser.Sound.BaseSound>();
/** som que ja foi cobrado no doutor. Cobra uma vez, nao a cada disparo. */
const cobrados = new Set<string>();
let faixa: Phaser.Sound.BaseSound | undefined;
let nomeDaFaixa: ChaveMusica | undefined;
let abafamento = 1;

/* ---------------------------------------------------------------- carregar */

/** Todo arquivo do catalogo, menos musica. Chamado no preload do Boot. */
export function carregarSons(cena: Phaser.Scene) {
  cena.load.audio([...arquivosDoCatalogo()].map((n) => ({
    key: n,
    url: `assets/som/${n}${EXTENSAO}`,
  })));
}

/** Os nomes de arquivo que o jogo precisa ter em maos para jogar.
 *
 *  MUSICAS fica de fora de proposito: faixa inteira e pesada e travaria a barra
 *  de carregamento do Boot no iPad. Ela entra depois, com o jogo ja rodando. */
function arquivosDoCatalogo(): Set<string> {
  const nomes = new Set<string>();
  const por = (f?: FichaSom) => {
    if (f) nomes.add(f.arquivo);
  };
  Object.values(EFEITOS).forEach(por);
  // o satisfies deixa cada arma com a forma exata dela, e ai as opcionais somem
  // do tipo. Aqui a gente quer justamente varrer todas do mesmo jeito.
  Object.values(ARMAS as Record<string, CadeiaDeArma>).forEach((c) =>
    [c.preparo, c.golpe, c.voo, c.chegada].forEach(por)
  );
  Object.values(GOLPES_ESPECIAIS).forEach(por);
  Object.values(IMPACTOS).forEach(por);
  Object.values(DADO).forEach(por);
  Object.values(DESFECHO).forEach(por);
  Object.values(MAGIAS_SOM).forEach(por);
  Object.values(CRIATURAS_SOM).forEach((familia) => Object.values(familia).forEach(por));
  Object.values(FRAQUEZA_SONORA).forEach(por);
  Object.values(COLCHAO).forEach(por);
  PONTOS.forEach((p) => por(p.som));
  PASSAROS.arquivos.forEach((a) => nomes.add(a));
  return nomes;
}

/** Guarda o gerente de audio. Chamado uma vez, no create do Boot. */
export function iniciarSom(cena: Phaser.Scene) {
  gerente = cena.sound;
  gerente.mute = !preferencias().som;
}

/* -------------------------------------------------------------- tocar tudo */

type Ajuste = { detune?: number; volume?: number; pan?: number };

function existe(arquivo: string): boolean {
  if (!gerente) return false;
  if (gerente.game.cache.audio.exists(arquivo)) return true;
  if (!cobrados.has(arquivo)) {
    cobrados.add(arquivo);
    suspeitar(`som ausente: ${arquivo}`, "esta no catalogo e nao carregou. npm run verificar explica");
  }
  return false;
}

/** Quantos sons curtos estao tocando agora. Acima do teto vira papa e o
 *  proximo disparo e descartado, nao enfileirado: som atrasado soa pior que
 *  som que nao veio. */
function lotado(): boolean {
  if (!gerente) return true;
  const tocando = gerente
    .getAllPlaying()
    .filter((s) => !(s as Phaser.Sound.WebAudioSound).loop).length;
  return tocando >= AJUSTES.maxEfeitos;
}

/** O disparo cru, a partir de uma ficha. Serve o catalogo inteiro, inclusive os
 *  grupos que sao escolhidos por tabela (impacto por material, magia por
 *  familia) e por isso nao tem nome fixo no codigo. */
export function tocarFicha(ficha: FichaSom, ajuste: Ajuste = {}) {
  if (!gerente || !preferencias().som) return;
  if (!existe(ficha.arquivo)) return;
  if (!ficha.loop && lotado()) return;
  const variacao = ficha.variacao
    ? Phaser.Math.Between(-ficha.variacao, ficha.variacao)
    : 0;
  gerente.play(ficha.arquivo, {
    volume: ficha.volume * (ajuste.volume ?? 1),
    detune: (ajuste.detune ?? 0) + variacao,
    loop: ficha.loop ?? false,
    ...(ajuste.pan !== undefined ? { pan: ajuste.pan } : {}),
  });
}

/** O disparo do dia a dia. So aceita nome que existe no catalogo. */
export function tocar(chave: ChaveEfeito, ajuste: Ajuste = {}) {
  tocarFicha(EFEITOS[chave], ajuste);
}

/* --------------------------------------------------------------- o passo */

/** O passo sai do CHAO, nao do heroi: o mesmo personagem soa diferente na
 *  grama e na madeira. O dado ja existia em mapas.ts, so faltava ouvir. */
export function passo(tile: number) {
  tocar(PASSO_DO_TILE[tile] ?? PASSO_PADRAO);
}

/* ----------------------------------------------------------------- a voz */

/** Cada personagem fala numa altura propria. O Lele le devagar: o tom diz quem
 *  esta falando antes dele terminar de ler o nome na chapinha dourada. */
export function vozDe(quem: string): number {
  return VOZ[quem] ?? VOZ_PADRAO;
}

export function letraDaFala(quem: string) {
  tocar("fala-letra", { detune: vozDe(quem) });
}

/* ---------------------------------------------------------------- loops */

/** Liga, ajusta ou desliga um som continuo, pela etiqueta.
 *
 *  Volume 0 nao abaixa: para e solta o som. Fonte longe do heroi continuar
 *  tocando calada custa CPU no iPad sem entregar nada. */
function ajustarLoop(etiqueta: string, ficha: FichaSom, volume: number) {
  const vivo = loops.get(etiqueta);
  if (volume <= 0.001 || !preferencias().som) {
    if (vivo) {
      vivo.stop();
      vivo.destroy();
      loops.delete(etiqueta);
    }
    return;
  }
  if (!gerente || !existe(ficha.arquivo)) return;
  if (!vivo) {
    const novo = gerente.add(ficha.arquivo, { loop: true, volume: ficha.volume * volume });
    novo.play();
    loops.set(etiqueta, novo);
    return;
  }
  (vivo as Phaser.Sound.WebAudioSound).setVolume(ficha.volume * volume);
}

/* ------------------------------------------------------------- o ambiente */

/** Um som que mora num lugar do mapa. Quem resolve onde e a cena, porque so ela
 *  sabe onde a fogueira foi parar; aqui so entra a coordenada pronta. */
export type FonteDeSom = { som: FichaSom; x: number; y: number; alcance: number };

let fontes: FonteDeSom[] = [];
let colchaoAtual: FichaSom | undefined;

/** Monta o ambiente de um mapa: o colchao que toca sempre e as fontes que tem
 *  lugar. Trocar de mapa e chamar isto de novo. */
export function montarAmbiente(colchao: FichaSom | undefined, lista: FonteDeSom[]) {
  fontes.forEach((_, i) => ajustarLoop(`fonte-${i}`, fontes[i].som, 0));
  fontes = lista;
  colchaoAtual = colchao;
  if (colchao) ajustarLoop("colchao", colchao, 1);
}

/** Chamado a cada quadro com a posicao do heroi. E isto que faz a vila ter
 *  lugares em vez de ser um desenho com musica em cima. */
export function ouvirDe(x: number, y: number) {
  if (colchaoAtual) ajustarLoop("colchao", colchaoAtual, 1);
  fontes.forEach((f, i) => {
    const distancia = Phaser.Math.Distance.Between(x, y, f.x, f.y);
    const perto = Phaser.Math.Clamp(1 - distancia / f.alcance, 0, 1);
    // queda ao quadrado: linear soa como alguem girando um botao de volume
    ajustarLoop(`fonte-${i}`, f.som, perto * perto);
  });
}

/** Cantos avulsos de passaro, nunca em loop: repeticao regular e o que faz
 *  ambiente soar barato. Um a cada intervalo sorteado, na altura sorteada. */
export function soltarPassaros(cena: Phaser.Scene) {
  const proximo = () => {
    const espera = Phaser.Math.Between(PASSAROS.intervalo.min, PASSAROS.intervalo.max) * 1000;
    cena.time.delayedCall(espera, () => {
      if (!cena.scene.isActive()) return;
      const arquivo = Phaser.Utils.Array.GetRandom(PASSAROS.arquivos);
      tocarFicha(
        { arquivo, volume: PASSAROS.volume, variacao: PASSAROS.variacao },
        { pan: Phaser.Math.FloatBetween(-0.7, 0.7) }
      );
      proximo();
    });
  };
  proximo();
}

/* ---------------------------------------------------------------- musica */

/** Troca de faixa com fade. Passar undefined desliga.
 *
 *  A faixa carrega aqui, nao no Boot. Se o arquivo nao existir, o loaderror vai
 *  para o doutor e o jogo segue em silencio: musica que falta nao pode impedir
 *  ninguem de jogar. Hoje as duas faltam de proposito, esperando faixa de
 *  verdade. Ver o aviso de npm run verificar. */
export function musica(cena: Phaser.Scene, nome?: ChaveMusica) {
  if (nome === nomeDaFaixa) return;
  const antiga = faixa;
  nomeDaFaixa = nome;
  if (antiga) {
    cena.tweens.add({
      targets: antiga,
      volume: 0,
      duration: AJUSTES.fade * 1000,
      onComplete: () => {
        antiga.stop();
        antiga.destroy();
      },
    });
    faixa = undefined;
  }
  if (!nome) return;

  // anotado como FichaSom, e nao inferido: hoje nenhuma faixa esta pendente, e o
  // tipo inferido nao teria mais o campo pra consultar. A guarda abaixo tem que
  // continuar valendo pra faixa nova que entre encomendada.
  const ficha: FichaSom = MUSICAS[nome];
  // encomenda ainda nao entregue: nem pede o arquivo. Um 404 por faixa que a
  // gente ja sabe que falta so suja o console e reprova a conferencia.
  if (ficha.pendente) return;
  const comecar = () => {
    if (nomeDaFaixa !== nome || !gerente) return;
    if (!gerente.game.cache.audio.exists(ficha.arquivo)) return;
    const nova = gerente.add(ficha.arquivo, { loop: true, volume: 0 });
    nova.play();
    faixa = nova;
    cena.tweens.add({
      targets: nova,
      volume: ficha.volume * abafamento,
      duration: AJUSTES.fade * 1000,
    });
  };

  if (gerente?.game.cache.audio.exists(ficha.arquivo)) return comecar();
  cena.load.audio(ficha.arquivo, `assets/som/${ficha.arquivo}${EXTENSAO}`);
  cena.load.once("complete", comecar);
  cena.load.start();
}

/** A Pausa abaixa a trilha, nao para. Parar faz a faixa recomecar do zero na
 *  volta, e isso se ouve. */
export function abafarMusica(fator: number) {
  abafamento = fator;
  if (faixa && nomeDaFaixa) {
    (faixa as Phaser.Sound.WebAudioSound).setVolume(MUSICAS[nomeDaFaixa].volume * fator);
  }
}

/* ---------------------------------------------------------------- desligar */

/** Sai do mundo: solta os loops e as fontes. A musica sobrevive de proposito,
 *  porque menu e titulo compartilham a mesma faixa. */
export function calarAmbiente() {
  loops.forEach((s) => {
    s.stop();
    s.destroy();
  });
  loops.clear();
  fontes = [];
  colchaoAtual = undefined;
}

/** Liga e desliga tudo, do menu de configuracoes. */
export function definirSom(ligado: boolean) {
  if (gerente) gerente.mute = !ligado;
  if (!ligado) calarAmbiente();
}
