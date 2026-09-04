# Ambientes paralelos

Como mexer no jogo em varias conversas ao mesmo tempo sem uma desfazer a outra.

## A ideia

Uma frente de trabalho, uma pasta. Cada pasta e um **worktree do git**: mesmo
repositorio, mesmo historico, arquivos separados e galho separado. Nada de clonar
o projeto de novo, nada de copiar pasta na mao.

```bash
npm run ambiente listar
npm run ambiente criar pistas "src/dados/pistas.ts, o diario e a mochila"
npm run ambiente fechar pistas
npm run ambiente fechar pistas -- --forcar   # joga fora o que nao foi commitado
```

O `--` antes de `--forcar` e do npm, nao nosso: sem ele o npm engole a opcao.

`criar` faz tudo: abre o worktree em `../reino-de-aurora-ambientes/<nome>`, cria o
galho `ambiente/<nome>` a partir de `principal`, escreve o `.ambiente` com o numero
da pasta, escreve um `AMBIENTE.md` dizendo de quem ela e, e aponta o `node_modules`
para o da pasta principal, porque sao 200 MB e as dependencias sao as mesmas.

A pasta original continua sendo o **ambiente 0**: e onde as frentes se encontram e
de onde sai o jogo que o Lele joga. Trabalho grande nao acontece nela.

## Por que as portas mudam sozinhas

Se duas pastas subirem o vite na 5173, a segunda quebra. Pior: se duas rodarem
`npm run auditar` na 4188, uma audita a tela da outra e passa verde sem motivo.

Entao ninguem escreve porta na mao. Toda porta sai de `ferramentas/ambiente-atual.mjs`,
que le o numero em `.ambiente` e desloca de 10 em 10:

| ambiente | `npm run dev` | `npm run auditar` | `npm run conferir` |
| --- | --- | --- | --- |
| 0, principal | 5173 | 4188 | 4191 |
| 1 | 5183 | 4198 | 4201 |
| 2 | 5193 | 4208 | 4211 |

De brinde, o save do navegador anda junto com a porta: cada ambiente tem os saves
dele e um teste nao apaga o progresso do outro. No aplicativo de desktop a mesma
coisa, em `saves-ambiente-N`.

## As tres regras que fazem isso funcionar

**1. Uma frente, um dono de arquivo.** Duas conversas mexendo no mesmo arquivo e o
unico jeito de este esquema dar errado. Antes de abrir um ambiente, escreva de que
arquivos ele cuida, e coloque isso no `AMBIENTE.md`. Se o trabalho escorregar para
um arquivo de outra frente, pare e fale com o Hugo em vez de mexer.

Os arquivos que todo mundo quer mexer, e por isso os mais perigosos:

- `src/dados/config.ts`, porque toda tela nova quer um numero novo la
- `src/sistemas/estado.ts`, porque toda funcionalidade quer um campo novo no estado
- `src/cenas/Interface.ts`, porque todo botao novo mora nela
- `src/dados/dialogos.ts`, quando duas frentes mexem no mesmo NPC
- `package.json` e `package-lock.json`
- `docs/05-roadmap.md`

Para esses, a regra e **acrescentar no fim, nunca reorganizar**. Duas linhas novas
em pontos diferentes o git junta sozinho. Um arquivo reordenado, nao.

**2. Quem mexe na arte e um so.** `public/assets` esta no git e sai inteiro de
`npm run arte`. Se duas frentes regerarem, o `git status` mostra dezenas de PNG
mudados e ninguem sabe o que e desenho novo e o que e ruido. Entao: uma frente por
vez segura `arte/`, e as outras nao rodam `npm run arte`.

Quando der conflito em PNG mesmo assim, nao tente juntar imagem. A geracao e
deterministica, as sementes de aleatorio sao fixas. Resolva assim:

```bash
git checkout --ours public/assets    # tanto faz qual lado, os dois vao ser jogados fora
npm run arte                         # a arte de verdade nasce do python
git add public/assets arte/manifesto.json
```

E depois `git diff arte/manifesto.json` para ver **quais** sprites realmente
mudaram. E para isso que o manifesto existe.

**3. O conflito se resolve no ambiente, nunca no principal.** Antes de levar o
trabalho para `principal`, traga o `principal` para dentro do ambiente:

```bash
git merge principal      # dentro da pasta do ambiente
# resolve o que der conflito aqui
npm run build && npm run verificar && npm run auditar && npm run conferir
```

So depois de tudo limpo o trabalho vai para `principal`. Assim a pasta que o Lele
joga nunca fica quebrada no meio de uma juncao.

## O ciclo, do comeco ao fim

```bash
# na pasta principal, com tudo commitado
npm run ambiente criar pistas "pistas, diario, mochila"

# em uma conversa nova, aberta na pasta do ambiente
# trabalha, commita, e no fim:
git merge principal
npm run build && npm run verificar && npm run auditar && npm run conferir

# de volta na pasta principal
git merge ambiente/pistas
npm run build && npm run verificar && npm run auditar && npm run conferir
npm run ambiente fechar pistas
npm run ambiente fechar pistas -- --forcar   # joga fora o que nao foi commitado
```

O `--` antes de `--forcar` e do npm, nao nosso: sem ele o npm engole a opcao.

## Coisas que valem lembrar

- **Uma conversa por pasta.** Duas conversas na mesma pasta e o mesmo problema de
  antes, com um passo a mais para perceber.
- **Dependencia nova e coisa do principal.** `node_modules` do ambiente e um atalho
  para o do principal. Se uma frente realmente precisar de um pacote novo, ela
  apaga o atalho, roda `npm install` na pasta dela, e avisa que `package.json` mudou.
- **Marcar item do roadmap e a ultima coisa**, feita no principal na hora de juntar.
  Se cada ambiente marcar o seu, `docs/05-roadmap.md` da conflito toda vez.
- **Trabalho nao commitado nao viaja.** O ambiente novo nasce do ultimo commit de
  `principal`. O `npm run ambiente criar` avisa quando fica coisa para tras.
