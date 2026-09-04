import { defineConfig } from "vite";
import { ambiente, porta } from "./ferramentas/ambiente-atual.mjs";

const eu = ambiente();

export default defineConfig({
  base: "./",
  build: { target: "es2022", assetsInlineLimit: 0 },
  // uma pasta de trabalho, uma porta. O numero sai de .ambiente, nunca da mao:
  // com duas frentes na mesma porta, uma serve a tela da outra sem avisar.
  cacheDir: `.vite/ambiente-${eu.numero}`,
  server: { host: true, port: porta(5173), strictPort: true },
});
