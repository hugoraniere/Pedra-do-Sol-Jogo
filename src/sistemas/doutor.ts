import Phaser from "phaser";

/** O doutor de dentro do jogo.
 *
 *  No iPad nao existe console. Se o jogo quebrar na mao do Lele, o erro acontece,
 *  o jogo trava, e nao sobra nenhum rastro. Este arquivo resolve isso: guarda tudo
 *  que der errado e mostra na tela quando alguem pedir.
 *
 *  Ele nao desenha nada com Phaser de proposito. E HTML puro por cima do canvas,
 *  porque se o problema for o proprio Phaser o painel ainda precisa abrir.
 *
 *  Como abrir:
 *    - `?doutor` na URL, ou
 *    - quatro toques no canto superior esquerdo, ou
 *    - `jogo.doutor()` no console, quando tem console
 *
 *  Comeca a escutar antes do Phaser subir. Em src/main.ts:
 *    import { ligarDoutor } from "./sistemas/doutor";
 *    ligarDoutor();                       // <- antes do new Phaser.Game
 */

const LIMITE = 40;

type Registro = {
  hora: string;
  tipo: "erro" | "promessa" | "arquivo" | "aviso" | "nota";
  texto: string;
  detalhe?: string;
};

const registros: Registro[] = [];
let painel: HTMLElement | null = null;
let ligado = false;

function agora(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

/** Guarda um acontecimento. Sempre silencioso: nunca atrapalha o jogo. */
export function anotar(tipo: Registro["tipo"], texto: string, detalhe?: string) {
  registros.push({ hora: agora(), tipo, texto, detalhe });
  if (registros.length > LIMITE) registros.shift();
  if (painel) desenhar();
}

/* ------------------------------------------------------------------ escuta */

export function ligarDoutor() {
  if (ligado) return;
  ligado = true;

  window.addEventListener("error", (e) => {
    // erro de <img>/<audio> chega aqui tambem, e sem message
    const alvo = e.target as HTMLElement | null;
    if (alvo && alvo !== (window as unknown as HTMLElement) && "src" in alvo) {
      anotar("arquivo", `nao carregou: ${(alvo as HTMLImageElement).src}`);
      return;
    }
    anotar("erro", e.message || "erro sem mensagem", `${e.filename}:${e.lineno}`);
  });

  window.addEventListener("unhandledrejection", (e) => {
    anotar("promessa", String(e.reason?.message ?? e.reason ?? "promessa recusada"));
  });

  // quatro toques no canto de cima a esquerda abrem o painel.
  // fica longe do direcional e do botao de acao, entao o Lele nao abre sem querer.
  let toques = 0;
  let ultimo = 0;
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.clientX > 90 || e.clientY > 90) return;
      const t = Date.now();
      toques = t - ultimo < 800 ? toques + 1 : 1;
      ultimo = t;
      if (toques >= 4) {
        toques = 0;
        alternar();
      }
    },
    true
  );

  if (location.search.includes("doutor")) abrir();

  (window as unknown as { doutor: () => void }).doutor = alternar;
  anotar("nota", "doutor ligado");
}

/** Liga o doutor no carregador do Phaser. Chame no preload() do Boot. */
export function vigiarCarregamento(cena: Phaser.Scene) {
  cena.load.on("loaderror", (arquivo: { key: string; src: string }) => {
    anotar("arquivo", `nao carregou "${arquivo.key}"`, arquivo.src);
  });
}

/** Marca uma suspeita que nao e excecao. Ex.: NPC sem fala, textura faltando. */
export function suspeitar(texto: string, detalhe?: string) {
  anotar("aviso", texto, detalhe);
}

/* ------------------------------------------------------------------ painel */

function alternar() {
  painel ? fechar() : abrir();
}

function fechar() {
  painel?.remove();
  painel = null;
}

