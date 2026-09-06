# Mapeamento de bugs e oportunidades de otimizacao

Documento de analise, gerado no ambiente `auditoria` (galho `ambiente/auditoria`).
Nao muda codigo do jogo - so cataloga o que foi encontrado, com arquivo e linha,
para quem for consertar depois escolher por onde comecar.

Comecado em 2026-09-06. Trabalho em andamento - ver "Status" no fim.

## Como ler

Cada achado tem uma severidade:

- **critico** - quebra o jogo, trava build, ou perde dado do jogador
- **medio** - funciona mas erra em algum caso, ou desperdica recurso visivelmente
- **baixo** - sobra, inconsistencia pequena, ou melhoria de manutencao

E uma categoria: **bug**, **otimizacao** ou **harness** (falha na propria
ferramentaria de verificacao).

Achados que so repetem uma "Divergencia deliberada" ja escrita em `CLAUDE.md`
NAO entram aqui - aquilo e decisao tomada, nao bug.

## Achados

(preenchido pelas passadas de analise abaixo)

## Status

- [ ] sistemas do jogo (src/sistemas)
- [ ] cenas do jogo (src/cenas)
- [ ] dados e conteudo (src/dados)
- [ ] harness de testes (ferramentas/*.mjs)
- [ ] geracao de arte e som (arte/*.py, som/*.py)
- [ ] build e performance (vite, bundle, PWA)
