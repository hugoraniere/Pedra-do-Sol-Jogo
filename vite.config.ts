import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { ambiente, porta } from "./ferramentas/ambiente-atual.mjs";

const eu = ambiente();

export default defineConfig({
  base: "./",
  build: { target: "es2022", assetsInlineLimit: 0 },
  // uma pasta de trabalho, uma porta. O numero sai de .ambiente, nunca da mao:
  // com duas frentes na mesma porta, uma serve a tela da outra sem avisar.
  cacheDir: `.vite/ambiente-${eu.numero}`,
  server: { host: true, port: porta(5173), strictPort: true },
  plugins: [
    VitePWA({
      // so entra em acao no build de producao. Em `npm run dev` o service
      // worker ficaria no caminho do hot reload, e cada frente de trabalho ja
      // tem porta propria, entao nao ha nada aqui para duas frentes disputarem.
      injectRegister: "auto",
      registerType: "autoUpdate",
      // TODO arquivo do jogo entra no cache, senao o Lele abre o icone sem
      // internet e o jogo carrega pela metade: tela preta sem nenhum erro no
      // console, o pior tipo de falha que este projeto persegue.
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,mp3,woff,woff2,json,xml}"],
      },
      manifest: {
        // curto de proposito: e o nome que aparece embaixo do icone na tela
        // do celular, e "Reino de Aurora" quebra em duas linhas ali
        name: "Reino de Aurora",
        short_name: "Aurora",
        lang: "pt-BR",
        description: "RPG para o Trovao da Floresta explorar",
        // a mesma tinta de COR.tinta em src/dados/config.ts. Fundo da tela de
        // abertura enquanto o icone carrega: se fosse branco, piscaria antes
        // do jogo, que e sempre escuro, aparecer.
        theme_color: "#2c2440",
        background_color: "#2c2440",
        display: "standalone",
        // "." e nao "/": o jogo mora numa subpasta no GitHub Pages
        // (paginas.github.io/nome-do-repo/), igual ao base:"./" do vite.
        // Absoluto abriria a pagina errada dali.
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icone-mascara-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