function abrir() {
  if (painel) return;
  painel = document.createElement("div");
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-label", "Doutor do jogo");
  Object.assign(painel.style, {
    position: "fixed",
    inset: "0",
    zIndex: "99999",
    background: "rgba(28, 24, 48, .96)",
    color: "#F2EADC",
    font: "13px/1.5 ui-monospace, Menlo, monospace",
    padding: "14px",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(painel);
  desenhar();
}

function escapar(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function desenhar() {
  if (!painel) return;

  const COR: Record<Registro["tipo"], string> = {
    erro: "#F0857A",
    promessa: "#F0857A",
    arquivo: "#F5B62B",
    aviso: "#F5B62B",
    nota: "#8E82A8",
  };

  const linhas = registros
    .slice()
    .reverse()
    .map(
      (r) =>
        `<div style="padding:6px 0;border-bottom:1px solid #3D3455">
           <span style="color:#8E82A8">${r.hora}</span>
           <span style="color:${COR[r.tipo]}"> ${r.tipo}</span><br>
           ${escapar(r.texto)}
           ${r.detalhe ? `<div style="color:#8E82A8">${escapar(r.detalhe)}</div>` : ""}
         </div>`
    )
    .join("");

  const botao =
    "border:0;border-radius:6px;padding:10px 18px;font:inherit;font-weight:700";

  painel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <strong style="color:#A88AE6">DOUTOR</strong>
      <span style="display:flex;gap:8px">
        <button id="doutor-auditar"
          style="${botao};background:#3D3455;color:#F2EADC">auditar UI</button>
        <button id="doutor-fechar"
          style="${botao};background:#A88AE6;color:#1D1830">fechar</button>
      </span>
    </div>
    <div style="margin:10px 0;color:#BFB3D2">${escapar(resumo())}</div>
    ${linhas || '<div style="color:#8E82A8">nada de errado ate agora.</div>'}
  `;

  painel.querySelector("#doutor-fechar")?.addEventListener("click", fechar);
  painel.querySelector("#doutor-auditar")?.addEventListener("click", auditar);
}

/** Chama o auditor de UI de sistemas/auditoria.ts e joga o resultado aqui dentro.
 *  E o que faz o auditor funcionar no iPad: la nao tem console pra rodar auditarUI(). */
function auditar() {
  const fn = (window as unknown as { auditarUI?: () => { tipo: string; descricao: string; a: string }[] })
    .auditarUI;
  if (!fn) {
    anotar("nota", "auditarUI() nao esta disponivel");
    return;
  }
  const problemas = fn();
  if (!problemas.length) {
    anotar("nota", "auditoria de UI: nenhum problema");
    return;
  }
  for (const p of problemas) anotar("aviso", `${p.tipo}: ${p.a}`, p.descricao);
}

/** O retrato do aparelho. E aqui que aparece o motivo de "o jogo esta mudo". */
function resumo(): string {
  const partes: string[] = [];
  // innerWidth vem 0 em alguns navegadores embutidos, entao cai pro documento
  const larg = window.innerWidth || document.documentElement.clientWidth;
  const alt = window.innerHeight || document.documentElement.clientHeight;
  partes.push(`tela ${larg}x${alt}`);

  const ctx = (window as unknown as { jogo?: { sound?: { context?: AudioContext; locked?: boolean } } })
    .jogo?.sound;
  if (ctx) {
    partes.push(`audio ${ctx.context?.state ?? "?"}${ctx.locked ? " (travado)" : ""}`);
    // no iPad, "running" com silencioso ligado ainda nao produz som audivel.
    // por isso o aviso da chavinha nao pode depender so deste estado.
  }

  try {
    const save = localStorage.getItem("reino-de-aurora-v1");
    partes.push(save ? `save ${(save.length / 1024).toFixed(1)}kb` : "sem save");
  } catch {
    partes.push("sem localStorage");
  }

  const erros = registros.filter((r) => r.tipo === "erro" || r.tipo === "promessa").length;
  partes.push(`${erros} erro(s)`);
  return partes.join(" · ");
}
