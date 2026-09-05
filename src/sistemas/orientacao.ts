/** Pede para girar o aparelho quando o celular ou tablet esta em pe.
 *
 * A VILA E DESENHADA LARGA. O mapa tem 576x384, formato de paisagem, e nao
 * existe jeito de um mundo desse formato preencher uma tela alta e estreita
 * sem cortar metade dele ou sobrar parede vazia em cima e embaixo. sistemas/
 * visao.ts ja resolve "o jogo cabe em qualquer janela" com escala inteira; o
 * que ele NAO resolve, porque nao e dele, e "o mundo parece bem nesse formato".
 * Essa e a razao de existir este arquivo em vez de mexer em visao.ts.
 *
 * So aparece em aparelho de TOQUE (pointer:coarse). Numa janela de computador
 * estreitada na mao, o jogador tem mouse e pode alargar a janela de volta com
 * um arraste; num celular ele so tem a opcao de girar o corpo dele mesmo, e ai
 * faz sentido pedir isso.
 *
 * E HTML puro por cima do canvas, do mesmo jeito que o doutor: nao depende do
 * Phaser ter subido, e continua funcionando mesmo se alguma cena quebrar.
 */

const RETRATO = window.matchMedia("(orientation: portrait)");
const TOQUE = window.matchMedia("(pointer: coarse)");

let aviso: HTMLElement | null = null;

function montar(): HTMLElement {
  const div = document.createElement("div");
  div.setAttribute("role", "alert");
  Object.assign(div.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    display: "none",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    background: "#2C2440",
    color: "#FFF8EA",
    fontFamily: "ui-monospace, Menlo, monospace",
    textAlign: "center",
    padding: "24px",
  } as Partial<CSSStyleDeclaration>);

  // o icone: um retangulo de celular que gira de pe para deitado, num laco.
  // prefers-reduced-motion desliga o giro e deixa so o icone deitado parado,
  // que ja e a resposta a pergunta "pra que lado eu viro".
  const estilo = document.createElement("style");
  estilo.textContent = `
    @keyframes aurora-girar { 0%, 35% { transform: rotate(0deg); } 65%, 100% { transform: rotate(-90deg); } }
    .aurora-icone-girar { animation: aurora-girar 2.4s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) {
      .aurora-icone-girar { animation: none; transform: rotate(-90deg); }
    }
  `;
  div.appendChild(estilo);

  const icone = document.createElement("div");
  icone.className = "aurora-icone-girar";
  Object.assign(icone.style, {
    width: "46px",
    height: "76px",
    border: "4px solid #F5B62B",
    borderRadius: "8px",
    position: "relative",
  } as Partial<CSSStyleDeclaration>);
  const altoFalante = document.createElement("div");
  Object.assign(altoFalante.style, {
    position: "absolute",
    left: "50%",
    top: "8px",
    width: "14px",
    height: "3px",
    background: "#F5B62B",
    transform: "translateX(-50%)",
    borderRadius: "2px",
  } as Partial<CSSStyleDeclaration>);
  icone.appendChild(altoFalante);

  const titulo = document.createElement("div");
  titulo.textContent = "GIRE A TELA";
  Object.assign(titulo.style, { fontSize: "22px", fontWeight: "700", letterSpacing: "0.04em" } as Partial<CSSStyleDeclaration>);

  const legenda = document.createElement("div");
  legenda.textContent = "o Reino de Aurora fica deitado";
  Object.assign(legenda.style, { fontSize: "14px", color: "#BFB3D2" } as Partial<CSSStyleDeclaration>);

  div.append(icone, titulo, legenda);
  document.body.appendChild(div);
  return div;
}

function atualizar() {
  if (!TOQUE.matches) return; // computador com janela estreita: nunca pede
  if (!aviso) aviso = montar();
  aviso.style.display = RETRATO.matches ? "flex" : "none";
}

/** Liga a vigia. Chame uma vez, junto com vigiarJanela em main.ts. */
export function vigiarOrientacao() {
  atualizar();
  RETRATO.addEventListener("change", atualizar);
}
