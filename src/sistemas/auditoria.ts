/** Auditor de UI.
 *
 * Percorre a cena ativa e reclama de:
 *   . texto por cima de texto
 *   . texto por cima de botao que nao e o rotulo dele
 *   . botao por cima de botao
 *   . qualquer coisa saindo da tela
 *   . qualquer coisa saindo do painel em que deveria estar
 *
 * Fica sempre no build, custa quase nada e nao roda sozinho. Para usar:
 *   . no console do navegador:  auditarUI()
 *   . em teste automatizado:    ferramentas/auditar-ui.mjs
 */
import Phaser from "phaser";
import { LARGURA, ALTURA } from "../dados/config";

export type Problema = {
  cena: string;
  tipo: "sobreposicao" | "fora-da-tela" | "fora-do-painel" | "atras-do-painel";
  descricao: string;
  a: string;
  b?: string;
};

type Marca = { tipo: string; dono?: string };

function rotulo(obj: Phaser.GameObjects.GameObject): string {
  const g = obj as unknown as { text?: string; texture?: { key?: string } };
  const marca = obj.getData("ui") as Marca | undefined;
  const nome = g.text ? `"${String(g.text).slice(0, 24)}"` : g.texture?.key ?? obj.type;
  return `${marca?.tipo ?? obj.type}:${nome}`;
}

function limites(obj: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle | null {
  const g = obj as unknown as { getBounds?: () => Phaser.Geom.Rectangle; visible?: boolean };
  if (!g.getBounds || g.visible === false) return null;
  const r = g.getBounds();
  return r.width > 0 && r.height > 0 ? r : null;
}

/** Area util em comum entre dois retangulos, em pixels. */
function sobreposicao(a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

function achatar(lista: Phaser.GameObjects.GameObject[]): Phaser.GameObjects.GameObject[] {
  const saida: Phaser.GameObjects.GameObject[] = [];
  for (const o of lista) {
    saida.push(o);
    const c = o as unknown as { list?: Phaser.GameObjects.GameObject[] };
    if (Array.isArray(c.list)) saida.push(...achatar(c.list));
  }
  return saida;
}

export function auditarCena(cena: Phaser.Scene): Problema[] {
  const problemas: Problema[] = [];
  const todos = achatar(cena.children.list);

  const conteudo = todos.filter((o) => {
    const m = o.getData("ui") as Marca | undefined;
    return m && (m.tipo === "texto" || m.tipo === "botao");
  });
  const paineis = todos.filter((o) => (o.getData("ui") as Marca | undefined)?.tipo === "painel");

  // ------------------------------------------------- 1. saindo da tela
  for (const o of conteudo) {
    const r = limites(o);
    if (!r) continue;
    if (r.left < -1 || r.top < -1 || r.right > LARGURA + 1 || r.bottom > ALTURA + 1) {
      problemas.push({
        cena: cena.scene.key,
        tipo: "fora-da-tela",
        descricao: `sai da tela (${Math.round(r.left)},${Math.round(r.top)} ate ${Math.round(
          r.right
        )},${Math.round(r.bottom)})`,
        a: rotulo(o),
      });
    }
  }

  // ------------------------------------------ 2. saindo do painel dono
  for (const o of conteudo) {
    const r = limites(o);
    if (!r) continue;
    // o painel dono e o menor painel que contem o centro do elemento
    const dono = paineis
      .map((p) => ({ p, r: limites(p) }))
      .filter((x) => x.r && Phaser.Geom.Rectangle.ContainsPoint(x.r, new Phaser.Geom.Point(r.centerX, r.centerY)))
      .sort((a, b) => a.r!.width * a.r!.height - b.r!.width * b.r!.height)[0];
    if (!dono?.r) continue;
    const folga = 2;
    if (
      r.left < dono.r.left - folga ||
      r.right > dono.r.right + folga ||
      r.top < dono.r.top - folga ||
      r.bottom > dono.r.bottom + folga
    ) {
      problemas.push({
        cena: cena.scene.key,
        tipo: "fora-do-painel",
        descricao: "vaza para fora do painel em que esta",
        a: rotulo(o),
        b: rotulo(dono.p),
      });
    }
  }

  // ------------------------------------- 3. conteudo escondido atras do painel
  const profundidade = (o: Phaser.GameObjects.GameObject): number => {
    const g = o as unknown as { depth?: number; parentContainer?: { depth?: number } };
    return (g.parentContainer?.depth ?? 0) * 1000 + (g.depth ?? 0);
  };
  const ordem = new Map(todos.map((o, i) => [o, i]));
  for (const o of conteudo) {
    const r = limites(o);
    if (!r) continue;
    for (const painel of paineis) {
      const rp = limites(painel);
      if (!rp || !Phaser.Geom.Rectangle.ContainsPoint(rp, new Phaser.Geom.Point(r.centerX, r.centerY))) continue;
      const acima =
        profundidade(o) > profundidade(painel) ||
        (profundidade(o) === profundidade(painel) && (ordem.get(o) ?? 0) > (ordem.get(painel) ?? 0));
      if (!acima) {
        problemas.push({
          cena: cena.scene.key,
          tipo: "atras-do-painel",
          descricao: "fica escondido atras do painel, o jogador nao ve",
          a: rotulo(o),
          b: rotulo(painel),
        });
      }
    }
  }

  // ------------------------------------------------- 4. um em cima do outro
  for (let i = 0; i < conteudo.length; i++) {
    for (let j = i + 1; j < conteudo.length; j++) {
      const a = conteudo[i];
      const b = conteudo[j];
      // rotulo dentro do proprio botao nao conta
      const paiA = (a as unknown as { parentContainer?: unknown }).parentContainer;
      const paiB = (b as unknown as { parentContainer?: unknown }).parentContainer;
      if (paiA && paiA === paiB) continue;
      if (paiA === b || paiB === a) continue;

      const ra = limites(a);
      const rb = limites(b);
      if (!ra || !rb) continue;
      const area = sobreposicao(ra, rb);
      if (area <= 4) continue;
      problemas.push({
        cena: cena.scene.key,
        tipo: "sobreposicao",
        descricao: `${Math.round(area)} px de area em comum`,
        a: rotulo(a),
        b: rotulo(b),
      });
    }
  }

  return problemas;
}

export function auditarTudo(jogo: Phaser.Game): Problema[] {
  const problemas: Problema[] = [];
  for (const cena of jogo.scene.getScenes(true)) problemas.push(...auditarCena(cena));
  return problemas;
}

/** Liga a funcao global auditarUI() para uso no console e nos testes. */
export function instalarAuditor(jogo: Phaser.Game) {
  (window as unknown as { auditarUI: () => Problema[] }).auditarUI = () => auditarTudo(jogo);
}
