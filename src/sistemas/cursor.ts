/** O estado do cursor do mouse, e quem escuta as cenas para saber qual e.
 *
 *  Sistema puro: aqui nao ha sprite nem cena, so o estado. Quem desenha e
 *  src/cenas/Ponteiro.ts. Assim da para perguntar "o cursor esta sobre o que?"
 *  de qualquer lugar sem depender de quem esta na tela.
 *
 *  Onde fica a ponta de cada quadro NAO esta escrito aqui. Sai de arte/cursor.py
 *  para public/assets/cursor.json e o jogo le de la, pela mesma razao dos
 *  encaixes do heroi: um pixel a mais na cauda da seta e a coordenada copiada
 *  para dentro deste arquivo ja teria divergido do desenho.
 */
import Phaser from "phaser";
import { EstadoDoCursor } from "../dados/cursor";

export type QuadroDoCursor = { quadro: number; pega: { x: number; y: number } };
export type FichaDoCursor = {
  celula: number;
  quadros: Record<string, QuadroDoCursor>;
};

let ficha: FichaDoCursor | undefined;
let estado: EstadoDoCursor = "normal";
let apertado = false;
/** o cursor so existe depois que um mouse de verdade se mexe. No iPad ele nunca
 *  aparece, e e por isso que o toque continua sendo o jeito principal de jogar */
let comMouse = false;

export function guardarFichaDoCursor(f: FichaDoCursor) {
  ficha = f;
}

/** O quadro a desenhar agora. Devolve undefined enquanto a folha nao carregou. */
export function quadroAtual(): QuadroDoCursor | undefined {
  if (!ficha) return undefined;
  const nome = apertado ? "clique" : estado;
  const q = ficha.quadros[nome];
  if (!q) {
    // nome que nao existe na folha nao da erro de compilacao: daria um cursor
    // invisivel, que e o tipo de bug que so aparece quando alguem reclama
    console.warn(`cursor: nao existe quadro "${nome}" em cursor.json`);
    return ficha.quadros.normal;
  }
  return q;
}

export function estadoDoCursor(): EstadoDoCursor {
  return apertado ? "clique" : estado;
}

export function definirEstado(novo: EstadoDoCursor) {
  estado = novo;
}

export function definirApertado(v: boolean) {
  apertado = v;
}

export function mouseEmUso() {
  return comMouse;
}

/** Um dedo nao paira. Se o evento veio do toque, o cursor some e so volta
 *  quando um mouse de verdade se mexer de novo. */
export function anotarPonteiro(p: Phaser.Input.Pointer) {
  comMouse = !p.wasTouch;
}

/** Liga o cursor em TODAS as cenas do jogo, sem nenhuma delas saber disso.
 *
 *  Cada cena do Phaser tem o seu proprio plugin de entrada, entao nao existe um
 *  lugar so que enxergue "o mouse esta sobre um botao" no jogo inteiro. Em vez
 *  de por duas linhas dentro de cada cena — e de lembrar de por nas proximas —
 *  quem se inscreve e este instalador, chamado uma vez em main.ts junto com o
 *  auditor e o doutor, que ja seguem este mesmo padrao.
 *
 *  Duas esperas, e as duas ja custaram um cursor que nunca acendia:
 *
 *  1. Espera o jogo ficar PRONTO antes de olhar a lista de cenas. Logo depois do
 *     `new Phaser.Game` essa lista ainda esta vazia — o Phaser monta as cenas
 *     numa fila — entao inscrever agora e inscrever em coisa nenhuma, sem erro
 *     nenhum aparecer.
 *  2. Espera o CREATE de cada cena antes de tocar no plugin de entrada dela, que
 *     so existe depois que a cena sobe. A inscricao se repete a cada restart de
 *     proposito: o Phaser joga fora os ouvintes quando a cena cai. */
export function instalarPonteiro(jogo: Phaser.Game) {
  jogo.events.once(Phaser.Core.Events.READY, () => {
    jogo.scene.scenes.forEach((cena) => {
      if (cena.scene.key === "Ponteiro") return;
      cena.events.on(Phaser.Scenes.Events.CREATE, () => escutar(cena));
      // uma cena que ja subiu antes desta inscricao nao teria CREATE de novo
      if (cena.scene.isActive()) escutar(cena);
    });
  });
}

function escutar(cena: Phaser.Scene) {
  const entrada = cena.input;
  if (!entrada) return;
  // "sobre" vale para qualquer objeto interativo de qualquer cena. Nenhum botao
  // precisou ser marcado: quem ja chamou setInteractive() ja participa.
  entrada.on(Phaser.Input.Events.GAMEOBJECT_OVER, () => definirEstado("sobre"));
  entrada.on(Phaser.Input.Events.GAMEOBJECT_OUT, () => definirEstado("normal"));
  // sair da cena sem passar por "out" (uma tela que troca com o mouse parado em
  // cima de um botao) deixaria o cursor dourado para sempre
  cena.events.once(Phaser.Scenes.Events.SHUTDOWN, () => definirEstado("normal"));
}
