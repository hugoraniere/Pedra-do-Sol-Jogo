/** A barra unica de status + acoes do heroi, ancorada no rodape - a MESMA
 *  em exploracao (`Interface.ts`) e em combate (`Combate.ts`), pra nao
 *  divergir como a barra de vida antiga ja divergiu uma vez (duas copias,
 *  `LARGURA_VIDA` 50 numa e 60 na outra, sem ninguem perceber). Revisao de
 *  2026-09-05, a pedido do Hugo (referencia visual: Baldur's Gate 3 - vida,
 *  acoes e item ficam juntos, sempre visiveis, nao so durante a luta).
 *
 * Sistema de desenho puro (nasce aqui, no ambiente `combate`, mesmo motivo
 * de `sistemas/fileira.ts`): quem chama decide TUDO que muda entre os dois
 * modos - se uma acao esta disponivel, se ha item pra usar - como DADO,
 * nunca como um "modoCombate" escondido aqui dentro. E o que deixa
 * `Interface.ts` chamar isto sem nunca precisar importar turno nenhum: ela
 * sempre manda `indisponivel: true` pra toda acao, porque fora de combate
 * nunca ha alvo valido.
 *
 * Nao mora aqui: trilha de iniciativa, PASSAR, toggle de passar automatico -
 * isso e conceito de turno (`sistemas/turnos.ts`), `Interface.ts` nao tem
 * por que saber disso. `Combate.ts` continua desenhando os tres, ancorados
 * relativo a `HudDeAcao.area` (ver `Combate.ts`, `montarInterface()`).
 */
import Phaser from "phaser";
import type { Retangulo } from "./design";
import { fileira } from "./fileira";
import { texto } from "./texto";
import { ICONE as ICONE_RETRATOS } from "../dados/provador";
import { ICONE as ICONE_UI } from "./icones";
import { ICONE_ITEM } from "./icones-itens";
import type { AcaoDeHeroi } from "./acao";

const SLOT = 22;
const GAP = 2;
const LARGURA_RETRATO = 20;
const LARGURA_VIDA = 36;
const ALTURA_BARRA_VIDA = 10;

export type SlotDeAcaoEstado = {
  selecionada: boolean;
  /** apagado: fora de combate, cooldown, ou nao e a vez do heroi. */
  indisponivel: boolean;
  /** riscado: uso unico (porAventura/porLuta) ja gasto. */
  gastou: boolean;
  /** pips de cooldown (`porTurno` com espera) - 0 fora de combate. */
  esperaTurnos: number;
};

export type ItemRapido = { item: string; quantidade: number; disponivel: boolean } | null;

export type OpcoesHudDeAcao = {
  area: Retangulo;
  acoes: AcaoDeHeroi[];
  itemRapido: ItemRapido;
  vida: { atual: number; max: number };
  /** true em `Combate.ts` (a barra vive na camera do MUNDO, que rola - ver
   *  docs/plano-do-combate.md 3.6); ausente/false em `Interface.ts` (a
   *  propria cena ja e so HUD, a camera dela nunca rola). */
  fixarNaTela?: boolean;
  aoEscolherAcao?: (acao: AcaoDeHeroi) => void;
  aoUsarItemRapido?: () => void;
  aoApontarAcao?: (acao: AcaoDeHeroi, xCentro: number) => void;
  aoTirarApontamento?: () => void;
};

type SlotDeAcao = {
  acao: AcaoDeHeroi;
  fundo: Phaser.GameObjects.NineSlice;
  icone: Phaser.GameObjects.Image;
  borda: Phaser.GameObjects.Graphics;
  marca: Phaser.GameObjects.Graphics;
  numero: Phaser.GameObjects.BitmapText;
  x: number;
  y: number;
};

export type HudDeAcao = {
  /** a mesma area recebida - o chamador ancora extras (PASSAR, iniciativa)
   *  relativo a ela, em vez de repetir a conta. */
  area: Retangulo;
  atualizarVida(atual: number, max: number): void;
  atualizarSlots(porAcao: Map<string, SlotDeAcaoEstado>): void;
  atualizarItemRapido(item: ItemRapido): void;
  destruir(): void;
};

