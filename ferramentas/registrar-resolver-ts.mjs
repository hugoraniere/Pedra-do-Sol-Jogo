/** Bootstrap do gancho `resolver-ts.mjs`. Precisa ser um arquivo separado
 *  porque `module.register()` roda o gancho numa thread a parte - passar
 *  isto em `--import` ativa o gancho ANTES do script principal carregar,
 *  entao os imports estaticos dele ja saem resolvidos. */
import { register } from "node:module";

register("./resolver-ts.mjs", { parentURL: import.meta.url });