export function montarHudDeAcao(cena: Phaser.Scene, opcoes: OpcoesHudDeAcao): HudDeAcao {
  const { area } = opcoes;
  const fixo = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    if (opcoes.fixarNaTela) {
      (o as unknown as { setScrollFactor: (n: number) => void }).setScrollFactor(0);
    }
    (o as unknown as { setDepth: (n: number) => void }).setDepth(1000);
    return o;
  };

  // passada em vazio, so pra medir - a area recebida e o MAXIMO disponivel
  // (sobra depois do direcional e do botao A), nao o quanto o conteudo de
  // verdade ocupa. Sem isto o fundo esticava ate o fim da area mesmo com o
  // heroi tendo so 2 ou 3 acoes, deixando uma faixa escura vazia a direita.
  const medir = fileira(area, SLOT, GAP);
  medir.reservar(LARGURA_RETRATO, 0);
  medir.reservar(LARGURA_VIDA, 4);
  medir.reservar(SLOT, 6);
  const cabemAcoes = Math.min(medir.cabem(), opcoes.acoes.length);
  for (let i = 0; i < cabemAcoes; i++) medir.reservar(SLOT, i === 0 ? 6 : GAP);

  // fundo unico atras de retrato+vida+item+acoes - mesmo painel-escuro que
  // a barra de acoes ja usava sozinha.
  fixo(
    cena.add
      .nineslice(area.x - 4, area.y - 2, "painel-escuro", undefined, medir.larguraUsada() + 8, area.altura + 4, 8, 8, 8, 8)
      .setOrigin(0)
      .setAlpha(0.85)
  );

  const linha = fileira(area, SLOT, GAP);

  const rRetrato = linha.reservar(LARGURA_RETRATO, 0);
  fixo(
    cena.add.image(
      rRetrato.x + LARGURA_RETRATO / 2, rRetrato.y + rRetrato.altura / 2, "icones", ICONE_RETRATOS.retratoHeroi
    )
  );

  const rVida = linha.reservar(LARGURA_VIDA, 4);
  const yVida = rVida.y + (rVida.altura - ALTURA_BARRA_VIDA) / 2;
  fixo(cena.add.rectangle(rVida.x, yVida, LARGURA_VIDA, ALTURA_BARRA_VIDA, 0x2c2440).setOrigin(0));
  const barraVidaFrente = fixo(
    cena.add.rectangle(rVida.x + 1, yVida + 1, LARGURA_VIDA - 2, ALTURA_BARRA_VIDA - 2, 0x3e9b62).setOrigin(0)
  );
  const textoVida = fixo(
    texto(cena, rVida.x + LARGURA_VIDA / 2, yVida + ALTURA_BARRA_VIDA / 2, "", {
      cor: 0xfff8ea, ancora: 0.5, ancoraY: 0.5,
    })
  );

  const rItem = linha.reservar(SLOT, 6);
  const fundoItem = fixo(
    cena.add.nineslice(rItem.x, rItem.y, "painel-creme", undefined, SLOT, SLOT, 8, 8, 8, 8).setOrigin(0)
  );
  const iconeItem = fixo(cena.add.image(rItem.x + SLOT / 2, rItem.y + SLOT / 2, "ui", ICONE_UI.mochila));
  const textoItem = fixo(
    texto(cena, rItem.x + SLOT - 2, rItem.y + SLOT - 2, "", { cor: 0x2c2440, ancora: 1, ancoraY: 1 })
  );
  const alvoItem = fixo(
    cena.add.rectangle(rItem.x + SLOT / 2, rItem.y + SLOT / 2, SLOT + 2, SLOT + 6, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
  );
  alvoItem.on("pointerdown", () => opcoes.aoUsarItemRapido?.());

  // acoes de combate - trunca no que couber, igual a barra de combate ja
  // fazia sozinha (na exploracao, com menos largura livre, mostra menos
  // acoes; nenhuma UI de "mais" nova, so o mesmo corte de sempre).
  const cabem = Math.min(linha.cabem(), opcoes.acoes.length);
  const slots: SlotDeAcao[] = [];
  for (let i = 0; i < cabem; i++) {
    const acao = opcoes.acoes[i];
    const r = linha.reservar(SLOT, i === 0 ? 6 : GAP);
    const fundo = fixo(
      cena.add.nineslice(r.x, r.y, "painel-creme", undefined, SLOT, SLOT, 8, 8, 8, 8).setOrigin(0)
    );
    const icone = fixo(cena.add.image(r.x + SLOT / 2, r.y + SLOT / 2 + 1, "icones", acao.icone));
    const borda = fixo(cena.add.graphics());
    borda.lineStyle(2, acao.cor, 1).strokeRect(r.x + 1, r.y + 1, SLOT - 2, SLOT - 2);
    const marca = fixo(cena.add.graphics());
    const numero = fixo(texto(cena, r.x + 2, r.y + 1, String(i + 1), { cor: 0x2c2440 }));
    const alvo = fixo(
      cena.add.rectangle(r.x + SLOT / 2, r.y + SLOT / 2, SLOT + 2, SLOT + 6, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
    );
    alvo.on("pointerdown", () => opcoes.aoEscolherAcao?.(acao));
    alvo.on("pointerover", () => opcoes.aoApontarAcao?.(acao, r.x + SLOT / 2));
    alvo.on("pointerout", () => opcoes.aoTirarApontamento?.());
    slots.push({ acao, fundo, icone, borda, marca, numero, x: r.x, y: r.y });
  }

  const atualizarItemRapidoVisual = (item: ItemRapido) => {
    if (!item) {
      iconeItem.setTexture("ui", ICONE_UI.mochila).setAlpha(0.25);
      textoItem.setText("");
      fundoItem.setAlpha(0.4);
      return;
    }
    const temIconeProprio = ICONE_ITEM[item.item] !== undefined;
    iconeItem.setTexture(temIconeProprio ? "itens" : "ui", temIconeProprio ? ICONE_ITEM[item.item] : ICONE_UI.mochila);
    iconeItem.setAlpha(item.disponivel ? 1 : 0.3);
    fundoItem.setAlpha(item.disponivel ? 1 : 0.4);
    textoItem.setText(item.quantidade > 1 ? String(item.quantidade) : "");
  };
  atualizarItemRapidoVisual(opcoes.itemRapido);

  const atualizarVidaVisual = (atual: number, max: number) => {
    const fracao = Phaser.Math.Clamp(max > 0 ? atual / max : 0, 0, 1);
    barraVidaFrente.width = Math.max(1, (LARGURA_VIDA - 2) * fracao);
    barraVidaFrente.fillColor = fracao > 0.5 ? 0x3e9b62 : fracao > 0.25 ? 0xf5b62b : 0xe2483d;
    textoVida.setText(`${Math.max(0, atual)}/${max}`);
  };
  atualizarVidaVisual(opcoes.vida.atual, opcoes.vida.max);

  return {
    area,
    atualizarVida: atualizarVidaVisual,
    atualizarItemRapido: atualizarItemRapidoVisual,
    // mesma receita de alpha que Combate.ts ja usava sozinho pro slot
    // "indisponivel" (0.4 fundo/numero, 0.3 icone/borda) - so passou a vir
    // de fora como dado, em vez de calculada aqui dentro.
    atualizarSlots(porAcao) {
      slots.forEach((s) => {
        s.marca.clear();
        const estadoSlot = porAcao.get(s.acao.id);
        if (!estadoSlot) return;
        const indisponivel = estadoSlot.indisponivel || estadoSlot.gastou;
        s.fundo.setTexture(estadoSlot.selecionada ? "painel-ouro" : "painel-creme");
        s.fundo.setAlpha(indisponivel ? 0.4 : 1);
        s.icone.setAlpha(indisponivel ? 0.3 : 1);
        s.borda.setAlpha(indisponivel ? 0.3 : 1);
        s.numero.setAlpha(indisponivel ? 0.4 : 1);
        for (let i = 0; i < estadoSlot.esperaTurnos; i++) {
          s.marca.fillStyle(0x7ec4f2, 1).fillRect(s.x + 3 + i * 5, s.y + SLOT - 5, 3, 3);
        }
        if (estadoSlot.gastou) {
          s.marca.lineStyle(1, 0x2c2440, 0.8)
            .lineBetween(s.x + 5, s.y + 5, s.x + SLOT - 5, s.y + SLOT - 5)
            .lineBetween(s.x + SLOT - 5, s.y + 5, s.x + 5, s.y + SLOT - 5);
        }
      });
    },
    // os objetos sao filhos da cena - Phaser ja os destroi sozinho quando a
    // cena desliga, igual o resto do HUD sempre confiou. Isto so existe pra
    // quem precisar trocar o HUD sem trocar de cena.
    destruir() {
      slots.forEach((s) => {
        s.fundo.destroy(); s.icone.destroy(); s.borda.destroy(); s.marca.destroy(); s.numero.destroy();
      });
    },
  };
}
